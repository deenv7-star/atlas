// ical-export: public .ics feed of one unit's busy dates, addressed by its secret properties.ical_export_token.
//   GET /functions/v1/ical-export?t=<token>[&channel=airbnb|booking]
// Paste it into Airbnb ("Import calendar") / Booking.com ("Sync calendars → import"). No guest names or
// phone numbers ever leave in the feed: each event is just "ATLAS · תפוס". With ?channel=airbnb the feed leaves
// out events that were imported FROM Airbnb (so a channel never sees its own reservations echoed back).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { buildIcs } from "../_shared/ics.ts";
import { exportEvents } from "../_shared/exportPlan.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let token = url.searchParams.get("t") || "";
  // also accept /ical-export/<token>.ics
  const tail = url.pathname.split("/").pop() || "";
  if (!token && /^[a-f0-9]{24,64}(\.ics)?$/i.test(tail)) token = tail.replace(/\.ics$/i, "");
  token = token.replace(/\.ics$/i, "");
  const channel = (url.searchParams.get("channel") || "").toLowerCase();
  if (!/^[a-f0-9]{24,64}$/i.test(token)) return new Response("not found", { status: 404 });

  const { data: prop } = await db.from("properties").select("id, org_id, name").eq("ical_export_token", token).maybeSingle();
  if (!prop) return new Response("not found", { status: 404 });

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const from = addDaysISO(today, -30);
  // SEC-01: only this unit's own org. ENG-10: rows without check_out_date are included and get an end
  // from `nights` (PostgREST .gte drops NULLs, so ask for them explicitly).
  const { data: rows } = await db.from("bookings")
    .select("id, check_in_date, check_out_date, nights, status, source, updated_at")
    .eq("property_id", prop.id).eq("org_id", prop.org_id)
    .or(`check_out_date.gte.${from},check_out_date.is.null`)
    .limit(3000);

  const events = exportEvents(rows || [], { from, channel });

  const body = buildIcs({ name: `atlas · ${prop.name || "יחידה"}`, events });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="atlas-${token.slice(0, 8)}.ics"`,
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "X-Robots-Tag": "noindex",
    },
  });
});
