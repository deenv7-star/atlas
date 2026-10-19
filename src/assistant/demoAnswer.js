/**
 * Demo mode (no Supabase, local data in this browser): the stand-in for POST /api/assistant/stream.
 * Answers come only from the snapshot in facts.js, in the same shape the real model is asked for
 * (short, plural, a table when comparing, app links on the last line). Nothing here is invented:
 * a question the snapshot cannot answer gets an honest "here is what I can answer".
 */
import { money, dayLabel, withPrefix } from './facts.js';

const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`;
const short = (iso) => (iso ? iso.split('-').reverse().slice(0, 2).join('.') : '');
const who = (p) => (p.unit ? `${p.name}, ${p.unit}` : p.name);

function money_(f) {
  if (!f.overdue.length && !f.dueSoon.length) return 'אין כרגע יתרות פתוחות שעבר או מתקרב מועד התשלום שלהן.\n\n[פתיחת היתרות](/balances)';
  const rows = [...f.overdue.map((r) => ({ ...r, s: 'באיחור' })), ...f.dueSoon.map((r) => ({ ...r, s: 'בקרוב' }))].slice(0, 8);
  const head = f.overdue.length
    ? `${money(f.overdueTotal)} באיחור, ב-${f.overdue.length} ${f.overdue.length === 1 ? 'הזמנה' : 'הזמנות'}. הכי דחוף: **${f.overdue[0].name}**, ${money(f.overdue[0].amount)}.`
    : `אין יתרות באיחור. ${f.dueSoon.length === 1 ? 'יתרה אחת מגיעה' : `${f.dueSoon.length} יתרות מגיעות`} בשלושת הימים הקרובים.`;
  const table = ['| אורח | יחידה | יתרה | מועד | מצב |', '|---|---|---|---|---|', ...rows.map((r) => `| ${r.name} | ${r.unit || '-'} | ${money(r.amount)} | ${short(r.due)} | ${r.s} |`)].join('\n');
  const first = f.overdue[0] || f.dueSoon[0];
  return `${head}\n\n${table}\n\nאפשר לשלוח תזכורת בוואטסאפ ממסך ההזמנה.\n\n[פתיחת היתרות](/balances) [ההזמנה של ${first.name}](/booking/${first.id})`;
}

function free_(f) {
  if (!f.freeNights.length) return 'עוד אין יחידות ביומן, אז אין ממה לחשב לילות פנויים.\n\n[הגדרות](/settings)';
  if (!f.freeTotal) return 'כל הלילות בשבועיים הקרובים תפוסים.\n\n[פתיחת לוח השנה](/calendar)';
  const table = ['| יחידה | לילות פנויים | חמישי ושישי פנויים |', '|---|---|---|',
    ...f.freeNights.map((u) => `| ${u.unit} | ${u.free} מתוך 14 | ${u.weekend.length ? u.weekend.map(short).join(', ') : 'אין'} |`)].join('\n');
  const wk = f.freeNights.flatMap((u) => u.weekend).length;
  const tip = wk ? 'לילות חמישי ושישי הם הקלים ביותר למלא. כדאי לבדוק אותם קודם.' : 'סופי השבוע כבר מלאים. מה שנשאר הוא באמצע השבוע.';
  return `${f.freeTotal} לילות פנויים בשבועיים הקרובים.\n\n${table}\n\n${tip}\n\n[פתיחת לוח השנה](/calendar)`;
}

function today_(f) {
  const parts = [];
  if (!f.arrivals.length && !f.departures.length) parts.push(`אין כניסות או יציאות היום (${f.todayLabel}).`);
  if (f.departures.length) parts.push(`**יציאות:** ${f.departures.map(who).join(' · ')}. אחרי היציאה, ניקיון והחלפת מצעים.`);
  if (f.arrivals.length) parts.push(`**כניסות:** ${f.arrivals.map(who).join(' · ')}. כדאי לוודא שהוראות ההגעה נשלחו.`);
  const owed = f.overdue.filter((r) => f.arrivals.some((a) => a.id === r.id));
  if (owed.length) parts.push(`${owed[0].name} עוד חייבים ${money(owed[0].amount)}. אפשר לגבות בכניסה.`);
  if (f.arrivalsTomorrow.length) parts.push(`מחר: ${f.arrivalsTomorrow.map(who).join(' · ')}.`);
  return `${parts.join('\n\n')}\n\n[פתיחת היום](/today)`;
}

function tomorrow_(f) {
  if (!f.arrivalsTomorrow.length) return 'אין כניסות מחר.\n\n[פתיחת לוח השנה](/calendar)';
  return `מחר ${f.arrivalsTomorrow.length === 1 ? 'נכנסים' : `${f.arrivalsTomorrow.length} כניסות`}:\n\n${f.arrivalsTomorrow.map((a) => `- **${a.name}**${a.unit ? ` ${withPrefix('ל', a.unit)}` : ''}`).join('\n')}\n\n[פתיחת לוח השנה](/calendar)`;
}

function month_(f) {
  const c = f.month; const p = f.prevMonth;
  const table = ['| | ' + c.label + ' | ' + p.label + ' |', '|---|---|---|',
    `| הכנסות | ${money(c.revenue)} | ${money(p.revenue)} |`,
    `| תפוסה | ${pct(c.occupancy)} | ${pct(p.occupancy)} |`,
    `| לילות | ${c.nights} | ${p.nights} |`,
    `| הזמנות | ${c.bookings} | ${p.bookings} |`].join('\n');
  let line;
  if (!p.revenue) line = `החודש הוזמנו ${money(c.revenue)}. בחודש שעבר לא היו הכנסות רשומות להשוואה.`;
  else if (c.revenue >= p.revenue) line = `החודש כבר הוזמנו ${money(c.revenue - p.revenue)} יותר מכל החודש שעבר.`;
  else line = `עד עכשיו הוזמנו החודש ${money(p.revenue - c.revenue)} פחות מכל החודש שעבר. החודש עוד לא נגמר, והמספר כולל רק הזמנות שכבר ביומן.`;
  return `${line}\n\n${table}\n\n[פתיחת הדוח החודשי](/monthly-report)`;
}

function leads_(f) {
  if (!f.openLeads.length) return 'אין פניות פתוחות. כל הלידים קיבלו תשובה.\n\n[פתיחת הלידים](/leads)';
  const rows = f.openLeads.slice(0, 6).map((l) => `- **${l.name}**${l.since ? `, מ-${short(l.since)}` : ''}${l.dates ? `, מבקשים את ${short(l.dates)}` : ''}`);
  return `${f.openLeads.length === 1 ? 'פנייה אחת מחכה' : `${f.openLeads.length} פניות מחכות`} לתשובה. הוותיקה ראשונה:\n\n${rows.join('\n')}\n\nכדאי לענות קודם לפנייה הוותיקה.\n\n[פתיחת הלידים](/leads)`;
}

const ROUTES = [
  [/חייב|יתר|שולם|תשלום|לגבות|גבייה|כסף/, money_],
  [/פנוי|לילות|סופ"?ש|סוף שבוע|ריק|למלא/, free_],
  [/מחר/, tomorrow_],
  [/היום|להכין|כניס|יציא|מגיע/, today_],
  [/חודש|הכנסה|הכנסות|תפוסה|השווא|ביצוע/, month_],
  [/ליד|פני|לקוחות חדשים/, leads_],
];

export function demoAnswer(question, facts) {
  const q = String(question || '');
  if (!facts?.hasData) return 'עוד אין הזמנות ביומן, אז אין לי ממה לענות. אחרי שתוסיפו הזמנה ראשונה או תחברו את Booking ו-Airbnb, אפשר לשאול כאן על כסף, לילות פנויים ואורחים.\n\n[ערוצים וחיבורים](/integrations)';
  const hit = ROUTES.find(([re]) => re.test(q));
  if (hit) return hit[1](facts);
  return `בהדגמה אפשר לשאול על מה שכבר רשום ביומן: כסף שעוד לא שולם, לילות פנויים, מי מגיע היום ומחר, החודש מול החודש שעבר ופניות פתוחות.\n\nלמשל: "מי עוד חייב לנו כסף?"`;
}

export const DEMO_STREAM_PATH = '/api/assistant/stream';
export { dayLabel };
