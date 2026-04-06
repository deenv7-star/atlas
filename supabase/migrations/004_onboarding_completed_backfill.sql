-- Users get organization_id from handle_new_user on signup, so onboarding_completed=false
-- alone does not mean "must see wizard". Mark complete when the org already has data.
UPDATE public.profiles p
SET onboarding_completed = true
WHERE COALESCE(p.onboarding_completed, false) = false
  AND p.organization_id IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM public.properties x WHERE x.org_id = p.organization_id LIMIT 1)
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.org_id = p.organization_id LIMIT 1)
    OR EXISTS (SELECT 1 FROM public.leads l WHERE l.org_id = p.organization_id LIMIT 1)
  );
