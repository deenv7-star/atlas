/**
 * Demo portraits for the local / demo workspace (VITE_ALLOW_LOCAL_DEMO or dev without Supabase).
 * Real workspaces never get a stock face for a real guest: they show the photo the record carries
 * (avatar_url / photo_url) or cool initials. Portraits: public/demo/people (Unsplash License).
 */
import { isSupabaseConfigured } from '@/api/supabaseClient';

export const DEMO_PEOPLE = !isSupabaseConfigured && (import.meta.env.DEV || import.meta.env.VITE_ALLOW_LOCAL_DEMO === 'true');

const FEMALE = ['נועה', 'מיכל', 'אורית', 'יעל', 'שרה', 'sarah', 'עדי', 'מורן', 'חן', 'ליה', 'גלית', 'הדס', 'anna', 'רותם', 'שני', 'נטע', 'מאיה', 'שירן', 'נוי', 'דנה', 'תמר', 'מיה', 'רונית', 'אסנת', 'שירה', 'הילה', 'ענבל', 'לימור', 'קרן', 'אביטל', 'רחל', 'אילנה', 'ליאת', 'סיגל', 'efrat', 'אפרת'];
const MALE = ['אלון', 'דור', 'daniel', 'גיל', 'עומר', 'רוני', 'אביב', 'אסף', 'ליאור', 'רון', 'שחר', 'tom', 'נדב', 'עמית', 'אלעד', 'טל', 'יוסי', 'משה', 'דוד', 'איתי', 'עידו', 'ניר', 'אבי', 'יונתן', 'אורי', 'בן', 'מתן', 'רועי', 'אריאל', 'ערן', 'david', 'michael'];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** The person a booking name is about: "קבוצת חברים - רותם" → רותם, "יעל ועומר כהן" → יעל. */
function leadName(name) {
  const s = String(name || '').trim();
  const afterDash = s.split(/\s[-–]\s/)[1];
  if (/^קבוצת/.test(s) && afterDash) return afterDash.trim();
  return s.replace(/\s[-–]\s.*$/, '').replace(/^(משפחת|קבוצת)\s+/, '').trim();
}

/** A stable demo portrait for a name, or null outside demo mode. */
export function demoPortrait(name, { owner = false } = {}) {
  if (!DEMO_PEOPLE) return null;
  if (owner) return '/demo/people/owner.webp';
  const full = String(name || '').trim();
  if (!full) return null;
  const first = leadName(full).split(/\s+/)[0]?.toLowerCase() || '';
  const h = hash(full);
  let pool = FEMALE.includes(first) ? 'f' : MALE.includes(first) ? 'm' : (h % 2 ? 'f' : 'm');
  return `/demo/people/${pool}${(h % 8) + 1}.webp`;
}
