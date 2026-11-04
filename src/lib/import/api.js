/**
 * ייבוא מתחם: calls to the property-import edge function, plus a local demo answer for QA builds without a backend
 * (VITE_ALLOW_LOCAL_DEMO / no Supabase). The demo is clearly a sample ("דוגמה") and uses atlas's own demo photos.
 */
import { isSupabaseConfigured } from '@/api/supabaseClient';
import { callEdge } from '@/lib/real/edge';
import { demoImport } from './demo';

const ERR = {
  nothing_to_import: 'הדביקו קישור, תיאור או צילום מסך כדי שנתחיל.',
  all_sources_failed: 'לא הצלחנו לקרוא את הקישור. אפשר להדביק את התיאור או לצלם מסך מהמודעה.',
  rate_limited: 'רגע, נסו שוב בעוד דקה.',
  daily_limit: 'הגעתם למספר הייבואים להיום. מחר אפשר שוב, או המשיכו בשאלות.',
};

export class ImportError extends Error {
  constructor(code, sources = []) { super(ERR[code] || 'משהו השתבש בדרך. נסו שוב, או הדביקו את התיאור.'); this.code = code; this.sources = sources; }
}

export const isDemo = () => !isSupabaseConfigured;

/** { urls, text, images } → { result, missing }. Throws ImportError with a Hebrew message. */
export async function importComplex({ urls = [], text = '', images = [] } = {}) {
  if (isDemo()) return demoImport({ urls, text, images });
  let data;
  try {
    data = await callEdge('property-import', { op: 'import', urls, text, images });
  } catch (e) {
    throw new ImportError(e?.code || 'edge_error');
  }
  if (data?.error) throw new ImportError(data.error, data.sources || []);
  if (!data?.result) throw new ImportError('edge_error');
  return data;
}

/** Copies the photos the owner kept into atlas storage. Returns the stored URLs (in order); [] when it could not. */
export async function keepPhotos(urls) {
  if (!urls?.length) return [];
  if (isDemo()) return urls.filter((u) => u.startsWith('/'));
  try {
    const data = await callEdge('property-import', { op: 'save_photos', urls: urls.slice(0, 30) });
    return (data?.saved || []).map((x) => x.url);
  } catch { return []; }
}

/** Screenshot → small JPEG data URL (≤1600px, ~0.8 quality) so 4 of them fit in one request. */
export async function shrinkImage(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } finally { URL.revokeObjectURL(url); }
}
