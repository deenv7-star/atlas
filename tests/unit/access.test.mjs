// Trial / subscription gate (src/lib/access.js) + client write lock (src/lib/accessLock.js). Run: npm run test:unit
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAccess, isPathAllowedWhileLocked } from '../../src/lib/access.js';
import {
  setAccessLocked, isAccessLocked, assertWritable, isBlockedSupabaseRequest, LOCKED_CODE,
} from '../../src/lib/accessLock.js';

const NOW = new Date('2026-11-03T20:06:00+02:00');
const days = (n) => new Date(NOW.getTime() + n * 86400000).toISOString();
const SB = 'https://romvmqbcinurscwdsskx.supabase.co';

test('trial active: open, days counted', () => {
  const a = computeAccess({ subscription_status: 'trialing', trial_ends_at: days(5) }, { now: NOW });
  assert.equal(a.state, 'trial');
  assert.equal(a.locked, false);
  assert.equal(a.daysLeft, 5);
});

test('trial expired, not paid: locked (the bug on 3.11.2026)', () => {
  const a = computeAccess({ subscription_status: 'trialing', trial_ends_at: days(-1) }, { now: NOW });
  assert.equal(a.state, 'expired');
  assert.equal(a.locked, true);
  assert.equal(a.reason, 'trial_ended');
});

test('trial ended a minute ago: locked', () => {
  const a = computeAccess({ subscription_status: 'trialing', trial_ends_at: new Date(NOW.getTime() - 60000) }, { now: NOW });
  assert.equal(a.locked, true);
});

test('paid active: open even though the trial date passed', () => {
  for (const s of ['active', 'paid', 'ACTIVE']) {
    const a = computeAccess({ subscription_status: s, trial_ends_at: days(-30) }, { now: NOW });
    assert.equal(a.state, 'paid', s);
    assert.equal(a.locked, false, s);
  }
});

test('paid, canceled, period left: open until the period ends', () => {
  const u = { subscription_status: 'canceled', trial_ends_at: days(-40), current_period_end: days(10) };
  assert.equal(computeAccess(u, { now: NOW }).state, 'grace');
  assert.equal(computeAccess(u, { now: NOW }).locked, false);
  const after = new Date(NOW.getTime() + 11 * 86400000);
  const b = computeAccess(u, { now: after });
  assert.equal(b.locked, true);
  assert.equal(b.reason, 'subscription_ended');
});

test('canceled with no period end: locked', () => {
  const a = computeAccess({ subscription_status: 'canceled', trial_ends_at: days(-20) }, { now: NOW });
  assert.equal(a.locked, true);
  assert.equal(a.reason, 'subscription_ended');
});

test('canceled during the trial: open until the trial ends', () => {
  const a = computeAccess({ subscription_status: 'canceled', trial_ends_at: days(3) }, { now: NOW });
  assert.equal(a.locked, false);
});

test('past_due without a known period end: open (grace)', () => {
  const a = computeAccess({ subscription_status: 'past_due', trial_ends_at: days(-20) }, { now: NOW });
  assert.equal(a.locked, false);
  assert.equal(a.state, 'grace');
});

test('past_due: open 3 days after period end, locked after', () => {
  const u = (d) => ({ subscription_status: 'past_due', trial_ends_at: days(-40), current_period_end: days(d) });
  assert.equal(computeAccess(u(-2), { now: NOW }).locked, false);
  assert.equal(computeAccess(u(-4), { now: NOW }).locked, true);
})

test('admin: never locked, state still reported', () => {
  const a = computeAccess({ subscription_status: 'trialing', trial_ends_at: days(-100) }, { now: NOW, isAdmin: true });
  assert.equal(a.state, 'expired');
  assert.equal(a.locked, false);
  assert.equal(a.isAdmin, true);
});

test('no trial date and no signup date: open (account before start_my_trial)', () => {
  assert.equal(computeAccess({ subscription_status: 'trialing' }, { now: NOW }).locked, false);
});

test('no trial date: falls back to signup + 14 days, like the admin console', () => {
  assert.equal(computeAccess({ created_at: days(-10) }, { now: NOW }).locked, false);
  assert.equal(computeAccess({ created_at: days(-15) }, { now: NOW }).locked, true);
});

test('signed out: nothing to lock', () => {
  assert.deepEqual(computeAccess(null, { now: NOW }).locked, false);
});

test('demo force flag', () => {
  const live = { subscription_status: 'active' };
  assert.equal(computeAccess(live, { now: NOW, force: 'expired' }).locked, true);
  assert.equal(computeAccess(live, { now: NOW, force: 'expired', isAdmin: true }).locked, false);
  assert.equal(computeAccess({ trial_ends_at: days(-5) }, { now: NOW, force: 'paid' }).locked, false);
  assert.equal(computeAccess({ trial_ends_at: days(-5) }, { now: NOW, force: 'trial' }).state, 'trial');
});

test('routes reachable while locked', () => {
  for (const p of ['/billing', '/subscription', '/privacy', '/terms', '/contact', '/billing/']) assert.equal(isPathAllowedWhileLocked(p), true, p);
  for (const p of ['/today', '/dashboard', '/calendar', '/bookings', '/leads', '/payments', '/settings', '/booking/1', '/ai-assistant', '/billingx']) {
    assert.equal(isPathAllowedWhileLocked(p), false, p);
  }
});

test('write lock: entities throw a coded error only while locked', () => {
  setAccessLocked(false);
  assert.doesNotThrow(() => assertWritable());
  setAccessLocked(true);
  assert.equal(isAccessLocked(), true);
  assert.throws(() => assertWritable(), (e) => e.code === LOCKED_CODE && /המנוי לא פעיל/.test(e.message));
  setAccessLocked(false);
});

test('write lock: supabase requests', () => {
  setAccessLocked(false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/bookings`, 'POST'), false, 'open when not locked');
  setAccessLocked(true);
  // data writes refused
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/bookings`, 'POST'), true);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/bookings?id=eq.1`, 'PATCH'), true);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/leads?id=eq.1`, 'DELETE'), true);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/rpc/create_booking`, 'POST'), true);
  assert.equal(isBlockedSupabaseRequest(`${SB}/functions/v1/ai-chat`, 'POST'), true);
  assert.equal(isBlockedSupabaseRequest(`${SB}/storage/v1/object/atlas-files/x.png`, 'POST'), true);
  // still allowed: reads, auth, plan request, support, account status/deletion
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/bookings?select=*`, 'GET'), false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/auth/v1/logout`, 'POST'), false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/auth/v1/token?grant_type=refresh_token`, 'POST'), false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/contact_messages`, 'POST'), false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/support_messages`, 'POST'), false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/functions/v1/support-chat`, 'POST'), false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/rpc/my_account_status`, 'POST'), false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/rpc/is_platform_admin`, 'POST'), false);
  assert.equal(isBlockedSupabaseRequest(`${SB}/rest/v1/rpc/delete_my_account`, 'POST'), false);
  setAccessLocked(false);
});
