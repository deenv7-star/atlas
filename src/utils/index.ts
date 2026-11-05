const pagePathMap: Record<string, string> = {
  Landing: '/',
  Dashboard: '/dashboard',
  About: '/about',
  Privacy: '/privacy',
  Terms: '/terms',
  Contact: '/contact',
  Status: '/status',
  GuestService: '/guest-service',
  DataSecurity: '/data-security',
  Accessibility: '/accessibility',
  SLA: '/sla',
  HowItWorks: '/how-it-works',
  PricingPlans: '/pricing',
  Bookings: '/bookings',
  Leads: '/leads',
  Messages: '/messages',
  MultiCalendar: '/calendar',
  Settings: '/settings',
  Subscription: '/subscription',
  Billing: '/billing',
  Invoices: '/invoices',
  Payments: '/payments',
  Reviews: '/reviews',
  Cleaning: '/cleaning',
  Automations: '/automations',
  Integrations: '/integrations',
  AIAssistant: '/ai-assistant',
  RevenueIntelligence: '/revenue-intelligence',
  OwnerReports: '/owner-reports',
  GuestJourney: '/guest-journey',
  DynamicPricing: '/dynamic-pricing',
  GuestPortal: '/guest-portal',
  Contracts: '/contracts',
  ExpenseTracker: '/expense-tracker',
  BookingDetail: '/booking',
  LeadDetail: '/lead',
  PlatformAdmin: '/platform-admin',
  ServiceRequests: '/service-requests',
  Today: '/today',
  Balances: '/balances',
  MonthlyReport: '/monthly-report',
  Onboarding: '/onboarding',
  Login: '/login',
  Register: '/register',
  VerifyEmail: '/verify-email',
  ResetPassword: '/reset-password',
  UpdatePassword: '/update-password',
};

export function createPageUrl(pageName: string) {
  return pagePathMap[pageName] ?? '/' + pageName.replace(/ /g, '-');
}

/**
 * ecosystem v1 #24: a legacy PascalCase / wrong-case path ("/MonthlyReport", "/expensetracker") → its canonical path,
 * or null when the first segment is not a page key. Case-insensitive; keeps the rest of the path, query and hash.
 */
export function canonicalPathFor(pathname: string, search = '', hash = ''): string | null {
  const parts = String(pathname || '').split('/');
  const seg = (parts[1] || '').toLowerCase();
  if (!seg) return null;
  for (const [key, p] of Object.entries(pagePathMap)) {
    if (key.toLowerCase() === seg && p.toLowerCase() !== ('/' + seg)) {
      const rest = parts.slice(2).join('/');
      return p + (rest ? '/' + rest : '') + (search || '') + (hash || '');
    }
  }
  return null;
}

/** First URL segment → React page key (for analytics / matching). */
export function getPageKeyFromPathname(pathname: string): string | null {
  if (!pathname || pathname === '/') return 'Landing';
  const seg = pathname.replace(/^\//, '').split('/')[0].toLowerCase();
  for (const [key, p] of Object.entries(pagePathMap)) {
    const base = p.replace(/^\//, '').split('/')[0].toLowerCase();
    if (base === seg) return key;
  }
  return null;
}
