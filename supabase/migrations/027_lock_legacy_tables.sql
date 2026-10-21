-- 027 (21.10.2026, backend hardening, approved by Deen 21.10 15:33 IDT)
-- Legacy tables public.users and public.subscriptions (0 rows) are not written by the web app:
--   * frontend never calls them (no entities.User / entities.Subscription, no .from('users'|'subscriptions'))
--   * edge functions (atlas-toggle-automation, admin-customer) read/write them with the service_role client
--   * DB functions that touch them are all SECURITY DEFINER (run as owner)
-- Until now anon + authenticated had INSERT/UPDATE/DELETE/TRUNCATE and an "ALL" RLS policy, so a signed-in
-- customer could e.g. insert a public.users row with is_platform_admin=true or write a subscription row
-- for their own org. TRUNCATE bypasses RLS entirely.
-- After 027: anon has nothing; authenticated keeps SELECT only (own org via RLS); service_role unchanged.
-- Idempotent. Rollback: restore the pre-027 grants (ALL to anon, authenticated) and the "own org data" FOR ALL policy (see header of 025/001).

BEGIN;

REVOKE ALL ON TABLE public.users         FROM anon;
REVOKE ALL ON TABLE public.subscriptions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.users         FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.subscriptions FROM authenticated;
GRANT SELECT ON TABLE public.users         TO authenticated;
GRANT SELECT ON TABLE public.subscriptions TO authenticated;

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users: own org data"         ON public.users;
DROP POLICY IF EXISTS "subscriptions: own org data" ON public.subscriptions;
DROP POLICY IF EXISTS "users: own org read"         ON public.users;
DROP POLICY IF EXISTS "subscriptions: own org read" ON public.subscriptions;

CREATE POLICY "users: own org read" ON public.users
  FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "subscriptions: own org read" ON public.subscriptions
  FOR SELECT TO authenticated USING (org_id = public.current_org_id());

COMMIT;
