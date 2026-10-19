/**
 * "Continue with Google / Apple": the parts that talk to Supabase and the providers.
 * Pure rules (flags, return URL, profile fill, routing, Hebrew errors) live in oauthFlow.js.
 *
 * Google: supabase.auth.signInWithOAuth (full-page redirect) → /auth/callback.
 * Apple:  with VITE_APPLE_SERVICES_ID set, Sign in with Apple JS (popup) → signInWithIdToken. This is the
 *         only web path where Apple hands over the person's name (first authorisation only), so it is kept
 *         right away in user_metadata. Without it, the same Supabase redirect as Google (no name: the
 *         finish step asks for it once).
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import {
  OAUTH_CALLBACK_PATH, buildPending, writePending, readPending, clearPending, parseFlag, profilePatch,
} from '@/lib/auth/oauthFlow';

const env = import.meta.env || {};

/** Which buttons are shown. Both on by default; VITE_AUTH_GOOGLE=false / VITE_AUTH_APPLE=false hide one. */
export const SOCIAL_FLAGS = {
  google: parseFlag(env.VITE_AUTH_GOOGLE, true),
  apple: parseFlag(env.VITE_AUTH_APPLE, true),
};
export const APPLE_SERVICES_ID = String(env.VITE_APPLE_SERVICES_ID || '').trim();
/** 'js' (popup, keeps the name) when a Services ID is configured, else 'redirect'. VITE_AUTH_APPLE_MODE overrides. */
export const APPLE_MODE = (() => {
  const m = String(env.VITE_AUTH_APPLE_MODE || '').trim().toLowerCase();
  if (m === 'redirect') return 'redirect';
  if (m === 'js') return APPLE_SERVICES_ID ? 'js' : 'redirect';
  return APPLE_SERVICES_ID ? 'js' : 'redirect';
})();

/** Social sign-in needs a real Supabase project (not the local demo / REST backend). */
export function socialProviders() {
  if (!isSupabaseConfigured || !supabase) return [];
  return ['google', 'apple'].filter((p) => SOCIAL_FLAGS[p]);
}

// ── Which providers the Supabase project has switched on (public GET /auth/v1/settings) ──────────────
// A button for a provider that is not configured yet would send the owner to a raw JSON error page.
// The answer is cached on the device, so once a provider is on, the buttons render with no layout shift.
const ENABLED_KEY = 'atlas.auth.providers.v1';
const ENABLED_TTL_MS = 6 * 3600 * 1000;
let enabledInflight = null;

/** { google, apple } booleans from the last check on this device, or null. */
export function cachedEnabled() {
  try {
    const c = JSON.parse(window.localStorage.getItem(ENABLED_KEY) || 'null');
    if (!c || Date.now() - (c.at || 0) > ENABLED_TTL_MS) return null;
    return { google: Boolean(c.google), apple: Boolean(c.apple) };
  } catch { return null; }
}

/** Ask Supabase which external providers are enabled. null when it cannot be read (then nothing is hidden). */
export function fetchEnabled() {
  if (!isSupabaseConfigured || !env.VITE_SUPABASE_URL) return Promise.resolve(null);
  if (!enabledInflight) {
    enabledInflight = fetch(`${String(env.VITE_SUPABASE_URL).replace(/\/$/, '')}/auth/v1/settings`, {
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY || '' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.external) return null;
        const v = { google: Boolean(j.external.google), apple: Boolean(j.external.apple) };
        try { window.localStorage.setItem(ENABLED_KEY, JSON.stringify({ ...v, at: Date.now() })); } catch { /* ignore */ }
        return v;
      })
      .catch(() => null)
      .finally(() => { setTimeout(() => { enabledInflight = null; }, 0); });
  }
  return enabledInflight;
}

