/**
 * Audit 04.11 #2 / #5 / #6: how much to trust what a screen shows when a query failed or hangs.
 * Pure (plain objects in, plain answers out), so tests/unit can check it without React.
 *
 * A react-query result keeps `data` from the last success when a refetch fails (status 'error').
 * That copy is real, just old. A query that never succeeded has no data at all, and `data || []`
 * would turn "we don't know" into "nothing is owed" (the ₪0 / "29 things waiting" bug on Today).
 */

/**
 * @param {{ status?: string, data?: unknown, isSuccess?: boolean, isError?: boolean, fetchStatus?: string }} q
 * @returns {'ready'|'stale'|'loading'|'error'}
 *   ready   — the last fetch succeeded: show values.
 *   stale   — a refetch failed, the last good copy is kept: show values + a quiet "not updated" mark.
 *   loading — never loaded yet (or hanging): show no values.
 *   error   — failed and nothing to show: "—" + a banner with retry.
 */
export function loadStateOf(q) {
  if (!q) return 'loading';
  const status = q.status || (q.isSuccess ? 'success' : q.isError ? 'error' : 'pending');
  if (status === 'success') return 'ready';
  if (status === 'error') return q.data !== undefined ? 'stale' : 'error';
  return 'loading';
}

/** Values may be shown (possibly old). */
export const canShowValues = (state) => state === 'ready' || state === 'stale';

/**
 * One screen's freshness, for the quiet indicator next to its title.
 * @param {Array<{ status?: string, data?: unknown, dataUpdatedAt?: number }>} queries
 * @param {{ online?: boolean }} ctx
 * @returns {{ show: boolean, reason: null|'offline'|'failed', updatedAt: number }}
 */
export function staleStateOf(queries, { online = true } = {}) {
  const list = (queries || []).filter(Boolean);
  const withData = list.filter((q) => q.data !== undefined);
  const updatedAt = withData.reduce((min, q) => {
    const t = Number(q.dataUpdatedAt) || 0;
    return t && (!min || t < min) ? t : min;
  }, 0);
  if (!withData.length) return { show: false, reason: null, updatedAt: 0 }; // nothing on screen to call old
  if (online === false) return { show: true, reason: 'offline', updatedAt };
  if (list.some((q) => loadStateOf(q) === 'stale')) return { show: true, reason: 'failed', updatedAt };
  return { show: false, reason: null, updatedAt };
}

/** "10:42" for today, "3.11 · 10:42" for an older copy (Asia/Jerusalem is the device zone in practice). */
export function staleTimeLabel(ts, now = Date.now()) {
  if (!ts) return '';
  const d = new Date(ts); const n = new Date(now);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const sameDay = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  return sameDay ? hm : `${d.getDate()}.${d.getMonth() + 1} · ${hm}`;
}
