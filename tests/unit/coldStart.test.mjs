// perf/cold-start (05.11.2026): native start route, boot variant choice, early open for platform staff.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeStartRedirect, hasStoredSupabaseSession, NATIVE_HOME_PATH } from '../../src/lib/native.js';
import { pickBootVariant, BOOT_DEFAULT } from '../../src/lib/bootCore.js';
import { trustLastStaffAccess } from '../../src/lib/lastAccess.js';

function store(obj) {
  const keys = Object.keys(obj);
  return { length: keys.length, key: (i) => keys[i] ?? null, getItem: (k) => (k in obj ? obj[k] : null) };
}
const SESSION = store({ 'sb-romvmqbcinurscwdsskx-auth-token': JSON.stringify({ access_token: 'x', refresh_token: 'r', user: { id: 'u1' } }) });
const EMPTY = store({ 'atlas.me.v1': '{}' });

function withNative(fn) {
  const prev = globalThis.window;
  globalThis.window = { Capacitor: { isNativePlatform: () => true }, location: { origin: 'capacitor://localhost' } };
  try { return fn(); } finally { if (prev === undefined) delete globalThis.window; else globalThis.window = prev; }
}

test('stored Supabase session is detected without supabase-js', () => {
  assert.equal(hasStoredSupabaseSession(SESSION), true);
  assert.equal(hasStoredSupabaseSession(EMPTY), false);
  assert.equal(hasStoredSupabaseSession(store({ 'sb-abc-auth-token': 'not json' })), false);
  assert.equal(hasStoredSupabaseSession(store({ 'sb-abc-auth-token': JSON.stringify({ user: { id: 'u' } }) })), false, 'no token = no session');
  assert.equal(hasStoredSupabaseSession(null), false);
});

test('iOS cold start: signed in → Today directly; signed out → /login', () => {
  withNative(() => {
    for (const pathname of ['/', '/app.html', '/index.html', '/pricing']) {
      assert.equal(nativeStartRedirect({ pathname, search: '', hash: '' }, SESSION), NATIVE_HOME_PATH, pathname);
      assert.equal(nativeStartRedirect({ pathname, search: '', hash: '' }, EMPTY), '/login', pathname);
    }
    // an auth result in the URL always goes through /login (the full app picks it up there)
    assert.equal(nativeStartRedirect({ pathname: '/app.html', search: '?code=abc', hash: '' }, SESSION), '/login?code=abc');
    assert.equal(nativeStartRedirect({ pathname: '/', search: '', hash: '#access_token=t' }, SESSION), '/login#access_token=t');
    // any other first URL is left alone
    assert.equal(nativeStartRedirect({ pathname: '/bookings', search: '', hash: '' }, SESSION), null);
  });
});

test('boot variant: ?boot wins, then stored, default a', () => {
  assert.equal(BOOT_DEFAULT, 'a');
  assert.equal(pickBootVariant('', ''), 'a');
  assert.equal(pickBootVariant('?boot=b', ''), 'b');
  assert.equal(pickBootVariant('?x=1&boot=a', 'b'), 'a');
  assert.equal(pickBootVariant('', 'b'), 'b');
  assert.equal(pickBootVariant('?boot=zz', 'nope'), 'a');
});

test('early open only for the same account last seen open as staff', () => {
  assert.equal(trustLastStaffAccess({ uid: 'u1', locked: false, isAdmin: true, state: 'expired' }), true);
  assert.equal(trustLastStaffAccess({ uid: 'u1', locked: false, isAdmin: false, state: 'trial' }), false, 'trial since ended: wait');
  assert.equal(trustLastStaffAccess({ uid: 'u1', locked: true, isAdmin: true }), false);
  assert.equal(trustLastStaffAccess(null), false);
});
