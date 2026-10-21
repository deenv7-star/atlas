-- 025 (21.10.2026): explicit Data API grants ahead of Supabase's 30.10.2026 change
-- (https://supabase.com/changelog/45329: new public tables/functions stop getting automatic grants).
-- Re-states, object by object, exactly the DML/EXECUTE/sequence privileges each role holds today, so the
-- schema no longer depends on default privileges. Additive + idempotent: GRANT only, nothing revoked,
-- TRUNCATE/REFERENCES/TRIGGER not re-granted. Generated from the live catalog 21.10.2026.
-- RULE for every new migration from now on: CREATE TABLE ... ; ENABLE RLS; policies; then explicit GRANTs
-- (see the template at the end of this file). Rollback: none needed (no privilege added that did not exist).
BEGIN;

-- tables
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."accounting_integrations" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."accounting_integrations" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."accounting_integrations" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."admin_audit_log" TO service_role;
GRANT SELECT ON TABLE public."ai_usage" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."ai_usage" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."audit_log" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."audit_log" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."audit_log" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."automation_rules" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."automation_rules" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."automation_rules" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."bookings" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."bookings" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."bookings" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."calendar_syncs" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."calendar_syncs" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."calendar_syncs" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."cleaning_tasks" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."cleaning_tasks" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."cleaning_tasks" TO service_role;
GRANT SELECT ON TABLE public."contact_messages" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."contact_messages" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."contract_instances" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."contract_instances" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."contract_instances" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."contract_templates" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."contract_templates" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."contract_templates" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."expenses" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."expenses" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."expenses" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."guest_requests" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."guest_requests" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."guest_requests" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."il_calendar" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."il_calendar" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."il_calendar" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."invoices" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."invoices" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."invoices" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."job_runs" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."job_runs" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."job_runs" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."leads" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."leads" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."leads" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."message_logs" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."message_logs" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."message_logs" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."message_queue" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."message_queue" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."message_queue" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."messages" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."messages" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."messages" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."messaging_integrations" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."messaging_integrations" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."messaging_integrations" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."organizations" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."organizations" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."organizations" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."payment_gateways" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."payment_gateways" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."payment_gateways" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."payments" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."payments" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."payments" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."platform_admins" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."platform_charges" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."platform_customer_notes" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."platform_org_flags" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."platform_plans" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."platform_subscriptions" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."pms_integrations" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."pms_integrations" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."pms_integrations" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."profiles" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."profiles" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."profiles" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."properties" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."properties" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."properties" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."review_requests" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."review_requests" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."review_requests" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."subscriptions" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."subscriptions" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."subscriptions" TO service_role;
GRANT SELECT ON TABLE public."support_conversations" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."support_conversations" TO service_role;
GRANT SELECT ON TABLE public."support_messages" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."support_messages" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."units" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."units" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."units" TO service_role;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."users" TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."users" TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE public."users" TO service_role;

-- sequences (serial ids)
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."admin_audit_log_id_seq" TO service_role;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."audit_log_id_seq" TO anon;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."audit_log_id_seq" TO authenticated;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."audit_log_id_seq" TO service_role;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."il_calendar_id_seq" TO anon;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."il_calendar_id_seq" TO authenticated;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."il_calendar_id_seq" TO service_role;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."job_runs_id_seq" TO anon;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."job_runs_id_seq" TO authenticated;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public."job_runs_id_seq" TO service_role;

-- functions (EXECUTE exactly as today; PUBLIC grants on trigger/helper functions left as they are)
GRANT EXECUTE ON FUNCTION public.admin_add_note(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_audit_immutable() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_change_plan(uuid,text,text,integer,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_ensure_subscription(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_extend_trial(uuid,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_customer_v2(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_customer(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_is_test_pattern(text,text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_audit(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_charges(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_contact_messages(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_customers_v2() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_customers() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_plans() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_team() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_log_event(text,uuid,jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_log(text,text,text,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_mark_charge_paid(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_record_charge(uuid,numeric,text,text,text,date,date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_remove_team_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_require(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_role_rank(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_suspended(uuid,boolean,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_team_member(text,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_test_flag(uuid,boolean,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_support_list(text,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_support_mark_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_support_reply(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_support_set_status(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_support_unread() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_system_health() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_plan(text,integer,integer,integer,text,jsonb,boolean,boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_whoami() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_usage_bump(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.atlas_call_edge(text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.atlas_schema_level() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bookings_fill_guest_token() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.contact_messages_guard() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_my_account(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_guest_stay(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_property(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.guard_tenant_columns() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_account_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.payment_gateways_strip_secrets() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_admin_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_my_trial() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_direct_inquiry(text,text,text,text,date,date,integer,integer,text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_guest_checkin(text,text,text,text,integer,boolean,boolean,text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_guest_service(text,text,text,text,text,text,text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.support_after_message() TO service_role;
GRANT EXECUTE ON FUNCTION public.support_feedback(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.support_mark_read(uuid) TO authenticated, service_role;

-- column-level grants (e.g. contact form insert-only columns, admin status update)
GRANT INSERT (email, message, name, phone, source, subject) ON TABLE public."contact_messages" TO anon;
GRANT INSERT (email, message, name, phone, source, subject) ON TABLE public."contact_messages" TO authenticated;
GRANT UPDATE (status) ON TABLE public."contact_messages" TO authenticated;

-- schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
COMMIT;

-- TEMPLATE for new tables (copy into each new migration):
--   CREATE TABLE public.x (...);
--   ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY ... ON public.x ...;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.x TO authenticated;   -- only what the app does
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.x TO service_role;
--   -- anon only if signed-out visitors truly need it; serial ids: GRANT USAGE, SELECT ON SEQUENCE public.x_id_seq TO authenticated;
--   GRANT EXECUTE ON FUNCTION public.fn(args) TO authenticated;          -- RPCs

