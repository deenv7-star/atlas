/**
 * Centralized pricing configuration - single source of truth for ATLAS
 * Used across: Landing, Onboarding, Subscription, Billing, PricingSection, admin fallback.
 *
 * Tiers decided by Deen (18.10.2026): the plans differ ONLY by the number of complexes (מתחמים).
 * Every plan includes the whole system. Feature lines below list only what the app really does
 * today (checked against src/pages, 18.10.2026). Do not add a line for something the app does not do.
 *
 * `complexes`  = how many מתחמים the plan covers (null = unlimited). This is the limit we sell.
 * `properties` = legacy per-property limit still read by Subscription/Billing/admin (max_properties).
 *                Kept unchanged on purpose until the app and platform_plans count complexes
 *                (see qa/pricing-v1/report.md, "DB/admin mismatch").
 */

/** What every plan includes (same list for all three, shown on the landing). */
export const INCLUDED_FEATURES = [
  'לוח שנה אחד לכל היחידות',
  'כל ההזמנות מ-Booking.com, Airbnb וישיר, על לוח אחד',
  'התראה כשהזמנות חופפות',
  'מסך ״היום״: כניסות, יציאות וניקיון',
  'מעקב אחרי פניות של אורחים',
  'הודעות וואטסאפ בלחיצה, בנוסח מוכן בעברית',
  'מעקב תשלומים, מקדמות ויתרות',
  'משימות ניקיון',
  'דוח חודשי לרואה החשבון, להורדה ולהדפסה',
  'תמיכה בעברית, בוואטסאפ',
];

export const TRIAL_DAYS = 14;
export const TRIAL_LINE = '14 יום ניסיון חינם, הכל פתוח, בלי כרטיס אשראי.';
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
    desc: 'למי שמנהל מתחם אחד: צימר, וילה או בקתות',
    features: ['מתחם אחד', 'כל היכולות כלולות', 'תמיכה בעברית בוואטסאפ'],
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
    desc: 'למי שמנהל כמה מתחמים, עד חמישה',
    features: ['עד 5 מתחמים', 'כל היכולות כלולות', 'תמיכה בעברית בוואטסאפ'],
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
    desc: 'לרשתות ולחברות ניהול עם הרבה מתחמים',
    features: ['מתחמים ללא הגבלה', 'כל היכולות כלולות', 'תמיכה בעברית בוואטסאפ'],
    adds: ['מתחמים ללא הגבלה'],
    popular: false,
  },
];

export function getPlanByKey(key) {
  return PRICING_PLANS.find((p) => p.key === key) || PRICING_PLANS[0];
}
