// integrations: owner-connected services that need a secret. PREPARED, NOT DEPLOYED (05.11.2026).
// Before deploy (Deen's OK): migration 038_integrations, edge secrets INTEGRATIONS_ENC_KEY (32 random bytes, base64)
// and ATLAS_INTEGRATIONS_SECRET (same value as Vault 'atlas_integrations_secret'), then VITE_INTEGRATIONS_V1=1 on Vercel.
//
// Providers
//   MORNING  (Morning / חשבונית ירוקה) client_id + client_secret → OAuth client_credentials at api.morning.co,
//            documents at api.greeninvoice.co.il/api/v1/documents. Needs the owner's Best plan or higher.
//            https://developers.morning.co/api · https://www.greeninvoice.co.il/help-center/generating-api-key/
//   ICOUNT   (iCount) API v3 token as Bearer. https://apiv3.icount.co.il/new_api_docs/welcome.md
//   WEBHOOK  URL (Zapier / Make / n8n). Every POST is signed: X-Atlas-Signature: sha256=<hex HMAC of the body>.
//
// Callers
//   app (Authorization: Bearer <user JWT>) → { action: 'list' | 'connect' | 'disconnect' | 'issue_receipt' | 'webhook_test', ... }
//   DB trigger (x-atlas-int: <ATLAS_INTEGRATIONS_SECRET>) → { action: 'dispatch', org_id, event, ref_id }
//
// Secrets never leave this function: they are encrypted with AES-GCM before they reach the DB and are never
// returned to the browser (list returns provider, status, a 4-char hint and non-secret options only).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { isPublicFeedUrl, checkResolvedHost } from "../_shared/feedUrl.ts";

const ORIGINS = ["https://atlas-il.com", "https://www.atlas-il.com", "capacitor://localhost", "http://localhost:5173"];
function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const ENC_KEY_B64 = Deno.env.get("INTEGRATIONS_ENC_KEY") || "";
const INT_SECRET = Deno.env.get("ATLAS_INTEGRATIONS_SECRET") || "";
const MORNING_TOKEN = "https://api.morning.co/idp/v1/oauth/token";
const MORNING_API = "https://api.greeninvoice.co.il/api/v1";
const ICOUNT_API = "https://api.icount.co.il/api/v3.php";

// ── crypto ────────────────────────────────────────────────────────────────────────────────────────────
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
let keyP: Promise<CryptoKey> | null = null;
function encKey() {
  if (!ENC_KEY_B64) throw new Error("not_configured");
  keyP ??= crypto.subtle.importKey("raw", unb64(ENC_KEY_B64), "AES-GCM", false, ["encrypt", "decrypt"]);
  return keyP;
}
export async function seal(obj: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encKey(), new TextEncoder().encode(JSON.stringify(obj))));
  return `v1:${b64(iv)}:${b64(ct)}`;
}
export async function open<T>(s: string): Promise<T> {
  const [v, iv, ct] = s.split(":");
  if (v !== "v1") throw new Error("bad_secret");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await encKey(), unb64(ct));
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}
async function hmacHex(secret: string, body: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body)));
  return [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEq(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ── providers ─────────────────────────────────────────────────────────────────────────────────────────
type MorningCreds = { client_id: string; client_secret: string };
type ICountCreds = { token: string };
type WebhookCreds = { url: string; signing_secret: string };

async function morningToken(c: MorningCreds): Promise<string> {
  const r = await fetch(MORNING_TOKEN, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: c.client_id.trim(), client_secret: c.client_secret.trim() }),
  });
  if (r.status === 401 || r.status === 400) throw new Error("bad_credentials");
  if (r.status === 403) throw new Error("plan_required");     // Morning: API keys only on Best and above
  if (!r.ok) throw new Error(`provider_${r.status}`);
  const j = await r.json();
  if (!j?.accessToken) throw new Error("bad_credentials");
  return j.accessToken as string;
}

