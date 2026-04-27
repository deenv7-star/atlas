import type { inferParserType, SetValues } from 'nuqs';
import { useQueryStates } from 'nuqs';
import { calendarUrlParsers } from './calendarUrlParsers';

export type CalendarUrlStateValues = inferParserType<typeof calendarUrlParsers>;

const nuqsOptions = { history: 'push' as const };

export type UseCalendarUrlStateResult = CalendarUrlStateValues & {
  setUrlState: SetValues<typeof calendarUrlParsers>;
};

export function useCalendarUrlState(): UseCalendarUrlStateResult {
  const [state, setUrlState] = useQueryStates(calendarUrlParsers, nuqsOptions);
  return { ...state, setUrlState };
}
