/**
 * Client-side write lock for an expired, unpaid account (trial over, no active subscription).
 * Set by <AccessSync/> (src/components/paywall/AccessGate.jsx) from computeAccess(); read by the API layer:
 *   - src/api/client.js        entity create/update/delete + AI / email / upload integrations
 *   - src/api/supabaseClient.js every PostgREST / RPC / edge-function / storage write that bypasses the entities
 * Reads stay open (the paywall shows nothing, but nothing is deleted either). This is a UX/defence-in-depth layer:
 * the real boundary has to be the database (qa/trial-paywall/server-side-proposal.md).
 * Pure module, no imports: safe to load from supabaseClient.js without a cycle.
 */
let locked = false;

export const LOCKED_CODE = 'SUBSCRIPTION_INACTIVE';
export const LOCKED_MESSAGE = 'המנוי לא פעיל, ולכן אי אפשר לשמור שינויים. המידע שלכם שמור.';

export function setAccessLocked(v) { locked = Boolean(v); }
export function isAccessLocked() { return locked; }

export function lockedError() {
  const e = new Error(LOCKED_MESSAGE);
  e.code = LOCKED_CODE;
  e.status = 402;
  return e;
}

export function assertWritable() {
  if (locked) throw lockedError();
}

/** Tables / RPCs / edge functions an expired account still needs: plan request, support, account deletion, status. */
const ALLOWED_TABLES = new Set(['contact_messages', 'support_conversations', 'support_messages']);
const ALLOWED_RPCS = new Set([
  'my_account_status', 'is_platform_admin', 'platform_admin_role', 'admin_whoami',
  'delete_my_account', 'support_mark_read', 'support_feedback',
]);
const ALLOWED_FUNCTIONS = new Set(['support-chat', 'delete-account']);

/**
 * Should this Supabase request be refused while locked? Auth (/auth/v1) and plain reads always pass.
 * @param {string} url
 * @param {string} [method]
 */
export function isBlockedSupabaseRequest(url, method = 'GET') {
  if (!locked) return false;
  const m = String(method || 'GET').toUpperCase();
  let path = '';
  try { path = new URL(String(url), 'http://x').pathname; } catch { return false; }
  if (path.startsWith('/auth/v1/')) return false;
  if (path.startsWith('/rest/v1/rpc/')) {
    const fn = path.slice('/rest/v1/rpc/'.length).split('/')[0];
    return !ALLOWED_RPCS.has(fn);
  }
  if (path.startsWith('/rest/v1/')) {
    if (m === 'GET' || m === 'HEAD') return false;
    const table = path.slice('/rest/v1/'.length).split('/')[0];
    return !ALLOWED_TABLES.has(table);
  }
  if (path.startsWith('/functions/v1/')) {
    const fn = path.slice('/functions/v1/'.length).split('/')[0];
    return !ALLOWED_FUNCTIONS.has(fn);
  }
  if (path.startsWith('/storage/v1/')) return !(m === 'GET' || m === 'HEAD');
  return false;
}

/** A PostgREST-shaped 403 so supabase-js callers get { error } with a Hebrew message instead of a thrown fetch. */
export function lockedResponse() {
  return new Response(JSON.stringify({ code: '42501', message: LOCKED_MESSAGE, details: LOCKED_CODE, hint: null }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
