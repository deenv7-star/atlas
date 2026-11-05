// lead-intake: one inbound URL per organization that turns any form / Zapier / Make post into a lead (פנייה).
//   POST /functions/v1/lead-intake?t=<org token>      (JSON, form-urlencoded or multipart)
//   GET  /functions/v1/lead-intake                    → {"ok":true,"service":"lead-intake"}  (the app's "is it deployed?" probe)
//
// The token is organizations.settings->>'leads_webhook_token' (32+ hex chars, made by the owner in the inbox).
// Deploy WITHOUT JWT verification (public endpoint, the token is the secret):
//   supabase functions deploy lead-intake --no-verify-jwt
// Inserting a lead fires the existing push trigger (030, trg_push_lead_new), so the owner gets a notification.
// NOT DEPLOYED: needs Deen's OK (qa/leads-v2/DEPLOY.md).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "X-Robots-Tag": "noindex" } });

const PER_HOUR = 120;
const KNOWN_SOURCES = ["facebook", "instagram", "google", "website", "form", "zapier", "make", "email", "whatsapp", "directory"];

/** First non-empty value among many possible field names (Facebook Lead Ads, Wix, Elementor, Google Forms, Typeform…). */
function pick(o: Record<string, unknown>, keys: string[]): string {
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) lower[k.toLowerCase().replace(/[\s-]+/g, "_")] = v;
  for (const k of keys) {
    const v = lower[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(Array.isArray(v) ? v[0] : v).trim();
  }
  return "";
}

/** "2026-12-24", "24/12/2026", "24.12.26" → "2026-12-24"; anything else → null. */
export function toISODate(raw: string): string | null {
  const s = String(raw || "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") || "";
  try {
    if (type.includes("application/json")) {
      const b = await req.json();
      // Facebook Lead Ads via Make/Zapier sometimes arrive as field_data: [{name, values:[..]}]
      if (b && Array.isArray(b.field_data)) {
        const flat: Record<string, unknown> = { ...b };
        for (const f of b.field_data) if (f?.name) flat[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
        return flat;
      }
      return b && typeof b === "object" ? b : {};
    }
    if (type.includes("form")) {
      const fd = await req.formData();
      return Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
    }
    const text = await req.text();
    try { return JSON.parse(text); } catch { return Object.fromEntries(new URLSearchParams(text)); }
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  if (req.method === "GET" && !token) return json({ ok: true, service: "lead-intake" });
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  if (!/^[a-f0-9]{32,64}$/i.test(token)) return json({ ok: false, error: "not_found" }, 404);

  const { data: org } = await db.from("organizations").select("id").eq("settings->>leads_webhook_token", token).maybeSingle();
  if (!org) return json({ ok: false, error: "not_found" }, 404);

  const body = await readBody(req);
  let name = pick(body, ["full_name", "name", "fullname", "שם", "שם_מלא", "your_name", "contact_name"]);
  if (!name) name = [pick(body, ["first_name", "firstname", "שם_פרטי"]), pick(body, ["last_name", "lastname", "שם_משפחה"])].filter(Boolean).join(" ");
  const phone = pick(body, ["phone", "phone_number", "mobile", "tel", "telephone", "טלפון", "נייד", "whatsapp"]);
  const email = pick(body, ["email", "e_mail", "mail", "אימייל", "מייל"]);
  if (!name && !phone && !email) return json({ ok: false, error: "missing_fields" }, 422);

  const ci = toISODate(pick(body, ["check_in", "check_in_date", "checkin", "arrival", "from", "date_from", "start_date", "תאריך_הגעה", "כניסה"]));
  let co = toISODate(pick(body, ["check_out", "check_out_date", "checkout", "departure", "to", "date_to", "end_date", "תאריך_עזיבה", "יציאה"]));
  if (ci && co && co <= ci) co = null;
  const today = new Date().toISOString().slice(0, 10);
  const checkIn = ci && ci >= today ? ci : null;
  const num = (v: string, d: number, max = 30) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : d; };
  const guests = pick(body, ["guests", "people", "pax", "אורחים", "מספר_אורחים"]);
  const adults = num(pick(body, ["adults", "מבוגרים"]) || guests, 2);
  const children = num(pick(body, ["children", "kids", "ילדים"]), 0);
  const message = pick(body, ["message", "notes", "comments", "comment", "msg", "הודעה", "הערות", "תוכן"]);
  const srcRaw = (url.searchParams.get("source") || pick(body, ["source", "utm_source", "platform"])).toLowerCase();
  const src = KNOWN_SOURCES.find((s) => srcRaw.includes(s)) || "webhook";

  // Optional unit: ?unit=<slug> or a "unit" field matching a property's public_slug or name in this org.
  let propertyId: string | null = null;
  const unit = url.searchParams.get("unit") || pick(body, ["unit", "property", "יחידה", "צימר"]);
  if (unit) {
    const { data: props } = await db.from("properties").select("id, name, public_slug").eq("org_id", org.id).limit(200);
    const hit = (props || []).find((p) => p.public_slug === unit || p.id === unit || (p.name || "").trim() === unit.trim());
    if (hit) propertyId = hit.id;
  }

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("leads").select("id", { count: "exact", head: true }).eq("org_id", org.id).like("source", "webhook%").gte("created_at", since);
  if ((count || 0) >= PER_HOUR) return json({ ok: false, error: "rate_limited" }, 429);

  const notes = [
    src === "webhook" ? "פנייה מחיבור אוטומטי" : `פנייה מחיבור אוטומטי (${src})`,
    message.slice(0, 1000),
  ].filter(Boolean).join("\n");

  const row = {
    org_id: org.id,
    property_id: propertyId,
    full_name: (name || phone || email).slice(0, 120),
    phone: phone.slice(0, 30) || null,
    email: email.slice(0, 160) || null,
    check_in_date: checkIn,
    check_out_date: checkIn ? co : null,
    nights: checkIn && co ? Math.round((Date.parse(co) - Date.parse(checkIn)) / 86400000) : null,
    adults: Math.max(1, adults),
    children,
    notes: notes.slice(0, 1200),
    source: src === "webhook" ? "webhook" : `webhook:${src}`,
    status: "NEW",
  };
  const { data: lead, error } = await db.from("leads").insert(row).select("id").single();
  if (error) return json({ ok: false, error: "insert_failed" }, 500);
  return json({ ok: true, id: lead.id });
});
