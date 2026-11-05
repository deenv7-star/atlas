-- 038_integrations (05.11.2026) — PREPARED, NOT APPLIED. Needs Deen's OK. Additive only.
-- Owner-connected services that need a secret: invoicing apps with the owner's own API key (Morning, iCount)
-- and an outgoing webhook (Zapier / Make / n8n).
--
--   integration_connections   one row per org + provider. The secret is AES-GCM encrypted by the edge function
--                             `integrations` (key = edge secret INTEGRATIONS_ENC_KEY, never in the DB). The table has
--                             NO grants for anon/authenticated: the app reads metadata only through my_integrations().
--   integration_documents     one row per payment that got a tax document (idempotency: never issue twice).
--   integration_events_log    outgoing webhook attempts (last 30 days are enough; no payload kept).
--   triggers                  booking created / changed / cancelled, payment PAID, lead created → pg_net POST to the
--                             edge function (action "dispatch"), only when the org has an active WEBHOOK row.
--
-- Secret for the trigger → function call: Supabase Vault 'atlas_integrations_secret' (= edge secret
-- ATLAS_INTEGRATIONS_SECRET), created out of band, never written here. Rollback: supabase/checks/038_rollback.sql.

create table if not exists public.integration_connections (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  provider      text not null check (provider in ('MORNING', 'ICOUNT', 'WEBHOOK')),
  status        text not null default 'ACTIVE' check (status in ('ACTIVE', 'ERROR', 'PAUSED')),
  secret_enc    text not null,                       -- v1:<iv b64>:<ciphertext b64>, see edge function
  hint          text,                                -- last 4 chars of the key / webhook host, for the UI
  config        jsonb not null default '{}'::jsonb,  -- non-secret options: { doc_type, send_email, events[] }
  connected_by  uuid,
  connected_at  timestamptz not null default now(),
  last_ok_at    timestamptz,
  last_error    text,
  updated_at    timestamptz not null default now(),
  unique (org_id, provider)
);
alter table public.integration_connections enable row level security;   -- no policies: service role / definer only
revoke all on public.integration_connections from anon, authenticated;
grant all on public.integration_connections to service_role;

create table if not exists public.integration_documents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  payment_id   uuid not null references public.payments(id) on delete cascade,
  provider     text not null,
  doc_type     text not null,
  doc_number   text,
  doc_url      text,
  external_id  text,
  created_at   timestamptz not null default now(),
  unique (payment_id)
);
alter table public.integration_documents enable row level security;
drop policy if exists "integration_documents: select own" on public.integration_documents;
create policy "integration_documents: select own" on public.integration_documents for select using (org_id = public.current_org_id());
revoke all on public.integration_documents from anon;
revoke insert, update, delete on public.integration_documents from authenticated;
grant select on public.integration_documents to authenticated;
grant all on public.integration_documents to service_role;

create table if not exists public.integration_events_log (
  id          bigserial primary key,
  org_id      uuid not null,
  event       text not null,
  ref_id      uuid,
  request_id  bigint,
  created_at  timestamptz not null default now()
);
create index if not exists integration_events_log_org_idx on public.integration_events_log (org_id, created_at desc);
alter table public.integration_events_log enable row level security;
revoke all on public.integration_events_log from anon, authenticated;
grant all on public.integration_events_log to service_role;
revoke all on sequence public.integration_events_log_id_seq from anon, authenticated;

-- Metadata for the signed-in owner's own org. Never returns secret_enc.
create or replace function public.my_integrations()
returns table (provider text, status text, hint text, config jsonb, connected_at timestamptz, last_ok_at timestamptz, last_error text)
language sql stable security definer set search_path = public, pg_temp as $$
  select c.provider, c.status, c.hint, c.config, c.connected_at, c.last_ok_at, c.last_error
  from public.integration_connections c
  where c.org_id = public.current_org_id()
$$;
revoke all on function public.my_integrations() from public, anon;
grant execute on function public.my_integrations() to authenticated;

-- ── outgoing webhook dispatch ───────────────────────────────────────────────────────────────────────
create or replace function public.atlas_integration_event(p_org uuid, p_event text, p_ref uuid, p_data jsonb)
returns bigint
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_secret text; v_id bigint;
begin
  if p_org is null then return null; end if;
  if not exists (select 1 from public.integration_connections where org_id = p_org and provider = 'WEBHOOK' and status = 'ACTIVE') then
    return null;
  end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'atlas_integrations_secret' limit 1;
  if v_secret is null then raise warning 'atlas_integrations_secret missing in vault'; return null; end if;
  select net.http_post(
    url := 'https://romvmqbcinurscwdsskx.supabase.co/functions/v1/integrations',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-atlas-int', v_secret),
    body := jsonb_build_object('action', 'dispatch', 'org_id', p_org, 'event', p_event, 'ref_id', p_ref, 'data', p_data),
    timeout_milliseconds := 15000
  ) into v_id;
  insert into public.integration_events_log (org_id, event, ref_id, request_id) values (p_org, p_event, p_ref, v_id);
  return v_id;
exception when others then
  raise warning 'atlas_integration_event failed: %', sqlerrm;
  return null;
end;
$$;
revoke all on function public.atlas_integration_event(uuid, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.atlas_integration_event(uuid, text, uuid, jsonb) to service_role;

-- Only ids + safe fields go to the function; it re-reads the row itself with the service role.
create or replace function public.trg_int_booking() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    perform public.atlas_integration_event(new.org_id, 'booking.created', new.id, jsonb_build_object('id', new.id));
  elsif upper(coalesce(new.status, '')) in ('CANCELLED', 'CANCELED') and upper(coalesce(old.status, '')) not in ('CANCELLED', 'CANCELED') then
    perform public.atlas_integration_event(new.org_id, 'booking.cancelled', new.id, jsonb_build_object('id', new.id));
  elsif new.check_in_date is distinct from old.check_in_date or new.check_out_date is distinct from old.check_out_date
     or new.status is distinct from old.status or new.total_price is distinct from old.total_price then
    perform public.atlas_integration_event(new.org_id, 'booking.updated', new.id, jsonb_build_object('id', new.id));
  end if;
  return new;
end;
$$;

create or replace function public.trg_int_payment() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if upper(coalesce(new.status, '')) = 'PAID' and (tg_op = 'INSERT' or upper(coalesce(old.status, '')) <> 'PAID') then
    perform public.atlas_integration_event(new.org_id, 'payment.paid', new.id, jsonb_build_object('id', new.id));
  end if;
  return new;
end;
$$;

create or replace function public.trg_int_lead() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.atlas_integration_event(new.org_id, 'lead.created', new.id, jsonb_build_object('id', new.id));
  return new;
end;
$$;

drop trigger if exists trg_int_booking on public.bookings;
create trigger trg_int_booking after insert or update on public.bookings for each row execute function public.trg_int_booking();
drop trigger if exists trg_int_payment on public.payments;
create trigger trg_int_payment after insert or update on public.payments for each row execute function public.trg_int_payment();
drop trigger if exists trg_int_lead on public.leads;
create trigger trg_int_lead after insert on public.leads for each row execute function public.trg_int_lead();
