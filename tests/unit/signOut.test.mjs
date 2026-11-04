import test from 'node:test';
import assert from 'node:assert/strict';
import {
  settle, safeSignOut, clearAuthStorage, isAuthStorageKey, hardRedirectToLogin,
} from '../../src/lib/auth/signOutCore.js';

function memStore(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    m,
  };
}

const signedIn = () => memStore({
  'sb-abcd-auth-token': '{"access_token":"x"}',
  'sb-abcd-auth-token-code-verifier': 'v',
  'atlas.me.v1': '{}',
  'atlas_jwt_token': 't',
  'atlas_current_user': '{}',
  'atlas.biometric.v1': '{"offered":true}',
  'atlas-onboarding': 'keep',
});

/** Fake supabase.auth recording calls; `global` decides what signOut() (no args) does. */
function fakeSupabase(global) {
  const calls = [];
  return {
    calls,
    auth: {
      signOut(opts) {
        calls.push(opts?.scope || 'global');
        if (opts?.scope === 'local') return Promise.resolve({ error: null });
        return global();
      },
    },
  };
}

test('settle: value, error and timeout, never throws', async () => {
  assert.deepEqual(await settle(Promise.resolve(3), 50), { ok: true, value: 3 });
  const e = await settle(() => { throw new Error('boom'); }, 50);
  assert.equal(e.ok, false); assert.equal(e.error.message, 'boom');
  assert.deepEqual(await settle(new Promise(() => {}), 20), { ok: false, timedOut: true });
});

test('auth storage keys: session, PKCE verifier, REST JWT, demo user, profile cache — nothing else', () => {
  for (const k of ['sb-abcd-auth-token', 'sb-abcd-auth-token-code-verifier', 'atlas_jwt_token', 'atlas_current_user', 'atlas.me.v1']) assert.ok(isAuthStorageKey(k), k);
  for (const k of ['atlas.biometric.v1', 'atlas-onboarding', 'sb-other', null]) assert.ok(!isAuthStorageKey(k), String(k));
});

test('clearAuthStorage removes auth keys from every store and keeps the rest', () => {
  const a = signedIn(); const b = memStore({ 'sb-x-auth-token': '1', other: '2' });
  clearAuthStorage([a, b, null]);
  assert.deepEqual([...a.m.keys()].sort(), ['atlas-onboarding', 'atlas.biometric.v1']);
  assert.deepEqual([...b.m.keys()], ['other']);
});

test('happy path: server sign-out, no local fallback, storage cleared', async () => {
  const store = signedIn();
  const sb = fakeSupabase(() => Promise.resolve({ error: null }));
  const r = await safeSignOut(sb, { stores: [store] });
  assert.deepEqual(r, { server: true });
  assert.deepEqual(sb.calls, ['global']);
  assert.equal(store.getItem('sb-abcd-auth-token'), null);
});

test('failed network (signOut rejects): local fallback, storage cleared, resolves', async () => {
  const store = signedIn();
  const sb = fakeSupabase(() => Promise.reject(new TypeError('Failed to fetch')));
  const r = await safeSignOut(sb, { stores: [store] });
  assert.deepEqual(r, { server: false });
  assert.deepEqual(sb.calls, ['global', 'local']);
  assert.equal(store.getItem('sb-abcd-auth-token'), null);
  assert.equal(store.getItem('atlas.me.v1'), null);
});

test('failed network (signOut returns { error }): local fallback', async () => {
  const sb = fakeSupabase(() => Promise.resolve({ error: { message: 'network', status: 0 } }));
  const r = await safeSignOut(sb, { stores: [signedIn()] });
  assert.equal(r.server, false);
  assert.deepEqual(sb.calls, ['global', 'local']);
});

test('hanging network: gives up after the timeout and still clears the session', async () => {
  const store = signedIn();
  const sb = fakeSupabase(() => new Promise(() => {}));
  const t0 = Date.now();
  const r = await safeSignOut(sb, { stores: [store], timeoutMs: 40, localTimeoutMs: 40 });
  assert.ok(Date.now() - t0 < 1000);
  assert.equal(r.server, false);
  assert.equal(store.getItem('sb-abcd-auth-token'), null);
});

test('a Face ID clear that never settles or throws cannot block sign-out (the iOS bug)', async () => {
  for (const beforeSignOut of [() => new Promise(() => {}), () => { throw new Error('plugin'); }, () => Promise.reject(new Error('x'))]) {
    const store = signedIn();
    const sb = fakeSupabase(() => Promise.resolve({ error: null }));
    const r = await safeSignOut(sb, { stores: [store], beforeSignOut, sideStepTimeoutMs: 30 });
    assert.equal(r.server, true);
    assert.equal(store.getItem('sb-abcd-auth-token'), null);
  }
});

test('a Capacitor-style plugin Proxy (answers `then`) hangs a promise; wrapping it in an object does not', async () => {
  // Same shape as @capacitor/core registerPlugin(): every property is a method returning a promise.
  // On iOS the native side rejects an unknown method; nobody listens to that rejection (marked handled here).
  const proxy = new Proxy({}, {
    get: (_, prop) => () => { const p = Promise.reject(new Error(`${String(prop)}() not implemented`)); p.catch(() => {}); return p; },
  });
  const bare = await settle(Promise.resolve().then(() => proxy), 50);
  assert.equal(bare.timedOut, true);
  const wrapped = await settle(Promise.resolve().then(() => ({ NB: proxy })), 50);
  assert.equal(wrapped.ok, true);
  assert.equal(typeof wrapped.value.NB.deleteData, 'function');
});

test('no supabase client: still clears storage', async () => {
  const store = signedIn();
  assert.deepEqual(await safeSignOut(null, { stores: [store] }), { server: false });
  assert.equal(store.getItem('atlas_jwt_token'), null);
});

test('hardRedirectToLogin uses location.replace, falls back to href', () => {
  const seen = [];
  hardRedirectToLogin('/login', { replace: (u) => seen.push(['replace', u]) });
  const loc = { replace() { throw new Error('blocked'); }, href: '' };
  hardRedirectToLogin('/login?x=1', loc);
  assert.deepEqual(seen, [['replace', '/login']]);
  assert.equal(loc.href, '/login?x=1');
});
