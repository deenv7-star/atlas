import type { SortingState } from '@tanstack/react-table';

/** Minimal row shape for client-side sort (matches `BookingRow`). */
export type SortableBookingRow = {
  id: string;
  guest_name?: string | null;
  guest_email?: string | null;
  property_id?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  total_price?: string | number | null;
  status?: string | null;
};

function num(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function isoOrEmpty(v: string | null | undefined): string {
  return v || '';
}

/** Client-side comparator for booking table column ids (URL `sort`). */
export function compareBookingRows(a: SortableBookingRow, b: SortableBookingRow, columnId: string): number {
  switch (columnId) {
    case 'shortId':
      return String(a.id).localeCompare(String(b.id));
    case 'guest': {
      const an = (a.guest_name || '').toLowerCase();
      const bn = (b.guest_name || '').toLowerCase();
      return an.localeCompare(bn, 'he');
    }
    case 'property':
      return String(a.property_id || '').localeCompare(String(b.property_id || ''));
    case 'check_in_date':
      return isoOrEmpty(a.check_in_date).localeCompare(isoOrEmpty(b.check_in_date));
    case 'check_out_date':
      return isoOrEmpty(a.check_out_date).localeCompare(isoOrEmpty(b.check_out_date));
    case 'total_price':
      return num(a.total_price) - num(b.total_price);
    case 'status':
      return String(a.status || '').localeCompare(String(b.status || ''));
    default:
      return 0;
  }
}

export function sortBookings<T extends SortableBookingRow>(rows: T[], sorting: SortingState): T[] {
  const s0 = sorting[0];
  if (!s0) return rows;
  const dir = s0.desc ? -1 : 1;
  const id = s0.id;
  return [...rows].sort((a, b) => dir * compareBookingRows(a, b, id));
}