async function icountCall(c: ICountCreds, path: string, body: Record<string, unknown>) {
  const r = await fetch(`${ICOUNT_API}/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.token.trim()}` },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 || j?.reason === "bad_token" || j?.reason === "auth_required") throw new Error("bad_credentials");
  if (!r.ok || j?.status === false) throw new Error(j?.reason ? `provider_${String(j.reason).slice(0, 40)}` : `provider_${r.status}`);
  return j;
}

async function assertPublicUrl(u: string) {
  if (!/^https:\/\//i.test(u) || !isPublicFeedUrl(u)) throw new Error("bad_url");
  const verdict = await checkResolvedHost(new URL(u).hostname, typeof Deno.resolveDns === "function" ? (h, t) => Deno.resolveDns(h, t) as Promise<string[]> : null);
  if (verdict === "private") throw new Error("bad_url");
}

async function postWebhook(c: WebhookCreds, payload: Record<string, unknown>) {
  await assertPublicUrl(c.url);
  const body = JSON.stringify(payload);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const r = await fetch(c.url, {
      method: "POST", signal: ctrl.signal, redirect: "error",
      headers: { "Content-Type": "application/json", "User-Agent": "atlas-webhooks/1.0 (+https://atlas-il.com)", "X-Atlas-Event": String(payload.event), "X-Atlas-Signature": `sha256=${await hmacHex(c.signing_secret, body)}` },
      body,
    });
    if (!r.ok) throw new Error(`http_${r.status}`);
  } finally { clearTimeout(t); }
}

// ── documents ─────────────────────────────────────────────────────────────────────────────────────────
// doc_type: 'receipt' (עוסק פטור → קבלה) or 'invoice_receipt' (עוסק מורשה / חברה → חשבונית מס-קבלה). Chosen by the owner.
const MORNING_TYPE = { receipt: 400, invoice_receipt: 320 } as const;
const ICOUNT_TYPE = { receipt: "receipt", invoice_receipt: "invrec" } as const;
// Morning payment type codes: 1 cash, 2 cheque, 3 credit card, 4 bank transfer, 10 payment app, 11 other.
function morningPayType(method: string) {
  const m = method.toLowerCase();
  if (/cash|מזומן/.test(m)) return 1;
  if (/check|cheque|צ׳ק|צק/.test(m)) return 2;
  if (/card|credit|אשראי/.test(m)) return 3;
  if (/bank|transfer|העברה/.test(m)) return 4;
  if (/bit|paybox|app|ביט|פייבוקס/.test(m)) return 10;
  return 11;
}

type Pay = { id: string; org_id: string; amount: number; method: string | null; paid_date: string | null; paid_at: string | null; status: string; booking_id: string | null };
type Bk = { guest_name: string | null; guest_email: string | null; guest_phone: string | null; check_in_date: string | null; check_out_date: string | null; property_id: string | null };