export function callbackUrl() {
  return `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
}

function store() {
  try { return window.localStorage; } catch { return null; }
}
export const pendingStore = {
  read: () => readPending(store()),
  clear: () => clearPending(store()),
};

/**
 * Start "Continue with …". Resolves when the browser is on its way to the provider (redirect), or when the
 * Apple popup finished and a session exists (the caller then goes to /auth/callback). Throws on failure.
 */
export async function startSocialSignIn(provider, { intent = 'login', returnTo = null, consent = null, business = '' } = {}) {
  if (!supabase) throw new Error('provider is not enabled');
  const enabled = await fetchEnabled();
  if (enabled && enabled[provider] === false) throw new Error('provider is not enabled');
  writePending(store(), buildPending({ provider, intent, returnTo, consent, business }));

  if (provider === 'apple' && APPLE_MODE === 'js') {
    await appleJsSignIn();
    return { redirected: false };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl(),
      // Google: always let the owner pick the account (shared family computers are common).
      ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
      ...(provider === 'apple' ? { scopes: 'name email' } : {}),
    },
  });
  if (error) { clearPending(store()); throw error; }
  return { redirected: true, url: data?.url };
}

// ── Sign in with Apple JS (popup) ────────────────────────────────────────────
const APPLE_JS = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
let appleScript = null;
function loadAppleJs() {
  if (window.AppleID?.auth) return Promise.resolve(window.AppleID);
  if (!appleScript) {
    appleScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = APPLE_JS;
      s.async = true;
      s.onload = () => (window.AppleID?.auth ? resolve(window.AppleID) : reject(new Error('apple js unavailable')));
      s.onerror = () => { appleScript = null; reject(new Error('network: apple js')); };
      document.head.appendChild(s);
    });
  }
  return appleScript;
}

function randomNonce() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}
async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function appleJsSignIn() {
  const AppleID = await loadAppleJs();
  const raw = randomNonce();
  AppleID.auth.init({
    clientId: APPLE_SERVICES_ID,
    scope: 'name email',
    redirectURI: callbackUrl(),
    state: randomNonce(),
    nonce: await sha256Hex(raw), // Apple gets the hash, Supabase the raw value (it hashes and compares).
    usePopup: true,
  });
  let res;
  try {
    res = await AppleID.auth.signIn();
  } catch (e) {
    const code = e?.error || e?.message || 'apple_error';
    const err = new Error(String(code));
    err.code = code;
    throw err;
  }
  const token = res?.authorization?.id_token;
  if (!token) throw new Error('apple: no id_token');
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce: raw });
  if (error) throw error;
  // Apple sends the name on the first authorisation only: keep it now, it never comes again.
  const first = res?.user?.name?.firstName || '';
  const last = res?.user?.name?.lastName || '';
  const full = `${first} ${last}`.replace(/\s+/g, ' ').trim();
  if (full) {
    await supabase.auth.updateUser({ data: { full_name: full, given_name: first || undefined, family_name: last || undefined } })
      .catch(() => { /* the finish step still has the name field */ });
  }
}

// ── After the session exists ─────────────────────────────────────────────────

/** profiles row fields the finish step needs. */
export async function readOwnProfile(uid) {
  const { data } = await supabase.from('profiles').select('id, full_name, profile_image, onboarding_completed').eq('id', uid).maybeSingle();
  return data || {};
}

/**
 * Fill empty profile fields from the provider (Google name + photo) and record what the finish step collected
 * (consent, a typed name). Best effort for the photo; consent errors are thrown (it is required).
 */
export async function completeSocialProfile({ user, profile, consent = null, typedName = '' }) {
  const meta = { ...(user?.user_metadata || {}) };
  const dataUpdate = {};
  if (consent?.version) Object.assign(dataUpdate, { terms_accepted_at: consent.at || new Date().toISOString(), terms_version: consent.version });
  const name = String(typedName || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (name) { dataUpdate.full_name = name; meta.full_name = name; }
  if (Object.keys(dataUpdate).length) {
    const { error } = await supabase.auth.updateUser({ data: dataUpdate });
    if (error) throw error;
  }
  const patch = profilePatch(profile, meta);
  if (name && !String(profile?.full_name || '').trim()) patch.full_name = name;
  if (Object.keys(patch).length) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
    if (error) console.warn('[social] profile fill:', error.message);
  }
  return patch;
}
