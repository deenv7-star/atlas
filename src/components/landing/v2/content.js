/**
 * Landing v2 content. Single place for copy, contact details and the screenshot manifest.
 *
 * Screenshots are REAL captures of the ATLAS app in local demo mode (seeded demo complex
 * "נופי הגליל"). They live in /public/landing/screens/{desktop,mobile,crops}/ and are
 * referenced only from SCREENS / CROPS below, so refreshing them after the app redesign
 * means re-running scripts/landing-screens (see README there) and nothing else.
 */
import {
  CalendarRange, RefreshCw, ClipboardList, IdCard, Users, MessageCircle, Workflow, Route,
  DoorOpen, Wallet, Receipt, TrendingDown, LineChart, FileBarChart, Tags, SprayCan, Wrench,
  FileSignature, Star, Sparkles, Download, Moon, Search, Link2,
  ShieldCheck, History, HardDriveDownload, EyeOff, Headset,
} from 'lucide-react';

export const WHATSAPP_NUMBER = '972545380085';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const PHONE_DISPLAY = '054-538-0085';
export const PHONE_TEL = 'tel:+972545380085';
export const SUPPORT_EMAIL = 'support@atlas-app.co.il';

// One label per intent, used everywhere on the page.
export const CTA_SIGNUP = '14 ימי ניסיון חינם';
export const CTA_CONTACT = 'דברו איתנו';

const S = '/landing/screens';

/** Hero / showcase rotation. desktop = laptop screen (1760x1100), mobile = phone screen (780x1688). */
export const SCREENS = [
  { key: 'calendar', label: 'לוח שנה', desktop: `${S}/desktop/calendar.webp`, mobile: `${S}/mobile/calendar.webp`, alt: 'לוח השנה של ATLAS: ארבע יחידות, הזמנות מ-Booking.com, Airbnb והזמנות ישירות על ציר אחד' },
  { key: 'dashboard', label: 'דשבורד', desktop: `${S}/desktop/dashboard.webp`, mobile: `${S}/mobile/dashboard.webp`, alt: 'דשבורד ATLAS: הזמנות השבוע, לידים חדשים, הכנסות ודירוג ממוצע' },
  { key: 'bookings', label: 'הזמנות', desktop: `${S}/desktop/bookings.webp`, mobile: `${S}/mobile/bookings.webp`, alt: 'רשימת ההזמנות ב-ATLAS עם יחידה, תאריכים, סכום וסטטוס' },
  { key: 'leads', label: 'לידים', desktop: `${S}/desktop/leads.webp`, mobile: `${S}/mobile/leads.webp`, alt: 'מסך הלידים ב-ATLAS עם סטטוס לכל פנייה' },
  { key: 'payments', label: 'תשלומים', desktop: `${S}/desktop/payments.webp`, mobile: `${S}/mobile/payments.webp`, alt: 'מסך התשלומים ב-ATLAS: שולם, ממתין ובאיחור' },
  { key: 'messages', label: 'הודעות', desktop: `${S}/desktop/messages.webp`, mobile: `${S}/mobile/messages.webp`, alt: 'שיחת WhatsApp עם אורח בתוך ATLAS' },
];

export const MOBILE_CLEANING = `${S}/mobile/cleaning.webp`;

const M = (name, w, h) => ({ src: `${S}/crops-m/${name}.webp`, w, h });
/** Phone-width crops, served to small screens instead of the desktop crops. */
export const CROPS_MOBILE = {
  calendarSync: M('calendar', 780, 720),
  bookings: M('bookings', 780, 620),
  leads: M('leads', 780, 560),
  payments: M('payments', 780, 500),
  messages: M('messages', 780, 660),
};

