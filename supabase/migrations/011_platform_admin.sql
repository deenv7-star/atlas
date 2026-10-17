-- =============================================================================
-- 011: ATLAS platform admin (owners / staff console at /admin)
--
-- NOT APPLIED. Needs Deen's approval. After applying, set VITE_DB_SCHEMA_LEVEL=11 on Vercel.
--
-- What it does (additive only, no drops, no data rewrites on customer tables):
--   1. New tables, all RLS-enabled with NO policies and no grants to anon/authenticated,
--      so they cannot be read or written through PostgREST directly by anyone:
--        platform_admins          who may use /admin (owner | admin | support)
--        platform_plans           the ₪ tiers (seeded with the landing prices)
--        platform_subscriptions   admin-side subscription state per organization
--        platform_charges         subscription charges / invoices ledger (manual for now)
--        platform_customer_notes  internal notes on a customer
--        admin_audit_log          append-only log of every admin action
--   2. SECURITY DEFINER functions (search_path pinned) that are the ONLY way in. Every one
--      starts with public.admin_require(<min role>) which raises 42501 for anyone who is not
--      in platform_admins. Customer tables get NO new RLS policies, so a platform admin's
--      own customer app still sees only their own org (no cross-org leak into /today etc.).
--   3. Write actions (extend trial, change plan, suspend) also update the columns the customer
--      app reads today (profiles.trial_ends_at / selected_plan / subscription_status and
--      organizations.subscription_plan) so the change is visible in the customer's app.
--   4. Bootstraps deenv7@gmail.com as owner and qa+hark@atlas-il.com as admin (if they exist).
--
-- Not trusted on purpose: public.users.is_platform_admin (003). That table's RLS policy is
-- "own org data FOR ALL", so any org member could set the flag on their own row.
-- =============================================================================

