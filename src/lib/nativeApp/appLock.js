/**
 * iOS app lock: plugin glue (@capgo/capacitor-native-biometric verifyIdentity + @capacitor/app lifecycle).
 * Pure rules: ./appLockCore.js. Every function is a no-op outside the app, and the plugins are imported
 * only on first use there, so atlas-il.com never loads them.
 *
 * The lock gates the UI only. The Supabase session stays where Supabase keeps it; nothing here reads,
 * copies or changes it. (The separate Face ID *sign-in* on the login screen, src/lib/auth/biometric.js,
 * keeps its own Keychain copy of the refresh token; turning Face ID on here turns that on as well, best effort,
 * so one switch means one thing to the owner: "atlas opens with Face ID".)
 */
import { isNativeApp } from '@/lib/native';
import { readLockPrefs, writeLockPrefs } from '@/lib/nativeApp/appLockCore';

function store() {
  try { return window.localStorage; } catch { return null; }
}

export const lockPrefs = () => readLockPrefs(store());
export const markLockOffered = () => writeLockPrefs(store(), { offered: true });

let pluginP = null;
/** Resolves { NB } (never the Proxy itself: a Capacitor plugin answers `then`, see biometric.js). */
function plugin() {
  if (!pluginP) {
    pluginP = import('@capgo/capacitor-native-biometric').then((m) => ({ NB: m.NativeBiometric }));
    pluginP.catch(() => { pluginP = null; });
  }
  return pluginP;
}

/**
 * Ask iOS for Face ID / Touch ID. useFallback: iOS offers the device passcode itself after a failed face
 * (LAPolicy.deviceOwnerAuthentication), so the owner is never stuck. Resolves on success, throws otherwise.
 */
export async function verifyOwner({ reason = 'פתיחת atlas' } = {}) {
  const { NB } = await plugin();
  await NB.verifyIdentity({ reason, useFallback: true, fallbackTitle: 'קוד הגישה' });
}

/** Turn the lock on: one real Face ID check first (iOS shows its permission prompt the first time). */
export async function enableLock({ userId, session } = {}) {
  if (!isNativeApp()) throw new Error('not native');
  await verifyOwner({ reason: 'הפעלת פתיחה עם Face ID' });
  writeLockPrefs(store(), { enabled: true, offered: true, userId: userId ? String(userId) : '' });
  // Same switch, the login-screen Face ID sign-in (Keychain copy of the refresh token). Never blocks the lock.
  if (session?.refresh_token) {
    await import('@/lib/auth/biometric').then((m) => m.enableBiometric(session)).catch(() => {});
  }
}

export async function disableLock() {
  writeLockPrefs(store(), { enabled: false, userId: '' });
  if (!isNativeApp()) return;
  await import('@/lib/auth/biometric').then((m) => m.clearBiometric()).catch(() => {});
}

/**
 * pause / resume from @capacitor/app. Listeners are added once; returns a remover.
 * 'pause' = UIApplicationDidEnterBackground, 'resume' = WillEnterForeground. The Face ID sheet itself only
 * makes the app *inactive* (no pause), so prompting never re-locks.
 */
export async function onAppLifecycle({ pause, resume }) {
  if (!isNativeApp()) return () => {};
  const { App } = await import('@capacitor/app');
  const hs = await Promise.all([
    App.addListener('pause', () => pause?.()),
    App.addListener('resume', () => resume?.()),
  ]);
  return () => { hs.forEach((h) => { try { h.remove(); } catch { /* gone */ } }); };
}
