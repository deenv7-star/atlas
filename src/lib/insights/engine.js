/**
 * "מה דורש תשומת לב" on /today: recommendations built ONLY from the account's own rows.
 * Pure (no React, no network, no randomness) so every rule is unit-tested in tests/unit/insights.test.mjs.
 * Nothing here invents a number: every amount, count and date in a title / why line is read from
 * bookings, payments, leads, message logs, cleaning tasks, expenses, calendar syncs or the Hebcal table.
 *
 * buildInsights(input) → Insight[] sorted by severity, then rule priority, then date.
 *   Insight: { id, rule, severity: 'urgent'|'worth'|'idea', label: 'דחוף'|'כדאי'|'רעיון',
 *              title, why, action: { label, to } | { label, kind: 'whatsapp', template, bookingId } | { label, kind: 'new_booking' },
 *              at?: 'YYYY-MM-DD' }
 * `id` is stable across renders and days (rule + booking / lead / period), so dismiss / snooze can key on it.
 */
import { isActiveBooking, checkOutOf, unitKeyOf, balanceOf } from '../stay/bookings.js';
import { addDays, nightsBetween, formatDayHe, formatRangeHe, formatMoney, todayISO } from '../stay/format.js';
import { heCount } from '../hebrewCount.js';
import { IL_PEAK_PERIODS } from './ilPeriods.js';

export const SEVERITY = {
  urgent: { rank: 0, label: 'דחוף' },
  worth: { rank: 1, label: 'כדאי' },
  idea: { rank: 2, label: 'רעיון' },
};

/** Thresholds, exported so the tests and the UI speak the same numbers. */
export const RULES = {
  arrivalSoonDays: 3, // unpaid arrival: check-in within today … today+3
  leadStaleMs: 2 * 60 * 60 * 1000, // a NEW lead older than 2 hours
  leadUrgentDays: 7, // … urgent when the guest asked for a date within 7 days
  gapHorizonDays: 30, // gap nights: look 30 nights ahead
  gapMaxNights: 2, // a "gap" is 1–2 free nights between two stays
  gapUrgentDays: 7, // … worth (not idea) when one starts within 7 days
  holidayHorizonDays: 60, // upcoming holiday: starts within 60 days
  holidayWorthDays: 21, // … worth (not idea) within 21 days
  reviewWindowDays: 7, // review request: checked out in the last 7 days
  expensesMinBookings: 3, // no expenses: only once the account has 3+ bookings
  expensesQuietDays: 45, // … or none logged in the last 45 days while stays continue
  groupAbove: 2, // more than 2 of the same rule → one summary item
};

const PRIORITY = ['sync_broken', 'overdue_balance', 'unpaid_arrival', 'turnover', 'stale_lead', 'review_request', 'gap_nights', 'holiday_free', 'no_expenses', 'setup'];

// message_logs subjects written by useWhatsAppSend (logSubjectFor in stay/whatsapp.js).
const SUBJECT = {
  thanks_review: 'וואטסאפ · תודה ובקשת ביקורת',
  balance_reminder: 'וואטסאפ · תזכורת יתרה',
};
const REVIEW_SUBJECTS = [SUBJECT.thanks_review, 'בקשת ביקורת'];

const PROVIDER = { BOOKING_COM: 'Booking', BOOKING: 'Booking', AIRBNB: 'Airbnb' };

/** "היום" / "מחר" / "אתמול" / "יום ה׳, 22 באוק׳" relative to today. */
export function relDay(today, day, { on = false } = {}) {
  const n = nightsBetween(today, day);
  if (day === today) return 'היום';
  if (day > today && n === 1) return 'מחר';
  if (day < today && nightsBetween(day, today) === 1) return 'אתמול';
  return on ? `ב${formatDayHe(day)},` : formatDayHe(day);
}

/** "כבר 3 שעות" / "כבר יומיים" from a millisecond age. */
export function waitedFor(ms) {
  const h = Math.floor(ms / 3600000);
  if (h < 24) return h <= 1 ? 'כבר שעה' : h === 2 ? 'כבר שעתיים' : `כבר ${h} שעות`;
  const d = Math.floor(h / 24);
  return `כבר ${heCount(d, 'day')}`;
}

const hasPhone = (b) => String(b?.guest_phone || '').replace(/[^\d]/g, '').length >= 9;
const guestOf = (b) => String(b?.guest_name || '').trim() || 'אורח';
const isoDay = (v) => String(v || '').slice(0, 10);
const toMs = (v) => { const t = Date.parse(v || ''); return Number.isFinite(t) ? t : NaN; };

