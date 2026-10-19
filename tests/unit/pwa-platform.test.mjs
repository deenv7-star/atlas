// Run: npm run test:unit — install / push availability per device (src/lib/pwa/platform.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { installState, pushState, isIOS, iosVersion, iosBrowser, devicePlatform } from '../../src/lib/pwa/platform.js';

const UA = {
  iphone17: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphone16_3: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1',
  iphoneWhatsApp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/24.1',
  ipadDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
};
const env = (ua, o = {}) => ({ ua, platform: '', maxTouchPoints: 0, standalone: false, native: false, hasSW: true, hasPushManager: true, hasNotification: true, permission: 'default', secure: true, ...o });

test('iOS detection, version and browser', () => {
  assert.equal(isIOS(env(UA.iphone17)), true);
  assert.equal(isIOS(env(UA.ipadDesktop, { maxTouchPoints: 5 })), true);
  assert.equal(isIOS(env(UA.mac)), false);
  assert.equal(iosVersion(env(UA.iphone17)), 17.05);
  assert.equal(iosVersion(env('Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1')), 26);
  assert.equal(iosVersion(env(UA.mac)), null);
  assert.equal(iosBrowser(env(UA.iphoneChrome)), 'chrome');
  assert.equal(iosBrowser(env(UA.iphoneWhatsApp)), 'in-app');
  assert.equal(iosBrowser(env(UA.iphone17)), 'safari');
  assert.equal(devicePlatform(env(UA.android)), 'android');
  assert.equal(devicePlatform(env(UA.mac)), 'desktop');
});

test('install state', () => {
  assert.equal(installState(env(UA.android), true), 'prompt');
  assert.equal(installState(env(UA.android), false), 'unavailable');
  assert.equal(installState(env(UA.iphone17)), 'ios-guide');
  assert.equal(installState(env(UA.iphone17, { standalone: true })), 'installed');
  assert.equal(installState(env(UA.mac, { standalone: true }), true), 'installed');
  assert.equal(installState(env(UA.iphone17, { native: true })), 'native');
  assert.equal(installState({ ssr: true }), 'unavailable');
});

test('push state: iOS only when installed and 16.4+', () => {
  assert.equal(pushState(env(UA.iphone17)), 'needs-install');
  assert.equal(pushState(env(UA.iphone17, { standalone: true })), 'ready');
  assert.equal(pushState(env(UA.iphone16_3, { standalone: true })), 'ios-too-old');
  assert.equal(pushState(env(UA.android)), 'ready');
  assert.equal(pushState(env(UA.mac, { permission: 'granted' })), 'granted');
  assert.equal(pushState(env(UA.mac, { permission: 'denied' })), 'denied');
  assert.equal(pushState(env(UA.mac, { hasPushManager: false })), 'unsupported');
  assert.equal(pushState(env(UA.mac), false), 'not-configured');
  assert.equal(pushState(env(UA.iphone17, { native: true })), 'unsupported');
});
