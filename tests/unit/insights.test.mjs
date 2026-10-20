import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInsights, findGapNights, relDay, waitedFor, RULES,
  visibleInsights, dismissInsight, snoozeInsight, readInsightState, writeInsightState,
} from '../../src/lib/insights/engine.js';
import { IL_PEAK_PERIODS } from '../../src/lib/insights/ilPeriods.js';
import { groupPaymentsByBooking } from '../../src/lib/stay/bookings.js';

const TODAY = '2026-10-20';
const NOW = new Date('2026-10-20T09:30:00+03:00');
const P = [{ id: 'p1', name: 'צימר הגפן' }, { id: 'p2', name: 'צימר הזית' }];
let n = 0;
const bk = (o) => ({ id: `b${++n}`, property_id: 'p1', guest_name: 'משפחת לוי', guest_phone: '052-6418830', status: 'CONFIRMED', total_price: 1000, ...o });
const paid = (b, amount = b.total_price, extra = {}) => ({ id: `pay-${b.id}-${amount}`, booking_id: b.id, amount, status: 'PAID', paid_at: '2026-10-01', ...extra });
const run = (o = {}) => buildInsights({
  today: TODAY, now: NOW, properties: P, periods: [], reviewRequests: [], ...o,
  paymentsByBooking: groupPaymentsByBooking(o.payments || []),
});
const only = (items, rule) => items.filter((x) => x.rule === rule);
const NUM = /\d[\d,]*/g;

test('helpers: relative day and waiting time read naturally', () => {
  assert.equal(relDay(TODAY, TODAY), 'היום');
  assert.equal(relDay(TODAY, '2026-10-21'), 'מחר');
  assert.equal(relDay(TODAY, '2026-10-19'), 'אתמול');
  assert.equal(relDay(TODAY, '2026-10-22'), 'יום ה׳, 22 באוק׳');
  assert.equal(relDay(TODAY, '2026-10-22', { on: true }), 'ביום ה׳, 22 באוק׳,');
  assert.equal(waitedFor(3 * 3600e3), 'כבר 3 שעות');
  assert.equal(waitedFor(2 * 3600e3), 'כבר שעתיים');
  assert.equal(waitedFor(50 * 3600e3), 'כבר יומיים');
});

test('empty account with units: only the first-booking idea, no invented numbers', () => {
  const items = run({ bookings: [], syncs: [{ id: 's' }] });
  assert.deepEqual(items.map((x) => x.id), ['setup:first_booking']);
  assert.equal(items[0].severity, 'idea');
  assert.equal(items[0].action.kind, 'new_booking');
  assert.equal(items[0].why.match(NUM), null);
});

test('setup: empty account without units or channels gets both steps; hidden while the setup card shows them', () => {
  const ids = run({ bookings: [], properties: [], syncs: [] }).map((x) => x.id);
  assert.deepEqual(ids, ['setup:units', 'setup:channels']);
  assert.deepEqual(run({ bookings: [], properties: [], syncs: [], setupInProgress: true }), []);
  // unknown syncs (not loaded) → never claim "not connected"
  assert.deepEqual(run({ bookings: [], properties: [] }).map((x) => x.id), ['setup:units']);
  // setup items never show once there is a booking
  const b = bk({ check_in_date: '2026-11-20', check_out_date: '2026-11-22' });
  assert.equal(only(run({ bookings: [b], payments: [paid(b)], syncs: [] }), 'setup').length, 0);
});

test('unpaid arrival: tomorrow with a balance is urgent, amount is the real balance', () => {
  const b = bk({ check_in_date: '2026-10-21', check_out_date: '2026-10-23', total_price: 2300 });
  const items = run({ bookings: [b], payments: [paid(b, 700)] });
  const [x] = only(items, 'unpaid_arrival');
  assert.equal(x.severity, 'urgent');
  assert.equal(x.label, 'דחוף');
  assert.equal(x.amount, 1600);
  assert.match(x.why, /מחר/);
  assert.match(x.why, /1,600/);
  assert.deepEqual(x.action, { label: 'לשלוח תזכורת', kind: 'whatsapp', template: 'balance_reminder', bookingId: b.id });
});

