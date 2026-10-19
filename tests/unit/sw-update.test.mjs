// Run: npm run test:unit  — service worker update flow (src/lib/swUpdate.js) with fake browser globals,
// plus a guard that vite.config.js keeps the "every deploy shows up by itself" workbox settings.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const flush = () => new Promise((r) => setTimeout(r, 0));
import {
  startSwUpdates, createDirtyTracker, CHECK_INTERVAL_MS, MIN_CHECK_GAP_MS, RELOAD_GUARD_MS, RELOAD_GUARD_KEY,
} from '../../src/lib/swUpdate.js';

class Target {
  constructor() { this.l = {}; }
  addEventListener(t, fn) { (this.l[t] ||= []).push(fn); }
  removeEventListener(t, fn) { this.l[t] = (this.l[t] || []).filter((f) => f !== fn); }
  emit(t, e = {}) { for (const fn of [...(this.l[t] || [])]) fn(e); }
}

function el(tag, { type = 'text', connected = true, form = null } = {}) {
  return {
    tagName: tag.toUpperCase(), type, readOnly: false, disabled: false, isConnected: connected, form,
    matches(sel) { return sel.split(',').some((s) => s.trim() === tag); },
  };
}

function env({ controller = true, storage = new Map(), swText = '{url:"assets/index-NEW.js"}', entry = 'assets/index-OLD.js' } = {}) {
  const doc = new Target();
  doc.visibilityState = 'visible';
  doc.readyState = 'complete';
  const win = new Target();
  win.document = doc;
  win.location = { pathname: '/' };
  const intervals = [];
  win.setInterval = (fn, ms) => { intervals.push({ fn, ms }); return intervals.length; };
  win.clearInterval = () => {};
  win.history = { pushState(_s, _t, url) { win.location.pathname = url; } };
  const reg = { updates: 0, update() { this.updates += 1; return Promise.resolve(); } };
  const sw = new Target();
  sw.controller = controller ? {} : null;
  sw.register = () => Promise.resolve(reg);
  const nav = { serviceWorker: sw, onLine: true };
  let t = 1_000_000;
  const store = { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, v) };
  const reloads = [];
  const fetchText = () => (swText instanceof Error ? Promise.reject(swText) : Promise.resolve(swText));
  const h = startSwUpdates({ win, doc, nav, storage: store, now: () => t, reload: () => reloads.push(t), entryScript: () => entry, fetchText });
  return { h, doc, win, sw, reg, nav, reloads, intervals, storage, tick: (ms) => { t += ms; } };
}

