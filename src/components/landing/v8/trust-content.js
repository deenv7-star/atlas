/**
 * Trust section content (landing). Every line here was checked on 18.10.2026 against the code and
 * the public legal pages; the source of each claim is in its comment. Do not add a claim that is
 * not in those sources. No reviews, ratings, customer counts or logos (see src/config/testimonials.js).
 * No founder letter / personal framing and no "we're new" copy (Deen, 18.10.2026): the section speaks
 * only through written promises and the does / not-yet list.
 */
import { CreditCard, DoorOpen, Download, ShieldCheck, Lock, MessageCircle } from 'lucide-react';
import { WHATSAPP_URL } from '@/config/legal';

/** Promises that are also written in the terms / policies. `href` = where it is written. */
export const PROMISES = [
  // terms.md #pricing + cancellation.md #trial
  { I: CreditCard, t: '14 יום ניסיון, בלי כרטיס אשראי', d: 'אין פרטי תשלום, ולכן בסוף הניסיון אין חיוב אוטומטי.', href: '/cancellation#trial', src: 'מדיניות ביטול' },
  // terms.md #cancellation + cancellation.md #how
  { I: DoorOpen, t: 'בלי התחייבות', d: 'מפסיקים מתי שרוצים, בהודעה אחת: וואטסאפ, טלפון או טופס באתר.', href: '/cancellation#how', src: 'מדיניות ביטול' },
  // terms.md #your-data, security.md #export; code: src/lib/csvExport.js (Bookings, Leads, Payments), MonthlyReport
  { I: Download, t: 'הנתונים שלכם, שלכם', d: 'מייצאים בכל רגע הזמנות, לידים ותשלומים ל-CSV, ואת הדוח החודשי ל-PDF.', href: '/data-security#export', src: 'אבטחת מידע' },
  // security.md #isolation #https #where; legal.js SUBPROCESSORS (Supabase eu-central-1)
  { I: ShieldCheck, t: 'כל עסק רואה רק את שלו', d: 'הפרדה ברמת מסד הנתונים, חיבור מוצפן ב-HTTPS, ושרתים באירופה (AWS, פרנקפורט).', href: '/data-security#isolation', src: 'אבטחת מידע' },
  // security.md #payments, privacy.md
  { I: Lock, t: 'לא נוגעים בכסף של האורחים', d: 'ATLAS לא סולקת ולא שומרת פרטי כרטיס. היא רק רושמת את מה שקיבלתם.', href: '/data-security#payments', src: 'אבטחת מידע' },
  // FAQ (content.js) + WhatsApp number in legal.js
  { I: MessageCircle, t: 'עברית מלאה, ובן אדם בוואטסאפ', d: 'כל המערכת מימין לשמאל. כותבים, ועונה לכם אדם.', href: WHATSAPP_URL, src: 'וואטסאפ', ext: true },
];

/** What ATLAS does today and what it does not do yet (support KB 13-limitations.md, FAQ). */
export const DOES = [
  'לוח אחד ל-Booking.com ול-Airbnb בקישורי iCal, מתעדכן כל 15 דקות',
  'הודעות וואטסאפ לאורחים מוכנות בזמן, ונשלחות בלחיצה מהוואטסאפ שלכם',
  'מעקב מקדמות ויתרות, ודוח חודשי ב-CSV או PDF לרואה החשבון',
];
export const NOT_YET = [
  'לא גובה כסף מאורחים: התשלום נשאר אצלכם, כמו היום',
  'לא מפיקה חשבונית מס רשמית: מפיקים בתוכנת החשבוניות שלכם',
  'לא משנה מחירים בתוך Booking.com או Airbnb: החיבור הוא ב-iCal, לא ב-API',
];
