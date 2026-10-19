/**
 * Polling plan for the "check your email" screen (pure, unit tested in tests/unit/verifyPoll.test.mjs).
 *
 * Each check is one signInWithPassword call, which Supabase counts against the per-IP
 * sign-in limit (30 per 5 minutes). So: fast at first, slower later, a hard sliding-window
 * cap well under the limit, exponential back-off on 429 / network errors, and a full stop
 * after 15 minutes. Returning to the tab (focus / visibility) triggers an extra check,
 * which still goes through the same cap.
 */
export const VERIFY_POLL = Object.freeze({
  fastMs: 3000,          // every 3 s …
  fastForMs: 30000,      // … for the first 30 s
  midMs: 10000,          // then every 10 s …
  midForMs: 180000,      // … until 3 minutes
  slowMs: 20000,         // then every 20 s
  stopAfterMs: 15 * 60 * 1000,
  windowMs: 5 * 60 * 1000,
  maxPerWindow: 22,      // leaves headroom under Supabase's 30 / 5 min for signup + a manual login
  minGapMs: 2500,        // focus / visibility checks never fire closer than this
  backoffBaseMs: 30000,
  backoffMaxMs: 4 * 60 * 1000,
});

export function baseInterval(elapsedMs, cfg = VERIFY_POLL) {
  if (elapsedMs < cfg.fastForMs) return cfg.fastMs;
  if (elapsedMs < cfg.midForMs) return cfg.midMs;
  return cfg.slowMs;
}

/** Earliest time the sliding-window cap allows another attempt (now when under the cap). */
export function windowAllowsAt(attempts, now, cfg = VERIFY_POLL) {
  const recent = attempts.filter((t) => now - t < cfg.windowMs).sort((a, b) => a - b);
  if (recent.length < cfg.maxPerWindow) return now;
  return recent[recent.length - cfg.maxPerWindow] + cfg.windowMs;
}

/**
 * Delay (ms) until the next scheduled check, or null when polling should stop.
 * state: { startedAt, attempts: number[] (timestamps), failures: consecutive 429/network errors }
 */
export function nextPollDelay(state, now, cfg = VERIFY_POLL) {
  const elapsed = now - state.startedAt;
  if (elapsed >= cfg.stopAfterMs) return null;
  const last = state.attempts.length ? Math.max(...state.attempts) : state.startedAt;
  const gap = state.failures > 0
    ? Math.min(cfg.backoffBaseMs * 2 ** (state.failures - 1), cfg.backoffMaxMs)
    : baseInterval(elapsed, cfg);
  const at = Math.max(last + gap, windowAllowsAt(state.attempts, now, cfg), now);
  if (at - state.startedAt >= cfg.stopAfterMs) return null;
  return at - now;
}

/** May an out-of-schedule check (tab focus / visibility) run right now? */
export function canCheckNow(state, now, cfg = VERIFY_POLL) {
  if (state.failures > 0) {
    const last = state.attempts.length ? Math.max(...state.attempts) : 0;
    if (now - last < Math.min(cfg.backoffBaseMs * 2 ** (state.failures - 1), cfg.backoffMaxMs)) return false;
  }
  const last = state.attempts.length ? Math.max(...state.attempts) : -Infinity;
  return now - last >= cfg.minGapMs && windowAllowsAt(state.attempts, now, cfg) <= now;
}

/** Classify a signInWithPassword result: 'confirmed' | 'waiting' | 'bad_credentials' | 'rate_limited' | 'error'. */
export function classifySignIn({ data, error } = {}) {
  if (!error) return data?.session ? 'confirmed' : 'error';
  const code = String(error.code || '').toLowerCase();
  const msg = String(error.message || '').toLowerCase();
  const status = Number(error.status) || 0;
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'waiting';
  if (status === 429 || code.includes('rate_limit') || code === 'too_many_requests' || msg.includes('rate limit') || msg.includes('too many')) return 'rate_limited';
  if (code === 'invalid_credentials' || code === 'invalid_grant' || msg.includes('invalid login credentials')) return 'bad_credentials';
  return 'error';
}
