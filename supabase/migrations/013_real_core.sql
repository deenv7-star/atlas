-- 013: "make it real" core (feat/real-core).
-- ADDITIVE and idempotent: new columns, tables, functions, one exclusion constraint. Nothing is dropped.
-- Requires 008 (bookings.guest_token, properties.guest_info, get_guest_stay).
--
--   1. iCal two-way sync: calendar_syncs status columns, bookings.external_uid/external_sync_id,
--      properties.ical_export_token (secret feed URL per unit).
--   2. DB-level double-booking guard: exclusion constraint per unit on [check_in, check_out).
--   3. Israeli calendar cache (Hebcal): il_calendar (holidays, candle lighting, havdalah).
--   4. Message queue (automation runner output, wa.me today, Meta Cloud API later).
--   5. Online guest check-in: bookings.checkin + submit_guest_checkin(token, ...) RPC.
--   6. Pricing rules per unit: properties.pricing (base / weekend / holiday uplift / gap night).
--   7. job_runs: what the scheduled edge functions did (ops evidence, service role only).

create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions;

-- ── 1. iCal ────────────────────────────────────────────────────────────────
alter table public.calendar_syncs add column if not exists label text;
alter table public.calendar_syncs add column if not exists last_attempt_at timestamptz;
alter table public.calendar_syncs add column if not exists last_success_at timestamptz;
alter table public.calendar_syncs add column if not exists events_count integer not null default 0;
alter table public.calendar_syncs add column if not exists conflicts jsonb not null default '[]'::jsonb;

alter table public.bookings add column if not exists external_uid text;
alter table public.bookings add column if not exists external_sync_id uuid references public.calendar_syncs(id) on delete set null;
alter table public.bookings add column if not exists is_block boolean not null default false;
create unique index if not exists bookings_external_key
  on public.bookings (external_sync_id, external_uid)
  where external_uid is not null and external_sync_id is not null;
create index if not exists bookings_property_dates_idx on public.bookings (property_id, check_in_date);

alter table public.properties add column if not exists ical_export_token text;
update public.properties set ical_export_token = encode(extensions.gen_random_bytes(18), 'hex') where ical_export_token is null;
alter table public.properties alter column ical_export_token set default encode(extensions.gen_random_bytes(18), 'hex');
create unique index if not exists properties_ical_export_token_key on public.properties (ical_export_token) where ical_export_token is not null;

-- Every booking gets a private guest_token on insert (guest page + check-in link work for OTA bookings too).
create or replace function public.bookings_fill_guest_token()
returns trigger language plpgsql set search_path = public, extensions as $$
begin
  if new.guest_token is null or length(new.guest_token) < 16 then
    new.guest_token := encode(extensions.gen_random_bytes(16), 'hex');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_bookings_guest_token on public.bookings;
create trigger trg_bookings_guest_token before insert on public.bookings
  for each row execute function public.bookings_fill_guest_token();
update public.bookings set guest_token = encode(extensions.gen_random_bytes(16), 'hex') where guest_token is null;

-- ── 2. Double-booking guard ────────────────────────────────────────────────
-- A unit is the booking's unit_id when set, otherwise its property (ATLAS uses one property row per rentable unit).
-- Cancelled / waitlist / declined bookings never block. Check-out day is free for the next check-in ([) range).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_no_overlap') then
    alter table public.bookings add constraint bookings_no_overlap exclude using gist (
      (coalesce(unit_id, property_id)) with =,
      daterange(
        check_in_date,
        greatest(coalesce(check_out_date, check_in_date + greatest(coalesce(nights, 1), 1)), check_in_date + 1),
        '[)'
      ) with &&
    ) where (
      coalesce(unit_id, property_id) is not null
      and check_in_date is not null
      and upper(coalesce(status, '')) not in ('CANCELLED', 'CANCELED', 'WAITLIST', 'DECLINED')
    );
  end if;
end $$;

-- ── 3. Israeli calendar (filled by the automation-runner edge function from Hebcal) ─────────────
create table if not exists public.il_calendar (
  id bigserial primary key,
  day date not null,
  kind text not null,              -- holiday | candles | havdalah
  title_he text,
  title_en text,
  subcat text,                     -- major | minor | modern | fast | shabbat ...
  yomtov boolean not null default false,
  price_relevant boolean not null default false,
  at timestamptz,                  -- candle lighting / havdalah moment (Jerusalem)
  source text not null default 'hebcal',
  fetched_at timestamptz not null default now(),
  unique (day, kind, title_en)
);
create index if not exists il_calendar_day_idx on public.il_calendar (day);
alter table public.il_calendar enable row level security;
drop policy if exists "il_calendar: read" on public.il_calendar;
create policy "il_calendar: read" on public.il_calendar for select to anon, authenticated using (true);
grant select on public.il_calendar to anon, authenticated;

