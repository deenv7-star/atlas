-- ROLLBACK for 029_device_tokens.sql (nothing else depends on it; the app treats a missing table / RPC as
-- "push not set up yet" and keeps working, local check-in reminders included).
begin;
drop function if exists public.unregister_device_token(text);
drop function if exists public.register_device_token(text, text, text);
drop table if exists public.device_tokens;
commit;
