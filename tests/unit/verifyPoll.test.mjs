import test from 'node:test';
import assert from 'node:assert/strict';
import { VERIFY_POLL as C, nextPollDelay, canCheckNow, classifySignIn, baseInterval, windowAllowsAt } from '../../src/lib/auth/verifyPoll.js';

/** Run the schedule with every check answering "email not confirmed"; return attempt timestamps. */
function simulate({ failAt = () => false, focusAt = [] } = {}) {
  const s = { startedAt: 0, attempts: [], failures: 0 };
  let now = 0;
  const focus = [...focusAt];
  for (;;) {
    const d = nextPollDelay(s, now);
    if (d == null) break;
    const at = now + d;
    // A focus check cancels the timer and reschedules, exactly like the hook.
    if (focus.length && focus[0] < at) { now = focus.shift(); if (canCheckNow(s, now)) s.attempts.push(now); continue; }
    now = at;
    s.attempts.push(now);
    s.failures = failAt(now) ? s.failures + 1 : 0;
  }
  return s.attempts;
}

test('starts fast: first check after 3s, ~3s apart during the first 30s', () => {
  const s = { startedAt: 0, attempts: [], failures: 0 };
  assert.equal(nextPollDelay(s, 0), 3000);
  const a = simulate();
  assert.deepEqual(a.slice(0, 4), [3000, 6000, 9000, 12000]);
  assert.equal(baseInterval(10_000), 3000);
  assert.equal(baseInterval(60_000), 10000);
  assert.equal(baseInterval(400_000), 20000);
});

test('stops after 15 minutes', () => {
  const a = simulate();
  assert.ok(Math.max(...a) < C.stopAfterMs);
  assert.equal(nextPollDelay({ startedAt: 0, attempts: a, failures: 0 }, C.stopAfterMs), null);
});

test('never more than maxPerWindow checks in any 5-minute window (Supabase limit 30/5min)', () => {
  const a = simulate({ focusAt: Array.from({ length: 200 }, (_, i) => 1000 + i * 2700) });
  for (const t of a) {
    const n = a.filter((x) => x >= t && x < t + C.windowMs).length;
    assert.ok(n <= C.maxPerWindow, `window starting ${t} has ${n}`);
  }
  assert.ok(C.maxPerWindow < 30);
});

test('backs off exponentially on 429 / network errors', () => {
  const s = { startedAt: 0, attempts: [3000], failures: 1 };
  assert.equal(nextPollDelay(s, 3000), 30000);
  s.failures = 2; assert.equal(nextPollDelay(s, 3000), 60000);
  s.failures = 9; assert.equal(nextPollDelay(s, 3000), C.backoffMaxMs);
  assert.equal(canCheckNow({ startedAt: 0, attempts: [3000], failures: 1 }, 10000), false);
});

test('focus checks respect a minimum gap', () => {
  const s = { startedAt: 0, attempts: [3000], failures: 0 };
  assert.equal(canCheckNow(s, 4000), false);
  assert.equal(canCheckNow(s, 6000), true);
  assert.equal(windowAllowsAt([], 5), 5);
});

test('classifies Supabase sign-in results', () => {
  assert.equal(classifySignIn({ data: { session: { access_token: 'x' } }, error: null }), 'confirmed');
  assert.equal(classifySignIn({ data: {}, error: { code: 'email_not_confirmed', message: 'Email not confirmed', status: 400 } }), 'waiting');
  assert.equal(classifySignIn({ error: { message: 'Email not confirmed' } }), 'waiting');
  assert.equal(classifySignIn({ error: { status: 429, code: 'over_request_rate_limit' } }), 'rate_limited');
  assert.equal(classifySignIn({ error: { code: 'invalid_credentials', status: 400 } }), 'bad_credentials');
  assert.equal(classifySignIn({ error: { message: 'Failed to fetch' } }), 'error');
});