function make(rule, key, severity, fields) {
  return { id: `${rule}:${key}`, rule, severity, label: SEVERITY[severity].label, ...fields };
}

/* ─────────────────────────────── rules ─────────────────────────────── */

function ruleSync({ syncProblems }) {
  const out = [];
  for (const s of syncProblems || []) {
    const who = PROVIDER[String(s.provider || '').toUpperCase()] || 'הערוץ';
    const conflict = Array.isArray(s.conflicts) && s.conflicts.length > 0;
    const last = isoDay(s.last_success_at);
    out.push(make('sync_broken', s.id || `${s.provider}-${s.property_id}`, 'urgent', conflict
      ? {
        title: `תאריכים כפולים מול ${who}`,
        why: `${heCount(s.conflicts.length, 'night')} הוזמנו גם כאן וגם ב-${who}.`,
        action: { label: 'לבדוק את התאריכים', to: '/integrations' },
      }
      : {
        title: `הלוח לא מתעדכן מ-${who}`,
        why: last ? `העדכון האחרון הצליח ב-${formatDayHe(last, { weekday: false })}.` : 'החיבור מחזיר שגיאה, הזמנות חדשות לא נכנסות.',
        action: { label: 'לבדוק את החיבור', to: '/integrations' },
      }));
  }
  return out;
}

function ruleBalances({ today, bookings, paymentsByBooking, sentByBooking }) {
  const arrivals = [];
  const overdue = [];
  const horizon = addDays(today, RULES.arrivalSoonDays);
  for (const b of bookings) {
    if (!isActiveBooking(b) || b.status === 'CHECKED_OUT') continue;
    const bal = balanceOf(b, paymentsByBooking.get(b.id) || [], today);
    if (bal.balance <= 0) continue;
    const sent = (sentByBooking.get(b.id) || new Set()).has(SUBJECT.balance_reminder);
    const remind = hasPhone(b) && !sent
      ? { label: 'לשלוח תזכורת', kind: 'whatsapp', template: 'balance_reminder', bookingId: b.id }
      : { label: 'לרשום תשלום', to: `/booking/${b.id}` };
    const sentLine = sent ? ' תזכורת כבר נשלחה.' : '';
    const arriving = b.check_in_date >= today && b.check_in_date <= horizon;
    if (arriving && !bal.overdue) {
      const soon = nightsBetween(today, b.check_in_date) <= 1;
      arrivals.push(make('unpaid_arrival', b.id, soon ? 'urgent' : 'worth', {
        title: `יתרה פתוחה: ${guestOf(b)}`,
        why: `ההגעה ${relDay(today, b.check_in_date, { on: true })} ועוד חסרים ${formatMoney(bal.balance)}.${sentLine}`,
        action: remind,
        at: b.check_in_date,
        amount: bal.balance,
      }));
    } else if (bal.overdue) {
      overdue.push(make('overdue_balance', b.id, 'urgent', {
        title: `יתרה באיחור: ${guestOf(b)}`,
        why: `${formatMoney(bal.balance)} היו אמורים להיכנס עד ${formatDayHe(bal.dueDate, { weekday: false })}.${sentLine}`,
        action: remind,
        at: bal.dueDate,
        amount: bal.balance,
      }));
    }
  }
  if (overdue.length > RULES.groupAbove) {
    const total = overdue.reduce((s, x) => s + x.amount, 0);
    const oldest = overdue.map((x) => x.at).sort()[0];
    return [...arrivals, make('overdue_balance', 'all', 'urgent', {
      title: `${overdue.length} יתרות באיחור`,
      why: `${formatMoney(total)} בסך הכל. הוותיקה מ-${formatDayHe(oldest, { weekday: false })}.`,
      action: { label: 'לכל היתרות', to: '/balances' },
      at: oldest,
      amount: total,
      count: overdue.length,
    })];
  }
  return [...arrivals, ...overdue];
}

