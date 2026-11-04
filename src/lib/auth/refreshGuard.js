/**
 * fix-1104 QA: keep the stored session when the auth server answers a token refresh with a 5xx.
 *
 * supabase-js (auth-js 2.x) treats only 502/503/504 and network failures as "retry later". Any other
 * status, a plain 500 included, becomes an AuthApiError and _callRefreshToken() removes the session
 * (SIGNED_OUT), so a short auth-server outage sent an owner with an expired access token to /login.
 *
 * Client-side only: a 5xx answer to the refresh-token grant is re-labelled 503, so auth-js keeps the
 * session, retries with its own back-off, and the app shows the offline screen (AuthContext hydrate
 * timeout) until the server is back. A real refusal (400 invalid / revoked refresh token, 401, 403)
 * is untouched and still signs the owner out.
 */

const RETRYABLE = new Set([502, 503, 504]);

/** True for POST …/auth/v1/token?grant_type=refresh_token (any host). */
export function isRefreshTokenRequest(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url, 'http://x');
    return /\/auth\/v1\/token\/?$/.test(u.pathname) && u.searchParams.get('grant_type') === 'refresh_token';
  } catch {
    return false;
  }
}

/** Should this response be re-labelled as a retryable 503? */
export function shouldMaskRefreshFailure(url, status) {
  return isRefreshTokenRequest(url) && status >= 500 && status <= 599 && !RETRYABLE.has(status);
}

/**
 * Pass-through for every response except a non-retryable 5xx to the refresh grant, which comes back
 * as a 503 with the same body and headers.
 */
export function guardRefreshResponse(url, res) {
  if (!res || !shouldMaskRefreshFailure(url, res.status)) return res;
  try {
    const headers = new Headers(res.headers);
    headers.set('x-atlas-original-status', String(res.status));
    return new Response(res.body, { status: 503, statusText: 'Service Unavailable', headers });
  } catch {
    return res;
  }
}
