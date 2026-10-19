/**
 * Install prompt plumbing.
 *   - captureInstallPrompt(): call once at startup (main.jsx). Keeps Chrome's beforeinstallprompt event
 *     (and stops the browser's own mini-infobar) so atlas can offer install at a sensible moment instead.
 *   - promptInstall(): shows the browser's install dialog from a user tap. Resolves 'accepted' | 'dismissed' | 'unavailable'.
 *   - useInstall(): React hook with { state, platform, browser, install, dismiss, dismissed, ... }.
 *   - dismissals are remembered per surface ('card' on /today, 'sheet' after setup) in localStorage.
 */
import { useCallback, useEffect, useState } from 'react';
import { readEnv, installState, iosBrowser, isIOS, devicePlatform } from './platform';

let deferred = null;
const subs = new Set();
const emit = () => subs.forEach((fn) => { try { fn(); } catch { /* ignore */ } });

export function captureInstallPrompt(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win || win.__atlasInstallCaptured) return;
  win.__atlasInstallCaptured = true;
  win.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    emit();
  });
  win.addEventListener('appinstalled', () => {
    deferred = null;
    try { win.localStorage.setItem(KEY_INSTALLED, String(Date.now())); } catch { /* ignore */ }
    emit();
  });
}

export function hasInstallPrompt() { return !!deferred; }

export async function promptInstall() {
  const e = deferred;
  if (!e) return 'unavailable';
  deferred = null; // the event can be used once
  emit();
  try {
    await e.prompt();
    const choice = await e.userChoice;
    return choice && choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'dismissed';
  }
}

export const KEY_DISMISS = 'atlas:pwa-dismissed'; // JSON { card?: ts, sheet?: ts }
export const KEY_INSTALLED = 'atlas:pwa-installed-at';

export function readDismissed(storage = safeLocal()) {
  try { return JSON.parse(storage?.getItem(KEY_DISMISS) || '{}') || {}; } catch { return {}; }
}

export function markDismissed(surface, storage = safeLocal(), now = Date.now()) {
  const d = readDismissed(storage);
  d[surface] = now;
  try { storage?.setItem(KEY_DISMISS, JSON.stringify(d)); } catch { /* private mode: shows again next time */ }
  return d;
}

function safeLocal() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

/** React view of the install situation on this device. */
export function useInstall(surface) {
  const [, force] = useState(0);
  const [dismissed, setDismissed] = useState(() => !!readDismissed()[surface]);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    subs.add(fn);
    const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    mq?.addEventListener?.('change', fn);
    return () => { subs.delete(fn); mq?.removeEventListener?.('change', fn); };
  }, []);
  const env = readEnv();
  const state = installState(env, hasInstallPrompt());
  const install = useCallback(async () => {
    const r = await promptInstall();
    force((n) => n + 1);
    return r;
  }, []);
  const dismiss = useCallback(() => { markDismissed(surface); setDismissed(true); }, [surface]);
  return {
    env,
    state,
    platform: devicePlatform(env),
    browser: isIOS(env) ? iosBrowser(env) : null,
    install,
    dismiss,
    dismissed,
  };
}
