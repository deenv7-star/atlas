-- 021_perf_indexes.sql — additive only (no data / policy changes).
-- Every RLS policy is `org_id = current_org_id()`, and the app lists most tables by org + date.
-- These tables had no index on org_id (or on the foreign keys the screens join / delete by), so each
-- read was a sequential scan that grows with every customer. Applied live 2026-10-18 with
-- CREATE INDEX CONCURRENTLY (no table lock); the statements are idempotent.

create index concurrently if not exists idx_message_logs_org_created     on public.message_logs (org_id, created_at desc);
create index concurrently if not exists idx_message_logs_booking         on public.message_logs (booking_id);
create index concurrently if not exists idx_message_logs_lead            on public.message_logs (lead_id);
create index concurrently if not exists idx_calendar_syncs_org           on public.calendar_syncs (org_id);
create index concurrently if not exists idx_calendar_syncs_property      on public.calendar_syncs (property_id);
create index concurrently if not exists idx_automation_rules_org         on public.automation_rules (org_id);
create index concurrently if not exists idx_guest_requests_org           on public.guest_requests (org_id);
create index concurrently if not exists idx_guest_requests_booking       on public.guest_requests (booking_id);
create index concurrently if not exists idx_review_requests_org          on public.review_requests (org_id);
create index concurrently if not exists idx_review_requests_booking      on public.review_requests (booking_id);
create index concurrently if not exists idx_contract_instances_org       on public.contract_instances (org_id);
create index concurrently if not exists idx_contract_instances_booking   on public.contract_instances (booking_id);
create index concurrently if not exists idx_contract_templates_org       on public.contract_templates (org_id);
create index concurrently if not exists idx_cleaning_tasks_booking       on public.cleaning_tasks (booking_id);
create index concurrently if not exists idx_message_queue_booking        on public.message_queue (booking_id);
create index concurrently if not exists idx_invoices_booking             on public.invoices (booking_id);
create index concurrently if not exists idx_units_property               on public.units (property_id);
create index concurrently if not exists idx_bookings_lead                on public.bookings (lead_id);
create index concurrently if not exists idx_support_conversations_org    on public.support_conversations (org_id);
create index concurrently if not exists idx_support_messages_org         on public.support_messages (org_id);
create index concurrently if not exists idx_messaging_integrations_org   on public.messaging_integrations (org_id);
create index concurrently if not exists idx_payment_gateways_org         on public.payment_gateways (org_id);
create index concurrently if not exists idx_pms_integrations_org         on public.pms_integrations (org_id);
create index concurrently if not exists idx_accounting_integrations_org  on public.accounting_integrations (org_id);
create index concurrently if not exists idx_subscriptions_org            on public.subscriptions (org_id);
