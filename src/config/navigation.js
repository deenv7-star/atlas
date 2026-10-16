/**
 * One navigation map for the whole app: sidebar, mobile tab bar, "more" sheet and
 * command palette read these labels, so a screen is called the same thing everywhere.
 * Labels follow the glossary in docs/brand.md.
 */
import {
  Sun, CalendarRange, CalendarDays, Users, MessageSquare, Star, Sparkles as SparklesIcon,
  Brush, Headset, FileSignature, Zap, Wallet, FileText, TrendingDown, BarChart3,
  FileBarChart, Tags, Link2, Route, Globe, CreditCard, Receipt, Settings, Shield,
} from 'lucide-react';

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
      { page: 'MultiCalendar', label: 'לוח שנה', icon: CalendarRange },
      { page: 'Bookings', label: 'הזמנות', icon: CalendarDays },
      { page: 'Leads', label: 'לידים', icon: Users },
      { page: 'Payments', label: 'כספים', icon: Wallet },
      { page: 'Messages', label: 'הודעות', icon: MessageSquare },
      { page: 'Settings', label: 'הגדרות', icon: Settings },
    ],
  },
  {
    id: 'ops',
    label: 'תפעול',
    items: [
      { page: 'Cleaning', label: 'ניקיון', icon: Brush },
      { page: 'ServiceRequests', label: 'בקשות שירות', icon: Headset },
      { page: 'Reviews', label: 'ביקורות', icon: Star },
      { page: 'Contracts', label: 'חוזים', icon: FileSignature },
      { page: 'Automations', label: 'אוטומציות', icon: Zap },
    ],
  },
  {
    id: 'guests',
    label: 'אורחים',
    items: [
      { page: 'GuestPortal', label: 'דף אורח והזמנה ישירה', icon: Globe },
      { page: 'GuestJourney', label: 'מסע אורח', icon: Route },
      { page: 'AIAssistant', label: 'עוזר AI', icon: SparklesIcon },
    ],
  },
  {
    id: 'insights',
    label: 'ניתוח',
    items: [
      { page: 'RevenueIntelligence', label: 'הכנסות', icon: BarChart3 },
      { page: 'DynamicPricing', label: 'תמחור דינמי', icon: Tags },
      { page: 'OwnerReports', label: 'דוחות בעלים', icon: FileBarChart },
    ],
  },
  {
    id: 'account',
    label: 'חשבון',
    items: [
      { page: 'Integrations', label: 'ערוצים וחיבורים', icon: Link2 },
      { page: 'Subscription', label: 'מנוי', icon: CreditCard },
      { page: 'Billing', label: 'חיובים', icon: Receipt },
    ],
  },
];

/** "כספים" is one place; these are its tabs. */
export const FINANCE_TABS = [
  { page: 'Payments', label: 'תשלומים' },
  { page: 'Balances', label: 'יתרות' },
  { page: 'Invoices', label: 'חשבוניות' },
  { page: 'ExpenseTracker', label: 'הוצאות' },
  { page: 'MonthlyReport', label: 'דוח חודשי' },
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
  Balances: 'כספים', Invoices: 'כספים', ExpenseTracker: 'כספים', MonthlyReport: 'כספים', Payments: 'כספים',
  BookingDetail: 'פרטי הזמנה',
  LeadDetail: 'פרטי ליד',
  Onboarding: 'הקמת החשבון',
});

export function findNavItem(page) {
  for (const g of NAV_GROUPS) for (const i of g.items) if (i.page === page) return i;
  return null;
}
