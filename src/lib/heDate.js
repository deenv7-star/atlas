/**
 * Hebrew dates for sheets and pickers, built by hand so they never come out as "Nov 2026 4"
 * (iOS renders <input type=date> in the device locale, and English inside RTL scrambles).
 * All functions take/return ISO "YYYY-MM-DD" strings and work in UTC so a date never shifts a day.
 */
export const HE_WEEKDAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
export const HE_WEEKDAY_LONG = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const HE_MONTH_SHORT = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
export const HE_MONTH_LONG = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** ISO → Date at UTC midnight, or null. */
export function parseIso(iso) {
  const m = ISO_RE.exec(String(iso || '').slice(0, 10));
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(m[3]) ? null : d;
}

export function toIso(d) {
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
}

export function addDays(iso, n) {
  const d = parseIso(iso);
  return d ? toIso(new Date(d.getTime() + n * 86_400_000)) : '';
}

/** Whole nights between check-in and check-out, or 0. */
export function nightsBetween(a, b) {
  const x = parseIso(a);
  const y = parseIso(b);
  if (!x || !y) return 0;
  const n = Math.round((y.getTime() - x.getTime()) / 86_400_000);
  return n > 0 ? n : 0;
}

/** Today in Israel as ISO (the app's clock, whatever the device zone). */
export function todayIsoIL(now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return toIso(now);
  }
}

/**
 * "ד׳, 4 בנוב׳ 2026". Options: year ('always' | 'auto' = only when not this year | 'never'),
 * weekday (default true).
 */
export function heDate(iso, { year = 'always', weekday = true, today = todayIsoIL() } = {}) {
  const d = parseIso(iso);
  if (!d) return '';
  const y = d.getUTCFullYear();
  const showYear = year === 'always' || (year === 'auto' && String(y) !== String(today).slice(0, 4));
  const day = `${d.getUTCDate()} ב${HE_MONTH_SHORT[d.getUTCMonth()]}${showYear ? ` ${y}` : ''}`;
  return weekday ? `${HE_WEEKDAY_SHORT[d.getUTCDay()]}, ${day}` : day;
}

/** "נובמבר 2026" for a calendar header. */
export function heMonthTitle(year, monthIndex) {
  return `${HE_MONTH_LONG[monthIndex]} ${year}`;
}

/** "לילה אחד", "2 לילות". */
export function heNights(n) {
  if (!n || n < 1) return '';
  return n === 1 ? 'לילה אחד' : `${n} לילות`;
}

/** Full accessible label: "יום רביעי, 4 בנובמבר 2026". */
export function heDateLong(iso) {
  const d = parseIso(iso);
  if (!d) return '';
  return `יום ${HE_WEEKDAY_LONG[d.getUTCDay()]}, ${d.getUTCDate()} ב${HE_MONTH_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Weeks of a month for a Sunday-first grid: array of 7-slot rows, '' for padding. */
export function monthGrid(year, monthIndex) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells = Array(first.getUTCDay()).fill('');
  for (let i = 1; i <= days; i++) cells.push(toIso(new Date(Date.UTC(year, monthIndex, i))));
  while (cells.length % 7) cells.push('');
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
