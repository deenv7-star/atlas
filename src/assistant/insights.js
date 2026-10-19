/**
 * What the assistant says before anyone types: one real insight, a few one-tap questions, and the
 * only links an answer may carry (app screens, never the outside web). Pure, unit-tested.
 */
import { money, dayLabel, parseDay, withPrefix } from './facts.js';

/* ── links ────────────────────────────────────────────────────────────── */
/** App screens an answer may link to. Anything else renders as plain text. */
export const SAFE_LINK = Object.freeze({
  '/today': 'היום',
  '/dashboard': 'היום',
  '/calendar': 'לוח שנה',
  '/bookings': 'הזמנות',
  '/booking': 'הזמנה',
  '/leads': 'לידים',
  '/lead': 'ליד',
  '/payments': 'כספים',
  '/balances': 'יתרות',
  '/monthly-report': 'דוח חודשי',
  '/messages': 'הודעות',
  '/cleaning': 'ניקיון',
  '/integrations': 'ערוצים וחיבורים',
  '/settings': 'הגדרות',
  '/dynamic-pricing': 'תמחור חגים',
});

/** '/booking/abc?x=1' → '/booking/abc' when its first segment is allowed; otherwise null. */
export function safeHref(href) {
  const raw = String(href || '').trim();
  if (!raw.startsWith('/') || raw.startsWith('//') || /[\s\\<>"']/.test(raw)) return null;
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return null;
  const base = `/${parts[0]}`;
  if (!Object.prototype.hasOwnProperty.call(SAFE_LINK, base)) return null;
  if (parts.length > 2) return null;
  if (parts.length === 2) {
    if (base !== '/booking' && base !== '/lead') return null;
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(parts[1])) return null;
  }
  return path;
}

/**
 * Split an answer into body + action chips: markdown links on the LAST non-empty line(s) that are
 * nothing but links become chips (max 3). Unsafe links are dropped from the chips.
 */
export function splitActions(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const actions = [];
  const onlyLinks = /^\s*(?:[-•*]\s*)?(?:\[[^\]]{1,40}\]\([^)\s]{1,120}\)[\s·|,]*)+$/;
  while (lines.length) {
    const last = lines[lines.length - 1];
    if (!last.trim()) { lines.pop(); continue; }
    if (!onlyLinks.test(last)) break;
    const found = [...last.matchAll(/\[([^\]]{1,40})\]\(([^)\s]{1,120})\)/g)].map((m) => ({ label: m[1].trim(), href: safeHref(m[2]) }));
    actions.unshift(...found.filter((a) => a.href));
    lines.pop();
  }
  const seen = new Set();
  return {
    body: lines.join('\n').trim(),
    actions: actions.filter((a) => (seen.has(a.href) ? false : seen.add(a.href))).slice(0, 3),
  };
}

