/**
 * Audit 05.11 NET-1: the last access state this device saw ONLINE, per account, so a reload with no network
 * never shows the "trial ended" paywall to an owner who had the app open yesterday (or to platform staff,
 * whose is_platform_admin lookup cannot run offline). Pure, no imports: tests/unit can load it.
 */
const KEY = 'atlas.access.v1';
const MAX_AGE_MS = 30 * 24 * 3600_000;

export function readLastAccess(uid, now = Date.now()) {
  if (!uid) return null;
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!c || c.uid !== uid || now - (c.at || 0) > MAX_AGE_MS) return null;
    return c;
  } catch { return null; }
}

export function writeLastAccess(uid, access, now = Date.now()) {
  if (!uid || !access) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ uid, at: now, locked: Boolean(access.locked), state: access.state, isAdmin: Boolean(access.isAdmin) }));
  } catch { /* quota / private mode */ }
}

export function dropLastAccess() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/**
 * Access to use while the network is down and the live answer is unknown.
 * Known and locked → stay locked (a paywall seen online stays). Known open, or nothing known → open.
 */
export function offlineAccess(access, last) {
  if (last && last.locked) return { ...access, locked: true };
  const state = last?.state && last.state !== 'expired' ? last.state : (access.state === 'expired' ? 'grace' : access.state);
  return { ...access, state, locked: false, isAdmin: Boolean(last?.isAdmin) || access.isAdmin, reason: '' };
}

/**
 * perf/cold-start: while the platform-admin lookup for an expired account is still running, may the app open from
 * what this device last saw? Only when that was this same account (readLastAccess checks the uid), open, as staff.
 * A trial user whose trial has since ended is never opened early.
 */
export function trustLastStaffAccess(last) {
  return Boolean(last && last.locked === false && last.isAdmin === true);
}
