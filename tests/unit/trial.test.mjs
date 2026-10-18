// Run: npm run test:unit   (pins TZ=Asia/Jerusalem, where the DST bug was seen)
import test from 'node:test';
import assert from 'node:assert/strict';
import { trialDaysLeft, defaultTrialEnd, trialBannerText, trialShortText, TRIAL_DAYS } from '../../src/lib/trial.js';

const at = (s) => new Date(s); // local wall-clock time (TZ pinned by the script)

test('runs in Asia/Jerusalem', () => {
  assert.equal(Intl.DateTimeFormat().resolvedOptions().timeZone, 'Asia/Jerusalem');
});

test('signup on 18 Oct 2026 (trial crosses end of summer time) shows 14, not 15', () => {
  const signup = at('2026-10-18T02:20:00');
  const end = defaultTrialEnd(signup); // what onboarding stores: setDate + 14
  assert.equal(end.getDate(), 1); // 1 Nov, same wall-clock time
  assert.equal(end - signup, 14 * 86400000 + 3600000); // 14 days + 1 hour: the old ceil() made it 15
  assert.equal(trialDaysLeft(end, signup), 14);
});

test('signup with no DST change shows 14', () => {
  const signup = at('2026-11-10T09:00:00');
  assert.equal(trialDaysLeft(defaultTrialEnd(signup), signup), 14);
});

test('signup just before midnight and just after midnight both show 14', () => {
  for (const s of ['2026-10-18T23:59:00', '2026-10-19T00:01:00']) {
    const signup = at(s);
    assert.equal(trialDaysLeft(defaultTrialEnd(signup), signup), 14, s);
  }
});

test('counts down one per calendar day, then 0 on the last day, then expired', () => {
  const signup = at('2026-10-18T14:00:00');
  const end = defaultTrialEnd(signup);
  for (let i = 0; i <= TRIAL_DAYS; i++) {
    const day = new Date(signup);
    day.setDate(day.getDate() + i);
    day.setHours(8, 0, 0, 0); // morning of each day
    assert.equal(trialDaysLeft(end, day), TRIAL_DAYS - i, `day ${i}`);
  }
  assert.equal(trialDaysLeft(end, at('2026-11-01T13:59:00')), 0); // last day, still running
  assert.equal(trialDaysLeft(end, at('2026-11-01T14:00:00')), 0); // ended
  assert.equal(trialDaysLeft(end, at('2026-11-05T10:00:00')), 0); // long after
});

test('ISO string from the database (UTC) is read in local days', () => {
  // 1 Nov 2026 02:20 Israel = 31 Oct 2026 23:20Z (stored by toISOString)
  assert.equal(trialDaysLeft('2026-10-31T23:20:00.000Z', at('2026-10-18T02:20:00')), 14);
});

test('missing or invalid end → 0', () => {
  assert.equal(trialDaysLeft(null), 0);
  assert.equal(trialDaysLeft('not a date'), 0);
  assert.equal(defaultTrialEnd(null), null);
});

test('Hebrew banner text: plural, dual, singular, today, expired', () => {
  assert.equal(trialBannerText(14), 'נשארו 14 ימים לתקופת הניסיון');
  assert.equal(trialBannerText(2), 'נשארו יומיים לתקופת הניסיון');
  assert.equal(trialBannerText(1), 'נשאר יום אחד לתקופת הניסיון');
  assert.equal(trialBannerText(0), 'תקופת הניסיון מסתיימת היום');
  assert.equal(trialBannerText(0, true), 'תקופת הניסיון הסתיימה');
  assert.equal(trialShortText(14), 'נשארו 14 ימי ניסיון');
  assert.equal(trialShortText(1), 'נשאר יום ניסיון אחד');
  assert.equal(trialShortText(0), 'הניסיון מסתיים היום');
  assert.equal(trialShortText(3, true), 'הניסיון הסתיים');
});
