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

/** DTSTART;VALUE=DATE:20261020 | DTSTART:20261020T140000Z | DTSTART;TZID=Asia/Jerusalem:20261020T150000 → 2026-10-20 */
export function icsDate(value: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function parseIcs(text: string): IcsEvent[] {
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error("not_ical");
  const lines = unfold(text);
  const events: IcsEvent[] = [];
  let cur: Record<string, string> | null = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    if (/^BEGIN:VEVENT$/i.test(line)) { cur = {}; continue; }
    if (/^END:VEVENT$/i.test(line)) {
      if (cur) {
        const start = icsDate(cur.DTSTART || "");
        let end = icsDate(cur.DTEND || "");
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
    const name = line.slice(0, idx).split(";")[0].toUpperCase();
    const value = line.slice(idx + 1);
    if (!(name in cur)) cur[name] = value;
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
