/**
 * The assistant's view of the business: one small, real snapshot built from the same rows the app
 * shows (bookings.total_price, check_in_date / check_out_date, payments, leads, properties).
 *
 * Pure and dependency-free on purpose: unit-tested with `node --test` (tests/unit/assistant.test.mjs)
 * and used by the page, the side panel, the demo answers and the context sent to ai-chat.
 * Privacy: guests appear by FIRST name only; no phone, email or notes ever leave this module.
 *
 * Money and occupancy follow src/lib/stay/report.js: a stay crossing months is split by nights.
 */

const INACTIVE = new Set(['CANCELLED', 'CANCELED', 'WAITLIST', 'cancelled', 'canceled', 'waitlist']);
const PAID = new Set(['PAID', 'paid', 'COMPLETED', 'completed', 'succeeded', 'SUCCEEDED']);
const REFUNDED = new Set(['REFUNDED', 'refunded']);
const OPEN_LEADS = new Set(['NEW', 'CONTACTED', 'OFFER_SENT', 'new', 'contacted', 'offer_sent']);
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

/* ── dates (local calendar days, never raw 24h maths) ─────────────────── */
export function parseDay(v) {
  if (!v) return null;
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
export function iso(d) {
  const x = d instanceof Date ? d : parseDay(d);
  if (!x) return '';
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
export function addDays(v, n) { const d = parseDay(v); if (!d) return ''; d.setDate(d.getDate() + n); return iso(d); }
export function nightsBetween(a, b) {
  const x = parseDay(a); const y = parseDay(b);
  return x && y ? Math.max(0, Math.round((y - x) / 86400000)) : 0;
}
export function dayLabel(v) {
  const d = parseDay(v);
  return d ? `יום ${DAY_LETTERS[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}` : '';
}
const fmt = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });
/** "‏₪1,250" (RLM keeps the sign on the right in RTL). */
export function money(n) { const v = Math.round(Number(n) || 0); return `${v < 0 ? '-' : ''}\u200F₪${fmt.format(Math.abs(v))}`; }

export function firstName(full) {
  const s = String(full || '').trim();
  if (!s) return '';
  if (/^משפחת\s+/.test(s)) return s.split(/\s+/).slice(0, 2).join(' ');
  return s.split(/\s+/)[0];
}

/* ── bookings ─────────────────────────────────────────────────────────── */
const ciOf = (b) => String(b?.check_in_date || '').slice(0, 10);
function coOf(b) {
  if (b?.check_out_date) return String(b.check_out_date).slice(0, 10);
  const ci = ciOf(b);
  return ci ? addDays(ci, Math.max(1, Number(b.nights) || 1)) : '';
}
export const isActive = (b) => !!b && !INACTIVE.has(b.status) && !b.is_block && !!ciOf(b);
const isBlock = (b) => !!b && !INACTIVE.has(b.status) && !!b.is_block && !!ciOf(b);

function monthWindow(year, m) {
  const start = iso(new Date(year, m, 1));
  const end = iso(new Date(year, m + 1, 1));
  return { start, end, days: new Date(year, m + 1, 0).getDate(), label: `${MONTHS[m]} ${year}` };
}

function monthStats(bookings, win, units) {
  let revenue = 0; let nights = 0; let count = 0;
  for (const b of bookings) {
    if (!isActive(b)) continue;
    const ci = ciOf(b); const co = coOf(b);
    const total = nightsBetween(ci, co) || 1;
    const s = ci > win.start ? ci : win.start;
    const e = co < win.end ? co : win.end;
    const inMonth = s < e ? nightsBetween(s, e) : 0;
    if (!inMonth) continue;
    revenue += (Number(b.total_price) || 0) * (inMonth / total);
    nights += inMonth; count += 1;
  }
  const capacity = Math.max(1, units) * win.days;
  return { label: win.label, revenue: Math.round(revenue), nights, bookings: count, occupancy: capacity ? nights / capacity : 0 };
}

function unitNameOf(b, names) {
  return names.get(b.unit_id) || names.get(b.property_id) || b.property_name || '';
}

