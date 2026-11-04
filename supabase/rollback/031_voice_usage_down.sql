-- Rollback of 031_voice_usage.sql (drops only what 031 created; the voice-session function then answers "voice_not_ready").
drop function if exists public.voice_session_void(uuid);
drop function if exists public.voice_session_end(uuid);
drop function if exists public.voice_session_start(integer, integer, text);
drop function if exists public.voice_seconds_today();
drop table if exists public.voice_sessions;
