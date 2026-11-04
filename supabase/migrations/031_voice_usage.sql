-- 031_voice_usage: daily voice-minute budget for "שאלו את atlas" voice (edge function voice-session).
-- PREPARED, NOT APPLIED. Needs Deen's approval. Additive only: 1 table + 3 functions, no change to existing rows.
-- Rollback: supabase/rollback/031_voice_usage_down.sql
--
-- How the budget works (the app cannot cheat it):
--   Voice runs in short slices (default 180 s). voice_session_start() RESERVES one slice
--   (min(remaining today, slice)) and the minted ElevenLabs client secret carries the same
--   max_duration_seconds, so ElevenLabs itself closes the socket when the slice ends.
--   A reserved slice always counts in full: the app cannot "give time back" while a socket it holds
--   may still be open. The app renews slices quietly during a long conversation, so the most a
--   person can lose is the unused part of the last slice (under 3 minutes).
--   voice_session_end() only records when the app hung up (server clock), for usage reports.
--   Exact metering later: ElevenLabs tracing.group_id = session id, reconciled from their API.
-- Day boundary: midnight Asia/Jerusalem.

create table if not exists public.voice_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  day              date not null default (now() at time zone 'Asia/Jerusalem')::date,
  started_at       timestamptz not null default now(),
  reserved_seconds integer not null check (reserved_seconds between 0 and 3600),
  used_seconds     integer check (used_seconds between 0 and 3600),
  ended_at         timestamptz,
  model            text
);
create index if not exists voice_sessions_user_day_idx on public.voice_sessions (user_id, day);

alter table public.voice_sessions enable row level security;
drop policy if exists voice_sessions_select_own on public.voice_sessions;
create policy voice_sessions_select_own on public.voice_sessions for select using (user_id = auth.uid());
-- no insert/update/delete policies: rows change only through the functions below
revoke insert, update, delete on public.voice_sessions from anon, authenticated;
grant select on public.voice_sessions to authenticated;

-- seconds counted against today: every reserved slice
create or replace function public.voice_seconds_today()
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(reserved_seconds), 0)::integer
  from public.voice_sessions
  where user_id = auth.uid() and day = (now() at time zone 'Asia/Jerusalem')::date;
$$;

-- reserve a session; returns (session_id, granted_seconds, used_today). granted 0 = budget spent.
create or replace function public.voice_session_start(p_daily_seconds integer default 1800, p_session_max integer default 180, p_model text default null)
returns table (session_id uuid, granted_seconds integer, used_today integer)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_used integer;
  v_grant integer;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- one user at a time: serialise concurrent starts for the same user
  perform pg_advisory_xact_lock(hashtext('voice:' || v_uid::text));
  select coalesce(sum(vs.reserved_seconds), 0) into v_used
    from public.voice_sessions vs where vs.user_id = v_uid and vs.day = (now() at time zone 'Asia/Jerusalem')::date;
  v_grant := least(greatest(coalesce(p_session_max, 180), 0), greatest(coalesce(p_daily_seconds, 1800) - v_used, 0), 3600);
  if v_grant < 15 then
    return query select null::uuid, 0, v_used; return;
  end if;
  insert into public.voice_sessions (user_id, reserved_seconds, model) values (v_uid, v_grant, left(p_model, 40)) returning id into v_id;
  return query select v_id, v_grant, v_used;
end;
$$;

-- record the hang-up (server clock; analytics only, the reservation still counts). Idempotent.
create or replace function public.voice_session_end(p_session uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_used integer;
begin
  update public.voice_sessions
     set ended_at = now(),
         used_seconds = least(reserved_seconds, greatest(0, ceil(extract(epoch from (now() - started_at)))::integer))
   where id = p_session and user_id = auth.uid() and ended_at is null
  returning used_seconds into v_used;
  return v_used;
end;
$$;

-- void a slice when no secret was issued (ElevenLabs refused). service_role only: the app can never refund itself.
create or replace function public.voice_session_void(p_session uuid)
returns void language sql security definer set search_path = public as $$
  update public.voice_sessions set reserved_seconds = 0, used_seconds = 0, ended_at = now(), model = coalesce(model, '') || ' (void)'
   where id = p_session and ended_at is null;
$$;
revoke all on function public.voice_session_void(uuid) from public, anon, authenticated;
grant execute on function public.voice_session_void(uuid) to service_role;

revoke all on function public.voice_seconds_today() from public;
revoke all on function public.voice_session_start(integer, integer, text) from public;
revoke all on function public.voice_session_end(uuid) from public;
grant execute on function public.voice_seconds_today() to authenticated;
grant execute on function public.voice_session_start(integer, integer, text) to authenticated;
grant execute on function public.voice_session_end(uuid) to authenticated;
