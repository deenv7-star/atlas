/**
 * The integrations hub catalog: every connection relevant to an Israeli zimmer / complex owner, with an honest
 * status. Source of truth for the claims: qa/integrations/CATALOG.md (05.11.2026, with sources).
 *
 *   flow:
 *     'ical'        connect a calendar link (any iCal site). Opens the existing ConnectWizard with this site's guide.
 *     'ical-export' atlas's own link into another calendar (Google / Apple / Outlook).
 *     'apikey'      the owner's own API key for an invoicing app (Morning / iCount). Needs the `integrations`
 *                   edge function + migration 038 (not deployed): until INTEGRATIONS_V1 is on, shown as "בקרוב".
 *     'webhook'     outgoing webhook to Zapier / Make / n8n (same gate).
 *     'link'        a screen in atlas that already does it (accountant export).
 *     'builtin'     already part of atlas, nothing to connect (WhatsApp one tap).
 *     'request'     not built yet: explain honestly + "בקשו חיבור" (records a request in contact_messages).
 *
 *   status (base): 'live' works today · 'ready' can be connected now · 'soon' needs a server step Deen approves
 *                  · 'meta' waits on Meta app review · 'request' built on demand.
 */
import { isSupabaseConfigured } from '@/api/supabaseClient';

/** Invoices with the owner's key + outgoing webhooks: on in the demo (to review the flow), on in production
 *  only after the edge function `integrations` is deployed and migration 038 applied (VITE_INTEGRATIONS_V1=1). */
export const INTEGRATIONS_V1 = !isSupabaseConfigured || String(import.meta.env.VITE_INTEGRATIONS_V1 || '') === '1';

export const CATEGORIES = [
  { id: 'calendars', label: 'יומנים וערוצים', short: 'יומנים' },
  { id: 'messages', label: 'הודעות מאורחים', short: 'הודעות' },
  { id: 'invoices', label: 'קבלות וחשבוניות', short: 'חשבוניות' },
  { id: 'payments', label: 'תשלומים', short: 'תשלומים' },
  { id: 'automation', label: 'אוטומציות', short: 'אוטומציות' },
  { id: 'more', label: 'עוד', short: 'עוד' },
];

/** Site-specific steps for the iCal wizard (shown instead of the generic "other site" steps). */
export const ICAL_SITES = {
  vrbo: {
    name: 'Vrbo', provider: 'ICAL',
    open: 'https://www.vrbo.com/p/calendar',
    copy: { title: 'מעתיקים קישור מ-Vrbo', steps: ['היכנסו ל-Vrbo ופתחו את לוח השנה (Calendar).', 'לחצו "הגדרות" ← "זמינות" (Availability).', 'לחצו "חיבור יומנים" (Connect calendars) ← "ייצוא יומן" (Export calendar).', 'לחצו "העתקת קישור" (Copy URL).'] },
    back: ['באותו חלון ב-Vrbo בחרו "ניהול יומנים מיובאים" (Manage imported calendars).', 'לחצו "ייבוא יומן" (Import a calendar), הדביקו את הקישור, ובשם כתבו atlas.'],
    pullsEvery: 'בקצב של Vrbo',
    note: 'עובד רק כשמנהלים את הנכס ישירות ב-Vrbo, לא דרך מערכת ניהול אחרת.',
  },
  expedia: {
    name: 'Expedia', provider: 'ICAL',
    open: 'https://apps.expediapartnercentral.com/',
    copy: { title: 'מעתיקים קישור מ-Expedia', steps: ['היכנסו לאתר של Expedia לבעלי נכסים (Partner Central).', 'פתחו "חדרים ותעריפים" ← "חיבור יומנים" (Connect calendars).', 'בחרו את היחידה.', 'לחצו "יצירת קישור" (Create link) ואז "העתקה" (Copy link).'] },
    back: ['באותו מסך ב-Expedia בחרו להוסיף יומן קיים.', 'הדביקו את הקישור של atlas ושמרו.'],
    pullsEvery: 'בקצב של Expedia',
    note: 'Expedia מציגה חיבור יומנים בעיקר לנכסי נופש קטנים. אם אין אצלכם "חיבור יומנים", כתבו לנו ונבדוק.',
  },
  google: {
    name: 'Google Calendar', provider: 'GOOGLE',
    open: 'https://calendar.google.com/calendar/r/settings',
    copy: { title: 'מעתיקים קישור מ-Google', steps: ['במחשב, פתחו את Google Calendar ולחצו על גלגל ההגדרות.', 'בצד, בחרו את היומן שאתם רוצים לחבר.', 'גללו עד "שילוב יומן".', 'העתיקו את השורה "כתובת סודית בפורמט iCal" (כך Google קורא לה).'] },
    back: null,
    pullsEvery: '',
    note: 'כל אירוע ביומן הזה יחסום את התאריכים ביחידה. חברו יומן שמיועד רק להזמנות.',
  },
  other: {
    name: 'אתר אחר', provider: 'ICAL',
    open: '',
    copy: null, back: null, pullsEvery: 'בקצב של האתר', note: '',
  },
};

