import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ilDate, ilToUtc, reminderId, planCheckinReminders, diffReminders, isOurReminder, reminderText, REMINDER_KIND,
  readNotifyPrefs, writeNotifyPrefs, shouldPrePrompt, hasUpcomingArrival, isMissingTableError, safeAppPath, PRE_PROMPT_GAP_MS,
} from '../../src/lib/nativeApp/notifyCore.js';

const memStore = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };

test('09:00 Israel → UTC in winter (IST +2) and summer (IDT +3), whatever the phone zone', () => {
  assert.equal(ilToUtc('2026-11-05', '09:00').toISOString(), '2026-11-05T07:00:00.000Z');
  assert.equal(ilToUtc('2026-07-15', '09:00').toISOString(), '2026-07-15T06:00:00.000Z');
  // DST change days (IL 2026: 27.03 forward, 25.10 back)
  assert.equal(ilToUtc('2026-03-27', '09:00').toISOString(), '2026-03-27T06:00:00.000Z');
  assert.equal(ilToUtc('2026-10-25', '09:00').toISOString(), '2026-10-25T07:00:00.000Z');
  assert.equal(ilDate(new Date('2026-11-04T22:30:00Z')), '2026-11-05');
});

test('reminder id is a stable int32 per day', () => {
  assert.equal(reminderId('2026-11-05'), 20261105);
  assert.ok(reminderId('2099-12-31') < 2 ** 31);
});

const NOW = new Date('2026-11-04T09:31:00Z'); // 11:31 IST
const props = [{ id: 'p1', name: 'הזית', check_in_time: '15:00' }, { id: 'p2', name: 'התאנה', check_in_time: '16:00' }];

test('plan: future arrivals only, one per day, blocked / cancelled skipped, text per count', () => {
  const bookings = [
    { id: 'b0', guest_name: 'היום', check_in_date: '2026-11-04', property_id: 'p1' }, // 09:00 today already passed
    { id: 'b1', guest_name: 'נועה לוי', check_in_date: '2026-11-05', property_id: 'p1' },
    { id: 'b2', guest_name: 'דנה כהן', check_in_date: '2026-11-07', property_id: 'p2', status: 'CONFIRMED' },
    { id: 'b3', guest_name: 'יוסי', check_in_date: '2026-11-07', property_id: 'p1' },
    { id: 'b4', guest_name: 'בוטל', check_in_date: '2026-11-08', status: 'CANCELLED' },
    { id: 'b5', guest_name: 'חסום – שיפוץ', check_in_date: '2026-11-09' },
    { id: 'b6', guest_name: 'רשימת המתנה', check_in_date: '2026-11-10', status: 'waitlist' },
    { id: 'b7', guest_name: 'בלי תאריך' },
  ];
  const plan = planCheckinReminders(bookings, { now: NOW, properties: props });
  assert.deepEqual(plan.map((r) => r.id), [20261105, 20261107]);
  assert.equal(plan[0].at, '2026-11-05T07:00:00.000Z');
  assert.equal(plan[0].title, 'הגעה היום: נועה לוי');
  assert.equal(plan[0].body, 'הזית, כניסה מ-15:00');
  assert.deepEqual(plan[0].extra, { kind: REMINDER_KIND, date: '2026-11-05', bookingId: 'b1' });
  assert.equal(plan[1].title, '2 הגעות היום');
  assert.equal(plan[1].body, 'דנה כהן ויוסי');
  assert.equal(plan[1].extra.bookingId, undefined);
});

test('plan: text fallbacks and many names', () => {
  assert.deepEqual(reminderText([{ guest_name: '' }]), { title: 'אורחים מגיעים היום', body: 'פרטי ההזמנה מחכים באפליקציה' });
  const t = reminderText([{ guest_name: 'א' }, { guest_name: 'ב' }, { guest_name: 'ג' }, { guest_name: 'ד' }]);
  assert.equal(t.title, '4 הגעות היום');
  assert.equal(t.body, 'א, ב ועוד 2');
});

test('plan: capped under the iOS 64 pending limit', () => {
  const many = Array.from({ length: 100 }, (_, i) => ({ id: `b${i}`, guest_name: 'x', check_in_date: new Date(Date.UTC(2026, 10, 6 + i)).toISOString().slice(0, 10) }));
  assert.equal(planCheckinReminders(many, { now: NOW }).length, 40);
});

