/**
 * Centralized pricing configuration - single source of truth for ATLAS
 * Used across: Landing, Onboarding, Subscription, Billing, PricingSection
 */
export const PRICING_PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    nameHe: 'מתחיל',
    price: 399,
    priceYearly: 319,
    properties: 3,
    desc: 'למתחמים קטנים עד 3 נכסים',
    features: ['עד 3 נכסים', 'ניהול הזמנות', 'ניהול לידים', 'תשלומים בסיסיים'],
    popular: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    nameHe: 'מקצועי',
    price: 699,
    priceYearly: 559,
    properties: 10,
    desc: 'לעסקים צומחים עד 10 נכסים',
    features: ['עד 10 נכסים', 'כל תכונות Starter', 'אוטומציות חכמות', 'חוזים דיגיטליים', 'כל האינטגרציות'],
    popular: true,
  },
  {
    key: 'business',
    name: 'Business',
    nameHe: 'עסקי',
    price: 999,
    priceYearly: 799,
    properties: null,
    desc: 'לרשתות ומתחמים גדולים',
    features: ['נכסים ללא הגבלה', 'כל תכונות Pro', 'API מותאם', 'מנהל חשבון אישי', 'תמיכה 24/7'],
    popular: false,
  },
];

export function getPlanByKey(key) {
  return PRICING_PLANS.find((p) => p.key === key) || PRICING_PLANS[0];
}