/**
 * buildFacts({ bookings, payments, leads, properties, today }) → snapshot.
 * `today` is 'YYYY-MM-DD' (defaults to the device's local day).
 */
export function buildFacts({ bookings = [], payments = [], leads = [], properties = [], today } = {}) {
  const day = today || iso(new Date());
  const d = parseDay(day);
  const names = new Map((properties || []).map((p) => [p.id, p.name || '']));
  const unitIds = (properties || []).map((p) => p.id);
  const unitsCount = unitIds.length || new Set(bookings.map((b) => b.unit_id || b.property_id).filter(Boolean)).size || 1;

  const thisWin = monthWindow(d.getFullYear(), d.getMonth());
  const prevWin = monthWindow(d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear(), (d.getMonth() + 11) % 12);
  const month = monthStats(bookings, thisWin, unitsCount);
  const prevMonth = monthStats(bookings, prevWin, unitsCount);

  const person = (b) => ({ id: b.id, name: firstName(b.guest_name) || 'אורח', unit: unitNameOf(b, names) });
  const active = bookings.filter(isActive);
  const arrivals = active.filter((b) => ciOf(b) === day).map(person);
  const departures = active.filter((b) => coOf(b) === day).map(person);
  const tomorrow = addDays(day, 1);
  const arrivalsTomorrow = active.filter((b) => ciOf(b) === tomorrow).map(person);

  // balances: total_price minus paid payments (refunds subtracted); due = first unpaid due_date, else check-in
  const byBooking = new Map();
  for (const p of payments || []) {
    if (!p?.booking_id) continue;
    if (!byBooking.has(p.booking_id)) byBooking.set(p.booking_id, []);
    byBooking.get(p.booking_id).push(p);
  }
  const overdue = []; const dueSoon = [];
  for (const b of active) {
    const total = Number(b.total_price) || 0;
    if (total <= 0) continue;
    const list = byBooking.get(b.id) || [];
    const paid = list.filter((p) => PAID.has(p.status)).reduce((s, p) => s + (Number(p.amount) || 0), 0)
      - list.filter((p) => REFUNDED.has(p.status)).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balance = Math.round(Math.max(0, total - Math.max(0, paid)));
    if (balance <= 0) continue;
    const due = list.filter((p) => !PAID.has(p.status) && !REFUNDED.has(p.status) && p.due_date)
      .map((p) => String(p.due_date).slice(0, 10)).sort()[0] || ciOf(b);
    const row = { ...person(b), amount: balance, due };
    if (due < day) overdue.push(row);
    else if (nightsBetween(day, due) <= 3) dueSoon.push(row);
  }
  overdue.sort((a, b) => b.amount - a.amount);
  dueSoon.sort((a, b) => a.due.localeCompare(b.due));

  // leads still waiting for an answer, oldest first
  const openLeads = (leads || []).filter((l) => OPEN_LEADS.has(l.status))
    .map((l) => ({
      id: l.id, name: firstName(l.full_name || l.name) || 'פנייה', status: String(l.status || '').toUpperCase(),
      since: String(l.created_date || l.created_at || '').slice(0, 10),
      dates: l.check_in_date ? String(l.check_in_date).slice(0, 10) : '',
    }))
    .sort((a, b) => (a.since || '').localeCompare(b.since || ''));

  // free nights in the next 14 days, per unit (bookings and blocks both take a night)
  const horizon = Array.from({ length: 14 }, (_, i) => addDays(day, i));
  const keys = unitIds.length ? unitIds : [...new Set(active.map((b) => b.unit_id || b.property_id).filter(Boolean))];
  const taken = new Map(keys.map((k) => [k, new Set()]));
  for (const b of bookings) {
    if (!isActive(b) && !isBlock(b)) continue;
    const k = b.unit_id || b.property_id;
    if (!taken.has(k)) continue;
    for (let n = ciOf(b); n < coOf(b); n = addDays(n, 1)) taken.get(k).add(n);
  }
  const freeNights = keys.map((k) => {
    const free = horizon.filter((n) => !taken.get(k).has(n));
    const weekend = free.filter((n) => { const wd = parseDay(n).getDay(); return wd === 4 || wd === 5; }); // Thu/Fri nights
    return { unit: names.get(k) || 'יחידה', free: free.length, weekend };
  });
  const freeTotal = freeNights.reduce((s, u) => s + u.free, 0);

  return {
    today: day,
    todayLabel: dayLabel(day),
    units: unitsCount,
    hasData: bookings.length > 0 || (leads || []).length > 0,
    bookingsCount: active.length,
    month: { ...month },
    prevMonth: { ...prevMonth },
    arrivals, departures, arrivalsTomorrow,
    overdue, overdueTotal: overdue.reduce((s, r) => s + r.amount, 0),
    dueSoon,
    openLeads,
    freeNights, freeTotal, freeCapacity: keys.length * 14,
  };
}

