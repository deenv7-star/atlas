import { parseAsIsoDate, parseAsString, parseAsStringLiteral } from 'nuqs';

export const calendarViewValues = ['month', 'week', 'day'] as const;
export type CalendarView = (typeof calendarViewValues)[number];

export const calendarUrlParsers = {
  view: parseAsStringLiteral([...calendarViewValues]).withDefault('week'),
  /** Anchor date for the visible range (local calendar day). Omitted = today. */
  date: parseAsIsoDate,
  propertyId: parseAsString,
  unitId: parseAsString,
};
