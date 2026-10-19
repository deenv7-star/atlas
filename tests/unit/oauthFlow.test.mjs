import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFlag, safeReturnPath, buildPending, writePending, readPending, clearPending, OAUTH_PENDING_KEY, OAUTH_PENDING_TTL_MS,
  nameFromMetadata, avatarFromMetadata, profilePatch, hasConsent, finishNeeds, postAuthPath, oauthErrorMessage,
  callbackUrlError, isPrivateRelayEmail, sessionProvider,
} from '../../src/lib/auth/oauthFlow.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };

test('parseFlag: default on, explicit off words turn it off', () => {
  assert.equal(parseFlag(undefined), true);
  assert.equal(parseFlag(''), true);
  assert.equal(parseFlag('', false), false);
  for (const v of ['false', 'FALSE', '0', 'off', 'no', ' false ']) assert.equal(parseFlag(v), false, v);
  for (const v of ['true', '1', 'on', 'yes']) assert.equal(parseFlag(v, false), true, v);
});

test('safeReturnPath: same-site paths only, never auth screens', () => {
  assert.equal(safeReturnPath('/bookings?id=3'), '/bookings?id=3');
  assert.equal(safeReturnPath('%2Ftoday'), '/today');
  assert.equal(safeReturnPath('https://evil.com'), null);
  assert.equal(safeReturnPath('//evil.com'), null);
  assert.equal(safeReturnPath('/\\evil.com'), null);
  assert.equal(safeReturnPath('/login?return=/x'), null);
  assert.equal(safeReturnPath('/auth/callback'), null);
  assert.equal(safeReturnPath('/register'), null);
  assert.equal(safeReturnPath('/onboarding'), null);
  assert.equal(safeReturnPath('/loginx'), '/loginx');
  assert.equal(safeReturnPath(null), null);
  assert.equal(safeReturnPath('%E0%A4%A'), null);
});

test('pending note: round trip, TTL, bad provider, junk', () => {
  const s = mem();
  const now = 1_000_000;
  const p = buildPending({ provider: 'google', intent: 'register', returnTo: '//evil', consent: { version: '2026-10-18' }, business: '  צימרי הגליל  ', now });
  assert.equal(p.returnTo, null);
  assert.equal(p.business, 'צימרי הגליל');
  assert.equal(p.consent.version, '2026-10-18');
  writePending(s, p);
  assert.deepEqual(readPending(s, now + 1000), p);
  assert.equal(readPending(s, now + OAUTH_PENDING_TTL_MS + 1), null);
  clearPending(s);
  assert.equal(readPending(s, now), null);
  s.setItem(OAUTH_PENDING_KEY, '{nope');
  assert.equal(readPending(s, now), null);
  s.setItem(OAUTH_PENDING_KEY, JSON.stringify({ provider: 'facebook', at: now }));
  assert.equal(readPending(s, now), null);
  assert.throws(() => buildPending({ provider: 'facebook' }));
  assert.equal(buildPending({ provider: 'apple', intent: 'weird', now }).intent, 'login');
  assert.equal(buildPending({ provider: 'apple', business: 'x'.repeat(80), now }).business.length, 50);
});

test('name + photo from Google metadata; Apple has neither', () => {
  const google = { full_name: 'Dana  Cohen', name: 'Dana Cohen', avatar_url: 'https://lh3.googleusercontent.com/a/abc=s96-c', picture: 'https://lh3.googleusercontent.com/a/abc=s96-c', email: 'dana@gmail.com' };
  assert.equal(nameFromMetadata(google), 'Dana Cohen');
  assert.equal(avatarFromMetadata(google), 'https://lh3.googleusercontent.com/a/abc=s96-c');
  assert.equal(nameFromMetadata({ given_name: 'דנה', family_name: 'כהן' }), 'דנה כהן');
  assert.equal(nameFromMetadata({ name: 'dana@gmail.com' }), '');
  const apple = { email: 'x@privaterelay.appleid.com', sub: '0012', iss: 'https://appleid.apple.com' };
  assert.equal(nameFromMetadata(apple), '');
  assert.equal(avatarFromMetadata(apple), '');
  assert.equal(avatarFromMetadata({ avatar_url: 'http://insecure/x.png' }), '');
  assert.equal(avatarFromMetadata({ avatar_url: 'javascript:alert(1)' }), '');
});