/**
 * Compact, model-friendly copy of the snapshot (what ai-chat receives as `context`).
 * Capped lists keep the request small; ids stay so the model can link to /booking/:id.
 */
export function factsForModel(f, page = '') {
  if (!f) return null;
  const cap = (a, n = 8) => (a || []).slice(0, n);
  return {
    page,
    today: f.today,
    units: f.units,
    month: { label: f.month.label, revenue: f.month.revenue, occupancy_pct: Math.round(f.month.occupancy * 100), nights: f.month.nights, bookings: f.month.bookings },
    prev_month: { label: f.prevMonth.label, revenue: f.prevMonth.revenue, occupancy_pct: Math.round(f.prevMonth.occupancy * 100), nights: f.prevMonth.nights, bookings: f.prevMonth.bookings },
    arrivals_today: cap(f.arrivals), departures_today: cap(f.departures), arrivals_tomorrow: cap(f.arrivalsTomorrow),
    overdue_balances: cap(f.overdue), overdue_total: f.overdueTotal, due_in_3_days: cap(f.dueSoon),
    open_leads: cap(f.openLeads),
    free_nights_14d: f.freeNights.map((u) => ({ unit: u.unit, free: u.free, free_thu_fri: u.weekend })),
  };
}

/** Same snapshot as plain Hebrew lines: the `prompt` the current (v3) ai-chat understands. */
export function factsToText(f) {
  if (!f) return '';
  const pc = (n) => `${Math.round((n || 0) * 100)}%`;
  const names = (a) => a.map((p) => (p.unit ? `${p.name} (${p.unit})` : p.name)).join(', ') || 'אין';
  return [
    `היום: ${f.todayLabel} (${f.today}). יחידות: ${f.units}.`,
    `${f.month.label}: הכנסות ${money(f.month.revenue)}, תפוסה ${pc(f.month.occupancy)}, ${f.month.nights} לילות.`,
    `${f.prevMonth.label}: הכנסות ${money(f.prevMonth.revenue)}, תפוסה ${pc(f.prevMonth.occupancy)}, ${f.prevMonth.nights} לילות.`,
    `כניסות היום: ${names(f.arrivals)}. יציאות היום: ${names(f.departures)}. כניסות מחר: ${names(f.arrivalsTomorrow)}.`,
    `יתרות באיחור: ${f.overdue.map((r) => `${r.name} ${money(r.amount)} (מאז ${r.due})`).join(', ') || 'אין'}. סה"כ ${money(f.overdueTotal)}.`,
    `לידים פתוחים: ${f.openLeads.map((l) => `${l.name} (${l.since || 'ללא תאריך'})`).join(', ') || 'אין'}.`,
    `לילות פנויים ב-14 הימים הקרובים: ${f.freeNights.map((u) => `${u.unit} ${u.free}`).join(', ') || 'אין נתון'}.`,
  ].join('\n');
}

/** Hebrew prefix letter + name: ב + הגפן → בגפן, ל + Olive → ל-Olive (same rule as src/lib/stay/format.js). */
export function withPrefix(prefix, name) {
  const n = String(name || '').trim();
  if (!n) return '';
  if (/^[\u0590-\u05FF]/.test(n) && n.startsWith('ה') && n.length > 2) return `${prefix}${n.slice(1)}`;
  if (/^[A-Za-z0-9]/.test(n)) return `${prefix}-${n}`;
  return `${prefix}${n}`;
}
