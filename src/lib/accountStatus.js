/**
 * Is the signed-in customer's organization suspended by the ATLAS team?
 * Reads public.my_account_status() (migration 011, SECURITY DEFINER, returns only the caller's own
 * org). Without 011, without a session, or on any error it answers null and the app behaves as before.
 * Detected at runtime: a missing function turns the check off for the rest of the session.
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { isMissingSchemaError } from '@/config/dbFeatures';

let missing = false;
let cache = { key: '', at: 0, value: null };

export async function fetchAccountStatus() {
  if (!isSupabaseConfigured || !supabase || missing) return null;
  try {
    const { data: { session } = {} } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return null;
    if (cache.key === uid && Date.now() - cache.at < 30_000) return cache.value;
    const { data, error } = await supabase.rpc('my_account_status');
    if (error) {
      if (isMissingSchemaError(error)) missing = true;
      return null;
    }
    const value = data && typeof data === 'object' ? { suspended: Boolean(data.suspended), reason: data.reason || '' } : null;
    cache = { key: uid, at: Date.now(), value };
    return value;
  } catch {
    return null;
  }
}
