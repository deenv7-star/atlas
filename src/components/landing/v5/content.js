/**
 * Landing v5 copy + demo data (brand/direction-v5.md).
 * Palette discipline: white / #F7F8FB, indigo #3E2BF1 as the only strong accent, navy text,
 * amber only as a tiny "today" dot. No photos. No invented customer numbers or testimonials:
 * every number on the page is example data inside the product UI or a real price from pricing.js.
 */
export const WHATSAPP_URL = 'https://wa.me/972545380085';
export const PHONE_DISPLAY = '054-538-0085';
export const CTA_SIGNUP = '14 ימי ניסיון חינם';

export const CTA_NOTE = 'בלי כרטיס אשראי';

export const HERO = {
  title: ['יותר הזמנות.', 'אפס כפילויות.', 'כסף בזמן.'],
  sub: 'לוח אחד לכל הערוצים, וואטסאפ לאורחים שיוצא לבד ומקדמות שנגבות בזמן. בעברית.',
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
    'הודעות שיוצאות לבד, בזמן',
    'מקדמה עם ההזמנה, תזכורת ליתרה',
    'דוח הכנסות בלחיצה',
  ],
};

export const TRUST = [
  { key: 'secure', text: 'מידע מוצפן ומאובטח' },
  { key: 'backup', text: 'גיבוי אוטומטי' },
  { key: 'support', text: 'תמיכה בעברית, בוואטסאפ' },
  { key: 'cancel', text: 'ביטול בכל עת' },
];

export const FAQ = [
  // Kept consistent with supabase/functions/support-chat/kb (05-channels, 06-whatsapp-messages, 07-money, 13-limitations).
  // When feat/real-core (iCal import every 15 min + export, automation queue) reaches main, update the first two answers.
  { q: 'זה עובד עם Airbnb ו-Booking.com?', a: 'כל ההזמנות, מ-Airbnb, מ-Booking.com ומהטלפון, נמצאות בלוח אחד עם צבע לכל ערוץ, ו-ATLAS מתריעה לפני ששומרים הזמנה שחופפת לתאריכים תפוסים. את קישור היומן (iCal) של כל יחידה שומרים פעם אחת במסך הערוצים. בכנות: משיכה אוטומטית של ההזמנות מהקישור עוד בפיתוח, ובינתיים הזמנה מערוץ נרשמת בלוח בלחיצה.' },
  { q: 'איך עובדות ההודעות בוואטסאפ?', a: 'בוחרים תבנית (אישור הזמנה, הוראות הגעה, תזכורת תשלום, בקשה לביקורת), ו-ATLAS ממלאת את הפרטים של האורח. לוחצים, והוואטסאפ שלכם נפתח עם הודעה מוכנה. שליחה אוטומטית בלי לחיצה עוד לא פעילה.' },
  { q: 'אפשר להפיק חשבוניות ודוחות?', a: 'כל תשלום נרשם, ובסוף החודש מורידים דוח הכנסות לפי ערוץ ב-CSV (נפתח באקסל) או ב-PDF לרואה החשבון. המסמכים ב-ATLAS הם לתיעוד ומעקב; חשבונית מס רשמית מפיקים בתוכנת החשבוניות שלכם.' },
  { q: 'קשה לעבור ממה שיש לי היום?', a: 'לא. מוסיפים יחידות והזמנות קרובות בכמה דקות, ואם יש לכם הרבה נתונים, כותבים לנו בוואטסאפ ונעזור להעביר אותם.' },
  { q: 'אני לא חזק בטכנולוגיה. זה בשבילי?', a: 'כן. הכל בעברית, כל מסך עושה דבר אחד, ויש בן אדם שעונה בוואטסאפ.' },
  { q: 'מה קורה בסוף 14 הימים?', a: 'בוחרים חבילה לפי מספר המתחמים. לא בחרתם? לא מחויבים לכלום, ואין כרטיס אשראי לחייב.' },
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
    meta: 'נשלח אוטומטית · יום לפני ההגעה',
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
