/**
 * Which database-backed features the connected backend supports.
 *
 * The live Supabase project has 008 (guest pages + direct booking), 009 (expenses), 010–013 and 014/015
 * (real core: iCal sync, message queue, check-in, pricing rules, pg_cron). Local demo mode (no Supabase) has
 * every feature except the server-only real core.
 *
 * 010 (organizations.settings) and 011 (platform admin) do NOT use the level: they are detected at
 * runtime (orgSettings.js probes the column, AdminGate asks admin_whoami), so they work on a database
 * that has 010/011 but not 008/009, and fall back calmly where they are missing.
 */
import { isSupabaseConfigured } from '@/api/supabaseClient';

// The live database is at 015 (008–015 applied 18.10.2026 by feat/real-core). The env var can only raise it.
const LIVE_LEVEL = 15;
const LEVEL = Math.max(Number(import.meta.env.VITE_DB_SCHEMA_LEVEL) || 0, LIVE_LEVEL);

export const DB_FEATURES = {
  guestPages: !isSupabaseConfigured || LEVEL >= 8,
  directBooking: !isSupabaseConfigured || LEVEL >= 8,
  expenses: !isSupabaseConfigured || LEVEL >= 9,
  // 014 real core: server iCal sync/export, message queue, online check-in, pricing rules, il_calendar.
  // These need the server (edge functions), so they are Supabase-only (demo mode shows an honest note).
  realCore: isSupabaseConfigured && LEVEL >= 14,
};

/** True for "relation/column/function does not exist" style errors from PostgREST / Postgres. */
export function isMissingSchemaError(e) {
  const code = String(e?.code || '');
  return ['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(code)
    || e?.status === 404
    || /does not exist|could not find|schema cache/i.test(String(e?.message || ''));
}
