/**
 * Native "Continue with Google / Apple" in the iOS app: the logic, with the plugin, Supabase and crypto passed
 * in (no Capacitor / Supabase imports here), so it is unit tested with mocks.
 *
 *   Apple   → the system Sign in with Apple sheet (ASAuthorization), no web page.
 *   Google  → the Google Sign-In SDK sheet (GoogleSignIn-iOS), no in-app browser.
 *   Both    → the ID token goes to supabase.auth.signInWithIdToken({ provider, token, nonce }).
 *
 * Nonce: the provider gets SHA-256(raw) (hex), Supabase gets the raw value, hashes it and compares it with
 * the token's nonce claim. Same scheme for both providers (the plugin passes the nonce through unchanged).
 *
 * The in-app-browser flow (nativeOAuth.js) stays as a fallback for a native failure that is not a cancel
 * (an old build without the plugin, a provider SDK error, a token Supabase refused).
 */

/** iOS OAuth client (Google Cloud project "atlas", type iOS, bundle com.atlas-il.app). */
export const GOOGLE_IOS_CLIENT_ID = '342928594606-suvsuvlnd3816jhe47n97evg2trec8gf.apps.googleusercontent.com';
/** The web client Supabase's Google provider uses; set as serverClientID so the ID token's audience is it. */
export const GOOGLE_WEB_CLIENT_ID = '342928594606-j1gcm31gut561cqplatlgiaf3otdpb9i.apps.googleusercontent.com';

/** Options for SocialLogin.initialize() in the app. */
export function socialLoginInitOptions() {
  return {
    google: { iOSClientId: GOOGLE_IOS_CLIENT_ID, iOSServerClientId: GOOGLE_WEB_CLIENT_ID, mode: 'online' },
    apple: {},
  };
}

export function randomNonce(cryptoImpl = globalThis.crypto) {
  const a = new Uint8Array(32);
  cryptoImpl.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(s, cryptoImpl = globalThis.crypto) {
  const buf = await cryptoImpl.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Did the owner close the sheet / browser themselves? Covers the plugin (USER_CANCELLED, Google -5,
 * ASAuthorizationError.canceled 1001), the in-app-browser fallback (user_cancelled) and Supabase text.
 */
export function isUserCancel(err) {
  if (!err) return false;
  const code = String(err.code ?? err.errorCode ?? '').toLowerCase();
  if (['user_cancelled', 'user_canceled', '-5', '1001', 'canceled', 'cancelled'].includes(code)) return true;
  const text = `${err.message || ''} ${err.error || ''} ${err.errorMessage || ''}`.toLowerCase();
  return /user_cancel|cancell?ed|the user canceled|error 1001|\(-5\)|access_denied/.test(text);
}

/** An error the sign-in screen swallows (the owner cancelled: stay on the screen, say nothing). */
export function silentCancel(cause) {
  const e = new Error('user_cancelled');
  e.code = 'user_cancelled';
  e.silent = true;
  if (cause) e.cause = cause;
  return e;
}

/** Apple sends the person's name only on the first authorisation: "given family", or ''. */
export function appleFullName(profile) {
  const first = String(profile?.givenName || '').trim();
  const last = String(profile?.familyName || '').trim();
  return `${first} ${last}`.replace(/\s+/g, ' ').trim();
}

/**
 * One native sign-in. Resolves { redirected: false, native: true } once `supabase` holds the session.
 * deps: { plugin (SocialLogin), supabase, init () => Promise, cryptoImpl }
 */
export async function runNativeSocial(provider, { plugin, supabase, init, cryptoImpl = globalThis.crypto }) {
  if (provider !== 'google' && provider !== 'apple') throw new Error(`unsupported provider ${provider}`);
  if (!plugin || !supabase) throw new Error('native social login unavailable');
  if (init) await init();

  const raw = randomNonce(cryptoImpl);
  const hashed = await sha256Hex(raw, cryptoImpl);
  const options = provider === 'apple' ? { scopes: ['name', 'email'], nonce: hashed } : { nonce: hashed };

  const res = await plugin.login({ provider, options });
  const result = res?.result || {};
  const token = result.idToken;
  if (!token) {
    const e = new Error(`${provider}: no id token`);
    e.code = 'native_no_id_token';
    throw e;
  }

  const { error } = await supabase.auth.signInWithIdToken({ provider, token, nonce: raw });
  if (error) { error.stage = 'supabase'; throw error; }

  if (provider === 'apple') {
    const full = appleFullName(result.profile);
    if (full) {
      await supabase.auth.updateUser({
        data: { full_name: full, given_name: result.profile?.givenName || undefined, family_name: result.profile?.familyName || undefined },
      }).catch(() => { /* the finish step still asks for the name */ });
    }
  }
  return { redirected: false, native: true };
}

/**
 * Native first; the in-app browser only when native failed with something that is not a cancel.
 * A cancel (in either) becomes silentCancel(). `log` gets the native error before the fallback runs.
 */
export async function signInNativeFirst(provider, { native, fallback, log = () => {} }) {
  try {
    return await native(provider);
  } catch (err) {
    if (isUserCancel(err)) throw silentCancel(err);
    log(err);
  }
  try {
    return await fallback(provider);
  } catch (err) {
    if (isUserCancel(err)) throw silentCancel(err);
    throw err;
  }
}
