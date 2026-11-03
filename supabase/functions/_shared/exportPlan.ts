// Pure mapping for ical-export (unit tested in Node): which bookings become "busy" events in our feed.
import { addDaysISO } from "./ics.ts";

const INACTIVE = new Set(["CANCELLED", "CANCELED", "WAITLIST", "DECLINED"]);

export type ExportRow = { id: string; check_in_date: string | null; check_out_date: string | null; nights: number | null; status: string | null; source: string | null };

/**
 * ENG-10: a booking with no check_out_date still blocks the channel: its end is check-in + nights (min 1).
 * An end that is not after check-in (bad legacy data) is repaired the same way. `from` drops stays that
 * ended before it (computed end, so NULL check-outs are judged by their real end).
 */
export function exportEvents(rows: ExportRow[], opts: { from: string; channel?: string }) {
  const channel = (opts.channel || "").toLowerCase();
  return rows
    .filter((b) => b.check_in_date && !INACTIVE.has(String(b.status || "").toUpperCase()))
    .filter((b) => !channel || String(b.source || "").toLowerCase() !== channel)
    .map((b) => {
      const ci = b.check_in_date as string;
      const end = b.check_out_date && b.check_out_date > ci ? b.check_out_date : addDaysISO(ci, Math.max(1, Number(b.nights) || 1));
      return { uid: `atlas-${b.id}@atlas-il.com`, start: ci, end, summary: "atlas · תפוס" };
    })
    .filter((e) => e.end >= opts.from);
}
