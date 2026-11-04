-- Rollback of 032_voice_usage_actual.sql: restores the 031 function bodies (every reserved slice counts in full,
-- no daily slice cap) and drops voice_charge. Rows are untouched; used_seconds written while 032 ran stay as analytics.

create or replace function public.voice_seconds_today()
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(reserved_seconds), 0)::integer
  from public.voice_sessions
  where user_id = auth.uid() and day = (now() at time zone 'Asia/Jerusalem')::date;
$$;

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

drop function if exists public.voice_charge(integer, integer, timestamptz);

revoke all on function public.voice_seconds_today() from public, anon;
revoke all on function public.voice_session_start(integer, integer, text) from public, anon;
revoke all on function public.voice_session_end(uuid) from public, anon;
grant execute on function public.voice_seconds_today() to authenticated;
grant execute on function public.voice_session_start(integer, integer, text) to authenticated;
grant execute on function public.voice_session_end(uuid) to authenticated;
