/**
 * Audit 04.11 (critical): a network error on a cold start used to sign the owner out.
 * Only a real "this session is gone" answer (401/403, a refresh token the server refused) may end
 * the session. A failed fetch, a timeout or a 5xx with a session still in storage is "offline":
 * keep the session, show the offline screen, retry when the connection comes back.
 * Pure (no imports), so tests/unit can load it directly.
 */

/** A network/transport failure, as opposed to the server saying no. */
export function isNetworkError(err) {
  if (!err) return false;
  if (err.isTransient === true) return true;
  if (err.name === 'AuthRetryableFetchError') return true;
  if (err.name === 'AbortError' || err.name === 'TimeoutError') return true;
  if (typeof err.status === 'number' && (err.status === 0 || err.status === 408 || err.status >= 500)) return true;
  if (err instanceof TypeError) return true; // fetch() rejects with TypeError("Failed to fetch") offline
  const msg = String(err.message || '');
  return /failed to fetch|networkerror|network request failed|load failed|timed? ?out|fetch failed/i.test(msg);
}

/** The server refused this session (expired refresh token, deleted user, signed out elsewhere). */
export function isSessionInvalid(err) {
  if (!err || isNetworkError(err)) return false;
  return err.status === 401 || err.status === 403 || err.name === 'AuthSessionMissingError' || err.name === 'AuthApiError';
}

/**
 * What to do after hydrating the user failed.
 *   'offline'    — keep the session and the cached copy; show the offline screen if nothing is on screen.
 *   'signed_out' — clear the session state (the login screen follows).
 * @param {unknown} err
 * @param {{ hasStoredSession: boolean, online?: boolean }} ctx
 */
export function decideAuthFailure(err, { hasStoredSession, online = true } = {}) {
  if (!hasStoredSession) return 'signed_out';
  if (isSessionInvalid(err) && online !== false) return 'signed_out';
  if (isNetworkError(err) || online === false) return 'offline';
  // Unknown error shape with a session still stored: do not throw the owner out over it.
  return err && (err.status === 401 || err.status === 403) ? 'signed_out' : 'offline';
}
