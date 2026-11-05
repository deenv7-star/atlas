/**
 * One navigation map for the whole app: sidebar, mobile tab bar, "more" sheet and
 * command palette read these labels, so a screen is called the same thing everywhere.
 * Labels follow the glossary in docs/brand.md.
 */
import {
  Sun, CalendarRange, BedDouble, Users, MessageSquare, Star,
  Brush, Wrench, FileSignature, Send, Wallet, BarChart3,
  Tags, Link2, Globe, CreditCard, Settings, Shield,
} from 'lucide-react';
import { DB_FEATURES } from '@/config/dbFeatures';
import { SparkMark } from '@/assistant/mark';

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
  {
    id: 'ops',
    label: 'תפעול',
    items: [
      { page: 'Cleaning', label: 'ניקיון', icon: Brush },
      { page: 'ServiceRequests', label: 'תקלות ותחזוקה', icon: Wrench },
      { page: 'Reviews', label: 'ביקורות', icon: Star },
      { page: 'Contracts', label: 'חוזים', icon: FileSignature },
      { page: 'Automations', label: 'הודעות אוטומטיות', icon: Send },
    ],
  },
  {
    id: 'guests',
    label: 'אורחים',
    items: [
      ...(DB_FEATURES.guestPages ? [{ page: 'GuestPortal', label: 'דף אורח והזמנה ישירה', icon: Globe }] : []),
      { page: 'AIAssistant', label: 'שאלו את atlas', icon: SparkMark },
    ],
  },
  {
    id: 'insights',
    label: 'דוחות',
    items: [
      { page: 'RevenueIntelligence', label: 'הכנסות', icon: BarChart3 },
      { page: 'DynamicPricing', label: 'תמחור חגים', icon: Tags },
      // ecosystem v1 #7: owner reports are not built yet; the route stays, nothing links to it until it ships.
    ],
  },
  {
    id: 'account',
    label: 'חשבון',
    items: [
      { page: 'Integrations', label: 'ערוצים וחיבורים', icon: Link2 },
      // ecosystem v1 #6: one row for the plan and its charges (Billing is reached from inside Subscription)
      { page: 'Subscription', label: 'מנוי וחיובים', icon: CreditCard },
    ],
  },
];

/** "כספים" is one place; these are its tabs. */
export const FINANCE_TABS = [
  { page: 'Payments', label: 'תשלומים' },
  { page: 'Balances', label: 'יתרות' },
  ...(DB_FEATURES.expenses ? [{ page: 'ExpenseTracker', label: 'הוצאות' }] : []),
  { page: 'Invoices', label: 'מסמכים' },
  { page: 'MonthlyReport', label: 'דוח' },
];

/** Pages that light up a primary nav item without being in the sidebar themselves. */
export const NAV_PARENT = {
  Today: 'Dashboard',
  Balances: 'Payments', Invoices: 'Payments', ExpenseTracker: 'Payments', MonthlyReport: 'Payments',
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
  Balances: 'כסף', Invoices: 'כסף', ExpenseTracker: 'כסף', MonthlyReport: 'כסף', Payments: 'כסף',
  BookingDetail: 'פרטי הזמנה',
  LeadDetail: 'פרטי פנייה',
  Onboarding: 'הקמת החשבון',
});

export function findNavItem(page) {
  for (const g of NAV_GROUPS) for (const i of g.items) if (i.page === page) return i;
  return null;
}
