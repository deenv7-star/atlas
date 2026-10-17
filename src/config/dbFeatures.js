/**
 * Which database-backed features the connected backend supports.
 *
 * The live Supabase project is at migration 007. Migrations 008 (guest pages + direct booking:
 * bookings.guest_token, properties.guest_info/public_slug/booking_page_enabled, public RPCs) and
 * 009 (expenses table) are not applied yet, so on Supabase those features stay off and their
 * screens show a calm "בקרוב" state instead of firing requests that would fail.
 * Local demo mode (no Supabase) has every feature.
 *
 * After applying a migration, raise VITE_DB_SCHEMA_LEVEL (or the default below) to turn it on.
 */
import { isSupabaseConfigured } from '@/api/supabaseClient';

const LEVEL = Number(import.meta.env.VITE_DB_SCHEMA_LEVEL) || 7;

export const DB_FEATURES = {
  guestPages: !isSupabaseConfigured || LEVEL >= 8,
  directBooking: !isSupabaseConfigured || LEVEL >= 8,
  expenses: !isSupabaseConfigured || LEVEL >= 9,
  /** organizations.settings jsonb (migration 010): business defaults from onboarding sync across devices */
  orgSettings: isSupabaseConfigured && LEVEL >= 10,
};

/** True for "relation/column/function does not exist" style errors from PostgREST / Postgres. */
export function isMissingSchemaError(e) {
  const code = String(e?.code || '');
  return ['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(code)
    || e?.status === 404
    || /does not exist|could not find|schema cache/i.test(String(e?.message || ''));
}
