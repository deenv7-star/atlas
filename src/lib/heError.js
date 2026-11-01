/**
 * COPY-004 (01.11.2026): never show a raw English/technical error to the owner ("Failed to fetch",
 * "duplicate key value…"). A message is shown only when it is already Hebrew (our own copy, or a server
 * message we wrote); otherwise the caller's Hebrew fallback, which says what happened and what to do.
 * Same rule as UpdatePassword.jsx.
 */
const HEBREW = /[\u0590-\u05FF]/;

export function heError(err, fallback) {
  const msg = typeof err === 'string' ? err : String(err?.message || err?.error || '');
  return msg && HEBREW.test(msg) && msg.length <= 200 ? msg : fallback;
}

export const NET_FALLBACK = 'לא הצלחנו לשמור. בדקו את החיבור לאינטרנט ונסו שוב.';
