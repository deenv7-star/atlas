/**
 * The password the owner just typed on /register, held IN MEMORY ONLY (a module variable),
 * so the "check your email" screen can sign in by itself once the email is confirmed on
 * another device. Never written to localStorage / sessionStorage / history state.
 * A page reload drops it (by design); the verify screen then asks for the password instead.
 */
const TTL_MS = 30 * 60 * 1000;
let pending = null;

export function setPendingCredentials(email, password) {
  if (!email || !password) { pending = null; return; }
  pending = { email: String(email).trim().toLowerCase(), password: String(password), at: Date.now() };
}

/** { email, password } for this email, or null (none, other email, or older than 30 minutes). */
export function getPendingCredentials(email) {
  if (!pending) return null;
  if (Date.now() - pending.at > TTL_MS) { pending = null; return null; }
  if (email && String(email).trim().toLowerCase() !== pending.email) return null;
  return { email: pending.email, password: pending.password };
}

export function clearPendingCredentials() { pending = null; }
