-- 028_tenant_integrity.sql  (fix/360-data, audit 360: SEC-01, DB-01, APP-001/003, DB-04, ENG-04, DB-02)
-- STATUS: PREPARED, NOT APPLIED. Needs Deen's approval. Run supabase/checks/028_precheck.sql first (all zeros on
-- 01.11.2026 22:40 IST), take a backup, then apply in one transaction. Rollback: supabase/checks/028_rollback.sql.
--
-- Constraints are added NOT VALID (no long lock, new rows checked at once) and then VALIDATEd in the same
-- migration. If a VALIDATE fails, the transaction rolls back and nothing changes.

begin;

-- ---------------------------------------------------------------------------------------------------------
-- SEC-01: a row's property_id / unit_id must belong to the row's own org. RLS only checks the row's org_id,
-- so without this a signed-up user could point a booking/sync at another host's unit.
-- Composite FKs need a unique key on (id, org_id) in the parent tables.
-- ---------------------------------------------------------------------------------------------------------
alter table public.properties add constraint properties_id_org_id_key unique (id, org_id);
alter table public.units      add constraint units_id_org_id_key      unique (id, org_id);

-- ON DELETE SET NULL (col) (PostgreSQL 15+) nulls only the reference, never org_id (which is NOT NULL).
alter table public.bookings add constraint bookings_property_same_org
  foreign key (property_id, org_id) references public.properties (id, org_id) on delete set null (property_id) not valid;
alter table public.bookings add constraint bookings_unit_same_org
  foreign key (unit_id, org_id) references public.units (id, org_id) on delete set null (unit_id) not valid;
alter table public.units add constraint units_property_same_org
  foreign key (property_id, org_id) references public.properties (id, org_id) on delete cascade not valid;
alter table public.calendar_syncs add constraint calendar_syncs_property_same_org
  foreign key (property_id, org_id) references public.properties (id, org_id) on delete set null (property_id) not valid;
alter table public.expenses add constraint expenses_property_same_org
  foreign key (property_id, org_id) references public.properties (id, org_id) on delete set null (property_id) not valid;
alter table public.leads add constraint leads_property_same_org
  foreign key (property_id, org_id) references public.properties (id, org_id) on delete set null (property_id) not valid;
alter table public.guest_requests add constraint guest_requests_property_same_org
  foreign key (property_id, org_id) references public.properties (id, org_id) on delete set null (property_id) not valid;

alter table public.bookings       validate constraint bookings_property_same_org;
alter table public.bookings       validate constraint bookings_unit_same_org;
alter table public.units          validate constraint units_property_same_org;
alter table public.calendar_syncs validate constraint calendar_syncs_property_same_org;
alter table public.expenses       validate constraint expenses_property_same_org;
alter table public.leads          validate constraint leads_property_same_org;
alter table public.guest_requests validate constraint guest_requests_property_same_org;

-- ---------------------------------------------------------------------------------------------------------
-- DB-01: the overlap guard is per org. Same expression and WHERE as 014, plus org_id. Strictly weaker than
-- the old constraint, so existing rows cannot violate it (precheck "overlap" = 0 confirms).
-- ---------------------------------------------------------------------------------------------------------
alter table public.bookings drop constraint bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    org_id with =,
    (coalesce(unit_id, property_id)) with =,
    daterange(check_in_date,
              greatest(coalesce(check_out_date, check_in_date + greatest(coalesce(nights, 1), 1)), check_in_date + 1),
              '[)') with &&
  )
  where (coalesce(unit_id, property_id) is not null
         and check_in_date is not null
         and upper(coalesce(status, '')) <> all (array['CANCELLED', 'CANCELED', 'WAITLIST', 'DECLINED']));

-- ---------------------------------------------------------------------------------------------------------
-- APP-001 / APP-002 / APP-003: the database refuses what the form now refuses.
-- ---------------------------------------------------------------------------------------------------------
alter table public.bookings add constraint bookings_checkout_after_checkin
  check (check_in_date is null or check_out_date is null or check_out_date > check_in_date) not valid;
alter table public.bookings add constraint bookings_price_not_negative
  check (total_price is null or total_price >= 0) not valid;
