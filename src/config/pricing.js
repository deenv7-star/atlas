/**
 * Centralized pricing configuration - single source of truth for ATLAS
 * Used across: Landing, Onboarding, Subscription, Billing, PricingSection, admin fallback.
 *
 * Tiers decided by Deen (18.10.2026): the plans differ ONLY by the number of complexes (מתחמים).
 * Every plan includes the whole system. Feature lines below list only what the app really does
 * today (checked against src/pages, 18.10.2026). Do not add a line for something the app does not do.
 *
 * Package scope confirmed by Deen (01.11.2026): plan 1 = one complex, plan 2 = up to 5, plan 3 = unlimited.
 * Growth (campaigns + a landing page / website for the complex) is a separate offer sold after a call
 * (src/config/growth.js), never a self-serve signup. Annual billing is charged upfront (Deen, 01.11.2026):
 * yearlyTotal() is what the card shows under the annual price. Deen is עוסק פטור: prices are final, no VAT.
 *
 * `complexes`  = how many מתחמים the plan covers (null = unlimited). This is the limit we sell.
 * `properties` = legacy per-property limit still read by Subscription/Billing/admin (max_properties).
 *                Kept unchanged on purpose until the app and platform_plans count complexes
 *                (see qa/pricing-v1/report.md, "DB/admin mismatch").
 */

/** What every plan includes (same list for all three, shown on the landing). */
export const INCLUDED_FEATURES = [
  'לוח שנה אחד לכל היחידות',
  'התאריכים התפוסים מ-Booking.com ו-Airbnb, וההזמנות הישירות, על לוח אחד',
  'התראה כשהזמנות חופפות',
  'דף הזמנה ישירה משלכם, בלי עמלה',
  'מסך ״היום״: כניסות, יציאות וניקיון',
  'מעקב אחרי פניות של אורחים',
  'הודעות וואטסאפ בלחיצה, בנוסח מוכן בעברית',
  'מעקב תשלומים, מקדמות ויתרות',
  'משימות ניקיון',
  'דוח חודשי לרואה החשבון, להורדה ולהדפסה',
  'תמיכה אנושית 24/7, בעברית ובוואטסאפ',
];

export const TRIAL_DAYS = 14;
export const TRIAL_LINE = '14 יום חינם, הכל פתוח, בלי כרטיס אשראי.';
/** Deen is עוסק פטור (01.11.2026): the listed price is the final price, no VAT on top. */
export const VAT_LINE = 'עוסק פטור · המחיר סופי, ללא מע״מ';
/** Support hours decided by Deen (01.11.2026). No response-time promise. */
export const SUPPORT_LINE = 'תמיכה אנושית 24/7, גם בשבת ובאמצע הלילה';
/** Annual plans are charged upfront (Deen, 01.11.2026): 12 × the annual monthly price. */
export const yearlyTotal = (p) => p.priceYearly * 12;
export const CANCEL_LINE = 'בלי התחייבות: מפסיקים מתי שרוצים.';

export const PRICING_PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    nameHe: 'מתחיל',
    price: 399,
    priceYearly: 319,
    complexes: 1,
    limit: 'מתחם אחד',
    properties: 3,
    desc: 'מתחם אחד: צימר, וילה או כמה בקתות',
    features: ['מתחם אחד', 'כל היכולות כלולות', 'תמיכה אנושית 24/7'],
    adds: [],
    popular: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    nameHe: 'מקצועי',
    price: 699,
    priceYearly: 559,
    complexes: 5,
    limit: 'עד 5 מתחמים',
    properties: 10,
    desc: 'כמה מתחמים, עד חמישה',
    features: ['עד 5 מתחמים', 'כל היכולות כלולות', 'תמיכה אנושית 24/7'],
    adds: ['עד 5 מתחמים במקום מתחם אחד'],
    popular: true,
  },
  {
    key: 'business',
    name: 'Business',
    nameHe: 'עסקי',
    price: 999,
    priceYearly: 799,
    complexes: null,
    limit: 'מתחמים ללא הגבלה',
    properties: null,
    desc: 'רשתות וחברות ניהול, בלי הגבלת מתחמים',
    features: ['מתחמים ללא הגבלה', 'כל היכולות כלולות', 'תמיכה אנושית 24/7'],
    adds: ['מתחמים ללא הגבלה'],
    popular: false,
  },
];

export function getPlanByKey(key) {
  return PRICING_PLANS.find((p) => p.key === key) || PRICING_PLANS[0];
}
