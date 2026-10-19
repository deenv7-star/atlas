/**
 * Landing v5 copy + demo data (brand/direction-v5.md).
 * Palette discipline: white / #F7F8FB, indigo #3E2BF1 as the only strong accent, navy text,
 * amber only as a tiny "today" dot. No photos. No invented customer numbers or testimonials:
 * every number on the page is example data inside the product UI or a real price from pricing.js.
 */
import { PRICING_PLANS } from '../../../config/pricing.js';

export const WHATSAPP_URL = 'https://wa.me/972525979520';
export const PHONE_DISPLAY = '052-597-9520';
export const CTA_SIGNUP = '14 ימי ניסיון חינם';

export const CTA_NOTE = 'בלי כרטיס אשראי';

export const HERO = {
  title: ['יותר הזמנות.', 'אפס כפילויות.', 'כל שקל במעקב.'],
  sub: 'לוח אחד לכל הערוצים, וואטסאפ לאורחים שמוכן מראש ונשלח בלחיצה, ומעקב מקדמות ויתרות. בעברית.',
};

export const STEPS = [
  { title: 'נרשמים', line: 'שם, טלפון ומספר יחידות. בלי כרטיס אשראי.', time: '2 דק׳' },
  { title: 'מחברים ערוצים', line: 'מדביקים קישור יומן מ-Airbnb ומ-Booking.com, פעם אחת.', time: '5 דק׳' },
  { title: 'מפעילים הודעות', line: 'בוחרים אילו הודעות יוצאות לאורחים, ומתי.', time: '3 דק׳' },
];

export const BEFORE_AFTER = {
  before: [
    'מעדכנים כמה יומנים ידנית',
    'עונים לאותן שאלות בוואטסאפ',
    'רודפים אחרי יתרות',
    'בונים אקסל לרואה החשבון',
  ],
  after: [
    'לוח אחד שמתעדכן לבד',
    'הודעות שמוכנות בזמן, נשלחות בלחיצה',
    'מעקב מקדמות, תזכורת ליתרה',
    'דוח הכנסות בלחיצה',
  ],
};

export const TRUST = [
  { key: 'secure', text: 'מידע מוצפן ומאובטח' },
  { key: 'backup', text: 'ייצוא הנתונים בכל רגע' }, // was 'גיבוי אוטומטי': PITR is off and no backups are listed (18.10.2026)
  { key: 'support', text: 'תמיכה בעברית, בוואטסאפ' },
  { key: 'cancel', text: 'ביטול בכל עת' },
];

/**
 * Landing FAQ v2 (19.10.2026). Deen: "שאלות קצת יותר רלוונטיות". Written for Israeli zimmer / villa / vacation-complex
 * owners (non-technical, often older): the questions they actually ask before signing up, in their words.
 * Benefit first, 1-3 short sentences, zero jargon. Every line is true today, checked against the code and
 * supabase/functions/support-chat/kb/curated (01 setup, 02 units, 04 overlap guard, 05 channels, 06 WhatsApp,
 * 07 money, 11 subscription, 13 limitations), src/config/pricing.js and the legal pages.
 * Honest limits kept on purpose: WhatsApp goes out with one tap (never auto-send), ATLAS records payments but does
 * not charge guests, and official tax invoices are still issued in the owner's own invoicing software.
 * No numbers, customer counts, reviews or time-savings stats. tests/unit/landing-faq.test.mjs guards the rules.
 */
