import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Any booking-shaped row in list or detail caches */
export type BookingCacheRow = Record<string, unknown> & { id: string };

function isBookingRow(v: unknown): v is BookingCacheRow {
  return Boolean(v && typeof v === 'object' && 'id' in v && typeof (v as { id: unknown }).id === 'string');
}

function patchBookingValue(old: unknown, id: string, patch: Record<string, unknown>): unknown {
  if (Array.isArray(old)) {
    return old.map((row) => (isBookingRow(row) && row.id === id ? { ...row, ...patch } : row));
  }
  if (isBookingRow(old) && old.id === id) {
    return { ...old, ...patch };
  }
  return old;
}

function removeBookingValue(old: unknown, id: string): unknown {
  if (Array.isArray(old)) {
    return old.filter((row) => !isBookingRow(row) || row.id !== id);
  }
  if (isBookingRow(old) && old.id === id) {
    return undefined;
  }
  return old;
}

/** Snapshot all queries whose first key segment is `bookings`. */
export function snapshotBookingQueries(qc: QueryClient): Map<string, unknown> {
  const map = new Map<string, unknown>();
  const pairs = qc.getQueriesData({ predicate: (q) => q.queryKey[0] === 'bookings' });
  for (const [key, data] of pairs) {
    map.set(JSON.stringify(key), data);
  }
  return map;
}

export function restoreBookingQueriesSnapshot(qc: QueryClient, snap: Map<string, unknown> | undefined) {
  if (!snap) return;
  for (const [keyStr, data] of snap.entries()) {
    qc.setQueryData(JSON.parse(keyStr) as QueryKey, data);
  }
}

export function patchBookingInAllBookingQueries(
  qc: QueryClient,
  bookingId: string,
  patch: Record<string, unknown>,
) {
  qc.setQueriesData({ predicate: (q) => q.queryKey[0] === 'bookings' }, (old) =>
    patchBookingValue(old, bookingId, patch),
  );
}

export function removeBookingFromAllBookingQueries(qc: QueryClient, bookingId: string) {
  qc.setQueriesData({ predicate: (q) => q.queryKey[0] === 'bookings' }, (old) => removeBookingValue(old, bookingId));
}

export function findBookingInSnapshot(snap: Map<string, unknown>, bookingId: string): BookingCacheRow | undefined {
  for (const data of snap.values()) {
    if (Array.isArray(data)) {
      const hit = data.find((row) => isBookingRow(row) && row.id === bookingId);
      if (hit && isBookingRow(hit)) return hit;
    }
    if (isBookingRow(data) && data.id === bookingId) return data;
  }
  return undefined;
}
