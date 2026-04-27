import { useCallback } from 'react';
import type { inferParserType, SetValues } from 'nuqs';
import { useQueryStates } from 'nuqs';
import { maintenanceUrlParsers } from './maintenanceUrlParsers';

export type MaintenanceUrlStateValues = inferParserType<typeof maintenanceUrlParsers>;

const nuqsOptions = { history: 'push' as const };

export type UseMaintenanceUrlStateResult = MaintenanceUrlStateValues & {
  setUrlState: SetValues<typeof maintenanceUrlParsers>;
  setOpenMaintenanceId: (id: string | null) => void;
};

export function useMaintenanceUrlState(): UseMaintenanceUrlStateResult {
  const [state, setUrlState] = useQueryStates(maintenanceUrlParsers, nuqsOptions);

  const setOpenMaintenanceId = useCallback(
    (id: string | null) => {
      void setUrlState({ openMaintenanceId: id });
    },
    [setUrlState],
  );

  return { ...state, setUrlState, setOpenMaintenanceId };
}