-- ─── tables ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('owner','admin','support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.platform_plans (
  key            TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  name_he        TEXT NOT NULL,
  price_monthly  INTEGER NOT NULL CHECK (price_monthly >= 0),
  price_yearly   INTEGER NOT NULL CHECK (price_yearly >= 0),   -- per month, billed yearly (landing)
  max_properties INTEGER,                                       -- NULL = unlimited
  description    TEXT,
  features       JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_popular     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.platform_plans (key, name, name_he, price_monthly, price_yearly, max_properties, description, features, is_popular, sort_order) VALUES
  ('starter',  'Starter',  'מתחיל', 399, 319, 3,    'למתחמים קטנים עד 3 נכסים', '["עד 3 נכסים","ניהול הזמנות","ניהול לידים","תשלומים בסיסיים"]', FALSE, 1),
  ('pro',      'Pro',      'מקצועי', 699, 559, 10,  'לעסקים צומחים עד 10 נכסים', '["עד 10 נכסים","כל תכונות Starter","אוטומציות חכמות","חוזים דיגיטליים","כל האינטגרציות"]', TRUE, 2),
  ('business', 'Business', 'עסקי',  999, 799, NULL, 'לרשתות ומתחמים גדולים', '["נכסים ללא הגבלה","כל תכונות Pro","API מותאם","מנהל חשבון אישי","תמיכה 24/7"]', FALSE, 3)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.platform_subscriptions (
  org_id               UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_key             TEXT NOT NULL DEFAULT 'starter' REFERENCES public.platform_plans(key) ON UPDATE CASCADE,
  status               TEXT NOT NULL DEFAULT 'trialing'
                       CHECK (status IN ('trialing','active','past_due','canceled','expired')),
  billing_cycle        TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  price_ils            INTEGER CHECK (price_ils IS NULL OR price_ils >= 0),  -- NULL = plan list price
  trial_ends_at        TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  provider             TEXT NOT NULL DEFAULT 'manual',
  provider_customer_id TEXT,
  suspended_at         TIMESTAMPTZ,
  suspended_reason     TEXT,
  canceled_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_charges (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount_ils     NUMERIC(10,2) NOT NULL CHECK (amount_ils >= 0),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','void')),
  method         TEXT NOT NULL DEFAULT 'manual' CHECK (method IN ('manual','card','bank_transfer','bit','cash','check')),
  description    TEXT,
  period_start   DATE,
  period_end     DATE,
  due_date       DATE,
  paid_at        TIMESTAMPTZ,
  failure_reason TEXT,
  provider       TEXT NOT NULL DEFAULT 'manual',
  provider_ref   TEXT,
  invoice_number TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_platform_charges_org ON public.platform_charges (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_charges_status ON public.platform_charges (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_customer_notes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  body         TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  author_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_platform_notes_org ON public.platform_customer_notes (org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID,          -- no FK on purpose: the log is immutable and must outlive deleted users
  actor_email TEXT,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  org_id      UUID,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_org ON public.admin_audit_log (org_id, created_at DESC);

-- Lock every new table: RLS on, no policies, no direct grants.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['platform_admins','platform_plans','platform_subscriptions',
                           'platform_charges','platform_customer_notes','admin_audit_log']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t);
  END LOOP;
END $$;
REVOKE ALL ON SEQUENCE public.admin_audit_log_id_seq FROM PUBLIC, anon, authenticated;

-- Audit log is append-only even for the definer functions.
CREATE OR REPLACE FUNCTION public.admin_audit_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_log is append-only' USING ERRCODE = '42501';
END $$;
DROP TRIGGER IF EXISTS trg_admin_audit_immutable ON public.admin_audit_log;
CREATE TRIGGER trg_admin_audit_immutable BEFORE UPDATE OR DELETE ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();

CREATE OR REPLACE TRIGGER trg_platform_subscriptions_updated_at
  BEFORE UPDATE ON public.platform_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── access helpers ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_role_rank(p_role TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_role WHEN 'owner' THEN 3 WHEN 'admin' THEN 2 WHEN 'support' THEN 1 ELSE 0 END;
$$;

-- Role of the calling user, or NULL. Never trusts a client-supplied value.
CREATE OR REPLACE FUNCTION public.platform_admin_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT role FROM public.platform_admins WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.admin_require(p_min_role TEXT DEFAULT 'support')
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  SELECT role INTO v_role FROM public.platform_admins WHERE user_id = auth.uid();
  IF v_role IS NULL OR public.admin_role_rank(v_role) < public.admin_role_rank(p_min_role) THEN
    RAISE EXCEPTION 'platform admin role % required', p_min_role USING ERRCODE = '42501';
  END IF;
  RETURN v_role;
END $$;

CREATE OR REPLACE FUNCTION public.admin_log(p_action TEXT, p_target_type TEXT, p_target_id TEXT, p_org UUID, p_details JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, target_type, target_id, org_id, details)
  VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), p_action, p_target_type, p_target_id, p_org, COALESCE(p_details, '{}'::jsonb));
END $$;

-- { user_id, email, role } for the caller, or NULL when they are not a platform admin.
CREATE OR REPLACE FUNCTION public.admin_whoami()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('user_id', a.user_id, 'email', a.email, 'full_name', a.full_name, 'role', a.role)
  FROM public.platform_admins a WHERE a.user_id = auth.uid();
$$;

-- ─── customers ───────────────────────────────────────────────────────────────
-- One row per organization with its owner, usage counts and effective subscription state.
CREATE OR REPLACE FUNCTION public.admin_list_customers()
RETURNS TABLE (
  org_id UUID, org_name TEXT, org_email TEXT, org_phone TEXT, created_at TIMESTAMPTZ,
  owner_id UUID, owner_name TEXT, owner_email TEXT, owner_phone TEXT,
  properties_count INTEGER, units_count INTEGER, bookings_count INTEGER, bookings_30d INTEGER,
  last_active_at TIMESTAMPTZ, plan_key TEXT, status TEXT, billing_cycle TEXT, price_ils INTEGER,
  trial_ends_at TIMESTAMPTZ, current_period_end TIMESTAMPTZ, provider TEXT,
  suspended_at TIMESTAMPTZ, suspended_reason TEXT, canceled_at TIMESTAMPTZ, onboarding_completed BOOLEAN
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN QUERY
  WITH own AS (
    SELECT o.id AS oid,
           COALESCE(o.owner_id, (SELECT p2.id FROM public.profiles p2 WHERE p2.organization_id = o.id ORDER BY p2.created_at LIMIT 1)) AS uid
    FROM public.organizations o
  )
  SELECT o.id, o.name, o.email, o.phone, o.created_at,
         own.uid, NULLIF(p.full_name, ''), COALESCE(au.email::TEXT, p.email), NULLIF(COALESCE(p.phone, o.phone), ''),
         (SELECT COUNT(*)::INT FROM public.properties x WHERE x.org_id = o.id),
         (SELECT COUNT(*)::INT FROM public.units x WHERE x.org_id = o.id),
         (SELECT COUNT(*)::INT FROM public.bookings x WHERE x.org_id = o.id),
         (SELECT COUNT(*)::INT FROM public.bookings x WHERE x.org_id = o.id AND x.created_at > NOW() - INTERVAL '30 days'),
         GREATEST(au.last_sign_in_at,
                  (SELECT MAX(x.updated_at) FROM public.bookings x WHERE x.org_id = o.id),
                  (SELECT MAX(x.updated_at) FROM public.leads x WHERE x.org_id = o.id)),
         COALESCE(ps.plan_key, NULLIF(p.selected_plan, 'trial'), o.subscription_plan, 'starter'),
         CASE
           WHEN ps.suspended_at IS NOT NULL THEN 'suspended'
           WHEN COALESCE(ps.status, p.subscription_status) IN ('active','paid') THEN 'active'
           WHEN COALESCE(ps.status, p.subscription_status) = 'past_due' THEN 'past_due'
           WHEN COALESCE(ps.status, p.subscription_status) IN ('canceled','cancelled','churned') THEN 'churned'
           WHEN COALESCE(ps.trial_ends_at, p.trial_ends_at, o.created_at + INTERVAL '14 days') < NOW() THEN 'expired'
           ELSE 'trialing'
         END,
         COALESCE(ps.billing_cycle, 'monthly'),
         ps.price_ils,
         COALESCE(ps.trial_ends_at, p.trial_ends_at, o.created_at + INTERVAL '14 days'),
         ps.current_period_end,
         COALESCE(ps.provider, 'manual'),
         ps.suspended_at, ps.suspended_reason, ps.canceled_at,
         COALESCE(p.onboarding_completed, FALSE)
  FROM public.organizations o
  JOIN own ON own.oid = o.id
  LEFT JOIN public.profiles p ON p.id = own.uid
  LEFT JOIN auth.users au ON au.id = own.uid
  LEFT JOIN public.platform_subscriptions ps ON ps.org_id = o.id
  ORDER BY o.created_at DESC;
END $$;

-- Everything the customer page needs. Guest names are reduced to initials ("view as" is read-only
-- and privacy-safe: no guest emails/phones, no message bodies, no payment details leave the org).
CREATE OR REPLACE FUNCTION public.admin_get_customer(p_org UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v JSONB;
BEGIN
  PERFORM public.admin_require('support');
  SELECT jsonb_build_object(
    'customer', (SELECT to_jsonb(c) FROM public.admin_list_customers() c WHERE c.org_id = p_org),
    'units', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', u.id, 'name', u.name, 'property', pr.name, 'status', u.status,
                         'base_price', u.base_price, 'max_guests', u.max_guests) ORDER BY pr.name, u.name)
                       FROM public.units u LEFT JOIN public.properties pr ON pr.id = u.property_id WHERE u.org_id = p_org), '[]'::jsonb),
    'usage', jsonb_build_object(
       'bookings_total', (SELECT COUNT(*) FROM public.bookings WHERE org_id = p_org),
       'bookings_30d',   (SELECT COUNT(*) FROM public.bookings WHERE org_id = p_org AND created_at > NOW() - INTERVAL '30 days'),
       'leads_total',    (SELECT COUNT(*) FROM public.leads WHERE org_id = p_org),
       'messages_total', (SELECT COUNT(*) FROM public.message_logs WHERE org_id = p_org),
       'revenue_ils',    (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings WHERE org_id = p_org AND status NOT IN ('CANCELLED','CANCELED')),
       'by_month', COALESCE((SELECT jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'),
                     'bookings', (SELECT COUNT(*) FROM public.bookings b WHERE b.org_id = p_org AND date_trunc('month', b.created_at) = m)) ORDER BY m)
                   FROM generate_series(date_trunc('month', NOW()) - INTERVAL '5 months', date_trunc('month', NOW()), INTERVAL '1 month') m), '[]'::jsonb)
    ),
    'recent_bookings', COALESCE((SELECT jsonb_agg(r ORDER BY r->>'check_in_date' DESC) FROM (
        SELECT jsonb_build_object('id', b.id, 'check_in_date', b.check_in_date, 'check_out_date', b.check_out_date,
               'status', b.status, 'total_price', b.total_price, 'source', b.source, 'unit', u.name,
               'guest_initials', upper(left(split_part(COALESCE(b.guest_name, ''), ' ', 1), 1) || left(split_part(COALESCE(b.guest_name, ''), ' ', 2), 1))) AS r
        FROM public.bookings b LEFT JOIN public.units u ON u.id = b.unit_id
        WHERE b.org_id = p_org ORDER BY b.check_in_date DESC NULLS LAST LIMIT 8) s), '[]'::jsonb),
    'charges', COALESCE((SELECT jsonb_agg(to_jsonb(ch) ORDER BY ch.created_at DESC) FROM public.platform_charges ch WHERE ch.org_id = p_org), '[]'::jsonb),
    'notes', COALESCE((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC) FROM public.platform_customer_notes n WHERE n.org_id = p_org), '[]'::jsonb),
    'audit', COALESCE((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC) FROM (
        SELECT * FROM public.admin_audit_log WHERE org_id = p_org ORDER BY created_at DESC LIMIT 50) a), '[]'::jsonb)
  ) INTO v;
  IF v->'customer' IS NULL OR v->'customer' = 'null'::jsonb THEN
    RAISE EXCEPTION 'organization not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v;