/* ── the one insight ──────────────────────────────────────────────────── */
const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`;
const list = (names) => (names.length <= 2 ? names.join(' ו') : `${names.slice(0, 2).join(', ')} ועוד ${names.length - 2}`);

/**
 * The single most useful true thing right now, or null when there is nothing real to say.
 * Order: money owed > an empty Thu/Fri night soon > today's arrivals > month vs last month > waiting leads.
 * → { kind, title, body, ask, action: { label, href } }
 */
export function insightOf(f) {
  if (!f || !f.hasData) return null;

  if (f.overdue.length) {
    const n = f.overdue.length;
    return {
      kind: 'money',
      title: `${money(f.overdueTotal)} עוד לא שולמו`,
      body: n === 1
        ? `היתרה של ${f.overdue[0].name} עברה את מועד התשלום.`
        : `${n} יתרות עברו את מועד התשלום. הגדולה: ${f.overdue[0].name}, ${money(f.overdue[0].amount)}.`,
      ask: 'מה הכי דחוף לגבות?',
      action: { label: 'פתיחת היתרות', href: '/balances' },
    };
  }

  const weekend = f.freeNights.filter((u) => u.weekend.length);
  if (weekend.length) {
    const first = weekend.map((u) => u.weekend[0]).sort()[0];
    const wd = parseDay(first).getDay();
    const units = weekend.filter((u) => u.weekend.includes(first)).map((u) => u.unit);
    return {
      kind: 'free',
      title: `ליל ${wd === 4 ? 'חמישי' : 'שישי'} פנוי, ${dayLabel(first)}`,
      body: units.length === 1 ? `פנוי ${withPrefix('ב', units[0])}. עוד יש זמן למלא אותו.` : `פנוי ב-${units.length} יחידות: ${list(units)}.`,
      ask: 'אילו לילות פנויים בשבועיים הקרובים?',
      action: { label: 'פתיחת לוח השנה', href: '/calendar' },
    };
  }

  if (f.arrivals.length) {
    const names = f.arrivals.map((a) => a.name);
    return {
      kind: 'today',
      title: f.arrivals.length === 1 ? `כניסה היום: ${names[0]}` : `${f.arrivals.length} כניסות היום`,
      body: f.arrivals.length === 1 ? (f.arrivals[0].unit ? `${withPrefix('ל', f.arrivals[0].unit)}.` : 'ההזמנה רשומה ביומן.') : `${list(names)}.`,
      ask: 'מה צריך להכין להיום?',
      action: { label: 'פתיחת היום', href: '/today' },
    };
  }

  const cur = f.month; const prev = f.prevMonth;
  if (cur.revenue > 0 || prev.revenue > 0) {
    const body = prev.revenue > 0
      ? `תפוסה ${pct(cur.occupancy)}. ב${prev.label.split(' ')[0]}: ${money(prev.revenue)}, תפוסה ${pct(prev.occupancy)}.`
      : `תפוסה ${pct(cur.occupancy)}.`;
    return {
      kind: 'month',
      title: `${money(cur.revenue)} הוזמנו ל${cur.label.split(' ')[0]}`,
      body,
      ask: 'איך החודש לעומת החודש שעבר?',
      action: { label: 'פתיחת הדוח החודשי', href: '/monthly-report' },
    };
  }

  if (f.openLeads.length) {
    const n = f.openLeads.length;
    return {
      kind: 'leads',
      title: n === 1 ? `הפנייה של ${f.openLeads[0].name} מחכה לתשובה` : `${n} פניות מחכות לתשובה`,
      body: n === 1 ? (f.openLeads[0].since ? `נכנסה ב-${f.openLeads[0].since.split('-').reverse().slice(0, 2).join('.')}.` : 'היא עדיין פתוחה.') : `הוותיקה ביותר: ${f.openLeads[0].name}.`,
      ask: 'אילו פניות מחכות לתשובה?',
      action: { label: 'פתיחת הלידים', href: '/leads' },
    };
  }
  return null;
}

/* ── one-tap questions ────────────────────────────────────────────────── */
const Q = {
  month: 'איך החודש לעומת החודש שעבר?',
  today: 'מה צריך להכין להיום?',
  money: 'מי עוד חייב לנו כסף?',
  free: 'אילו לילות פנויים בשבועיים הקרובים?',
  leads: 'אילו פניות מחכות לתשובה?',
  tomorrow: 'מי מגיע מחר?',
};
const BY_PAGE = [
  ['/payments', ['money', 'month']],
  ['/balances', ['money', 'month']],
  ['/monthly-report', ['month', 'money']],
  ['/calendar', ['free', 'tomorrow']],
  ['/bookings', ['tomorrow', 'free']],
  ['/booking', ['money', 'tomorrow']],
  ['/leads', ['leads', 'free']],
  ['/lead', ['leads', 'free']],
  ['/today', ['today', 'money']],
  ['/dashboard', ['today', 'money']],
];

/**
 * Up to `max` questions for this screen, only ones the data can actually answer.
 * The insight's own question is left out (it already has its own button).
 */
export function suggestionsOf(f, page = '', max = 3) {
  if (!f || !f.hasData) return [];
  const can = {
    month: f.month.revenue > 0 || f.prevMonth.revenue > 0,
    today: f.arrivals.length + f.departures.length > 0,
    money: f.overdue.length + f.dueSoon.length > 0,
    free: f.freeTotal > 0,
    leads: f.openLeads.length > 0,
    tomorrow: f.arrivalsTomorrow.length > 0,
  };
  const hit = BY_PAGE.find(([p]) => page === p || page.startsWith(`${p}/`));
  const order = [...(hit ? hit[1] : []), 'month', 'money', 'free', 'today', 'leads', 'tomorrow'];
  const skip = insightOf(f)?.ask;
  const out = [];
  for (const k of order) {
    if (!can[k]) continue;
    const q = Q[k];
    if (q === skip || out.includes(q) || skip?.startsWith(q.replace('?', ''))) continue;
    out.push(q);
    if (out.length >= max) break;
  }
  return out;
}
