-- ROLLBACK for 028_tenant_integrity.sql. Restores the schema exactly as it was on 01.11.2026 (live DB).
-- Function bodies below are pg_get_functiondef() output captured read-only before the change.
begin;

select cron.unschedule('atlas-job-runs-retention') where exists (select 1 from cron.job where jobname = 'atlas-job-runs-retention');
drop index if exists public.job_runs_started_at_idx;

drop index if exists public.bookings_one_active_per_lead;
drop index if exists public.invoices_org_number_key;

alter table public.bookings drop constraint if exists bookings_checkout_after_checkin;
alter table public.bookings drop constraint if exists bookings_price_not_negative;
alter table public.bookings drop constraint if exists bookings_nights_positive;

alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    (coalesce(unit_id, property_id)) with =,
    daterange(check_in_date,
              greatest(coalesce(check_out_date, check_in_date + greatest(coalesce(nights, 1), 1)), check_in_date + 1),
              '[)') with &&
  )
  where (coalesce(unit_id, property_id) is not null
         and check_in_date is not null
         and upper(coalesce(status, '')) <> all (array['CANCELLED', 'CANCELED', 'WAITLIST', 'DECLINED']));

alter table public.bookings       drop constraint if exists bookings_property_same_org;
alter table public.bookings       drop constraint if exists bookings_unit_same_org;
alter table public.units          drop constraint if exists units_property_same_org;
alter table public.calendar_syncs drop constraint if exists calendar_syncs_property_same_org;
alter table public.expenses       drop constraint if exists expenses_property_same_org;
alter table public.leads          drop constraint if exists leads_property_same_org;
alter table public.guest_requests drop constraint if exists guest_requests_property_same_org;
alter table public.units          drop constraint if exists units_id_org_id_key;
alter table public.properties     drop constraint if exists properties_id_org_id_key;

CREATE OR REPLACE FUNCTION public.get_guest_stay(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.get_public_property(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

commit;
