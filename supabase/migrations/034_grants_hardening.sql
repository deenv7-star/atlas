-- 034 (05.11.2026, audit SEC-4, approved by Deen 05.11 14:31): least-privilege Data API grants.
-- Nothing a real flow uses is taken away:
--   * anon (signed-out visitors) only ever reached tenant tables through RLS that returns 0 rows
--     (policies call current_org_id()/auth.uid(), both NULL for anon). Public flows use SECURITY DEFINER RPCs
--     (get_public_property, get_guest_stay, submit_direct_inquiry, submit_guest_checkin, submit_guest_service),
--     the contact form (column INSERT on contact_messages) and the holiday table (il_calendar SELECT). Those stay.
--   * TRUNCATE / REFERENCES / TRIGGER / MAINTAIN are never used by the app through the API: revoked from anon
--     and authenticated (TRUNCATE ignores RLS).
--   * GraphQL (/graphql/v1) is not used by the app: anon/authenticated lose USAGE on graphql_public, so the
--     schema is no longer discoverable there.
--   * Trigger / event-trigger functions and internal helpers are not callable as RPCs any more
--     (triggers fire regardless of EXECUTE). current_org_id() stays for authenticated (RLS + ai-chat).
-- Rollback: work/backup/2026-11-05-hardening-2/rollback_034.sql (restores every ACL entry as it was).
BEGIN;

-- 1. anon: nothing on tables/sequences except the two public paths
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT SELECT ON TABLE public.il_calendar TO anon;
GRANT INSERT (name, email, phone, subject, message, source) ON TABLE public.contact_messages TO anon;

-- 2. authenticated: drop privileges the API never needs; holidays are read-only (RLS already allowed only SELECT)
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;
DO $$ BEGIN
  EXECUTE 'REVOKE MAINTAIN ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
EXCEPTION WHEN undefined_object OR syntax_error OR invalid_parameter_value THEN NULL; -- PG < 17 has no MAINTAIN
END $$;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.il_calendar FROM authenticated;

-- 3. GraphQL endpoint off for API roles
REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated;

-- 4. functions that must not be RPCs
REVOKE EXECUTE ON FUNCTION public.bookings_fill_guest_token()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.contact_messages_guard()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_tenant_columns()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payment_gateways_strip_secrets() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_require(text)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.voice_seconds_today()            FROM PUBLIC, anon, authenticated;
-- signed-in only
REVOKE EXECUTE ON FUNCTION public.current_org_id()                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_is_test_pattern(text,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.current_org_id()                 TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.admin_is_test_pattern(text,text) TO authenticated, service_role;
-- keep service_role able to call everything it could
GRANT EXECUTE ON FUNCTION public.bookings_fill_guest_token(), public.contact_messages_guard(), public.guard_tenant_columns(),
  public.handle_new_user(), public.payment_gateways_strip_secrets(), public.set_updated_at(), public.admin_require(text),
  public.voice_seconds_today() TO service_role;

COMMIT;
