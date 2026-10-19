/**
 * Web Push on this device: permission (only from a tap), subscription, saving it on the account.
 *
 *   enablePush()          the "הפעל התראות" tap: asks permission, subscribes, saves. Never call on load.
 *   disablePush()         unsubscribes this device and removes it from the account
 *   setPushPrefs(prefs)   { bookings, leads, ical } for this device
 *   readPushStatus()      { state, subscribed, prefs } (no prompts, safe on load)
 *   syncPushSubscription() on app start: re-saves an existing subscription (new account on the device, rotated keys)
 *   showTestNotification() a local notification through the service worker (no server needed)
 *
 * Server side: supabase/migrations/022_push_notifications.sql (push_subscribe RPC) + functions/send-push.
 * Until 022 is applied the save fails with a missing-schema error and the UI says notifications start soon.
 * Demo builds without Supabase (VITE_ALLOW_LOCAL_DEMO) keep the subscription in localStorage instead.
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { isMissingSchemaError } from '@/config/dbFeatures';
import { readEnv, pushState, devicePlatform } from './platform';
import { b64urlToUint8 } from './b64';

export const VAPID_PUBLIC_KEY = (import.meta.env && import.meta.env.VITE_VAPID_PUBLIC_KEY) || '';
export const DEFAULT_PREFS = { bookings: true, leads: true, ical: true };
const KEY_PREFS = 'atlas:push-prefs';
const KEY_DEMO = 'atlas:push-demo-subscription';

function local() { try { return window.localStorage; } catch { return null; } }
export function readPrefs() {
  try { return { ...DEFAULT_PREFS, ...(JSON.parse(local()?.getItem(KEY_PREFS) || '{}') || {}) }; } catch { return { ...DEFAULT_PREFS }; }
}
function writePrefs(p) { try { local()?.setItem(KEY_PREFS, JSON.stringify(p)); } catch { /* ignore */ } }

function withTimeout(p, ms, label) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(label)), ms))]);
}

async function registration() {
  if (!('serviceWorker' in navigator)) throw new Error('no_sw');
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing?.active) return existing;
  return withTimeout(navigator.serviceWorker.ready, 8000, 'sw_not_ready');
}

async function currentSubscription() {
  try { const reg = await registration(); return await reg.pushManager.getSubscription(); } catch { return null; }
}

async function saveSubscription(sub, prefs) {
  const json = typeof sub.toJSON === 'function' ? sub.toJSON() : sub;
  const env = readEnv();
  const row = {
    p_endpoint: json.endpoint,
    p_p256dh: json.keys?.p256dh,
    p_auth: json.keys?.auth,
    p_prefs: prefs,
    p_platform: devicePlatform(env),
    p_user_agent: env.ua.slice(0, 400),
    p_installed: !!env.standalone,
  };
  if (!isSupabaseConfigured || !supabase) {
    try { local()?.setItem(KEY_DEMO, JSON.stringify({ ...row, saved_at: new Date().toISOString() })); } catch { /* ignore */ }
    return { saved: 'local' };
  }
  const { error } = await supabase.rpc('push_subscribe', row);
  if (error) {
    if (isMissingSchemaError(error)) return { saved: false, reason: 'server-not-ready' };
    throw error;
  }
  return { saved: 'server' };
}

async function removeSubscription(endpoint) {
  if (!isSupabaseConfigured || !supabase) { try { local()?.removeItem(KEY_DEMO); } catch { /* ignore */ } return; }
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error && !isMissingSchemaError(error)) throw error;
}

export async function readPushStatus() {
  const state = pushState(readEnv(), !!VAPID_PUBLIC_KEY);
  const sub = state === 'granted' ? await currentSubscription() : null;
  return { state, subscribed: !!sub, prefs: readPrefs() };
}

/**
 * The tap on "הפעל התראות". Returns
 *   { ok: true, saved: 'server' | 'local' | false, reason? }  or
 *   { ok: false, reason: 'denied' | 'dismissed' | 'needs-install' | 'unsupported' | 'not-configured' | 'error' }
 */
export async function enablePush() {
  const state = pushState(readEnv(), !!VAPID_PUBLIC_KEY);
  if (!['ready', 'granted'].includes(state)) return { ok: false, reason: state };
  try {
    let perm = Notification.permission;
    if (perm !== 'granted') perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: perm === 'denied' ? 'denied' : 'dismissed' };
    const reg = await registration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToUint8(VAPID_PUBLIC_KEY) });
    const prefs = readPrefs();
    const r = await saveSubscription(sub, prefs);
    return { ok: true, saved: r.saved, reason: r.reason };
  } catch (e) {
    return { ok: false, reason: 'error', detail: String(e?.message || e).slice(0, 120) };
  }
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  try { await sub.unsubscribe(); } catch { /* still remove it from the account */ }
  try { await removeSubscription(endpoint); } catch { /* the server drops dead endpoints on the next send (410) */ }
  return { ok: true };
}

export async function setPushPrefs(next) {
  const prefs = { ...readPrefs(), ...next };
  writePrefs(prefs);
  const sub = await currentSubscription();
  if (sub) { try { await saveSubscription(sub, prefs); } catch { /* kept locally; re-synced on next start */ } }
  return prefs;
}

let synced = false;
export function syncPushSubscription() {
  if (synced || typeof window === 'undefined') return;
  synced = true;
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'atlas:push-subscription-changed' && e.data.subscription) {
      saveSubscription(e.data.subscription, readPrefs()).catch(() => {});
    }
  });
  if (pushState(readEnv(), !!VAPID_PUBLIC_KEY) !== 'granted') return;
  currentSubscription().then((sub) => { if (sub) return saveSubscription(sub, readPrefs()); return null; }).catch(() => {});
}

export async function showTestNotification() {
  const reg = await registration();
  await reg.showNotification('ההתראות פועלות', {
    body: 'כך תיראה התראה על הזמנה חדשה',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96.png',
    dir: 'rtl',
    lang: 'he',
    tag: 'atlas-test',
    data: { url: '/today', kind: 'test' },
  });
}
