// send-push: Web Push to every enabled device of an organization when a booking or lead is created.
// NOT DEPLOYED. See qa/pwa/setup.md in the project (VAPID secrets, migration 022, deploy order).
//
// Callers:
//   DB trigger (migration 022) via public.atlas_call_edge('send-push', {...})
//       header x-atlas-cron: <ATLAS_CRON_SECRET>, body {"kind":"booking"|"lead","id":uuid,"org_id":uuid,"actor":uuid|null}
//   "שליחת התראת ניסיון" in Settings
//       Authorization: Bearer <user JWT>, body {"test": true}  -> only that user's own devices
//
// Rules:
//   - the person who created the row (actor) is not notified on their own devices; teammates are
//   - iCal: only bookings that are not cancelled and end today or later, and never the first import of a
//     calendar (calendar_syncs.last_success_at still null), so connecting Airbnb doesn't fire 40 notifications
//   - each device's prefs decide per kind (bookings / leads / ical)
//   - 404 / 410 from the push service -> the device row is deleted; 5 failures in a row -> disabled
//
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:support@atlas-il.com), ATLAS_CRON_SECRET.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { importVapidKeys, sendWebPush } from "../_shared/webpush.js";
import { bookingMessage, leadMessage, bookingKind, toPayload, PREF_FOR_KIND } from "../_shared/pushMessages.js";

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
const MAX_FAILURES = 5;
const UUID = /^[0-9a-f-]{36}$/i;

function todayIL(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

let vapidPromise: Promise<any> | null = null;
function vapid() {
  if (!vapidPromise) {
    vapidPromise = importVapidKeys({
      publicKey: Deno.env.get("VAPID_PUBLIC_KEY") || "",
      privateKey: Deno.env.get("VAPID_PRIVATE_KEY") || "",
      subject: Deno.env.get("VAPID_SUBJECT") || "mailto:support@atlas-il.com",
    });
  }
  return vapidPromise;
}

type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; prefs: Record<string, boolean>; failure_count: number };

async function deliver(db: any, subs: Sub[], payload: string, topic: string) {
  const v = await vapid();
  const results = await Promise.all(subs.map(async (s) => {
    try {
      const r = await sendWebPush({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, v, { ttl: 86400, urgency: "high", topic });
      if (r.ok) {
        await db.from("push_subscriptions").update({ failure_count: 0, last_sent_at: new Date().toISOString() }).eq("id", s.id);
      } else if (r.gone) {
        await db.from("push_subscriptions").delete().eq("id", s.id);
      } else {
        const n = (s.failure_count || 0) + 1;
        await db.from("push_subscriptions").update({ failure_count: n, disabled_at: n >= MAX_FAILURES ? new Date().toISOString() : null }).eq("id", s.id);
      }
      return { id: s.id, status: r.status };
    } catch (e) {
      return { id: s.id, status: 0, error: String((e as Error)?.message || e).slice(0, 120) };
    }
  }));
  return { sent: results.filter((r) => r.status >= 200 && r.status < 300).length, total: subs.length, results };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });

  // ── test notification from Settings: the caller's own devices only ──
  if (body?.test === true) {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "unauthorized" }, 401);
    const userDb = createClient(URL_, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false } });
    const { data: u } = await userDb.auth.getUser();
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: subs } = await db.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth, prefs, failure_count").eq("user_id", u.user.id).is("disabled_at", null);
    if (!subs?.length) return json({ sent: 0, total: 0 });
    const payload = toPayload({ kind: "test", title: "ההתראות פועלות", body: "כך תיראה התראה על הזמנה חדשה", url: "/today", tag: "atlas-test" });
    return json(await deliver(db, subs as Sub[], payload, "atlas-test"));
  }

  // ── trigger call ──
  const secret = req.headers.get("x-atlas-cron") || "";
  if (!CRON_SECRET || secret !== CRON_SECRET) return json({ error: "unauthorized" }, 401);
  const kindIn = body?.kind;
  if ((kindIn !== "booking" && kindIn !== "lead") || !UUID.test(body?.id || "") || !UUID.test(body?.org_id || "")) {
    return json({ error: "bad_request" }, 400);
  }
  const actor = UUID.test(body?.actor || "") ? body.actor : null;

  let msg: ReturnType<typeof bookingMessage> | null = null;
  if (kindIn === "booking") {
    const { data: b } = await db.from("bookings")
      .select("id, org_id, guest_name, check_in_date, check_out_date, nights, source, status, property_name, unit_id, property_id, external_sync_id, external_uid, is_block")
      .eq("id", body.id).eq("org_id", body.org_id).maybeSingle();
    if (!b) return json({ skipped: "not_found" });
    if (/^(CANCELLED|CANCELED|DECLINED)$/i.test(b.status || "")) return json({ skipped: "cancelled" });
    if (bookingKind(b) === "ical") {
      if (b.check_out_date && b.check_out_date < todayIL()) return json({ skipped: "past" });
      if (b.external_sync_id) {
        const { data: cs } = await db.from("calendar_syncs").select("last_success_at").eq("id", b.external_sync_id).maybeSingle();
        if (cs && !cs.last_success_at) return json({ skipped: "first_import" });
      }
    }
    let unitName = "";
    if (b.unit_id) {
      const { data: un } = await db.from("units").select("name").eq("id", b.unit_id).maybeSingle();
      unitName = un?.name || "";
    }
    let propertyName = "";
    if (!unitName && !b.property_name && b.property_id) {
      const { data: p } = await db.from("properties").select("name").eq("id", b.property_id).maybeSingle();
      propertyName = p?.name || "";
    }
    msg = bookingMessage(b, { unitName, propertyName });
  } else {
    const { data: l } = await db.from("leads").select("id, org_id, full_name, check_in_date, check_out_date, adults, children")
      .eq("id", body.id).eq("org_id", body.org_id).maybeSingle();
    if (!l) return json({ skipped: "not_found" });
    msg = leadMessage(l);
  }

  const pref = PREF_FOR_KIND[msg.kind as keyof typeof PREF_FOR_KIND];
  const { data: all } = await db.from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth, prefs, failure_count")
    .eq("org_id", body.org_id).is("disabled_at", null);
  const subs = ((all || []) as Sub[]).filter((s) => s.user_id !== actor && (s.prefs?.[pref] ?? true) !== false);
  if (!subs.length) return json({ skipped: "no_devices" });
  return json({ kind: msg.kind, ...(await deliver(db, subs, toPayload(msg), msg.tag)) });
});