test('unpaid arrival: in 3 days is "כדאי"; in 4 days or fully paid is nothing', () => {
  const b3 = bk({ check_in_date: '2026-10-23', check_out_date: '2026-10-25' });
  const b4 = bk({ check_in_date: '2026-10-24', check_out_date: '2026-10-26' });
  const bp = bk({ check_in_date: '2026-10-21', check_out_date: '2026-10-22' });
  const items = only(run({ bookings: [b3, b4, bp], payments: [paid(bp)] }), 'unpaid_arrival');
  assert.deepEqual(items.map((x) => [x.id, x.severity]), [[`unpaid_arrival:${b3.id}`, 'worth']]);
  assert.match(items[0].why, /^ההגעה ביום ו׳, 23 באוק׳, ועוד חסרים/);
});

test('unpaid arrival: reminder already sent or no phone → the action opens the booking instead', () => {
  const b = bk({ check_in_date: TODAY, check_out_date: '2026-10-22' });
  const sent = new Map([[b.id, new Set(['וואטסאפ · תזכורת יתרה'])]]);
  const [x] = only(run({ bookings: [b], sentByBooking: sent }), 'unpaid_arrival');
  assert.match(x.why, /תזכורת כבר נשלחה/);
  assert.deepEqual(x.action, { label: 'לרשום תשלום', to: `/booking/${b.id}` });
  const np = bk({ check_in_date: TODAY, check_out_date: '2026-10-22', guest_phone: '' });
  assert.equal(only(run({ bookings: [np] }), 'unpaid_arrival')[0].action.to, `/booking/${np.id}`);
});

test('cancelled and checked-out bookings never raise a balance', () => {
  const c = bk({ check_in_date: TODAY, check_out_date: '2026-10-22', status: 'CANCELLED' });
  const o = bk({ check_in_date: '2026-10-10', check_out_date: '2026-10-12', status: 'CHECKED_OUT' });
  const items = run({ bookings: [c, o] });
  assert.equal(only(items, 'unpaid_arrival').length + only(items, 'overdue_balance').length, 0);
});

test('overdue balance: pending payment past its due date is urgent with the due date', () => {
  const b = bk({ check_in_date: '2026-10-16', check_out_date: '2026-10-19', total_price: 3450 });
  const pays = [paid(b, 1035), { id: 'pp', booking_id: b.id, amount: 2415, status: 'PENDING', due_date: '2026-10-16' }];
  const [x] = only(run({ bookings: [b], payments: pays }), 'overdue_balance');
  assert.equal(x.severity, 'urgent');
  assert.match(x.why, /2,415/);
  assert.match(x.why, /16 באוק׳/);
});

test('overdue balance: more than 2 become one summary with the real total', () => {
  const bs = [10, 11, 12].map((d) => bk({ check_in_date: `2026-10-${d}`, check_out_date: `2026-10-${d + 2}`, total_price: 1000 }));
  const items = only(run({ bookings: bs }), 'overdue_balance');
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'overdue_balance:all');
  assert.equal(items[0].count, 3);
  assert.equal(items[0].amount, 3000);
  assert.match(items[0].why, /3,000/);
  assert.deepEqual(items[0].action, { label: 'לכל היתרות', to: '/balances' });
});

test('stale lead: NEW and older than 2h only; one lead links to it', () => {
  const l1 = { id: 'l1', full_name: 'שירה אוחיון', status: 'NEW', created_at: '2026-10-20T06:00:00+03:00' }; // 3.5h
  const fresh = { id: 'l2', full_name: 'תומר', status: 'NEW', created_at: '2026-10-20T08:30:00+03:00' }; // 1h
  const contacted = { id: 'l3', full_name: 'הילה', status: 'CONTACTED', created_at: '2026-10-10T08:00:00+03:00' };
  const b = bk({ check_in_date: '2026-12-01', check_out_date: '2026-12-02' });
  const [x, ...rest] = only(run({ bookings: [b], payments: [paid(b)], leads: [l1, fresh, contacted] }), 'stale_lead');
  assert.equal(rest.length, 0);
  assert.equal(x.id, 'stale_lead:l1');
  assert.equal(x.severity, 'worth');
  assert.match(x.title, /שירה אוחיון/);
  assert.match(x.why, /כבר 3 שעות/);
  assert.equal(x.action.to, '/lead/l1');
  assert.ok(RULES.leadStaleMs === 2 * 3600e3);
});

