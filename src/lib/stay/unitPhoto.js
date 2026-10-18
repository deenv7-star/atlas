/**
 * Every unit gets a cover photo. An uploaded photo (property.images[0]) wins; otherwise the unit gets
 * (demo workspace only) one of six real zimmer photos (Unsplash, see public/demo/units/CREDITS.md), stable per unit id.
 */
import { DEMO_PEOPLE } from '@/lib/demoPeople';

export const DEFAULT_UNIT_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/demo/units/unit-${n}.webp`);
export const WELCOME_PHOTO = '/demo/welcome.webp';
export const WELCOME_PHOTO_2 = '/demo/welcome-2.webp';

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Files saved without a storage backend live in localStorage as local://file/<id>. */
function resolveLocal(url) {
  if (typeof url !== 'string' || !url.startsWith('local://file/')) return url;
  try { return localStorage.getItem(`atlas_file_${url.slice('local://file/'.length)}`) || null; } catch { return null; }
}

export function uploadedPhoto(property) {
  const first = Array.isArray(property?.images) ? property.images[0] : null;
  const url = first && typeof first === 'object' ? first.url : first;
  return url ? resolveLocal(url) : null;
}

/**
 * Real workspaces never get a stock photo for their own unit (it read as "this is my zimmer"):
 * without an upload they get null and the caller shows a neutral tile. Demo workspaces keep the set.
 */
export function unitPhoto(property, fallbackKey) {
  const uploaded = uploadedPhoto(property);
  if (uploaded) return uploaded;
  if (!DEMO_PEOPLE) return null;
  const key = String(property?.id || property?.name || fallbackKey || 'unit');
  return DEFAULT_UNIT_PHOTOS[hash(key) % DEFAULT_UNIT_PHOTOS.length];
}
