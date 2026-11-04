import test from 'node:test';
import assert from 'node:assert/strict';
import { isNativeApp, publicOrigin, nativeStartRedirect, PUBLIC_ORIGIN } from '../../src/lib/native.js';

function withWindow(win, fn) {
  const prev = globalThis.window;
  globalThis.window = win;
  try { return fn(); } finally { if (prev === undefined) delete globalThis.window; else globalThis.window = prev; }
}
const nativeWin = (loc) => ({ Capacitor: { isNativePlatform: () => true }, location: { origin: 'capacitor://localhost', ...loc } });
const webWin = (loc) => ({ location: { origin: 'https://atlas-il.com', ...loc } });

test('native detection', () => {
  withWindow(nativeWin({ pathname: '/' }), () => assert.equal(isNativeApp(), true));
  withWindow(webWin({ pathname: '/' }), () => assert.equal(isNativeApp(), false));
});

test('links leaving the device never use capacitor://', () => {
  withWindow(nativeWin({ pathname: '/' }), () => assert.equal(publicOrigin(), PUBLIC_ORIGIN));
  withWindow(webWin({ pathname: '/' }), () => assert.equal(publicOrigin(), 'https://atlas-il.com'));
  withWindow({ location: { origin: 'http://localhost:5173' } }, () => assert.equal(publicOrigin(), 'http://localhost:5173'));
});

test('native cold start on landing / pricing goes to /login, keeps auth params', () => {
  withWindow(nativeWin({}), () => {
    assert.equal(nativeStartRedirect({ pathname: '/', search: '', hash: '' }), '/login');
    assert.equal(nativeStartRedirect({ pathname: '/pricing/', search: '', hash: '' }), '/login');
    assert.equal(nativeStartRedirect({ pathname: '/', search: '?code=x', hash: '' }), '/login?code=x');
    assert.equal(nativeStartRedirect({ pathname: '/dashboard', search: '', hash: '' }), null);
  });
  withWindow(webWin({}), () => assert.equal(nativeStartRedirect({ pathname: '/', search: '', hash: '' }), null));
});