test('stale lead: several become one item; urgent when a guest asked for the coming week', () => {
  const leads = [
    { id: 'a', full_name: 'קרן פלד', status: 'NEW', created_at: '2026-10-16T09:00:00+03:00' },
    { id: 'b', full_name: 'תומר', status: 'NEW', created_at: '2026-10-18T09:00:00+03:00', check_in_date: '2026-10-24' },
  ];
  const [x] = only(run({ bookings: [], leads }), 'stale_lead');
  assert.equal(x.id, 'stale_lead:all');
  assert.equal(x.severity, 'urgent');
  assert.match(x.title, /^2 פניות/);
  assert.match(x.why, /קרן פלד/);
  assert.match(x.why, /4 ימים/);
});

test('sync broken: error and conflicts are urgent and point to the channels screen', () => {
  const b = bk({ check_in_date: '2026-12-01', check_out_date: '2026-12-02' });
  const items = only(run({
    bookings: [b], payments: [paid(b)],
    syncProblems: [
      { id: 's1', provider: 'BOOKING_COM', sync_status: 'ERROR', last_success_at: '2026-10-17T10:00:00Z' },
      { id: 's2', provider: 'AIRBNB', sync_status: 'OK', conflicts: [{ day: '2026-10-25' }, { day: '2026-10-26' }] },
    ],
  }), 'sync_broken');
  assert.deepEqual(items.map((x) => x.title), ['הלוח לא מתעדכן מ-Booking', 'תאריכים כפולים מול Airbnb']);
  assert.match(items[0].why, /17 באוק׳/);
  assert.match(items[1].why, /2 לילות/);
  assert.ok(items.every((x) => x.severity === 'urgent' && x.action.to === '/integrations'));
});

test('same-day turnover: urgent until the cleaning is DONE', () => {
  const out = bk({ guest_name: 'Sarah Klein', check_in_date: '2026-10-16', check_out_date: TODAY, status: 'CHECKED_IN' });
  const inn = bk({ guest_name: 'שקד ויובל', check_in_date: TODAY, check_out_date: '2026-10-22', check_in_time: '15:00' });
  const pays = [paid(out), paid(inn)];
  const [x] = only(run({ bookings: [out, inn], payments: pays }), 'turnover');
  assert.equal(x.severity, 'urgent');
  assert.match(x.why, /Sarah Klein יוצאים ושקד ויובל נכנסים היום ב-15:00/);
  const done = [{ id: 'c', booking_id: out.id, status: 'DONE' }];
  assert.equal(only(run({ bookings: [out, inn], payments: pays, cleaningTasks: done }), 'turnover').length, 0);
  // another unit's arrival is not a turnover
  const other = { ...inn, id: 'bx', property_id: 'p2' };
  assert.equal(only(run({ bookings: [out, other], payments: [paid(out), paid(other)] }), 'turnover').length, 0);
});

test('gap nights: 1–2 free nights between stays, not 3, not open-ended', () => {
  const bs = [
    bk({ check_in_date: '2026-10-20', check_out_date: '2026-10-22' }),
    bk({ check_in_date: '2026-10-23', check_out_date: '2026-10-25' }), // gap: 22
    bk({ check_in_date: '2026-10-27', check_out_date: '2026-10-28' }), // gap: 25–26
    bk({ check_in_date: '2026-10-31', check_out_date: '2026-11-02' }), // 28–30 = 3 nights: not a gap
  ];
  const gaps = findGapNights({ today: TODAY, bookings: bs, properties: P });
  assert.deepEqual(gaps.map((g) => [g.from, g.nights]), [['2026-10-22', 1], ['2026-10-25', 2]]);
  const [x] = only(run({ bookings: bs, payments: bs.map((b) => paid(b)) }), 'gap_nights');
  assert.equal(x.title, '3 לילות בודדים בין הזמנות');
  assert.equal(x.severity, 'worth');
  assert.match(x.why, /צימר הגפן, 22 באוק׳/);
  assert.equal(x.action.to, '/dynamic-pricing');
});

test('gap nights: a far-away single gap is only an idea', () => {
  const bs = [
    bk({ check_in_date: '2026-11-05', check_out_date: '2026-11-07' }),
    bk({ check_in_date: '2026-11-08', check_out_date: '2026-11-10' }),
  ];
  const [x] = only(run({ bookings: bs, payments: bs.map((b) => paid(b)) }), 'gap_nights');
  assert.equal(x.title, 'לילה בודד בין שתי הזמנות');
  assert.equal(x.severity, 'idea');
});

