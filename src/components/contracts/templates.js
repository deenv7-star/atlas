/**
 * feat/pages-clarity (Deen 05.11.2026): ready contract templates shipped in code (no migration, no setup).
 * A new owner sees and uses them on day one; "שכפלו ועריכה" saves an editable copy to contract_templates.
 * Plain, fair Hebrew. Not legal advice: every template carries "תבנית לדוגמה, מומלץ שעו״ד יעבור עליה".
 * Tokens stay English inside the stored HTML ({guest_name}); the editor and the chips show Hebrew names.
 */
import { format, parseISO } from 'date-fns';

export const MERGE_FIELDS = [
  { token: 'guest_name', label: 'שם האורח' },
  { token: 'checkin_date', label: 'תאריך כניסה' },
  { token: 'checkout_date', label: 'תאריך יציאה' },
  { token: 'checkin_time', label: 'שעת כניסה' },
  { token: 'checkout_time', label: 'שעת יציאה' },
  { token: 'unit_name', label: 'שם היחידה' },
  { token: 'guests_count', label: 'מספר אורחים' },
  { token: 'total_amount', label: 'סכום כולל' },
  { token: 'deposit_amount', label: 'מקדמה' },
  { token: 'host_name', label: 'שם המארחים' },
];
const BY_TOKEN = Object.fromEntries(MERGE_FIELDS.map((f) => [f.token, f.label]));
const BY_LABEL = Object.fromEntries(MERGE_FIELDS.map((f) => [f.label, f.token]));

/** {guest_name} → {שם האורח} for the editor; the reverse before saving. Unknown tokens are left alone. */
export const toDisplay = (html = '') => String(html).replace(/\{([a-z_]+)\}/g, (m, t) => (BY_TOKEN[t] ? `{${BY_TOKEN[t]}}` : m));
export const toInternal = (html = '') => String(html).replace(/\{([^{}]{2,30})\}/g, (m, l) => (BY_LABEL[l.trim()] ? `{${BY_LABEL[l.trim()]}}` : m));

/** Tokens a template uses, in MERGE_FIELDS order (for the chips on each card). */
export const fieldsIn = (html = '') => MERGE_FIELDS.filter((f) => String(html).includes(`{${f.token}}`));

/** HTML for a read-only preview: every token becomes a visible chip with its Hebrew name. */
export const withChips = (html = '') => String(html).replace(/\{([a-z_]+)\}/g, (m, t) => (BY_TOKEN[t] ? `<span class="ct-chip">${BY_TOKEN[t]}</span>` : m));

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const d = (iso) => { try { return iso ? format(parseISO(String(iso).slice(0, 10)), 'd/M/yyyy') : ''; } catch { return ''; } };
const money = (n) => (Number(n) > 0 ? `₪${Math.round(Number(n)).toLocaleString('he-IL')}` : '');

/** Fill a template from a booking + its unit (+ guest info) + deposit. Values are escaped: names come from forms and iCal. */
export function fillTemplate(html, { booking, property, info, deposit, hostName }) {
  const b = booking || {};
  const vals = {
    guest_name: esc(b.guest_name),
    checkin_date: d(b.check_in_date || b.checkin_date),
    checkout_date: d(b.check_out_date || b.checkout_date),
    checkin_time: esc(info?.check_in_time || '15:00'),
    checkout_time: esc(info?.check_out_time || '11:00'),
    unit_name: esc(property?.name),
    guests_count: esc((Number(b.adults) || 0) + (Number(b.children) || 0) || b.guests || ''),
    total_amount: money(b.total_price ?? b.total_amount),
    deposit_amount: money(deposit),
    host_name: esc(hostName || info?.host_name || ''),
  };
  return toInternal(String(html || '')).replace(/\{([a-z_]+)\}/g, (m, t) => (t in vals ? (vals[t] || '_____') : m));
}

/** A marker at the top of a contract made from a built-in template, so the list can name it (template_id is a uuid FK). */
export const builtinMarker = (id) => `<!--atlas-template:${id}-->`;
export const builtinOf = (content) => { const m = /<!--atlas-template:([a-z-]+)-->/.exec(String(content || '')); return m ? BUILTIN_TEMPLATES.find((t) => t.id === m[1]) || null : null; };

export const LAWYER_NOTE = 'תבנית לדוגמה, מומלץ שעו״ד יעבור עליה.';

const sign = `<p>&nbsp;</p><p><strong>חתימת האורח:</strong> ____________ &nbsp; <strong>תאריך:</strong> ____________</p><p><strong>חתימת המארחים:</strong> ____________</p>`;

