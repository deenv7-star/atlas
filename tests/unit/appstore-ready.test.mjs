// App Store readiness (appstore-ready, 26.11.2026): guards for the review blockers fixed on fix/appstore-ready.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { aiConsentKey, hasAiConsent, setAiConsent, clearAiConsent, needsAiConsent, AI_PROVIDERS } from '../../src/lib/aiConsent.js';
import { isNativeMarketingPath, nativeStartRedirect } from '../../src/lib/native.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
function memStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('5.1.2(i): AI consent is asked once per account in the iOS app, never on the web', () => {
  const st = memStore();
  assert.equal(needsAiConsent('u1', { native: true, storage: st }), true);
  assert.equal(needsAiConsent('u1', { native: false, storage: st }), false);
  setAiConsent('u1', st, new Date('2026-11-26T10:00:00Z'));
  assert.equal(hasAiConsent('u1', st), true);
  assert.equal(st.getItem(aiConsentKey('u1')), '2026-11-26T10:00:00.000Z');
  assert.equal(needsAiConsent('u1', { native: true, storage: st }), false);
  assert.equal(needsAiConsent('u2', { native: true, storage: st }), true, 'another account on the same phone is asked again');
  clearAiConsent('u1', st);
  assert.equal(needsAiConsent('u1', { native: true, storage: st }), true);
  assert.deepEqual(AI_PROVIDERS, ['OpenAI', 'ElevenLabs']);
});

test('5.1.2(i): the consent sheet names both AI providers and both entry points use it', () => {
  const sheet = read('src/components/privacy/AiConsentSheet.jsx');
  for (const p of AI_PROVIDERS) assert.match(sheet, new RegExp(p));
  assert.match(read('src/assistant/AssistantPanel.jsx'), /needsAiConsent\(user\?\.id\)/);
  assert.match(read('src/support/SupportWidget.jsx'), /needsAiConsent\(user\?\.id\)/);
  assert.match(read('src/config/legal.js'), /name: 'ElevenLabs'/, 'privacy policy lists ElevenLabs');
});

test('3.1.1: marketing pages are never shown inside the app', () => {
  for (const p of ['/about', '/blog', '/blog/zimmer-insurance', '/how-it-works', '/early', '/sla', '/status/']) assert.equal(isNativeMarketingPath(p), true, p);
  for (const p of ['/privacy', '/terms', '/contact', '/dashboard', '/g/abc', '/book/x', '/guest-service']) assert.equal(isNativeMarketingPath(p), false, p);
  const prev = globalThis.window;
  globalThis.window = { Capacitor: { isNativePlatform: () => true }, location: { origin: 'capacitor://localhost' } };
  try {
    assert.equal(nativeStartRedirect({ pathname: '/blog/x', search: '', hash: '' }, memStore()), '/login');
    assert.equal(nativeStartRedirect({ pathname: '/privacy', search: '', hash: '' }, memStore()), null);
  } finally { if (prev === undefined) delete globalThis.window; else globalThis.window = prev; }
  const app = read('src/App.jsx');
  for (const r of ['/about', '/blog', '/blog/:slug', '/sla', '/how-it-works', '/early', '/status']) {
    assert.match(app, new RegExp(`path="${r.replace(/[/:]/g, (c) => `\\${c}`)}" element=\\{nativeOff\\(`), r);
  }
});

test('3.1.1: no trial offer or renewal call to action in native copy', () => {
  assert.match(read('src/pages/Register.jsx'), /NATIVE \? 'החשבון מוכן בדקה\.'/);
  const pw = read('src/components/paywall/TrialPaywall.jsx');
  const nativeLocked = pw.slice(pw.indexOf('function NativeLocked'), pw.indexOf('function CycleToggle'));
  assert.doesNotMatch(nativeLocked, /לחידוש|חבילה|מחיר|₪|href=|<Link/);
  const site = read('src/site/design/a/index.jsx');
  assert.match(site, /if \(isNativeApp\(\)\) return <NativeHeader \/>/);
  assert.match(site, /\(isNativeApp\(\) \? \[\] : FOOTER_GROUPS\)/);
});

test('iOS bundle: privacy manifest in the app target, Hebrew usage strings, push + Apple sign-in entitlements', () => {
  assert.ok(existsSync(new URL('../../ios/App/App/PrivacyInfo.xcprivacy', import.meta.url)));
  const manifest = read('ios/App/App/PrivacyInfo.xcprivacy');
  assert.match(manifest, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  const pbx = read('ios/App/App.xcodeproj/project.pbxproj');
  assert.match(pbx, /PrivacyInfo\.xcprivacy in Resources \*\/,/);
  const plist = read('ios/App/App/Info.plist');
  for (const k of ['NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription', 'NSPhotoLibraryAddUsageDescription', 'NSMicrophoneUsageDescription', 'NSFaceIDUsageDescription']) {
    const m = plist.match(new RegExp(`<key>${k}</key>\\s*<string>([^<]+)</string>`));
    assert.ok(m, k);
    assert.match(m[1], /[\u0590-\u05FF]/, `${k} is Hebrew`);
  }
  const rel = read('ios/App/App/AppRelease.entitlements');
  assert.match(rel, /aps-environment<\/key>\s*<string>production/);
  assert.match(rel, /com\.apple\.developer\.applesignin/);
});

test('2.1 / 2.3.1: no "בקרוב" promise and no e-signing claim in the iOS app (source guards)', () => {
  const integ = read('src/pages/Integrations.jsx');
  assert.match(integ, /filter\(\(it\) => !\(native && \(it\.s === 'soon' \|\| it\.s === 'meta'\)\)\)/);
  const src = read('src/components/inbox/Sources.jsx');
  assert.match(src, /const meta = native \? \[\] :/);
  assert.match(src, /native && !webhookLive \? null : <Card id="webhook"/);
  assert.match(read('src/pages/Leads.jsx'), /isNativeApp\(\) \? 'וואטסאפ, אתר הצימר ושיחות טלפון'/);
  const sj = read('src/components/onboarding/v2/setup/SetupJourney.jsx');
  assert.match(sj, /filter\(\(s\) => !\(isNativeApp\(\) && s\.status === 'soon'\)\)/);
  assert.match(sj, /\.\.\.\(isNativeApp\(\) \? \[\] : \['שליחה אוטומטית בלי לגעת תגיע בקרוב\.'\]\)/);
  assert.match(read('src/components/import/b/ImportB.jsx'), /\{isNativeApp\(\) \? null : <p className="imb-voice">/);
  assert.match(read('src/components/pageguide/guides.js'), /get hint\(\) \{ return isNativeApp\(\) \? 'כל חוזה נמלא מפרטי ההזמנה\.'/);
  assert.match(read('src/config/navigation.js'), /desc: isNativeApp\(\) \? 'חוזה לאורח, נמלא מפרטי ההזמנה' : 'חוזה לאורח, נחתם בטלפון'/);
});
