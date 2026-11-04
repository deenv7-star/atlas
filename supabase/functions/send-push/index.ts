// send-push: Apple Push Notification service (APNs, HTTP/2, token auth) for the atlas iOS app.
// PREPARED, NOT DEPLOYED (04.11.2026). Needs, before deploy: migration 029_device_tokens, an APNs auth key (.p8)
// and these function secrets:
//   APNS_KEY_ID        10-char Key ID of the .p8 key (Apple Developer → Keys)
//   APNS_TEAM_ID       RLBJU5DAPA
//   APNS_PRIVATE_KEY   full .p8 text (-----BEGIN PRIVATE KEY----- …), never committed anywhere
//   APNS_BUNDLE_ID     com.atlas-il.app (apns-topic)
//   ATLAS_PUSH_SECRET  shared secret for server callers (DB webhooks / pg_net / other edge functions)
// Callers
//   - server: header x-atlas-push: <ATLAS_PUSH_SECRET>, body { user_ids? | org_id?, event, title, body, path?, badge? }
//   - nobody else. An owner's JWT is NOT accepted: an app must never push to arbitrary users.
// Behaviour
//   - one APNs request per active device token of the target users / org (disabled_at is null)
//   - 410 Unregistered / 400 BadDeviceToken → the token is disabled (never retried)
//   - a production 400 BadDeviceToken is retried once on the sandbox host (an Xcode debug build), and the row's
//     environment is corrected when that works
//   - the provider JWT (ES256) is cached ~50 min (Apple: refresh between 20 and 60 minutes)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KEY_ID = Deno.env.get("APNS_KEY_ID") || "";
const TEAM_ID = Deno.env.get("APNS_TEAM_ID") || "";
const P8 = Deno.env.get("APNS_PRIVATE_KEY") || "";
const TOPIC = Deno.env.get("APNS_BUNDLE_ID") || "com.atlas-il.app";
const SECRET = Deno.env.get("ATLAS_PUSH_SECRET") || "";

const HOST = { production: "https://api.push.apple.com", sandbox: "https://api.sandbox.push.apple.com" } as const;
type Env = keyof typeof HOST;

// Events the app knows (docs/ios-faceid-push.md §Events). Anything else is refused.
const EVENTS = new Set(["lead_new", "booking_new", "payment_received", "checkin_today"]);

// ── provider token (JWT ES256) ─────────────────────────────────────────────────────────────────────
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();

let keyP: Promise<CryptoKey> | null = null;
function signingKey() {
  if (!keyP) {
    const pem = P8.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
    const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    keyP = crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  }
  return keyP;
}

let jwtCache: { token: string; at: number } | null = null;
async function providerToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (jwtCache && now - jwtCache.at < 50 * 60) return jwtCache.token;
  const header = b64url(enc.encode(JSON.stringify({ alg: "ES256", kid: KEY_ID })));
  const claims = b64url(enc.encode(JSON.stringify({ iss: TEAM_ID, iat: now })));
  const input = `${header}.${claims}`;
  // WebCrypto ECDSA returns the raw r||s (64 bytes) signature JOSE expects.
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await signingKey(), enc.encode(input));
  const token = `${input}.${b64url(sig)}`;
  jwtCache = { token, at: now };
  return token;
}

// ── one notification ───────────────────────────────────────────────────────────────────────────────
type Msg = { title: string; body: string; path?: string; badge?: number; event: string };

function payload(m: Msg) {
  const aps: Record<string, unknown> = { alert: { title: m.title, body: m.body }, sound: "default", "thread-id": m.event };
  if (Number.isInteger(m.badge) && (m.badge as number) >= 0) aps.badge = m.badge;
  // `path` is read by the app (src/lib/nativeApp/notify.js onNotificationTap → safeAppPath): in-app paths only.
  return JSON.stringify({ aps, path: m.path && /^\/(?!\/)/.test(m.path) ? m.path : "/dashboard", event: m.event });
}

async function sendOne(token: string, env: Env, m: Msg) {
  const res = await fetch(`${HOST[env]}/3/device/${token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${await providerToken()}`,
      "apns-topic": TOPIC,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "apns-expiration": String(Math.floor(Date.now() / 1000) + 24 * 3600),
      "content-type": "application/json",
    },
    body: payload(m),
  });
  let reason = "";
  if (!res.ok) { try { reason = (await res.json())?.reason || ""; } catch { /* empty body */ } }
  else { await res.body?.cancel(); }
  return { status: res.status, reason };
}

// ── handler ────────────────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!SECRET || req.headers.get("x-atlas-push") !== SECRET) return json({ error: "forbidden" }, 403);
  if (!KEY_ID || !TEAM_ID || !P8) return json({ error: "apns_not_configured" }, 503);

  let b: { user_ids?: string[]; org_id?: string; event?: string; title?: string; body?: string; path?: string; badge?: number };
  try { b = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const event = String(b.event || "");
  const title = String(b.title || "").slice(0, 120);
  const body = String(b.body || "").slice(0, 300);
  if (!EVENTS.has(event) || !title) return json({ error: "bad_request" }, 400);
  const users = Array.isArray(b.user_ids) ? b.user_ids.filter((x) => /^[0-9a-f-]{36}$/i.test(String(x))).slice(0, 50) : [];
  if (!users.length && !b.org_id) return json({ error: "no_target" }, 400);

  const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });
  let q = db.from("device_tokens").select("id, token, environment").is("disabled_at", null).limit(200);
  q = users.length ? q.in("user_id", users) : q.eq("org_id", b.org_id!);
  const { data: rows, error } = await q;
  if (error) return json({ error: "db", detail: error.message }, 500);

  const msg: Msg = { title, body, path: b.path, badge: b.badge, event };
  const out = { sent: 0, disabled: 0, failed: 0 };
  await Promise.all((rows || []).map(async (r) => {
    let env = (r.environment === "sandbox" ? "sandbox" : "production") as Env;
    let res = await sendOne(r.token, env, msg);
    if (res.status === 400 && res.reason === "BadDeviceToken" && env === "production") {
      const alt = await sendOne(r.token, "sandbox", msg);
      if (alt.status === 200) { env = "sandbox"; res = alt; }
    }
    if (res.status === 200) {
      out.sent++;
      await db.from("device_tokens").update({ last_sent_at: new Date().toISOString(), environment: env, last_error: null }).eq("id", r.id);
    } else if (res.status === 410 || res.reason === "BadDeviceToken" || res.reason === "Unregistered" || res.reason === "DeviceTokenNotForTopic") {
      out.disabled++;
      await db.from("device_tokens").update({ disabled_at: new Date().toISOString(), last_error: `${res.status} ${res.reason}`.slice(0, 200) }).eq("id", r.id);
    } else {
      out.failed++;
      await db.from("device_tokens").update({ last_error: `${res.status} ${res.reason}`.slice(0, 200) }).eq("id", r.id);
    }
  }));
  return json({ ok: true, targets: rows?.length || 0, ...out });
});
