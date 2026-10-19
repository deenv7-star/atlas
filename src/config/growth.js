/**
 * "אטלס צמיחה" (growth / marketing layer) – landing content, one source of truth (19.10.2026).
 * PROPOSAL awaiting Deen's approval: names, prices, founding-member terms and monthly slot caps
 * come from qa/growth-offer/plan.md. Change them here only.
 *
 * Honesty rules (consumer protection law, voice guide):
 *  - Every limit and date here must be real. FOUNDING.remaining stays null until a real counter
 *    exists (then the UI shows "נשארו X מתוך 20"); never hard-code a remaining number.
 *  - Components that are not built yet are listed in `soon` and shown as opening to founding members.
 *  - No testimonials, ratings or customer counts. The ROI line is an example, with its assumptions.
 */
import { WHATSAPP_URL } from '@/config/legal';

export const GROWTH_NAME = 'אטלס צמיחה';

/** Founding-member offer (real cap, real deadline). */
export const FOUNDING = {
  cap: 20,
  deadline: '31.12.2026',
  deadlineLabel: 'עד 31 בדצמ׳ 2026',
  monthly: 599,
  lockMonths: 24,
  remaining: null, // set from a real DB count only
};

/** Real monthly capacity of Deen's done-for-you work. */
export const SLOTS = { launchPerMonth: 4, guidedPerMonth: 5 };

export const LAUNCH = {
  name: 'חבילת השקה עם דין',
  price: 2400,
  founding: 1490,
  items: ['דף הזמנה מוכן', '3 סרטונים', 'קמפיין Meta ו-Google', 'פרופיל Google', 'הדרכה של 30 דק׳'],
};

/** Three tiers: the existing base plan, and two growth layers on top (per complex). */
export const GROWTH_TIERS = [
  {
    key: 'base',
    name: 'ניהול',
    for: 'סדר ביומן, בכסף ובוואטסאפ',
    price: 399,
    priceYearly: 319,
    from: true,
    lead: 'מה כלול:',
    items: ['כל המערכת', 'Booking ו-Airbnb בלוח אחד', 'וואטסאפ בלחיצה', 'תמיכה בעברית'],
    note: 'החבילות היום, לפי מספר המתחמים',
    cta: { kind: 'signup', label: 'התחילו 14 יום חינם' },
  },
  {
    key: 'growth',
    name: 'צמיחה',
    for: 'יותר הזמנות ישירות, בלי עמלה',
    price: 749,
    priceYearly: 599,
    popular: true,
    lead: 'הכל בניהול, ועוד:',
    items: ['דף הזמנה ישירה מהתמונות', '4 סרטונים בחודש לאינסטגרם וטיקטוק', 'מודעות מוכנות לכל עונה', 'פניות מהמודעה ישר לוואטסאפ', 'דוח חודשי: כמה זה הביא', 'בקשת ביקורת אחרי כל עזיבה'],
    note: 'תקציב הפרסום שלכם, משולם ישירות ל-Meta ול-Google',
    cta: { kind: 'founding', label: 'שמירת מקום כמייסדים' },
  },
  {
    key: 'guided',
    name: 'צמיחה מלווה',
    for: 'אנחנו עושים את זה בשבילכם',
    price: 1690,
    priceYearly: 1350,
    lead: 'הכל בצמיחה, ועוד:',
    items: ['דין מקים ומנהל את הקמפיינים', 'מודעות חדשות כל חודש', 'שיחת 20 דק׳ בחודש'],
    note: `${SLOTS.guidedPerMonth} מתחמים חדשים בחודש`,
    cta: { kind: 'guided', label: 'בדיקת מקום פנוי' },
  },
];

/** What exists today vs. opening to founding members first (keeps the landing honest). */
export const GROWTH_STATUS = {
  ready: ['דף הזמנה ישירה', 'בקשת ביקורת בוואטסאפ'],
  soon: ['סרטונים מהתמונות', 'מודעות עונתיות', 'דוח "כמה הביא"'],
};

/** ROI example (assumptions stated next to it on the page). */
export const ROI = { nightPrice: 800, nights: 2, addOn: 350 };
export function monthsCovered(nightPrice, nights = ROI.nights, addOn = ROI.addOn) {
  return Math.floor((nightPrice * nights) / addOn * 10) / 10;
}

const msg = (t) => `${WHATSAPP_URL}?text=${encodeURIComponent(t)}`;
export const GROWTH_LINKS = {
  founding: msg('היי דין, אשמח לשמור מקום כמייסדים בחבילת הצמיחה של אטלס.'),
  guided: msg('היי דין, יש מקום פנוי החודש בצמיחה מלווה?'),
  launch: msg('היי דין, אשמח לפרטים על חבילת ההשקה.'),
};
