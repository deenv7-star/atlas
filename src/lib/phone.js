/**
 * Phone helpers shared by the lead page, booking page and quick search (audit APP-004/007/008).
 * Israeli local numbers (050-1234567) and international ones (+972 50 123 4567, +44 …) both work.
 */

/** Digits only ("+972-50-123 4567" → "972501234567"). */
export function phoneDigits(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

/**
 * International digits for wa.me / tel: ("0501234567" → "972501234567", "+44 20 7946 0958" → "442079460958").
 * Returns '' when the value is not a usable phone number (e.g. "abc", too short).
 */
export function toInternationalDigits(raw) {
  const s = String(raw ?? '').trim();
  if (!s || /[^\d\s\-+().]/.test(s)) return '';
  let d = phoneDigits(s);
  if (d.startsWith('00')) d = d.slice(2);
  else if (!s.startsWith('+') && d.startsWith('0')) d = `972${d.slice(1)}`;
  if (d.length < 9 || d.length > 15) return '';
  return d;
}

export function isDialable(raw) {
  return toInternationalDigits(raw) !== '';
}

/** tel: link in E.164 so it dials from abroad too, or '' when not dialable. */
export function telHref(raw) {
  const d = toInternationalDigits(raw);
  return d ? `tel:+${d}` : '';
}

/** wa.me link with an optional prefilled message, or '' when not dialable. */
export function whatsappHref(raw, text = '') {
  const d = toInternationalDigits(raw);
  if (!d) return '';
  return text ? `https://wa.me/${d}?text=${encodeURIComponent(text)}` : `https://wa.me/${d}`;
}

/**
 * The part of a typed phone query that is the same however it was stored:
 * strips the Israeli trunk "0" and the "972" country code ("052-123 4567" / "+972521234567" → "521234567").
 * Returns '' when the query is not phone-like (fewer than 4 digits, or contains letters).
 */
export function phoneSearchCore(query) {
  const q = String(query ?? '').trim();
  if (/[^\d\s\-+().]/.test(q)) return '';
  let d = phoneDigits(q);
  if (d.length < 4) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('972')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);
  return d.length >= 4 ? d : '';
}

/** ilike pattern that ignores separators: "521234567" → "%5%2%1%2%3%4%5%6%7%". Post-filter with phoneMatches. */
export function phoneIlikePattern(core) {
  return core ? `%${core.split('').join('%')}%` : '';
}

/** True when a stored phone contains the query's core digits (separators and 0/972 prefixes ignored). */
export function phoneMatches(stored, query) {
  const core = phoneSearchCore(query);
  if (!core) return false;
  return phoneDigits(stored).includes(core);
}
