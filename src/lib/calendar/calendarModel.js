/**
 * Calendar v2 model: pure functions shared by the month grid (A) and the hybrid timeline (B).
 * Days are local ISO strings ('YYYY-MM-DD'); a stay occupies the nights [checkIn, checkOut).
 * Weeks start on Sunday (Israel). Nothing here invents a number: every count comes from bookings.
 */
import { IL_HOLIDAYS_STATIC } from './ilHolidays';

export const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
export const HE_DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
export const HE_DAYS_LONG = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const CHANNEL_LABEL = { booking: 'Booking', airbnb: 'Airbnb', direct: 'ישיר', block: 'חסום' };

const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Noon avoids DST edges when stepping days. */
export const parseIso = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const addDaysIso = (s, n) => { const d = parseIso(s); d.setDate(d.getDate() + n); return iso(d); };
export const diffDays = (a, b) => Math.round((parseIso(b) - parseIso(a)) / 86400000);
export const todayIso = () => iso(new Date());
export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function monthStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1, 12); }
export function shiftMonth(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1, 12); }
export function monthTitle(d) { return `${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

/** Hebrew-calendar months the Gregorian month spans, e.g. "תשרי–חשוון תשפ״ז". Empty if Intl lacks the calendar. */
export function hebrewMonthsLabel(d) {
  try {
    const fm = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' });
    const fy = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { year: 'numeric' });
    const first = new Date(d.getFullYear(), d.getMonth(), 1, 12);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
    const a = fm.format(first); const b = fm.format(last);
    const year = fy.format(last).replace(/^ה׳?/, '');
    return a === b ? `${a} ${year}` : `${a}–${b} ${year}`;
  } catch { return ''; }
}

/** Long Hebrew date for labels: "שלישי, 20 באוקטובר". */
export function longDay(s) {
  const d = parseIso(s);
  return `${HE_DAYS_LONG[d.getDay()]}, ${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`;
}
export function shortDay(s) {
  const d = parseIso(s);
  return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`;
}

/** 6×7 (or 5×7) Sunday-first matrix of ISO days covering the month. */
export function monthMatrix(anchor) {
  const first = monthStart(anchor);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
  const weeks = [];
  const cur = new Date(start);
  while (weeks.length < 6) {
    const week = [];
    for (let i = 0; i < 7; i += 1) { week.push(iso(cur)); cur.setDate(cur.getDate() + 1); }
    weeks.push(week);
    if (cur > lastDay) break;
  }
  return weeks;
}

/** Every ISO day of the month. */
export function monthDays(anchor) {
  const first = monthStart(anchor);
  const n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return Array.from({ length: n }, (_, i) => iso(new Date(first.getFullYear(), first.getMonth(), i + 1, 12)));
}

export function channelOf(raw) {
  const s = String(raw?.source || raw?.booking_source || 'direct').toLowerCase();
  if (s.includes('airbnb')) return 'airbnb';
  if (s.includes('booking')) return 'booking';
  return 'direct';
}

const INACTIVE = new Set(['CANCELLED', 'CANCELED', 'DECLINED', 'NO_SHOW']);

/**
 * Raw booking rows → stays. iCal imports arrive as is_block + a channel source: they are channel stays.
 * An is_block row with no channel source is an owner block ("חסום").
 */
export function toStays(rawBookings = []) {
  const out = [];
  for (const b of rawBookings) {
    if (!b?.check_in_date || !b.property_id) continue;
    if (INACTIVE.has(String(b.status || '').toUpperCase())) continue;
    const start = String(b.check_in_date).slice(0, 10);
    const nightsRaw = Number(b.nights) || 0;
    let end = b.check_out_date ? String(b.check_out_date).slice(0, 10) : addDaysIso(start, Math.max(1, nightsRaw));
    if (end <= start) end = addDaysIso(start, 1);
    const channel = channelOf(b);
    const isBlock = Boolean(b.is_block) && channel === 'direct';
    const st = String(b.status || '').toUpperCase();
    out.push({
      id: b.id,
      propertyId: b.property_id,
      guest: isBlock ? '' : (b.guest_name || ''),
      channel: isBlock ? 'block' : channel,
      isBlock,
      start,
      end,
      nights: diffDays(start, end),
      pending: !isBlock && !['APPROVED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(st),
      amount: Number(b.total_price) || 0,
      raw: b,
    });
  }
  return out.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/** Map propertyId → Set of occupied night ISO days. */
export function occupancyByUnit(stays) {
  const m = new Map();
  for (const s of stays) {
    if (!m.has(s.propertyId)) m.set(s.propertyId, new Set());
    const set = m.get(s.propertyId);
    for (let d = s.start; d < s.end; d = addDaysIso(d, 1)) set.add(d);
  }
  return m;
}

/**
 * Short free windows between two stays of the same unit (1–3 nights): the nights owners can still fill.
 * Only windows that end after today. Returns [{ propertyId, start, end, nights }].
 */
export function gapWindows(stays, { maxNights = 3, today = todayIso() } = {}) {
  const byUnit = new Map();
  for (const s of stays) { if (!byUnit.has(s.propertyId)) byUnit.set(s.propertyId, []); byUnit.get(s.propertyId).push(s); }
  const out = [];
  for (const [propertyId, list] of byUnit) {
    list.sort((a, b) => (a.start < b.start ? -1 : 1));
    let maxEnd = null;
    for (let i = 0; i < list.length; i += 1) {
      const s = list[i];
      if (maxEnd && s.start > maxEnd) {
        const start = maxEnd < today ? today : maxEnd;
        const n = diffDays(start, s.start);
        if (n >= 1 && diffDays(maxEnd, s.start) <= maxNights) out.push({ propertyId, start, end: s.start, nights: n });
      }
      if (!maxEnd || s.end > maxEnd) maxEnd = s.end;
    }
  }
  return out.sort((a, b) => (a.start < b.start ? -1 : 1));
}

/** Set of `${propertyId}|${day}` for every gap night, for fast cell lookups. */
export function gapNightSet(gaps) {
  const set = new Set();
  for (const g of gaps) for (let d = g.start; d < g.end; d = addDaysIso(d, 1)) set.add(`${g.propertyId}|${d}`);
  return set;
}

/**
 * Split a stay into per-week segments for a Sunday-first week (7 ISO days).
 * Check-in and check-out are half days: the bar starts mid-cell on check-in and ends mid-cell on check-out.
 * Returns { from, to } in column units (0..7, fractional), plus whether each edge is a real edge.
 */
export function weekSegment(stay, week) {
  const ws = week[0]; const we = addDaysIso(week[6], 1);
  if (stay.end < ws || stay.start >= we) return null;
  const startsHere = stay.start >= ws;
  const endsHere = stay.end <= week[6];
  const from = startsHere ? diffDays(ws, stay.start) + 0.5 : 0;
  const to = endsHere ? diffDays(ws, stay.end) + 0.5 : 7;
  if (to - from <= 0) return null;
  return { from, to, startsHere, endsHere };
}

/** Same as weekSegment but for an arbitrary run of days (timeline columns). */
export function rangeSegment(stay, days) {
  const ds = days[0]; const last = days[days.length - 1];
  if (stay.end < ds || stay.start > last) return null;
  const startsHere = stay.start >= ds;
  const endsHere = stay.end <= last;
  const from = startsHere ? diffDays(ds, stay.start) + 0.5 : 0;
  const to = endsHere ? diffDays(ds, stay.end) + 0.5 : days.length;
  if (to - from <= 0) return null;
  return { from, to, startsHere, endsHere };
}

/** ISO day → [{ title, yomtov }]. Server rows (il_calendar) win; otherwise the bundled Hebcal list. */
export function buildHolidayMap(serverRows) {
  const m = new Map();
  const push = (day, title, yomtov) => { if (!m.has(day)) m.set(day, []); m.get(day).push({ title, yomtov: Boolean(yomtov) }); };
  if (serverRows && serverRows.length) {
    for (const r of serverRows) {
      if (r.kind && r.kind !== 'holiday') continue;
      push(String(r.day).slice(0, 10), cleanTitle(r.title_he || r.title_en || ''), r.yomtov);
    }
  } else {
    for (const [day, title, yt] of IL_HOLIDAYS_STATIC) push(day, title, yt);
  }
  return m;
}
function cleanTitle(t) {
  return String(t).replace(/[\u0591-\u05C7]/g, '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/ \d{4}$/, '').replace('חנוכה: ', 'חנוכה ').trim();
}

/** What happens at one unit on one day: arriving / leaving / staying stays + whether the night is free. */
export function dayAtUnit(stays, propertyId, day) {
  const mine = stays.filter((s) => s.propertyId === propertyId);
  return {
    arriving: mine.filter((s) => s.start === day),
    leaving: mine.filter((s) => s.end === day),
    staying: mine.filter((s) => s.start < day && s.end > day),
    freeNight: !mine.some((s) => s.start <= day && s.end > day),
  };
}

/** Count of units with a free night on `day`. */
export function freeUnitsOn(occ, units, day) {
  let n = 0;
  for (const u of units) if (!occ.get(u.id)?.has(day)) n += 1;
  return n;
}

/** Assign stays of one unit to stacked lanes so overlapping stays (double bookings) never hide each other. */
export function laneStays(stays) {
  const lanes = [];
  const out = [];
  for (const s of stays) {
    let li = lanes.findIndex((end) => end <= s.start);
    if (li === -1) { li = lanes.length; lanes.push(s.end); } else lanes[li] = s.end;
    out.push({ stay: s, lane: li });
  }
  return { items: out, laneCount: Math.max(1, lanes.length) };
}
