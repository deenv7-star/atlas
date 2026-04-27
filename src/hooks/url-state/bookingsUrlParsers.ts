import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDate,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
  debounce,
} from 'nuqs';

/** Booking entity status values (URL `status` array). */
export const BOOKING_STATUS_VALUES = [
  'PENDING',
  'APPROVED',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'WAITLIST',
] as const;

export type BookingStatus = (typeof BOOKING_STATUS_VALUES)[number];

export const bookingsTabValues = ['active', 'pending', 'cancelled', 'all'] as const;
export type BookingsTab = (typeof bookingsTabValues)[number];

export const bookingsPageSizeValues = [10, 25, 50] as const;

const historyPush = { history: 'push' as const };

/** Stable parser map for `useBookingsUrlState` — defaults omit keys from the URL (`clearOnDefault` default). */
export const bookingsUrlParsers = {
  tab: parseAsStringLiteral([...bookingsTabValues]).withDefault('all'),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsNumberLiteral([...bookingsPageSizeValues]).withDefault(25),
  sort: parseAsString,
  sortDir: parseAsStringLiteral(['asc', 'desc'] as const),
  search: parseAsString.withDefault('').withOptions({
    ...historyPush,
    limitUrlUpdates: debounce(280),
  }),
  dateFrom: parseAsIsoDate,
  dateTo: parseAsIsoDate,
  status: parseAsArrayOf(parseAsStringEnum([...BOOKING_STATUS_VALUES])).withDefault([]),
  propertyId: parseAsString,
  openBookingId: parseAsString,
};

export const BOOKING_SORTABLE_COLUMN_IDS = [
  'shortId',
  'guest',
  'property',
  'check_in_date',
  'check_out_date',
  'total_price',
  'status',
] as const;

export type BookingSortColumnId = (typeof BOOKING_SORTABLE_COLUMN_IDS)[number];

export function isBookingSortColumnId(id: string): id is BookingSortColumnId {
  return (BOOKING_SORTABLE_COLUMN_IDS as readonly string[]).includes(id);
}

export function bookingsSortingFromUrl(
  sort: string | null,
  sortDir: 'asc' | 'desc' | null,
): import('@tanstack/react-table').SortingState {
  if (!sort || !isBookingSortColumnId(sort)) return [];
  const desc = sortDir !== 'asc';
  return [{ id: sort, desc }];
}
