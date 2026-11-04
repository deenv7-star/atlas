// Audit 04.11 #1: a network error on cold start must not sign the owner out. Run: npm run test:unit
import test from 'node:test';
import assert from 'node:assert/strict';
import { decideAuthFailure, isNetworkError, isSessionInvalid } from '../../src/lib/auth/authFailure.js';

const fetchFail = new TypeError('Failed to fetch');
const retryable = Object.assign(new Error('fetch failed'), { name: 'AuthRetryableFetchError', status: 0 });
const transientProfile = Object.assign(new Error('TypeError: Failed to fetch'), { isTransient: true });
const timeout = Object.assign(new Error('החיבור איטי מדי כרגע. נסו שוב בעוד רגע.'), { name: 'TimeoutError' });
const s500 = Object.assign(new Error('upstream'), { status: 503 });
const s401 = Object.assign(new Error('Not authenticated'), { status: 401 });
const refused = Object.assign(new Error('Invalid Refresh Token'), { name: 'AuthApiError', status: 400 });

test('network failures are recognised', () => {
  for (const e of [fetchFail, retryable, transientProfile, timeout, s500]) assert.equal(isNetworkError(e), true, e.message);
  assert.equal(isNetworkError(s401), false);
  assert.equal(isNetworkError(refused), false);
});

test('a refused session is invalid; a network error is not', () => {
  assert.equal(isSessionInvalid(s401), true);
  assert.equal(isSessionInvalid(refused), true);
  assert.equal(isSessionInvalid(fetchFail), false);
  assert.equal(isSessionInvalid(Object.assign(new Error('x'), { status: 401, isTransient: true })), false);
});

test('stored session + network error = offline (keep the session)', () => {
  for (const e of [fetchFail, retryable, transientProfile, timeout, s500]) {
    assert.equal(decideAuthFailure(e, { hasStoredSession: true }), 'offline', e.message);
  }
});

test('stored session + 401 = signed out', () => {
  assert.equal(decideAuthFailure(s401, { hasStoredSession: true }), 'signed_out');
  assert.equal(decideAuthFailure(refused, { hasStoredSession: true }), 'signed_out');
});

test('device offline: even a 401-looking error keeps the session', () => {
  assert.equal(decideAuthFailure(s401, { hasStoredSession: true, online: false }), 'offline');
});

test('no stored session = signed out, whatever the error', () => {
  assert.equal(decideAuthFailure(fetchFail, { hasStoredSession: false }), 'signed_out');
  assert.equal(decideAuthFailure(s401, { hasStoredSession: false }), 'signed_out');
});

test('unknown error with a stored session does not sign out', () => {
  assert.equal(decideAuthFailure(new Error('weird'), { hasStoredSession: true }), 'offline');
  assert.equal(decideAuthFailure(undefined, { hasStoredSession: true }), 'offline');
});
