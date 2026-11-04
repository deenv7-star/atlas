-- 030_push_triggers (04.11.2026, approved by Deen 12:47 IST "כן תפעיל"). Additive only.
-- Sends an iOS push (edge function send-push) to every phone of the org when, from OUTSIDE the app:
--   lead_new          a new lead arrives (site form / direct inquiry RPC / any server insert)
--   booking_new       a new booking arrives (direct-booking page, Airbnb / Booking.com / iCal sync)
--   payment_received  a payment becomes PAID (webhook / server)
-- Rule "not what the owner did himself": nothing is sent when the row was written by a signed-in app user
-- (auth.uid() is not null). Blocks, cancelled bookings and past stays (initial iCal import) are skipped.
-- Throttle: at most 3 pushes per org+event per 10 minutes (an iCal first sync can insert many rows).
-- A push failure never blocks or fails the insert/update (pg_net is async + exception handler).
-- Secret: Supabase Vault 'atlas_push_secret' (same value as the edge-function secret ATLAS_PUSH_SECRET),
-- created out of band, never written here. Rollback: supabase/checks/030_rollback.sql.

create table if not exists public.push_log (
  id         bigserial primary key,
  org_id     uuid not null,
  event      text not null,
  ref_id     uuid,
  request_id bigint,
  created_at timestamptz not null default now()
);
create index if not exists push_log_org_event_idx on public.push_log (org_id, event, created_at desc);
alter table public.push_log enable row level security;          -- no policies: service role / definer only
revoke all on public.push_log from anon, authenticated;
grant all on public.push_log to service_role;
revoke all on sequence public.push_log_id_seq from anon, authenticated;

create or replace function public.atlas_send_push(
  p_org uuid, p_event text, p_title text, p_body text, p_path text, p_ref uuid default null
) returns bigint
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_secret text;
  v_id bigint;
begin
  if p_org is null then return null; end if;
  -- nothing to do for an org without an active phone
  if not exists (select 1 from public.device_tokens where org_id = p_org and disabled_at is null) then return null; end if;
  if (select count(*) from public.push_log
        where org_id = p_org and event = p_event and created_at > now() - interval '10 minutes') >= 3 then
    return null;
  end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'atlas_push_secret' limit 1;
  if v_secret is null then raise warning 'atlas_push_secret missing in vault'; return null; end if;
  select net.http_post(
    url := 'https://romvmqbcinurscwdsskx.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-atlas-push', v_secret),
    body := jsonb_build_object('org_id', p_org, 'event', p_event, 'title', left(p_title, 120),
                               'body', left(coalesce(p_body, ''), 300), 'path', p_path),
    timeout_milliseconds := 15000
  ) into v_id;
  insert into public.push_log (org_id, event, ref_id, request_id) values (p_org, p_event, p_ref, v_id);
  return v_id;
exception when others then
  raise warning 'atlas_send_push failed: %', sqlerrm;
  return null;
end;
$$;
revoke all on function public.atlas_send_push(uuid, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.atlas_send_push(uuid, text, text, text, text, uuid) to service_role;

create or replace function public.atlas_fmt_dates(p_in date, p_out date) returns text
language sql immutable set search_path = public, pg_temp as $$
  select case
    when p_in is null then null
    when p_out is null or p_out = p_in then to_char(p_in, 'DD.MM')
    when date_trunc('month', p_in) = date_trunc('month', p_out) then to_char(p_in, 'DD') || '–' || to_char(p_out, 'DD.MM')
    else to_char(p_in, 'DD.MM') || '–' || to_char(p_out, 'DD.MM')
  end
$$;
-- "12–14.11" (a digit run, shown LTR inside the Hebrew line)

-- ── triggers ───────────────────────────────────────────────────────────────────────────────────────
create or replace function public.trg_push_lead_new() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null then return new; end if;
  perform public.atlas_send_push(
    new.org_id, 'lead_new',
    'פנייה חדשה: ' || coalesce(nullif(btrim(new.full_name), ''), 'אורח/ת'),
    coalesce(public.atlas_fmt_dates(new.check_in_date, new.check_out_date), 'פתחו כדי לחזור אליהם'),
    '/lead/' || new.id, new.id);
  return new;
exception when others then return new;
end $$;

create or replace function public.trg_push_booking_new() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null then return new; end if;
  if coalesce(new.is_block, false) or upper(coalesce(new.status, '')) in ('CANCELLED', 'CANCELED')
     or coalesce(new.guest_name, '') like 'חסום%' then return new; end if;
  if new.check_out_date is not null and new.check_out_date < current_date then return new; end if;
  perform public.atlas_send_push(
    new.org_id, 'booking_new',
    'הזמנה חדשה: ' || coalesce(nullif(btrim(new.guest_name), ''), 'אורח/ת'),
    concat_ws(', ', public.atlas_fmt_dates(new.check_in_date, new.check_out_date), nullif(btrim(new.property_name), '')),
    '/booking/' || new.id, new.id);
  return new;
exception when others then return new;
end $$;

create or replace function public.trg_push_payment_received() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_guest text;
begin
  if auth.uid() is not null then return new; end if;
  if upper(coalesce(new.status, '')) <> 'PAID' then return new; end if;
  if tg_op = 'UPDATE' and upper(coalesce(old.status, '')) = 'PAID' then return new; end if;
  select guest_name into v_guest from public.bookings where id = new.booking_id;
  perform public.atlas_send_push(
    new.org_id, 'payment_received',
    'התקבל תשלום: ₪' || to_char(coalesce(new.amount, 0), 'FM999,999,990.##'),
    case when v_guest is not null and btrim(v_guest) <> '' then 'מ' || v_guest else 'פתחו לפרטים' end,
    case when new.booking_id is not null then '/booking/' || new.booking_id else '/dashboard' end, new.id);
  return new;
exception when others then return new;
end $$;

revoke all on function public.trg_push_lead_new() from public, anon, authenticated;
revoke all on function public.trg_push_booking_new() from public, anon, authenticated;
revoke all on function public.trg_push_payment_received() from public, anon, authenticated;

drop trigger if exists trg_push_lead_new on public.leads;
create trigger trg_push_lead_new after insert on public.leads
  for each row execute function public.trg_push_lead_new();
drop trigger if exists trg_push_booking_new on public.bookings;
create trigger trg_push_booking_new after insert on public.bookings
  for each row execute function public.trg_push_booking_new();
drop trigger if exists trg_push_payment_received on public.payments;
create trigger trg_push_payment_received after insert or update of status on public.payments
  for each row execute function public.trg_push_payment_received();

-- keep the log short
do $$ begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'atlas-push-log-retention';
  perform cron.schedule('atlas-push-log-retention', '23 3 * * *', $c$ delete from public.push_log where created_at < now() - interval '30 days' $c$);
end $$;

revoke all on function public.atlas_fmt_dates(date, date) from public, anon, authenticated;
grant execute on function public.atlas_fmt_dates(date, date) to service_role;
