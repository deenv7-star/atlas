import { format, parseISO, isValid } from 'date-fns';

/** Avoids RangeError from date-fns format() when DB sends invalid or partial date strings. */
export function formatIsoSafe(value, dateFormat, options) {
  if (value == null || value === '') return '';
  try {
    const d = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (!isValid(d)) return '';
    return options ? format(d, dateFormat, options) : format(d, dateFormat);
  } catch {
    return '';
  }
}