const FROM_PRICE = PRICING_PLANS[0].price;
export const FAQ = [
  // 05-channels (two-way calendar link, import every 15 min), BookingOverlapGuard (same unit, same nights: warns and asks for an explicit 'save anyway')
  { q: 'זה עובד עם Booking ו-Airbnb? לא יהיו לי הזמנות כפולות?', a: 'כן, התאריכים התפוסים מ-Booking.com ומ-Airbnb נכנסים לבד ללוח אחד, יחד עם ההזמנות הישירות שלכם. מנסים לרשום הזמנה על לילות תפוסים? המערכת עוצרת ומתריעה לפני ששומרים, ואף הזמנה לא נדרסת.' },
  // 01-getting-started (one question per screen, about five minutes), 15-support (a person on WhatsApp)
  { q: 'קשה להתחיל? מישהו יעזור לי?', a: `לא קשה: המערכת שואלת שאלה אחת בכל פעם, בעברית פשוטה, ותוך כמה דקות הלוח שלכם מוכן. נתקעתם? בן אדם אמיתי עונה לכם בוואטסאפ ב-${PHONE_DISPLAY} ועוזר גם להעביר את מה שיש לכם היום.` },
  // 06-whatsapp-messages (guest journey prepared on schedule, one tap from the owner's own WhatsApp, Shabbat quiet), 13 #2
  { q: 'ההודעות לאורחים בוואטסאפ יוצאות לבד?', a: 'כמעט: אישור הזמנה, הוראות הגעה יום לפני והודעת תודה מוכנות לבד בזמן הנכון, עם השם של האורח והניווט אליכם. אתם רק מאשרים, והן יוצאות מהוואטסאפ שלכם בלחיצה אחת, ובשבת המערכת שומרת על שקט.' },
  // 02-units (name, guests and nightly price per unit; another total per booking), 13 #9 (weekend/holiday price suggestions)
  { q: 'יש לי כמה יחידות, כל אחת במחיר אחר. זה מתאים?', a: 'בדיוק בשביל זה. לכל יחידה יש שורה בלוח, מספר אורחים ומחיר משלה, ובכל הזמנה אפשר לרשום מחיר אחר. המערכת גם מציעה לכם מחיר לסופ״ש ולחגים.' },
  // 01-getting-started #install (works in the browser, add to home screen), 13 #13 (no store app)
  { q: 'זה עובד גם בטלפון?', a: 'כן. ATLAS עובדת בטלפון כמו במחשב, בלי להוריד אפליקציה מהחנות. מוסיפים אותה למסך הבית ופותחים בלחיצה, מכל מקום.' },
  // 07-money (payments recorded, balances, monthly report; documents are for records only, no tax allocation number), 13 #5 #11
  { q: 'אפשר להוציא קבלות וחשבוניות?', a: 'כל תשלום נרשם, ורואים מיד מי שילם ומה עוד פתוח. חשבונית מס רשמית עדיין מפיקים בתוכנת החשבוניות שלכם, והחיבור אליה בדרך. בסוף החודש מורידים דוח מסודר לרואה החשבון.' },
  // security.md (isolation per business, encrypted connection), privacy.md (no selling, no ads), terms #your-data + csvExport.js
  { q: 'המידע שלי ושל האורחים שמור?', a: 'כן. כל עסק רואה רק את המידע שלו, החיבור מוצפן, ואנחנו לא מוכרים מידע ולא מציגים פרסומות. הנתונים שייכים לכם, ואפשר להוריד אותם לאקסל בכל רגע.' },
  // pricing.js PRICING_PLANS[0] (one complex, whole system included); yearly and multi-complex plans shown in #pricing
  { q: 'כמה זה עולה?', a: `₪${FROM_PRICE} לחודש למתחם אחד, וכל המערכת כלולה. יש גם מסלול שנתי משתלם יותר ומסלול לכמה מתחמים, הכל מופיע למעלה במחירים.` },
  // 11-subscription (no card, no automatic charge, account and data kept), terms #cancellation, cancellation.md #how
  { q: 'ומה קורה אחרי 14 ימי הניסיון?', a: '14 הימים הראשונים חינם, בלי כרטיס אשראי, ובסופם לא יורד שקל לבד. ממשיכים רק אם בוחרים מסלול, והחשבון וכל הנתונים נשמרים. בלי התחייבות: מפסיקים בהודעה אחת בוואטסאפ.' },
];

/** Example data shown inside the HTML/CSS product UI. */
export const DEMO = {
  units: ['סוויטת האלון', 'בקתת הזית', 'וילה התאנה', 'סטודיו הגפן'],
  unitsShort: ['האלון', 'הזית', 'התאנה', 'הגפן'],
  days: [
    { d: 'ה׳', n: 15 }, { d: 'ו׳', n: 16 }, { d: 'ש׳', n: 17 }, { d: 'א׳', n: 18 }, { d: 'ב׳', n: 19 },
    { d: 'ג׳', n: 20 }, { d: 'ד׳', n: 21 }, { d: 'ה׳', n: 22 }, { d: 'ו׳', n: 23 }, { d: 'ש׳', n: 24 },
  ],
  today: 1,
  /** [unit, startDay, nights, channel, guest] */
  bars: [
    [0, 0, 2, 'airbnb', 'מיכל ר.'], [0, 3, 3, 'direct', 'אבי כ.'], [0, 7, 3, 'booking', 'Anna S.'],
    [1, 1, 3, 'booking', 'Jonas M.'], [1, 5, 2, 'direct', 'נועה ל.'], [1, 8, 2, 'airbnb', 'שירן ג.'],
    [2, 0, 2, 'direct', 'דנה א.'], [2, 2, 4, 'airbnb', 'יוסי ב.'], [2, 7, 3, 'direct', 'רותם ש.'],
    [3, 0, 3, 'booking', 'Marc D.'], [3, 4, 2, 'direct', 'גל פ.'],
  ],
  /** The booking that "arrives" live in the hero animation. */
  incoming: [3, 6, 3, 'booking', 'Elena V.'],
  revenue: 48250,
  revenueDelta: '+18%',
  revenueSeries: [22, 26, 24, 31, 29, 35, 38, 36, 42, 45, 44, 52],
  months: ['נוב׳', 'דצמ׳', 'ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳'],
  wa: {
    guest: 'נועה לוי',
    unit: 'בקתת הזית',
    out: 'היי נועה, מחכים לכם ביום ב׳ מ-15:00. הקוד לדלת: 4821. הדרכה לחניה מצורפת.',
    in: 'תודה! נגיע בסביבות 16:00',
    meta: 'הוכן מראש · יום לפני ההגעה',
  },
  todayBoard: [
    { kind: 'in', title: 'נועה לוי', sub: 'הזית · 2 לילות', time: '15:00', status: 'שולם' },
    { kind: 'in', title: 'אבי כהן', sub: 'האלון · 3 לילות', time: '16:00', status: 'יתרה ‏₪900' },
    { kind: 'out', title: 'מיכל רז', sub: 'סוויטת האלון', time: '11:00', status: 'יצאה' },
    { kind: 'clean', title: 'ניקיון', sub: 'סוויטת האלון · אחרי יציאה', time: '12:00', status: 'שובץ' },
  ],
  payments: [
    { who: 'נועה לוי', what: 'מקדמה 30%', amount: 750, state: 'paid' },
    { who: 'אבי כהן', what: 'יתרה', amount: 900, state: 'due' },
    { who: 'Jonas M.', what: 'Booking.com', amount: 2140, state: 'paid' },
  ],
};

export const CHANNEL_LABEL = { airbnb: 'Airbnb', booking: 'Booking.com', direct: 'ישיר' };
