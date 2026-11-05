import test from 'node:test';
import assert from 'node:assert/strict';
import { statusOf, payOf, matchesChip, groupRows, nextStepOf, isImported, isOwnerBlock, chipFromTab, searchMatch } from '../../src/features/bookings-v2/model.js';

const day = '2026-11-05'; // Thursday
const B = (o) => ({ id: o.id || Math.random().toString(36), status: 'CONFIRMED', check_in_date: '2026-11-10', check_out_date: '2026-11-12', ...o });
const bal = (total, paid) => ({ total, paid, balance: Math.max(0, total - paid) });

test('status words', () => {
  assert.equal(statusOf(B({ status: 'PENDING' }), day).key, 'pending');
  assert.equal(statusOf(B({ status: 'CANCELLED' }), day).key, 'cancelled');
  assert.equal(statusOf(B({ check_in_date: '2026-11-01', check_out_date: '2026-11-03' }), day).key, 'past');
  assert.equal(statusOf(B({ check_in_date: day, check_out_date: '2026-11-07' }), day).label, 'מגיעים היום');
  assert.equal(statusOf(B({ check_in_date: '2026-11-03', check_out_date: day }), day).label, 'יוצאים היום');
});

test('pay chip', () => {
  assert.equal(payOf(bal(0, 0)).key, 'none');
  assert.equal(payOf(bal(1000, 1000)).key, 'paid');
  assert.equal(payOf(bal(1000, 300)).key, 'partial');
  assert.equal(payOf(bal(1000, 0)).key, 'unpaid');
  assert.equal(payOf({ unknown: true }).key, 'unknown');
});

test('chips', () => {
  const past = B({ check_in_date: '2026-10-01', check_out_date: '2026-10-03' });
  const cxl = B({ status: 'CANCELLED' });
  const pend = B({ status: 'PENDING' });
  assert.ok(matchesChip('upcoming', pend, day, bal(1, 0)));
  assert.ok(!matchesChip('upcoming', past, day, bal(1, 1)));
  assert.ok(!matchesChip('upcoming', cxl, day, bal(1, 1)));
  assert.ok(matchesChip('past', past, day, bal(1, 1)));
  assert.ok(matchesChip('cancelled', cxl, day, bal(1, 1)));
  assert.ok(matchesChip('unpaid', past, day, bal(100, 0)));
  assert.ok(!matchesChip('unpaid', cxl, day, bal(100, 0)));
  assert.ok(!matchesChip('unpaid', pend, day, bal(0, 0)));
  assert.equal(chipFromTab('pending'), 'pending');
  assert.equal(chipFromTab('all'), 'upcoming');
});

test('groups: today / this week (until Saturday) / later', () => {
  const rows = [B({ id: 'later', check_in_date: '2026-11-20', check_out_date: '2026-11-21' }), B({ id: 'now', check_in_date: '2026-11-04', check_out_date: '2026-11-06' }),
    B({ id: 'wk', check_in_date: '2026-11-07', check_out_date: '2026-11-08' }), B({ id: 'sun', check_in_date: '2026-11-08', check_out_date: '2026-11-09' })];
  const g = groupRows('upcoming', rows, day);
  assert.deepEqual(g.map((x) => [x.key, x.rows.map((r) => r.id)]), [['now', ['now']], ['week', ['wk']], ['later', ['sun', 'later']]]);
});

test('next step + imported + owner block + search', () => {
  assert.equal(nextStepOf(B({ status: 'PENDING' }), bal(1, 0), day).key, 'approve');
  assert.equal(nextStepOf(B({}), bal(1000, 0), day).key, 'pay');
  assert.equal(nextStepOf(B({}), bal(1000, 1000), day), null);
  assert.equal(nextStepOf(B({ external_sync_id: 's' }), bal(0, 0), day), null);
  assert.ok(isImported(B({ external_uid: 'x@airbnb.com' })));
  assert.ok(isOwnerBlock(B({ is_block: true, source: 'manual', guest_name: 'חסום' })));
  assert.ok(!isOwnerBlock(B({ is_block: true, source: 'airbnb', external_sync_id: 's' })));
  assert.ok(searchMatch('052', B({ guest_phone: '0521234567' })));
  assert.ok(searchMatch('כרכ', B({}), 'כרכום'));
});
