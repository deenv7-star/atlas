/**
 * Client-side auth rate limiting: max 5 attempts per minute per email.
 */
const ATTEMPTS = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;

export function checkRateLimit(email) {
  const key = (email || '').toLowerCase().trim();
  if (!key) return { allowed: true };
  const now = Date.now();
  let record = ATTEMPTS.get(key);
  if (!record) return { allowed: true };
  record.attempts = record.attempts.filter(t => now - t < WINDOW_MS);
  if (record.attempts.length >= MAX_ATTEMPTS) {
    const oldest = Math.min(...record.attempts);
    return {
      allowed: false,
      retryAfter: Math.ceil((oldest + WINDOW_MS - now) / 1000),
    };
  }
  return { allowed: true };
}

export function recordAttempt(email) {
  const key = (email || '').toLowerCase().trim();
  if (!key) return;
  const now = Date.now();
  let record = ATTEMPTS.get(key);
  if (!record) {
    record = { attempts: [] };
    ATTEMPTS.set(key, record);
  }
  record.attempts = record.attempts.filter(t => now - t < WINDOW_MS);
  record.attempts.push(now);
}

export function clearAttempts(email) {
  if (email) {
    ATTEMPTS.delete((email || '').toLowerCase().trim());
  } else {
    ATTEMPTS.clear();
  }
}
