import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type LeadCacheRow = Record<string, unknown> & { id: string };

function isLeadRow(v: unknown): v is LeadCacheRow {
  return Boolean(v && typeof v === 'object' && 'id' in v && typeof (v as { id: unknown }).id === 'string');
}

function patchLeadValue(old: unknown, id: string, patch: Record<string, unknown>): unknown {
  if (Array.isArray(old)) {
    return old.map((row) => (isLeadRow(row) && row.id === id ? { ...row, ...patch } : row));
  }
  return old;
}

/** Detail uses `['leads', id]` (see `useLead`); lists use `['leads', filters, sort, limit]`. */
export function snapshotLeadQueries(qc: QueryClient, _leadId: string): Map<string, unknown> {
  const map = new Map<string, unknown>();
  const pairs = qc.getQueriesData({ predicate: (q) => q.queryKey[0] === 'leads' });
  for (const [key, data] of pairs) {
    map.set(JSON.stringify(key), data);
  }
  return map;
}

export function restoreLeadQueriesSnapshot(qc: QueryClient, snap: Map<string, unknown> | undefined) {
  if (!snap) return;
  for (const [keyStr, data] of snap.entries()) {
    qc.setQueryData(JSON.parse(keyStr) as QueryKey, data);
  }
}

export function patchLeadInListQueries(qc: QueryClient, leadId: string, patch: Record<string, unknown>) {
  qc.setQueriesData({ predicate: (q) => q.queryKey[0] === 'leads' }, (old) => patchLeadValue(old, leadId, patch));
}

export function patchLeadDetail(qc: QueryClient, leadId: string, patch: Record<string, unknown>) {
  const key: QueryKey = ['leads', leadId];
  qc.setQueryData(key, (old: unknown) => (old && typeof old === 'object' ? { ...(old as object), ...patch } : old));
}
