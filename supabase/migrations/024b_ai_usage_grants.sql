-- 024b (applied 20.10.2026 with 024): tighten Supabase default grants.
-- TRUNCATE bypasses RLS, and anon had EXECUTE on ai_usage_bump via default privileges.
REVOKE ALL ON public.ai_usage FROM anon, authenticated;
GRANT SELECT ON public.ai_usage TO authenticated;
REVOKE ALL ON FUNCTION public.ai_usage_bump(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_usage_bump(integer) TO authenticated;
