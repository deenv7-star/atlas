/**
 * Trust section content (landing), v3: four visual promises, a 2-5 word label each.
 * Every item was checked on 18.10.2026 against the code and the public legal pages; the source of each
 * claim is in its comment and `href` points at where it is written. Do not add a claim that is not in
 * those sources. No reviews, ratings, customer counts, logos or founder content
 * (see src/config/testimonials.js). The mock-ups in TrustMocks.jsx only illustrate these same claims.
 */

export const TRUST = [
  // terms.md #pricing ("14 ימי ניסיון בחינם, בלי כרטיס אשראי ... אין חיוב אוטומטי"), cancellation.md #trial
  { k: 'trial', label: 'ניסיון בלי כרטיס אשראי', href: '/terms#pricing', src: 'בתקנון' },
  // terms.md #cancellation ("אפשר להפסיק את המנוי בכל עת"); cancellation.md #how (WhatsApp, written confirmation)
  { k: 'cancel', label: 'ביטול בהודעה אחת', href: '/terms#cancellation', src: 'בתקנון' },
  // terms.md #your-data; security.md #export; code: src/lib/csvExport.js (Bookings, Leads, Payments), MonthlyReport PDF
  { k: 'export', label: 'הנתונים שלכם, לייצוא', href: '/terms#your-data', src: 'בתקנון' },
  // security.md #where (Supabase, AWS eu-central-1 Frankfurt) #https #isolation (RLS); legal.js SUBPROCESSORS
  { k: 'secure', label: 'שרתים באירופה, חיבור מוצפן', href: '/data-security#where', src: 'בדף האבטחה' },
];
