/**
 * One-tap WhatsApp (wa.me deep links, no paid API) with Hebrew templates.
 * Wording follows brand/atlas-brand.md: warm, simple, concrete, no exclamation spam, no em dashes.
 */
import { formatDayHe, formatMoney, firstName, addDays, todayISO, withPrefix } from './format';
import { guestInfoOf, navigationTarget, wazeUrl, guestPageUrl } from './guestInfo';

/** Israeli local numbers → international digits for wa.me (0521234567 → 972521234567). */
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (!d) return '';
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = `972${d.slice(1)}`;
  if (d.length < 9) return '';
  return d;
}

export function waLink(phone, text) {
  const p = normalizePhone(phone);
  const q = `text=${encodeURIComponent(text || '')}`;
  return p ? `https://wa.me/${p}?${q}` : `https://wa.me/?${q}`;
}

export const TEMPLATES = [
  { key: 'confirmation', label: 'אישור הזמנה', short: 'אישור' },
  { key: 'arrival_eve', label: 'הוראות הגעה', short: 'הוראות הגעה' },
  { key: 'welcome', label: 'ברוכים הבאים', short: 'ברוכים הבאים' },
  { key: 'thanks_review', label: 'תודה ובקשת ביקורת', short: 'תודה' },
  { key: 'balance_reminder', label: 'תזכורת יתרה', short: 'תזכורת יתרה' },
];

export function templateByKey(key) {
  return TEMPLATES.find((t) => t.key === key) || TEMPLATES[0];
}

/** Subject stored in message_logs, used to know a template was already sent for a booking. */
export function logSubjectFor(key) {
  return `וואטסאפ · ${templateByKey(key).label}`;
}

/**
 * ctx: { booking, property, balance, orgName, reviewUrl }
 */
export function renderTemplate(key, ctx) {
  const { balance, orgName = '', reviewUrl = '' } = ctx || {};
  const booking = ctx?.booking || {};
  const property = ctx?.property || {};
  const info = guestInfoOf(property);
  const name = firstName(booking.guest_name) || 'שלום';
  const hello = firstName(booking.guest_name) ? `שלום ${name},` : 'שלום,';
  const placeName = property.name || booking.property_name || 'המקום';
  const inPlace = withPrefix('ב', placeName);
  const toPlace = withPrefix('ל', placeName);
  const host = info.host_name || orgName || '';
  const sign = host ? `\n\n${host}` : '';
  const dates = `${formatDayHe(booking.check_in_date)} עד ${formatDayHe(booking.check_out_date)}`;
  const link = guestPageUrl(booking);
  const nav = navigationTarget(property);
  const bal = balance?.balance > 0 ? formatMoney(balance.balance) : '';

  switch (key) {
    case 'confirmation':
      return [
        hello,
        `ההזמנה שלכם ${inPlace} מאושרת.`,
        `תאריכים: ${dates}.`,
        `כניסה מ-${info.check_in_time}, יציאה עד ${info.check_out_time}.`,
        bal ? `יתרה לתשלום: ${bal}.` : '',
        link ? `כל הפרטים לשהייה, וצ'ק-אין קצר (טלפון ושעת הגעה), כאן: ${link}` : '',
        (info.closing_line || 'נשמח לארח אתכם.').trim(),
      ].filter(Boolean).join('\n') + sign;

    case 'arrival_eve':
      return [
        hello,
        `מחכים לכם מחר ${inPlace}. אפשר להגיע מ-${info.check_in_time}.`,
        nav ? `ניווט בוויז: ${wazeUrl(nav)}` : '',
        info.arrival_instructions ? `\n${info.arrival_instructions.trim()}` : '',
        info.wifi_name ? `\nוויי-פיי: ${info.wifi_name}${info.wifi_password ? `, סיסמה ${info.wifi_password}` : ''}` : '',
        bal ? `\nתזכורת: נותרה יתרה של ${bal}.` : '',
        link ? `\nכל הפרטים: ${link}` : '',
        'נסיעה טובה.',
      ].filter(Boolean).join('\n') + sign;

    case 'welcome':
      return [
        hello,
        `ברוכים הבאים ${toPlace}. מקווים שהגעתם בשלום.`,
        info.wifi_name ? `וויי-פיי: ${info.wifi_name}${info.wifi_password ? `, סיסמה ${info.wifi_password}` : ''}` : '',
        `יציאה ב${formatDayHe(booking.check_out_date)} עד ${info.check_out_time}.`,
        'אם חסר משהו, כתבו לנו כאן ונדאג לזה.',
        link ? `פרטי השהייה: ${link}` : '',
      ].filter(Boolean).join('\n') + sign;

    case 'thanks_review':
      return [
        hello,
        `תודה שהתארחתם ${inPlace}. היה לנו כיף לארח אתכם.`,
        reviewUrl
          ? `נשמח מאוד אם תכתבו כמה מילים על החוויה, זה לוקח דקה: ${reviewUrl}`
          : 'נשמח מאוד אם תכתבו כמה מילים על החוויה, זה עוזר לנו המון.',
        'מחכים לראות אתכם שוב.',
      ].join('\n') + sign;

    case 'balance_reminder':
      return [
        hello,
        `תזכורת קטנה לגבי ההזמנה ${inPlace} (${dates}).`,
        bal ? `נותרה יתרה של ${bal} לתשלום${balance?.dueDate ? ` עד ${formatDayHe(balance.dueDate)}` : ''}.` : 'נשמח להשלים את התשלום לפני ההגעה.',
        'אפשר להעביר בביט או בהעברה בנקאית, ונשלח קבלה.',
        'תודה.',
      ].join('\n') + sign;

    default:
      return hello;
  }
}

/**
 * Which template a booking needs today (null when none).
 * sentSubjects: Set of message_logs subjects already sent for this booking.
 */
export function dueTemplateFor(booking, sentSubjects = new Set(), today = todayISO()) {
  const ci = booking.check_in_date;
  const co = booking.check_out_date;
  const has = (k) => sentSubjects.has(logSubjectFor(k));
  if (!ci) return null;
  if (ci === today && !has('welcome')) return 'welcome';
  if (ci === addDays(today, 1) && !has('arrival_eve')) return 'arrival_eve';
  if (co && (co === today || co === addDays(today, -1)) && !has('thanks_review')) return 'thanks_review';
  const created = String(booking.created_at || booking.created_date || '').slice(0, 10);
  const freshlyBooked = created && created >= addDays(today, -7);
  if (ci > today && freshlyBooked && !has('confirmation') && ['CONFIRMED', 'APPROVED'].includes(booking.status)) return 'confirmation';
  return null;
}
