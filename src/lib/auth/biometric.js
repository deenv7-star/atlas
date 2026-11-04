/**
 * Face ID / Touch ID sign-in for the iOS app (@capgo/capacitor-native-biometric, SPM).
 *
 * The Supabase refresh token sits in a Keychain item protected by the current biometry set
 * (kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly + biometryCurrentSet): reading it shows the Face ID
 * prompt, writing it does not. Supabase rotates refresh tokens, so the item is rewritten on every refresh
 * while Face ID is on (startBiometricSync). Sign-out removes it (clearBiometric).
 *
 * Every function is a no-op outside the app; the plugin is imported only on first use there, so the web
 * bundles never load it.
 */
import { isNativeApp } from '@/lib/native';
import {
  BIOMETRIC_SECRET_KEY, readBiometricPrefs, writeBiometricPrefs, biometryLabel,
} from '@/lib/auth/nativeAuthCore';

const ACCESS_BIOMETRY_CURRENT_SET = 1; // AccessControl.BIOMETRY_CURRENT_SET

let pluginP = null;
/**
 * Resolves { NB } — never the plugin itself. A Capacitor plugin is a Proxy that answers every property,
 * `then` included, so a promise resolved with it (or an async function returning it) calls NB.then() on
 * the native side, which does not exist: the promise never settles. That is what made sign-out (and every
 * Face ID call) hang forever in the app.
 */
function plugin() {
  if (!pluginP) {
    pluginP = import('@capgo/capacitor-native-biometric').then((m) => ({ NB: m.NativeBiometric }));
    pluginP.catch(() => { pluginP = null; });
  }
  return pluginP;
}

function store() {
  try { return window.localStorage; } catch { return null; }
}

export const biometricPrefs = () => readBiometricPrefs(store());
export const markBiometricOffered = () => writeBiometricPrefs(store(), { offered: true });

/** { available, label } for this device. Never throws. */
export async function biometricAvailability() {
  if (!isNativeApp()) return { available: false, label: 'Face ID' };
  try {
    const { NB } = await plugin();
    const r = await NB.isAvailable({ useFallback: false });
    const type = Number(r?.biometryType);
    return { available: Boolean(r?.isAvailable) && (type === 1 || type === 2), label: biometryLabel(type) };
  } catch {
    return { available: false, label: 'Face ID' };
  }
}

/** A Keychain item is there (checked without a prompt). */
export async function biometricSaved() {
  if (!isNativeApp()) return false;
  try {
    const { NB } = await plugin();
    const r = await NB.isDataSaved({ key: BIOMETRIC_SECRET_KEY });
    return Boolean(r?.isSaved);
  } catch {
    return false;
  }
}

async function writeToken(refreshToken) {
  const { NB } = await plugin();
  await NB.setData({ key: BIOMETRIC_SECRET_KEY, value: refreshToken, accessControl: ACCESS_BIOMETRY_CURRENT_SET });
}

/** Turn Face ID on for this session's account. Throws when the Keychain refuses (no passcode set, …). */
export async function enableBiometric(session) {
  if (!isNativeApp() || !session?.refresh_token || !session?.user?.id) throw new Error('no session');
  await writeToken(session.refresh_token);
  writeBiometricPrefs(store(), { enabled: true, offered: true, userId: session.user.id });
}

/** Turn it off and forget the saved sign-in (sign-out, settings toggle, a token that no longer works). */
export async function clearBiometric({ keepOffered = true } = {}) {
  if (!isNativeApp()) return;
  writeBiometricPrefs(store(), { enabled: false, userId: '', ...(keepOffered ? {} : { offered: false }) });
  try {
    const { NB } = await plugin();
    await NB.deleteData({ key: BIOMETRIC_SECRET_KEY });
  } catch { /* nothing saved */ }
}

/**
 * Face ID prompt → refresh token → a fresh session on the main client.
 * Throws the plugin / Supabase error; the caller maps it with biometricErrorKind().
 */
export async function signInWithBiometric(supabase, { reason } = {}) {
  const { NB } = await plugin();
  const { value } = await NB.getSecureData({ key: BIOMETRIC_SECRET_KEY, reason: reason || 'כניסה ל-atlas' });
  if (!value) {
    const e = new Error('No protected data found for key');
    e.code = '21';
    throw e;
  }
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: value });
  if (error) throw error;
  const s = data?.session;
  if (!s?.refresh_token) throw new Error('invalid refresh token');
  // The old token was just used up: keep the new one right away (the refresh listener does it too).
  await writeToken(s.refresh_token).catch(() => {});
  writeBiometricPrefs(store(), { enabled: true, userId: s.user?.id || readBiometricPrefs(store()).userId });
  return s;
}

let syncing = false;
/**
 * Keep the Keychain copy equal to the live refresh token while Face ID is on. Installed once, in the app.
 * Only the account Face ID was turned on for is written; another account signing in turns it off.
 */
export function startBiometricSync(supabase) {
  if (syncing || !isNativeApp() || !supabase) return;
  syncing = true;
  supabase.auth.onAuthStateChange((event, session) => {
    // Never await Supabase inside this callback (auth lock); the Keychain write is plugin-only.
    if (!session?.refresh_token || !['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) return;
    const prefs = readBiometricPrefs(store());
    if (!prefs.enabled) return;
    if (prefs.userId && session.user?.id && prefs.userId !== session.user.id) {
      void clearBiometric();
      return;
    }
    void writeToken(session.refresh_token).catch(() => { /* next refresh retries */ });
  });
}
