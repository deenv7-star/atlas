-- 012: admin console counts the app's real units.
-- The customer app (and onboarding) create rentable units as public.properties rows; the legacy
-- public.units table is empty on the live project, so /admin showed "0 יחידות" for every customer.
-- admin_list_customers.units_count and admin_get_customer.units now use properties when an org has
-- no units rows (orgs that do use units keep the old behaviour); recent bookings name the property.
-- Function bodies only (same signatures, same SECURITY DEFINER + search_path, same grants). Re-runnable.
-- Applied to the live project 18 Oct 2026.

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
         -- the app's rentable units are properties rows; the legacy units table is used only when an org has rows there
         COALESCE(NULLIF((SELECT COUNT(*)::INT FROM public.units x WHERE x.org_id = o.id), 0),
                  (SELECT COUNT(*)::INT FROM public.properties x WHERE x.org_id = o.id)),
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
                       FROM public.units u LEFT JOIN public.properties pr ON pr.id = u.property_id WHERE u.org_id = p_org),
                      -- no legacy units rows: the org's properties are its units (that is what onboarding and the app create)
                      (SELECT jsonb_agg(jsonb_build_object('id', pr.id, 'name', pr.name, 'property', NULL, 'status', NULL,
                         'base_price', pr.base_price, 'max_guests', pr.max_guests) ORDER BY pr.name)
                       FROM public.properties pr WHERE pr.org_id = p_org), '[]'::jsonb),
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
               'status', b.status, 'total_price', b.total_price, 'source', b.source, 'unit', COALESCE(u.name, pr.name),
               'guest_initials', upper(left(split_part(COALESCE(b.guest_name, ''), ' ', 1), 1) || left(split_part(COALESCE(b.guest_name, ''), ' ', 2), 1))) AS r
        FROM public.bookings b LEFT JOIN public.units u ON u.id = b.unit_id LEFT JOIN public.properties pr ON pr.id = b.property_id
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

NOTIFY pgrst, 'reload schema';
