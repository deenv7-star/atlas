-- 032_voice_usage_actual: charge voice by the seconds actually used, not a full 180 s slice per start.
-- PREPARED, NOT APPLIED. Needs Deen's approval. Requires 031. Same function signatures as 031 (no PostgREST
-- ambiguity, no deploy-order hazard: the deployed voice-session v8 keeps working before and after this runs).
-- No table change, no data rewrite. Rollback: supabase/rollback/032_voice_usage_actual_down.sql (restores 031 bodies).
--
-- Why: on 04.11.2026 nine starts lasted ~15-30 s each but each booked 180 s (used_today 360 → 1620 of 1800 in one evening).
--
-- Rules after 032:
--   * An OPEN slice (no end yet) holds its full reservation, so parallel starts cannot exceed the daily cap.
--   * When the app ends a slice (hang-up, renewal, or the socket closing on its own, which the app now reports),
--     the day is charged the server-clock seconds since the slice started, at least 15 s and at most the slice.
--   * A slice the app never ends (app killed) keeps its full reservation: ElevenLabs itself closes the socket at
--     max_duration_seconds, so that is the most it could have used.
--   * At most 40 slices a day per user. An ended slice is charged from the server clock, but a modified app could
--     hang up early and keep the socket; the slice cap bounds that to 40 × 180 s even in the worst case.
--     Exact metering later: ElevenLabs tracing.group_id = session id.

-- what one row costs today
create or replace function public.voice_charge(p_reserved integer, p_used integer, p_ended timestamptz)
returns integer language sql immutable set search_path = public as $$
  select case when p_ended is null then coalesce(p_reserved, 0) else coalesce(p_used, p_reserved, 0) end;
$$;
revoke all on function public.voice_charge(integer, integer, timestamptz) from public, anon;
grant execute on function public.voice_charge(integer, integer, timestamptz) to authenticated, service_role;

create or replace function public.voice_seconds_today()
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(public.voice_charge(reserved_seconds, used_seconds, ended_at)), 0)::integer
  from public.voice_sessions
  where user_id = auth.uid() and day = (now() at time zone 'Asia/Jerusalem')::date;
$$;

create or replace function public.voice_session_start(p_daily_seconds integer default 1800, p_session_max integer default 180, p_model text default null)
returns table (session_id uuid, granted_seconds integer, used_today integer)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_used integer;
  v_count integer;
  v_grant integer;
  v_id uuid;
  c_max_slices constant integer := 40;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform pg_advisory_xact_lock(hashtext('voice:' || v_uid::text));
  select coalesce(sum(public.voice_charge(vs.reserved_seconds, vs.used_seconds, vs.ended_at)), 0),
         count(*) filter (where vs.reserved_seconds > 0)
    into v_used, v_count
    from public.voice_sessions vs where vs.user_id = v_uid and vs.day = (now() at time zone 'Asia/Jerusalem')::date;
  v_grant := least(greatest(coalesce(p_session_max, 180), 0), greatest(coalesce(p_daily_seconds, 1800) - v_used, 0), 3600);
  if v_grant < 15 or v_count >= c_max_slices then
    return query select null::uuid, 0, v_used; return;
  end if;
  insert into public.voice_sessions (user_id, reserved_seconds, model) values (v_uid, v_grant, left(p_model, 40)) returning id into v_id;
  return query select v_id, v_grant, v_used;
end;
$$;

-- end a slice: charge server-clock seconds used (min 15, max the slice). Idempotent; returns the seconds charged.
create or replace function public.voice_session_end(p_session uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_used integer;
begin
  update public.voice_sessions
     set ended_at = now(),
         used_seconds = least(reserved_seconds, greatest(least(reserved_seconds, 15), ceil(extract(epoch from (now() - started_at)))::integer))
   where id = p_session and user_id = auth.uid() and ended_at is null
  returning used_seconds into v_used;
  return v_used;
end;
$$;

revoke all on function public.voice_seconds_today() from public, anon;
revoke all on function public.voice_session_start(integer, integer, text) from public, anon;
revoke all on function public.voice_session_end(uuid) from public, anon;
grant execute on function public.voice_seconds_today() to authenticated;
grant execute on function public.voice_session_start(integer, integer, text) to authenticated;
grant execute on function public.voice_session_end(uuid) to authenticated;