export const CROPS = {
  calendar: { src: `${S}/crops/calendar.webp`, w: 1200, h: 323, alt: 'לוח שנה עם הזמנות מכל הערוצים' },
  calendarSync: { src: `${S}/crops/calendar-sync.webp`, w: 1200, h: 454, alt: 'לוח השנה עם סינון לפי ערוץ וכפתור סנכרון' },
  bookings: { src: `${S}/crops/bookings.webp`, w: 1200, h: 349, alt: 'טבלת הזמנות עם סטטוס וסכום' },
  leads: { src: `${S}/crops/leads.webp`, w: 1200, h: 344, alt: 'טבלת לידים עם סטטוס לכל פנייה' },
  payments: { src: `${S}/crops/payments.webp`, w: 1200, h: 319, alt: 'סיכום תשלומים: שולם, ממתין, באיחור' },
  messages: { src: `${S}/crops/messages.webp`, w: 1200, h: 449, alt: 'שיחת WhatsApp עם אורח' },
  cleaning: { src: `${S}/crops/cleaning.webp`, w: 780, h: 920, alt: 'משימות ניקיון של היום עם צ׳קליסט' },
};

/** Six main modules (like the reference's six blocks). */
export const MODULES = [
  { key: 'calendar', crop: 'calendarSync', icon: CalendarRange, tone: 'indigo', title: 'יומן וסנכרון ערוצים', line: 'Booking.com, Airbnb והזמנות ישירות בלוח שנה אחד.' },
  { key: 'bookings', icon: ClipboardList, tone: 'navy', title: 'הזמנות ואורחים', line: 'כל הזמנה עם תאריכים, סכום וסטטוס.' },
  { key: 'leads', icon: Users, tone: 'amber', title: 'לידים ומכירות', line: 'כל פנייה במעקב עד שהיא נסגרת.' },
  { key: 'payments', icon: Wallet, tone: 'green', title: 'תשלומים והכנסות', line: 'מקדמות, יתרות ומי עוד חייב.' },
  { key: 'messages', icon: MessageCircle, tone: 'indigo', title: 'הודעות אוטומטיות לאורחים', line: 'אישור, הוראות הגעה וביקורת. בזמן.' },
  { key: 'cleaning', icon: SprayCan, tone: 'red', title: 'ניקיון ותפעול', line: 'משימה לכל יחידה, עם צ׳קליסט.' },
];

/** Every item maps to a page or control that exists in the app today (src/pages). */
export const FEATURES = [
  { icon: CalendarRange, title: 'לוח שנה מרכזי', line: 'כל היחידות במסך אחד' },
  { icon: RefreshCw, title: 'סנכרון iCal', line: 'Booking.com ו-Airbnb' },
  { icon: ClipboardList, title: 'ניהול הזמנות', line: 'סטטוס, תאריכים וסכום' },
  { icon: IdCard, title: 'כרטיס אורח', line: 'כל ההיסטוריה במקום אחד' },
  { icon: Users, title: 'לידים', line: 'מפנייה ועד הזמנה' },
  { icon: MessageCircle, title: 'הודעות לאורחים', line: 'WhatsApp, SMS ומייל' },
  { icon: Workflow, title: 'אוטומציות', line: 'הודעה יוצאת בזמן' },
  { icon: Route, title: 'מסע אורח', line: 'מההזמנה ועד הביקורת' },
  { icon: DoorOpen, title: 'פורטל אורחים', line: 'המידע לפני ההגעה' },
  { icon: Wallet, title: 'תשלומים', line: 'מקדמות ויתרות' },
  { icon: Receipt, title: 'חשבוניות', line: 'חשבונית לכל הזמנה' },
  { icon: TrendingDown, title: 'מעקב הוצאות', line: 'לפי קטגוריה' },
  { icon: LineChart, title: 'מודיעין הכנסות', line: 'הכנסות ותפוסה לפי חודש' },
  { icon: FileBarChart, title: 'דוחות בעלים', line: 'דוח מסודר לכל נכס' },
  { icon: Tags, title: 'תמחור דינאמי', line: 'מחיר לפי תקופה' },
  { icon: SprayCan, title: 'ניקיון', line: 'משימות וצ׳קליסט לצוות' },
  { icon: Wrench, title: 'בקשות שירות', line: 'תקלות ובקשות של אורחים' },
  { icon: FileSignature, title: 'חוזים', line: 'שליחה לחתימה דיגיטלית' },
  { icon: Star, title: 'ביקורות', line: 'בקשה אחרי העזיבה' },
  { icon: Sparkles, title: 'עוזר AI', line: 'עזרה בעברית בתוך המערכת' },
  { icon: Download, title: 'ייצוא CSV', line: 'הנתונים יוצאים איתכם' },
  { icon: Link2, title: 'שיתוף תצוגה', line: 'קישור למסך מסונן' },
  { icon: Search, title: 'חיפוש מהיר', line: 'אורח, הזמנה או ליד' },
  { icon: Moon, title: 'מצב כהה', line: 'נוח גם בלילה' },
];

