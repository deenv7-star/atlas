/**
 * COPY-004 (01.11.2026): never show a raw English/technical error to the owner ("Failed to fetch",
 * "duplicate key value…"). A message is shown only when it is already Hebrew (our own copy, or a server
 * message we wrote); otherwise the caller's Hebrew fallback, which says what happened and what to do.
 * Same rule as UpdatePassword.jsx.
 */
const HEBREW = /[\u0590-\u05FF]/;

export function heError(err, fallback) {
  // postgrest-js wraps a failed fetch as "<error.name>: <message>", so our own Hebrew timeout copy arrived
  // as "TimeoutError: החיבור איטי…" (fix-1104 QA): drop a leading English error name.
  const msg = (typeof err === 'string' ? err : String(err?.message || err?.error || '')).replace(/^[A-Za-z]*(Error|Exception)?:\s*(?=[^A-Za-z]*[\u0590-\u05FF])/, '');
  return msg && HEBREW.test(msg) && msg.length <= 200 ? msg : fallback;
}

export const NET_FALLBACK = 'לא הצלחנו לשמור. בדקו את החיבור לאינטרנט ונסו שוב.';
