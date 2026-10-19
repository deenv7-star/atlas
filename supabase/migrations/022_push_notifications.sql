-- =============================================================================
-- 022: push notifications for new bookings, iCal bookings and leads (feat/pwa-install-push)
--
-- NOT APPLIED. Needs Deen's approval. Additive only: one new table, one new function, two AFTER INSERT
-- triggers. No existing column, policy or row changes. Re-runnable.
--
-- Requires: 015_cron_jobs.sql (public.atlas_call_edge + pg_net + Vault secret 'atlas_cron_secret'),
--           014_real_core.sql (bookings.external_sync_id / external_uid).
-- Deploy together with: supabase/functions/send-push (see qa/pwa/setup.md in the project for the order).
--
-- push_subscriptions   one row per device / browser that tapped "הפעל התראות"
--   endpoint, p256dh, auth   the browser's PushSubscription (public data; useless without our VAPID private key)
--   prefs                    which kinds this device wants: {"bookings":true,"leads":true,"ical":true}
--   failure_count / disabled_at   send-push disables a device after repeated failures and deletes it on 404/410
--
-- Who can do what (RLS)
--   authenticated: SELECT / INSERT / UPDATE / DELETE only their own rows (user_id = auth.uid()) and only for
--     their own organization (org_id = current_org_id()). Nobody can read or add another user's devices.
--   anon: nothing. send-push uses the service role.
--
-- Triggers
--   AFTER INSERT on bookings and on leads -> public.atlas_push_on_insert() -> atlas_call_edge('send-push', ...)
--   pg_net queues the HTTP call, so the insert never waits for it, and any error is swallowed with a WARNING:
--   a booking / lead insert can never fail because of notifications.
--   Skipped cheaply in SQL when the organization has no enabled device.
--   The inserting user (auth.uid(), null for the guest booking page / iCal cron) is passed as "actor" so
--   send-push does not notify the person who just typed the booking in.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  endpoint       TEXT NOT NULL UNIQUE CHECK (endpoint ~ '^https://'),
  p256dh         TEXT NOT NULL CHECK (length(p256dh) BETWEEN 80 AND 100),
  auth           TEXT NOT NULL CHECK (length(auth) BETWEEN 16 AND 32),
  prefs          JSONB NOT NULL DEFAULT '{"bookings": true, "leads": true, "ical": true}'::jsonb,
  platform       TEXT CHECK (platform IS NULL OR platform IN ('ios', 'android', 'desktop', 'other')),
  user_agent     TEXT CHECK (user_agent IS NULL OR length(user_agent) <= 400),
  installed      BOOLEAN NOT NULL DEFAULT FALSE,     -- opened as the installed app when it subscribed
  failure_count  INTEGER NOT NULL DEFAULT 0,
  disabled_at    TIMESTAMPTZ,
  last_sent_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subs_org ON public.push_subscriptions (org_id) WHERE disabled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions: select own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: insert own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: update own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions: delete own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions: select own" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "push_subscriptions: insert own" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND org_id = public.current_org_id());
CREATE POLICY "push_subscriptions: update own" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND org_id = public.current_org_id());
CREATE POLICY "push_subscriptions: delete own" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON public.push_subscriptions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

-- A device that moves to another account (sign out, sign in as someone else) re-registers the same endpoint.
-- The UNIQUE endpoint + this definer RPC let the app claim it without being able to read the old owner's row.
CREATE OR REPLACE FUNCTION public.push_subscribe(
  p_endpoint TEXT, p_p256dh TEXT, p_auth TEXT, p_prefs JSONB DEFAULT NULL,
  p_platform TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL, p_installed BOOLEAN DEFAULT FALSE
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID := public.current_org_id();
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL OR v_org IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.push_subscriptions AS s (user_id, org_id, endpoint, p256dh, auth, prefs, platform, user_agent, installed)
  VALUES (auth.uid(), v_org, p_endpoint, p_p256dh, p_auth,
          COALESCE(p_prefs, '{"bookings": true, "leads": true, "ical": true}'::jsonb),
          p_platform, left(p_user_agent, 400), COALESCE(p_installed, FALSE))
  ON CONFLICT (endpoint) DO UPDATE SET
    user_id = auth.uid(), org_id = v_org, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
    prefs = COALESCE(p_prefs, s.prefs), platform = EXCLUDED.platform, user_agent = EXCLUDED.user_agent,
    installed = EXCLUDED.installed, failure_count = 0, disabled_at = NULL, updated_at = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.push_subscribe(TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, BOOLEAN) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.push_subscribe(TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, BOOLEAN) TO authenticated;

-- ─── trigger: new booking / lead -> send-push ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.atlas_push_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_kind TEXT := TG_ARGV[0];  -- 'booking' | 'lead'
BEGIN
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.push_subscriptions WHERE org_id = NEW.org_id AND disabled_at IS NULL) THEN
      RETURN NEW;
    END IF;
    -- cancelled / block rows that are not real stays never notify (iCal "blocked" rows are decided in send-push)
    IF v_kind = 'booking' AND upper(coalesce(NEW.status, '')) IN ('CANCELLED', 'CANCELED', 'DECLINED') THEN
      RETURN NEW;
    END IF;
    PERFORM public.atlas_call_edge('send-push', jsonb_build_object(
      'kind', v_kind, 'id', NEW.id, 'org_id', NEW.org_id, 'actor', auth.uid()
    ));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'atlas_push_on_insert (%): %', v_kind, SQLERRM;
  END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.atlas_push_on_insert() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_push_new_booking ON public.bookings;
CREATE TRIGGER trg_push_new_booking AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.atlas_push_on_insert('booking');

DROP TRIGGER IF EXISTS trg_push_new_lead ON public.leads;
CREATE TRIGGER trg_push_new_lead AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.atlas_push_on_insert('lead');

-- ─── rollback (run by hand if ever needed) ────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_push_new_booking ON public.bookings;
-- DROP TRIGGER IF EXISTS trg_push_new_lead ON public.leads;
-- DROP FUNCTION IF EXISTS public.atlas_push_on_insert();
-- DROP FUNCTION IF EXISTS public.push_subscribe(TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, BOOLEAN);
-- DROP TABLE IF EXISTS public.push_subscriptions;
