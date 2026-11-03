// Pure decision logic for ical-sync, kept apart from Deno/Supabase so it can be unit tested in Node.
//
// ENG-01: a channel that answers with a valid but empty (or cut-off) calendar must never silently cancel
// real future bookings. When the feed looks suspicious we skip every cancellation for this round and mark
// the sync WARNING so the host checks the channel; the host can cancel by hand if it was real.

export const INACTIVE_STATUSES = new Set(["CANCELLED", "CANCELED", "WAITLIST", "DECLINED"]);

export type ExistingImported = {
  id: string;
  external_uid: string | null;
  status: string | null;
  check_out_date: string | null;
};

export type CancelPlan = {
  /** rows that disappeared from the feed and would be cancelled */
  gone: ExistingImported[];
  /** rows to actually cancel this round (empty when suspicious) */
  toCancel: ExistingImported[];
  suspicious: boolean;
  reason: "" | "empty_feed" | "feed_dropped" | "mass_cancel";
};

/** Fraction of the previous feed size below which a feed counts as "dropped" (strictly less than half). */
export const DROP_RATIO = 0.5;

export function planCancellations(opts: {
  existing: ExistingImported[];
  seenUids: Set<string>;
  today: string; // YYYY-MM-DD, Israel
  feedEvents: number; // events in this feed after filtering
  previousEvents: number | null | undefined; // calendar_syncs.events_count from the last good sync
}): CancelPlan {
  const { existing, seenUids, today, feedEvents } = opts;
  const prev = Math.max(0, Number(opts.previousEvents) || 0);
  const activeFuture = existing.filter(
    (ex) => !INACTIVE_STATUSES.has(String(ex.status || "").toUpperCase()) && (ex.check_out_date || "") >= today,
  );
  const gone = activeFuture.filter((ex) => !seenUids.has(String(ex.external_uid || "")));
  let reason: CancelPlan["reason"] = "";
  if (gone.length > 0) {
    if (feedEvents === 0) reason = "empty_feed";
    else if (prev >= 2 && feedEvents < prev * DROP_RATIO) reason = "feed_dropped";
    else if (activeFuture.length >= 2 && gone.length > activeFuture.length * DROP_RATIO) reason = "mass_cancel";
  }
  const suspicious = reason !== "";
  return { gone, toCancel: suspicious ? [] : gone, suspicious, reason };
}

/** Hebrew text shown next to the channel when cancellations were held back. Voice: אתם. */
export function warningMessage(plan: CancelPlan, label: string): string {
  const n = plan.gone.length;
  const why = plan.reason === "empty_feed" ? `היומן של ${label} חזר ריק` : `היומן של ${label} חזר חלקי`;
  const what = n === 1
    ? "הזמנה אחת לא מופיעה בו, ולא ביטלנו אותה"
    : `${n} הזמנות לא מופיעות בו, ולא ביטלנו אותן`;
  return `${why}: ${what}. בדקו ב-${label}, ואם ${n === 1 ? "היא בוטלה" : "הן בוטלו"} שם, בטלו גם כאן.`;
}

/** Postgres unique_violation: a parallel run already inserted this event. Not an error (ENG-03). */
export function isDuplicateInsert(err: { code?: string } | null | undefined): boolean {
  return !!err && err.code === "23505";
}

/** Minimum gap between two runs of the same calendar_syncs row (manual button and cron alike). SEC-03 / ENG-03. */
export const SYNC_MIN_GAP_MS = 60_000;
