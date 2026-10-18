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
 * Landing FAQ (18.10.2026, Deen: "השאלות תשובות לא צריכות להתעסק בדברים טכנים. הם אמורות לשכנע את הלקוח
 * להרשם, להסביר לו כמה זה פשוט, למה זה משנה חיים, כמה זה אמין ונוח").
 * Sales FAQ in the owner's voice: benefit first, 1-3 short sentences, zero jargon.
 * Every line is true today, checked against supabase/functions/support-chat/kb/curated (01, 05, 06, 11, 13, 15),
 * src/site/content/pages (terms, cancellation, privacy, security) and src/config/pricing.js.
 * Never add numbers, customer counts, reviews or time-savings stats. ATLAS does not issue tax invoices,
 * does not charge guests and does not send WhatsApp without the owner's tap: do not promise any of these.
 * tests/unit/landing-faq.test.mjs guards the rules.
 */
const FROM_PRICE = PRICING_PLANS[0].price;
export const FAQ = [
  { q: 'כמה זמן זה באמת יחסוך לי?', a: 'את הזמן שהולך היום על עדכון כמה יומנים, הקלדה של אותן הודעות לאורחים ובדיקה מי עוד לא שילם. כל בוקר מחכה לכם מסך אחד עם מה שיש לעשות היום, ואתם רק מאשרים.' },
  { q: 'אפסיק לפספס הזמנות ולהיתקע עם הזמנה כפולה?', a: 'הזמנות מ-Airbnb ומ-Booking.com נכנסות לבד ללוח אחד, יחד עם ההזמנות הישירות שלכם. המערכת לא נותנת לשמור שתי הזמנות על אותם לילות, ואם משהו מתנגש היא מסמנת לכם את זה ולא דורסת אף הזמנה.' },
  { q: 'כמה זמן לוקח עד שזה עובד?', a: 'בערך עשר דקות. עונים על כמה שאלות פשוטות על המקום והיחידות, מחברים את Airbnb ו-Booking.com פעם אחת, והתאריכים התפוסים כבר מופיעים בלוח.' },
  { q: 'אני לא חזק בטכנולוגיה. אסתדר?', a: 'כן. הכל בעברית, כל מסך עושה דבר אחד, ובהתחלה המערכת שואלת שאלה אחת בכל פעם. ואם נתקעתם, בן אדם אמיתי עונה לכם בוואטסאפ ועוזר גם להעביר את מה שיש לכם היום.' },
  { q: 'אפשר לנהל הכל מהטלפון?', a: 'כן. ATLAS עובדת בטלפון כמו במחשב, ישר מהדפדפן, בלי להוריד אפליקציה. מוסיפים אותה למסך הבית ופותחים בלחיצה, מכל מקום.' },
  { q: 'האורחים שלי ירגישו את ההבדל?', a: 'כן. כל אורח מקבל בוואטסאפ, בזמן הנכון, אישור הזמנה, הוראות הגעה יום לפני והודעת תודה, עם השם שלו והניווט אליכם. ההודעות מוכנות מראש ויוצאות מהמספר שלכם בלחיצה אחת, ובשבת המערכת שומרת על שקט.' },
  { q: 'המידע שלי ושל האורחים שמור?', a: 'כן. כל עסק רואה רק את המידע שלו, החיבור מוצפן, ואנחנו לא מוכרים מידע ולא מציגים פרסומות. הנתונים שייכים לכם, ואפשר להוריד אותם בכל רגע.' },
  { q: 'כמה זה עולה, ויש התחייבות?', a: `14 הימים הראשונים חינם, בלי כרטיס אשראי, ובסופם לא יורד שקל לבד. אחר כך מ-‏₪${FROM_PRICE} לחודש למתחם אחד, בלי התחייבות: מפסיקים בהודעה אחת בוואטסאפ.` },
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
