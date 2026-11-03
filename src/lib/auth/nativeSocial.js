/**
 * Native Google / Apple sign-in in the iOS app (@capgo/capacitor-social-login). Loaded only in the app
 * (dynamic import from socialAuth.js), so the plugin never reaches the atlas-il.com bundles.
 * The logic lives in nativeSocialCore.js.
 */
import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from '@/api/supabaseClient';
import { runNativeSocial, socialLoginInitOptions } from '@/lib/auth/nativeSocialCore';

let initOnce = null;
function init() {
  if (!initOnce) {
    initOnce = SocialLogin.initialize(socialLoginInitOptions()).catch((e) => { initOnce = null; throw e; });
  }
  return initOnce;
}

let inflight = null;

/** Resolves once the app's Supabase client holds the session; rejects with a cancel / native error. */
export function nativeSocialSignIn(provider) {
  if (inflight) return inflight;
  inflight = runNativeSocial(provider, { plugin: SocialLogin, supabase, init }).finally(() => { inflight = null; });
  return inflight;
}