async function issueReceipt(db: SupabaseClient, orgId: string, paymentId: string, sendEmail: boolean) {
  const { data: done } = await db.from("integration_documents").select("doc_number, doc_url, provider").eq("payment_id", paymentId).maybeSingle();
  if (done) return { ok: true, already: true, ...done };
  const { data: pay } = await db.from("payments").select("id, org_id, amount, method, paid_date, paid_at, status, booking_id").eq("id", paymentId).eq("org_id", orgId).maybeSingle<Pay>();
  if (!pay) throw new Error("not_found");
  if (String(pay.status).toUpperCase() !== "PAID") throw new Error("not_paid");
  const { data: bk } = pay.booking_id
    ? await db.from("bookings").select("guest_name, guest_email, guest_phone, check_in_date, check_out_date, property_id").eq("id", pay.booking_id).eq("org_id", orgId).maybeSingle<Bk>()
    : { data: null as Bk | null };
  let unit = "";
  if (bk?.property_id) { const { data: p } = await db.from("properties").select("name").eq("id", bk.property_id).maybeSingle(); unit = p?.name || ""; }

  const { data: conns } = await db.from("integration_connections").select("provider, secret_enc, config, status").eq("org_id", orgId).in("provider", ["MORNING", "ICOUNT"]).eq("status", "ACTIVE");
  const conn = (conns || [])[0];
  if (!conn) throw new Error("not_connected");
  const docType = (conn.config?.doc_type === "invoice_receipt" ? "invoice_receipt" : "receipt") as "receipt" | "invoice_receipt";
  const date = (pay.paid_date || (pay.paid_at || new Date().toISOString()).slice(0, 10));
  const desc = `אירוח${unit ? ` ב${unit}` : ""}${bk?.check_in_date ? ` ${bk.check_in_date}${bk.check_out_date ? `–${bk.check_out_date}` : ""}` : ""}`.slice(0, 200);
  const guest = (bk?.guest_name || "אורח").slice(0, 80);
  const amount = Number(pay.amount) || 0;
  if (amount <= 0) throw new Error("bad_amount");

  let number = "", url = "", ext = "";
  if (conn.provider === "MORNING") {
    const token = await morningToken(await open<MorningCreds>(conn.secret_enc));
    const body = {
      type: MORNING_TYPE[docType], lang: "he", currency: "ILS", vatType: 0, date,
      description: desc,
      client: { name: guest, emails: sendEmail && bk?.guest_email ? [bk.guest_email] : [], phone: bk?.guest_phone || undefined, add: false },
      income: [{ description: desc, quantity: 1, price: amount, currency: "ILS", vatType: 1 }], // price includes VAT where applicable
      payment: [{ date, type: morningPayType(pay.method || ""), price: amount, currency: "ILS" }],
    };
    const r = await fetch(`${MORNING_API}/documents`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`provider_${j?.errorCode || r.status}`);
    number = String(j?.number ?? ""); url = j?.url?.he || j?.url?.origin || ""; ext = String(j?.id ?? "");
  } else {
    const c = await open<ICountCreds>(conn.secret_enc);
    // iCount doc/create: sanity_string (max 30) blocks a duplicate document for the same payment.
    // VERIFY against an iCount sandbox / real account before enabling: the shape of the cash / banktransfer / cc rows.
    const pm = (pay.method || "").toLowerCase();
    const payRow = /card|credit|אשראי/.test(pm) ? { cc: { sum: amount } } : /bank|transfer|העברה/.test(pm) ? { banktransfer: { sum: amount, date } } : { cash: { sum: amount } };
    const j = await icountCall(c, "doc/create", {
      doctype: ICOUNT_TYPE[docType], client_name: guest, email: bk?.guest_email || undefined, currency_code: "ILS", lang: "he",
      items: [{ description: desc, unitprice_incvat: amount, quantity: 1 }],
      ...payRow,
      sanity_string: paymentId.replace(/-/g, "").slice(0, 30),
      send_email: sendEmail && !!bk?.guest_email,
    });
    number = String(j?.docnum ?? ""); url = j?.doc_url || ""; ext = String(j?.doc_id ?? j?.docnum ?? "");
  }
  await db.from("integration_documents").insert({ org_id: orgId, payment_id: paymentId, provider: conn.provider, doc_type: docType, doc_number: number, doc_url: url, external_id: ext });
  await db.from("integration_connections").update({ last_ok_at: new Date().toISOString(), last_error: null }).eq("org_id", orgId).eq("provider", conn.provider);
  return { ok: true, provider: conn.provider, doc_number: number, doc_url: url };
}

