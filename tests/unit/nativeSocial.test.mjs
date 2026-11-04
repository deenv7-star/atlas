import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import {
  runNativeSocial, signInNativeFirst, isUserCancel, silentCancel, appleFullName, sha256Hex, randomNonce,
  socialLoginInitOptions, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID,
} from '../../src/lib/auth/nativeSocialCore.js';

const cryptoImpl = webcrypto;

function mocks({ loginResult, loginError, supaError = null } = {}) {
  const calls = { login: [], idToken: [], updateUser: [], init: 0 };
  const plugin = {
    login: async (args) => {
      calls.login.push(args);
      if (loginError) throw loginError;
      return loginResult;
    },
  };
  const supabase = {
    auth: {
      signInWithIdToken: async (args) => { calls.idToken.push(args); return { data: {}, error: supaError }; },
      updateUser: async (args) => { calls.updateUser.push(args); return { data: {}, error: null }; },
    },
  };
  const init = async () => { calls.init += 1; };
  return { plugin, supabase, init, calls };
}

test('init options: iOS client + web client as server client, online mode, apple on', () => {
  const o = socialLoginInitOptions();
  assert.equal(o.google.iOSClientId, GOOGLE_IOS_CLIENT_ID);
  assert.equal(o.google.iOSServerClientId, GOOGLE_WEB_CLIENT_ID);
  assert.equal(o.google.mode, 'online');
  assert.ok(o.apple);
  assert.match(GOOGLE_IOS_CLIENT_ID, /\.apps\.googleusercontent\.com$/);
});

test('sha256Hex matches node crypto; nonces are random 64-hex', async () => {
  const raw = randomNonce(cryptoImpl);
  assert.match(raw, /^[0-9a-f]{64}$/);
  assert.notEqual(raw, randomNonce(cryptoImpl));
  assert.equal(await sha256Hex(raw, cryptoImpl), createHash('sha256').update(raw).digest('hex'));
});

test('apple: hashed nonce to Apple, raw nonce + id token to Supabase, name kept', async () => {
  const m = mocks({ loginResult: { provider: 'apple', result: { idToken: 'apple.jwt', profile: { givenName: 'דין', familyName: 'וינוקור' } } } });
  const r = await runNativeSocial('apple', { ...m, cryptoImpl });
  assert.deepEqual(r, { redirected: false, native: true });
  assert.equal(m.calls.init, 1);
  const sent = m.calls.login[0];
  assert.equal(sent.provider, 'apple');
  assert.deepEqual(sent.options.scopes, ['name', 'email']);
  const got = m.calls.idToken[0];
  assert.equal(got.provider, 'apple');
  assert.equal(got.token, 'apple.jwt');
  assert.equal(sent.options.nonce, createHash('sha256').update(got.nonce).digest('hex'));
  assert.notEqual(sent.options.nonce, got.nonce);
  assert.equal(m.calls.updateUser[0].data.full_name, 'דין וינוקור');
});

test('apple without a name (not the first authorisation): no updateUser', async () => {
  const m = mocks({ loginResult: { result: { idToken: 't', profile: { givenName: '', familyName: '' } } } });
  await runNativeSocial('apple', { ...m, cryptoImpl });
  assert.equal(m.calls.updateUser.length, 0);
});

test('google: hashed nonce to the SDK, raw to Supabase, provider google', async () => {
  const m = mocks({ loginResult: { provider: 'google', result: { idToken: 'g.jwt', profile: { email: 'a@b.c' } } } });
  await runNativeSocial('google', { ...m, cryptoImpl });
  const sent = m.calls.login[0];
  const got = m.calls.idToken[0];
  assert.equal(sent.provider, 'google');
  assert.equal(got.provider, 'google');
  assert.equal(got.token, 'g.jwt');
  assert.equal(sent.options.nonce, createHash('sha256').update(got.nonce).digest('hex'));
  assert.equal(m.calls.updateUser.length, 0);
});

test('no id token → error, Supabase not called', async () => {
  const m = mocks({ loginResult: { result: { idToken: '' } } });
  await assert.rejects(runNativeSocial('google', { ...m, cryptoImpl }), /no id token/);
  assert.equal(m.calls.idToken.length, 0);
});

test('Supabase refused the token → error with stage supabase', async () => {
  const m = mocks({ loginResult: { result: { idToken: 'x' } }, supaError: Object.assign(new Error('Nonces mismatch'), { status: 400 }) });
  await assert.rejects(runNativeSocial('apple', { ...m, cryptoImpl }), (e) => e.stage === 'supabase');
});

test('cancel detection: plugin, Google -5, Apple 1001, browser fallback; real errors are not cancels', () => {
  assert.ok(isUserCancel({ code: 'USER_CANCELLED', message: 'User cancelled' }));
  assert.ok(isUserCancel({ code: '-5', message: 'The user canceled the sign-in flow.' }));
  assert.ok(isUserCancel({ message: 'The operation couldn’t be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)' }));
  assert.ok(isUserCancel({ code: 'user_cancelled' }));
  assert.ok(isUserCancel({ error: 'access_denied' }));
  assert.ok(!isUserCancel({ message: 'Google Sign-In provider is disabled' }));
  assert.ok(!isUserCancel({ message: 'Nonces mismatch' }));
  assert.ok(!isUserCancel({ message: '"SocialLogin" plugin is not implemented on ios', code: 'UNIMPLEMENTED' }));
  assert.ok(!isUserCancel(null));
  const s = silentCancel(new Error('x'));
  assert.equal(s.silent, true);
  assert.equal(s.code, 'user_cancelled');
});

test('native first: success never touches the browser', async () => {
  let fb = 0;
  const r = await signInNativeFirst('apple', { native: async () => ({ native: true }), fallback: async () => { fb += 1; } });
  assert.deepEqual(r, { native: true });
  assert.equal(fb, 0);
});

test('native cancel → silent, no fallback', async () => {
  let fb = 0;
  await assert.rejects(
    signInNativeFirst('google', { native: async () => { throw Object.assign(new Error('User cancelled'), { code: 'USER_CANCELLED' }); }, fallback: async () => { fb += 1; } }),
    (e) => e.silent === true,
  );
  assert.equal(fb, 0);
});

test('native non-cancel error → logged, falls back to the in-app browser', async () => {
  const logged = [];
  const r = await signInNativeFirst('google', {
    native: async () => { throw Object.assign(new Error('plugin is not implemented on ios'), { code: 'UNIMPLEMENTED' }); },
    fallback: async (p) => ({ redirected: false, via: `browser:${p}` }),
    log: (e) => logged.push(e.code),
  });
  assert.equal(r.via, 'browser:google');
  assert.deepEqual(logged, ['UNIMPLEMENTED']);
});

test('fallback cancel → silent; fallback real error → thrown as is', async () => {
  const boom = async () => { throw new Error('boom'); };
  await assert.rejects(
    signInNativeFirst('apple', { native: boom, fallback: async () => { throw Object.assign(new Error('user_cancelled'), { code: 'user_cancelled' }); } }),
    (e) => e.silent === true,
  );
  await assert.rejects(signInNativeFirst('apple', { native: boom, fallback: async () => { throw new Error('provider is not enabled'); } }), /provider is not enabled/);
});

test('apple full name helper', () => {
  assert.equal(appleFullName({ givenName: ' Deen ', familyName: 'Vino' }), 'Deen Vino');
  assert.equal(appleFullName({}), '');
  assert.equal(appleFullName(null), '');
});

test('unsupported provider rejected', async () => {
  const m = mocks({});
  await assert.rejects(runNativeSocial('facebook', { ...m, cryptoImpl }), /unsupported/);
});
