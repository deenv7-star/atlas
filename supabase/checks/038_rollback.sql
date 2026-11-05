-- Rollback for 038_integrations (removes triggers, functions and the three tables; connected keys are lost).
drop trigger if exists trg_int_booking on public.bookings;
drop trigger if exists trg_int_payment on public.payments;
drop trigger if exists trg_int_lead on public.leads;
drop function if exists public.trg_int_booking();
drop function if exists public.trg_int_payment();
drop function if exists public.trg_int_lead();
drop function if exists public.atlas_integration_event(uuid, text, uuid, jsonb);
drop function if exists public.my_integrations();
drop table if exists public.integration_events_log;
drop table if exists public.integration_documents;
drop table if exists public.integration_connections;
