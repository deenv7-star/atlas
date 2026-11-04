// voice-session: issues a short-lived ElevenLabs Realtime client secret to a signed-in owner.
//   POST {op:'start', page?, resume?} → {client_secret, expires_at, session_id, seconds, remaining_today, ws_url, model}
//   POST {op:'end', session_id}       → {ok}
// The ElevenLabs key is the edge-function secret ELEVENLABS_API_KEY and never reaches the browser.
// Budget: 30 min/day per user, reserved in 180 s slices by migration 031 (voice_session_start).
// Without 031 the function refuses ("voice_not_ready") instead of giving unlimited minutes.
// Tools: the realtime model calls the SAME tools as the text brain; the app forwards each call to
// ai-chat {op:'tool'}, which runs it with the user's JWT (RLS). Nothing here touches business data.
// NOT DEPLOYED by this branch. Deploy: supabase functions deploy voice-session (needs Deen's approval).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders, isAllowedOrigin, makeMinuteLimiter } from "../ai-chat/core.js";
import { todayIL } from "../_shared/brain/dates.js";
import { VOICE, secretRequest, clientPayload } from "./core.js";

/** ELEVENLABS_API_KEY, tolerating a stray character in the secret's name (it was saved once as "ELEVENLABS_API_KEY,"). */
function elevenKey(): string | undefined {
  const exact = Deno.env.get("ELEVENLABS_API_KEY")?.trim();
  if (exact) return exact;
  try {
    for (const [k, v] of Object.entries(Deno.env.toObject())) {
      if (k.replace(/[^A-Z0-9_]/gi, "").toUpperCase() === "ELEVENLABS_API_KEY" && v.trim()) return v.trim();
    }
  } catch { /* no env access */ }
  return undefined;
}

const minuteOk = makeMinuteLimiter(6); // starts + renewals per minute
// supabase-js builders are thenables without .catch: wrap them
const quiet = (p: PromiseLike<unknown>) => Promise.resolve(p).then(() => null, () => null);
// service role only to VOID a slice when ElevenLabs issued no secret (the app itself can never refund)
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const CORS = corsHeaders(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { status: isAllowedOrigin(origin) ? 200 : 403, headers: CORS });
  if (!isAllowedOrigin(origin)) return json({ error: "forbidden_origin" }, 403);
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: u, error: authErr } = await sb.auth.getUser(jwt);
  if (authErr || !u?.user) return json({ error: "unauthorized" }, 401);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }

  if (body.op === "end") {
    const id = String(body.session_id || "");
    if (id) await quiet(sb.rpc("voice_session_end", { p_session: id }));
    return json({ ok: true });
  }
  if (body.op !== "start") return json({ error: "bad_op" }, 400);
  if (!minuteOk(u.user.id)) return json({ error: "rate_limited" }, 429);

  const key = elevenKey();
  if (!key) return json({ error: "not_configured" }, 200);

  // reserve a slice (migration 031). No migration → refuse, never unlimited.
  const { data: rows, error: rpcErr } = await sb.rpc("voice_session_start", { p_daily_seconds: VOICE.dailySeconds, p_session_max: VOICE.sliceSeconds, p_model: VOICE.model });
  if (rpcErr) {
    const missing = /PGRST202|42883|42P01|not find the function/i.test(`${rpcErr.code} ${rpcErr.message}`);
    console.warn("voice_session_start", rpcErr.code, rpcErr.message?.slice(0, 120));
    return json({ error: missing ? "voice_not_ready" : "server_error" }, missing ? 200 : 500);
  }
  const r = Array.isArray(rows) ? rows[0] : rows;
  if (!r?.session_id || !(r.granted_seconds > 0)) return json({ error: "daily_limit", used_today: r?.used_today ?? null }, 429);

  const owner = String((u.user.user_metadata as Record<string, unknown>)?.full_name || "").trim().split(/\s+/)[0] || "";
  const native = body.platform === "ios" || origin === "capacitor://localhost"; // Apple 3.1.1
  const reqBody = secretRequest({ today: todayIL(), seconds: r.granted_seconds, sessionId: r.session_id, owner, native,
    page: typeof body.page === "string" ? body.page : "", resume: typeof body.resume === "string" ? body.resume : "" });
  let res: Response;
  try {
    res = await fetch("https://api.elevenlabs.io/v1/convai/realtime/client_secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": key },
      body: JSON.stringify(reqBody),
    });
  } catch (e) {
    console.error("elevenlabs_fetch", String(e).slice(0, 160));
    await quiet(admin.rpc("voice_session_void", { p_session: r.session_id }));
    return json({ error: "upstream_error" }, 502);
  }
  const secret = await res.json().catch(() => ({}));
  if (!res.ok || !secret?.value) {
    console.error("elevenlabs_error", res.status, JSON.stringify(secret).slice(0, 300));
    await quiet(admin.rpc("voice_session_void", { p_session: r.session_id }));
    return json({ error: "upstream_error", status: res.status }, 502);
  }
  console.log(JSON.stringify({ fn: "voice-session", event: "start", user: u.user.id, seconds: r.granted_seconds, used_today: r.used_today }));
  return json(clientPayload({ secret, sessionId: r.session_id, seconds: r.granted_seconds, usedToday: r.used_today }));
});
