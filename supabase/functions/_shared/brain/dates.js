// Calendar-day helpers for the brain (plain JS: Deno edge functions + node tests).
// Days are 'YYYY-MM-DD' in Asia/Jerusalem, never raw 24h maths.

export function todayIL(now = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return p; // en-CA formats as YYYY-MM-DD
}
export function isDay(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)); }
export function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function nights(a, b) {
  if (!isDay(a) || !isDay(b)) return 0;
  return Math.max(0, Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000));
}
export function monthRange(day) {
  const [y, m] = day.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  return { from: start, to: next };
}
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export function heDay(day) {
  if (!isDay(day)) return '';
  const d = new Date(`${day}T00:00:00Z`);
  return `יום ${DAYS[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}`;
}
/** Clamp a [from, to) range the model asked for: valid days, from < to, at most `maxDays` long. */
export function clampRange(from, to, today, maxDays = 370) {
  let f = isDay(from) ? from : today;
  let t = isDay(to) ? to : addDays(f, 1);
  if (t <= f) t = addDays(f, 1);
  if (nights(f, t) > maxDays) t = addDays(f, maxDays);
  return { from: f, to: t };
}
