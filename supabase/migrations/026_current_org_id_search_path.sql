-- 026 (21.10.2026, audit-1 #16 / S1): current_org_id() is SECURITY DEFINER without a fixed search_path
-- (Supabase linter function_search_path_mutable). Body already uses public.profiles + auth.uid(), so zero behaviour change.
-- Idempotent. Rollback: ALTER FUNCTION public.current_org_id() RESET search_path;
ALTER FUNCTION public.current_org_id() SET search_path = public, pg_temp;
