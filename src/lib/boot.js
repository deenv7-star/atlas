/**
 * Branded boot screen (perf/cold-start, 05.11.2026).
 *
 * index.html / app.html paint the app icon on the canvas at once (same icon, same background as the iOS launch
 * screen, so the native splash hands over with no blank flash). main.jsx lifts that node out of #root into a fixed
 * overlay, so React can render underneath without restarting its animation. The overlay leaves as soon as a real
 * screen is up: the app shell (Layout), or any full-screen page (login, onboarding, public pages...). It never
 * waits for its own animation. A screen that is still deciding (sign-in check) can hold it with holdBoot().
 * Safety net: it always leaves after BOOT_MAX_MS, or on a crash.
 *
 * Variants (Deen picks): 'a' = the "a" draws in, then the tile settles; 'b' = the icon scales in with a soft
 * indigo glow pulse. Default 'a'. Override: ?boot=a|b (remembered in this browser) or localStorage atlas.boot.v.
 * The inline script in index.html applies the variant before first paint; this module only removes the overlay.
 */
import { createElement, useEffect } from 'react';
import { pickBootVariant, BOOT_VARIANTS, BOOT_DEFAULT } from './bootCore.js';

export { pickBootVariant, BOOT_VARIANTS, BOOT_DEFAULT };

export const BOOT_ID = 'atlas-boot';
export const BOOT_MAX_MS = 8000;

let holds = 0;
let wanted = false;
let gone = false;
let safety = null;

function el() {
  return typeof document === 'undefined' ? null : document.getElementById(BOOT_ID);
}

function remove() {
  if (gone) return;
  const node = el();
  gone = true;
  if (safety) { clearTimeout(safety); safety = null; }
  if (!node) return;
  try { window.dispatchEvent(new CustomEvent('atlas:boot-done')); } catch { /* old WebView */ }
  node.setAttribute('aria-busy', 'false');
  node.classList.add('is-out');
  // fade is 160 ms in CSS (instant with reduced motion); remove on the next frames either way
  setTimeout(() => node.remove(), 220);
}

/** Take the boot node out of #root into a fixed overlay. Called once by main.jsx before React renders. */
export function liftBoot(rootEl) {
  if (typeof document === 'undefined' || !rootEl) return false;
  const node = rootEl.querySelector(`#${BOOT_ID}`);
  if (!node) { gone = true; return false; }
  node.classList.add('is-lifted');
  document.body.appendChild(node);
  safety = setTimeout(remove, BOOT_MAX_MS);
  window.addEventListener('error', remove, { once: true });
  return true;
}

/** A real screen is up: remove the overlay now (unless a screen still holds it). */
export function hideBoot() {
  wanted = true;
  if (holds <= 0) remove();
}

export function holdBoot() { holds += 1; }
export function releaseBoot() {
  holds = Math.max(0, holds - 1);
  if (holds === 0 && wanted) remove();
}

export function isBootShown() { return !gone && Boolean(el()); }

/** Render inside a Suspense boundary's children (never its fallback): fires once that screen has rendered. */
export function BootDone() {
  useEffect(() => { hideBoot(); }, []);
  return null;
}

/** Keeps the boot overlay up while mounted (a screen whose own content is not decided yet). */
export function BootHold() {
  useEffect(() => { holdBoot(); return () => releaseBoot(); }, []);
  return createElement('div', { 'aria-hidden': true, className: 'min-h-[100dvh]', style: { background: '#F7F8FB' } });
}

export function useBootDone(ready = true) {
  useEffect(() => { if (ready) hideBoot(); }, [ready]);
}