-- ── 4. Message queue ───────────────────────────────────────────────────────
create table if not exists public.message_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  rule_id uuid references public.automation_rules(id) on delete set null,
  template_key text not null,      -- confirmation | arrival_eve | welcome | thanks_review | balance_reminder | checkin_link
  channel text not null default 'whatsapp',
  recipient text,
  due_at timestamptz not null,
  original_due_at timestamptz,
  deferred_reason text,            -- shabbat | holiday
  status text not null default 'pending',  -- pending | sent | skipped | failed
  sent_at timestamptz,
  sent_via text,                   -- wa_link (owner tapped) | meta_cloud (API, later)
  provider_message_id text,
  error text,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, dedupe_key)
);
create index if not exists message_queue_org_status_idx on public.message_queue (org_id, status, due_at);
alter table public.message_queue enable row level security;
drop policy if exists "message_queue: own org data" on public.message_queue;
create policy "message_queue: own org data" on public.message_queue for all
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
grant select, insert, update, delete on public.message_queue to authenticated;

-- ── 5. Online check-in ─────────────────────────────────────────────────────
alter table public.bookings add column if not exists checkin jsonb;
alter table public.bookings add column if not exists checkin_completed_at timestamptz;

create or replace function public.submit_guest_checkin(
  p_token text,
  p_phone text,
  p_id_name text,
  p_arrival_time text default null,
  p_guests integer default null,
  p_rules_accepted boolean default false,
  p_marketing_consent boolean default false,
  p_notes text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
begin
  if p_token is null or length(p_token) < 16 then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  select * into b from public.bookings
   where guest_token = p_token and coalesce(upper(status), '') not in ('CANCELLED', 'CANCELED')
   limit 1;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 9 or coalesce(length(trim(p_id_name)), 0) < 2 then
    raise exception 'missing_fields' using errcode = '22023';
  end if;
  if not coalesce(p_rules_accepted, false) then
    raise exception 'rules_not_accepted' using errcode = '22023';
  end if;
  if p_arrival_time is not null and p_arrival_time !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'invalid_time' using errcode = '22023';
  end if;
  -- flood guard: one booking can be re-submitted, but not hammered
  if b.checkin_completed_at is not null and b.checkin_completed_at > now() - interval '20 seconds' then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  update public.bookings set
    guest_phone = left(v_phone, 30),
    checkin = jsonb_build_object(
      'phone', left(v_phone, 30),
      'id_name', left(trim(p_id_name), 120),
      'arrival_time', p_arrival_time,
      'guests', case when p_guests is null then null else least(greatest(p_guests, 1), 40) end,
      'rules_accepted_at', now(),
      'marketing_consent', coalesce(p_marketing_consent, false),
      'marketing_consent_at', case when coalesce(p_marketing_consent, false) then now() end,
      'notes', nullif(left(trim(coalesce(p_notes, '')), 500), '')
    ),
    checkin_completed_at = now()
  where id = b.id;

  return jsonb_build_object('ok', true, 'completed_at', now());
end;
$$;
revoke all on function public.submit_guest_checkin(text, text, text, text, integer, boolean, boolean, text) from public;
grant execute on function public.submit_guest_checkin(text, text, text, text, integer, boolean, boolean, text) to anon, authenticated;

-- get_guest_stay (from 008) + the check-in state, so the guest page can show the form or "done".
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
$$;
revoke all on function public.get_guest_stay(text) from public;
grant execute on function public.get_guest_stay(text) to anon, authenticated;

-- ── 6. Pricing rules ───────────────────────────────────────────────────────
-- { base, weekend, holiday_uplift_pct, erev_uplift_pct, gap_night_discount_pct, min, max } (all optional, ₪ / %)
alter table public.properties add column if not exists pricing jsonb not null default '{}'::jsonb;

-- ── 7. Job runs (service role only; no policies = no client access) ────────
create table if not exists public.job_runs (
  id bigserial primary key,
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  detail jsonb
);
alter table public.job_runs enable row level security;
create index if not exists job_runs_job_idx on public.job_runs (job, started_at desc);

-- Schema marker the app can read (runtime feature detection).
create or replace function public.atlas_schema_level()
returns integer language sql stable as $$ select 13 $$;
grant execute on function public.atlas_schema_level() to anon, authenticated;

notify pgrst, 'reload schema';
