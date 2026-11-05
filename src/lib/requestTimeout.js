/**
 * How long one Supabase request may take before the client gives up (used by the global fetch in supabaseClient).
 * Most calls: 15 s, so loading states never hang. Uploads: 2 min.
 * property-import reads up to 3 sites (≤ 40 s) and then asks the model (≤ 45 s); save_photos copies up to 30 photos.
 * With the 15 s default the app aborted every real import mid-way (live bug 05.11.2026: the owner saw
 * "משהו השתבש בדרך" and the function never even logged the request), so it gets 2 min, inside the edge wall clock.
 */
export const REQUEST_TIMEOUT_MS = 15000;
export const UPLOAD_TIMEOUT_MS = 120000;
export const LONG_FUNCTION_TIMEOUT_MS = 120000;

const LONG_FUNCTIONS = /\/functions\/v1\/property-import(?:[/?#]|$)/;

export function requestTimeoutMs(url, body) {
  if (LONG_FUNCTIONS.test(String(url || ''))) return LONG_FUNCTION_TIMEOUT_MS;
  const isUpload = typeof Blob !== 'undefined' && (body instanceof Blob || (typeof FormData !== 'undefined' && body instanceof FormData) || body instanceof ArrayBuffer);
  return isUpload ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
}