/** Only claims verifiable in the codebase / policy pages. */
export const TRUST = [
  { icon: ShieldCheck, title: 'כל עסק רואה רק את שלו', line: 'הפרדת נתונים בין עסקים ברמת מסד הנתונים.' },
  { icon: EyeOff, title: 'לא מוכרים מידע', line: 'לא מוכרים ולא משכירים מידע לצד שלישי.' },
  { icon: HardDriveDownload, title: 'הנתונים שלכם', line: 'ייצוא הזמנות, לידים ותשלומים ל-CSV בכל רגע.' },
  { icon: History, title: 'תיעוד פעולות', line: 'פעולות רגישות נרשמות ביומן פעולות.' },
  { icon: Headset, title: 'תמיכה אנושית בעברית', line: 'אדם עונה לכם בוואטסאפ ובמייל.' },
];

export const FAQ = [
  { q: 'למי ATLAS מתאימה?', a: 'לבעלי צימרים, מתחמי נופש, וילות ויחידות אירוח, מיחידה אחת ועד עשרות.' },
  { q: 'צריך כרטיס אשראי כדי להתחיל?', a: 'לא. נרשמים ומקבלים 14 ימים עם כל המערכת, בלי התחייבות.' },
  { q: 'מה קורה בסוף 14 הימים?', a: 'בוחרים מסלול לפי מספר הנכסים. אם לא בוחרים, לא מחויבים.' },
  { q: 'איך ATLAS מתחברת ל-Booking.com ול-Airbnb?', a: 'דרך קישור iCal שכל ערוץ נותן. מדביקים פעם אחת, וההזמנות נכנסות ללוח השנה ומתעדכנות לבד.' },
  { q: 'צריך להתקין משהו?', a: 'לא. ATLAS עובדת בדפדפן, במחשב ובנייד.' },
  { q: 'אני לא חזק בטכנולוגיה. זה יסתדר?', a: 'כן. המסכים בעברית ופשוטים, ואם נתקעים כותבים לנו בוואטסאפ ומקבלים עזרה מאדם.' },
  { q: 'ההודעות לאורחים יוצאות לבד?', a: 'כן, אחרי חיבור WhatsApp Business או ספק SMS. בוחרים נוסח ותזמון, ו-ATLAS שולחת.' },
  { q: 'המידע שלי בטוח?', a: 'כל עסק רואה רק את הנתונים שלו, ואנחנו לא מוכרים מידע לאף אחד. אפשר לייצא הכל בכל רגע.' },
  { q: 'אפשר לבטל?', a: 'כן, בכל עת וללא התחייבות.' },
];

// Plan feature strings come from src/config/pricing.js; show them in plain Hebrew here.
const FEATURE_HE = {
  'כל תכונות Starter': 'כל מה שבמתחיל',
  'כל תכונות Pro': 'כל מה שבמקצועי',
  'API מותאם': 'API מותאם אישית',
};
export const planFeature = (f) => FEATURE_HE[f] || f;

export function buildWhatsAppLead({ name, phone, units, message }) {
  const lines = [
    'היי, אשמח לשמוע על ATLAS.',
    name && `שם: ${name}`,
    phone && `טלפון: ${phone}`,
    units && `מספר יחידות: ${units}`,
    message && `הודעה: ${message}`,
  ].filter(Boolean);
  return `${WHATSAPP_URL}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildMailtoLead({ name, phone, units, message }) {
  const body = [`שם: ${name || ''}`, `טלפון: ${phone || ''}`, `מספר יחידות: ${units || ''}`, '', message || ''].join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('פנייה מהאתר: ATLAS')}&body=${encodeURIComponent(body)}`;
}
