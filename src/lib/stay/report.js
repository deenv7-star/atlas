/**
 * Monthly accountant report. Income is attributed by nights stayed inside the month
 * (a stay crossing months is split pro-rata), which is how occupancy and ADR are measured too.
 */
import { isActiveBooking, checkOutOf, channelOf, CHANNELS, isPaid } from './bookings';
import { toISODay, nightsBetween, formatMoney, monthLabelHe } from './format';

export function monthBounds(year, monthIndex) {
  const start = toISODay(new Date(year, monthIndex, 1));
  const end = toISODay(new Date(year, monthIndex + 1, 1)); // exclusive
  const days = new Date(year, monthIndex + 1, 0).getDate();
  return { start, end, days };
}

const maxS = (a, b) => (a > b ? a : b);
const minS = (a, b) => (a < b ? a : b);

export function buildMonthlyReport({ year, monthIndex, bookings, properties, payments, expenses }) {
  const { start, end, days } = monthBounds(year, monthIndex);
  const units = (properties || []).length || new Set((bookings || []).map((b) => b.property_id).filter(Boolean)).size || 1;
  const propName = new Map((properties || []).map((p) => [p.id, p.name]));

  const channelRows = new Map(Object.values(CHANNELS).map((c) => [c.key, { ...c, income: 0, nights: 0, bookings: 0 }]));
  const unitRows = new Map((properties || []).map((p) => [p.id, { id: p.id, name: p.name, nights: 0, income: 0, bookings: 0 }]));
  const lines = [];

  for (const b of bookings || []) {
    if (!isActiveBooking(b)) continue;
    const ci = b.check_in_date;
    const co = checkOutOf(b);
    const total = nightsBetween(ci, co) || 1;
    const s = maxS(ci, start);
    const e = minS(co, end);
    const inMonth = s < e ? nightsBetween(s, e) : 0;
    if (!inMonth) continue;
    const income = (Number(b.total_price) || 0) * (inMonth / total);
    const ch = channelOf(b);
    const cr = channelRows.get(ch.key);
    cr.income += income; cr.nights += inMonth; cr.bookings += 1;
    const key = b.property_id || 'none';
    if (!unitRows.has(key)) unitRows.set(key, { id: key, name: propName.get(key) || b.property_name || 'ללא יחידה', nights: 0, income: 0, bookings: 0 });
    const ur = unitRows.get(key);
    ur.nights += inMonth; ur.income += income; ur.bookings += 1;
    lines.push({
      id: b.id, guest: b.guest_name || '', unit: ur.name, channel: ch.label, check_in: ci, check_out: co,
      nightsInMonth: inMonth, total: Number(b.total_price) || 0, income,
    });
  }

  const expenseRows = (expenses || [])
    .filter((x) => {
      const d = String(x.expense_date || x.date || '').slice(0, 10);
      return d >= start && d < end;
    })
    .map((x) => ({
      id: x.id, date: String(x.expense_date || x.date).slice(0, 10), category: x.category || 'אחר',
      description: x.description || '', amount: Number(x.amount) || 0,
      unit: propName.get(x.property_id) || x.property_name || x.property || '',
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const byCategory = new Map();
  for (const x of expenseRows) byCategory.set(x.category, (byCategory.get(x.category) || 0) + x.amount);

  const received = (payments || [])
    .filter((p) => isPaid(p))
    .filter((p) => {
      const d = String(p.paid_date || p.paid_at || '').slice(0, 10);
      return d >= start && d < end;
    })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const income = [...channelRows.values()].reduce((s, c) => s + c.income, 0);
  const nights = [...channelRows.values()].reduce((s, c) => s + c.nights, 0);
  const expenseTotal = expenseRows.reduce((s, x) => s + x.amount, 0);
  const capacity = units * days;

  return {
    label: monthLabelHe(year, monthIndex),
    start, end, days, units,
    income, expenseTotal, net: income - expenseTotal, received,
    nights, capacity,
    occupancy: capacity ? nights / capacity : 0,
    adr: nights ? income / nights : 0,
    channels: [...channelRows.values()].filter((c) => c.income > 0 || c.nights > 0),
    unitRows: [...unitRows.values()].map((u) => ({ ...u, occupancy: days ? u.nights / days : 0, adr: u.nights ? u.income / u.nights : 0 })),
    expenseRows,
    expenseByCategory: [...byCategory.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    lines: lines.sort((a, b) => a.check_in.localeCompare(b.check_in)),
  };
}

const round = (n) => Math.round(Number(n) || 0);

/** Multi-section CSV (UTF-8 BOM so Hebrew opens correctly in Excel). */
export function reportToCSV(r, orgName = '') {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const row = (...cells) => cells.map(esc).join(',');
  const out = [];
  out.push(row(`דוח חודשי ${r.label}`, orgName));
  out.push('');
  out.push(row('סיכום'));
  out.push(row('הכנסות (₪)', round(r.income)));
  out.push(row('הוצאות (₪)', round(r.expenseTotal)));
  out.push(row('נטו (₪)', round(r.net)));
  out.push(row('תשלומים שהתקבלו בחודש (₪)', round(r.received)));
  out.push(row('לילות שנמכרו', r.nights));
  out.push(row('תפוסה (%)', Math.round(r.occupancy * 100)));
  out.push(row('מחיר ממוצע ללילה ADR (₪)', round(r.adr)));
  out.push('');
  out.push(row('הכנסות לפי ערוץ', 'לילות', 'הזמנות', 'הכנסות (₪)'));
  r.channels.forEach((c) => out.push(row(c.label, c.nights, c.bookings, round(c.income))));
  out.push('');
  out.push(row('יחידה', 'לילות', 'תפוסה (%)', 'ADR (₪)', 'הכנסות (₪)'));
  r.unitRows.forEach((u) => out.push(row(u.name, u.nights, Math.round(u.occupancy * 100), round(u.adr), round(u.income))));
  out.push('');
  out.push(row('הוצאות', 'תאריך', 'קטגוריה', 'יחידה', 'סכום (₪)'));
  r.expenseRows.forEach((x) => out.push(row(x.description, x.date, x.category, x.unit, round(x.amount))));
  out.push('');
  out.push(row('הזמנות', 'יחידה', 'ערוץ', 'כניסה', 'יציאה', 'לילות בחודש', 'מחיר כולל (₪)', 'הכנסה בחודש (₪)'));
  r.lines.forEach((l) => out.push(row(l.guest, l.unit, l.channel, l.check_in, l.check_out, l.nightsInMonth, round(l.total), round(l.income))));
  return '\uFEFF' + out.join('\n');
}

export function downloadText(content, filename, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { formatMoney };