alter table public.bookings add constraint bookings_nights_positive
  check (nights is null or nights >= 1) not valid;
alter table public.bookings validate constraint bookings_checkout_after_checkin;
alter table public.bookings validate constraint bookings_price_not_negative;
alter table public.bookings validate constraint bookings_nights_positive;

-- ---------------------------------------------------------------------------------------------------------
-- DB-04: a document number is used once per org (blank numbers are not counted).
-- (Server-side numbering / no-delete for tax documents is a separate decision, see COPY-044.)
-- ---------------------------------------------------------------------------------------------------------
create unique index invoices_org_number_key
  on public.invoices (org_id, invoice_number)
  where nullif(btrim(invoice_number), '') is not null;

-- ---------------------------------------------------------------------------------------------------------
-- ENG-04: one active booking per lead (a double tap on "הפיכה להזמנה" can't create two).
-- ---------------------------------------------------------------------------------------------------------
create unique index bookings_one_active_per_lead
  on public.bookings (lead_id)
  where lead_id is not null and upper(coalesce(status, '')) not in ('CANCELLED', 'CANCELED');

-- ---------------------------------------------------------------------------------------------------------
-- SEC-01 (functions): SECURITY DEFINER functions bypass RLS, so they must match org themselves.
-- get_guest_stay: the property is read only if it belongs to the booking's org.
-- ---------------------------------------------------------------------------------------------------------
create or replace function public.get_guest_stay(p_token text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
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

  select * into p from public.properties where id = b.property_id and org_id = b.org_id;
  select * into o from public.organizations where id = b.org_id;

  select coalesce(sum(amount), 0) into v_paid
    from public.payments
   where booking_id = b.id and org_id = b.org_id and upper(coalesce(status, '')) in ('PAID', 'COMPLETED', 'SUCCEEDED');

  select min(due_date) into v_due
    from public.payments
   where booking_id = b.id and org_id = b.org_id and upper(coalesce(status, '')) not in ('PAID', 'COMPLETED', 'SUCCEEDED', 'REFUNDED') and due_date is not null;

  v_checkout := coalesce(b.check_out_date, b.check_in_date + greatest(coalesce(b.nights, 1), 1));

  return jsonb_build_object(
    'booking', jsonb_build_object(
      'guest_name', case when b.is_block then null else b.guest_name end,
      'check_in_date', b.check_in_date,
      'check_out_date', v_checkout,
      'nights', coalesce(b.nights, v_checkout - b.check_in_date),
      'adults', b.adults,
      'children', b.children,
      'status', b.status,
      'source', b.source
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
    ),
    'checkin', jsonb_build_object(
      'completed', b.checkin_completed_at is not null,
      'completed_at', b.checkin_completed_at,
      'arrival_time', b.checkin->>'arrival_time',
      'id_name', b.checkin->>'id_name',
      'has_phone', coalesce(length(b.guest_phone), 0) >= 9
    )
  );
end;
$function$;

-- get_public_property: busy dates only from the unit's own org; stop returning the internal property id
-- (the page is addressed by slug; the id was the starting point of the SEC-01 attack); "today" in Israel (DB-03).
create or replace function public.get_public_property(p_slug text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
declare
  p public.properties%rowtype;
  o public.organizations%rowtype;
  v_busy jsonb;
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
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
         and org_id = p.org_id
         and check_in_date is not null
         and coalesce(upper(status), '') not in ('CANCELLED', 'CANCELED', 'WAITLIST')
         and coalesce(check_out_date, check_in_date + 1) > v_today
         and check_in_date < v_today + 366
    ) r;

  return jsonb_build_object(
    'property', jsonb_build_object(
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
$function$;

-- ---------------------------------------------------------------------------------------------------------
-- DB-02: job_runs keeps 30 days (~190 rows/day today). Daily at 03:17 UTC.
-- ---------------------------------------------------------------------------------------------------------
create index if not exists job_runs_started_at_idx on public.job_runs (started_at);
select cron.schedule(
  'atlas-job-runs-retention',
  '17 3 * * *',
  $$ delete from public.job_runs where started_at < now() - interval '30 days' $$
);

commit;
