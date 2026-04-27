import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type CleaningTaskRow = Record<string, unknown> & { id: string };

function isTaskRow(v: unknown): v is CleaningTaskRow {
  return Boolean(v && typeof v === 'object' && 'id' in v && typeof (v as { id: unknown }).id === 'string');
}

function patchTaskValue(old: unknown, id: string, patch: Record<string, unknown>): unknown {
  if (Array.isArray(old)) {
    return old.map((row) => (isTaskRow(row) && row.id === id ? { ...row, ...patch } : row));
  }
  if (isTaskRow(old) && old.id === id) {
    return { ...old, ...patch };
  }
  return old;
}

/** Matches entities (`cleaning_tasks`) and legacy pages (`cleaningTasks`). */
function isCleaningTaskQuery(queryKey: QueryKey): boolean {
  const k0 = queryKey[0];
  return k0 === 'cleaning_tasks' || k0 === 'cleaningTasks';
}

export function snapshotCleaningTaskQueries(qc: QueryClient): Map<string, unknown> {
  const map = new Map<string, unknown>();
  const pairs = qc.getQueriesData({ predicate: (q) => isCleaningTaskQuery(q.queryKey) });
  for (const [key, data] of pairs) {
    map.set(JSON.stringify(key), data);
  }
  return map;
}

export function restoreCleaningTaskQueriesSnapshot(qc: QueryClient, snap: Map<string, unknown> | undefined) {
  if (!snap) return;
  for (const [keyStr, data] of snap.entries()) {
    qc.setQueryData(JSON.parse(keyStr) as QueryKey, data);
  }
}

export function patchCleaningTaskEverywhere(qc: QueryClient, taskId: string, patch: Record<string, unknown>) {
  qc.setQueriesData({ predicate: (q) => isCleaningTaskQuery(q.queryKey) }, (old) =>
    patchTaskValue(old, taskId, patch),
  );
}
