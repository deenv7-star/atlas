/**
 * iOS app notifications: plugin glue (@capacitor/push-notifications, @capacitor/local-notifications).
 * Pure rules: ./notifyCore.js. Every function is a no-op outside the app; plugins load on first use there.
 *
 * Push (server → phone) needs the server side that is prepared but NOT applied (docs/ios-faceid-push.md):
 * migration 029 (device_tokens), the send-push edge function and an APNs key. Until then registration still
 * runs; saving the token fails quietly ("table missing") and is retried on the next app open.
 */
import { isNativeApp } from '@/lib/native';
import { supabase } from '@/api/supabaseClient';
import {
  planCheckinReminders, diffReminders, isOurReminder, isMissingTableError, safeAppPath,
  readNotifyPrefs, writeNotifyPrefs,
} from '@/lib/nativeApp/notifyCore';

const TOKEN_KEY = 'atlas.push.token.v1'; // { token, userId, saved }

function store() {
  try { return window.localStorage; } catch { return null; }
}
export const notifyPrefs = () => readNotifyPrefs(store());
export const setNotifyPrefs = (patch) => writeNotifyPrefs(store(), patch);

let localP = null;
let pushP = null;
// Resolve { X } wrappers, never the plugin Proxy itself (it answers `then`; see src/lib/auth/biometric.js).
const local = () => {
  if (!localP) { localP = import('@capacitor/local-notifications').then((m) => ({ LN: m.LocalNotifications })); localP.catch(() => { localP = null; }); }
  return localP;
};
const push = () => {
  if (!pushP) { pushP = import('@capacitor/push-notifications').then((m) => ({ PN: m.PushNotifications })); pushP.catch(() => { pushP = null; }); }
  return pushP;
};

/** 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unavailable'. One iOS permission for both. */
export async function permissionState() {
  if (!isNativeApp()) return 'unavailable';
  try {
    const { LN } = await local();
    const r = await LN.checkPermissions();
    return r?.display || 'prompt';
  } catch {
    return 'unavailable';
  }
}

/** The iOS dialog. Resolves 'granted' | 'denied'. */
export async function requestPermission() {
  if (!isNativeApp()) return 'denied';
  try {
    const { PN } = await push();
    const r = await PN.requestPermissions();
    return r?.receive === 'granted' ? 'granted' : 'denied';
  } catch {
    try {
      const { LN } = await local();
      const r = await LN.requestPermissions();
      return r?.display === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }
}

// ── push token ───────────────────────────────────────────────────────────────────────────────────
function readToken() {
  try { return JSON.parse(store()?.getItem(TOKEN_KEY) || 'null') || null; } catch { return null; }
}
function writeToken(v) {
  try { if (v) store()?.setItem(TOKEN_KEY, JSON.stringify(v)); else store()?.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

/**
 * Upsert the APNs token for the signed-in owner. 'saved' | 'no-table' | 'no-backend' | 'error'. Never throws.
 */
export async function saveDeviceToken({ token, userId, orgId }) {
  if (!token || !userId) return 'error';
  writeToken({ token, userId, saved: false });
  if (!supabase) return 'no-backend';
  try {
    const { error } = await supabase.from('device_tokens').upsert({
      token,
      user_id: userId,
      org_id: orgId || null,
      platform: 'ios',
      environment: 'production', // TestFlight and App Store builds use production APNs
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token' });
    if (error) return isMissingTableError(error) ? 'no-table' : 'error';
    writeToken({ token, userId, saved: true });
    return 'saved';
  } catch (e) {
    return isMissingTableError(e) ? 'no-table' : 'error';
  }
}

let registered = false;
/** Ask APNs for a token (permission must already be granted) and keep it for this owner. */
export async function registerPush({ userId, orgId }) {
  if (!isNativeApp() || !userId) return;
  try {
    const { PN } = await push();
    if (!registered) {
      registered = true;
      await PN.addListener('registration', (t) => { void saveDeviceToken({ token: t?.value, userId, orgId }); });
      await PN.addListener('registrationError', () => { /* simulator / no aps-environment: nothing to do */ });
    }
    const prev = readToken();
    if (prev?.token && prev.userId === userId && !prev.saved) void saveDeviceToken({ token: prev.token, userId, orgId });
    await PN.register();
  } catch { /* plugin missing in an old build */ }
}

/** Sign-out: forget this phone for the account and drop its reminders. Best effort, time-limited by caller. */
export async function forgetDevice() {
  if (!isNativeApp()) return;
  const t = readToken();
  writeToken(null);
  try {
    if (t?.token && t.saved && supabase) await supabase.from('device_tokens').delete().eq('token', t.token);
  } catch { /* table missing / offline */ }
  await cancelAllReminders();
  try { const { PN } = await push(); await PN.unregister?.(); } catch { /* ignore */ }
}

// ── check-in reminders ───────────────────────────────────────────────────────────────────────────
export async function cancelAllReminders() {
  try {
    const { LN } = await local();
    const { notifications = [] } = await LN.getPending();
    const ids = notifications.filter(isOurReminder).map((n) => ({ id: Number(n.id) }));
    if (ids.length) await LN.cancel({ notifications: ids });
  } catch { /* ignore */ }
}

/**
 * Make iOS hold exactly the reminders the bookings call for. Returns { scheduled, cancelled } or null when
 * notifications are off. Safe to call on every app open and after any booking change.
 */
export async function syncCheckinReminders({ bookings, properties, now = new Date() }) {
  if (!isNativeApp()) return null;
  if ((await permissionState()) !== 'granted') return null;
  if (notifyPrefs().remindersOff) { await cancelAllReminders(); return { scheduled: 0, cancelled: 0 }; }
  try {
    const { LN } = await local();
    const wanted = planCheckinReminders(bookings, { now, properties });
    const { notifications = [] } = await LN.getPending();
    const { cancel, schedule } = diffReminders(notifications, wanted);
    if (cancel.length) await LN.cancel({ notifications: cancel.map((id) => ({ id })) });
    if (schedule.length) {
      await LN.schedule({
        notifications: schedule.map((w) => ({
          id: w.id, title: w.title, body: w.body, extra: w.extra,
          schedule: { at: new Date(w.at), allowWhileIdle: true },
        })),
      });
    }
    return { scheduled: schedule.length, cancelled: cancel.length };
  } catch {
    return null;
  }
}

/** Tap on a reminder / push → an in-app path. Returns a remover. */
export async function onNotificationTap(go) {
  if (!isNativeApp()) return () => {};
  const hs = [];
  try {
    const { LN } = await local();
    hs.push(await LN.addListener('localNotificationActionPerformed', (a) => {
      const id = a?.notification?.extra?.bookingId;
      go(id ? `/booking/${encodeURIComponent(id)}` : '/dashboard');
    }));
  } catch { /* ignore */ }
  try {
    const { PN } = await push();
    hs.push(await PN.addListener('pushNotificationActionPerformed', (a) => {
      go(safeAppPath(a?.notification?.data?.path) || '/dashboard');
    }));
  } catch { /* ignore */ }
  return () => hs.forEach((h) => { try { h.remove(); } catch { /* gone */ } });
}
