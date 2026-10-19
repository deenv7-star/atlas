// Run: npm run test:unit — the service worker push handler (public/push-sw.js) in a fake worker global,
// plus a guard that it stays isolated: no fetch handler, no caches, loaded only via workbox importScripts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SRC = fs.readFileSync(new URL('../../public/push-sw.js', import.meta.url), 'utf8');

function worker({ windows = [] } = {}) {
  const listeners = {};
  const shown = [];
  const opened = [];
  const posted = [];
  const self = {
    location: { origin: 'https://atlas-il.com' },
    addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn); },
    registration: {
      showNotification: async (title, opts) => { shown.push({ title, ...opts }); },
      pushManager: { subscribe: async (o) => ({ toJSON: () => ({ endpoint: 'https://push.test/new', keys: {}, opts: o }) }) },
    },
    clients: {
      matchAll: async () => windows,
      openWindow: async (url) => { opened.push(url); return null; },
    },
  };
  windows.forEach((w) => { w.postMessage = (m) => posted.push(m); });
  vm.runInNewContext(SRC, { self, URL, Date, String, JSON });
  const fire = async (type, event) => {
    const waits = [];
    for (const fn of listeners[type] || []) fn({ ...event, waitUntil: (p) => waits.push(p) });
    await Promise.all(waits);
  };
  return { listeners, shown, opened, posted, fire };
}

const pushData = (obj) => ({ json: () => obj, text: () => JSON.stringify(obj) });

test('only push, notificationclick and pushsubscriptionchange are registered (no fetch, no cache)', () => {
  const w = worker();
  assert.deepEqual(Object.keys(w.listeners).sort(), ['notificationclick', 'push', 'pushsubscriptionchange']);
  assert.ok(!/caches\.|addEventListener\(\s*['"]fetch/.test(SRC));
  const vite = fs.readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8');
  assert.match(vite, /importScripts:\s*\['\/push-sw\.js'\]/);
  assert.match(vite, /globIgnores:\s*\[[^\]]*push-sw\.js/);
});

test('a booking push shows an RTL Hebrew notification that links to the booking', async () => {
  const w = worker();
  await w.fire('push', { data: pushData({ v: 1, title: 'הזמנה חדשה', body: 'דנה כהן · 12–14 בנוב׳', url: '/booking/b1', tag: 'booking-b1', kind: 'booking' }) });
  assert.equal(w.shown.length, 1);
  const n = w.shown[0];
  assert.equal(n.title, 'הזמנה חדשה');
  assert.equal(n.body, 'דנה כהן · 12–14 בנוב׳');
  assert.equal(n.dir, 'rtl');
  assert.equal(n.lang, 'he');
  assert.equal(n.tag, 'booking-b1');
  assert.equal(n.icon, '/icons/icon-192x192.png');
  assert.equal(n.badge, '/icons/badge-96.png');
  assert.deepEqual({ ...n.data }, { url: '/booking/b1', kind: 'booking' });
});

test('an empty or broken push still shows something (userVisibleOnly), and foreign links are dropped', async () => {
  const w = worker();
  await w.fire('push', {});
  await w.fire('push', { data: { json: () => { throw new Error('x'); }, text: () => 'שלום' } });
  await w.fire('push', { data: pushData({ title: 'x', url: 'https://evil.example/phish' }) });
  assert.equal(w.shown[0].title, 'atlas');
  assert.equal(w.shown[1].body, 'שלום');
  assert.equal(w.shown[2].data.url, '/today');
});

test('click focuses an open app window and navigates it; no window = opens one', async () => {
  const calls = [];
  const appWin = { url: 'https://atlas-il.com/calendar', focus: async () => { calls.push('focus'); return appWin; }, navigate: async (u) => { calls.push('nav ' + u); return appWin; } };
  const landing = { url: 'https://atlas-il.com/', focus: async () => landing, navigate: async () => landing };
  const w = worker({ windows: [landing, appWin] });
  let closed = false;
  await w.fire('notificationclick', { notification: { data: { url: '/booking/b1' }, close: () => { closed = true; } } });
  assert.equal(closed, true);
  assert.deepEqual(calls, ['focus', 'nav /booking/b1']);

  const w2 = worker();
  await w2.fire('notificationclick', { notification: { data: { url: '/lead/l1' }, close() {} } });
  assert.deepEqual(w2.opened, ['/lead/l1']);
});

test('a rotated subscription is re-made with the same key and handed to open pages', async () => {
  const win = { url: 'https://atlas-il.com/today' };
  const w = worker({ windows: [win] });
  await w.fire('pushsubscriptionchange', { oldSubscription: { options: { applicationServerKey: 'KEY' } } });
  assert.equal(w.posted.length, 1);
  assert.equal(w.posted[0].type, 'atlas:push-subscription-changed');
  assert.equal(w.posted[0].subscription.endpoint, 'https://push.test/new');
});
