// Run: npm i --no-save @electric-sql/pglite && node supabase/tests/tenant_isolation.test.mjs
// Real Postgres 17 (PGlite). Builds the tables/policies/functions involved in SEC-01 exactly as they are live
// (checked 01.11.2026 via read-only queries), then:
//   1. runs tenant_isolation.sql on the CURRENT schema  -> must FAIL (proves the test catches the hole)
//   2. applies migrations/028_tenant_integrity.sql     -> tenant_isolation.sql must PASS
//   3. applies checks/028_rollback.sql                  -> must FAIL again (rollback restores the old state)
// Exits 1 on any unexpected result.
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import fs from 'node:fs';

const here = (p) => new URL(p, import.meta.url).pathname;
const read = (p) => fs.readFileSync(here(p), 'utf8');

const FIXTURE = `
create extension if not exists "uuid-ossp";
create extension if not exists btree_gist;
create schema if not exists extensions;
create or replace function extensions.uuid_generate_v4() returns uuid language sql as $$ select public.uuid_generate_v4() $$;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- pg_cron stand-in (028 schedules job_runs retention)
create schema cron;
create table cron.job (jobid serial primary key, jobname text unique, schedule text, command text);
create function cron.schedule(n text, s text, c text) returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command) values (n, s, c)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command returning jobid $$;
create function cron.unschedule(n text) returns boolean language sql as $$ delete from cron.job where jobname = n returning true $$;

create table public.organizations (id uuid primary key default uuid_generate_v4(), name text not null default 'My Organization', phone text, settings jsonb not null default '{}');
create table public.profiles (id uuid primary key, email text, full_name text, organization_id uuid references public.organizations(id));
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare o uuid;
begin
  insert into public.organizations (name) values (coalesce(new.raw_user_meta_data->>'organization_name', 'My Organization')) returning id into o;
  insert into public.profiles (id, email, full_name, organization_id) values (new.id, new.email, new.raw_user_meta_data->>'full_name', o);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.current_org_id() returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select organization_id from public.profiles where id = auth.uid() $$;

create table public.properties (id uuid primary key default uuid_generate_v4(), name text not null, org_id uuid not null references public.organizations(id) on delete cascade,
  address text, description text, bedrooms int default 1, max_guests int default 2, base_price numeric, images jsonb default '[]',
  guest_info jsonb not null default '{}', public_slug text, booking_page_enabled boolean not null default false);
create table public.units (id uuid primary key default uuid_generate_v4(), org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade, name text not null);
create table public.leads (id uuid primary key default uuid_generate_v4(), org_id uuid not null references public.organizations(id) on delete cascade,
  full_name text, phone text, status text not null default 'NEW', property_id uuid references public.properties(id) on delete set null,
  check_in_date date, check_out_date date, nights int);
create table public.calendar_syncs (id uuid primary key default uuid_generate_v4(), org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null, provider text, ical_url text, sync_status text not null default 'ACTIVE',
  events_count int not null default 0, conflicts jsonb not null default '[]');
create table public.bookings (id uuid primary key default uuid_generate_v4(), org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null, unit_id uuid references public.units(id) on delete set null,
  guest_name text, guest_email text, guest_phone text, check_in_date date, check_out_date date, nights int, adults int default 2, children int default 0,
  total_price numeric, status text not null default 'PENDING', notes text, property_name text, source text,
  lead_id uuid references public.leads(id) on delete set null, guest_token text, external_uid text,
  external_sync_id uuid references public.calendar_syncs(id) on delete set null, is_block boolean not null default false,
  checkin jsonb, checkin_completed_at timestamptz);
create function public.bookings_fill_guest_token() returns trigger language plpgsql as $$
begin if new.guest_token is null then new.guest_token := md5(random()::text || clock_timestamp()::text); end if; return new; end $$;
create trigger trg_bookings_guest_token before insert on public.bookings for each row execute function public.bookings_fill_guest_token();
create table public.expenses (id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null, category text not null default 'אחר', amount numeric not null default 0);
create table public.guest_requests (id uuid primary key default uuid_generate_v4(), org_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null, property_id uuid references public.properties(id) on delete set null,
  title text, status text not null default 'OPEN');
create table public.invoices (id uuid primary key default uuid_generate_v4(), org_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null, invoice_number text, status text not null default 'DRAFT');
create table public.payments (id uuid primary key default uuid_generate_v4(), booking_id uuid, org_id uuid not null, amount numeric not null,
  status text not null default 'PENDING', due_date date);
create table public.job_runs (id bigserial primary key, job text not null, started_at timestamptz not null default now(), finished_at timestamptz, ok boolean, detail jsonb);

do $$ declare t text; begin
  foreach t in array array['properties','units','leads','calendar_syncs','bookings','expenses','guest_requests','invoices','payments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: own org data" on public.%I for all using (org_id = public.current_org_id())', t, t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
grant usage on schema public to anon, authenticated;
grant execute on function public.current_org_id() to authenticated;
`;

const db = new PGlite({ extensions: { uuid_ossp, btree_gist } });
let unexpected = 0;
const runCase = async (label, expectPass) => {
  const notices = [];
  let err = null;
  try {
    // PGlite: exec() runs the whole script; capture NOTICE lines
    await db.exec(read('./tenant_isolation.sql'), { onNotice: (n) => notices.push(n.message) });
  } catch (e) {
    err = e.message;
    try { await db.exec('rollback'); } catch { /* already rolled back */ }
  }
  const passed = err === null;
  const ok = passed === expectPass;
  if (!ok) unexpected += 1;
  console.log(`\n== ${label}: ${passed ? 'all checks passed' : 'checks failed'} (${ok ? 'as expected' : 'UNEXPECTED'})`);
  for (const n of notices) console.log('   ' + n);
  if (err && expectPass) console.log('   error: ' + err);
};

await db.exec(FIXTURE);
await db.exec(read('../checks/028_rollback.sql')); // = live schema today (old overlap guard, old functions)
await runCase('1. current schema (before 028)', false);
await db.exec(read('../migrations/028_tenant_integrity.sql'));
await runCase('2. after 028_tenant_integrity.sql', true);
const job = (await db.query(`select schedule, command from cron.job where jobname = 'atlas-job-runs-retention'`)).rows[0];
console.log(`\n   job_runs retention scheduled: ${job ? job.schedule : 'NO'}`);
if (!job) unexpected += 1;
await db.exec(read('../checks/028_rollback.sql'));
await runCase('3. after 028_rollback.sql', false);

console.log(unexpected ? `\n${unexpected} unexpected result(s)` : '\nall stages behaved as expected');
process.exit(unexpected ? 1 : 0);
