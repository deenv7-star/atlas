import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  debounce,
} from 'nuqs';

const historyPush = { history: 'push' as const };

export const guestsUrlParsers = {
  search: parseAsString.withDefault('').withOptions({
    ...historyPush,
    limitUrlUpdates: debounce(280),
  }),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsNumberLiteral([10, 25, 50] as const).withDefault(25),
  sort: parseAsString,
  sortDir: parseAsStringLiteral(['asc', 'desc'] as const),
  /** Status filters and future tags: values matching `GuestLeadRow.status` act as status chips; others match substring in name/email. */
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  openGuestId: parseAsString,
};

export const GUEST_SORTABLE_COLUMN_IDS = ['guest', 'email', 'phone', 'status', 'joined'] as const;
export type GuestSortColumnId = (typeof GUEST_SORTABLE_COLUMN_IDS)[number];

export function isGuestSortColumnId(id: string): id is GuestSortColumnId {
  return (GUEST_SORTABLE_COLUMN_IDS as readonly string[]).includes(id);
}

export function guestsSortingFromUrl(
  sort: string | null,
  sortDir: 'asc' | 'desc' | null,
): import('@tanstack/react-table').SortingState {
  if (!sort || !isGuestSortColumnId(sort)) return [];
  const desc = sortDir !== 'asc';
  return [{ id: sort, desc }];
}
