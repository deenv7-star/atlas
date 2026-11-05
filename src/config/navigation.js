/**
 * One navigation map for the whole app: sidebar, mobile tab bar, "more" sheet and
 * command palette read these labels, so a screen is called the same thing everywhere.
 * Labels follow the glossary in docs/brand.md.
 */
import {
  Sun, CalendarRange, BedDouble, Users, MessageSquare, Star,
  Brush, Headset, FileSignature, Send, Wallet,
  Tags, Link2, Globe, CreditCard, Settings, Shield,
} from 'lucide-react';
import { DB_FEATURES } from '@/config/dbFeatures';

/**
 * Simplicity rules (16.10.2026): the sidebar shows exactly seven places. Everything else
 * lives inside them (tabs) or in the quiet "עוד" sheet.
 */
export const NAV_GROUPS = [
  {
    id: 'primary',
    label: null,
    items: [
      { page: 'Dashboard', label: 'היום', icon: Sun },
      { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
      { page: 'Bookings', label: 'הזמנות', icon: BedDouble },
      { page: 'Leads', label: 'פניות', icon: Users },
      { page: 'Payments', label: 'כסף', icon: Wallet },
      { page: 'Messages', label: 'הודעות', icon: MessageSquare },
      { page: 'Settings', label: 'הגדרות', icon: Settings },
    ],
  },
  /*
   * persona-clarity (05.11.2026): every screen lives in exactly ONE place, and every row in "עוד" says in one line what it
   * gives (desc). Removed duplicates: "שאלו את atlas" (now "עזרה" in the top bar), "הכנסות" (now כסף → דוחות → 12 חודשים).
   */
  {
    id: 'ops',
    label: 'המתחם ביום-יום',
    items: [
      { page: 'Cleaning', label: 'ניקיון', icon: Brush, desc: 'מה לנקות היום ומי מנקה' },
      { page: 'ServiceRequests', label: 'בקשות שירות', icon: Headset, desc: 'תקלות ובקשות של אורחים, עד שמטפלים' },
      { page: 'Reviews', label: 'ביקורות', icon: Star, desc: 'מה אורחים כתבו עליכם, ובקשת ביקורת' },
      { page: 'Contracts', label: 'חוזים', icon: FileSignature, desc: 'חוזה לאורח, נחתם בטלפון' },
    ],
  },
  {
    id: 'guests',
    label: 'אורחים ומחירים',
    items: [
      { page: 'Automations', label: 'הודעות אוטומטיות', icon: Send, desc: 'הודעות לאורחים שמוכנות לבד בזמן הנכון' },
      ...(DB_FEATURES.guestPages ? [{ page: 'GuestPortal', label: 'דף אורח והזמנה ישירה', icon: Globe, desc: 'דף שלכם להזמנה בלי עמלה' }] : []),
      { page: 'DynamicPricing', label: 'תמחור חגים', icon: Tags, desc: 'מחיר מתאים לחגים ולסופי שבוע' },
      // ecosystem v1 #7: owner reports are not built yet; the route stays, nothing links to it until it ships.
    ],
  },
  {
    id: 'account',
    label: 'חשבון',
    items: [
      { page: 'Integrations', label: 'ערוצים וחיבורים', icon: Link2, desc: 'הזמנות מ-Booking ומ-Airbnb ביומן אחד' },
      // ecosystem v1 #6: one row for the plan and its charges (Billing is reached from inside Subscription)
      { page: 'Subscription', label: 'מנוי וחיובים', icon: CreditCard, desc: 'המסלול שלכם והחשבוניות' },
    ],
  },
];

/** One line under each primary screen when it shows in "עוד" (phone: הזמנות, הודעות, הגדרות). */
export const NAV_DESC = {
  Bookings: 'כל ההזמנות, לפי תאריך הגעה',
  Messages: 'שיחות עם אורחים במקום אחד',
  Settings: 'היחידות, שעות כניסה, פרטים וסיסמה',
  Leads: 'אורחים ששאלו על תאריכים',
  Payments: 'מי שילם ומי עוד חייב',
};

/** "כספים" is one place; these are its tabs. */
export const FINANCE_TABS = [
  { page: 'Payments', label: 'תשלומים' },
  { page: 'Balances', label: 'יתרות' },
  ...(DB_FEATURES.expenses ? [{ page: 'ExpenseTracker', label: 'הוצאות' }] : []),
  { page: 'Invoices', label: 'קבלות' },
  // persona-clarity: "דוחות" holds the month report AND the 12-month view that used to be the separate "הכנסות" screen
  { page: 'MonthlyReport', label: 'דוחות' },
];

/** Pages that light up a primary nav item without being in the sidebar themselves. */
export const NAV_PARENT = {
  Today: 'Dashboard',
  Balances: 'Payments', Invoices: 'Payments', ExpenseTracker: 'Payments', MonthlyReport: 'Payments', RevenueIntelligence: 'Payments',
  BookingDetail: 'Bookings', LeadDetail: 'Leads',
};

export const PLATFORM_ITEM = { page: 'PlatformAdmin', label: 'פלטפורמה', icon: Shield };

/** Mobile tab bar: four destinations around a central "new booking" action. */
export const TAB_BAR = ['Dashboard', 'MultiCalendar', '__new__', 'Bookings', '__more__'];

export const PAGE_TITLES = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items).concat([PLATFORM_ITEM]).map((i) => [i.page, i.label]),
);
Object.assign(PAGE_TITLES, {
  Today: 'היום',
  Balances: 'כסף', Invoices: 'כסף', ExpenseTracker: 'כסף', MonthlyReport: 'כסף', Payments: 'כסף', RevenueIntelligence: 'כסף', AIAssistant: 'שאלו את atlas',
  BookingDetail: 'פרטי הזמנה',
  LeadDetail: 'פרטי פנייה',
  Onboarding: 'הקמת החשבון',
});

export function findNavItem(page) {
  for (const g of NAV_GROUPS) for (const i of g.items) if (i.page === page) return i;
  return null;
}