test('holiday: next Hebcal period within 60 days with the real count of free nights', () => {
  const b = bk({ check_in_date: '2026-12-05', check_out_date: '2026-12-07' }); // 2 nights of חנוכה booked in p1
  const items = buildInsights({
    today: TODAY, now: NOW, properties: P, bookings: [b], periods: IL_PEAK_PERIODS, reviewRequests: [],
    paymentsByBooking: groupPaymentsByBooking([paid(b)]),
  });
  const [x] = only(items, 'holiday_free');
  assert.equal(x.title, 'חנוכה בעוד 45 ימים');
  assert.equal(x.severity, 'idea');
  assert.equal(x.count, 2 * 9 - 2); // 2 units × nights 4–12 Dec, minus 2 booked
  assert.match(x.why, /^16 לילות פנויים מתוך 18/);
  const [all] = only(buildInsights({ today: TODAY, now: NOW, properties: P, bookings: [bk({ check_in_date: '2026-11-01', check_out_date: '2026-11-02' })], periods: IL_PEAK_PERIODS, reviewRequests: [] }), 'holiday_free');
  assert.equal(all.why, 'כל 18 הלילות עדיין פנויים (4-12 בדצמ׳, 2 יחידות).');
});

test('holiday: nothing when it is fully booked or further than 60 days', () => {
  const far = [{ name: 'פסח', from: '2027-04-21', to: '2027-04-28', kind: 'holiday' }];
  const b = bk({ check_in_date: '2026-12-01', check_out_date: '2026-12-02' });
  assert.equal(only(run({ bookings: [b], payments: [paid(b)], periods: far }), 'holiday_free').length, 0);
  const near = [{ name: 'חנוכה', from: '2026-10-25', to: '2026-10-26', kind: 'holiday' }];
  const full = ['p1', 'p2'].map((pid) => bk({ property_id: pid, check_in_date: '2026-10-25', check_out_date: '2026-10-27' }));
  assert.equal(only(run({ bookings: full, payments: full.map((x) => paid(x)), periods: near }), 'holiday_free').length, 0);
  const [soon] = only(run({ bookings: [full[0]], payments: [paid(full[0])], periods: near }), 'holiday_free');
  assert.equal(soon.severity, 'worth');
  assert.equal(soon.count, 2);
});

test('review request: checked out in the last week without a review request or thanks message', () => {
  const b = bk({ guest_name: 'גיל ושירן', check_in_date: '2026-10-17', check_out_date: '2026-10-19', status: 'CHECKED_OUT' });
  const [x] = only(run({ bookings: [b], payments: [paid(b)] }), 'review_request');
  assert.equal(x.severity, 'worth');
  assert.match(x.why, /יצאו אתמול/);
  assert.deepEqual(x.action, { label: 'לשלוח בקשה', kind: 'whatsapp', template: 'thanks_review', bookingId: b.id });
  // already asked (review_requests row) or thanked (message log) → nothing
  assert.equal(only(run({ bookings: [b], payments: [paid(b)], reviewRequests: [{ booking_id: b.id }] }), 'review_request').length, 0);
  const sent = new Map([[b.id, new Set(['וואטסאפ · תודה ובקשת ביקורת'])]]);
  assert.equal(only(run({ bookings: [b], payments: [paid(b)], sentByBooking: sent }), 'review_request').length, 0);
  // review requests not loaded → never guess
  assert.equal(only(run({ bookings: [b], payments: [paid(b)], reviewRequests: undefined }), 'review_request').length, 0);
});

test('review request: older than 7 days or leaving today and still in → nothing; several → one summary', () => {
  const old = bk({ check_in_date: '2026-10-08', check_out_date: '2026-10-11', status: 'CHECKED_OUT' });
  const staying = bk({ check_in_date: '2026-10-18', check_out_date: TODAY, status: 'CHECKED_IN' });
  assert.equal(only(run({ bookings: [old, staying], payments: [paid(old), paid(staying)] }), 'review_request').length, 0);
  const a = bk({ check_in_date: '2026-10-15', check_out_date: '2026-10-17', status: 'CHECKED_OUT' });
  const c = bk({ guest_name: 'רוני פרץ', check_in_date: '2026-10-17', check_out_date: '2026-10-19', status: 'CHECKED_OUT' });
  const [x] = only(run({ bookings: [a, c], payments: [paid(a), paid(c)] }), 'review_request');
  assert.equal(x.id, 'review_request:all');
  assert.equal(x.title, '2 אורחים יצאו בלי בקשת ביקורת');
  assert.match(x.why, /רוני פרץ, אתמול/);
});

