// ai-chat v4: server-side LLM call for "שאלו את atlas".
//   - The OpenAI key is the edge-function secret OPENAI_API_KEY; it never reaches the browser.
//   - Signed-in users only (user JWT). Browsers only from the origin allow-list (core.js).
//   - Hebrew system prompt lives here (core.js); a client `system` field is ignored.
//   - Streams SSE frames {"d":"…"} … {"done":true}; stopping in the app aborts the upstream call.
//   - Limits: per-isolate 12/min, plus a per-user daily cap in Postgres when migration 024 is applied
//     (ai_usage_bump). Without 024 the function still works with the minute limit only.
//   - Backward compatible: the v3 body {prompt, model} still gets JSON {text} unless it asks for stream.
// NOT DEPLOYED by this PR. Deploy: supabase functions deploy ai-chat (needs Deen's approval).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { buildRequest, corsHeaders, isAllowedOrigin, makeMinuteLimiter, createUpstreamParser, frame, LIMITS } from "./core.js";

const minuteOk = makeMinuteLimiter(LIMITS.perMinute);

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

  if (!minuteOk(u.user.id)) return json({ error: "rate_limited" }, 429);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const plan = buildRequest(body);
  if ("error" in plan) return json({ error: plan.error }, 400);

  const key = Deno.env.get("OPENAI_API_KEY");
  // 200 + code: "not enabled yet" is a state, not a failure (no red console error in the app).
  if (!key) return json({ error: "not_configured", text: null }, 200);

  // Daily cap (migration 024). Missing function → skip quietly; any other DB error → do not block the user.
  const { data: allowed, error: usageErr } = await sb.rpc("ai_usage_bump", { p_daily_limit: LIMITS.perDay });
  if (!usageErr && allowed === false) return json({ error: "daily_limit" }, 429);
  if (usageErr && !/PGRST202|42883|not find the function/i.test(`${usageErr.code} ${usageErr.message}`)) {
    console.warn("ai_usage_bump", usageErr.code, usageErr.message?.slice(0, 120));
  }

  const upstream = new AbortController();
  req.signal?.addEventListener("abort", () => upstream.abort(), { once: true });
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: upstream.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: plan.model, messages: plan.messages, max_tokens: LIMITS.maxTokens, temperature: 0.3, stream: plan.stream, user: u.user.id }),
    });
  } catch (e) {
    if (upstream.signal.aborted) return new Response(null, { status: 499, headers: CORS });
    console.error("openai_fetch", String(e).slice(0, 200));
    return json({ error: "upstream_error" }, 502);
  }
  if (!res.ok) {
    console.error("openai_error", res.status, (await res.text()).slice(0, 300));
    return json({ error: res.status === 429 ? "rate_limited" : "upstream_error", status: res.status }, res.status === 429 ? 429 : 502);
  }

  if (!plan.stream) {
    const data = await res.json();
    return json({ text: data?.choices?.[0]?.message?.content ?? "", model: plan.model });
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const parse = createUpstreamParser();
  const reader = res.body!.getReader();
  const stream = new ReadableStream({
    async pull(ctrl) {
      try {
        const { value, done } = await reader.read();
        if (done) { ctrl.enqueue(enc.encode(frame({ done: true, model: plan.model }))); ctrl.close(); return; }
        for (const ev of parse(dec.decode(value, { stream: true }))) {
          if ("d" in ev) ctrl.enqueue(enc.encode(frame({ d: ev.d })));
        }
      } catch (e) {
        if (!upstream.signal.aborted) {
          console.error("stream_error", String(e).slice(0, 200));
          try { ctrl.enqueue(enc.encode(frame({ error: "upstream_error" }))); } catch { /* closed */ }
        }
        try { ctrl.close(); } catch { /* closed */ }
      }
    },
    cancel() { upstream.abort(); try { reader.cancel(); } catch { /* */ } }, // the user pressed stop
  });
  return new Response(stream, {
    headers: { ...CORS, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
});
