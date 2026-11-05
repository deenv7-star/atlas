/**
 * The calendar's one-line status (Deen 05.11.2026): above the single calendar, one plain sentence about the period on
 * screen and at most two things worth doing. Every number is counted from the real stays; nothing is shown when there
 * is nothing true to say. Pure (no React), so it can be unit-tested.
 *
 * Weekend = the nights of Thursday and Friday (a zimmer "סוף שבוע": in on Thursday or Friday, out on Saturday).
 */
import { HE_MONTHS, addDaysIso, parseIso } from '../../lib/calendar/calendarModel.js';

const dayNum = (s) => parseIso(s).getDate();
const monthOf = (s) => HE_MONTHS[parseIso(s).getMonth()];

/** "6–7 בנובמבר", or "30 בנובמבר–1 בדצמבר" across months, or "7 בנובמבר" for one night. */
export function nightsLabel(nights) {
  if (!nights.length) return '';
  const a = nights[0]; const z = nights[nights.length - 1];
  if (a === z) return `${dayNum(a)} ב${monthOf(a)}`;
  if (monthOf(a) === monthOf(z)) return `${dayNum(a)}–${dayNum(z)} ב${monthOf(z)}`;
  return `${dayNum(a)} ב${monthOf(a)}–${dayNum(z)} ב${monthOf(z)}`;
}

/** The next weekend's nights (Thu, Fri) from `today`, within the coming 7 days. A Friday today = Friday only. */
export function nextWeekendNights(today) {
  for (let i = 0; i < 7; i += 1) {
    const d = addDaysIso(today, i);
    const dow = parseIso(d).getDay();
    if (dow === 4) return [d, addDaysIso(d, 1)];
    if (dow === 5) return [d];
  }
  return [];
}

/**
 * days: the ISO days on screen. Returns
 * { pct, booked, total, arrivals, weekend: { nights, label, free, freeUnits, first } | null,
 *   gaps: { nights, count, first } | null, empty }
 */
export function computeBrief({ days, today, units, stays, occ, gaps }) {
  const unitList = units || [];
  const total = days.length * unitList.length;
  let booked = 0;
  for (const u of unitList) for (const d of days) if (occ.get(u.id)?.has(d)) booked += 1;
  const pct = total ? Math.round((booked / total) * 100) : 0;
  const daySet = new Set(days);
  const arrivals = (stays || []).filter((s) => !s.isBlock && daySet.has(s.start)).length;

  // the weekend only belongs to the period that contains today
  let weekend = null;
  if (daySet.has(today)) {
    const nights = nextWeekendNights(today);
    if (nights.length) {
      let free = 0; const freeUnits = new Set(); let first = null;
      for (const d of nights) {
        for (const u of unitList) {
          if (occ.get(u.id)?.has(d)) continue;
          free += 1; freeUnits.add(u.id);
          if (!first) first = { unit: u, day: d };
        }
      }
      weekend = { nights, label: nightsLabel(nights), free, freeUnits: freeUnits.size, first };
    }
  }

  const ahead = (gaps || []).filter((g) => daySet.has(g.start) && g.end > today);
  const gapNights = ahead.reduce((n, g) => n + g.nights, 0);
  const g0 = ahead[0];
  const gapInfo = gapNights
    ? { nights: gapNights, count: ahead.length, first: g0 ? { unit: unitList.find((u) => u.id === g0.propertyId) || null, day: g0.start, nights: g0.nights } : null }
    : null;

  return { pct, booked, total, arrivals, weekend, gaps: gapInfo, empty: booked === 0 };
}
