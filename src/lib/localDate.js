/**
 * Today's calendar date in Israel as YYYY-MM-DD.
 * `new Date().toISOString().slice(0, 10)` is the UTC date, which is still "yesterday"
 * between 00:00 and 02:00/03:00 Israel time, so payments and expenses landed on the wrong day
 * (and on the 1st of the month, in the wrong month).
 */
export function todayIsrael(d = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }
}