test('vite.config.js: skipWaiting + clientsClaim + cleanupOutdatedCaches, network-first pages (#109) + app update loop', () => {
  const s = fs.readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8');
  assert.match(s, /skipWaiting:\s*true/);
  assert.match(s, /clientsClaim:\s*true/);
  assert.match(s, /cleanupOutdatedCaches:\s*true/);
  assert.match(s, /navigateFallback:\s*null/);
  assert.match(s, /request\.mode === 'navigate'[\s\S]{0,200}handler:\s*'NetworkFirst'/);
  const main = fs.readFileSync(new URL('../../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /registerServiceWorker\(\)/);
});

test('registers /sw.js and checks every 60 s while visible', async () => {
  const e = env();
  await e.h.ready;
  assert.equal(e.intervals.length, 1);
  assert.equal(e.intervals[0].ms, CHECK_INTERVAL_MS);
  e.tick(CHECK_INTERVAL_MS); e.intervals[0].fn(); await new Promise((r) => setTimeout(r, 0));
  assert.equal(e.reg.updates, 1);
  e.doc.visibilityState = 'hidden';
  e.tick(CHECK_INTERVAL_MS); e.intervals[0].fn(); await new Promise((r) => setTimeout(r, 0));
  assert.equal(e.reg.updates, 1, 'no polling while the tab is hidden');
});

test('checks on visibilitychange and focus, de-duplicated within 5 s', async () => {
  const e = env();
  await e.h.ready;
  e.tick(MIN_CHECK_GAP_MS + 1);
  e.doc.emit('visibilitychange'); e.win.emit('focus');
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(e.reg.updates, 1);
  e.tick(MIN_CHECK_GAP_MS + 1); e.win.emit('focus');
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(e.reg.updates, 2);
});

test('a failing update() (offline / deploy in progress) is swallowed', async () => {
  const e = env();
  await e.h.ready;
  e.reg.update = () => Promise.reject(new TypeError('Failed to fetch'));
  e.tick(MIN_CHECK_GAP_MS + 1);
  assert.equal(await e.h.check(), false);
});

test('new SW takes control → exactly one reload', async () => {
  const e = env();
  await e.h.ready;
  e.sw.emit('controllerchange'); await flush();
  e.sw.emit('controllerchange'); await flush();
  assert.equal(e.reloads.length, 1);
  assert.ok(e.storage.get(RELOAD_GUARD_KEY));
});

test('first install (no previous controller) does not reload', async () => {
  const e = env({ controller: false });
  await e.h.ready;
  e.sw.emit('controllerchange'); await flush();
  assert.equal(e.reloads.length, 0);
  e.sw.emit('controllerchange'); await flush(); // a real later deploy in the same tab
  assert.equal(e.reloads.length, 1);
});

test('loop guard: a page that was just reloaded by the SW defers instead of reloading again', async () => {
  const storage = new Map([[RELOAD_GUARD_KEY, String(1_000_000 - 1000)]]);
  const e = env({ storage });
  await e.h.ready;
  e.sw.emit('controllerchange'); await flush();
  assert.equal(e.reloads.length, 0);
  assert.equal(e.h.state.pending, true);
  e.win.history.pushState({}, '', '/bookings');
  assert.equal(e.reloads.length, 1, 'applied on the next navigation');
});

test('loop guard expires after 15 s', async () => {
  const storage = new Map([[RELOAD_GUARD_KEY, String(1_000_000 - RELOAD_GUARD_MS - 1)]]);
  const e = env({ storage });
  await e.h.ready;
  e.sw.emit('controllerchange'); await flush();
  assert.equal(e.reloads.length, 1);
});

test('dirty form: no reload; deferred until next in-app navigation', async () => {
  const e = env();
  await e.h.ready;
  const input = el('input');
  e.doc.emit('input', { target: input, isTrusted: true });
  e.sw.emit('controllerchange'); await flush();
  assert.equal(e.reloads.length, 0);
  assert.equal(e.h.state.pending, true);
  e.doc.emit('visibilitychange'); e.win.emit('focus'); // still dirty → still waiting
  assert.equal(e.reloads.length, 0);
  e.win.history.pushState({}, '', '/'); // same path: not a navigation
  assert.equal(e.reloads.length, 0);
  e.win.history.pushState({}, '', '/calendar');
  assert.equal(e.reloads.length, 1);
});

test('dirty form closed (field unmounted) → reload when the tab is next visible / focused', async () => {
  const e = env();
  await e.h.ready;
  const input = el('textarea');
  e.doc.emit('input', { target: input, isTrusted: true });
  e.sw.emit('controllerchange'); await flush();
  assert.equal(e.reloads.length, 0);
  input.isConnected = false;
  e.win.emit('focus');
  assert.equal(e.reloads.length, 1);
});

test('back/forward (popstate) applies a deferred reload', async () => {
  const e = env();
  await e.h.ready;
  e.doc.emit('input', { target: el('select'), isTrusted: true });
  e.sw.emit('controllerchange'); await flush();
  e.win.location.pathname = '/leads';
  e.win.emit('popstate');
  assert.equal(e.reloads.length, 1);
});

test('dirty tracker ignores buttons, read-only, scripted (untrusted) input; submit clears its fields', () => {
  const doc = new Target();
  const d = createDirtyTracker(doc);
  doc.emit('input', { target: el('input', { type: 'submit' }), isTrusted: true });
  const ro = el('input'); ro.readOnly = true;
  doc.emit('input', { target: ro, isTrusted: true });
  doc.emit('input', { target: el('input'), isTrusted: false });
  doc.emit('input', { target: { tagName: 'DIV', matches: () => false }, isTrusted: true });
  assert.equal(d.isDirty(), false);
  const field = el('input');
  const form = { contains: (x) => x === field };
  doc.emit('input', { target: field, isTrusted: true });
  assert.equal(d.isDirty(), true);
  doc.emit('submit', { target: form });
  assert.equal(d.isDirty(), false);
});

test('no service worker support → no-op', () => {
  const doc = new Target();
  const win = new Target(); win.document = doc;
  assert.equal(startSwUpdates({ win, doc, nav: {} }), null);
});

test('page already on the new version (network-first HTML) → no reload when the new SW takes over', async () => {
  const e = env({ entry: 'assets/index-NEW.js' });
  await e.h.ready;
  e.sw.emit('controllerchange'); await flush();
  assert.equal(e.reloads.length, 0);
  assert.equal(e.h.state.pending, false);
});

test('cannot read the new sw.js (offline) or no entry script → reload (safe side)', async () => {
  const a = env({ swText: new Error('offline') });
  await a.h.ready;
  a.sw.emit('controllerchange'); await flush();
  assert.equal(a.reloads.length, 1);
  const b = env({ entry: null });
  await b.h.ready;
  b.sw.emit('controllerchange'); await flush();
  assert.equal(b.reloads.length, 1);
});
