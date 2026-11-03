-- Tenant isolation test (audit 360 SEC-01 / DB-01, migration 028). Leaves NO data behind: everything runs in
-- one transaction that ends in ROLLBACK.
--
-- Run against STAGING (or a branch DB), never production, as the postgres role:
--   psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/tenant_isolation.sql
-- Also runs locally on PGlite: node supabase/tests/tenant_isolation.test.mjs
--
-- Output: one NOTICE per check ("PASS …" / "FAIL …"). Ends with an ERROR if any check failed, so CI/psql
-- exits non-zero. Expected: all FAIL before 028, all PASS after 028.

begin;

select set_config('atlas.fail', '0', true);
select set_config('atlas.ua', 'a0000000-0000-4000-8000-0000000000a1', true);
select set_config('atlas.ub', 'b0000000-0000-4000-8000-0000000000b1', true);

-- two hosts sign up (handle_new_user creates an org + profile for each)
insert into auth.users (id, email, raw_user_meta_data)
values (current_setting('atlas.ua')::uuid, 'tenant-a@test.atlas-il.com', '{"full_name":"Host A","organization_name":"Org A"}'),
       (current_setting('atlas.ub')::uuid, 'tenant-b@test.atlas-il.com', '{"full_name":"Host B","organization_name":"Org B"}');

select set_config('atlas.oa', (select organization_id::text from public.profiles where id = current_setting('atlas.ua')::uuid), true);
select set_config('atlas.ob', (select organization_id::text from public.profiles where id = current_setting('atlas.ub')::uuid), true);

-- host A's unit + a real booking with a secret in guest_info
insert into public.properties (id, org_id, name, address, guest_info, public_slug, booking_page_enabled)
values ('a0000000-0000-4000-8000-00000000aa01', current_setting('atlas.oa')::uuid, 'צימר A', 'רחוב הסוד 1',
        '{"wifi_password":"SECRET-A"}', 'tenant-test-a', true);
insert into public.units (id, org_id, property_id, name)
values ('a0000000-0000-4000-8000-00000000aa02', current_setting('atlas.oa')::uuid, 'a0000000-0000-4000-8000-00000000aa01', 'יחידה A');
insert into public.bookings (org_id, property_id, guest_name, check_in_date, check_out_date, nights, status)
values (current_setting('atlas.oa')::uuid, 'a0000000-0000-4000-8000-00000000aa01', 'אורח של A', date '2030-05-10', date '2030-05-12', 2, 'CONFIRMED');
-- a legacy cross-org row (as if written before 028): FK triggers are skipped only for this insert, so we can
-- prove get_guest_stay / get_public_property filter by org on their own (defence in depth). SKIP if not allowed.
do $$ begin
  begin
    set local session_replication_role = replica;
    insert into public.bookings (org_id, property_id, guest_name, check_in_date, check_out_date, nights, status, guest_token)
    values ((select organization_id from public.profiles where id = current_setting('atlas.ub')::uuid),
            'a0000000-0000-4000-8000-00000000aa01', 'legacy cross-org', date '2030-10-01', date '2030-10-03', 2, 'CONFIRMED',
            'legacy-cross-org-token-0001');
    set local session_replication_role = origin;
    perform set_config('atlas.legacy', '1', true);
  exception when insufficient_privilege then
    perform set_config('atlas.legacy', '0', true);
    raise notice 'SKIP  legacy cross-org row (session_replication_role not allowed for this role)';
  end;
end $$;

-- host B's own unit
insert into public.properties (id, org_id, name)
values ('b0000000-0000-4000-8000-00000000bb01', current_setting('atlas.ob')::uuid, 'צימר B');

create or replace function pg_temp.check(name text, ok boolean, detail text default '') returns void language plpgsql as $$
begin
  if ok then raise notice 'PASS  %', name;
  else
    raise notice 'FAIL  %  %', name, detail;
    perform set_config('atlas.fail', (current_setting('atlas.fail')::int + 1)::text, true);
  end if;
