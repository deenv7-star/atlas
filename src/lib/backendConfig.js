import { isSupabaseConfigured } from '@/api/supabaseClient';

/**
 * Production must use Supabase or a configured API URL (never silent localStorage demo).
 */
export function isProductionBackendConfigured() {
  if (!import.meta.env.PROD) return true;
  if (isSupabaseConfigured) return true;
  if (import.meta.env.VITE_API_URL) return true;
  if (import.meta.env.VITE_ALLOW_LOCAL_DEMO === 'true') return true;
  return false;
}
