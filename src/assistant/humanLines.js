/**
 * How atlas sounds in the in-browser demo: short, warm, first person (female), sometimes the owner's first name.
 * Facts only from the snapshot (facts.js). The live brain gets the same tone from its prompt (brain/prompt.js).
 */
import { money, withPrefix } from './facts.js';

const list = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} ו${a[a.length - 1]}`);

/** "מי מגיע היום?" in her voice, or null when the snapshot has nothing to say. */
export function humanDay(f, owner = '') {
  if (!f) return null;
  const hi = owner ? `${owner}, ` : '';
  if (!f.arrivals.length && !f.departures.length) return `${hi}היום שקט, אין כניסות ואין יציאות.${f.arrivalsTomorrow.length ? ` מחר מגיעים ${list(f.arrivalsTomorrow.map((a) => a.name))}.` : ''}`;
  const parts = [];
  if (f.arrivals.length) parts.push(`${f.arrivals.length === 1 ? 'כניסה אחת היום' : `${f.arrivals.length} כניסות היום`}: ${list(f.arrivals.map((a) => (a.unit ? `${a.name} ${withPrefix('ל', a.unit)}` : a.name)))}`);
  if (f.departures.length) parts.push(`${f.departures.length === 1 ? 'ויציאה אחת' : `ו-${f.departures.length} יציאות`}, ${list(f.departures.map((a) => a.name))}`);
  const owed = f.overdue.find((r) => f.arrivals.some((a) => a.id === r.id));
  const tail = owed ? ` שימו לב, ל${owed.name} נשארה יתרה של ${money(owed.amount)}, אפשר לגבות בכניסה.` : ' הכל מוכן.';
  return `${hi}${parts.join(' ')}.${tail}`;
}

export const firstName = (full) => String(full || '').trim().split(/\s+/)[0] || '';
