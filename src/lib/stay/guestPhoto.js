/**
 * Guest portrait for an avatar.
 *  1. a real photo on the record (guest_photo_url / avatar_url / photo_url) always wins;
 *  2. in the local demo only (no Supabase), the seeded guests get real free-licence portraits
 *     (public/demo/guests, Unsplash licence, see CREDITS.md) picked by first-name gender, stable per name;
 *  3. otherwise null, and the avatar falls back to cool initials. Real accounts never see stock faces.
 */
import { isSupabaseConfigured } from '@/api/supabaseClient';

const FEMALE = new Set([
  'נועה', 'מיכל', 'אורית', 'יעל', 'עדי', 'מורן', 'חן', 'שירה', 'הילה', 'קרן', 'דנה', 'ליה', 'הדס', 'מאיה', 'גלית', 'נוי',
  'שני', 'נטע', 'שירן', 'מירב', 'רותם', 'תמר', 'רוני', 'אור', 'sarah', 'anna', 'מיכאלה', 'ענבל', 'סיון', 'אפרת',
]);
const MALE = new Set([
  'אלון', 'דור', 'daniel', 'גיל', 'עומר', 'אביב', 'אסף', 'ליאור', 'טל', 'תומר', 'אבי', 'יונתן', 'רון', 'שחר', 'tom', 'נדב',
  'עמית', 'אלעד', 'דוד', 'משה', 'יוסי', 'איתי', 'עידו', 'רועי',
]);
// The demo user and a few seeded guests read better with a hand-picked face.
const PINNED = { 'יעל שמעוני': 'w07', 'רוני פרץ - יום הולדת 40': 'm04', 'משפחת לוי': 'w02', 'יעל ועומר כהן': 'w06', 'Sarah Klein': 'w01' };

const W = Array.from({ length: 11 }, (_, i) => `w${String(i + 1).padStart(2, '0')}`);
const M = Array.from({ length: 12 }, (_, i) => `m${String(i + 1).padStart(2, '0')}`);

function hash(s) {
  let h = 7;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const DEMO_PHOTOS = !isSupabaseConfigured;

export function guestPhoto(name, record) {
  const own = record?.guest_photo_url || record?.avatar_url || record?.photo_url;
  if (own) return own;
  if (!DEMO_PHOTOS) return null;
  const n = String(name || '').trim();
  if (!n) return null;
  if (PINNED[n]) return `/demo/guests/${PINNED[n]}.webp`;
  const first = n.replace(/^(משפחת|קבוצת חברים|קבוצת חברות|קבוצת)\s*-?\s*/, '').split(/[\s-]+/)[0]?.toLowerCase() || '';
  const pool = FEMALE.has(first) || /^קבוצת חברות/.test(n) ? W : MALE.has(first) ? M : [...W, ...M];
  return `/demo/guests/${pool[hash(n) % pool.length]}.webp`;
}

/** Second face for couples ("יעל ועומר כהן"): the partner after the "ו", if we know the name's gender. */
export function partnerPhoto(name) {
  if (!DEMO_PHOTOS) return null;
  const m = String(name || '').match(/^\S+\s+ו(\S+)/);
  if (!m) return null;
  const p = m[1].toLowerCase();
  const pool = FEMALE.has(p) ? W : MALE.has(p) ? M : null;
  if (!pool) return null;
  return `/demo/guests/${pool[(hash(p) * 7 + 3) % pool.length]}.webp`;
}
