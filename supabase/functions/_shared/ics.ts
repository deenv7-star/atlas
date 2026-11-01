// Minimal, dependency-free iCalendar (RFC 5545) reader + writer for OTA availability feeds
// (Airbnb, Booking.com, Vrbo, Google). Only what availability sync needs: VEVENT UID / DTSTART / DTEND / SUMMARY / STATUS.

export type IcsEvent = {
  uid: string;
  start: string; // YYYY-MM-DD (first night)
  end: string;   // YYYY-MM-DD (check-out day, exclusive)
  summary: string;
  description: string;
  status: string;
};

/** Undo RFC 5545 line folding (CRLF + space/tab continues the previous line). */
export function unfold(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

function unescapeText(v: string): string {
  return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

export const ICS_HOME_TZ = "Asia/Jerusalem";

/** Offset (ms) of `tz` from UTC at the instant `utcMs`. Throws RangeError for an unknown zone. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  return asUtc - utcMs;
}

/** Calendar date (YYYY-MM-DD) of a UTC instant on the wall clock of `tz`. */
export function dateInZone(utcMs: number, tz = ICS_HOME_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(utcMs));
}

/** Wall-clock time in `tz` → UTC instant (two passes, correct across DST changes). */
function zonedWallToUtc(y: number, mo: number, d: number, h: number, mi: number, s: number, tz: string): number {
  const wall = Date.UTC(y, mo - 1, d, h, mi, s);
  let utc = wall - tzOffsetMs(wall, tz);
  utc = wall - tzOffsetMs(utc, tz);
  return utc;
}

/**
 * DTSTART/DTEND value → the stay date in Israel (YYYY-MM-DD).
 *   VALUE=DATE:20261020            → 2026-10-20 (all-day, taken as is)
 *   20261019T220000Z (UTC)         → converted to Asia/Jerusalem → 2026-10-20
 *   TZID=Europe/London:20261020T230000 → that zone's wall time → Israel date (2026-10-21)
 *   20261020T150000 (floating)     → read as Israel local time → 2026-10-20
 * `params` is the raw property parameter string (e.g. "VALUE=DATE" or "TZID=Asia/Jerusalem").
 */
export function icsDate(value: string, params = ""): string | null {
  const v = value.trim();
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/i.exec(v);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dateOnly = `${m[1]}-${m[2]}-${m[3]}`;
  if (m[4] === undefined) return dateOnly; // all-day
  const [h, mi, s] = [Number(m[4]), Number(m[5]), Number(m[6] || 0)];
  if (m[7]) return dateInZone(Date.UTC(y, mo - 1, d, h, mi, s));
  const tzid = /(?:^|;)TZID=("?)([^;":]+)\1/i.exec(params)?.[2]?.trim();
  if (!tzid || tzid === ICS_HOME_TZ) return dateOnly; // floating or already Israel time
  try {
    return dateInZone(zonedWallToUtc(y, mo, d, h, mi, s, tzid));
  } catch {
    return dateOnly; // unknown/Windows zone name: keep the wall date
  }
}

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function parseIcs(text: string): IcsEvent[] {
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error("not_ical");
  // An empty or cut-off feed parses to [] (or fewer events). Callers must not read that as "everything was
  // cancelled": see planCancellations in syncPlan.ts.
  const lines = unfold(text);
  const events: IcsEvent[] = [];
  let cur: Record<string, string> | null = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    if (/^BEGIN:VEVENT$/i.test(line)) { cur = {}; continue; }
    if (/^END:VEVENT$/i.test(line)) {
      if (cur) {
        const start = icsDate(cur.DTSTART || "", cur["DTSTART;"] || "");
        let end = icsDate(cur.DTEND || "", cur["DTEND;"] || "");
        if (start) {
          if (!end || end <= start) {
            // DURATION or missing DTEND: all-day events are one night
            const dur = /^P(\d+)D$/i.exec(cur.DURATION || "");
            end = addDaysISO(start, dur ? Math.max(1, Number(dur[1])) : 1);
          }
          events.push({
            uid: (cur.UID || `${start}_${end}_${cur.SUMMARY || ""}`).slice(0, 300),
            start,
            end,
            summary: unescapeText(cur.SUMMARY || "").slice(0, 200),
            description: unescapeText(cur.DESCRIPTION || "").slice(0, 1000),
            status: (cur.STATUS || "").toUpperCase(),
          });
        }
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    // TZID values may be quoted and contain ":" only inside quotes; split at the first ":" outside quotes.
    let cut = idx;
    if (line.slice(0, idx).split('"').length % 2 === 0) {
      const close = line.indexOf('"', idx);
      cut = close >= 0 ? line.indexOf(":", close) : idx;
      if (cut < 0) continue;
    }
    const head = line.slice(0, cut).split(";");
    const name = head[0].toUpperCase();
    const value = line.slice(cut + 1);
    if (!(name in cur)) {
      cur[name] = value;
      cur[`${name};`] = head.slice(1).join(";");
    }
  }
  return events;
}

function esc(v: string): string {
  return String(v).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Fold to 75 octets per RFC 5545 (approximate by characters, safe for ASCII/Hebrew). */
function fold(line: string): string {
  const out: string[] = [];
  let s = line;
  while (s.length > 74) { out.push(s.slice(0, 74)); s = " " + s.slice(74); }
  out.push(s);
  return out.join("\r\n");
}

export function buildIcs(opts: { name: string; events: { uid: string; start: string; end: string; summary: string; stamp?: string }[] }): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ATLAS//atlas-il.com//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(opts.name)}`,
  ];
  for (const e of opts.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${e.stamp || now}`,
      `DTSTART;VALUE=DATE:${e.start.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${e.end.replace(/-/g, "")}`,
      `SUMMARY:${esc(e.summary)}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