end $$;

-- ---- act as host B (authenticated, RLS on) ----
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('atlas.ub'), true);
select set_config('request.jwt.claims', json_build_object('sub', current_setting('atlas.ub'), 'role', 'authenticated')::text, true);


do $$
declare
  a_prop uuid := 'a0000000-0000-4000-8000-00000000aa01';
  a_unit uuid := 'a0000000-0000-4000-8000-00000000aa02';
  b_prop uuid := 'b0000000-0000-4000-8000-00000000bb01';
  ob uuid := current_setting('atlas.ob')::uuid;
  tok text;
  stay jsonb;
  pub jsonb;
begin
  perform pg_temp.check('RLS sanity: B sees none of A''s bookings', (select count(*) from public.bookings where org_id <> ob) = 0);

  -- SEC-01: every table that points at a unit refuses a unit of another org
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in_date, check_out_date, nights)
    values (ob, a_prop, 'attacker', date '2030-06-01', date '2030-06-03', 2) returning guest_token into tok;
    perform pg_temp.check('SEC-01 bookings.property_id of another org is refused', false, 'insert accepted');
    -- what the attacker would get through the guest link
    stay := public.get_guest_stay(tok);
    perform pg_temp.check('SEC-01 get_guest_stay does not leak another org''s address / wifi',
      coalesce(stay->'property'->>'address', '') = '' and coalesce(stay->'property'->'guest_info'->>'wifi_password', '') = '',
      coalesce(stay->'property'->>'address', '') || ' ' || coalesce(stay->'property'->'guest_info'->>'wifi_password', ''));
  exception when foreign_key_violation then
    perform pg_temp.check('SEC-01 bookings.property_id of another org is refused', true);
  end;

  begin
    insert into public.bookings (org_id, unit_id, guest_name, check_in_date, check_out_date, nights)
    values (ob, a_unit, 'attacker', date '2030-06-05', date '2030-06-07', 2);
    perform pg_temp.check('SEC-01 bookings.unit_id of another org is refused', false, 'insert accepted');
  exception when foreign_key_violation then
    perform pg_temp.check('SEC-01 bookings.unit_id of another org is refused', true);
  end;

  begin
    insert into public.calendar_syncs (org_id, property_id, provider, ical_url) values (ob, a_prop, 'ICAL', 'https://example.com/x.ics');
    perform pg_temp.check('SEC-01 calendar_syncs.property_id of another org is refused', false, 'insert accepted');
  exception when foreign_key_violation then
    perform pg_temp.check('SEC-01 calendar_syncs.property_id of another org is refused', true);
  end;

  begin
    insert into public.expenses (org_id, property_id, amount) values (ob, a_prop, 10);
    perform pg_temp.check('SEC-01 expenses.property_id of another org is refused', false, 'insert accepted');
  exception when foreign_key_violation then
    perform pg_temp.check('SEC-01 expenses.property_id of another org is refused', true);
  end;

  begin
    insert into public.leads (org_id, property_id, full_name) values (ob, a_prop, 'x');
    perform pg_temp.check('SEC-01 leads.property_id of another org is refused', false, 'insert accepted');
  exception when foreign_key_violation then
    perform pg_temp.check('SEC-01 leads.property_id of another org is refused', true);
  end;

  begin
    insert into public.guest_requests (org_id, property_id, title) values (ob, a_prop, 'x');
    perform pg_temp.check('SEC-01 guest_requests.property_id of another org is refused', false, 'insert accepted');
  exception when foreign_key_violation then
    perform pg_temp.check('SEC-01 guest_requests.property_id of another org is refused', true);
  end;

  begin
    insert into public.units (org_id, property_id, name) values (ob, a_prop, 'x');
    perform pg_temp.check('SEC-01 units.property_id of another org is refused', false, 'insert accepted');
  exception when foreign_key_violation then
    perform pg_temp.check('SEC-01 units.property_id of another org is refused', true);
  end;

  -- own unit still works (no false positives)
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in_date, check_out_date, nights)
    values (ob, b_prop, 'אורח של B', date '2030-05-10', date '2030-05-12', 2);
    perform pg_temp.check('own unit: booking on B''s own unit is accepted', true);
  exception when others then
    perform pg_temp.check('own unit: booking on B''s own unit is accepted', false, sqlerrm);
  end;

  -- APP-001 / APP-003 in the DB
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in_date, check_out_date, nights)
    values (ob, b_prop, 'x', date '2030-07-10', date '2030-07-08', 1);
    perform pg_temp.check('APP-001 DB refuses check-out before check-in', false, 'insert accepted');
  exception when check_violation then
    perform pg_temp.check('APP-001 DB refuses check-out before check-in', true);
  end;

  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in_date, check_out_date, nights, total_price)
    values (ob, b_prop, 'x', date '2030-08-10', date '2030-08-12', 2, -500);
    perform pg_temp.check('APP-003 DB refuses a negative price', false, 'insert accepted');
  exception when check_violation then
    perform pg_temp.check('APP-003 DB refuses a negative price', true);
  end;

  -- overlap guard still works inside one org
  begin
    insert into public.bookings (org_id, property_id, guest_name, check_in_date, check_out_date, nights)
    values (ob, b_prop, 'double', date '2030-05-11', date '2030-05-13', 2);
    perform pg_temp.check('overlap inside one org is still refused', false, 'insert accepted');
  exception when exclusion_violation then
    perform pg_temp.check('overlap inside one org is still refused', true);
  end;

  -- DB-04: one document number per org
  begin
    insert into public.invoices (org_id, invoice_number) values (ob, 'T-1');
    insert into public.invoices (org_id, invoice_number) values (ob, 'T-1');
    perform pg_temp.check('DB-04 duplicate invoice number in one org is refused', false, 'insert accepted');
  exception when unique_violation then
    perform pg_temp.check('DB-04 duplicate invoice number in one org is refused', true);
  end;

  -- ENG-04: one active booking per lead
  begin
    insert into public.leads (id, org_id, full_name) values ('b0000000-0000-4000-8000-00000000bb09', ob, 'ליד');
    insert into public.bookings (org_id, property_id, lead_id, guest_name, check_in_date, check_out_date, nights)
    values (ob, b_prop, 'b0000000-0000-4000-8000-00000000bb09', 'ליד', date '2030-09-01', date '2030-09-03', 2);
    insert into public.bookings (org_id, property_id, lead_id, guest_name)
    values (ob, b_prop, 'b0000000-0000-4000-8000-00000000bb09', 'ליד');
    perform pg_temp.check('ENG-04 a second active booking for the same lead is refused', false, 'insert accepted');
  exception when unique_violation then
    perform pg_temp.check('ENG-04 a second active booking for the same lead is refused', true);
  end;

  if current_setting('atlas.legacy', true) = '1' then
    stay := public.get_guest_stay('legacy-cross-org-token-0001');
    perform pg_temp.check('SEC-01 get_guest_stay on a legacy cross-org booking hides the other org''s address / wifi',
      coalesce(stay->'property'->>'address', '') = '' and coalesce(stay->'property'->'guest_info'->>'wifi_password', '') = '',
      coalesce(stay->'property'->>'address', '') || ' ' || coalesce(stay->'property'->'guest_info'->>'wifi_password', ''));
  end if;

  -- public page: no internal id
  pub := public.get_public_property('tenant-test-a');
  perform pg_temp.check('get_public_property does not return the internal property id', pub is not null and not (pub->'property' ? 'id'),
    coalesce(pub->'property'->>'id', 'null result'));
end $$;

reset role;

do $$ begin
  if current_setting('atlas.fail')::int > 0 then
    raise exception 'tenant isolation: % check(s) failed', current_setting('atlas.fail');
  end if;
  raise notice 'tenant isolation: all checks passed';
end $$;

rollback;
