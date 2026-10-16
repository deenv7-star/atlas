/** Hebrew formatting helpers that follow the ATLAS brand voice. */

const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const MONTHS_SHORT = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
const MONTHS_LONG = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/** Parse 'YYYY-MM-DD' (or ISO) as a local calendar date. */
export function parseDay(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function toISODay(date) {
  const d = date instanceof Date ? date : parseDay(date);
  if (!d) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function todayISO() {
  return toISODay(new Date());
}

export function addDays(value, n) {
  const d = parseDay(value);
  if (!d) return '';
  d.setDate(d.getDate() + n);
  return toISODay(d);
}

export function nightsBetween(ci, co) {
  const a = parseDay(ci);
  const b = parseDay(co);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

/** "יום ו׳, 16 באוק׳" */
export function formatDayHe(value, { weekday = true } = {}) {
  const d = parseDay(value);
  if (!d) return '';
  const core = `${d.getDate()} ב${MONTHS_SHORT[d.getMonth()]}`;
  return weekday ? `יום ${DAY_LETTERS[d.getDay()]}, ${core}` : core;
}

/** "16–18 באוק׳" style range without em dash: "16 עד 18 באוק׳" */
export function formatRangeHe(ci, co) {
  const a = parseDay(ci);
  const b = parseDay(co);
  if (!a || !b) return formatDayHe(ci);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()}-${b.getDate()} ב${MONTHS_SHORT[a.getMonth()]}`;
  }
  return `${formatDayHe(a, { weekday: false })} - ${formatDayHe(b, { weekday: false })}`;
}

export function monthLabelHe(year, monthIndex) {
  return `${MONTHS_LONG[monthIndex]} ${year}`;
}

const moneyFmt = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });
const moneyFmt2 = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "‏₪1,250" (RLM keeps the sign on the right side of the number in RTL text). */
export function formatMoney(amount, { decimals = false } = {}) {
  const n = Number(amount) || 0;
  const body = (decimals && !Number.isInteger(n) ? moneyFmt2 : moneyFmt).format(Math.abs(n));
  return `${n < 0 ? '-' : ''}\u200F₪${body}`;
}

export function firstName(fullName) {
  const s = String(fullName || '').trim();
  if (!s) return '';
  const lower = s.replace(/^משפחת\s+/, '');
  if (lower !== s) return s; // "משפחת לוי" reads better whole
  return s.split(/\s+/)[0];
}

export function pct(n) {
  return `${Math.round((Number(n) || 0) * 100)}%`;
}

/**
 * Hebrew prefix letter + name, merging the definite article: ב + הגפן -> בגפן, ל + הזית -> לזית.
 * Names without a leading ה keep it as is: ב + צימר הגפן -> בצימר הגפן.
 */
export function withPrefix(prefix, name) {
  const n = String(name || '').trim();
  if (!n) return '';
  if (/^[\u0590-\u05FF]/.test(n) && n.startsWith('ה') && n.length > 2) return `${prefix}${n.slice(1)}`;
  if (/^[A-Za-z0-9]/.test(n)) return `${prefix}-${n}`;
  return `${prefix}${n}`;
}
