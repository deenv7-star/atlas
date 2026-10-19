/**
 * In-app support (help bot + human handoff). Backend: Edge Function `support-chat` + migration 020.
 * Nothing here is a security boundary; RLS and the Edge Function decide what anyone can see or do.
 */
import { isSupabaseConfigured } from '@/api/supabaseClient';

/**
 * Kill switch: VITE_SUPPORT_CHAT=off hides the widget and the admin inbox. Otherwise the widget asks
 * the database at runtime whether migration 020 is there (supportApi.probe); without it, it shows the
 * WhatsApp fallback instead of a chat that cannot work.
 */
export const SUPPORT_ENABLED = String(import.meta.env.VITE_SUPPORT_CHAT || '').toLowerCase() !== 'off';
/** Local demo (no Supabase): conversations live in this browser, shared with the /admin demo inbox. */
export const SUPPORT_DEMO = !isSupabaseConfigured;
/** Demo only: a local dev server (supabase/functions/support-chat/dev/server.ts) that answers with the real prompt. */
export const SUPPORT_DEMO_URL = import.meta.env.VITE_SUPPORT_DEMO_URL || '';

/** Human channel that always works, even before 020 is applied. Same number as the landing page. */
export const SUPPORT_WHATSAPP = '972525979520';
export const SUPPORT_WHATSAPP_DISPLAY = '052-597-9520';
export const waSupportLink = (text = '') => `https://wa.me/${SUPPORT_WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Suggested questions per screen (first one is the most likely). */
const BY_PAGE = {
  '/calendar': ['איך מחברים את Booking.com?', 'איך חוסמים תאריכים?', 'הזמנה מ-Airbnb לא מופיעה בלוח'],
  '/bookings': ['איך רושמים הזמנה שקיבלתי בטלפון?', 'איך מבטלים הזמנה?', 'איך שולחים לאורח וואטסאפ?'],
  '/booking': ['איך רושמים מקדמה שהתקבלה?', 'איך שולחים הוראות הגעה בוואטסאפ?', 'איך מבטלים את ההזמנה?'],
  '/leads': ['איך הופכים ליד להזמנה?', 'איפה שומרים פנייה מפייסבוק?'],
  '/payments': ['איך מסמנים שאורח שילם?', 'איך מוציאים דוח לרואה החשבון?', 'atlas גובה כסף מאורחים?'],
  '/balances': ['איך שולחים תזכורת יתרה?', 'איך מסמנים יתרה כשולמה?'],
  '/integrations': ['איך מחברים את Booking.com?', 'איפה מוצאים את קישור היומן ב-Airbnb?'],
  '/settings': ['איך מוסיפים עוד חדר?', 'איך משנים את שעות הכניסה?', 'איך משנים סיסמה?'],
  '/subscription': ['כמה זה עולה?', 'מה קורה בסוף הניסיון?', 'איך מבטלים מנוי?'],
  '/messages': ['איך שולחים לאורח וואטסאפ?', 'אפשר הודעות אוטומטיות?'],
  '/automations': ['האוטומציות שולחות לבד?', 'איך שולחים לאורח וואטסאפ?'],
};
const DEFAULT_Q = ['איך מחברים את Booking.com?', 'איך מוסיפים עוד חדר?', 'איך שולחים לאורח וואטסאפ?', 'כמה זה עולה?'];
export function suggestionsFor(pathname = '') {
  const key = Object.keys(BY_PAGE).find((k) => pathname === k || pathname.startsWith(`${k}/`));
  const list = key ? BY_PAGE[key] : [];
  return [...new Set([...list, ...DEFAULT_Q])].slice(0, 4);
}
