/**
 * Public, non-blog site pages (legal, trust, about, contact).
 * Body copy lives in ./content/pages/*.md and is rendered by the shared Markdown renderer.
 */
import privacy from './content/pages/privacy.md?raw';
import terms from './content/pages/terms.md?raw';
import accessibility from './content/pages/accessibility.md?raw';
import cookies from './content/pages/cookies.md?raw';
import cancellation from './content/pages/cancellation.md?raw';
import dataProcessing from './content/pages/data-processing.md?raw';
import security from './content/pages/security.md?raw';
import about from './content/pages/about.md?raw';

export const SITE_PAGES = {
  '/about': {
    key: 'about', kind: 'about', md: about,
    title: 'אודות ATLAS',
    seoTitle: 'אודות ATLAS: מערכת ניהול בעברית לצימרים ומתחמי נופש',
    lede: 'מערכת אחת, בעברית, לכל מה שבעל צימר מנהל ביום-יום.',
    description: 'מה זה ATLAS, למה בנינו אותה ובמה אנחנו מאמינים: מערכת ניהול בעברית לצימרים, וילות ומתחמי נופש בישראל, עם 14 ימי ניסיון בחינם.',
    group: 'company',
  },
  '/contact': {
    key: 'contact', kind: 'contact', md: null,
    title: 'יצירת קשר',
    seoTitle: 'יצירת קשר עם ATLAS | וואטסאפ ותמיכה בעברית',
    lede: 'הכי מהיר בוואטסאפ. אדם עונה, בעברית.',
    description: 'איך פונים ל-ATLAS: וואטסאפ לתמיכה ולשאלות לפני הרשמה, טופס פנייה, ביטול מנוי, פרטיות ונגישות.',
    group: 'company',
  },
  '/privacy': {
    key: 'privacy', kind: 'legal', md: privacy, updated: '2026-10-18',
    title: 'מדיניות פרטיות',
    seoTitle: 'מדיניות פרטיות | ATLAS',
    lede: 'איזה מידע אנחנו אוספים, למה, ומה הזכויות שלכם.',
    description: 'מדיניות הפרטיות של ATLAS לפי חוק הגנת הפרטיות ותיקון 13: איזה מידע נאסף, למי הוא נמסר, איפה הוא נשמר ואיך מממשים זכות עיון, תיקון ומחיקה.',
    group: 'legal',
  },
  '/terms': {
    key: 'terms', kind: 'legal', md: terms, updated: '2026-10-18',
    title: 'תקנון ותנאי שימוש',
    seoTitle: 'תקנון ותנאי שימוש | ATLAS',
    lede: 'התקנון של ATLAS, בשפה ברורה: אספקת השירות, אחריות, ביטול והחזרים ופרטיות.',
    description: 'התקנון ותנאי השימוש של ATLAS: אספקת השירות ומועדי אספקה (גישה מיידית, 14 ימי ניסיון), אחריות העסק, ביטול והחזרים (השירות או הכסף בחזרה), פרטיות, ומה המערכת עושה ומה לא.',
    group: 'legal',
  },
  '/cancellation': {
    key: 'cancellation', kind: 'legal', md: cancellation, updated: '2026-10-18',
    title: 'מדיניות ביטול עסקה',
    seoTitle: 'מדיניות ביטול עסקה ומנוי | ATLAS',
    lede: 'איך מבטלים מנוי, מתי החיוב נעצר ומה עם החזרים.',
    description: 'איך מבטלים מנוי ל-ATLAS: דרכי מסירת הודעת ביטול, עצירת חיוב בתוך 3 ימי עסקים, ביטול בתוך 14 יום לפי חוק הגנת הצרכן, ומה קורה לנתונים.',
    group: 'legal',
  },
  '/accessibility': {
    key: 'accessibility', kind: 'legal', md: accessibility, updated: '2026-10-18',
    title: 'הצהרת נגישות',
    seoTitle: 'הצהרת נגישות | ATLAS',
    lede: 'מה הונגש, מה עוד לא, ואיך מדווחים על בעיה.',
    description: 'הצהרת הנגישות של ATLAS לפי תקנות נגישות לשירות ות"י 5568 (WCAG 2.0 AA): ההתאמות שבוצעו, מגבלות ידועות, רכז הנגישות ודרכי פנייה.',
    group: 'legal',
  },
  '/cookies': {
    key: 'cookies', kind: 'legal', md: cookies, updated: '2026-10-18',
    title: 'מדיניות עוגיות',
    seoTitle: 'מדיניות עוגיות ואחסון בדפדפן | ATLAS',
    lede: 'מה נשמר בדפדפן שלכם, ולמה. בלי עוגיות מעקב.',
    description: 'אילו עוגיות ונתוני אחסון מקומי ATLAS שומרת בדפדפן ולמה: רק מה שנדרש להתחברות ולפעולת האתר, בלי פרסום ובלי כלי מעקב.',
    group: 'legal',
  },
  '/data-processing': {
    key: 'data-processing', kind: 'legal', md: dataProcessing, updated: '2026-10-18',
    title: 'עיבוד מידע עבור לקוחות',
    seoTitle: 'הסכם עיבוד מידע (פרטי אורחים ולידים) | ATLAS',
    lede: 'איך אנחנו מחזיקים בשבילכם את פרטי האורחים והלידים.',
    description: 'מסמך עיבוד המידע של ATLAS לפי תקנה 15 לתקנות אבטחת מידע: איזה מידע מוחזק עבור בעלי הצימרים, למטרה מה, אצל אילו ספקים, ומה קורה בסיום.',
    group: 'legal',
  },
  '/data-security': {
    key: 'data-security', kind: 'legal', md: security, updated: '2026-10-18',
    title: 'אבטחת מידע',
    seoTitle: 'אבטחת מידע ב-ATLAS: מה קיים, בכנות',
    lede: 'רק מה שבדקנו בקוד ובהגדרות השרתים.',
    description: 'איך ATLAS מגנה על הנתונים: שרתי Supabase ב-AWS פרנקפורט, הפרדה בין חשבונות (Row Level Security), HTTPS עם HSTS, אימות אימייל וייצוא נתונים.',
    group: 'legal',
  },
};

export { FOOTER_GROUPS } from './footerLinks';
