-- ROLLBACK for 030_push_triggers.sql (pushes stop; leads/bookings/payments untouched).
begin;
drop trigger if exists trg_push_lead_new on public.leads;
drop trigger if exists trg_push_booking_new on public.bookings;
drop trigger if exists trg_push_payment_received on public.payments;
drop function if exists public.trg_push_lead_new();
drop function if exists public.trg_push_booking_new();
drop function if exists public.trg_push_payment_received();
drop function if exists public.atlas_send_push(uuid, text, text, text, text, uuid);
drop function if exists public.atlas_fmt_dates(date, date);
drop table if exists public.push_log;
select cron.unschedule(jobid) from cron.job where jobname = 'atlas-push-log-retention';
commit;
-- optional: delete from vault.secrets where name = 'atlas_push_secret';