export const BUILTIN_TEMPLATES = [
  {
    id: 'hosting',
    name: 'הסכם אירוח כללי',
    blurb: 'מי מתארח, מתי, כמה משלמים ומה הכללים הבסיסיים.',
    content: `<h2>הסכם אירוח</h2>
<p>בין {host_name} (המארחים) לבין {guest_name} (האורחים).</p>
<h3>פרטי השהייה</h3>
<ul><li>יחידה: {unit_name}</li><li>כניסה: {checkin_date} משעה {checkin_time}</li><li>יציאה: {checkout_date} עד שעה {checkout_time}</li><li>מספר אורחים: {guests_count}</li><li>מחיר כולל: {total_amount}, מתוכו מקדמה ששולמה: {deposit_amount}</li></ul>
<h3>מה סיכמנו</h3>
<ol><li>היתרה משולמת עד יום הכניסה, אלא אם סוכם אחרת.</li><li>במקום ישהו רק האורחים שנרשמו. אורח נוסף בתיאום מראש.</li><li>האורחים שומרים על היחידה ועל הציוד, ומדווחים מיד על נזק או תקלה.</li><li>נזק שנגרם ברשלנות יתוקן על חשבון האורחים, לפי עלות התיקון בפועל.</li><li>אין עישון בתוך היחידה.</li></ol>
${sign}`,
  },
  {
    id: 'house-rules',
    name: 'תקנון המתחם וכללי בית',
    blurb: 'שעות שקט, עישון, חיות, אורחים נוספים וסדר ביציאה.',
    content: `<h2>תקנון {unit_name}</h2>
<p>שלום {guest_name}, כדי שתיהנו ושגם השכנים ייהנו, אלה הכללים שלנו.</p>
<ol><li>שעות שקט: 23:00 עד 08:00. בלי מוזיקה בחוץ בשעות האלה.</li><li>אין עישון בתוך היחידה. מותר במרפסת או בחצר.</li><li>חיות מחמד רק בתיאום מראש.</li><li>אורחים שלא נרשמו לא נשארים ללון.</li><li>ביציאה: כלים בכיור, אשפה בפח, מזגנים ואורות כבויים.</li><li>היציאה עד {checkout_time}. יציאה מאוחרת בתיאום ובתשלום, אם פנוי.</li></ol>
<p>מאשרים שקראנו ונשמור על הכללים.</p>
${sign}`,
  },
  {
    id: 'cancellation',
    name: 'מדיניות ביטול ופיקדון',
    blurb: 'עד מתי מבטלים בלי חיוב, ומה קורה למקדמה ולפיקדון.',
    content: `<h2>מדיניות ביטול ופיקדון</h2>
<p>הזמנה של {guest_name} ב{unit_name}, מ-{checkin_date} עד {checkout_date}. מחיר כולל: {total_amount}. מקדמה: {deposit_amount}.</p>
<h3>ביטול</h3>
<ol><li>ביטול עד 14 יום לפני הכניסה: המקדמה מוחזרת במלואה.</li><li>ביטול 7 עד 13 ימים לפני הכניסה: מוחזרת מחצית מהמקדמה.</li><li>ביטול פחות מ-7 ימים לפני הכניסה: המקדמה לא מוחזרת.</li><li>אם אנחנו מבטלים מכל סיבה: כל מה ששולם מוחזר.</li></ol>
<h3>פיקדון לנזקים</h3>
<p>אם נגבה פיקדון, הוא מוחזר עד 3 ימי עסקים אחרי היציאה, בניכוי נזק שתועד בתמונות ונמסר לאורחים.</p>
<p>הערה: לפי חוק הגנת הצרכן ייתכנו זכויות ביטול נוספות. התנאים כאן לא גורעים מהן.</p>
${sign}`,
  },
  {
    id: 'pool',
    name: 'הצהרת בריכה וג׳קוזי',
    blurb: 'שימוש בבריכה או בג׳קוזי באחריות האורחים, ילדים בהשגחה.',
    content: `<h2>הצהרה לשימוש בבריכה ובג׳קוזי</h2>
<p>אנחנו, {guest_name}, מתארחים ב{unit_name} מ-{checkin_date} עד {checkout_date}, ומצהירים:</p>
<ol><li>אין מציל במקום. השימוש בבריכה ובג׳קוזי באחריותנו.</li><li>ילדים נכנסים למים רק בהשגחה צמודה של מבוגר.</li><li>לא נכנסים למים אחרי שתיית אלכוהול.</li><li>בג׳קוזי: עד 20 דקות ברצף. נשים בהריון ומי שיש לו בעיית לב או לחץ דם, רק באישור רופא.</li><li>בלי כלי זכוכית ליד המים.</li><li>מכסים את הג׳קוזי בסוף השימוש ומדווחים מיד על תקלה.</li></ol>
${sign}`,
  },
  {
    id: 'event',
    name: 'אירוע או מסיבה במתחם',
    blurb: 'מספר משתתפים, שעות, רעש, ניקיון ופיקדון לאירוע.',
    content: `<h2>הסכם לאירוע במתחם</h2>
<p>בין {host_name} לבין {guest_name}, לאירוע ב{unit_name} בתאריך {checkin_date}.</p>
<ol><li>מספר המשתתפים המרבי: {guests_count}. משתתפים נוספים רק באישור מראש.</li><li>האירוע מסתיים עד 23:00. אחרי השעה הזו בלי מוזיקה מוגברת.</li><li>ספקים (קייטרינג, די-ג׳יי, הגברה) רק בתיאום מראש.</li><li>אין זיקוקים ואין אש גלויה מחוץ למקומות המיועדים.</li><li>ניקיון אחרי האירוע: לפי מה שסוכם. חריגה תחויב לפי עלות בפועל.</li><li>מחיר: {total_amount}. מקדמה: {deposit_amount}. פיקדון לנזקים מוחזר תוך 3 ימי עסקים.</li></ol>
${sign}`,
  },
];
