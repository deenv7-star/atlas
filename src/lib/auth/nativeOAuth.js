/**
 * Google / Apple sign-in inside the iOS app (see nativeAuthCore.js for the flow).
 *
 * Loaded only in the app (dynamic import from socialAuth.js), so @capacitor/browser and @capacitor/app never
 * reach the web bundles.
 *
 * A separate PKCE Supabase client runs the OAuth leg with its own in-memory storage (the code verifier lives
 * there while the owner is in Safari). After the code exchange its tokens are handed to the app's main client
 * (setSession), which owns the session from then on, exactly as after an email + password sign-in.
 */
import { createClient } from '@supabase/supabase-js';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/api/supabaseClient';
import { NATIVE_OAUTH_REDIRECT, parseNativeCallback } from '@/lib/auth/nativeAuthCore';

const env = import.meta.env || {};

/** How long to wait after Safari closes for the app URL to arrive before treating it as a cancel. */
const CLOSE_GRACE_MS = 1500;
/** The whole round trip gives up after this long (the owner walked away from the provider page). */
const FLOW_TIMEOUT_MS = 10 * 60 * 1000;

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

function oauthClient() {
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      flowType: 'pkce',
      storage: memoryStorage(),
      storageKey: 'atlas-native-oauth',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function cancelled() {
  const e = new Error('user_cancelled');
  e.code = 'user_cancelled';
  return e;
}

let inflight = null;

/**
 * Run "Continue with Google / Apple" in SFSafariViewController. Resolves once the app's main Supabase client
 * holds the new session (the caller then opens /auth/callback). Rejects with a cancel / provider error.
 */
export function nativeOAuthSignIn(provider) {
  if (inflight) return inflight;
  inflight = run(provider).finally(() => { inflight = null; });
  return inflight;
}

async function run(provider) {
  if (!supabase) throw new Error('provider is not enabled');
  const client = oauthClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: NATIVE_OAUTH_REDIRECT,
      skipBrowserRedirect: true,
      ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
      ...(provider === 'apple' ? { scopes: 'name email' } : {}),
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('no oauth url');

  const callbackUrl = await new Promise((resolve, reject) => {
    let settled = false;
    let closeTimer = null;
    const handles = [];
    const done = (fn, v) => {
      if (settled) return;
      settled = true;
      clearTimeout(closeTimer);
      clearTimeout(flowTimer);
      handles.forEach((h) => { Promise.resolve(h).then((x) => x?.remove?.()).catch(() => {}); });
      fn(v);
    };
    const flowTimer = setTimeout(() => {
      Browser.close().catch(() => {});
      done(reject, cancelled());
    }, FLOW_TIMEOUT_MS);

    handles.push(App.addListener('appUrlOpen', (ev) => {
      const parsed = parseNativeCallback(ev?.url);
      if (!parsed) return; // some other deep link
      Browser.close().catch(() => { /* already closed */ });
      done(resolve, parsed);
    }));
    // "Done" in Safari (or the provider page closed itself). The app URL can land a moment after the
    // close event, so wait briefly before calling it a cancel.
    handles.push(Browser.addListener('browserFinished', () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => done(reject, cancelled()), CLOSE_GRACE_MS);
    }));

    Browser.open({ url: data.url, toolbarColor: '#1B2656' })
      .catch((e) => done(reject, e));
  });

  if (callbackUrl.error) {
    const e = new Error(callbackUrl.description || callbackUrl.error);
    e.error = callbackUrl.error;
    e.code = callbackUrl.code || callbackUrl.error;
    e.error_description = callbackUrl.description;
    throw e;
  }

  const { data: exchanged, error: exErr } = await client.auth.exchangeCodeForSession(callbackUrl.code);
  if (exErr) throw exErr;
  const s = exchanged?.session;
  if (!s?.access_token || !s?.refresh_token) throw new Error('no session after code exchange');

  const { error: setErr } = await supabase.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
  if (setErr) throw setErr;
  return { redirected: false };
}
