/**
 * Holiday / weekend pricing rules (014, properties.pricing) + the Israeli calendar (il_calendar, from Hebcal).
 * Pure functions: suggestion per night, no randomness, no network.
 *
 * pricing: { base, weekend, holiday_uplift_pct, gap_night_discount_pct, min, max }
 * A "night" is the date the guest sleeps there (check-in date of that night).
 * Weekend nights in Israel: Thursday and Friday nights.
 */
import { addDays, parseDay } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf } from '@/lib/stay/bookings';

export const DEFAULT_RULES = { weekend_pct: 25, holiday_uplift_pct: 30, gap_night_discount_pct: 15 };

export function rulesOf(property) {
  const p = (property && typeof property.pricing === 'object' && property.pricing) || {};
  const base = Number(p.base ?? property?.base_price) || 0;
  return {
    base,
    weekend: Number(p.weekend) || (base ? Math.round((base * (100 + DEFAULT_RULES.weekend_pct)) / 100 / 10) * 10 : 0),
    holiday_uplift_pct: p.holiday_uplift_pct != null && p.holiday_uplift_pct !== '' ? Number(p.holiday_uplift_pct) : DEFAULT_RULES.holiday_uplift_pct,
    gap_night_discount_pct: p.gap_night_discount_pct != null && p.gap_night_discount_pct !== '' ? Number(p.gap_night_discount_pct) : DEFAULT_RULES.gap_night_discount_pct,
    min: Number(p.min) || 0,
    max: Number(p.max) || 0,
    saved: !!(p.base || p.weekend),
  };
}

/** Set of booked nights (ISO dates) for one unit. */
export function bookedNights(bookings, propertyId) {
  const set = new Set();
  for (const b of bookings || []) {
    if (b.property_id !== propertyId || !isActiveBooking(b) || !b.check_in_date) continue;
    const end = checkOutOf(b);
    for (let d = b.check_in_date; d < end; d = addDays(d, 1)) set.add(d);
  }
  return set;
}

/** Map ISO day → [{ title_he, title_en, yomtov }] for price-relevant holidays. Erev days count for the night itself. */
export function holidayMap(rows) {
  const m = new Map();
  for (const r of rows || []) {
    if (r.kind !== 'holiday' || !r.price_relevant) continue;
    if (!m.has(r.day)) m.set(r.day, []);
    m.get(r.day).push(r);
  }
  return m;
}

const round10 = (n) => Math.round(n / 10) * 10;

function shortHoliday(title = '') {
  return String(title)
    .replace(/[\u0591-\u05C7]/g, '') // niqqud
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/:.*$/, '')
    .trim();
}

/**
 * Suggestion for one night: { day, price, kind: base|weekend|holiday|gap|booked, label, reason }.
 */
export function suggestNight(day, rules, { booked, holidays }) {
  const dow = parseDay(day).getDay(); // 0 Sun … 6 Sat
  const weekend = dow === 4 || dow === 5;
  const hol = holidays.get(day) || [];
  if (booked.has(day)) return { day, price: null, kind: 'booked', label: 'תפוס', reason: '' };
  if (!rules.base) return { day, price: null, kind: 'base', label: '', reason: '' };
  let price = weekend ? rules.weekend || rules.base : rules.base;
  let kind = weekend ? 'weekend' : 'base';
  let reason = weekend ? 'לילה של סוף שבוע' : 'מחיר בסיס';
  let label = '';
  if (hol.length) {
    const top = hol.find((h) => h.yomtov) || hol[0];
    price = round10(Math.max(price, rules.base) * (1 + (rules.holiday_uplift_pct || 0) / 100));
    kind = 'holiday';
    label = shortHoliday(top.title_he || top.title_en);
    reason = `${label}: +${rules.holiday_uplift_pct}%`;
  }
  const gap = !booked.has(day) && booked.has(addDays(day, -1)) && booked.has(addDays(day, 1));
  if (gap && kind !== 'holiday') {
    price = round10(price * (1 - (rules.gap_night_discount_pct || 0) / 100));
    kind = 'gap';
    label = 'לילה בודד';
    reason = `לילה בודד בין שתי הזמנות: -${rules.gap_night_discount_pct}% כדי למלא אותו`;
  }
  if (rules.min) price = Math.max(price, rules.min);
  if (rules.max) price = Math.min(price, rules.max);
  return { day, price, kind, label, reason };
}

export function suggestRange(fromDay, days, rules, ctx) {
  const out = [];
  for (let i = 0; i < days; i += 1) out.push(suggestNight(addDays(fromDay, i), rules, ctx));
  return out;
}
