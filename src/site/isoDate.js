/**
 * Full ISO 8601 datetime for a content date ('2026-10-18' -> '2026-10-18T09:00:00+03:00'), in Israel time,
 * with the offset that applies on that day (+02:00 in winter, +03:00 in summer). Search engines and the
 * Rich Results test want a time zone on datePublished / dateModified, <time datetime> and article:*_time.
 */
export function isoDateTime(day) {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const noonUtc = new Date(`${day}T12:00:00Z`);
  let off = '+02:00';
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', timeZoneName: 'longOffset' })
      .formatToParts(noonUtc).find((p) => p.type === 'timeZoneName')?.value; // "GMT+03:00"
    const m = name && name.match(/GMT([+-]\d{2}:\d{2})/);
    if (m) off = m[1];
  } catch { /* keep +02:00 */ }
  return `${day}T09:00:00${off}`;
}