// ── outgoing event payloads (no secrets, only what an owner's own automation needs) ───────────────────
async function eventPayload(db: SupabaseClient, orgId: string, event: string, refId: string) {
  const base = { id: crypto.randomUUID(), event, created_at: new Date().toISOString() };
  if (event.startsWith("booking.")) {
    const { data } = await db.from("bookings").select("id, property_id, guest_name, guest_phone, guest_email, check_in_date, check_out_date, nights, adults, status, total_price, source").eq("id", refId).eq("org_id", orgId).maybeSingle();
    return { ...base, data };
  }
  if (event === "payment.paid") {
    const { data } = await db.from("payments").select("id, booking_id, amount, currency, method, paid_date, status").eq("id", refId).eq("org_id", orgId).maybeSingle();
    return { ...base, data };
  }
  if (event === "lead.created") {
    const { data } = await db.from("leads").select("id, name, phone, email, source, check_in_date, check_out_date, created_at").eq("id", refId).eq("org_id", orgId).maybeSingle();
    return { ...base, data };
  }
  return { ...base, data: null };
}

function hebrewError(code: string) {
  if (code === "bad_credentials") return "הפרטים לא התקבלו אצל הספק. העתיקו אותם שוב ונסו שוב.";
  if (code === "plan_required") return "המפתח תקין, אבל המסלול אצל הספק לא כולל חיבור (API). במורנינג זה מסלול Best ומעלה.";
  if (code === "bad_url") return "הכתובת צריכה להתחיל ב-https ולהיות כתובת ציבורית.";
  if (code.startsWith("http_")) return `הכתובת ענתה בשגיאה (${code.slice(5)}). בדקו שה-Webhook פעיל ב-Zapier או ב-Make.`;
  if (code === "not_connected") return "עוד לא חיברתם תוכנת חשבוניות.";
  if (code === "not_paid") return "אפשר להפיק קבלה רק לתשלום שסומן כשולם.";
  if (code === "not_configured") return "החיבור עוד לא הופעל בשרת.";
  return "הספק לא ענה כמו שציפינו. נסו שוב בעוד דקה.";
}

