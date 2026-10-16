/**
 * One navigation map for the whole app: sidebar, mobile tab bar, "more" sheet and
 * command palette read these labels, so a screen is called the same thing everywhere.
 * Labels follow the glossary in docs/brand.md.
 */
import {
  Sun, CalendarRange, CalendarDays, Users, MessageSquare, Star, Sparkles as SparklesIcon,
  Brush, Headset, FileSignature, Zap, Wallet, FileText, TrendingDown, BarChart3,
  FileBarChart, Tags, Link2, Route, Globe, CreditCard, Receipt, Settings, Shield,
  LayoutGrid, Scale, FileSpreadsheet,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    id: 'daily',
    label: null,
    items: [
      { page: 'Today', label: 'היום', icon: Sun },
      { page: 'Dashboard', label: 'סקירה', icon: LayoutGrid },
      { page: 'MultiCalendar', label: 'לוח שנה', icon: CalendarRange },
      { page: 'Bookings', label: 'הזמנות', icon: CalendarDays },
      { page: 'Leads', label: 'לידים', icon: Users },
      { page: 'Messages', label: 'הודעות', icon: MessageSquare },
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
    id: 'money',
    label: 'כספים',
    items: [
      { page: 'Payments', label: 'תשלומים', icon: Wallet },
      { page: 'Balances', label: 'מקדמות ויתרות', icon: Scale },
      { page: 'MonthlyReport', label: 'דוח חודשי', icon: FileSpreadsheet },
      { page: 'Invoices', label: 'חשבוניות', icon: FileText },
      { page: 'ExpenseTracker', label: 'הוצאות', icon: TrendingDown },
      { page: 'RevenueIntelligence', label: 'הכנסות', icon: BarChart3 },
      { page: 'DynamicPricing', label: 'תמחור דינמי', icon: Tags },
      { page: 'OwnerReports', label: 'דוחות בעלים', icon: FileBarChart },
    ],
  },
  {
    id: 'guests',
    label: 'חוויית אורח',
    items: [
      { page: 'GuestJourney', label: 'מסע אורח', icon: Route },
      { page: 'GuestPortal', label: 'דף אורח והזמנה ישירה', icon: Globe },
      { page: 'AIAssistant', label: 'עוזר AI', icon: SparklesIcon },
    ],
  },
  {
    id: 'account',
    label: 'חשבון',
    items: [
      { page: 'Integrations', label: 'ערוצים וחיבורים', icon: Link2 },
      { page: 'Subscription', label: 'מנוי', icon: CreditCard },
      { page: 'Billing', label: 'חיובים', icon: Receipt },
      { page: 'Settings', label: 'הגדרות', icon: Settings },
    ],
  },
];

export const PLATFORM_ITEM = { page: 'PlatformAdmin', label: 'פלטפורמה', icon: Shield };

/** Mobile tab bar: four destinations around a central "new booking" action. */
export const TAB_BAR = ['Today', 'MultiCalendar', '__new__', 'Bookings', '__more__'];

export const PAGE_TITLES = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items).concat([PLATFORM_ITEM]).map((i) => [i.page, i.label]),
);
Object.assign(PAGE_TITLES, {
  BookingDetail: 'פרטי הזמנה',
  LeadDetail: 'פרטי ליד',
  Onboarding: 'הקמת החשבון',
});

export function findNavItem(page) {
  for (const g of NAV_GROUPS) for (const i of g.items) if (i.page === page) return i;
  return null;
}
