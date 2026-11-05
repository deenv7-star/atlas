-- 036 (05.11.2026, audit PERF-1, approved by Deen 05.11 14:31): indexes for the 24 foreign keys without one
-- (composite (x, org_id) indexes also cover the single-column FK on x) and auth.uid() evaluated once per query
-- instead of once per row in 8 RLS policies (same meaning: (SELECT auth.uid())).
-- Tables are small; plain CREATE INDEX inside the transaction takes seconds.
-- Rollback: work/backup/2026-11-05-hardening-2/rollback_036.sql
BEGIN;
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id            ON public.organizations (owner_id);
CREATE INDEX IF NOT EXISTS idx_units_property_org                ON public.units (property_id, org_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_org                ON public.leads (property_id, org_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_org             ON public.bookings (property_id, org_id);
CREATE INDEX IF NOT EXISTS idx_bookings_unit_org                 ON public.bookings (unit_id, org_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_property_id        ON public.cleaning_tasks (property_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_property_id          ON public.message_logs (property_id);
CREATE INDEX IF NOT EXISTS idx_guest_requests_property_org       ON public.guest_requests (property_id, org_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_property_id    ON public.contract_templates (property_id);
CREATE INDEX IF NOT EXISTS idx_contract_instances_template_id    ON public.contract_instances (template_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_property_id       ON public.review_requests (property_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_property_org       ON public.calendar_syncs (property_id, org_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_org             ON public.expenses (property_id, org_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_rule_id             ON public.message_queue (rule_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_created_by        ON public.platform_admins (created_by);
CREATE INDEX IF NOT EXISTS idx_platform_plans_updated_by         ON public.platform_plans (updated_by);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_plan_key   ON public.platform_subscriptions (plan_key);
CREATE INDEX IF NOT EXISTS idx_platform_charges_created_by       ON public.platform_charges (created_by);
CREATE INDEX IF NOT EXISTS idx_platform_customer_notes_author_id ON public.platform_customer_notes (author_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_assigned_to ON public.support_conversations (assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_author_id        ON public.support_messages (author_id);

ALTER POLICY "ai_usage_select_own" ON public.ai_usage USING (user_id = (SELECT auth.uid()));
ALTER POLICY "device_tokens_delete_own" ON public.device_tokens USING (user_id = (SELECT auth.uid()));
ALTER POLICY "device_tokens_select_own" ON public.device_tokens USING (user_id = (SELECT auth.uid()));
ALTER POLICY "profiles: select own" ON public.profiles USING (id = (SELECT auth.uid()));
ALTER POLICY "profiles: update own" ON public.profiles USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
ALTER POLICY "support_conversations: own or platform admin" ON public.support_conversations USING ((user_id = (SELECT auth.uid())) OR is_platform_admin());
ALTER POLICY "support_messages: own or platform admin" ON public.support_messages USING ((user_id = (SELECT auth.uid())) OR is_platform_admin());
ALTER POLICY "voice_sessions_select_own" ON public.voice_sessions USING (user_id = (SELECT auth.uid()));
COMMIT;
