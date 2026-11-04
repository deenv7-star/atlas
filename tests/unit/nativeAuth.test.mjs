import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NATIVE_OAUTH_REDIRECT, parseNativeCallback, readBiometricPrefs, writeBiometricPrefs, BIOMETRIC_PREF_KEY,
  shouldOfferBiometric, shouldShowBiometricLogin, biometryLabel, biometricErrorKind, biometricErrorMessage,
} from '../../src/lib/auth/nativeAuthCore.js';

function memStore(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}

test('redirect target is the app URL scheme registered in Info.plist', () => {
  assert.equal(NATIVE_OAUTH_REDIRECT, 'com.atlas-il.app://auth-callback');
});

test('callback with a PKCE code', () => {
  assert.deepEqual(parseNativeCallback('com.atlas-il.app://auth-callback?code=abc-123'), { code: 'abc-123' });
  assert.deepEqual(parseNativeCallback('com.atlas-il.app://auth-callback/?code=x&state=y'), { code: 'x' });
  assert.deepEqual(parseNativeCallback('COM.ATLAS-IL.APP://auth-callback?code=z'), { code: 'z' });
});

test('callback with an error (cancel / provider refused), in query or hash', () => {
  const a = parseNativeCallback('com.atlas-il.app://auth-callback?error=access_denied&error_description=User+cancelled');
  assert.equal(a.error, 'access_denied');
  assert.equal(a.description, 'User cancelled');
  const b = parseNativeCallback('com.atlas-il.app://auth-callback#error=server_error&error_code=bad_oauth_state');
  assert.equal(b.error, 'server_error');
  assert.equal(b.code, 'bad_oauth_state');
  assert.equal(parseNativeCallback('com.atlas-il.app://auth-callback').error, 'missing_code');
});

test('other URLs are not our callback', () => {
  assert.equal(parseNativeCallback('https://atlas-il.com/auth/callback?code=x'), null);
  assert.equal(parseNativeCallback('com.atlas-il.app://other?code=x'), null);
  assert.equal(parseNativeCallback('com.atlas-il.app://auth-callbackX?code=x'), null);
  assert.equal(parseNativeCallback(''), null);
  assert.equal(parseNativeCallback(undefined), null);
});

test('Face ID prefs round-trip with safe defaults', () => {
  const s = memStore();
  assert.deepEqual(readBiometricPrefs(s), { enabled: false, userId: '', offered: false });
  writeBiometricPrefs(s, { offered: true });
  writeBiometricPrefs(s, { enabled: true, userId: 'u1' });
  assert.deepEqual(readBiometricPrefs(s), { enabled: true, userId: 'u1', offered: true });
  assert.deepEqual(readBiometricPrefs(memStore({ [BIOMETRIC_PREF_KEY]: '{bad' })), { enabled: false, userId: '', offered: false });
  assert.deepEqual(readBiometricPrefs(null), { enabled: false, userId: '', offered: false });
});

test('one-time offer: only in the app, signed in, available, never asked, on an app screen', () => {
  const base = { native: true, signedIn: true, available: true, prefs: { enabled: false, offered: false }, path: '/dashboard' };
  assert.equal(shouldOfferBiometric(base), true);
  assert.equal(shouldOfferBiometric({ ...base, native: false }), false);
  assert.equal(shouldOfferBiometric({ ...base, signedIn: false }), false);
  assert.equal(shouldOfferBiometric({ ...base, available: false }), false);
  assert.equal(shouldOfferBiometric({ ...base, prefs: { offered: true } }), false);
  assert.equal(shouldOfferBiometric({ ...base, prefs: { enabled: true } }), false);
  for (const p of ['/login', '/register', '/auth/callback', '/onboarding', '/reset-password']) {
    assert.equal(shouldOfferBiometric({ ...base, path: p }), false, p);
  }
  assert.equal(shouldOfferBiometric({ ...base, path: '/calendar' }), true);
});

test('login button shows only when on, saved and available in the app', () => {
  const ok = { native: true, available: true, prefs: { enabled: true }, saved: true };
  assert.equal(shouldShowBiometricLogin(ok), true);
  assert.equal(shouldShowBiometricLogin({ ...ok, native: false }), false);
  assert.equal(shouldShowBiometricLogin({ ...ok, saved: false }), false);
  assert.equal(shouldShowBiometricLogin({ ...ok, prefs: { enabled: false } }), false);
  assert.equal(shouldShowBiometricLogin({ ...ok, available: false }), false);
});

test('sensor label', () => {
  assert.equal(biometryLabel(2), 'Face ID');
  assert.equal(biometryLabel(1), 'Touch ID');
  assert.equal(biometryLabel(undefined), 'Face ID');
});

test('error kinds: cancel is silent, revoked token forgets the saved sign-in', () => {
  assert.equal(biometricErrorKind({ code: '16', message: 'User canceled biometric authentication' }), 'cancel');
  assert.equal(biometricErrorKind({ code: '10', message: 'Biometric authentication failed' }), 'error');
  assert.equal(biometricErrorKind({ code: '21' }), 'invalid');
  assert.equal(biometricErrorKind({ message: 'Invalid Refresh Token: Already Used' }), 'invalid');
  assert.equal(biometricErrorKind({ message: 'Invalid Refresh Token: Refresh Token Not Found' }), 'invalid');
  assert.equal(biometricErrorKind({ code: '2' }), 'lockout');
  assert.equal(biometricErrorKind({ message: 'Failed to fetch' }), 'error');
  assert.equal(biometricErrorMessage('cancel'), '');
  for (const k of ['lockout', 'invalid', 'error']) {
    const m = biometricErrorMessage(k, 'Face ID');
    assert.match(m, /[\u0590-\u05FF]/);
    assert.match(m, /Face ID/);
  }
});
