import { DEFAULT_DESCRIPTION, DEFAULT_PAGE_TITLE } from '@/seo/siteConfig';

/** Exact pathname (no query) → SEO fields */
const EXACT = {
  '/': {
    title: DEFAULT_PAGE_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  '/login': {
    title: 'התחברות | atlas',
    description: 'התחברות לחשבון atlas לניהול נכסי אירוח, הזמנות ותשלומים.',
  },
  '/register': {
    title: 'הרשמה | atlas',
    description: 'פתיחת חשבון atlas: ניהול מתחמי נופש ואירוח בישראל.',
  },
  '/verify-email': {
    title: 'אימות אימייל | atlas',
    description: 'אימות כתובת האימייל לחשבון atlas.',
  },
  '/reset-password': {
    title: 'איפוס סיסמה | atlas',
    description: 'איפוס סיסמה לחשבון atlas.',
  },
  '/update-password': {
    title: 'סיסמה חדשה | atlas',
    description: 'הגדרת סיסמה חדשה לחשבון atlas.',
  },
  '/onboarding': {
    title: 'הגדרת חשבון | atlas',
    description: 'סיום ההרשמה והגדרת הארגון ב-atlas.',
  },
  '/dashboard': {
    title: 'היום | atlas',
    description: 'סקירת הזמנות, לידים, תשלומים וביצועים: atlas.',
  },
  '/about': {
    title: 'אודות atlas',
    description: 'מי אנחנו ומהי חזון הפלטפורמה לניהול נכסי אירוח בישראל.',
  },
  '/contact': {
    title: 'יצירת קשר | atlas',
    description: 'יצירת קשר עם צוות atlas לתמיכה ומכירות.',
  },
  '/privacy': {
    title: 'מדיניות פרטיות | atlas',
    description: 'מדיניות הפרטיות של atlas.',
  },
  '/terms': {
    title: 'תקנון ותנאי שימוש | atlas',
    description: 'תנאי השימוש בשירות atlas.',
  },
  '/changelog': {
    title: 'יומן שינויים | atlas',
    description: 'עדכוני מוצר וגרסאות atlas.',
  },
  '/status': {
    title: 'סטטוס מערכת | atlas',
    description: 'מצב זמינות השירות והמערכת.',
  },
  '/guest-service': {
    title: 'שירות חדרים | atlas',
    description: 'שירות אורחים וחוויית אירוח.',
  },
  '/data-security': {
    title: 'אבטחת מידע | atlas',
    description: 'אבטחת מידע והגנת נתונים ב-atlas.',
  },
  '/accessibility': {
    title: 'נגישות | atlas',
    description: 'מידע על נגישות השירות atlas.',
  },
  '/sla': {
    title: 'SLA | atlas',
    description: 'הסכם רמת שירות (SLA) ל-atlas.',
  },
  '/api-docs': {
    title: 'תיעוד API | atlas',
    description: 'תיעוד ממשק ה-API של atlas.',
  },
  '/how-it-works': {
    title: 'איך זה עובד | atlas',
    description: 'איך atlas מסנכרנת ערוצי הזמנה ומונעת הזמנות כפולות: זרימת נתונים וכללי התנגשות.',
  },
  '/pricing': {
    title: 'תמחור ותוכניות | atlas',
    description:
      'תמחור atlas לניהול צימרים ומתחמי נופש: חבילה בסיסית, מתקדמת ו-Enterprise. השוואת תכונות, מחירים להמחשה וצור קשר להצעה.',
  },
  '/billing': {
    title: 'חיובים | atlas',
    description: 'ניהול חיוב ותשלומים ב-atlas.',
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
  { test: /^\/lead\/.+/, title: 'פרטי ליד | atlas' },
];

const SEGMENT_TITLE = {
  bookings: 'הזמנות | atlas',
  leads: 'לידים | atlas',
  messages: 'הודעות | atlas',
  calendar: 'לוח שנה | atlas',
  settings: 'הגדרות | atlas',
  invoices: 'חשבוניות | atlas',
  payments: 'תשלומים | atlas',
  reviews: 'ביקורות | atlas',
  cleaning: 'ניקיון | atlas',
  contracts: 'חוזים | atlas',
  automations: 'אוטומציות | atlas',
  integrations: 'ערוצים וחיבורים | atlas',
  'ai-assistant': 'עוזר AI | atlas',
  'revenue-intelligence': 'ניתוח הכנסות | atlas',
  'owner-reports': 'דוחות בעלים | atlas',
  'guest-journey': 'מסע אורח | atlas',
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
    return { title: EXACT[path].title, description: EXACT[path].description, canonicalPath: path };
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
