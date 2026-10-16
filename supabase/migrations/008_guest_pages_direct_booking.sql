-- 008: guest page per booking + direct-booking page per property (feat/killer-features).
-- ADDITIVE ONLY and idempotent. Not applied: needs the owner's approval first.
--
-- Public (anon) access never touches the tables directly. Three SECURITY DEFINER
-- functions return only what a guest may see:
--   get_guest_stay(token)        -> one booking's stay details, by its private guest_token
--   get_public_property(slug)    -> a property's public info + busy date ranges (no guest data)
--   submit_direct_inquiry(...)   -> creates a lead for the property's org

-- ── Columns ────────────────────────────────────────────────────────────────
alter table public.bookings   add column if not exists guest_token text;
create unique index if not exists bookings_guest_token_key on public.bookings (guest_token) where guest_token is not null;

alter table public.properties add column if not exists guest_info jsonb not null default '{}'::jsonb;
alter table public.properties add column if not exists public_slug text;
alter table public.properties add column if not exists booking_page_enabled boolean not null default false;
create unique index if not exists properties_public_slug_key on public.properties (public_slug) where public_slug is not null;

-- ── Guest page ─────────────────────────────────────────────────────────────
create or replace function public.get_guest_stay(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  p public.properties%rowtype;
  o public.organizations%rowtype;
  v_paid numeric := 0;
  v_due date;
  v_checkout date;
begin
  if p_token is null or length(p_token) < 16 then
    return null;
  end if;

  select * into b from public.bookings
   where guest_token = p_token
     and coalesce(upper(status), '') not in ('CANCELLED', 'CANCELED')
   limit 1;
  if not found then
    return null;
  end if;

  select * into p from public.properties where id = b.property_id;
  select * into o from public.organizations where id = b.org_id;

  select coalesce(sum(amount), 0) into v_paid
    from public.payments
   where booking_id = b.id and upper(coalesce(status, '')) in ('PAID', 'COMPLETED', 'SUCCEEDED');

  select min(due_date) into v_due
    from public.payments
   where booking_id = b.id and upper(coalesce(status, '')) not in ('PAID', 'COMPLETED', 'SUCCEEDED', 'REFUNDED') and due_date is not null;

  v_checkout := coalesce(b.check_out_date, b.check_in_date + greatest(coalesce(b.nights, 1), 1));

  return jsonb_build_object(
    'booking', jsonb_build_object(
      'guest_name', b.guest_name,
      'check_in_date', b.check_in_date,
      'check_out_date', v_checkout,
      'nights', coalesce(b.nights, v_checkout - b.check_in_date),
      'adults', b.adults,
      'children', b.children,
      'status', b.status
    ),
    'property', jsonb_build_object(
      'name', coalesce(p.name, b.property_name),
      'address', p.address,
      'images', coalesce(p.images, '[]'::jsonb),
      'guest_info', coalesce(p.guest_info, '{}'::jsonb)
    ),
    'host', jsonb_build_object(
      'name', coalesce(nullif(p.guest_info->>'host_name', ''), o.name),
      'phone', coalesce(nullif(p.guest_info->>'host_phone', ''), o.phone)
    ),
    'money', jsonb_build_object(
      'total', coalesce(b.total_price, 0),
      'paid', v_paid,
      'balance', greatest(coalesce(b.total_price, 0) - v_paid, 0),
      'dueDate', coalesce(v_due, b.check_in_date)
    )
  );
end;
$$;

-- ── Direct-booking page ────────────────────────────────────────────────────
create or replace function public.get_public_property(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p public.properties%rowtype;
  o public.organizations%rowtype;
  v_busy jsonb;
begin
  select * into p from public.properties
   where public_slug = p_slug and booking_page_enabled = true
   limit 1;
  if not found then
    return null;
  end if;
  select * into o from public.organizations where id = p.org_id;

  select coalesce(jsonb_agg(jsonb_build_object('from', r.ci, 'to', r.co) order by r.ci), '[]'::jsonb)
    into v_busy
    from (
      select check_in_date as ci,
             coalesce(check_out_date, check_in_date + greatest(coalesce(nights, 1), 1)) as co
        from public.bookings
       where property_id = p.id
         and check_in_date is not null
         and coalesce(upper(status), '') not in ('CANCELLED', 'CANCELED', 'WAITLIST')
         and coalesce(check_out_date, check_in_date + 1) > current_date
         and check_in_date < current_date + 366
    ) r;

  return jsonb_build_object(
    'property', jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'address', p.address,
      'description', p.description,
      'max_guests', p.max_guests,
      'bedrooms', p.bedrooms,
      'base_price', p.base_price,
      'images', coalesce(p.images, '[]'::jsonb),
      'check_in_time', coalesce(nullif(p.guest_info->>'check_in_time', ''), '15:00'),
      'check_out_time', coalesce(nullif(p.guest_info->>'check_out_time', ''), '11:00')
    ),
    'host', jsonb_build_object('name', coalesce(nullif(p.guest_info->>'host_name', ''), o.name)),
    'busy', v_busy
  );
end;
$$;

create or replace function public.submit_direct_inquiry(
  p_slug text,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_check_in date default null,
  p_check_out date default null,
  p_adults integer default 2,
  p_children integer default 0,
  p_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  p public.properties%rowtype;
  v_id uuid;
  v_recent integer;
begin
  select * into p from public.properties
   where public_slug = p_slug and booking_page_enabled = true
   limit 1;
  if not found then
    raise exception 'property_not_found' using errcode = 'P0002';
  end if;

  if coalesce(length(trim(p_full_name)), 0) = 0 or coalesce(length(trim(p_phone)), 0) < 9 then
    raise exception 'missing_fields' using errcode = '22023';
  end if;
  if p_check_in is not null and p_check_in < current_date then
    raise exception 'invalid_dates' using errcode = '22023';
  end if;
  if p_check_in is not null and p_check_out is not null and p_check_out <= p_check_in then
    raise exception 'invalid_dates' using errcode = '22023';
  end if;

  -- Simple flood guard: at most 30 web inquiries per property per hour.
  select count(*) into v_recent from public.leads
   where property_id = p.id and source = 'website' and created_at > now() - interval '1 hour';
  if v_recent >= 30 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  insert into public.leads (
    org_id, property_id, full_name, phone, email, check_in_date, check_out_date,
    nights, adults, children, notes, source, status
  ) values (
    p.org_id, p.id, left(trim(p_full_name), 120), left(trim(p_phone), 30), nullif(left(trim(coalesce(p_email, '')), 160), ''),
    p_check_in, p_check_out,
    case when p_check_in is not null and p_check_out is not null then p_check_out - p_check_in end,
    least(greatest(coalesce(p_adults, 2), 1), 30), least(greatest(coalesce(p_children, 0), 0), 30),
    left(concat_ws(E'\n', 'פנייה מדף ההזמנה הישירה (' || p.name || ')', nullif(trim(coalesce(p_notes, '')), '')), 1200),
    'website', 'NEW'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.get_guest_stay(text) from public;
revoke all on function public.get_public_property(text) from public;
revoke all on function public.submit_direct_inquiry(text, text, text, text, date, date, integer, integer, text) from public;
grant execute on function public.get_guest_stay(text) to anon, authenticated;
grant execute on function public.get_public_property(text) to anon, authenticated;
grant execute on function public.submit_direct_inquiry(text, text, text, text, date, date, integer, integer, text) to anon, authenticated;

notify pgrst, 'reload schema';
