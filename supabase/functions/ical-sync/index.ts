// ical-sync: pulls every active calendar_syncs row (Airbnb / Booking.com / any iCal URL), parses VEVENTs and
// upserts them as blocking bookings on the unit (source + external_uid). Events that disappear from the feed are
// cancelled (never deleted). Overlaps are rejected by the DB (bookings_no_overlap) and recorded as conflicts.
//
// Callers:
//   pg_cron every 15 min  -> header x-atlas-cron: <ATLAS_CRON_SECRET>, body {"all": true}
//   "סנכרן עכשיו" button  -> Authorization: Bearer <user JWT>, body {"sync_id"?: uuid}  (own org only, via RLS)
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { parseIcs, addDaysISO, type IcsEvent } from "../_shared/ics.ts";
import { isPublicFeedUrl } from "../_shared/feedUrl.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const CRON_SECRET = Deno.env.get("ATLAS_CRON_SECRET") || "";
const INACTIVE = new Set(["CANCELLED", "CANCELED", "WAITLIST", "DECLINED"]);

const PROVIDER: Record<string, { source: string; label: string }> = {
  AIRBNB: { source: "airbnb", label: "Airbnb" },
  BOOKING_COM: { source: "booking", label: "Booking.com" },
  GOOGLE: { source: "google", label: "Google" },
  OUTLOOK: { source: "outlook", label: "Outlook" },
  ICAL: { source: "ical", label: "iCal" },
};

