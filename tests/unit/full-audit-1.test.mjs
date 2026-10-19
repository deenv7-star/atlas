import test from 'node:test';
import assert from 'node:assert/strict';
import { getSafeReturnUrl } from '../../src/config/routes.js';
import { validatePassword } from '../../src/lib/validation.js';
import { todayIsrael } from '../../src/lib/localDate.js';
import { isPublicFeedUrl } from '../../supabase/functions/_shared/feedUrl.ts';

test('return URL: same-origin paths only', () => {
  assert.equal(getSafeReturnUrl('/dashboard'), '/dashboard');
  assert.equal(getSafeReturnUrl('%2Fbookings%3Fx%3D1'), '/bookings?x=1');
  for (const bad of ['//evil.com', '/\\evil.com', '%2F%5Cevil.com', 'https://evil.com', '/\tx', '%E0%A4%A', '', null]) {
    assert.equal(getSafeReturnUrl(bad), null, String(bad));
  }
});

test('password: Hebrew letters count as letters', () => {
  assert.equal(validatePassword('שלוםשלום1').valid, true);
  assert.equal(validatePassword('abcdefg1').valid, true);
  assert.equal(validatePassword('12345678').valid, false);
  assert.equal(validatePassword('abc1').valid, false);
});

test('today in Israel, not UTC', () => {
  assert.equal(todayIsrael(new Date('2026-10-31T22:30:00Z')), '2026-11-01'); // 00:30 IST on Nov 1
  assert.equal(todayIsrael(new Date('2026-06-30T21:30:00Z')), '2026-07-01'); // 00:30 IDT on Jul 1
  assert.equal(todayIsrael(new Date('2026-01-01T10:00:00Z')), '2026-01-01');
});

test('iCal feed URL guard (SSRF)', () => {
  for (const ok of ['https://www.airbnb.com/calendar/ical/1.ics?s=x', 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=a', 'https://calendar.google.com/calendar/ical/x/basic.ics']) assert.equal(isPublicFeedUrl(ok), true, ok);
  for (const bad of ['http://localhost/x', 'http://127.0.0.1:54321/', 'http://169.254.169.254/latest', 'http://10.1.2.3/', 'http://[::1]/', 'http://2130706433/', 'http://kong:8000/', 'https://u:p@x.com/', 'http://192.168.1.1/', 'http://x.com:5432/', 'ftp://x.com/a.ics', 'not a url']) assert.equal(isPublicFeedUrl(bad), false, bad);
});
