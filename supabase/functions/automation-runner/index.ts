// automation-runner: turns the owner's guest-journey rules into a real "to send" queue (message_queue).
//   - rules: automation_rules (is_active) with trigger BOOKING_CONFIRMED | BOOKING_CREATED | CHECKIN_DAY | CHECKOUT_DAY,
//            actions[0] = { type: SEND_WHATSAPP | REQUEST_REVIEW, config: { template } },
//            timing_offset_hours (whole days for day triggers), conditions { send_time: "HH:MM", respect_shabbat: bool }
//   - Shabbat / Yom Tov quiet hours from Hebcal (cached in il_calendar): a message due between candle lighting and
//     havdalah moves to 20 minutes after havdalah (deferred_reason shabbat | holiday).
//   - delivery: today the owner sends with one tap (wa.me, prefilled) from the Today board, which marks the item sent.
//     A server sender (Meta WhatsApp Cloud API) plugs in through SENDERS below; while none is configured nothing is
//     auto-sent and nothing is reported as sent.
// Callers: pg_cron every 15 min (x-atlas-cron) for all orgs; the app (user JWT) for its own org.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

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
const TZ = "Asia/Jerusalem";
const INACTIVE = new Set(["CANCELLED", "CANCELED", "WAITLIST", "DECLINED"]);
const SUPPORTED_TRIGGERS = new Set(["BOOKING_CONFIRMED", "BOOKING_CREATED", "CHECKIN_DAY", "CHECKOUT_DAY"]);
const TEMPLATES = new Set(["confirmation", "arrival_eve", "welcome", "thanks_review", "balance_reminder", "checkin_link"]);

// ── time helpers (Asia/Jerusalem wall clock ⇄ UTC) ──────────────────────────
function ilParts(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, minute: Number(p.minute) };
}
export function ilToUtc(dateISO: string, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const [Y, M, D] = dateISO.split("-").map(Number);
  let guess = Date.UTC(Y, M - 1, D, h, m);
  for (let i = 0; i < 2; i++) {
    const p = ilParts(new Date(guess));
    const [y2, m2, d2] = p.date.split("-").map(Number);
    const shown = Date.UTC(y2, m2 - 1, d2, p.hour, p.minute);
    guess += Date.UTC(Y, M - 1, D, h, m) - shown;
  }
  return new Date(guess);
}
function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Hebcal cache ────────────────────────────────────────────────────────────
function priceRelevant(it: { subcat?: string; title?: string; yomtov?: boolean }) {
  const t = String(it.title || "");
  if (/fast|tzom|ta.anit|tish.a|tisha|shushan|purim katan|rosh chodesh|leil selichot|yom hashoah|yom hazikaron|rabin|herzl|jabotinsky|ben-gurion|sigd|family day|aliyah/i.test(t)) return false;
  return it.subcat === "major" || it.yomtov === true || /erev|chol ha-?moed|ch''m|yom haatzma|lag baomer|tu b'?av|purim/i.test(t);
}

