import { DEFAULT_DESCRIPTION, DEFAULT_PAGE_TITLE } from '@/seo/siteConfig';

/** Exact pathname (no query) → SEO fields */
const EXACT = {
  '/': {
    title: DEFAULT_PAGE_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  '/login': {
    title: 'התחברות | ATLAS',
    description: 'התחברות לחשבון ATLAS לניהול נכסי אירוח, הזמנות ותשלומים.',
  },
  '/register': {
    title: 'הרשמה | ATLAS',
    description: 'פתיחת חשבון ATLAS — ניהול מתחמי נופש ואירוח בישראל.',
  },
  '/verify-email': {
    title: 'אימות אימייל | ATLAS',
    description: 'אימות כתובת האימייל לחשבון ATLAS.',
  },
  '/reset-password': {
    title: 'איפוס סיסמה | ATLAS',
    description: 'איפוס סיסמה לחשבון ATLAS.',
  },
  '/update-password': {
    title: 'סיסמה חדשה | ATLAS',
    description: 'הגדרת סיסמה חדשה לחשבון ATLAS.',
  },
  '/onboarding': {
    title: 'הגדרת חשבון | ATLAS',
    description: 'סיום ההרשמה והגדרת הארגון ב-ATLAS.',
  },
  '/dashboard': {
    title: 'דשבורד | ATLAS',
    description: 'סקירת הזמנות, לידים, תשלומים וביצועים — ATLAS.',
  },
  '/about': {
    title: 'אודות ATLAS',
    description: 'מי אנחנו ומהי חזון הפלטפורמה לניהול נכסי אירוח בישראל.',
  },
  '/contact': {
    title: 'צור קשר | ATLAS',
    description: 'יצירת קשר עם צוות ATLAS לתמיכה ומכירות.',
  },
  '/privacy': {
    title: 'מדיניות פרטיות | ATLAS',
    description: 'מדיניות הפרטיות של ATLAS.',
  },
  '/terms': {
    title: 'תנאי שימוש | ATLAS',
    description: 'תנאי השימוש בשירות ATLAS.',
  },
  '/changelog': {
    title: 'יומן שינויים | ATLAS',
    description: 'עדכוני מוצר וגרסאות ATLAS.',
  },
  '/status': {
    title: 'סטטוס מערכת | ATLAS',
    description: 'מצב זמינות השירות והמערכת.',
  },
  '/guest-service': {
    title: 'שירות חדרים | ATLAS',
    description: 'שירות אורחים וחוויית אירוח.',
  },
  '/data-security': {
    title: 'אבטחת מידע | ATLAS',
    description: 'אבטחת מידע והגנת נתונים ב-ATLAS.',
  },
  '/accessibility': {
    title: 'נגישות | ATLAS',
    description: 'מידע על נגישות השירות ATLAS.',
  },
  '/sla': {
    title: 'SLA | ATLAS',
    description: 'הסכם רמת שירות (SLA) ל-ATLAS.',
  },
  '/api-docs': {
    title: 'תיעוד API | ATLAS',
    description: 'תיעוד ממשק ה-API של ATLAS.',
  },
  '/how-it-works': {
    title: 'איך זה עובד | ATLAS',
    description: 'איך ATLAS מסנכרנת ערוצי הזמנה ומונעת הזמנות כפולות — זרימת נתונים וכללי התנגשות.',
  },
  '/pricing': {
    title: 'תמחור ותוכניות | ATLAS',
    description:
      'תמחור ATLAS לניהול צימרים ומתחמי נופש: חבילה בסיסית, מתקדמת ו-Enterprise. השוואת תכונות, מחירים להמחשה וצור קשר להצעה.',
  },
  '/billing': {
    title: 'חיוב | ATLAS',
    description: 'ניהול חיוב ותשלומים ב-ATLAS.',
  },
  '/subscription': {
    title: 'מנוי | ATLAS',
    description: 'ניהול מנוי וחבילות ATLAS.',
  },
  '/platform-admin': {
    title: 'ניהול פלטפורמה | ATLAS',
    description: 'כלי ניהול פלטפורמה.',
  },
};

const PREFIX = [
  { test: /^\/booking\/.+/, title: 'פרטי הזמנה | ATLAS' },
  { test: /^\/lead\/.+/, title: 'פרטי ליד | ATLAS' },
];

const SEGMENT_TITLE = {
  bookings: 'הזמנות | ATLAS',
  leads: 'לידים | ATLAS',
  messages: 'הודעות | ATLAS',
  calendar: 'לוח שנה | ATLAS',
  settings: 'הגדרות | ATLAS',
  invoices: 'חשבוניות | ATLAS',
  payments: 'תשלומים | ATLAS',
  reviews: 'ביקורות | ATLAS',
  cleaning: 'ניקיון | ATLAS',
  contracts: 'חוזים | ATLAS',
  automations: 'אוטומציות | ATLAS',
  integrations: 'אינטגרציות | ATLAS',
  'ai-assistant': 'AI עוזר | ATLAS',
  'revenue-intelligence': 'מודיעין הכנסות | ATLAS',
  'owner-reports': 'דוחות בעלים | ATLAS',
  'guest-journey': 'מסע אורח | ATLAS',
  'guest-portal': 'פורטל אורחים | ATLAS',
  'dynamic-pricing': 'תמחור דינאמי | ATLAS',
  'expense-tracker': 'מעקב הוצאות | ATLAS',
  'service-requests': 'בקשות שירות | ATLAS',
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
  return {
    title: DEFAULT_PAGE_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: path,
  };
}
