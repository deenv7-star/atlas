import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_LOCK_PREF_KEY, LOCK_AFTER_MS, readLockPrefs, writeLockPrefs, lockAppliesTo, lockAtColdStart, lockOnResume,
  shouldOfferLock, lockErrorKind, lockErrorMessage,
} from '../../src/lib/nativeApp/appLockCore.js';

function memStore(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}

test('prefs: safe defaults, garbage, round trip', () => {
  assert.deepEqual(readLockPrefs(memStore()), { enabled: false, userId: '', offered: false });
  assert.deepEqual(readLockPrefs(memStore({ [APP_LOCK_PREF_KEY]: '{oops' })), { enabled: false, userId: '', offered: false });
  assert.deepEqual(readLockPrefs(null), { enabled: false, userId: '', offered: false });
  const s = memStore();
  writeLockPrefs(s, { enabled: true, userId: 'u1' });
  writeLockPrefs(s, { offered: true });
  assert.deepEqual(readLockPrefs(s), { enabled: true, userId: 'u1', offered: true });
});

test('lock applies only to the account that turned it on', () => {
  const p = { enabled: true, userId: 'u1' };
  assert.equal(lockAppliesTo(p, 'u1'), true);
  assert.equal(lockAppliesTo(p, 'u2'), false);
  assert.equal(lockAppliesTo(p, ''), true, 'auth still loading: stay covered');
  assert.equal(lockAppliesTo({ enabled: false, userId: 'u1' }, 'u1'), false);
});

test('cold start: native + enabled only (the web never locks)', () => {
  assert.equal(lockAtColdStart({ native: true, prefs: { enabled: true } }), true);
  assert.equal(lockAtColdStart({ native: false, prefs: { enabled: true } }), false);
  assert.equal(lockAtColdStart({ native: true, prefs: { enabled: false } }), false);
});

test('resume: more than 5 minutes in the background locks, 5 minutes or less does not', () => {
  const prefs = { enabled: true, userId: 'u1' };
  const t0 = 1_700_000_000_000;
  assert.equal(LOCK_AFTER_MS, 300000);
  assert.equal(lockOnResume({ prefs, userId: 'u1', backgroundedAt: t0, now: t0 + LOCK_AFTER_MS }), false);
  assert.equal(lockOnResume({ prefs, userId: 'u1', backgroundedAt: t0, now: t0 + LOCK_AFTER_MS + 1 }), true);
  assert.equal(lockOnResume({ prefs, userId: 'u1', backgroundedAt: t0, now: t0 + 30_000 }), false);
  assert.equal(lockOnResume({ prefs, userId: 'u1', backgroundedAt: 0, now: t0 }), false, 'never went to the background');
  assert.equal(lockOnResume({ prefs, userId: 'u2', backgroundedAt: t0, now: t0 + 10 * 60000 }), false, 'other account');
  assert.equal(lockOnResume({ prefs: { enabled: false }, userId: 'u1', backgroundedAt: t0, now: t0 + 10 * 60000 }), false);
});

test('offer once, after sign-in, on an app screen, never while locked', () => {
  const base = { native: true, signedIn: true, available: true, prefs: { enabled: false, offered: false }, path: '/dashboard', locked: false };
  assert.equal(shouldOfferLock(base), true);
  assert.equal(shouldOfferLock({ ...base, native: false }), false);
  assert.equal(shouldOfferLock({ ...base, signedIn: false }), false);
  assert.equal(shouldOfferLock({ ...base, available: false }), false);
  assert.equal(shouldOfferLock({ ...base, locked: true }), false);
  assert.equal(shouldOfferLock({ ...base, prefs: { enabled: false, offered: true } }), false);
  assert.equal(shouldOfferLock({ ...base, prefs: { enabled: true, offered: false } }), false);
  for (const p of ['/login', '/register', '/onboarding', '/setup', '/auth/callback', '/guest/x', '/book/abc']) {
    assert.equal(shouldOfferLock({ ...base, path: p }), false, p);
  }
});

test('error kinds → Hebrew lines', () => {
  assert.equal(lockErrorKind({ code: '16' }), 'cancel');
  assert.equal(lockErrorKind({ code: '15' }), 'cancel');
  assert.equal(lockErrorKind({ message: 'User canceled' }), 'cancel');
  assert.equal(lockErrorKind({ code: '10' }), 'error');
  assert.equal(lockErrorKind({ code: '2' }), 'lockout');
  assert.equal(lockErrorKind({ code: '14' }), 'unavailable');
  assert.equal(lockErrorKind({ message: 'Authentication not available' }), 'unavailable');
  assert.equal(lockErrorKind(new Error('boom')), 'error');
  assert.equal(lockErrorMessage('cancel'), '');
  assert.match(lockErrorMessage('error'), /לא זיהינו אתכם/);
  assert.match(lockErrorMessage('lockout', 'Touch ID'), /Touch ID/);
  for (const k of ['lockout', 'unavailable', 'error']) assert.doesNotMatch(lockErrorMessage(k), /[!]|\/ת/);
});
