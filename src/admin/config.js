/* global __ATLAS_BUILD__ */
/**
 * ATLAS platform admin (/admin) — shared config.
 * Access is enforced in the database (supabase/migrations/011_platform_admin.sql): every read and
 * write goes through SECURITY DEFINER functions that check public.platform_admins. Nothing here is
 * a security boundary; it only decides what to render.
 */
import { isSupabaseConfigured } from '@/api/supabaseClient';
import { PRICING_PLANS } from '@/config/pricing';

/**
 * Supabase mode: the admin RPCs exist only after migration 011. That is detected at runtime
 * (AdminGate asks admin_whoami; "function does not exist" shows the calm "not enabled yet" card),
 * independent of VITE_DB_SCHEMA_LEVEL, which still gates 008 / 009 elsewhere.
 * Set VITE_ADMIN_CONSOLE=off to turn the console off without touching the database.
 */
export const ADMIN_DB_READY = !isSupabaseConfigured || String(import.meta.env.VITE_ADMIN_CONSOLE || '').toLowerCase() !== 'off';
/**
 * Support inbox (migration 020): detected at runtime like 010/011 (a missing table/function shows a
 * calm "not enabled yet" card). VITE_SUPPORT_CHAT=off turns the widget and the inbox off.
 */
export const SUPPORT_ADMIN_READY = String(import.meta.env.VITE_SUPPORT_CHAT || '').toLowerCase() !== 'off';
/** Local demo mode (no Supabase): sample data, persisted in this browser only. */
export const ADMIN_DEMO = !isSupabaseConfigured;

/** Demo mode only: which local demo logins see the console. Real mode asks the DB (admin_whoami). */
export const DEMO_ADMIN_EMAILS = ['owner@demo-atlas.co.il', 'admin@demo-atlas.co.il'];

export const ROLES = {
  owner: { label: 'בעלים', rank: 3, desc: 'הכל, כולל מחירים וצוות' },
  admin: { label: 'מנהל', rank: 2, desc: 'לקוחות, מנויים ותשלומים' },
  support: { label: 'תמיכה', rank: 1, desc: 'צפייה, הערות ומענה ללקוחות בתמיכה' },
};
export const can = (role, min) => (ROLES[role]?.rank || 0) >= (ROLES[min]?.rank || 99);

/** Effective customer status (computed by admin_list_customers). tone → pill colors. */
export const STATUS = {
  active: { label: 'פעיל', tone: 'mint' },
  trialing: { label: 'בניסיון', tone: 'sky' },
  past_due: { label: 'תשלום נכשל', tone: 'red' },
  expired: { label: 'ניסיון הסתיים', tone: 'gray' },
  churned: { label: 'עזב', tone: 'gray' },
  suspended: { label: 'מושהה', tone: 'red' },
};
export const STATUS_ORDER = ['active', 'trialing', 'past_due', 'expired', 'churned', 'suspended'];

export const CHARGE_STATUS = {
  paid: { label: 'שולם', tone: 'mint' },
  pending: { label: 'ממתין', tone: 'lilac' },
  failed: { label: 'נכשל', tone: 'red' },
  refunded: { label: 'הוחזר', tone: 'gray' },
  void: { label: 'בוטל', tone: 'gray' },
};
export const METHODS = {
  bank_transfer: 'העברה בנקאית',
  bit: 'ביט',
  card: 'כרטיס אשראי',
  cash: 'מזומן',
  check: 'צ׳ק',
  manual: 'ידני',
};

export const AUDIT_ACTIONS = {
  'trial.extend': 'הארכת ניסיון',
  'plan.change': 'שינוי חבילה',
  'account.suspend': 'השהיית חשבון',
  'account.reactivate': 'הפעלה מחדש',
  'note.add': 'הערה',
  'charge.record': 'רישום חיוב',
  'charge.mark_paid': 'סימון כשולם',
  'plan.update': 'עדכון מחיר חבילה',
  'team.add': 'הוספה לצוות',
  'team.role': 'שינוי הרשאה',
  'team.remove': 'הסרה מהצוות',
  'support.reply': 'תשובה בתמיכה',
  'support.closed': 'סגירת שיחת תמיכה',
  'support.open': 'פתיחה מחדש של שיחת תמיכה',
  'customer.flag_test': 'סימון חשבון בדיקה',
  'customer.view_as': 'צפייה כלקוח',
  'customer.export': 'ייצוא לקוח (JSON)',
  'customers.export_csv': 'ייצוא רשימת לקוחות',
  'audit.export_csv': 'ייצוא יומן',
  'charges.export_csv': 'ייצוא חיובים',
  'auth.password_reset': 'מייל איפוס סיסמה',
  'auth.resend_confirmation': 'מייל אימות נשלח שוב',
  'customer.delete': 'מחיקת לקוח',
  'customer.delete_failed': 'מחיקה שנכשלה',
};

/** Fallback plan list (same numbers as the landing) when the DB list is not loaded yet. */
export const DEFAULT_PLANS = PRICING_PLANS.map((p, i) => ({
  key: p.key,
  name: p.name,
  name_he: p.nameHe,
  price_monthly: p.price,
  price_yearly: p.priceYearly,
  max_properties: p.properties,
  description: p.desc,
  features: p.features,
  is_popular: Boolean(p.popular),
  is_active: true,
  sort_order: i + 1,
}));

export const ADMIN_NAV = [
  { to: '/admin', key: 'overview', label: 'סקירה', end: true },
  { to: '/admin/customers', key: 'customers', label: 'לקוחות' },
  { to: '/admin/support', key: 'support', label: 'תמיכה' },
  { to: '/admin/inbox', key: 'inbox', label: 'פניות מהאתר' },
  { to: '/admin/payments', key: 'payments', label: 'מנויים ותשלומים' },
  { to: '/admin/plans', key: 'plans', label: 'חבילות ומחירים' },
  { to: '/admin/team', key: 'team', label: 'צוות והרשאות' },
  { to: '/admin/health', key: 'health', label: 'תקינות מערכת' },
  { to: '/admin/audit', key: 'audit', label: 'יומן פעולות' },
];

/** Build info injected by vite.config.js (Vercel exposes VERCEL_GIT_* at build time). */
export const BUILD_INFO = (typeof __ATLAS_BUILD__ !== 'undefined' && __ATLAS_BUILD__) || {};
