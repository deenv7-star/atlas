-- =============================================================================
-- 023: admin v2 (customer 360, test-account flag, logged reads, private backup bucket)
--
-- STATUS: NOT APPLIED. Needs Deen's approval. Additive only: one new table, one new private
-- bucket, new SECURITY DEFINER functions. No drops, no changes to customer tables or to any
-- existing function. Re-runnable. The admin UI works without it (falls back to 011/012 data and
-- shows "יופעל אחרי עדכון מסד הנתונים" where a 023 field is missing).
--
--   1. platform_org_flags          manual "test account" override per organization
--   2. admin_is_test_pattern()     automatic test detection (qa+, +scout, @gonogo.team, …)
--   3. admin_list_customers_v2()   011/012 list + is_test, last sign-in, email confirmed,
--                                  members, leads, iCal health, WhatsApp readiness
--   4. admin_get_customer_v2()     011/012 customer page + members, calendar syncs (no URLs),
--                                  WhatsApp status, receipts/leads/files counts
--   5. admin_set_test_flag()       admin+, logged
--   6. admin_log_event()           support+, logs sensitive reads (view-as, CSV export)
--   7. storage bucket admin-backups (private; only the service role can read or write it).
--      Used by the admin-customer edge function for the backup taken before a delete.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_org_flags (
  org_id     UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_test    BOOLEAN NOT NULL,
  reason     TEXT CHECK (reason IS NULL OR length(reason) <= 200),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.platform_org_flags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_org_flags FROM PUBLIC, anon, authenticated;

-- Same rule as the UI (src/admin/v2/testAccounts.js). Keep the two in sync.
CREATE OR REPLACE FUNCTION public.admin_is_test_pattern(p_email TEXT, p_name TEXT)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(lower(p_email), '') ~ '(^qa[+._-]|^test[+._-]|[+]test|[+]qa|[+]scout|^roast[+]|@gonogo\.team$|@example\.(com|org|net)$|@mailinator\.|\.invalid$|\.test$)'
      OR COALESCE(lower(p_name), '') ~ '(^qa |^qa$| qa org$|^test |בדיקה)';
$$;

-- ─── list ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_customers_v2()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(c) || jsonb_build_object(
      'is_test', COALESCE(f.is_test, public.admin_is_test_pattern(c.owner_email, c.org_name)),
      'is_test_source', CASE WHEN f.org_id IS NOT NULL THEN 'manual'
                             WHEN public.admin_is_test_pattern(c.owner_email, c.org_name) THEN 'auto' ELSE NULL END,
      'last_sign_in_at', au.last_sign_in_at,
      'email_confirmed', au.email_confirmed_at IS NOT NULL,
      'members_count', (SELECT COUNT(*) FROM public.profiles p WHERE p.organization_id = c.org_id),
      'leads_count', (SELECT COUNT(*) FROM public.leads l WHERE l.org_id = c.org_id),
      'ical_feeds', (SELECT COUNT(*) FROM public.calendar_syncs s WHERE s.org_id = c.org_id AND COALESCE(s.is_active, TRUE)),
      'ical_errors', (SELECT COUNT(*) FROM public.calendar_syncs s WHERE s.org_id = c.org_id AND COALESCE(s.is_active, TRUE)
                        AND (s.error_message IS NOT NULL OR upper(COALESCE(s.sync_status, '')) IN ('ERROR','FAILED'))),
      'ical_last_success', (SELECT MAX(s.last_success_at) FROM public.calendar_syncs s WHERE s.org_id = c.org_id),
      'wa_ready', (o.settings ? 'host_phone' AND COALESCE(o.settings->>'host_phone', '') ~ '\d{9,}')
    ) ORDER BY c.created_at DESC)
    FROM public.admin_list_customers() c
    JOIN public.organizations o ON o.id = c.org_id
    LEFT JOIN auth.users au ON au.id = c.owner_id
    LEFT JOIN public.platform_org_flags f ON f.org_id = c.org_id
  ), '[]'::jsonb);
END $$;

