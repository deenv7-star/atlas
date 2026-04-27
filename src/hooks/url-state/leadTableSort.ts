import type { SortingState } from '@tanstack/react-table';

export type SortableGuestLeadRow = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  created_at?: string | null;
};

function isoOrEmpty(v: string | null | undefined): string {
  return v || '';
}

export function compareGuestLeadRows(a: SortableGuestLeadRow, b: SortableGuestLeadRow, columnId: string): number {
  const nameA = (a.full_name || a.name || '').toLowerCase();
  const nameB = (b.full_name || b.name || '').toLowerCase();
  switch (columnId) {
    case 'guest':
      return nameA.localeCompare(nameB, 'he');
    case 'email':
      return String(a.email || '').toLowerCase().localeCompare(String(b.email || '').toLowerCase());
    case 'phone':
      return String(a.phone || '').localeCompare(String(b.phone || ''));
    case 'status':
      return String(a.status || '').localeCompare(String(b.status || ''));
    case 'joined':
      return isoOrEmpty(a.created_at).localeCompare(isoOrEmpty(b.created_at));
    default:
      return 0;
  }
}

export function sortGuestLeads<T extends SortableGuestLeadRow>(rows: T[], sorting: SortingState): T[] {
  const s0 = sorting[0];
  if (!s0) return rows;
  const dir = s0.desc ? -1 : 1;
  const id = s0.id;
  return [...rows].sort((a, b) => dir * compareGuestLeadRows(a, b, id));
}
