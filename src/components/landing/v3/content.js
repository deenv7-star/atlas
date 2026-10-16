/**
 * Landing v3 copy. Calm, short, one idea per section (brand/simplicity-rules.md, Landing).
 * Contact details, CTA labels and the screenshot folder are shared with v2 (../v2/content.js),
 * so swapping the real screenshots later still means touching one folder only.
 */
import { CalendarRange, MessageCircle, Wallet } from 'lucide-react';

export {
  WHATSAPP_URL, PHONE_DISPLAY, CTA_SIGNUP, planFeature,
} from '@/components/landing/v2/content';

const S = '/landing/screens';

export const HERO_LAPTOP = {
  src: `${S}/desktop/calendar.webp`, w: 1760, h: 1100,
  alt: 'לוח השנה של ATLAS: ארבע יחידות והזמנות מ-Booking.com, Airbnb והזמנות ישירות על לוח אחד',
};

export const HERO_PHONE = {
  src: `${S}/mobile/messages-hero.webp`, w: 780, h: 1688,
  alt: 'שיחת WhatsApp עם אורח בתוך ATLAS בטלפון: אישור הזמנה ושעת הגעה',
};

export const BENEFITS = [
  { icon: CalendarRange, title: 'לוח שנה אחד', line: 'Booking.com, Airbnb והזמנות ישירות. מתעדכן לבד.' },
  { icon: MessageCircle, title: 'הודעות שיוצאות לבד', line: 'אישור הזמנה, הוראות הגעה ובקשה לביקורת. בזמן.' },
  { icon: Wallet, title: 'יודעים מי שילם', line: 'מקדמות, יתרות ומי עוד חייב. במבט אחד.' },
];

export const STEPS = [
  { title: 'נרשמים', line: '14 ימים עם כל המערכת, בלי התחייבות.' },
  { title: 'מחברים את הערוצים', line: 'מדביקים פעם אחת קישור מכל ערוץ.' },
  { title: 'מארחים בראש שקט', line: 'הזמנות, הודעות ותשלומים במקום אחד.' },
];

/** Phone-width crops of the real app (780px wide). */
export const SHOTS = [
  { key: 'calendar', src: `${S}/crops-m/calendar.webp`, w: 780, h: 720, caption: 'כל היחידות על לוח אחד', alt: 'לוח השנה של ATLAS עם ארבע יחידות והזמנות מכל הערוצים' },
  { key: 'messages', src: `${S}/crops-m/messages.webp`, w: 780, h: 660, caption: 'שיחה עם האורח, בלי לצאת מהמערכת', alt: 'שיחת WhatsApp עם אורח בתוך ATLAS' },
  { key: 'payments', src: `${S}/crops-m/payments.webp`, w: 780, h: 500, caption: 'מה שולם ומה עוד ממתין', alt: 'סיכום התשלומים ב-ATLAS: סך הכנסות, שולם, ממתין ובאיחור' },
];

export const FAQ = [
  { q: 'למי ATLAS מתאימה?', a: 'לבעלי צימרים, מתחמי נופש, וילות ויחידות אירוח, מיחידה אחת ועד עשרות.' },
  { q: 'צריך כרטיס אשראי כדי להתחיל?', a: 'לא. נרשמים ומקבלים 14 ימים עם כל המערכת, בלי התחייבות.' },
  { q: 'זה עובד עם Booking.com ו-Airbnb?', a: 'כן. כל ערוץ נותן קישור יומן (iCal). מדביקים אותו פעם אחת, וההזמנות נכנסות ללוח השנה ומתעדכנות לבד.' },
  { q: 'אני לא חזק בטכנולוגיה. זה יסתדר?', a: 'כן. הכל בעברית ופשוט, ואם נתקעים כותבים לנו בוואטסאפ ואדם עונה.' },
  { q: 'מה קורה בסוף 14 הימים?', a: 'בוחרים מסלול לפי מספר הנכסים. לא בחרתם? לא מחויבים. אפשר לבטל בכל עת.' },
];
