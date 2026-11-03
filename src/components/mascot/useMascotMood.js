/**
 * App-wide store for the glow face (logic: ./mascotMood.js).
 *
 *   emitMascot('success')                 something was saved: happy squint + a small bounce
 *   emitMascot('error')                   something failed: concerned for a moment
 *   emitMascot('waiting' | 'responding' | 'answer')   the assistant's turn
 *   emitMascot('user-typing', { el })     you type: attentive eyes toward the field
 *   emitMascot('look', { el | at })       a new toast / message: the eyes turn to it
 *   const { mood, gaze, bounce } = useMascotMood('neutral')
 *
 * Cheap on purpose: no rAF loop. One timeout for the next scheduled change, a throttled activity listener
 * only while a live face is on screen, everything paused while the tab is hidden, and nothing at all with
 * prefers-reduced-motion (the face stays still in its base mood).
 */
import { useSyncExternalStore } from 'react';
import { createMascotState, reduceMascot, moodOf, gazeOf, nextChangeAt } from './mascotMood';

const now = () => Date.now();
let state = createMascotState(now());
const subs = new Set();
let timer = 0;
let hourTimer = 0;
let lastActivityEmit = 0;
let listening = false;

const hasDom = () => typeof window !== 'undefined' && typeof document !== 'undefined';
export function prefersReducedMotion() {
  return hasDom() && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
const hidden = () => hasDom() && document.visibilityState === 'hidden';

function notify() { subs.forEach((fn) => fn()); }

function schedule() {
  if (!hasDom()) return;
  clearTimeout(timer);
  if (!subs.size || hidden()) return;
  const t = nextChangeAt(state, now());
  if (t) timer = window.setTimeout(() => { snapshotCache = null; notify(); schedule(); }, Math.max(16, t - now()));
  clearTimeout(hourTimer);
  const d = new Date();
  const toHour = (60 - d.getMinutes()) * 60_000 - d.getSeconds() * 1000 + 50;
  hourTimer = window.setTimeout(() => { snapshotCache = null; notify(); schedule(); }, toHour); // late-night switch
}

function pointOf(opts) {
  if (!opts) return null;
  if (opts.at) return opts.at;
  const el = opts.el;
  if (el && typeof el.getBoundingClientRect === 'function') {
    const r = el.getBoundingClientRect();
    return { x: r.left + Math.min(r.width / 2, 120), y: r.top + r.height / 2 };
  }
  return null;
}

export function emitMascot(type, opts) {
  if (!hasDom() || prefersReducedMotion()) return;
  state = reduceMascot(state, { type, at: pointOf(opts) }, now());
  snapshotCache = null;
  if (subs.size) { notify(); schedule(); }
}

function onActivity() {
  const t = now();
  if (t - lastActivityEmit < 1000) return;
  lastActivityEmit = t;
  const wasSleepy = t - state.lastActivity > 90_000;
  state = reduceMascot(state, { type: 'activity' }, t);
  if (wasSleepy) { snapshotCache = null; notify(); }
  schedule();
}

function onVisibility() {
  const h = hidden();
  document.documentElement.toggleAttribute('data-mascot-paused', h);
  if (!h) { state = reduceMascot(state, { type: 'activity' }, now()); snapshotCache = null; notify(); }
  schedule();
}

function listen(on) {
  if (!hasDom() || on === listening) return;
  listening = on;
  const m = on ? 'addEventListener' : 'removeEventListener';
  window[m]('pointerdown', onActivity, { passive: true, capture: true });
  window[m]('keydown', onActivity, { passive: true, capture: true });
  window[m]('wheel', onActivity, { passive: true, capture: true });
  document[m]('visibilitychange', onVisibility);
  if (!on) { clearTimeout(timer); clearTimeout(hourTimer); }
}

function subscribe(fn) {
  subs.add(fn);
  listen(true);
  schedule();
  return () => {
    subs.delete(fn);
    if (!subs.size) listen(false);
  };
}

let snapshotCache = null;
function snapshot() {
  if (!snapshotCache) snapshotCache = { state, at: now() };
  return snapshotCache;
}
const serverSnapshot = { state: createMascotState(0), at: 0 };

/** For a live face: the mood to show, where to look (screen point or null) and a bounce counter. */
export function useMascotMood(base = 'neutral', enabled = true) {
  const snap = useSyncExternalStore(enabled ? subscribe : noopSubscribe, snapshot, () => serverSnapshot);
  if (!enabled || prefersReducedMotion()) return { mood: base, gaze: null, bounce: 0, still: true };
  const t = snap.at;
  return {
    mood: moodOf(snap.state, t, { base, date: new Date(t) }),
    gaze: gazeOf(snap.state, t),
    bounce: snap.state.bounce,
    still: false,
  };
}
function noopSubscribe() { return () => {}; }

/** Test hook: reset the shared state (unit tests / QA only). */
export function __resetMascot() { state = createMascotState(now()); snapshotCache = null; notify(); }
// QA only (the ≤10s reactions clip): localStorage.atlas_qa_mascot = '1' exposes the emitter on window.
try { if (hasDom() && window.localStorage.getItem('atlas_qa_mascot') === '1') window.__atlasMascot = { emit: emitMascot, reset: __resetMascot }; } catch { /* storage blocked */ }