export async function refreshIlCalendar(db: SupabaseClient, force = false) {
  const today = ilParts(new Date()).date;
  if (!force) {
    const { data } = await db.from("il_calendar").select("fetched_at, day").order("day", { ascending: false }).limit(1);
    const last = data?.[0];
    if (last && last.day >= addDays(today, 300) && Date.now() - Date.parse(last.fetched_at) < 7 * 86_400_000) return { refreshed: false };
  }
  const start = addDays(today, -14);
  const end = addDays(today, 420);
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&i=on&maj=on&min=on&mod=on&nx=off&ss=off&mf=on&c=on&geo=geoname&geonameid=281184&M=on&s=off&start=${start}&end=${end}`;
  const res = await fetch(url, { headers: { "User-Agent": "ATLAS/1.0 (+https://atlas-il.com)" } });
  if (!res.ok) throw new Error(`hebcal_${res.status}`);
  const data = await res.json();
  const rows = (data.items || [])
    .filter((it: { category: string }) => ["holiday", "candles", "havdalah"].includes(it.category))
    .map((it: { category: string; date: string; title: string; hebrew?: string; subcat?: string; yomtov?: boolean }) => ({
      day: String(it.date).slice(0, 10),
      kind: it.category,
      title_en: it.category === "holiday" ? it.title : it.category,
      title_he: it.hebrew || null,
      subcat: it.subcat || null,
      yomtov: !!it.yomtov,
      price_relevant: it.category === "holiday" ? priceRelevant(it) : false,
      at: it.category === "holiday" ? null : it.date,
      fetched_at: new Date().toISOString(),
    }));
  // de-duplicate on the unique key
  const seen = new Set<string>();
  const uniq = rows.filter((r: { day: string; kind: string; title_en: string }) => { const k = `${r.day}|${r.kind}|${r.title_en}`; if (seen.has(k)) return false; seen.add(k); return true; });
  for (let i = 0; i < uniq.length; i += 200) {
    const { error } = await db.from("il_calendar").upsert(uniq.slice(i, i + 200), { onConflict: "day,kind,title_en" });
    if (error) throw new Error(error.message);
  }
  return { refreshed: true, rows: uniq.length };
}

type Window = { from: number; to: number; reason: "shabbat" | "holiday" };
async function quietWindows(db: SupabaseClient, fromISO: string, toISO: string): Promise<Window[]> {
  const { data } = await db.from("il_calendar").select("day, kind, at").in("kind", ["candles", "havdalah"]).gte("day", addDays(fromISO, -3)).lte("day", addDays(toISO, 3)).order("at");
  const out: Window[] = [];
  const list = (data || []).filter((r) => r.at);
  for (let i = 0; i < list.length; i++) {
    if (list[i].kind !== "candles") continue;
    const end = list.slice(i + 1).find((r) => r.kind === "havdalah");
    if (!end) continue;
    const from = Date.parse(list[i].at);
    if (out.length && from <= out[out.length - 1].to) continue; // second candle lighting inside the same window
    const toDate = new Date(end.at);
    const isSat = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(toDate) === "Sat";
    out.push({ from, to: toDate.getTime(), reason: isSat ? "shabbat" : "holiday" });
  }
  return out;
}

/** A message due inside a quiet window (candle lighting → havdalah) moves to 20 minutes after havdalah. */
export function deferForQuiet(due: Date, windows: Window[]): { due: Date; reason: string | null } {
  const w = windows.find((x) => due.getTime() >= x.from && due.getTime() < x.to);
  return w ? { due: new Date(w.to + 20 * 60_000), reason: w.reason } : { due, reason: null };
}
export { quietWindows };

// ── senders (pluggable) ─────────────────────────────────────────────────────
type QueueItem = { id: string; org_id: string; booking_id: string; template_key: string; recipient: string | null };
interface Sender { id: string; enabledFor(orgId: string): Promise<boolean>; send(item: QueueItem): Promise<{ ok: boolean; providerId?: string; error?: string }> }
// Meta WhatsApp Cloud API: needs an approved template per key + a phone number id per org. Off until configured.
const MetaCloudSender: Sender = {
  id: "meta_cloud",
  async enabledFor(_orgId: string) {
    return !!Deno.env.get("META_WA_TOKEN") && !!Deno.env.get("META_WA_PHONE_NUMBER_ID");
  },
  async send(item: QueueItem) {
    const token = Deno.env.get("META_WA_TOKEN");
    const phoneId = Deno.env.get("META_WA_PHONE_NUMBER_ID");
    if (!token || !phoneId || !item.recipient) return { ok: false, error: "not_configured" };
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: "whatsapp", to: item.recipient, type: "template", template: { name: `atlas_${item.template_key}`, language: { code: "he" } } }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, providerId: data?.messages?.[0]?.id } : { ok: false, error: `meta_${res.status}` };
  },
};
const SENDERS: Sender[] = [MetaCloudSender];

function normalizePhone(raw: string | null | undefined) {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = `972${d.slice(1)}`;
  return d.length >= 9 ? d : "";
}

type Rule = { id: string; org_id: string; trigger: string; timing_offset_hours: number | null; actions: unknown; conditions: unknown; is_active: boolean; created_at: string; updated_at: string | null };
function ruleTemplate(r: Rule): string | null {
  const acts = Array.isArray(r.actions) ? r.actions as { type?: string; config?: { template?: string } }[] : [];
  const a = acts.find((x) => x?.type === "SEND_WHATSAPP" || x?.type === "REQUEST_REVIEW");
  if (!a) return null;
  const t = a.config?.template || (a.type === "REQUEST_REVIEW" ? "thanks_review" : null);
  return t && TEMPLATES.has(t) ? t : null;
}
function ruleConds(r: Rule) {
  const c = (r.conditions && !Array.isArray(r.conditions) ? r.conditions : {}) as { send_time?: string; respect_shabbat?: boolean };
  const t = /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(c.send_time || "")) ? String(c.send_time) : "10:00";
  return { sendTime: t.padStart(5, "0"), respectShabbat: c.respect_shabbat !== false };
}

async function runOrg(db: SupabaseClient, orgId: string, windows: Window[], now: Date) {
  const out = { org_id: orgId, created: 0, deferred: 0, skipped: 0, sent: 0, pending: 0 };
  const { data: rules } = await db.from("automation_rules").select("*").eq("org_id", orgId).eq("is_active", true);
  const active = ((rules || []) as Rule[]).filter((r) => SUPPORTED_TRIGGERS.has(r.trigger) && ruleTemplate(r));
  const today = ilParts(now).date;
  const nowMs = now.getTime();
  const LOOKBACK = 48 * 3600_000; // don't flood an owner with old messages when a rule is first switched on
  const LOOKAHEAD = 24 * 3600_000; // plan a day ahead so the board can say what's coming

  const { data: bookings } = await db.from("bookings")
    .select("id, org_id, guest_name, guest_phone, check_in_date, check_out_date, status, created_at, is_block")
    .eq("org_id", orgId).gte("check_out_date", addDays(today, -3)).lte("check_in_date", addDays(today, 3)).limit(2000);
  const { data: recentBookings } = await db.from("bookings")
    .select("id, org_id, guest_name, guest_phone, check_in_date, check_out_date, status, created_at, is_block")
    .eq("org_id", orgId).gte("created_at", new Date(nowMs - LOOKBACK).toISOString()).gte("check_in_date", today).limit(500);
  const all = new Map<string, Record<string, unknown>>();
  for (const b of [...(bookings || []), ...(recentBookings || [])]) all.set(b.id as string, b);
  const live = [...all.values()].filter((b) => !INACTIVE.has(String(b.status || "").toUpperCase()) && !/^חסום/.test(String(b.guest_name || "")));

  const wanted = new Map<string, Record<string, unknown>>();
  for (const r of active) {
    const tpl = ruleTemplate(r)!;
    const { sendTime, respectShabbat } = ruleConds(r);
    const days = Math.round(Number(r.timing_offset_hours || 0) / 24);
    for (const b of live) {
      let anchor = "";
      let due: Date;
      if (r.trigger === "CHECKIN_DAY" || r.trigger === "CHECKOUT_DAY") {
        anchor = String(r.trigger === "CHECKIN_DAY" ? b.check_in_date : b.check_out_date || "");
        if (!anchor) continue;
        due = ilToUtc(addDays(anchor, days), sendTime);
      } else {
        // booking confirmed / created: right away, only for bookings created after the rule was switched on
        const created = Date.parse(String(b.created_at || ""));
        if (!created || created < Date.parse(r.updated_at || r.created_at)) continue;
        if (r.trigger === "BOOKING_CONFIRMED" && !["CONFIRMED", "APPROVED"].includes(String(b.status || "").toUpperCase())) continue;
        anchor = String(b.created_at).slice(0, 10);
        due = new Date(Math.max(created, nowMs - 60_000));
      }
      const original = new Date(due);
      let reason: string | null = null;
      if (respectShabbat) {
        const d = deferForQuiet(due, windows);
        due = d.due; reason = d.reason;
      }
      if (due.getTime() < nowMs - LOOKBACK || due.getTime() > nowMs + LOOKAHEAD) continue;
      const key = `${r.id}:${b.id}:${anchor}`;
      wanted.set(key, {
        org_id: orgId, booking_id: b.id, rule_id: r.id, template_key: tpl, channel: "whatsapp",
        recipient: normalizePhone(b.guest_phone as string) || null, due_at: due.toISOString(),
        original_due_at: reason ? original.toISOString() : null, deferred_reason: reason, status: "pending", dedupe_key: key,
      });
    }
  }

  // existing queue for this org: keep sent, re-validate pending
  const { data: existing } = await db.from("message_queue").select("id, dedupe_key, status, booking_id, recipient").eq("org_id", orgId).gte("created_at", new Date(nowMs - 30 * 86_400_000).toISOString()).limit(5000);
  const have = new Map((existing || []).map((q) => [q.dedupe_key, q]));
  const liveById = new Map(live.map((b) => [b.id as string, b]));
  const ruleById = new Map(active.map((r) => [r.id, r]));
  const skip = async (id: string, why: string) => {
    await db.from("message_queue").update({ status: "skipped", error: why, updated_at: new Date().toISOString() }).eq("id", id);
    out.skipped += 1;
  };
  for (const q of existing || []) {
    if (q.status !== "pending") continue;
    const [ruleId, , keyAnchor] = q.dedupe_key.split(":");
    const w = wanted.get(q.dedupe_key);
    if (w) {
      if (w.recipient && w.recipient !== q.recipient) await db.from("message_queue").update({ recipient: w.recipient, updated_at: new Date().toISOString() }).eq("id", q.id);
      continue;
    }
    const rule = ruleById.get(ruleId);
    if (!rule) { await skip(q.id, "rule_off"); continue; }
    let b = liveById.get(q.booking_id);
    if (!b) {
      const { data: bk } = await db.from("bookings").select("id, status, check_in_date, check_out_date, created_at").eq("id", q.booking_id).maybeSingle();
      if (!bk || INACTIVE.has(String(bk.status || "").toUpperCase())) { await skip(q.id, "booking_cancelled"); continue; }
      b = bk;
    }
    const anchorNow = rule.trigger === "CHECKIN_DAY" ? b.check_in_date : rule.trigger === "CHECKOUT_DAY" ? b.check_out_date : String(b.created_at || "").slice(0, 10);
    if (String(anchorNow || "") !== keyAnchor) await skip(q.id, "booking_changed");
  }
  const toInsert = [...wanted.entries()].filter(([k]) => !have.has(k)).map(([, v]) => v);
  if (toInsert.length) {
    const { error } = await db.from("message_queue").upsert(toInsert, { onConflict: "org_id,dedupe_key", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    out.created = toInsert.length;
    out.deferred = toInsert.filter((x) => x.deferred_reason).length;
  }

  // server delivery, only when a real sender is configured for the org
  for (const s of SENDERS) {
    if (!(await s.enabledFor(orgId))) continue;
    const { data: due } = await db.from("message_queue").select("id, org_id, booking_id, template_key, recipient").eq("org_id", orgId).eq("status", "pending").lte("due_at", now.toISOString()).not("recipient", "is", null).limit(100);
    for (const item of (due || []) as QueueItem[]) {
      const r = await s.send(item);
      await db.from("message_queue").update(r.ok
        ? { status: "sent", sent_at: new Date().toISOString(), sent_via: s.id, provider_message_id: r.providerId || null, updated_at: new Date().toISOString() }
        : { error: r.error || "send_failed", updated_at: new Date().toISOString() }).eq("id", item.id);
      if (r.ok) out.sent += 1;
    }
  }
  const { count } = await db.from("message_queue").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "pending").lte("due_at", now.toISOString());
  out.pending = count || 0;
  return out;
}

if (import.meta.main) Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });
  let body: { all?: boolean; refresh_calendar?: boolean } = {};
  try { body = await req.json(); } catch { /* */ }
  const isCron = !!CRON_SECRET && req.headers.get("x-atlas-cron") === CRON_SECRET;

  let orgIds: string[] = [];
  if (isCron) {
    const { data } = await db.from("automation_rules").select("org_id").eq("is_active", true).limit(5000);
    orgIds = [...new Set((data || []).map((r) => r.org_id as string))];
  } else {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const userDb = createClient(URL_, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false } });
    const { data: u, error } = await userDb.auth.getUser(jwt);
    if (error || !u?.user) return json({ error: "unauthorized" }, 401);
    const { data: org } = await userDb.rpc("current_org_id");
    if (!org) return json({ error: "no_org" }, 403);
    orgIds = [org as string];
  }

  const run = isCron ? await db.from("job_runs").insert({ job: "automation-runner" }).select("id").single() : null;
  const now = new Date();
  let cal: unknown = null;
  try { cal = await refreshIlCalendar(db, !!body.refresh_calendar && isCron); } catch (e) { cal = { error: String((e as Error).message) }; }
  const windows = await quietWindows(db, addDays(ilParts(now).date, -3), addDays(ilParts(now).date, 3));
  const results = [];
  for (const id of orgIds) {
    try { results.push(await runOrg(db, id, windows, now)); }
    catch (e) { results.push({ org_id: id, error: String((e as Error).message) }); }
  }
  if (run?.data?.id) await db.from("job_runs").update({ finished_at: new Date().toISOString(), ok: results.every((r) => !("error" in r)), detail: { calendar: cal, orgs: results.length, results } }).eq("id", run.data.id);
  return json({ ok: true, calendar: cal, quiet_windows: windows.length, results: isCron ? results.length : results });
});