END $$;

-- Creates the platform_subscriptions row from the current effective state when it is missing.
CREATE OR REPLACE FUNCTION public.admin_ensure_subscription(p_org UUID)
RETURNS public.platform_subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE r public.platform_subscriptions; c RECORD;
BEGIN
  PERFORM public.admin_require('admin');
  SELECT * INTO r FROM public.platform_subscriptions WHERE org_id = p_org;
  IF FOUND THEN RETURN r; END IF;
  SELECT * INTO c FROM public.admin_list_customers() x WHERE x.org_id = p_org;
  IF NOT FOUND THEN RAISE EXCEPTION 'organization not found' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.platform_subscriptions (org_id, plan_key, status, trial_ends_at)
  VALUES (p_org,
          CASE WHEN EXISTS (SELECT 1 FROM public.platform_plans WHERE key = c.plan_key) THEN c.plan_key ELSE 'starter' END,
          CASE c.status WHEN 'active' THEN 'active' WHEN 'past_due' THEN 'past_due' WHEN 'churned' THEN 'canceled'
                        WHEN 'expired' THEN 'expired' ELSE 'trialing' END,
          c.trial_ends_at)
  RETURNING * INTO r;
  RETURN r;
END $$;

-- ─── customer actions (admin+) ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_extend_trial(p_org UUID, p_days INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE r public.platform_subscriptions; v_new TIMESTAMPTZ; v_owner UUID;
BEGIN
  PERFORM public.admin_require('admin');
  IF p_days IS NULL OR p_days < 1 OR p_days > 90 THEN
    RAISE EXCEPTION 'days must be between 1 and 90' USING ERRCODE = '22023';
  END IF;
  r := public.admin_ensure_subscription(p_org);
  v_new := GREATEST(COALESCE(r.trial_ends_at, NOW()), NOW()) + make_interval(days => p_days);
  UPDATE public.platform_subscriptions SET trial_ends_at = v_new,
         status = CASE WHEN status IN ('expired','trialing') THEN 'trialing' ELSE status END
   WHERE org_id = p_org;
  SELECT owner_id INTO v_owner FROM public.organizations WHERE id = p_org;
  UPDATE public.profiles SET trial_ends_at = v_new,
         subscription_status = CASE WHEN subscription_status IN ('active','paid') THEN subscription_status ELSE 'trialing' END
   WHERE organization_id = p_org AND (v_owner IS NULL OR id = v_owner);
  PERFORM public.admin_log('trial.extend', 'organization', p_org::TEXT, p_org,
          jsonb_build_object('days', p_days, 'from', r.trial_ends_at, 'to', v_new));
  RETURN jsonb_build_object('trial_ends_at', v_new);
END $$;

CREATE OR REPLACE FUNCTION public.admin_change_plan(p_org UUID, p_plan TEXT, p_cycle TEXT DEFAULT 'monthly', p_price_ils INTEGER DEFAULT NULL, p_status TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE r public.platform_subscriptions; v_owner UUID;
BEGIN
  PERFORM public.admin_require('admin');
  IF NOT EXISTS (SELECT 1 FROM public.platform_plans WHERE key = p_plan) THEN
    RAISE EXCEPTION 'unknown plan %', p_plan USING ERRCODE = '22023';
  END IF;
  IF p_cycle NOT IN ('monthly','yearly') THEN RAISE EXCEPTION 'bad cycle' USING ERRCODE = '22023'; END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('trialing','active','past_due','canceled') THEN
    RAISE EXCEPTION 'bad status' USING ERRCODE = '22023';
  END IF;
  r := public.admin_ensure_subscription(p_org);
  UPDATE public.platform_subscriptions
     SET plan_key = p_plan, billing_cycle = p_cycle, price_ils = p_price_ils,
         status = COALESCE(p_status, status),
         canceled_at = CASE WHEN p_status = 'canceled' THEN NOW() WHEN p_status IS NOT NULL THEN NULL ELSE canceled_at END,
         current_period_end = CASE WHEN p_status = 'active' AND current_period_end IS NULL
                                   THEN NOW() + CASE p_cycle WHEN 'yearly' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END
                                   ELSE current_period_end END
   WHERE org_id = p_org;
  UPDATE public.organizations SET subscription_plan = p_plan WHERE id = p_org;
  SELECT owner_id INTO v_owner FROM public.organizations WHERE id = p_org;
  UPDATE public.profiles SET selected_plan = p_plan,
         subscription_status = CASE WHEN p_status IS NULL THEN subscription_status ELSE p_status END
   WHERE organization_id = p_org AND (v_owner IS NULL OR id = v_owner);
  PERFORM public.admin_log('plan.change', 'organization', p_org::TEXT, p_org,
          jsonb_build_object('from', r.plan_key, 'to', p_plan, 'cycle', p_cycle, 'price_ils', p_price_ils, 'status', p_status));
  RETURN jsonb_build_object('plan_key', p_plan, 'billing_cycle', p_cycle);
END $$;

-- Suspension is recorded admin-side. NOTE: the customer app does not read it yet (see report:
-- needs a small follow-up that checks public.my_account_status() on login).
CREATE OR REPLACE FUNCTION public.admin_set_suspended(p_org UUID, p_suspended BOOLEAN, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE r public.platform_subscriptions;
BEGIN
  PERFORM public.admin_require('admin');
  r := public.admin_ensure_subscription(p_org);
  UPDATE public.platform_subscriptions
     SET suspended_at = CASE WHEN p_suspended THEN NOW() ELSE NULL END,
         suspended_reason = CASE WHEN p_suspended THEN NULLIF(trim(p_reason), '') ELSE NULL END
   WHERE org_id = p_org;
  PERFORM public.admin_log(CASE WHEN p_suspended THEN 'account.suspend' ELSE 'account.reactivate' END,
          'organization', p_org::TEXT, p_org, jsonb_build_object('reason', p_reason));
  RETURN jsonb_build_object('suspended', p_suspended);
END $$;

-- Read by the customer app (follow-up): is my org suspended? Returns only the caller's own org.
CREATE OR REPLACE FUNCTION public.my_account_status()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('suspended', ps.suspended_at IS NOT NULL, 'reason', ps.suspended_reason)
  FROM public.platform_subscriptions ps WHERE ps.org_id = public.current_org_id();
$$;

CREATE OR REPLACE FUNCTION public.admin_add_note(p_org UUID, p_body TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE n public.platform_customer_notes;
BEGIN
  PERFORM public.admin_require('support');
  INSERT INTO public.platform_customer_notes (org_id, body, author_id, author_email)
  VALUES (p_org, trim(p_body), auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()))
  RETURNING * INTO n;
  PERFORM public.admin_log('note.add', 'organization', p_org::TEXT, p_org, jsonb_build_object('note_id', n.id));
  RETURN to_jsonb(n);
END $$;

-- ─── charges / payments ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_charges(p_limit INTEGER DEFAULT 500)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN COALESCE((SELECT jsonb_agg(x ORDER BY x->>'created_at' DESC) FROM (
    SELECT to_jsonb(ch) || jsonb_build_object('org_name', o.name) AS x
    FROM public.platform_charges ch JOIN public.organizations o ON o.id = ch.org_id
    ORDER BY ch.created_at DESC LIMIT LEAST(GREATEST(p_limit, 1), 5000)) s), '[]'::jsonb);
END $$;

-- Records a charge by hand (no provider is connected; nothing is charged to any card).
CREATE OR REPLACE FUNCTION public.admin_record_charge(p_org UUID, p_amount NUMERIC, p_status TEXT DEFAULT 'paid',
  p_method TEXT DEFAULT 'bank_transfer', p_description TEXT DEFAULT NULL, p_period_start DATE DEFAULT NULL, p_period_end DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE ch public.platform_charges;
BEGIN
  PERFORM public.admin_require('admin');
  IF p_status NOT IN ('pending','paid','failed') THEN RAISE EXCEPTION 'bad status' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.platform_charges (org_id, amount_ils, status, method, description, period_start, period_end, paid_at, created_by)
  VALUES (p_org, p_amount, p_status, p_method, p_description, p_period_start, p_period_end,
          CASE WHEN p_status = 'paid' THEN NOW() END, auth.uid())
  RETURNING * INTO ch;
  PERFORM public.admin_log('charge.record', 'charge', ch.id::TEXT, p_org,
          jsonb_build_object('amount_ils', p_amount, 'status', p_status, 'method', p_method));
  RETURN to_jsonb(ch);
END $$;

CREATE OR REPLACE FUNCTION public.admin_mark_charge_paid(p_charge UUID, p_method TEXT DEFAULT 'bank_transfer')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE ch public.platform_charges;
BEGIN
  PERFORM public.admin_require('admin');
  UPDATE public.platform_charges SET status = 'paid', paid_at = NOW(), method = p_method, failure_reason = NULL
   WHERE id = p_charge AND status IN ('pending','failed')
  RETURNING * INTO ch;
  IF NOT FOUND THEN RAISE EXCEPTION 'charge not found or already settled' USING ERRCODE = 'P0002'; END IF;
  PERFORM public.admin_log('charge.mark_paid', 'charge', p_charge::TEXT, ch.org_id, jsonb_build_object('method', p_method, 'amount_ils', ch.amount_ils));
  RETURN to_jsonb(ch);
END $$;

-- ─── plans (owner edits, everyone reads) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_plans()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.sort_order) FROM public.platform_plans p), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_plan(p_key TEXT, p_price_monthly INTEGER, p_price_yearly INTEGER,
  p_max_properties INTEGER, p_description TEXT, p_features JSONB, p_is_popular BOOLEAN, p_is_active BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE before public.platform_plans; after public.platform_plans;
BEGIN
  PERFORM public.admin_require('owner');
  SELECT * INTO before FROM public.platform_plans WHERE key = p_key;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown plan' USING ERRCODE = 'P0002'; END IF;
  IF jsonb_typeof(COALESCE(p_features, '[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'features must be an array' USING ERRCODE = '22023'; END IF;
  UPDATE public.platform_plans SET price_monthly = p_price_monthly, price_yearly = p_price_yearly,
         max_properties = p_max_properties, description = p_description, features = COALESCE(p_features, '[]'::jsonb),
         is_popular = COALESCE(p_is_popular, FALSE), is_active = COALESCE(p_is_active, TRUE),
         updated_at = NOW(), updated_by = auth.uid()
   WHERE key = p_key RETURNING * INTO after;
  PERFORM public.admin_log('plan.update', 'plan', p_key, NULL,
          jsonb_build_object('before', jsonb_build_object('price_monthly', before.price_monthly, 'price_yearly', before.price_yearly),
                             'after',  jsonb_build_object('price_monthly', after.price_monthly,  'price_yearly', after.price_yearly)));
  RETURN to_jsonb(after);
END $$;

-- ─── team (owner manages) ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_team()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id', a.user_id, 'email', a.email, 'full_name', a.full_name,
            'role', a.role, 'created_at', a.created_at, 'last_sign_in_at', au.last_sign_in_at) ORDER BY public.admin_role_rank(a.role) DESC, a.created_at)
          FROM public.platform_admins a LEFT JOIN auth.users au ON au.id = a.user_id), '[]'::jsonb);
END $$;

-- The person must already have an ATLAS login (auth.users). No invite e-mail is sent.
CREATE OR REPLACE FUNCTION public.admin_set_team_member(p_email TEXT, p_role TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_uid UUID; v_email TEXT; v_old TEXT;
BEGIN
  PERFORM public.admin_require('owner');
  IF p_role NOT IN ('owner','admin','support') THEN RAISE EXCEPTION 'bad role' USING ERRCODE = '22023'; END IF;
  SELECT id, email INTO v_uid, v_email FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF v_uid IS NULL THEN RAISE EXCEPTION 'no ATLAS user with this email' USING ERRCODE = 'P0002'; END IF;
  SELECT role INTO v_old FROM public.platform_admins WHERE user_id = v_uid;
  IF v_old = 'owner' AND p_role <> 'owner' AND (SELECT COUNT(*) FROM public.platform_admins WHERE role = 'owner') <= 1 THEN
    RAISE EXCEPTION 'cannot demote the last owner' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.platform_admins (user_id, email, full_name, role, created_by)
  VALUES (v_uid, v_email, (SELECT NULLIF(full_name, '') FROM public.profiles WHERE id = v_uid), p_role, auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  PERFORM public.admin_log(CASE WHEN v_old IS NULL THEN 'team.add' ELSE 'team.role' END, 'admin', v_uid::TEXT, NULL,
          jsonb_build_object('email', v_email, 'from', v_old, 'to', p_role));
  RETURN jsonb_build_object('user_id', v_uid, 'role', p_role);
END $$;

CREATE OR REPLACE FUNCTION public.admin_remove_team_member(p_user UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_old public.platform_admins;
BEGIN
  PERFORM public.admin_require('owner');
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'cannot remove yourself' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_old FROM public.platform_admins WHERE user_id = p_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'not a team member' USING ERRCODE = 'P0002'; END IF;
  IF v_old.role = 'owner' AND (SELECT COUNT(*) FROM public.platform_admins WHERE role = 'owner') <= 1 THEN
    RAISE EXCEPTION 'cannot remove the last owner' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.platform_admins WHERE user_id = p_user;
  PERFORM public.admin_log('team.remove', 'admin', p_user::TEXT, NULL, jsonb_build_object('email', v_old.email, 'role', v_old.role));
  RETURN jsonb_build_object('removed', p_user);
END $$;

-- ─── audit + health ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_audit(p_limit INTEGER DEFAULT 200)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN COALESCE((SELECT jsonb_agg(to_jsonb(a) || jsonb_build_object('org_name', o.name) ORDER BY a.created_at DESC)
    FROM (SELECT * FROM public.admin_audit_log ORDER BY created_at DESC LIMIT LEAST(GREATEST(p_limit, 1), 2000)) a
    LEFT JOIN public.organizations o ON o.id = a.org_id), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_system_health()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.admin_require('support');
  RETURN jsonb_build_object(
    'db_time', NOW(),
    'db_version', current_setting('server_version'),
    'schema', jsonb_build_object(
      'guest_pages_008', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'guest_token'),
      'expenses_009',    to_regclass('public.expenses') IS NOT NULL,
      'org_settings_010', to_regclass('public.org_settings') IS NOT NULL,
      'platform_admin_011', TRUE),
    'counts', jsonb_build_object(
      'organizations', (SELECT COUNT(*) FROM public.organizations),
      'users', (SELECT COUNT(*) FROM auth.users),
      'bookings', (SELECT COUNT(*) FROM public.bookings),
      'signins_24h', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '24 hours')),
    'audit_events_24h', (SELECT COUNT(*) FROM public.audit_log WHERE created_at > NOW() - INTERVAL '24 hours'),
    'failed_charges_30d', (SELECT COUNT(*) FROM public.platform_charges WHERE status = 'failed' AND created_at > NOW() - INTERVAL '30 days')
  );
END $$;

-- ─── grants: only the entry points, only to signed-in users ─────────────────
DO $$
DECLARE f TEXT;
BEGIN
  FOR f IN SELECT p.oid::regprocedure::TEXT FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND (p.proname LIKE 'admin\_%' OR p.proname IN ('is_platform_admin','platform_admin_role','my_account_status'))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
-- Internal helpers: callable only from inside the definer functions (so nobody can forge audit rows).
REVOKE ALL ON FUNCTION public.admin_audit_immutable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_log(TEXT, TEXT, TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_ensure_subscription(UUID) FROM PUBLIC, anon, authenticated;

-- ─── bootstrap ───────────────────────────────────────────────────────────────
INSERT INTO public.platform_admins (user_id, email, role)
SELECT id, email, CASE WHEN lower(email) = 'deenv7@gmail.com' THEN 'owner' ELSE 'admin' END
FROM auth.users WHERE lower(email) IN ('deenv7@gmail.com', 'qa+hark@atlas-il.com')
ON CONFLICT (user_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