function ruleLeads({ today, now, leads }) {
  const nowMs = now.getTime();
  const stale = (leads || [])
    .filter((l) => String(l.status || 'NEW').toUpperCase() === 'NEW')
    .map((l) => ({ l, at: toMs(l.created_at || l.created_date) }))
    .filter((x) => Number.isFinite(x.at) && nowMs - x.at > RULES.leadStaleMs)
    .sort((a, b) => a.at - b.at);
  if (!stale.length) return [];
  const soonDay = addDays(today, RULES.leadUrgentDays);
  const urgent = stale.some(({ l }) => l.check_in_date && isoDay(l.check_in_date) >= today && isoDay(l.check_in_date) <= soonDay);
  const sev = urgent ? 'urgent' : 'worth';
  const oldest = stale[0];
  const name = String(oldest.l.full_name || oldest.l.name || '').trim() || 'פנייה חדשה';
  if (stale.length === 1) {
    const dates = oldest.l.check_in_date ? ` לתאריך ${formatDayHe(isoDay(oldest.l.check_in_date), { weekday: false })}` : '';
    return [make('stale_lead', oldest.l.id, sev, {
      title: `לחזור ל${name}`,
      why: `פנו${dates} ומחכים לתשובה ${waitedFor(nowMs - oldest.at)}.`,
      action: { label: 'לפתוח את הפנייה', to: `/lead/${oldest.l.id}` },
    })];
  }
  return [make('stale_lead', 'all', sev, {
    title: `${stale.length} פניות מחכות לתשובה`,
    why: `הראשונה, ${name}, מחכה ${waitedFor(nowMs - oldest.at)}.`,
    action: { label: 'לפניות החדשות', to: '/leads' },
    count: stale.length,
  })];
}

function ruleTurnover({ today, bookings, cleaningTasks, propertyById }) {
  const active = bookings.filter(isActiveBooking);
  const out = [];
  for (const dep of active.filter((b) => checkOutOf(b) === today)) {
    const key = unitKeyOf(dep);
    const next = active.find((b) => b.id !== dep.id && unitKeyOf(b) === key && b.check_in_date === today);
    if (!next) continue;
    const task = (cleaningTasks || []).find((t) => t.booking_id === dep.id)
      || (cleaningTasks || []).find((t) => t.property_id === dep.property_id && isoDay(t.scheduled_date || t.scheduled_for) === today);
    if (task && String(task.status).toUpperCase() === 'DONE') continue;
    const unit = propertyById.get(dep.property_id)?.name || dep.property_name || 'היחידה';
    const time = String(next.check_in_time || propertyById.get(dep.property_id)?.check_in_time || '').slice(0, 5);
    out.push(make('turnover', dep.id, 'urgent', {
      title: `ניקיון מהיר: ${unit}`,
      why: `${guestOf(dep)} יוצאים ו${guestOf(next)} נכנסים היום${time ? ` ב-${time}` : ''}.`,
      action: { label: task ? 'לניקיון' : 'לתאם ניקיון', to: '/cleaning' },
      at: today,
    }));
  }
  return out;
}

/** Free stretches of 1–2 nights between two stays in the same unit, within the next 30 nights. */
export function findGapNights({ today, bookings, properties }) {
  const gaps = [];
  const end = addDays(today, RULES.gapHorizonDays);
  for (const p of properties || []) {
    const booked = new Set();
    for (const b of bookings) {
      if (!isActiveBooking(b) || (b.property_id !== p.id && b.unit_id !== p.id)) continue;
      const out = checkOutOf(b);
      for (let d = b.check_in_date; d < out; d = addDays(d, 1)) booked.add(d);
    }
    let d = today;
    while (d < end) {
      if (booked.has(d)) { d = addDays(d, 1); continue; }
      let e = d;
      while (!booked.has(e) && e < end) e = addDays(e, 1);
      const len = nightsBetween(d, e);
      // bounded on both sides by a booked night (the night before the gap and the first night after it)
      if (len >= 1 && len <= RULES.gapMaxNights && booked.has(addDays(d, -1)) && booked.has(e)) {
        gaps.push({ propertyId: p.id, unit: p.name || 'יחידה', from: d, to: e, nights: len });
      }
      d = e;
    }
  }
  return gaps.sort((a, b) => a.from.localeCompare(b.from));
}

function ruleGaps(ctx) {
  const gaps = findGapNights(ctx);
  if (!gaps.length) return [];
  const nights = gaps.reduce((s, g) => s + g.nights, 0);
  const first = gaps[0];
  const sev = nightsBetween(ctx.today, first.from) < RULES.gapUrgentDays ? 'worth' : 'idea';
  const where = `${first.unit}, ${first.nights === 1 ? formatDayHe(first.from, { weekday: false }) : formatRangeHe(first.from, addDays(first.from, first.nights - 1))}`;
  return [make('gap_nights', gaps.map((g) => `${g.propertyId}@${g.from}`).join(','), sev, {
    title: nights === 1 ? 'לילה בודד בין שתי הזמנות' : `${nights} לילות בודדים בין הזמנות`,
    why: `${gaps.length === 1 ? '' : 'הקרוב: '}${where}. לילות כאלה קשה למכור במחיר מלא.`,
    action: { label: 'לתמחר לילות בודדים', to: '/dynamic-pricing' },
    at: first.from,
    count: nights,
  })];
}

