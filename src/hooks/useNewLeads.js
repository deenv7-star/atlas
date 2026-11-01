/**
 * New leads waiting for a reply (status NEW). Reads the same cached query as "מה דורש תשומת לב"
 * (useLeads() with its defaults), so the tab badge / today shortcut add no request.
 */
import { useMemo } from 'react';
import { useLeads } from '@/data/entities';

export function useNewLeads() {
  const q = useLeads();
  return useMemo(() => {
    const list = (q.data || []).filter((l) => String(l?.status || 'NEW').toUpperCase() === 'NEW');
    return { count: list.length, first: list[0] || null, ready: !q.isLoading };
  }, [q.data, q.isLoading]);
}