test('diff: unchanged kept, moved/renamed rescheduled, cancelled removed, foreign notifications untouched', () => {
  const wanted = planCheckinReminders([
    { id: 'b1', guest_name: 'נועה לוי', check_in_date: '2026-11-05', property_id: 'p1' },
    { id: 'b2', guest_name: 'דנה כהן', check_in_date: '2026-11-08', property_id: 'p2' },
  ], { now: NOW, properties: props });
  const pending = [
    { id: 20261105, title: 'הגעה היום: נועה לוי', body: 'הזית, כניסה מ-15:00', schedule: { at: '2026-11-05T07:00:00.000Z' }, extra: { kind: REMINDER_KIND } },
    { id: 20261107, title: 'הגעה היום: דנה כהן', body: 'התאנה, כניסה מ-16:00', schedule: { at: '2026-11-07T07:00:00.000Z' }, extra: { kind: REMINDER_KIND } }, // moved to the 8th
    { id: 20261120, title: 'old', body: 'old', schedule: { at: '2026-11-20T07:00:00.000Z' } }, // cancelled booking, no extra (id range)
    { id: 7, title: 'other', body: 'x', extra: { kind: 'something-else' } },
  ];
  const d = diffReminders(pending, wanted);
  assert.deepEqual(d.cancel.sort(), [20261107, 20261120]);
  assert.deepEqual(d.schedule.map((s) => s.id), [20261108]);
  // a renamed guest on the same day: cancel + schedule same id
  const renamed = wanted.map((w) => (w.id === 20261105 ? { ...w, title: 'הגעה היום: נועה כהן' } : w));
  const d2 = diffReminders(pending.slice(0, 1), renamed);
  assert.deepEqual(d2.cancel, [20261105]);
  assert.deepEqual(d2.schedule.map((s) => s.id), [20261105, 20261108]);
  assert.equal(isOurReminder({ id: 7, extra: { kind: 'x' } }), false);
  assert.equal(isOurReminder({ id: 5 }), false);
  // nothing wanted (all cancelled / signed out) → every reminder cancelled
  assert.deepEqual(diffReminders(pending, []).cancel.sort(), [20261105, 20261107, 20261120]);
});

test('pre-prompt: the meaningful moment, never on first launch-like states', () => {
  const base = { native: true, signedIn: true, locked: false, permission: 'prompt', prefs: readNotifyPrefs(memStore()), path: '/dashboard', hasUpcoming: true, sheetShownThisSession: false, now: 1e12 };
  assert.equal(shouldPrePrompt(base), true);
  assert.equal(shouldPrePrompt({ ...base, native: false }), false);
  assert.equal(shouldPrePrompt({ ...base, signedIn: false }), false);
  assert.equal(shouldPrePrompt({ ...base, locked: true }), false);
  assert.equal(shouldPrePrompt({ ...base, hasUpcoming: false }), false, 'no guests yet: nothing to remind');
  assert.equal(shouldPrePrompt({ ...base, sheetShownThisSession: true }), false, 'Face ID offer already shown');
  assert.equal(shouldPrePrompt({ ...base, permission: 'granted' }), false);
  assert.equal(shouldPrePrompt({ ...base, permission: 'denied' }), false);
  assert.equal(shouldPrePrompt({ ...base, path: '/login' }), false);
  assert.equal(shouldPrePrompt({ ...base, path: '/settings' }), false);
  assert.equal(shouldPrePrompt({ ...base, path: '/booking/abc' }), true);
  assert.equal(shouldPrePrompt({ ...base, prefs: { ...base.prefs, asked: 1, lastAskedAt: base.now - 1000, outcome: 'later' } }), false, 'asked recently');
  assert.equal(shouldPrePrompt({ ...base, prefs: { ...base.prefs, asked: 1, lastAskedAt: base.now - PRE_PROMPT_GAP_MS - 1, outcome: 'later' } }), true);
  assert.equal(shouldPrePrompt({ ...base, prefs: { ...base.prefs, asked: 3, lastAskedAt: 1 } }), false, 'max 3 times');
  const s = memStore();
  writeNotifyPrefs(s, { asked: 2, outcome: 'later' });
  assert.deepEqual(readNotifyPrefs(s), { asked: 2, lastAskedAt: 0, outcome: 'later', remindersOff: false });
});

test('upcoming arrival uses the Israeli date', () => {
  assert.equal(hasUpcomingArrival([{ check_in_date: '2026-11-04' }], NOW), true);
  assert.equal(hasUpcomingArrival([{ check_in_date: '2026-11-03' }], NOW), false);
  assert.equal(hasUpcomingArrival([{ check_in_date: '2026-11-09', status: 'CANCELLED' }], NOW), false);
  assert.equal(hasUpcomingArrival([], NOW), false);
});

test('missing table / RPC errors are recognised (migration 029 not applied)', () => {
  assert.equal(isMissingTableError({ code: 'PGRST202', message: 'Could not find the function public.register_device_token' }), true);
  assert.equal(isMissingTableError({ code: '42P01' }), true);
  assert.equal(isMissingTableError({ code: 'PGRST205', message: "Could not find the table 'public.device_tokens'" }), true);
  assert.equal(isMissingTableError({ code: '42501', message: 'permission denied' }), false);
  assert.equal(isMissingTableError(null), false);
});

test('notification paths stay inside the app', () => {
  assert.equal(safeAppPath('/booking/abc'), '/booking/abc');
  assert.equal(safeAppPath('//evil.com'), '');
  assert.equal(safeAppPath('https://evil.com'), '');
  assert.equal(safeAppPath('javascript:alert(1)'), '');
  assert.equal(safeAppPath(''), '');
});
