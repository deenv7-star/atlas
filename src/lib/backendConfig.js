import { isSupabaseConfigured } from '@/api/supabaseClient';

/**
 * Production: allow the app to load if Supabase is set, demo mode is on,
 * an explicit API URL is set, or same-origin API is allowed (default).
 * Set VITE_DISABLE_RELATIVE_API=true only if you deploy static UI with no /api proxy.
 */
export function isProductionBackendConfigured() {
  if (!import.meta.env.PROD) return true;
  if (isSupabaseConfigured) return true;
  if (import.meta.env.VITE_ALLOW_LOCAL_DEMO === 'true') return true;
  if (import.meta.env.VITE_API_URL) return true;
  if (import.meta.env.VITE_DISABLE_RELATIVE_API === 'true') return false;
  return true;
}
