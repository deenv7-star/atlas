// fix-1104 QA: a 500 from the auth server on the token refresh must not sign the owner out.
// Run: npm run test:unit
import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthClient } from '@supabase/auth-js';
import { isRefreshTokenRequest, shouldMaskRefreshFailure, guardRefreshResponse } from '../../src/lib/auth/refreshGuard.js';

const HOST = 'https://ref.supabase.co';
const REFRESH = `${HOST}/auth/v1/token?grant_type=refresh_token`;

test('only the refresh grant is matched', () => {
  assert.equal(isRefreshTokenRequest(REFRESH), true);
  assert.equal(isRefreshTokenRequest(`${HOST}/auth/v1/token?grant_type=password`), false);
  assert.equal(isRefreshTokenRequest(`${HOST}/auth/v1/user`), false);
  assert.equal(isRefreshTokenRequest(`${HOST}/rest/v1/bookings?grant_type=refresh_token`), false);
  assert.equal(isRefreshTokenRequest(undefined), false);
});

test('non-retryable 5xx is masked; 4xx, 2xx and 502-504 are not', () => {
  for (const s of [500, 501, 520, 599]) assert.equal(shouldMaskRefreshFailure(REFRESH, s), true, String(s));
  for (const s of [200, 400, 401, 403, 429, 502, 503, 504]) assert.equal(shouldMaskRefreshFailure(REFRESH, s), false, String(s));
  assert.equal(shouldMaskRefreshFailure(`${HOST}/rest/v1/payments`, 500), false);
});

test('guardRefreshResponse re-labels 500 as 503 and passes everything else through', async () => {
  const r500 = new Response('{"msg":"boom"}', { status: 500, headers: { 'content-type': 'application/json' } });
  const out = guardRefreshResponse(REFRESH, r500);
  assert.equal(out.status, 503);
  assert.equal(out.headers.get('x-atlas-original-status'), '500');
  assert.equal(await out.text(), '{"msg":"boom"}');
  const r400 = new Response('{}', { status: 400 });
  assert.equal(guardRefreshResponse(REFRESH, r400), r400);
  const rData = new Response('[]', { status: 500 });
  assert.equal(guardRefreshResponse(`${HOST}/rest/v1/payments`, rData), rData);
});

// End to end with the real auth-js: stored session with an expired access token, refresh answers 500.
function memStorage(init) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); }, removeItem: (k) => { m.delete(k); }, map: m };
}
const KEY = 'sb-ref-auth-token';
const expired = () => JSON.stringify({
  access_token: 'a.b.c', refresh_token: 'rt-1', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) - 600,
  user: { id: 'u1', aud: 'authenticated', email: 'o@x.co', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
});

async function runWith(status, guarded) {
  const storage = memStorage({ [KEY]: expired() });
  const events = [];
  let calls = 0;
  const serverFetch = async (input) => {
    calls += 1;
    const res = new Response(JSON.stringify({ code: status, msg: 'auth server error' }), { status, headers: { 'content-type': 'application/json' } });
    return guarded ? guardRefreshResponse(typeof input === 'string' ? input : input.url, res) : res;
  };
  const client = new AuthClient({
    url: `${HOST}/auth/v1`, headers: { apikey: 'anon' }, storageKey: KEY, storage,
    autoRefreshToken: false, persistSession: true, detectSessionInUrl: false, fetch: serverFetch,
  });
  client.onAuthStateChange((e) => events.push(e));
  const { data } = await client.getSession();
  return { kept: storage.map.has(KEY), session: data.session, events, calls };
}

test('auth-js without the guard: 500 on refresh removes the stored session (the bug)', { timeout: 60000 }, async () => {
  const r = await runWith(500, false);
  assert.equal(r.kept, false);
  assert.ok(r.events.includes('SIGNED_OUT'));
});

test('auth-js with the guard: 500 on refresh keeps the stored session, no SIGNED_OUT', { timeout: 60000 }, async () => {
  const r = await runWith(500, true);
  assert.equal(r.kept, true);
  assert.equal(r.session, null);
  assert.ok(!r.events.includes('SIGNED_OUT'), r.events.join(','));
});

test('auth-js with the guard: a real refusal (400) still signs out', { timeout: 60000 }, async () => {
  const r = await runWith(400, true);
  assert.equal(r.kept, false);
  assert.ok(r.events.includes('SIGNED_OUT'));
});