export const INTEGRATIONS = [
  // ── calendars ─────────────────────────────────────────────────────────────
  { id: 'airbnb', name: 'Airbnb', cat: 'calendars', brand: 'AIRBNB', flow: 'ical', channel: 'AIRBNB', status: 'ready',
    gain: 'הזמנות מ-Airbnb ייכנסו ליומן שלכם לבד, ותאריכים תפוסים ייסגרו שם', keywords: 'airbnb אייר בי אנד בי' },
  { id: 'booking', name: 'Booking.com', cat: 'calendars', brand: 'BOOKING', flow: 'ical', channel: 'BOOKING_COM', status: 'ready',
    gain: 'הזמנות מ-Booking ייכנסו ליומן שלכם לבד, ותאריכים תפוסים ייסגרו שם', keywords: 'booking בוקינג' },
  { id: 'vrbo', name: 'Vrbo', cat: 'calendars', brand: null, flow: 'ical', channel: 'ICAL', site: 'vrbo', status: 'ready',
    gain: 'הזמנות מ-Vrbo ייכנסו ליומן שלכם, ותאריכים תפוסים ייסגרו שם', keywords: 'vrbo homeaway' },
  { id: 'expedia', name: 'Expedia', cat: 'calendars', brand: 'EXPEDIA', flow: 'ical', channel: 'ICAL', site: 'expedia', status: 'ready',
    gain: 'הזמנות מ-Expedia ייכנסו ליומן שלכם, ותאריכים תפוסים ייסגרו שם', keywords: 'expedia אקספדיה' },
  { id: 'gcal-in', name: 'Google Calendar', cat: 'calendars', brand: 'GCAL', flow: 'ical', channel: 'ICAL', site: 'google', status: 'ready',
    gain: 'מה שרשום ביומן Google שלכם ייסגר אוטומטית ביומן של atlas', sub: 'ייבוא ליומן של atlas', keywords: 'google גוגל יומן calendar' },
  { id: 'gcal-out', name: 'היומן של atlas בטלפון', cat: 'calendars', brand: 'GCAL', flow: 'ical-export', status: 'ready',
    gain: 'תראו את כל ההזמנות ביומן של הטלפון, והוא יתעדכן לבד', sub: 'ייצוא מ-atlas', keywords: 'google apple outlook iphone ייצוא יומן טלפון' },
  { id: 'ical-any', name: 'אתר צימרים או יומן אחר', cat: 'calendars', brand: null, mono: 'יומן', flow: 'ical', channel: 'ICAL', site: 'other', status: 'ready',
    gain: 'אם האתר נותן קישור ליומן, ההזמנות ממנו ייכנסו ליומן שלכם', keywords: 'ical ics צימר 360 zimmer אתר יומן אחר' },
  { id: 'channel-manager', name: 'עדכון מחירים בכל הערוצים', cat: 'calendars', brand: null, mono: '₪', flow: 'request', status: 'request',
    gain: 'משנים מחיר פעם אחת, והוא מתעדכן ב-Booking וב-Airbnb',
    why: 'Booking ו-Airbnb פותחים את זה רק לחברות שהם אישרו. מה שכבר עובד היום: הזמנות ותאריכים תפוסים עוברים בין הערוצים, כך שאין הזמנות כפולות.',
    keywords: 'channel manager api מחירים' },

  // ── messages ──────────────────────────────────────────────────────────────
  { id: 'wa-tap', name: 'WhatsApp בלחיצה', cat: 'messages', brand: 'WHATSAPP', flow: 'builtin', status: 'live',
    gain: 'atlas מכין את ההודעה לאורח, ואתם שולחים בלחיצה אחת', keywords: 'whatsapp וואטסאפ',
    why: 'כבר פעיל: בלוח "היום" כל הודעה מוכנה נפתחת ב-WhatsApp שלכם עם הטקסט. לא צריך לחבר כלום.' },
  { id: 'wa-business', name: 'WhatsApp Business', cat: 'messages', brand: 'WHATSAPP', flow: 'request', status: 'meta',
    gain: 'הודעות מאורחים יופיעו ב-atlas, ותענו מכאן מאותו מספר', keywords: 'whatsapp business וואטסאפ עסקי api',
    why: 'תמשיכו להשתמש באפליקציית WhatsApp Business באותו מספר, ו-atlas יקבל וישלח לצידה. עובד רק עם WhatsApp Business, לא עם WhatsApp רגיל. נפתח אחרי אישור של Meta.' },
  { id: 'messenger', name: 'Messenger', cat: 'messages', brand: 'MESSENGER', flow: 'request', status: 'meta',
    gain: 'הודעות לדף הפייסבוק יופיעו ב-atlas, ותענו מכאן', keywords: 'messenger פייסבוק facebook מסנג׳ר',
    why: 'צריך דף פייסבוק של העסק. נפתח אחרי אישור של Meta.' },
  { id: 'instagram', name: 'Instagram', cat: 'messages', brand: 'INSTAGRAM', flow: 'request', status: 'meta',
    gain: 'הודעות מאינסטגרם יופיעו ב-atlas, ותענו מכאן', keywords: 'instagram אינסטגרם dm',
    why: 'צריך חשבון אינסטגרם עסקי. נפתח אחרי אישור של Meta.' },
  { id: 'email-in', name: 'מייל', cat: 'messages', brand: 'GMAIL', flow: 'request', status: 'request',
    gain: 'מיילים מאורחים יופיעו ב-atlas ליד שאר ההודעות', keywords: 'email gmail מייל דואר',
    why: 'היום "שליחה במייל" פותחת את תוכנת המייל שלכם עם הטקסט מוכן. קבלת מיילים לתוך atlas נבנית לפי בקשה.' },
  { id: 'sms', name: 'SMS', cat: 'messages', brand: null, mono: 'SMS', flow: 'request', status: 'request',
    gain: 'הודעה רגילה לטלפון, לאורחים שאין להם WhatsApp', keywords: 'sms מסרון 019 inforu',
    why: 'צריך חבילת הודעות בתשלום אצל חברת SMS. ספרו לנו אם זה חשוב לכם.' },
  { id: 'ota-messages', name: 'הודעות מ-Booking ו-Airbnb', cat: 'messages', brand: null, mono: 'צ׳אט', flow: 'request', status: 'request',
    gain: 'השיחות עם האורחים מהאתרים יופיעו ב-atlas', keywords: 'booking airbnb הודעות צאט',
    why: 'Booking ו-Airbnb פותחים את השיחות רק לחברות שהם אישרו. עד אז עונים באפליקציה שלהם.' },

  // ── invoices ──────────────────────────────────────────────────────────────
  { id: 'morning', name: 'מורנינג (חשבונית ירוקה)', cat: 'invoices', brand: null, mono: 'מורנינג', flow: 'apikey', status: 'soon',
    gain: 'בלחיצה אחת תצא קבלה לאורח, ישר מהתוכנה שלכם', keywords: 'morning green invoice חשבונית ירוקה מורנינג' },
  { id: 'icount', name: 'iCount', cat: 'invoices', brand: null, mono: 'iCount', flow: 'apikey', status: 'soon',
    gain: 'בלחיצה אחת תצא קבלה לאורח, ישר מהתוכנה שלכם', keywords: 'icount אייקאונט' },
  { id: 'ezcount', name: 'EZcount', cat: 'invoices', brand: null, mono: 'EZcount', flow: 'request', status: 'request', gain: 'בלחיצה אחת תצא קבלה לאורח, ישר מהתוכנה שלכם', keywords: 'ezcount איזיקאונט',
    why: 'אפשר לחבר אותה. ספרו לנו שאתם עובדים איתה, ונוסיף אותה.' },
  { id: 'rivhit', name: 'ריווחית', cat: 'invoices', brand: null, mono: 'ריווחית', flow: 'request', status: 'request', gain: 'בלחיצה אחת תצא קבלה לאורח, ישר מהתוכנה שלכם', keywords: 'rivhit ריווחית',
    why: 'אפשר לחבר אותה. ספרו לנו שאתם עובדים איתה, ונוסיף אותה.' },
  { id: 'invoice4u', name: 'Invoice4U', cat: 'invoices', brand: null, mono: 'I4U', flow: 'request', status: 'request', gain: 'בלחיצה אחת תצא קבלה לאורח, ישר מהתוכנה שלכם', keywords: 'invoice4u',
    why: 'אפשר לחבר אותה. ספרו לנו שאתם עובדים איתה, ונוסיף אותה.' },
  { id: 'sumit', name: 'SUMIT', cat: 'invoices', brand: null, mono: 'SUMIT', flow: 'request', status: 'request', gain: 'בלחיצה אחת תצא קבלה לאורח, ישר מהתוכנה שלכם', keywords: 'sumit סאמיט officeguy',
    why: 'אפשר לחבר אותה. ספרו לנו שאתם עובדים איתה, ונוסיף אותה.' },
  { id: 'accountant', name: 'דוח לרואה החשבון', cat: 'invoices', brand: null, mono: 'דוח', flow: 'link', to: '/MonthlyReport', status: 'live',
    gain: 'קובץ אקסל עם ההכנסות וההוצאות של החודש, מוכן לשליחה', keywords: 'רואה חשבון csv excel אקסל דוח חשבשבת' },

  // ── payments ──────────────────────────────────────────────────────────────
  { id: 'payments-log', name: 'מקדמות ויתרות', cat: 'payments', brand: null, mono: '₪', flow: 'link', to: '/Balances', status: 'live',
    gain: 'רואים מה שולם ומה עוד פתוח בכל הזמנה', keywords: 'תשלומים מקדמה יתרה' },
  { id: 'grow', name: 'Grow (משולם)', cat: 'payments', brand: null, mono: 'Grow', flow: 'request', status: 'request', gain: 'האורח ישלם מקדמה בקישור, וההזמנה תסומן ששולמה', keywords: 'grow meshulam משולם bit ביט',
    why: 'צריך חשבון סליקה על שם העסק שלכם. ספרו לנו, ונחבר.' },
  { id: 'payplus', name: 'PayPlus', cat: 'payments', brand: null, mono: 'PayPlus', flow: 'request', status: 'request', gain: 'האורח ישלם מקדמה בקישור, וההזמנה תסומן ששולמה', keywords: 'payplus פיי פלוס',
    why: 'צריך חשבון סליקה על שם העסק שלכם. ספרו לנו, ונחבר.' },
  { id: 'cardcom', name: 'Cardcom', cat: 'payments', brand: null, mono: 'Cardcom', flow: 'request', status: 'request', gain: 'האורח ישלם מקדמה בקישור, וההזמנה תסומן ששולמה', keywords: 'cardcom קארדקום',
    why: 'צריך חשבון סליקה על שם העסק שלכם. ספרו לנו, ונחבר.' },
  { id: 'tranzila', name: 'Tranzila', cat: 'payments', brand: null, mono: 'Tranzila', flow: 'request', status: 'request', gain: 'האורח ישלם מקדמה בקישור, וההזמנה תסומן ששולמה', keywords: 'tranzila טרנזילה',
    why: 'צריך חשבון סליקה על שם העסק שלכם. ספרו לנו, ונחבר.' },

  // ── automation ────────────────────────────────────────────────────────────
  { id: 'zapier', name: 'Zapier', cat: 'automation', brand: 'ZAPIER', flow: 'webhook', status: 'soon', gain: 'כל הזמנה חדשה תעבור לתוכנות אחרות שאתם עובדים איתן', keywords: 'zapier זאפייר webhook' },
  { id: 'make', name: 'Make', cat: 'automation', brand: 'MAKE', flow: 'webhook', status: 'soon', gain: 'כל הזמנה חדשה תעבור לתוכנות אחרות שאתם עובדים איתן', keywords: 'make integromat webhook' },
  { id: 'n8n', name: 'n8n', cat: 'automation', brand: 'N8N', flow: 'webhook', status: 'soon', gain: 'כל הזמנה חדשה תעבור לתוכנות אחרות שאתם עובדים איתן', keywords: 'n8n webhook' },
  { id: 'sheets', name: 'Google Sheets', cat: 'automation', brand: null, mono: 'גיליון', flow: 'request', status: 'request', gain: 'כל הזמנה חדשה תיכנס כשורה בגיליון שלכם', keywords: 'google sheets גיליון אקסל',
    why: 'יהיה אפשר דרך Zapier או Make כשהחיבור שלהם ייפתח. ספרו לנו אם אתם צריכים את זה.' },

  // ── more ──────────────────────────────────────────────────────────────────
  { id: 'locks', name: 'מנעול חכם', cat: 'more', brand: null, mono: 'מנעול', flow: 'request', status: 'request', gain: 'כל אורח יקבל קוד כניסה משלו, שפג אחרי העזיבה', keywords: 'nuki ttlock igloo מנעול קוד',
    why: 'Nuki, TTLock ו-igloohome פתוחים לחיבור. ספרו לנו איזה מנעול יש לכם.' },
  { id: 'google-reviews', name: 'ביקורות Google', cat: 'more', brand: null, mono: 'G', flow: 'request', status: 'request', gain: 'הביקורות שלכם בגוגל יופיעו ב-atlas', keywords: 'google reviews ביקורות',
    why: 'כבר היום atlas מכין לאורח בקשה לכתוב ביקורת, עם קישור. כדי להציג את הביקורות כאן צריך אישור מ-Google.' },
];

/** Status shown on a tile. `connected` = this org has at least one live link for it. */
export function statusOf(item, { connected = false } = {}) {
  if (connected) return 'connected';
  if ((item.flow === 'apikey' || item.flow === 'webhook') && INTEGRATIONS_V1) return 'ready';
  return item.status;
}

export const STATUS_LABEL = {
  connected: 'מחובר',
  live: 'פעיל',
  ready: 'חברו עכשיו',
  soon: 'בקרוב',
  meta: 'בקרוב',
  request: 'לפי בקשה',
};

/** Hebrew-friendly search: name, gain, keywords; tolerant to case and to final letters. */
export function matches(item, q) {
  const n = (s) => String(s || '').toLowerCase().replace(/[ךםןףץ]/g, (c) => ({ ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' }[c]));
  const query = n(q).trim();
  if (!query) return true;
  const hay = n(`${item.name} ${item.gain} ${item.sub || ''} ${item.keywords || ''}`);
  return query.split(/\s+/).every((w) => hay.includes(w));
}