function ruleHoliday({ today, bookings, properties, periods }) {
  const units = (properties || []).length;
  if (!units) return [];
  const horizon = addDays(today, RULES.holidayHorizonDays);
  const p = (periods || IL_PEAK_PERIODS)
    .filter((x) => x.to >= today && x.from <= horizon)
    .sort((a, b) => a.from.localeCompare(b.from))[0];
  if (!p) return [];
  const from = p.from < today ? today : p.from;
  const to = addDays(p.to, 1); // `to` is the last night; make it exclusive
  const total = units * nightsBetween(from, to);
  let booked = 0;
  for (const prop of properties) {
    const set = new Set();
    for (const b of bookings) {
      if (!isActiveBooking(b) || b.property_id !== prop.id) continue;
      const out = checkOutOf(b);
      for (let d = b.check_in_date > from ? b.check_in_date : from; d < out && d < to; d = addDays(d, 1)) set.add(d);
    }
    booked += set.size;
  }
  const free = total - booked;
  if (free <= 0) return [];
  const days = nightsBetween(today, p.from);
  const when = p.from <= today ? 'עכשיו' : days === 1 ? 'מחר' : `בעוד ${heCount(days, 'day')}`;
  return [make('holiday_free', `${p.name}@${p.from}`, days <= RULES.holidayWorthDays ? 'worth' : 'idea', {
    title: `${p.name} ${when}`,
    why: free === total
      ? `כל ${total} הלילות עדיין פנויים (${formatRangeHe(p.from, p.to)}, ${heCount(units, 'unit')}).`
      : `${heCount(free, 'night')} פנויים מתוך ${total} (${formatRangeHe(p.from, p.to)}).`,
    action: { label: 'לתמחר את החג', to: '/dynamic-pricing' },
    at: p.from,
    count: free,
  })];
}

function ruleReviews({ today, bookings, sentByBooking, reviewRequests }) {
  if (reviewRequests == null) return []; // not loaded: do not guess
  const asked = new Set((reviewRequests || []).map((r) => r.booking_id).filter(Boolean));
  const since = addDays(today, -RULES.reviewWindowDays);
  const due = bookings
    .filter((b) => isActiveBooking(b) && !asked.has(b.id))
    .filter((b) => {
      const out = checkOutOf(b);
      if (out < since || out > today) return false;
      if (out === today && b.status !== 'CHECKED_OUT') return false; // still here this morning
      const sent = sentByBooking.get(b.id) || new Set();
      return !REVIEW_SUBJECTS.some((s) => sent.has(s));
    })
    .sort((a, b) => checkOutOf(b).localeCompare(checkOutOf(a)));
  if (!due.length) return [];
  const b = due[0];
  if (due.length === 1) {
    return [make('review_request', b.id, 'worth', {
      title: `לבקש ביקורת מ${guestOf(b)}`,
      why: `יצאו ${relDay(today, checkOutOf(b), { on: true })} ועוד לא קיבלו בקשה לביקורת.`,
      action: hasPhone(b)
        ? { label: 'לשלוח בקשה', kind: 'whatsapp', template: 'thanks_review', bookingId: b.id }
        : { label: 'לביקורות', to: '/reviews' },
      at: checkOutOf(b),
    })];
  }
  return [make('review_request', 'all', 'worth', {
    title: `${due.length} אורחים יצאו בלי בקשת ביקורת`,
    why: `האחרונים: ${guestOf(b)}, ${relDay(today, checkOutOf(b))}.`,
    action: { label: 'לביקורות', to: '/reviews' },
    at: checkOutOf(b),
    count: due.length,
  })];
}

function ruleExpenses({ today, bookings, expenses }) {
  if (!Array.isArray(expenses)) return []; // feature off or not loaded
  const real = bookings.filter((b) => isActiveBooking(b) && !b.is_block);
  if (real.length < RULES.expensesMinBookings) return [];
  if (!expenses.length) {
    return [make('no_expenses', 'none', 'idea', {
      title: 'עוד לא נרשמו הוצאות',
      why: `${heCount(real.length, 'booking')} נרשמו ואף הוצאה. בלי הוצאות לא רואים כמה באמת הרווחתם.`,
      action: { label: 'לרשום הוצאה', to: '/expense-tracker' },
    })];
  }
  const since = addDays(today, -RULES.expensesQuietDays);
  const lastExpense = expenses.map((e) => isoDay(e.expense_date || e.date || e.created_at)).filter(Boolean).sort().pop() || '';
  const staysSince = real.filter((b) => b.check_in_date > lastExpense && b.check_in_date <= today).length;
  const recentStays = real.filter((b) => b.check_in_date >= since && b.check_in_date <= today).length;
  if (lastExpense && lastExpense < since && recentStays > 0) {
    return [make('no_expenses', `quiet@${lastExpense}`, 'idea', {
      title: 'לא נרשמו הוצאות לאחרונה',
      why: `ההוצאה האחרונה נרשמה ב-${formatDayHe(lastExpense, { weekday: false })}, ומאז היו ${heCount(staysSince, 'booking')}.`,
      action: { label: 'לרשום הוצאה', to: '/expense-tracker' },
    })];
  }
  return [];
}

