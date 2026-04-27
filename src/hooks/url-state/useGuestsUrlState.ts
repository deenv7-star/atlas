import { useCallback, useMemo } from 'react';
import type { SortingState, Updater } from '@tanstack/react-table';
import type { inferParserType, SetValues } from 'nuqs';
import { useQueryStates } from 'nuqs';
import { guestsSortingFromUrl, guestsUrlParsers } from './guestsUrlParsers';

export type GuestsUrlStateValues = inferParserType<typeof guestsUrlParsers>;

const nuqsOptions = { history: 'push' as const };

export type UseGuestsUrlStateResult = GuestsUrlStateValues & {
  setUrlState: SetValues<typeof guestsUrlParsers>;
  sorting: SortingState;
  setSorting: (updater: Updater<SortingState>) => void;
  setOpenGuestId: (id: string | null) => void;
};

export function useGuestsUrlState(): UseGuestsUrlStateResult {
  const [state, setUrlState] = useQueryStates(guestsUrlParsers, nuqsOptions);

  const sorting = useMemo(
    () => guestsSortingFromUrl(state.sort, state.sortDir),
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

  const setOpenGuestId = useCallback(
    (id: string | null) => {
      void setUrlState({ openGuestId: id });
    },
    [setUrlState],
  );

  return {
    ...state,
    setUrlState,
    sorting,
    setSorting,
    setOpenGuestId,
  };
}
