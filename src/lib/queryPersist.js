/**
 * Stale-while-revalidate across reloads.
 *
 * The last successful answers of the owner's own queries are kept in localStorage (one entry per user)
 * and put back into React Query when the app boots, marked stale. A screen therefore paints the owner's
 * data at once and refreshes it from Supabase in the background, instead of waiting for every request
 * on every visit. Nothing about how a screen looks changes; only where its first data comes from.
 *
 * Safety:
 *   - keyed by the signed-in user id from the stored session; another user's copy is never shown
 *   - everything restored is invalidated, so it is always re-fetched on mount (no stale-forever data)
 *   - dropped on sign-out (AuthContext.clearSessionState) and after MAX_AGE
 *   - size-capped; a too-big query is simply not kept
 */
import { dehydrate, hydrate } from '@tanstack/react-query';
import { storedSessionUser, isSupabaseConfigured } from '@/api/supabaseClient';

const PREFIX = 'atlas.qc.v1.';
const MAX_AGE_MS = 3 * 24 * 3600_000;
const MAX_TOTAL_CHARS = 1_800_000;   // localStorage is ~5 MB per origin; stay well under it
const MAX_QUERY_CHARS = 600_000;
/** Query keys that must always come fresh from the server (account / admin / support / one-off flows). */
const SKIP_KEY = /admin|platform|support|account|status|tour|onboarding|whoami|billing|subscription|ai-|chat|guest-token|public/i;

function currentUid() {
  if (!isSupabaseConfigured) return null;
  return storedSessionUser()?.id || null;
}

/** Only data that survives JSON unchanged (no Date / Map / Set / class instances) may be stored. */
function isPlainJson(v, depth = 0) {
  if (v === null) return true;
  const t = typeof v;
  if (t === 'string' || t === 'boolean') return true;
  if (t === 'number') return Number.isFinite(v);
  if (t !== 'object' || depth > 12) return false;
  if (Array.isArray(v)) return v.every((x) => isPlainJson(x, depth + 1));
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) return false;
  for (const k in v) {
    if (v[k] === undefined) continue;
    if (!isPlainJson(v[k], depth + 1)) return false;
  }
  return true;
}

function keep(query) {
  if (query.state.status !== 'success' || query.state.data === undefined) return false;
  if (!isPlainJson(query.state.data)) return false;
  if (query.meta?.persist === false) return false;
  let k = '';
  try { k = JSON.stringify(query.queryKey); } catch { return false; }
  return !SKIP_KEY.test(k);
}

/** Put the last copy for the signed-in user into the cache (stale). Call once, before the first render. */
export function restoreQueryCache(queryClient) {
  const uid = currentUid();
  if (!uid) return false;
  try {
    const raw = localStorage.getItem(PREFIX + uid);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved?.state || Date.now() - (saved.at || 0) > MAX_AGE_MS) {
      localStorage.removeItem(PREFIX + uid);
      return false;
    }
    hydrate(queryClient, saved.state);
    // Restored = shown first, then always refetched when a screen mounts it.
    queryClient.invalidateQueries({ refetchType: 'none' });
    return true;
  } catch {
    try { localStorage.removeItem(PREFIX + uid); } catch { /* ignore */ }
    return false;
  }
}

let timer = null;
let started = false;

function save(queryClient) {
  timer = null;
  const uid = currentUid();
  if (!uid) return;
  try {
    const state = dehydrate(queryClient, { shouldDehydrateQuery: keep, shouldDehydrateMutation: () => false });
    const sized = [];
    for (const q of state.queries) {
      let len = 0;
      try { len = JSON.stringify(q).length; } catch { continue; }
      if (len <= MAX_QUERY_CHARS) sized.push([len, q]);
    }
    // newest first until the budget is used up
    sized.sort((a, b) => (b[1].state.dataUpdatedAt || 0) - (a[1].state.dataUpdatedAt || 0));
    let total = 0;
    const queries = [];
    for (const [len, q] of sized) {
      if (total + len > MAX_TOTAL_CHARS) continue;
      total += len;
      queries.push(q);
    }
    const payload = JSON.stringify({ at: Date.now(), state: { mutations: [], queries } });
    // only this user's copy is kept on the device
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && k !== PREFIX + uid) localStorage.removeItem(k);
    }
    localStorage.setItem(PREFIX + uid, payload);
  } catch {
    /* quota / private mode: the app works exactly as before, just without the head start */
  }
}

/** Keep the stored copy up to date (throttled, written when the browser is idle). */
export function startQueryPersist(queryClient) {
  if (started || typeof window === 'undefined' || !isSupabaseConfigured) return;
  started = true;
  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => save(queryClient), { timeout: 3000 });
      else save(queryClient);
    }, 1500);
  };
  queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'updated' && event.action?.type === 'success') schedule();
  });
  // a tab being closed / backgrounded right after a change still keeps it
  window.addEventListener('pagehide', () => { if (timer) { clearTimeout(timer); save(queryClient); } });
}

/** Sign-out / account deletion: remove every stored copy on this device. */
export function clearPersistedQueries() {
  if (timer) { clearTimeout(timer); timer = null; }
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