function todayIL(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function guestNameFor(ev: IcsEvent, label: string): string {
  const s = ev.summary.trim();
  // Booking.com exports every reservation AND every manual closure as "CLOSED - Not available": we can't tell them apart.
  if (label === "Booking.com" && /closed|not available/i.test(s)) return `תפוס ב-${label}`;
  if (/not available|closed|blocked|unavailable|חסום/i.test(s)) return `חסום ב-${label}`;
  if (!s || /^reserved$|^booked$|^reservation$/i.test(s) || /airbnb/i.test(s)) return `אורח ${label}`;
  return s.slice(0, 80);
}

async function fetchFeed(url: string): Promise<string> {
  let u = url.trim();
  if (/^webcal:\/\//i.test(u)) u = "https://" + u.slice(9);
  if (!/^https?:\/\//i.test(u) || !isPublicFeedUrl(u)) throw new Error("bad_url");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25_000);
  try {
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      res = await fetch(u, { signal: ctrl.signal, headers: { "User-Agent": "ATLAS-iCal-Sync/1.0 (+https://atlas-il.com)", Accept: "text/calendar, text/plain, */*" }, redirect: "manual" });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        u = new URL(res.headers.get("location")!, u).toString();
        if (!isPublicFeedUrl(u)) throw new Error("bad_url");
        continue;
      }
      break;
    }
    if (!res || (res.status >= 300 && res.status < 400)) throw new Error("http_310");
    if (!res.ok) throw new Error(`http_${res.status}`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 5_000_000) throw new Error("too_large");
    return new TextDecoder().decode(buf);
  } finally {
    clearTimeout(t);
  }
}

function hebrewError(code: string): string {
  if (code === "bad_url") return "הקישור לא תקין. צריך קישור שמתחיל ב-https ונגמר בדרך כלל ב-.ics";
  if (code === "not_ical") return "הקישור נפתח, אבל זה לא קובץ יומן (iCal). בדקו שהעתקתם את קישור הייצוא ולא את כתובת הדף";
  if (code === "too_large") return "קובץ היומן גדול מדי";
  if (code.startsWith("http_404") || code.startsWith("http_410")) return "הקישור לא נמצא אצל הערוץ (404). ייתכן שהיומן נמחק או שהקישור הוחלף";
  if (code.startsWith("http_401") || code.startsWith("http_403")) return "הערוץ חסם את הגישה לקישור. צרו קישור ייצוא חדש והדביקו אותו כאן";
  if (code.startsWith("http_")) return `הערוץ החזיר שגיאה (${code.slice(5)}). ננסה שוב בסנכרון הבא`;
  if (/abort/i.test(code)) return "הערוץ לא ענה בזמן. ננסה שוב בסנכרון הבא";
  return "לא הצלחנו לקרוא את היומן. ננסה שוב בסנכרון הבא";
}

type SyncRow = { id: string; org_id: string; property_id: string | null; provider: string; ical_url: string | null; sync_status: string | null; is_active: boolean | null; sync_direction: string | null; label: string | null };

async function overlapping(db: SupabaseClient, propertyId: string, start: string, end: string, excludeId?: string) {
  const { data } = await db.from("bookings")
    .select("id, guest_name, source, check_in_date, check_out_date, status, external_sync_id")
    .eq("property_id", propertyId).lt("check_in_date", end).gt("check_out_date", start).limit(5);
  return (data || []).find((b) => !INACTIVE.has(String(b.status || "").toUpperCase()) && b.id !== excludeId) || null;
}

async function syncOne(db: SupabaseClient, s: SyncRow) {
  const startedAt = new Date().toISOString();
  const prov = PROVIDER[s.provider] || PROVIDER.ICAL;
  const label = s.label || prov.label;
  const result = { id: s.id, ok: false, events: 0, created: 0, updated: 0, cancelled: 0, conflicts: 0, error: "" as string };
  if (!s.property_id || !s.ical_url) {
    result.error = "missing_url";
    await db.from("calendar_syncs").update({ last_attempt_at: startedAt, sync_status: "ERROR", error_message: "חסר קישור יומן או יחידה" }).eq("id", s.id);
    return result;
  }
  try {
    const text = await fetchFeed(s.ical_url);
    const today = todayIL();
    const horizon = addDaysISO(today, 730);
    const all = parseIcs(text);
    // our own export echoed back by a channel: never import it (it IS our booking)
    const events = all.filter((e) => !/@atlas-il\.com$/i.test(e.uid) && e.status !== "CANCELLED" && e.end > addDaysISO(today, -1) && e.start < horizon);
    result.events = events.length;

    const { data: existingRows, error: exErr } = await db.from("bookings")
      .select("id, external_uid, check_in_date, check_out_date, status, guest_name, notes")
      .eq("external_sync_id", s.id);
    if (exErr) throw new Error(exErr.message);
    const byUid = new Map((existingRows || []).map((b) => [b.external_uid as string, b]));
    const seen = new Set<string>();
    const conflicts: unknown[] = [];

    for (const ev of events) {
      seen.add(ev.uid);
      const nights = Math.max(1, Math.round((Date.parse(ev.end) - Date.parse(ev.start)) / 86_400_000));
      const ex = byUid.get(ev.uid);
      const row = {
        org_id: s.org_id, property_id: s.property_id, check_in_date: ev.start, check_out_date: ev.end, nights,
        status: "CONFIRMED", source: prov.source, external_uid: ev.uid, external_sync_id: s.id, is_block: true,
      };
      let err: { code?: string; message?: string } | null = null;
      if (ex) {
        const same = ex.check_in_date === ev.start && ex.check_out_date === ev.end && !INACTIVE.has(String(ex.status || "").toUpperCase());
        if (same) continue;
        const r = await db.from("bookings").update({ check_in_date: ev.start, check_out_date: ev.end, nights, status: "CONFIRMED" }).eq("id", ex.id);
        err = r.error;
        if (!err) result.updated += 1;
      } else {
        const r = await db.from("bookings").insert({ ...row, guest_name: guestNameFor(ev, label), notes: `נוסף אוטומטית מסנכרון ${label}${ev.summary ? ` (${ev.summary})` : ""}` });
        err = r.error;
        if (!err) result.created += 1;
      }
      if (err) {
        if (err.code === "23P01") {
          const other = await overlapping(db, s.property_id, ev.start, ev.end, ex?.id);
          conflicts.push({
            uid: ev.uid, start: ev.start, end: ev.end, summary: ev.summary, channel: label,
            with_booking_id: other?.id || null, with_guest: other?.guest_name || null, with_source: other?.source || null,
            with_start: other?.check_in_date || null, with_end: other?.check_out_date || null, detected_at: startedAt,
          });
        } else {
          throw new Error(err.message || "db_error");
        }
      }
    }

    // gone from the feed: cancelled or moved on the channel. Cancel (not delete) future/current ones.
    for (const ex of existingRows || []) {
      if (seen.has(ex.external_uid as string)) continue;
      if (INACTIVE.has(String(ex.status || "").toUpperCase())) continue;
      if ((ex.check_out_date || "") < today) continue;
      const note = [ex.notes, `בוטל אוטומטית: ההזמנה נעלמה מיומן ${label} (${today})`].filter(Boolean).join("\n");
      const r = await db.from("bookings").update({ status: "CANCELLED", notes: note.slice(0, 2000) }).eq("id", ex.id);
      if (!r.error) result.cancelled += 1;
    }

    result.conflicts = conflicts.length;
    result.ok = true;
    await db.from("calendar_syncs").update({
      last_attempt_at: startedAt, last_sync_at: new Date().toISOString(), last_success_at: new Date().toISOString(),
      sync_status: s.sync_status === "PAUSED" ? "PAUSED" : "ACTIVE", error_message: conflicts.length ? `${conflicts.length} התנגשויות: תאריכים שתפוסים כבר ביומן ATLAS` : null,
      events_count: events.length, conflicts,
    }).eq("id", s.id);
  } catch (e) {
    const code = String((e as Error)?.message || e);
    result.error = code;
    await db.from("calendar_syncs").update({ last_attempt_at: startedAt, sync_status: "ERROR", error_message: hebrewError(code) }).eq("id", s.id);
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });
  let body: { all?: boolean; sync_id?: string } = {};
  try { body = await req.json(); } catch { /* empty body */ }

  const isCron = !!CRON_SECRET && req.headers.get("x-atlas-cron") === CRON_SECRET;
  let ids: string[] | null = null;
  if (!isCron) {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "unauthorized" }, 401);
    const userDb = createClient(URL_, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false } });
    // No auth.getUser() round trip (it can take 10-20 s under load): PostgREST verifies the JWT
    // signature itself, and RLS limits the rows to the caller's own org. A bad/expired JWT errors here.
    let q = userDb.from("calendar_syncs").select("id"); // RLS: own org only
    if (body.sync_id) q = q.eq("id", body.sync_id);
    const { data, error } = await q.limit(200);
    if (error) return json({ error: /jwt|token|auth/i.test(`${error.code} ${error.message}`) ? "unauthorized" : "forbidden" }, /jwt|token|auth/i.test(`${error.code} ${error.message}`) ? 401 : 403);
    ids = (data || []).map((r) => r.id);
    if (!ids.length) return json({ ok: true, results: [] });
  }

  let q = db.from("calendar_syncs").select("id, org_id, property_id, provider, ical_url, sync_status, is_active, sync_direction, label");
  if (ids) q = q.in("id", ids);
  else q = q.neq("sync_status", "PAUSED");
  const { data: syncs, error } = await q.limit(2000);
  if (error) return json({ error: error.message }, 500);

  const run = isCron ? await db.from("job_runs").insert({ job: "ical-sync" }).select("id").single() : null;
  const todo = ((syncs || []) as SyncRow[]).filter((s) =>
    s.is_active !== false && String(s.sync_direction || "").toUpperCase() !== "EXPORT" && !(isCron && s.sync_status === "PAUSED"));
  // Feeds are independent: run them 8 at a time so one cron pass stays well inside the
  // Edge Function wall-clock limit as the number of connected units grows.
  const results: Awaited<ReturnType<typeof syncOne>>[] = new Array(todo.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(8, todo.length) }, async () => {
    while (next < todo.length) { const i = next++; results[i] = await syncOne(db, todo[i]); }
  }));
  if (run?.data?.id) {
    await db.from("job_runs").update({ finished_at: new Date().toISOString(), ok: results.every((r) => r.ok), detail: { count: results.length, results } }).eq("id", run.data.id);
  }
  return json({ ok: true, results });
});
