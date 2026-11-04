/**
 * iOS app sign-in: the pure parts (no React, no Supabase, no Capacitor), unit tested.
 *
 * Google / Apple in the app
 *   The WebView (capacitor://localhost) cannot be an OAuth redirect target, so the app runs the provider in
 *   SFSafariViewController (@capacitor/browser) with a PKCE Supabase client and asks Supabase to send the
 *   result to the app's own URL scheme: com.atlas-il.app://auth-callback?code=… . iOS hands that URL back to
 *   the app (@capacitor/app 'appUrlOpen'), the code is exchanged for a session, and the normal
 *   /auth/callback screen finishes the sign-in (profile fill, consent, onboarding for a new account).
 *
 * Face ID
 *   The Supabase refresh token is kept in the iOS Keychain under a biometry-protected item. It is rewritten
 *   on every token refresh (Supabase rotates refresh tokens), and removed on sign-out.
 */

export const NATIVE_URL_SCHEME = 'com.atlas-il.app';
export const NATIVE_OAUTH_REDIRECT = `${NATIVE_URL_SCHEME}://auth-callback`;

/**
 * The app URL iOS opened → what it means for the sign-in in flight.
 *   { code }                          success, exchange it
 *   { error, code?, description }     the provider / Supabase refused or the owner cancelled
 *   null                              not our auth callback (some other deep link)
 */
export function parseNativeCallback(rawUrl) {
  const s = String(rawUrl || '').trim();
  if (!s.toLowerCase().startsWith(`${NATIVE_OAUTH_REDIRECT.toLowerCase()}`)) return null;
  const rest = s.slice(NATIVE_OAUTH_REDIRECT.length);
  if (rest && !/^[/?#]/.test(rest)) return null; // com.atlas-il.app://auth-callbackX is not ours
  const q = rest.indexOf('?');
  const h = rest.indexOf('#');
  const query = q >= 0 ? rest.slice(q + 1, h > q ? h : undefined) : '';
  const hash = h >= 0 ? rest.slice(h + 1) : '';
  const params = new URLSearchParams(`${query}&${hash}`);
  const error = params.get('error') || params.get('error_code');
  if (error) {
    return { error, code: params.get('error_code') || '', description: params.get('error_description') || '' };
  }
  const code = params.get('code');
  if (code) return { code };
  return { error: 'missing_code', code: '', description: 'no code in callback' };
}

// ── Face ID preferences (kept in localStorage; the secret itself is only in the Keychain) ────────────

export const BIOMETRIC_SECRET_KEY = 'atlas.session.refresh';
export const BIOMETRIC_PREF_KEY = 'atlas.biometric.v1';

/** { enabled, userId, offered } from storage; safe defaults when missing / unreadable. */
export function readBiometricPrefs(storage) {
  try {
    const p = JSON.parse(storage?.getItem(BIOMETRIC_PREF_KEY) || 'null') || {};
    return { enabled: Boolean(p.enabled), userId: p.userId ? String(p.userId) : '', offered: Boolean(p.offered) };
  } catch {
    return { enabled: false, userId: '', offered: false };
  }
}

export function writeBiometricPrefs(storage, patch) {
  const next = { ...readBiometricPrefs(storage), ...patch };
  try { storage?.setItem(BIOMETRIC_PREF_KEY, JSON.stringify(next)); } catch { /* quota / private mode */ }
  return next;
}

/** Paths where the one-time Face ID offer must not interrupt (sign-in screens, onboarding, guest pages). */
const NO_OFFER_PATH = /^\/(login|register|auth|verify-email|reset-password|update-password|onboarding|guest|g|stay|s)(\/|$)/i;

/**
 * Show the one-time "next time with Face ID?" sheet now?
 * Only in the app, signed in, on an app screen, the device has Face ID / Touch ID, not on yet, never asked.
 */
export function shouldOfferBiometric({ native, signedIn, available, prefs, path }) {
  if (!native || !signedIn || !available) return false;
  if (!prefs || prefs.enabled || prefs.offered) return false;
  return !NO_OFFER_PATH.test(String(path || '/'));
}

/** Show "כניסה עם Face ID" on the login screen? */
export function shouldShowBiometricLogin({ native, available, prefs, saved }) {
  return Boolean(native && available && prefs?.enabled && saved);
}

/** The name iOS uses for the sensor (plugin BiometryType: 1 Touch ID, 2 Face ID). */
export function biometryLabel(type) {
  return Number(type) === 1 ? 'Touch ID' : 'Face ID';
}

/**
 * A plugin / Supabase failure → what the login screen does.
 *   'cancel'   the owner closed the prompt: say nothing
 *   'lockout'  too many tries: use the passcode / password
 *   'invalid'  the saved sign-in no longer works (token revoked / expired, item gone): forget it
 *   'error'    anything else: try again
 */
export function biometricErrorKind(err) {
  const code = String(err?.code ?? '');
  const text = `${err?.message || ''} ${err?.error || ''} ${err?.error_description || ''}`.toLowerCase();
  if (code === '10' || /authentication failed/.test(text)) return 'error';
  if (['11', '15', '16', '17'].includes(code) || /cancel/.test(text)) return 'cancel';
  if (code === '2' || code === '4' || /lockout|locked/.test(text)) return 'lockout';
  if (code === '21' || /no protected data|not found|invalid refresh token|refresh token not found|already used|invalid_grant|session_not_found|refresh_token_not_found/.test(text)) return 'invalid';
  return 'error';
}

/** Hebrew line for each kind ('' for cancel). */
export function biometricErrorMessage(kind, label = 'Face ID') {
  switch (kind) {
    case 'cancel': return '';
    case 'lockout': return `${label} ננעל אחרי כמה ניסיונות. היכנסו עם המייל והסיסמה.`;
    case 'invalid': return `הכניסה עם ${label} כבר לא בתוקף. היכנסו עם המייל והסיסמה, ונפעיל אותה מחדש.`;
    default: return `לא הצלחנו להכניס אתכם עם ${label}. נסו שוב, או היכנסו עם המייל והסיסמה.`;
  }
}
