/**
 * Landing v4 copy + photo manifest. Warm hospitality direction (brand/direction-v4.md),
 * still inside brand/simplicity-rules.md: six sections, one CTA label, no invented numbers.
 * Photos are real Unsplash photos (Unsplash License), optimized to webp in /public/landing/photos.
 * Everything that looks like app UI on the page is built in HTML/CSS (Demos.jsx), not old screenshots.
 */
import { CalendarRange, MessageCircle, Wallet } from 'lucide-react';

export {
  WHATSAPP_URL, PHONE_DISPLAY, CTA_SIGNUP,
} from '@/components/landing/v2/content';

const P = '/landing/photos';

export const PHOTOS = {
  heroWide: { src: `${P}/hero-hottub-2000.webp`, w: 2000, h: 1334 },
  heroNarrow: { src: `${P}/hero-hottub-900.webp`, w: 900, h: 987 },
  heroAlt: 'ג׳קוזי עץ על מרפסת מול נוף הרים בשקיעה',
  bed: { src: `${P}/bed1-960.webp`, w: 960, h: 640, alt: 'חדר שינה מעץ עם מיטה מוצעת ואור בוקר' },
  pool: { src: `${P}/pool3-960.webp`, w: 960, h: 641, alt: 'בריכה פרטית צרה בין דשא ועצים' },
  deck: { src: `${P}/deck2-960.webp`, w: 960, h: 640, alt: 'מרפסת עץ מול שקיעה מעל הרים' },
  hottub: { src: `${P}/hottub3-960.webp`, w: 960, h: 640, alt: 'ג׳קוזי עץ מול נוף הרים' },
  villa: { src: `${P}/pool1-960.webp`, w: 960, h: 640, alt: 'וילה עם בריכה וחלונות גדולים' },
};

/** Tiny square cover photos for the demo units (the app shows a cover photo per unit). */
export const THUMBS = {
  oak: `${P}/th-hottub3.webp`,
  olive: `${P}/th-bed1.webp`,
  fig: `${P}/th-pool3.webp`,
  vine: `${P}/th-pool1.webp`,
};

export const HERO = {
  a: { title: 'אתם מארחים. ATLAS דואגת לשאר.', sub: 'הזמנות, תשלומים והודעות בוואטסאפ. במקום אחד, בעברית.' },
  b: { title: ['צימר מלא.', 'ראש שקט.'], sub: 'לוח שנה, הודעות לאורחים ותשלומים. הכל מסתדר לבד, בעברית.' },
};

export const BENEFITS = [
  { key: 'cal', icon: CalendarRange, photo: 'pool', chip: 'מסונכרן', title: 'לוח שנה אחד', line: 'Booking.com, Airbnb והזמנות ישירות. מתעדכן לבד.' },
  { key: 'msg', icon: MessageCircle, photo: 'bed', chip: 'נשלח לאורח', title: 'הודעות שיוצאות לבד', line: 'אישור הזמנה, הוראות הגעה ובקשה לביקורת. בזמן.' },
  { key: 'pay', icon: Wallet, photo: 'deck', chip: 'שולם', title: 'יודעים מי שילם', line: 'מקדמות, יתרות ומי עוד חייב. במבט אחד.' },
];

export const STEPS = [
  { title: 'נרשמים', line: '14 ימים עם כל המערכת, בלי התחייבות.' },
  { title: 'מחברים את הערוצים', line: 'מדביקים פעם אחת קישור מכל ערוץ.' },
  { title: 'מארחים בראש שקט', line: 'הזמנות, הודעות ותשלומים במקום אחד.' },
];

/** Kinds of places ATLAS is for. Captions describe the photo, not a customer. */
export const PLACES = [
  { photo: 'hottub', label: 'צימרים עם ג׳קוזי' },
  { photo: 'villa', label: 'וילות עם בריכה' },
  { photo: 'bed', label: 'בקתות עץ' },
  { photo: 'pool', label: 'מתחמי נופש' },
];

export const FAQ = [
  { q: 'למי ATLAS מתאימה?', a: 'לבעלי צימרים, מתחמי נופש, וילות ויחידות אירוח, מיחידה אחת ועד עשרות.' },
  { q: 'צריך כרטיס אשראי כדי להתחיל?', a: 'לא. נרשמים ומקבלים 14 ימים עם כל המערכת, בלי התחייבות.' },
  { q: 'זה עובד עם Booking.com ו-Airbnb?', a: 'כן. כל ערוץ נותן קישור יומן (iCal). מדביקים אותו פעם אחת, וההזמנות נכנסות ללוח השנה ומתעדכנות לבד.' },
  { q: 'אני לא חזק בטכנולוגיה. זה יסתדר?', a: 'כן. הכל בעברית ופשוט, ואם נתקעים כותבים לנו בוואטסאפ ואדם עונה.' },
  { q: 'מה קורה בסוף 14 הימים?', a: 'בוחרים מסלול לפי מספר הנכסים. לא בחרתם? לא מחויבים. אפשר לבטל בכל עת.' },
];

/** Demo data shown inside the HTML/CSS product demos. Labeled as an example in the UI. */
export const DEMO = {
  guest: 'נועה לוי',
  unit: 'בקתת האלון',
  nights: '2 לילות',
  amount: 1250,
  chatIn: 'היי, אפשר להגיע כבר ב-14:00?',
  chatOut: 'בשמחה. הקוד לדלת יישלח אליכם בבוקר.',
  units: [
    { key: 'oak', name: 'האלון' },
    { key: 'olive', name: 'הזית' },
    { key: 'fig', name: 'התאנה' },
    { key: 'vine', name: 'הגפן' },
  ],
  /** [unitIndex, startDay, length, channel] on a 7-day strip; day 0 = first column. */
  bars: [
    [0, 0, 2, 'airbnb'], [0, 3, 3, 'direct'],
    [1, 1, 3, 'booking'], [1, 5, 2, 'airbnb'],
    [2, 0, 1, 'direct'], [2, 2, 4, 'airbnb'],
    [3, 0, 3, 'booking'], [3, 4, 2, 'direct'],
  ],
  days: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
};
