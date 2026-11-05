/**
 * Launch audit 05.11 NET-2: with no network a save must fail at once with a clear message, never sit on
 * "שומרים…". Pure module (no imports) so supabaseClient.js and client.js can both use it without a cycle.
 */
export const OFFLINE_CODE = 'OFFLINE';
export const OFFLINE_SAVE_MESSAGE = 'אין חיבור לאינטרנט, ולכן השינוי לא נשמר. נסו שוב כשהחיבור יחזור.';

export function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function offlineError() {
  // A TypeError like a failed fetch, so every existing network-error check (isNetworkError) still matches.
  const e = new TypeError(OFFLINE_SAVE_MESSAGE);
  e.code = OFFLINE_CODE;
  e.isOffline = true;
  return e;
}

export function assertOnline() {
  if (isOffline()) throw offlineError();
}
