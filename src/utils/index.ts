const pagePathMap: Record<string, string> = {
  Landing: '/',
  Dashboard: '/dashboard',
  About: '/about',
  Privacy: '/privacy',
  Terms: '/terms',
  Contact: '/contact',
  Changelog: '/changelog',
  Status: '/status',
  GuestService: '/guest-service',
  DataSecurity: '/data-security',
  Accessibility: '/accessibility',
  SLA: '/sla',
  ApiDocs: '/api-docs',
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
};

export function createPageUrl(pageName: string) {
  return pagePathMap[pageName] ?? '/' + pageName.replace(/ /g, '-');
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