test('profilePatch fills only empty fields', () => {
  const meta = { full_name: 'Dana Cohen', avatar_url: 'https://lh3.googleusercontent.com/a/x' };
  assert.deepEqual(profilePatch({ full_name: '', profile_image: '' }, meta), { full_name: 'Dana Cohen', profile_image: 'https://lh3.googleusercontent.com/a/x' });
  assert.deepEqual(profilePatch({ full_name: 'דנה', profile_image: 'data:image/jpeg;base64,xx' }, meta), {});
  assert.deepEqual(profilePatch({ full_name: '  ', profile_image: null }, { avatar_url: 'https://x/y.png' }), { profile_image: 'https://x/y.png' });
  assert.deepEqual(profilePatch({}, {}), {});
});

test('finishNeeds: consent only for new accounts without one; name only when nowhere', () => {
  const newGoogle = { user_metadata: { full_name: 'Dana' } };
  assert.deepEqual(finishNeeds({ user: newGoogle, profile: { full_name: 'Dana' } }), { consent: true, name: false, any: true });
  assert.equal(finishNeeds({ user: newGoogle, profile: {}, pending: { consent: { version: 'v' } } }).any, false);
  assert.equal(finishNeeds({ user: { user_metadata: { full_name: 'D', terms_accepted_at: 'x' } }, profile: {} }).any, false);
  // Existing, set-up account (signed up before the consent box existed): never asked.
  assert.equal(finishNeeds({ user: { user_metadata: {} }, profile: { full_name: 'D' }, onboardingCompleted: true }).any, false);
  // Apple web: no name anywhere.
  const apple = finishNeeds({ user: { user_metadata: { email: 'a@privaterelay.appleid.com' } }, profile: { full_name: '' }, pending: { consent: { version: 'v' } } });
  assert.deepEqual(apple, { consent: false, name: true, any: true });
  assert.equal(hasConsent(null), false);
});

test('postAuthPath: new → onboarding, existing → return URL or /today', () => {
  assert.equal(postAuthPath({ onboardingCompleted: false, returnTo: '/bookings' }), '/onboarding');
  assert.equal(postAuthPath({ onboardingCompleted: true, returnTo: null }), '/today');
  assert.equal(postAuthPath({ onboardingCompleted: true, returnTo: '/bookings?x=1' }), '/bookings?x=1');
  assert.equal(postAuthPath({ onboardingCompleted: true, returnTo: 'https://evil.com' }), '/today');
});

test('Hebrew errors', () => {
  assert.match(oauthErrorMessage({ error: 'access_denied' }, 'google'), /בוטלה/);
  assert.match(oauthErrorMessage({ message: 'Unsupported provider: provider is not enabled' }, 'apple'), /Apple עוד לא פעילה/);
  assert.match(oauthErrorMessage({ error: 'popup_closed_by_user' }, 'apple'), /בוטלה/);
  assert.match(oauthErrorMessage(new TypeError('Failed to fetch')), /אין חיבור/);
  assert.match(oauthErrorMessage({ message: 'Signups not allowed for this instance' }), /סגורה/);
  assert.match(oauthErrorMessage({}), /לא הצלחנו להתחבר עם Google/);
});

test('callback URL errors + helpers', () => {
  assert.deepEqual(callbackUrlError('#error=access_denied&error_code=user_cancelled&error_description=x', ''), { error: 'access_denied', code: 'user_cancelled', description: 'x' });
  assert.deepEqual(callbackUrlError('', '?error=server_error'), { error: 'server_error', code: null, description: '' });
  assert.equal(callbackUrlError('#access_token=abc&refresh_token=d', ''), null);
  assert.equal(isPrivateRelayEmail('abc@privaterelay.appleid.com'), true);
  assert.equal(isPrivateRelayEmail('abc@gmail.com'), false);
  assert.equal(sessionProvider({ app_metadata: { provider: 'google' } }), 'google');
  assert.equal(sessionProvider({}), 'email');
});
