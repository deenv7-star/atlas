/**
 * "Continue with Google / Apple": the pure parts (no React, no Supabase, no import.meta), unit tested.
 *
 * Flow
 *   /login or /register → startSocialSignIn() saves a short-lived "pending" note on this device
 *   (where to return, whether the terms box was already ticked, the business name typed so far)
 *   → Google / Apple → Supabase → /auth/callback (session in the URL, detectSessionInUrl) →
 *   AuthCallback reads the note, fills the profile (name + photo) when it is empty, asks only what is
 *   still missing (terms consent for a new account, a name when the provider gave none: Apple on the
 *   web never sends it), then routes: set-up account → return URL or /today, new account → /onboarding.
 */

export const OAUTH_CALLBACK_PATH = '/auth/callback';
export const OAUTH_PENDING_KEY = 'atlas.oauth.pending';
export const OAUTH_PENDING_TTL_MS = 30 * 60 * 1000;
export const PROVIDERS = ['google', 'apple'];
export const PROVIDER_LABEL = { google: 'Google', apple: 'Apple' };

/** Env flag → boolean. Empty / missing means `fallback`; 0 / false / off / no turn it off. */
export function parseFlag(value, fallback = true) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return !/^(0|false|off|no)$/i.test(String(value).trim());
}

/** A same-site path to come back to after sign-in. Never another origin, never an auth screen (loops). */
export function safeReturnPath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let p = raw.trim();
  try { p = decodeURIComponent(p); } catch { return null; }
  if (!p.startsWith('/') || p.startsWith('//') || p.startsWith('/\\')) return null;
  if (/^\/(login|register|auth|verify-email|reset-password|update-password|onboarding)(\/|\?|#|$)/i.test(p)) return null;
  return p;
}

/** The note kept on this device while the owner is away at Google / Apple. */
export function buildPending({ provider, intent = 'login', returnTo = null, consent = null, business = '', now = Date.now() }) {
  if (!PROVIDERS.includes(provider)) throw new Error(`unknown provider ${provider}`);
  return {
    provider,
    intent: intent === 'register' ? 'register' : 'login',
    returnTo: safeReturnPath(returnTo),
    consent: consent && consent.version ? { at: consent.at || new Date(now).toISOString(), version: String(consent.version) } : null,
    business: String(business || '').trim().slice(0, 50),
    at: now,
  };
}

export function writePending(storage, pending) {
  try { storage?.setItem(OAUTH_PENDING_KEY, JSON.stringify(pending)); } catch { /* private mode / quota */ }
}

/** The note, or null when missing, unreadable or older than the TTL. */
export function readPending(storage, now = Date.now()) {
  try {
    const p = JSON.parse(storage?.getItem(OAUTH_PENDING_KEY) || 'null');
    if (!p || typeof p !== 'object' || !PROVIDERS.includes(p.provider)) return null;
    if (!p.at || now - p.at > OAUTH_PENDING_TTL_MS || now < p.at - 60_000) return null;
    return { ...p, returnTo: safeReturnPath(p.returnTo) };
  } catch { return null; }
}

export function clearPending(storage) {
  try { storage?.removeItem(OAUTH_PENDING_KEY); } catch { /* ignore */ }
}

const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 80);

/** The person's name from provider metadata (Google: full_name / name; given + family as a fallback). */
export function nameFromMetadata(meta = {}) {
  const direct = cleanName(meta.full_name || meta.name);
  if (direct && !direct.includes('@')) return direct;
  const parts = cleanName([meta.given_name || meta.first_name, meta.family_name || meta.last_name].filter(Boolean).join(' '));
  return parts;
}

/** Profile photo URL from provider metadata. https only (Google: avatar_url / picture). Apple has none. */
export function avatarFromMetadata(meta = {}) {
  const url = String(meta.avatar_url || meta.picture || '').trim();
  return /^https:\/\/[^\s"'<>]+$/i.test(url) && url.length <= 2048 ? url : '';
}

/**
 * What to write to profiles: only fields that are empty today, so a name / photo the owner set
 * themselves is never overwritten by Google. Returns {} when there is nothing to fill.
 */
export function profilePatch(profile = {}, meta = {}) {
  const patch = {};
  const name = nameFromMetadata(meta);
  const photo = avatarFromMetadata(meta);
  if (!cleanName(profile.full_name) && name) patch.full_name = name;
  if (!String(profile.profile_image || '').trim() && photo) patch.profile_image = photo;
  return patch;
}

/** The terms + privacy consent (Upay requirement) is recorded on the account's metadata. */
export function hasConsent(user) {
  return Boolean(user?.user_metadata?.terms_accepted_at);
}

/** Which identity the session came from: 'google' | 'apple' | 'email' | … */
export function sessionProvider(user) {
  return user?.app_metadata?.provider || user?.identities?.[0]?.provider || 'email';
}

/** Apple "Hide my email" relay address (mail still reaches the owner, but only from verified senders). */
export function isPrivateRelayEmail(email) {
  return /@privaterelay\.appleid\.com$/i.test(String(email || '').trim());
}

/**
 * What the finish step must still ask before entering the app.
 *  consent: a brand-new account (onboarding not done) without a recorded consent and none ticked before leaving.
 *  name:    no name anywhere (Apple on the web, or a Google account without one).
 */
export function finishNeeds({ user, profile = {}, pending = null, onboardingCompleted = false }) {
  const consent = !onboardingCompleted && !hasConsent(user) && !pending?.consent;
  const name = !cleanName(profile.full_name) && !nameFromMetadata(user?.user_metadata || {});
  return { consent, name, any: consent || name };
}

/** Where to go once signed in: a set-up account → the return URL or /today; a new one → /onboarding. */
export function postAuthPath({ onboardingCompleted, returnTo }) {
  if (!onboardingCompleted) return '/onboarding';
  return safeReturnPath(returnTo) || '/today';
}

/** Error from Supabase / the provider (thrown error or the ?error=… of the callback URL) → Hebrew line. */
export function oauthErrorMessage(err, provider = 'google') {
  const label = PROVIDER_LABEL[provider] || 'Google';
  const text = `${err?.error || ''} ${err?.code || ''} ${err?.error_code || ''} ${err?.message || ''} ${err?.description || ''} ${err?.error_description || ''}`.toLowerCase();
  if (/access_denied|cancel|user_cancelled|popup_closed/.test(text)) return `ההתחברות עם ${label} בוטלה. אפשר לנסות שוב, או להמשיך עם אימייל.`;
  if (/unsupported provider|provider is not enabled|provider_disabled|not enabled|validation_failed/.test(text)) return `ההתחברות עם ${label} עוד לא פעילה. בינתיים אפשר להמשיך עם אימייל.`;
  if (/signup.*(disabled|not allowed)|signups not allowed/.test(text)) return 'פתיחת חשבונות חדשים סגורה כרגע.';
  if (/failed to fetch|network|timeout/.test(text)) return 'אין חיבור. בדקו את האינטרנט ונסו שוב.';
  if (/popup_blocked/.test(text)) return 'הדפדפן חסם את החלון של Apple. אפשרו חלונות קופצים ונסו שוב.';
  return `לא הצלחנו להתחבר עם ${label}. נסו שוב, או המשיכו עם אימייל.`;
}

/** { error, code, description } from the callback URL (hash or query), or null. */
export function callbackUrlError(hash = '', search = '') {
  const params = new URLSearchParams(`${String(hash).replace(/^#/, '')}&${String(search).replace(/^\?/, '')}`);
  const error = params.get('error');
  const code = params.get('error_code');
  if (!error && !code) return null;
  return { error, code, description: params.get('error_description') || '' };
}
