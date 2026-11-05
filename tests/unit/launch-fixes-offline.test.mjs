// Launch audit 05.11 NET-1 / NET-2: offline never shows the paywall to an owner who was open online; saves fail fast.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const { readLastAccess, writeLastAccess, offlineAccess, dropLastAccess } = await import('../../src/lib/lastAccess.js');
const { assertOnline, OFFLINE_SAVE_MESSAGE } = await import('../../src/lib/offline.js');
const { isNetworkError } = await import('../../src/lib/auth/authFailure.js');

const expired = { state: 'expired', locked: true, reason: 'trial_ended', isAdmin: false };

test('nothing known → open (never compute expired offline)', () => {
  dropLastAccess();
  const a = offlineAccess(expired, readLastAccess('u1'));
  assert.equal(a.locked, false);
  assert.notEqual(a.state, 'expired');
});

test('last seen open (paying / admin) → stays open offline', () => {
  writeLastAccess('u1', { state: 'paid', locked: false, isAdmin: false });
  assert.equal(offlineAccess(expired, readLastAccess('u1')).locked, false);
  writeLastAccess('u1', { state: 'expired', locked: false, isAdmin: true });
  const a = offlineAccess(expired, readLastAccess('u1'));
  assert.equal(a.locked, false);
  assert.equal(a.isAdmin, true);
});

test('last seen locked → stays locked offline', () => {
  writeLastAccess('u1', { state: 'expired', locked: true, isAdmin: false });
  assert.equal(offlineAccess(expired, readLastAccess('u1')).locked, true);
});

test('another account on the device is not reused', () => {
  writeLastAccess('u1', { state: 'paid', locked: false });
  assert.equal(readLastAccess('u2'), null);
});

test('offline save fails at once with Hebrew copy that still counts as a network error', () => {
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true, writable: true });
  assert.throws(() => assertOnline(), (e) => e.message === OFFLINE_SAVE_MESSAGE && isNetworkError(e));
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true, writable: true });
  assert.doesNotThrow(() => assertOnline());
});