test('no expenses: only with 3+ bookings and a loaded, empty expenses list', () => {
  const bs = [1, 2, 3].map((d) => bk({ check_in_date: `2026-11-0${d}`, check_out_date: `2026-11-0${d + 1}`, property_id: `p${(d % 2) + 1}` }));
  const pays = bs.map((b) => paid(b));
  const [x] = only(run({ bookings: bs, payments: pays, expenses: [] }), 'no_expenses');
  assert.equal(x.severity, 'idea');
  assert.match(x.why, /^3 הזמנות נרשמו/);
  assert.equal(x.action.to, '/expense-tracker');
  assert.equal(only(run({ bookings: bs, payments: pays }), 'no_expenses').length, 0); // not loaded / feature off
  assert.equal(only(run({ bookings: bs.slice(0, 2), payments: pays, expenses: [] }), 'no_expenses').length, 0);
});

test('no expenses: quiet for 45+ days while stays continue', () => {
  const bs = [
    bk({ check_in_date: '2026-10-01', check_out_date: '2026-10-03' }),
    bk({ check_in_date: '2026-10-05', check_out_date: '2026-10-06' }),
    bk({ check_in_date: '2026-10-08', check_out_date: '2026-10-09' }),
  ];
  const pays = bs.map((b) => paid(b));
  const [x] = only(run({ bookings: bs, payments: pays, expenses: [{ expense_date: '2026-08-15', amount: 200 }] }), 'no_expenses');
  assert.match(x.why, /15 באוג׳/);
  assert.match(x.why, /ומאז היו 3 הזמנות/);
  assert.equal(only(run({ bookings: bs, payments: pays, expenses: [{ expense_date: '2026-10-10' }] }), 'no_expenses').length, 0);
});

test('order: דחוף before כדאי before רעיון; ids are unique and stable', () => {
  const arr = bk({ check_in_date: '2026-10-21', check_out_date: '2026-10-23' });
  const gapA = bk({ property_id: 'p2', check_in_date: '2026-11-05', check_out_date: '2026-11-07' });
  const gapB = bk({ property_id: 'p2', check_in_date: '2026-11-08', check_out_date: '2026-11-09' });
  const lead = { id: 'l9', full_name: 'דנה', status: 'NEW', created_at: '2026-10-19T08:00:00+03:00' };
  const input = { bookings: [arr, gapA, gapB], payments: [paid(gapA), paid(gapB)], leads: [lead] };
  const a = run(input);
  assert.deepEqual(a.map((x) => x.severity), ['urgent', 'worth', 'idea']);
  assert.equal(new Set(a.map((x) => x.id)).size, a.length);
  assert.deepEqual(run(input).map((x) => x.id), a.map((x) => x.id));
});

test('every number in a title or why line comes from the data (no invented figures)', () => {
  const b = bk({ check_in_date: '2026-10-21', check_out_date: '2026-10-23', total_price: 2300 });
  const items = run({ bookings: [b], payments: [paid(b, 700)] });
  for (const x of items) {
    const nums = `${x.title} ${x.why}`.match(NUM) || [];
    for (const v of nums) assert.ok(['1,600', '21', '23'].includes(v), `unexpected number ${v} in ${x.id}`);
  }
});

test('dismiss hides for good; snooze hides until tomorrow; state round-trips through storage', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  let s = { dismissed: {}, snoozed: {} };
  s = dismissInsight(s, 'a', TODAY);
  s = snoozeInsight(s, 'b', TODAY);
  assert.deepEqual(visibleInsights(items, s, TODAY).map((x) => x.id), ['c']);
  assert.deepEqual(visibleInsights(items, s, '2026-10-21').map((x) => x.id), ['b', 'c']);
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  writeInsightState('org1', s, storage);
  assert.deepEqual(readInsightState('org1', storage), s);
  assert.deepEqual(readInsightState('other', storage), { dismissed: {}, snoozed: {} });
  assert.deepEqual(readInsightState('x', { getItem: () => '{bad' }), { dismissed: {}, snoozed: {} });
});

test('Hebcal periods table: sorted, well-formed, covers 2026–2028', () => {
  for (const p of IL_PEAK_PERIODS) {
    assert.match(p.from, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.to >= p.from, p.name);
  }
  const froms = IL_PEAK_PERIODS.map((p) => p.from);
  assert.deepEqual([...froms].sort(), froms);
  assert.deepEqual([...new Set(froms.map((d) => d.slice(0, 4)))], ['2026', '2027', '2028']);
});