-- ─── customer 360 ────────────────────────────────────────────────────────────
-- No guest PII, no iCal URLs (they carry private tokens), no integration configs.
CREATE OR REPLACE FUNCTION public.admin_get_customer_v2(p_org UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v JSONB; s JSONB;
BEGIN
  PERFORM public.admin_require('support');
  v := public.admin_get_customer(p_org);          -- raises P0002 when the org does not exist
  SELECT settings INTO s FROM public.organizations WHERE id = p_org;
  RETURN v
    || jsonb_build_object('customer', (v->'customer') || COALESCE((
         SELECT x FROM jsonb_array_elements(public.admin_list_customers_v2()) x WHERE (x->>'org_id')::uuid = p_org), '{}'::jsonb))
    || jsonb_build_object(
    'members', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'user_id', p.id, 'email', COALESCE(au.email::TEXT, p.email), 'full_name', NULLIF(p.full_name, ''),
        'is_owner', p.id = o.owner_id, 'created_at', p.created_at,
        'last_sign_in_at', au.last_sign_in_at, 'email_confirmed', au.email_confirmed_at IS NOT NULL,
        'is_staff', EXISTS (SELECT 1 FROM public.platform_admins a WHERE a.user_id = p.id))
        ORDER BY (p.id = o.owner_id) DESC, p.created_at)
      FROM public.profiles p JOIN public.organizations o ON o.id = p.organization_id
      LEFT JOIN auth.users au ON au.id = p.id WHERE p.organization_id = p_org), '[]'::jsonb),
    'calendar_syncs', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', cs.id, 'provider', cs.provider, 'label', cs.label, 'property', pr.name, 'is_active', COALESCE(cs.is_active, TRUE),
        'sync_status', cs.sync_status, 'last_success_at', cs.last_success_at, 'last_attempt_at', cs.last_attempt_at,
        'error_message', left(cs.error_message, 200), 'events_count', cs.events_count,
        'conflicts', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(cs.conflicts) = 'array' THEN cs.conflicts END), 0))
        ORDER BY cs.created_at)
      FROM public.calendar_syncs cs LEFT JOIN public.properties pr ON pr.id = cs.property_id WHERE cs.org_id = p_org), '[]'::jsonb),
    'whatsapp', jsonb_build_object(
      'host_phone', NULLIF(s->>'host_phone', ''),
      'setup_done', COALESCE(s #>> '{setup,done,whatsapp}', '') <> '',
      'queue_pending', (SELECT COUNT(*) FROM public.message_queue q WHERE q.org_id = p_org AND q.status IN ('pending','due','queued')),
      'sent_30d', (SELECT COUNT(*) FROM public.message_queue q WHERE q.org_id = p_org AND q.sent_at > NOW() - INTERVAL '30 days'),
      'failed_30d', (SELECT COUNT(*) FROM public.message_queue q WHERE q.org_id = p_org AND q.status IN ('failed','error') AND q.updated_at > NOW() - INTERVAL '30 days')),
    'counts', jsonb_build_object(
      'leads', (SELECT COUNT(*) FROM public.leads WHERE org_id = p_org),
      'invoices', (SELECT COUNT(*) FROM public.invoices WHERE org_id = p_org),
      'payments', (SELECT COUNT(*) FROM public.payments WHERE org_id = p_org),
      'messages', (SELECT COUNT(*) FROM public.message_logs WHERE org_id = p_org),
      'support_conversations', (SELECT COUNT(*) FROM public.support_conversations WHERE org_id = p_org))
  );
END $$;

-- ─── actions ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_test_flag(p_org UUID, p_is_test BOOLEAN, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('admin');
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_org) THEN
    RAISE EXCEPTION 'organization not found' USING ERRCODE = 'P0002';
  END IF;
  IF p_is_test IS NULL THEN
    DELETE FROM public.platform_org_flags WHERE org_id = p_org;          -- back to automatic
  ELSE
    INSERT INTO public.platform_org_flags (org_id, is_test, reason, updated_by)
    VALUES (p_org, p_is_test, NULLIF(trim(p_reason), ''), auth.uid())
    ON CONFLICT (org_id) DO UPDATE SET is_test = EXCLUDED.is_test, reason = EXCLUDED.reason,
                                       updated_by = EXCLUDED.updated_by, updated_at = NOW();
  END IF;
  PERFORM public.admin_log('customer.flag_test', 'organization', p_org::TEXT, p_org,
          jsonb_build_object('is_test', p_is_test, 'reason', p_reason));
  RETURN jsonb_build_object('org_id', p_org, 'is_test', p_is_test);
END $$;

-- Sensitive reads that happen in the browser get a row too. Allow-list only.
CREATE OR REPLACE FUNCTION public.admin_log_event(p_action TEXT, p_org UUID, p_details JSONB DEFAULT '{}'::jsonb)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  IF p_action NOT IN ('customer.view_as', 'customers.export_csv', 'audit.export_csv', 'charges.export_csv') THEN
    RAISE EXCEPTION 'action not allowed' USING ERRCODE = '22023';
  END IF;
  IF pg_column_size(COALESCE(p_details, '{}'::jsonb)) > 4000 THEN
    RAISE EXCEPTION 'details too large' USING ERRCODE = '22023';
  END IF;
  PERFORM public.admin_log(p_action, CASE WHEN p_org IS NULL THEN 'platform' ELSE 'organization' END,
          p_org::TEXT, p_org, COALESCE(p_details, '{}'::jsonb));
END $$;

-- ─── private backup bucket (service role only; no storage policies on purpose) ─
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-backups', 'admin-backups', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- ─── grants (same pattern as 011) ────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.admin_list_customers_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_customer_v2(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_test_flag(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_log_event(TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_customers_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_customer_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_test_flag(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_log_event(TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_is_test_pattern(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
