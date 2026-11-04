/**
 * iOS app lock ("לפתוח את atlas עם Face ID"): the pure parts, unit tested (tests/unit/appLock.test.mjs).
 *
 * What it is
 *   A gate in front of the UI. The Supabase session is NOT moved, copied or encrypted by the lock: it stays in
 *   Supabase's own storage exactly as without the lock, so turning it on or off never signs anyone out.
 *   The lock covers the app (blurred) and asks iOS for Face ID / Touch ID, with the device passcode as the
 *   iOS fallback, on a cold start and when the app comes back after more than LOCK_AFTER_MS in the background.
 *
 * Preferences live in localStorage under APP_LOCK_PREF_KEY: { enabled, userId, offered }. userId ties the lock
 * to the account that turned it on: another account signed in on the same phone is never locked out by it.
 */

export const APP_LOCK_PREF_KEY = 'atlas.applock.v1';
/** sessionStorage: a one-time sheet (Face ID offer / notifications pre-prompt) was shown this session. */
export const SHEET_SESSION_KEY = 'atlas.sheet.shown';
/** Back from the background after more than this → lock again. */
export const LOCK_AFTER_MS = 5 * 60 * 1000;

export function readLockPrefs(storage) {
  try {
    const p = JSON.parse(storage?.getItem(APP_LOCK_PREF_KEY) || 'null') || {};
    return { enabled: Boolean(p.enabled), userId: p.userId ? String(p.userId) : '', offered: Boolean(p.offered) };
  } catch {
    return { enabled: false, userId: '', offered: false };
  }
}

export function writeLockPrefs(storage, patch) {
  const next = { ...readLockPrefs(storage), ...patch };
  try { storage?.setItem(APP_LOCK_PREF_KEY, JSON.stringify(next)); } catch { /* quota / private mode */ }
  return next;
}

/** The lock applies to this signed-in account? (unknown id while auth loads → yes, so nothing flashes.) */
export function lockAppliesTo(prefs, userId) {
  if (!prefs?.enabled) return false;
  if (!prefs.userId || !userId) return true;
  return prefs.userId === String(userId);
}

/** Cover the app on a cold start, before auth has even loaded? */
export function lockAtColdStart({ native, prefs }) {
  return Boolean(native && prefs?.enabled);
}

/** Came back from the background: lock again? */
export function lockOnResume({ prefs, userId, backgroundedAt, now }) {
  if (!lockAppliesTo(prefs, userId)) return false;
  const t = Number(backgroundedAt);
  if (!Number.isFinite(t) || t <= 0) return false;
  return Number(now) - t > LOCK_AFTER_MS;
}

/** Paths where the one-time offer must not interrupt (sign-in screens, onboarding, guest pages). */
const NO_OFFER_PATH = /^\/(login|register|auth|verify-email|reset-password|update-password|onboarding|setup|guest|g|stay|s|book)(\/|$)/i;

/** Show the one-time "לפתוח את atlas עם Face ID?" sheet now? */
export function shouldOfferLock({ native, signedIn, available, prefs, path, locked }) {
  if (!native || !signedIn || !available || locked) return false;
  if (!prefs || prefs.enabled || prefs.offered) return false;
  return !NO_OFFER_PATH.test(String(path || '/'));
}

/**
 * A verifyIdentity() failure → what the lock screen says.
 *   'cancel'   the owner closed the prompt / pressed cancel     → "נסו שוב" + "התנתקות", no scary text
 *   'lockout'  too many tries and no passcode path left           → explain, same two buttons
 *   'unavailable' Face ID removed / no passcode set any more       → the lock cannot work: let them in after sign-in
 *   'error'    a face that was not recognised, anything else      → "לא זיהינו אתכם"
 * Codes from @capgo/capacitor-native-biometric (BiometricAuthError).
 */
export function lockErrorKind(err) {
  const code = String(err?.code ?? '');
  const text = `${err?.message || ''} ${err?.errorMessage || ''}`.toLowerCase();
  if (['11', '15', '16', '17'].includes(code) || /cancel/.test(text)) return 'cancel';
  if (code === '2' || code === '4' || /lockout|locked out/.test(text)) return 'lockout';
  if (code === '1' || code === '3' || code === '14' || /not available|not enrolled|passcode not set/.test(text)) return 'unavailable';
  return 'error';
}

export function lockErrorMessage(kind, label = 'Face ID') {
  switch (kind) {
    case 'cancel': return '';
    case 'lockout': return `${label} ננעל אחרי כמה ניסיונות. נסו שוב עם קוד הגישה של האייפון.`;
    case 'unavailable': return `${label} לא זמין כרגע במכשיר. התנתקו והיכנסו עם המייל והסיסמה.`;
    default: return 'לא זיהינו אתכם. נסו שוב.';
  }
}
