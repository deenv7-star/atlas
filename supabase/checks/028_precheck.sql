-- READ-ONLY pre-check for 028_tenant_integrity.sql. Every row must return violations = 0 before applying.
-- Run: Supabase SQL editor or Management API with "read_only": true.
select 'bookings.property_id cross-org' as check_name, count(*) as violations
  from public.bookings b join public.properties p on p.id = b.property_id where p.org_id <> b.org_id
union all
select 'bookings.unit_id cross-org', count(*)
  from public.bookings b join public.units u on u.id = b.unit_id where u.org_id <> b.org_id
union all
select 'units.property_id cross-org', count(*)
  from public.units u join public.properties p on p.id = u.property_id where p.org_id <> u.org_id
union all
select 'calendar_syncs.property_id cross-org', count(*)
  from public.calendar_syncs s join public.properties p on p.id = s.property_id where p.org_id <> s.org_id
union all
select 'expenses.property_id cross-org', count(*)
  from public.expenses e join public.properties p on p.id = e.property_id where p.org_id <> e.org_id
union all
select 'leads.property_id cross-org', count(*)
  from public.leads l join public.properties p on p.id = l.property_id where p.org_id <> l.org_id
union all
select 'guest_requests.property_id cross-org', count(*)
  from public.guest_requests g join public.properties p on p.id = g.property_id where p.org_id <> g.org_id
union all
select 'bookings check_out <= check_in', count(*)
  from public.bookings where check_in_date is not null and check_out_date is not null and check_out_date <= check_in_date
union all
select 'bookings total_price < 0', count(*)
  from public.bookings where total_price < 0
union all
select 'bookings nights < 1', count(*)
  from public.bookings where nights is not null and nights < 1
union all
select 'invoices duplicate (org_id, invoice_number)', coalesce(sum(n - 1), 0)
  from (select org_id, invoice_number, count(*) n from public.invoices
         where nullif(btrim(invoice_number), '') is not null group by 1, 2 having count(*) > 1) d
union all
select 'bookings duplicate active lead_id', coalesce(sum(n - 1), 0)
  from (select lead_id, count(*) n from public.bookings
         where lead_id is not null and upper(coalesce(status, '')) not in ('CANCELLED', 'CANCELED') group by 1 having count(*) > 1) d
union all
-- new exclusion constraint adds org_id: it is strictly weaker than the old one, so existing rows cannot violate it.
select 'overlap (sanity, must already be 0)', count(*)
  from public.bookings a join public.bookings b on a.id < b.id
   and a.org_id = b.org_id
   and coalesce(a.unit_id, a.property_id) = coalesce(b.unit_id, b.property_id)
   and a.check_in_date is not null and b.check_in_date is not null
   and upper(coalesce(a.status, '')) not in ('CANCELLED', 'CANCELED', 'WAITLIST', 'DECLINED')
   and upper(coalesce(b.status, '')) not in ('CANCELLED', 'CANCELED', 'WAITLIST', 'DECLINED')
   and daterange(a.check_in_date, greatest(coalesce(a.check_out_date, a.check_in_date + greatest(coalesce(a.nights, 1), 1)), a.check_in_date + 1), '[)')
    && daterange(b.check_in_date, greatest(coalesce(b.check_out_date, b.check_in_date + greatest(coalesce(b.nights, 1), 1)), b.check_in_date + 1), '[)')
union all
select 'job_runs rows older than 30 days (will be deleted by retention, info only)', count(*)
  from public.job_runs where started_at < now() - interval '30 days';
