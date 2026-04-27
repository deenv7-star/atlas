import { useCallback, useMemo } from 'react';
import type { SortingState, Updater } from '@tanstack/react-table';
import type { inferParserType, SetValues } from 'nuqs';
import { useQueryStates } from 'nuqs';
import { bookingsSortingFromUrl, bookingsUrlParsers } from './bookingsUrlParsers';

export type BookingsUrlStateValues = inferParserType<typeof bookingsUrlParsers>;

const nuqsOptions = { history: 'push' as const };

export type UseBookingsUrlStateResult = BookingsUrlStateValues & {
  setUrlState: SetValues<typeof bookingsUrlParsers>;
  /** TanStack sorting derived from URL (invalid `sort` ids are ignored). */
  sorting: SortingState;
  setSorting: (updater: Updater<SortingState>) => void;
  setOpenBookingId: (id: string | null) => void;
};

export function useBookingsUrlState(): UseBookingsUrlStateResult {
  const [state, setUrlState] = useQueryStates(bookingsUrlParsers, nuqsOptions);

  const sorting = useMemo(
    () => bookingsSortingFromUrl(state.sort, state.sortDir),
    [state.sort, state.sortDir],
  );

  const setSorting = useCallback(
    (updater: Updater<SortingState>) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (!first) {
        void setUrlState({ sort: null, sortDir: null });
        return;
      }
      void setUrlState({
        sort: first.id,
        sortDir: first.desc ? 'desc' : 'asc',
      });
    },
    [setUrlState, sorting],
  );

  const setOpenBookingId = useCallback(
    (id: string | null) => {
      void setUrlState({ openBookingId: id });
    },
    [setUrlState],
  );

  return {
    ...state,
    setUrlState,
    sorting,
    setSorting,
    setOpenBookingId,
  };
}