Deno.serve(async (req) => {
  const H = cors(req);
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...H, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: H });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });

  // Server path: DB trigger → dispatch one event to the org's webhook.
  if (body.action === "dispatch") {
    if (!INT_SECRET || !safeEq(req.headers.get("x-atlas-int") || "", INT_SECRET)) return json({ error: "unauthorized" }, 401);
    const { data: c } = await db.from("integration_connections").select("secret_enc, config, status").eq("org_id", body.org_id).eq("provider", "WEBHOOK").maybeSingle();
    if (!c || c.status !== "ACTIVE") return json({ ok: true, skipped: "no_webhook" });
    const events: string[] = Array.isArray(c.config?.events) ? c.config.events : [];
    if (events.length && !events.includes(body.event)) return json({ ok: true, skipped: "event_off" });
    try {
      await postWebhook(await open<WebhookCreds>(c.secret_enc), await eventPayload(db, body.org_id, body.event, body.ref_id));
      await db.from("integration_connections").update({ last_ok_at: new Date().toISOString(), last_error: null, status: "ACTIVE" }).eq("org_id", body.org_id).eq("provider", "WEBHOOK");
      return json({ ok: true });
    } catch (e) {
      await db.from("integration_connections").update({ last_error: hebrewError(String((e as Error).message)) }).eq("org_id", body.org_id).eq("provider", "WEBHOOK");
      return json({ ok: false });
    }
  }

  // App path: the signed-in owner, own org only.
  const auth = req.headers.get("authorization") || "";
  const userDb = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: u } = await userDb.auth.getUser();
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: orgId } = await userDb.rpc("current_org_id");
  if (!orgId) return json({ error: "no_org" }, 403);

  try {
    switch (body.action) {
      case "list": {
        const { data } = await db.from("integration_connections").select("provider, status, hint, config, connected_at, last_ok_at, last_error").eq("org_id", orgId);
        return json({ ok: true, items: data || [] });
      }
      case "connect": {
        const p = String(body.provider || "").toUpperCase();
        const cr = body.credentials || {};
        let secret: unknown, hint = "", config: Record<string, unknown> = {};
        if (p === "MORNING") {
          const c = { client_id: String(cr.client_id || ""), client_secret: String(cr.client_secret || "") };
          if (c.client_id.length < 8 || c.client_secret.length < 8) return json({ ok: false, message: "חסר מזהה מפתח או מפתח סודי." });
          await morningToken(c);                                                  // live check: a token means the key works
          secret = c; hint = c.client_id.slice(-4);
          config = { doc_type: body.doc_type === "invoice_receipt" ? "invoice_receipt" : "receipt", send_email: body.send_email !== false };
        } else if (p === "ICOUNT") {
          const c = { token: String(cr.token || "") };
          if (c.token.length < 12) return json({ ok: false, message: "חסר טוקן." });
          await icountCall(c, "company/info", {});                               // live, read-only check
          secret = c; hint = c.token.slice(-4);
          config = { doc_type: body.doc_type === "invoice_receipt" ? "invoice_receipt" : "receipt", send_email: body.send_email !== false };
        } else if (p === "WEBHOOK") {
          const url = String(cr.url || "").trim();
          await assertPublicUrl(url);
          const signing = b64(crypto.getRandomValues(new Uint8Array(24)));
          const c = { url, signing_secret: signing };
          await postWebhook(c, { id: crypto.randomUUID(), event: "test", created_at: new Date().toISOString(), data: { message: "atlas מחובר. מכאן יגיעו הזמנות, תשלומים ופניות." } });
          secret = c; hint = new URL(url).hostname;
          const allowed = ["booking.created", "booking.updated", "booking.cancelled", "payment.paid", "lead.created"];
          config = { events: Array.isArray(body.events) ? body.events.filter((e: string) => allowed.includes(e)) : allowed };
          // The signing secret is shown once, so the owner can verify signatures in their automation if they want.
          await db.from("integration_connections").upsert({ org_id: orgId, provider: p, status: "ACTIVE", secret_enc: await seal(secret), hint, config, connected_by: u.user.id, connected_at: new Date().toISOString(), last_ok_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }, { onConflict: "org_id,provider" });
          return json({ ok: true, provider: p, hint, signing_secret: signing });
        } else return json({ ok: false, message: "ספק לא מוכר." }, 400);
        if (p === "MORNING" || p === "ICOUNT") {
          // one invoicing app per org: connecting one turns the other off
          await db.from("integration_connections").delete().eq("org_id", orgId).in("provider", ["MORNING", "ICOUNT"]).neq("provider", p);
        }
        await db.from("integration_connections").upsert({ org_id: orgId, provider: p, status: "ACTIVE", secret_enc: await seal(secret), hint, config, connected_by: u.user.id, connected_at: new Date().toISOString(), last_ok_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }, { onConflict: "org_id,provider" });
        return json({ ok: true, provider: p, hint });
      }
      case "disconnect": {
        const p = String(body.provider || "").toUpperCase();
        await db.from("integration_connections").delete().eq("org_id", orgId).eq("provider", p);
        return json({ ok: true });
      }
      case "issue_receipt": {
        const r = await issueReceipt(db, orgId, String(body.payment_id || ""), body.send_email !== false);
        return json(r);
      }
      case "webhook_test": {
        const { data: c } = await db.from("integration_connections").select("secret_enc").eq("org_id", orgId).eq("provider", "WEBHOOK").maybeSingle();
        if (!c) return json({ ok: false, message: hebrewError("not_connected") });
        await postWebhook(await open<WebhookCreds>(c.secret_enc), { id: crypto.randomUUID(), event: "test", created_at: new Date().toISOString(), data: { message: "בדיקה מ-atlas" } });
        return json({ ok: true });
      }
      default:
        return json({ error: "bad_action" }, 400);
    }
  } catch (e) {
    const code = String((e as Error)?.message || "error");
    return json({ ok: false, error: code, message: hebrewError(code) });
  }
});
