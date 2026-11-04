-- 029_device_tokens (prepared 04.11.2026 for the iOS app push notifications). NOT APPLIED by this PR.
-- Needs Deen's OK before it runs. Additive only: one table, two RPCs, explicit grants (Supabase stopped
-- auto-granting new public tables on 30.10.2026). Rollback: supabase/checks/029_rollback.sql.
--
-- One row per phone (APNs device token). The app registers through register_device_token(), never by writing
-- the table directly, so a phone that changes hands (owner A signs out, owner B signs in) moves to B cleanly
-- even though RLS would hide A's row from B. The send-push edge function reads with the service role.

create table if not exists public.device_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  org_id       uuid references public.organizations(id) on delete cascade,
  token        text not null unique check (token ~ '^[0-9A-Fa-f]{32,200}$'),
  platform     text not null default 'ios' check (platform in ('ios')),
  environment  text not null default 'production' check (environment in ('production', 'sandbox')),
  app_version  text check (app_version is null or length(app_version) <= 40),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  last_sent_at timestamptz,
  disabled_at  timestamptz,           -- APNs said 410 Unregistered / BadDeviceToken: stop sending
  last_error   text check (last_error is null or length(last_error) <= 200)
);

create index if not exists device_tokens_user_idx on public.device_tokens (user_id) where disabled_at is null;
create index if not exists device_tokens_org_idx  on public.device_tokens (org_id)  where disabled_at is null;

alter table public.device_tokens enable row level security;

-- Owners may see and remove their own phones (Settings "this phone gets notifications"); writes go through the RPC.
drop policy if exists device_tokens_select_own on public.device_tokens;
create policy device_tokens_select_own on public.device_tokens for select to authenticated using (user_id = auth.uid());
drop policy if exists device_tokens_delete_own on public.device_tokens;
create policy device_tokens_delete_own on public.device_tokens for delete to authenticated using (user_id = auth.uid());

revoke all on public.device_tokens from anon;
grant select, delete on public.device_tokens to authenticated;
grant all on public.device_tokens to service_role;

-- Register (or move) this phone to the calling owner and their current org.
create or replace function public.register_device_token(
  p_token text,
  p_environment text default 'production',
  p_app_version text default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_token is null or p_token !~ '^[0-9A-Fa-f]{32,200}$' then raise exception 'invalid token' using errcode = '22023'; end if;
  insert into public.device_tokens as d (user_id, org_id, token, environment, app_version, updated_at)
  values (v_uid, public.current_org_id(), p_token,
          case when p_environment = 'sandbox' then 'sandbox' else 'production' end,
          left(p_app_version, 40), now())
  on conflict (token) do update
    set user_id = excluded.user_id, org_id = excluded.org_id, environment = excluded.environment,
        app_version = excluded.app_version, updated_at = now(), disabled_at = null, last_error = null;
end;
$$;

-- Sign-out: this phone stops getting the account's pushes.
create or replace function public.unregister_device_token(p_token text) returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.device_tokens where token = p_token and user_id = auth.uid();
$$;

revoke all on function public.register_device_token(text, text, text) from public, anon;
revoke all on function public.unregister_device_token(text) from public, anon;
grant execute on function public.register_device_token(text, text, text) to authenticated, service_role;
grant execute on function public.unregister_device_token(text) to authenticated, service_role;
