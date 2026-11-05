import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { computeAccess } from '@/lib/access';
import { setAccessLocked } from '@/lib/accessLock';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { DEMO_ADMIN_EMAILS } from '@/admin/config';
import { useOnline } from '@/hooks/useOnline';
import { isNetworkError } from '@/lib/auth/authFailure';
import { readLastAccess, writeLastAccess, offlineAccess } from '@/lib/lastAccess';

const FORCE_KEY = 'atlas.qa.access';
const FORCE_VALUES = ['expired', 'trial', 'paid'];

/**
 * Local demo / QA builds only (no Supabase, e.g. VITE_ALLOW_LOCAL_DEMO=true): ?atlas_access=expired|trial|paid
 * forces a state and remembers it in this browser; ?atlas_access=off clears it. Ignored with a real backend.
 */
export function readForcedAccess() {
  if (isSupabaseConfigured || typeof window === 'undefined') return '';
  try {
    const q = new URLSearchParams(window.location.search).get('atlas_access');
    if (q !== null) {
      if (FORCE_VALUES.includes(q)) localStorage.setItem(FORCE_KEY, q);
      else localStorage.removeItem(FORCE_KEY);
    }
    const v = localStorage.getItem(FORCE_KEY) || '';
    return FORCE_VALUES.includes(v) ? v : '';
  } catch { return ''; }
}

/**
 * Local demo accounts (no Supabase) carry only created_date, never a real trial: do not lock them by the
 * signup + 14 days fallback. A demo blob with an explicit trial_ends_at / subscription_status is honoured.
 */
export function accessUser(user) {
  if (!user || isSupabaseConfigured) return user;
  return { ...user, created_date: undefined, created_at: undefined };
}

/**
 * Platform staff (platform_admins, migration 011) keep full access. Fails closed: a server error → not admin.
 * A network failure is NOT an answer (audit 05.11 NET-1): it throws, and useAccess falls back to the last
 * known access instead of locking the owner out with the paywall.
 */
async function checkPlatformAdmin(user) {
  if (!user) return false;
  if (!isSupabaseConfigured || !supabase) return DEMO_ADMIN_EMAILS.includes(String(user.email || '').toLowerCase());
  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) {
    if (isNetworkError(error) || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      const e = new Error('platform admin check failed (network)');
      e.isTransient = true;
      throw e;
    }
    return false;
  }
  return data === true;
}

/**
 * Access for the signed-in account (src/lib/access.js). The admin lookup runs only for an account that
 * would otherwise be locked, so trial and paying users pay nothing extra.
 */
export function useAccess() {
  const { user: authUser } = useAuth();
  const online = useOnline();
  const user = accessUser(authUser);
  const force = readForcedAccess();
  const base = computeAccess(user, { force });
  const needAdmin = Boolean(user && base.state === 'expired' && !user.is_platform_admin);
  const admin = useQuery({
    queryKey: ['access', 'platform-admin', user?.id || user?.email || ''],
    queryFn: () => checkPlatformAdmin(user),
    enabled: needAdmin && online,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const isAdmin = Boolean(user?.is_platform_admin) || admin.data === true;
  const access = computeAccess(user, { force, isAdmin });
  // Audit 05.11 NET-1: no network (or the admin lookup failed on the network) is never "expired".
  // Keep the last access this device saw online for this account; with none, keep the app open (read-only
  // in practice: every write fails offline, and the database stays the real gate).
  const unknown = needAdmin && admin.data === undefined && (!online || (admin.isError && admin.error?.isTransient));
  const uid = user?.id || '';
  useEffect(() => {
    if (uid && online && !force && !unknown && !(needAdmin && admin.isLoading)) writeLastAccess(uid, access);
  }, [uid, online, force, unknown, needAdmin, admin.isLoading, access.locked, access.state, access.isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps
  if (unknown) return { ...offlineAccess(access, readLastAccess(uid)), checking: false, offline: true };
  return { ...access, checking: needAdmin && online && admin.isLoading, offline: !online };
}

/** Keeps the API-layer write lock (src/lib/accessLock.js) in step with the account. Mounted once in App. */
export function AccessSync() {
  const { locked, checking } = useAccess();
  // While the admin lookup runs, an expired account is treated as locked (fail closed).
  const value = locked || checking;
  useEffect(() => { setAccessLocked(value); }, [value]);
  return null;
}
