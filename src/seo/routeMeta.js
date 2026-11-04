import { DEFAULT_DESCRIPTION, DEFAULT_PAGE_TITLE } from '@/seo/siteConfig';

/** Exact pathname (no query) → SEO fields */
const EXACT = {
  '/': {
    title: DEFAULT_PAGE_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  '/login': {
    robots: 'noindex,follow', // account screens are not search targets (A18/SEO-003)
    title: 'התחברות | atlas',
    description: 'כניסה לחשבון atlas: ההזמנות, התשלומים וההודעות של הצימר.',
  },
  '/register': {
    robots: 'noindex,follow', // account screens are not search targets (A18/SEO-003)
    title: 'הרשמה | atlas',
    description: 'פתיחת חשבון atlas: ניהול מתחמי נופש ואירוח בישראל.',
  },
  '/verify-email': {
    title: 'אימות אימייל | atlas',
    description: 'אימות כתובת האימייל לחשבון atlas.',
  },
  '/reset-password': {
    robots: 'noindex,follow', // account screens are not search targets (A18/SEO-003)
    title: 'איפוס סיסמה | atlas',
    description: 'איפוס סיסמה לחשבון atlas.',
  },
  '/update-password': {
    title: 'סיסמה חדשה | atlas',
    description: 'הגדרת סיסמה חדשה לחשבון atlas.',
  },
  '/onboarding': {
    title: 'הגדרת חשבון | atlas',
    description: 'סיום ההרשמה והגדרת העסק.',
  },
  '/dashboard': {
    title: 'היום | atlas',
    description: 'מה קורה היום בצימר: כניסות, יציאות, תשלומים והודעות.',
  },
  '/about': {
    title: 'אודות atlas',
    description: 'מי אנחנו ולמה בנינו את atlas לבעלי צימרים ומתחמי נופש.',
  },
  '/contact': {
    title: 'יצירת קשר | atlas',
    description: 'איך פונים לצוות atlas: וואטסאפ, טופס ומייל, בעברית.',
  },
  '/privacy': {
    title: 'מדיניות פרטיות | atlas',
    description: 'מדיניות הפרטיות של atlas.',
  },
  '/terms': {
    title: 'תקנון ותנאי שימוש | atlas',
    description: 'תנאי השימוש בשירות atlas.',
  },
  '/status': {
    title: 'סטטוס מערכת | atlas',
    description: 'מצב זמינות השירות והמערכת.',
  },
  '/guest-service': {
    title: 'בקשה מהמארחים | atlas',
    description: 'טופס לאורחים: תקלה, בקשה או שאלה בזמן השהייה.',
  },
  '/data-security': {
    title: 'אבטחת מידע | atlas',
    description: 'איך atlas שומר על המידע שלכם ושל האורחים.',
  },
  '/accessibility': {
    title: 'נגישות | atlas',
    description: 'מידע על נגישות השירות atlas.',
  },
  '/sla': {
    title: 'SLA | atlas',
    description: 'הסכם רמת שירות (SLA) של atlas.',
  },
  '/how-it-works': {
    title: 'איך זה עובד | atlas',
    description: 'איך הזמנות מ-Booking ו-Airbnb נכנסות ללוח אחד, ומה קורה כשיש חפיפה.',
  },
  '/pricing': {
    title: 'מחירי מערכת ניהול לצימרים: מ-₪399 לחודש, 14 יום חינם | atlas',
    description:
      'המחירים של atlas לצימרים ומתחמי נופש: 3 חבילות ניהול לפי מספר המתחמים, 14 יום חינם, בלי כרטיס אשראי, ותמיכה אנושית 24/7.',
  },
  '/billing': {
    title: 'חיובים | atlas',
    description: 'ניהול חיוב ותשלומים בחשבון atlas.',
  },
  '/subscription': {
    title: 'מנוי | atlas',
    description: 'ניהול מנוי וחבילות atlas.',
  },
  '/platform-admin': {
    title: 'ניהול פלטפורמה | atlas',
    description: 'כלי ניהול פלטפורמה.',
  },
};

const PREFIX = [
  { test: /^\/admin(\/|$)/, title: 'ניהול atlas' },
  { test: /^\/booking\/.+/, title: 'פרטי הזמנה | atlas' },
  { test: /^\/lead\/.+/, title: 'פרטי פנייה | atlas' },
];

const SEGMENT_TITLE = {
  bookings: 'הזמנות | atlas',
  leads: 'פניות | atlas',
  messages: 'הודעות | atlas',
  calendar: 'יומן | atlas',
  settings: 'הגדרות | atlas',
  invoices: 'מסמכי תשלום | atlas',
  payments: 'תשלומים | atlas',
  reviews: 'ביקורות | atlas',
  cleaning: 'ניקיון | atlas',
  contracts: 'חוזים | atlas',
  automations: 'הודעות לאורחים | atlas',
  integrations: 'ערוצים וחיבורים | atlas',
  'ai-assistant': 'עוזר אישי | atlas',
  'revenue-intelligence': 'הכנסות | atlas',
  'owner-reports': 'דוחות בעלים | atlas',
  'guest-journey': 'הודעות לאורחים | atlas',
  'guest-portal': 'דף אורח והזמנה ישירה | atlas',
  'dynamic-pricing': 'תמחור חגים וסופ״ש | atlas',
  'expense-tracker': 'הוצאות | atlas',
  today: 'היום | atlas',
  balances: 'יתרות | atlas',
  'monthly-report': 'דוח חודשי | atlas',
  subscription: 'מנוי | atlas',
  billing: 'חיובים | atlas',
  g: 'פרטי השהייה | atlas',
  book: 'הזמנה ישירה | atlas',
  'service-requests': 'בקשות שירות | atlas',
  setup: 'הגדרה ראשונית | atlas',
};

function normalizePath(pathname) {
  if (!pathname) return '/';
  const p = pathname.split('?')[0];
  if (p === '') return '/';
  return p.endsWith('/') && p.length > 1 ? p.slice(0, -1) : p;
}

export function getRouteMeta(pathname) {
  const path = normalizePath(pathname);
  if (EXACT[path]) {
    return { title: EXACT[path].title, description: EXACT[path].description, canonicalPath: path, robots: EXACT[path].robots };
  }
  for (const { test, title } of PREFIX) {
    if (test.test(path)) {
      return { title, description: DEFAULT_DESCRIPTION, canonicalPath: path };
    }
  }
  const seg = path.replace(/^\//, '').split('/')[0].toLowerCase();
  if (seg && SEGMENT_TITLE[seg]) {
    return {
      title: SEGMENT_TITLE[seg],
      description: DEFAULT_DESCRIPTION,
      canonicalPath: path,
    };
  }
  // Unknown path: the SPA renders the 404 page, which must not be indexed.
  const known = /^\/(admin|onboarding|dev)(\/|$)/.test(path);
  return {
    title: known ? DEFAULT_PAGE_TITLE : 'הדף לא נמצא | atlas',
    description: DEFAULT_DESCRIPTION,
    canonicalPath: path,
    notFound: !known,
  };
}
