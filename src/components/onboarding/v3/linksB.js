/** Version B: the calendar links the build step saves. Pure (no React) so tests/unit can import it. */
import { checkIcalLink } from '../../../lib/onboarding/v2/model.js';

/** Only for ticked channels, only links that pass the paste check; both go to the first unit. */
export function linksFromAnswers(a) {
  const ch = Array.isArray(a.channels) ? a.channels : [];
  const out = [];
  if (ch.includes('booking') && checkIcalLink('BOOKING_COM', a.icalBooking).ok) out.push({ provider: 'BOOKING_COM', url: a.icalBooking.trim(), ok: true, unit: 0 });
  if (ch.includes('airbnb') && checkIcalLink('AIRBNB', a.icalAirbnb).ok) out.push({ provider: 'AIRBNB', url: a.icalAirbnb.trim(), ok: true, unit: 0 });
  return out;
}