/** Only for an account with no bookings yet. Steps the "המשך הגדרה" card already shows are left to it. */
function ruleSetup({ bookings, properties, syncs, setupInProgress }) {
  if (bookings.length) return [];
  const out = [];
  if (!setupInProgress) {
    if (!(properties || []).length) {
      out.push(make('setup', 'units', 'worth', {
        title: 'להוסיף את היחידות',
        why: 'כדי שיהיה יומן לכל צימר או חדר.',
        action: { label: 'להוסיף יחידה', to: '/setup?step=units' },
      }));
    }
    if (Array.isArray(syncs) && !syncs.length) {
      out.push(make('setup', 'channels', 'worth', {
        title: 'לחבר את Booking או Airbnb',
        why: 'ההזמנות משם ייכנסו ליומן לבד.',
        action: { label: 'לחבר ערוץ', to: '/integrations' },
      }));
    }
  }
  if ((properties || []).length) {
    out.push(make('setup', 'first_booking', 'idea', {
      title: 'להכניס את ההזמנה הראשונה',
      why: 'מכאן יתחילו להופיע כאן תזכורות על יתרות, ניקיונות וביקורות.',
      action: { label: 'הזמנה חדשה', kind: 'new_booking' },
    }));
  }
  return out;
}

/* ─────────────────────────────── entry ─────────────────────────────── */

export function buildInsights(input = {}) {
  const today = input.today || todayISO();
  const ctx = {
    today,
    now: input.now instanceof Date ? input.now : new Date(input.now || Date.now()),
    bookings: input.bookings || [],
    properties: input.properties || [],
    propertyById: input.propertyById || new Map((input.properties || []).map((p) => [p.id, p])),
    paymentsByBooking: input.paymentsByBooking || new Map(),
    sentByBooking: input.sentByBooking || new Map(),
    cleaningTasks: input.cleaningTasks || [],
    expenses: input.expenses, // undefined / null = unknown → rule skipped
    leads: input.leads || [],
    syncProblems: input.syncProblems || [],
    syncs: input.syncs, // undefined = unknown → no "connect a channel" step
    reviewRequests: input.reviewRequests, // undefined = unknown → rule skipped
    periods: input.periods || IL_PEAK_PERIODS,
    setupInProgress: !!input.setupInProgress,
  };
  const empty = ctx.bookings.length === 0;
  const items = empty
    ? [...ruleSync(ctx), ...ruleLeads(ctx), ...ruleSetup(ctx)]
    : [
      ...ruleSync(ctx), ...ruleBalances(ctx), ...ruleTurnover(ctx), ...ruleLeads(ctx),
      ...ruleReviews(ctx), ...ruleGaps(ctx), ...ruleHoliday(ctx), ...ruleExpenses(ctx),
    ];
  return items.sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank
    || PRIORITY.indexOf(a.rule) - PRIORITY.indexOf(b.rule)
    || String(a.at || '').localeCompare(String(b.at || '')));
}

/* ───────────────────── dismiss / snooze (per device) ───────────────────── */

const KEY = (orgId) => `atlas.insights.v1.${orgId || 'local'}`;

export function readInsightState(orgId, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(KEY(orgId));
    const s = raw ? JSON.parse(raw) : {};
    return { dismissed: s.dismissed || {}, snoozed: s.snoozed || {} };
  } catch { return { dismissed: {}, snoozed: {} }; }
}

export function writeInsightState(orgId, state, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY(orgId), JSON.stringify(state)); } catch { /* private mode */ }
}

/** Hide dismissed items for good and snoozed items until their day. */
export function visibleInsights(items, state, today = todayISO()) {
  const s = state || { dismissed: {}, snoozed: {} };
  return (items || []).filter((x) => !s.dismissed[x.id] && !(s.snoozed[x.id] && s.snoozed[x.id] > today));
}

export function dismissInsight(state, id, today = todayISO()) {
  return { ...state, dismissed: { ...state.dismissed, [id]: today } };
}

export function snoozeInsight(state, id, today = todayISO(), days = 1) {
  return { ...state, snoozed: { ...state.snoozed, [id]: addDays(today, days) } };
}
