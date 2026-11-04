// ai-chat v6 (answers every question, guides to a next step, iOS-safe): "שאלו את atlas" with a brain (knowledge base + tools over the owner's own data).
//   - The OpenAI key is the edge-function secret OPENAI_API_KEY; it never reaches the browser.
//   - Signed-in users only (user JWT). Browsers only from the origin allow-list (core.js).
//   - The rules live on the server (_shared/brain/prompt.js); a client `system` field is ignored.
//   - Every data tool runs with the CALLER'S JWT, so RLS limits it to their own business.
//   - Write actions are never executed here: they come back as {action} proposals the app confirms.
//   - SSE frames: {"status":"…"} {"action":{…}} {"d":"…"} … {"done":true}.
//   - POST {op:'tool', name, args}: the voice agent's tool calls (same tools, same rules) → JSON.
//   - Backward compatible: v3/v4 bodies ({prompt} or {messages} without tools) still work.
// NOT DEPLOYED by this branch. Deploy: supabase functions deploy ai-chat (needs Deen's approval).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { buildRequest, corsHeaders, isAllowedOrigin, makeMinuteLimiter, sanitizeMessages, frame, LIMITS } from "./core.js";
import { brainPrompt } from "../_shared/brain/prompt.js";
import { runBrain, openaiChat } from "../_shared/brain/loop.js";
import { runTool, forModel, TOOL_NAMES } from "../_shared/brain/tools.js";
import { todayIL } from "../_shared/brain/dates.js";

const minuteOk = makeMinuteLimiter(LIMITS.perMinute);
const toolMinuteOk = makeMinuteLimiter(40); // voice: a few tool calls per spoken question
const MODEL = Deno.env.get("BRAIN_MODEL") || "gpt-6-luna";
const EFFORT = Deno.env.get("BRAIN_REASONING") || "none"; // luna + tools on chat/completions needs "none"

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
  try { body = await req.json(); } catch { /* empty body */ }
  // Apple 3.1.1: the iOS app (Capacitor) says so; there the brain never quotes plan prices or points to buying outside.
  const native = body.platform === "ios" || origin === "capacitor://localhost";
  const ctx = { db: sb, userId: u.user.id, today: todayIL(), native };

  // ── voice tool call (no LLM here: the realtime model already decided) ──
  if (body.op === "tool") {
    if (!toolMinuteOk(u.user.id)) return json({ error: "rate_limited" }, 429);
    const name = String(body.name || "");
    if (!TOOL_NAMES.includes(name)) return json({ error: "unknown_tool" }, 400);
    const { result, proposal } = await runTool(name, body.args ?? {}, ctx);
    return json({ result: forModel(result), proposal });
  }

  if (!minuteOk(u.user.id)) return json({ error: "rate_limited" }, 429);
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return json({ error: "not_configured", text: null }, 200);

  // Daily cap (migration 024). Missing function → skip quietly; any other DB error → do not block the user.
  const { data: allowed, error: usageErr } = await sb.rpc("ai_usage_bump", { p_daily_limit: LIMITS.perDay });
  if (!usageErr && allowed === false) return json({ error: "daily_limit" }, 429);
  if (usageErr && !/PGRST202|42883|not find the function/i.test(`${usageErr.code} ${usageErr.message}`)) {
    console.warn("ai_usage_bump", usageErr.code, usageErr.message?.slice(0, 120));
  }

  const turns = sanitizeMessages(body.messages);
  if (!turns.length) {
    // v3 legacy body {prompt}: answer without tools, as before
    const plan = buildRequest(body);
    if ("error" in plan) return json({ error: plan.error }, 400);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: plan.model, messages: plan.messages, max_tokens: LIMITS.maxTokens, temperature: 0.3, user: u.user.id }),
    }).catch(() => null);
    if (!res?.ok) return json({ error: "upstream_error" }, 502);
    const data = await res.json();
    return json({ text: data?.choices?.[0]?.message?.content ?? "", model: plan.model });
  }

  const owner = String((u.user.user_metadata as Record<string, unknown>)?.full_name || "").trim().split(/\s+/)[0] || "";
  const system = brainPrompt({ mode: "text", today: ctx.today, page: typeof body.page === "string" ? body.page : "", owner, native });
  const llm = openaiChat({ apiKey: key, model: MODEL, effort: EFFORT, user: u.user.id });
  const upstream = new AbortController();
  req.signal?.addEventListener("abort", () => upstream.abort(), { once: true });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const emit = (ev: Record<string, unknown>) => {
        try { ctrl.enqueue(enc.encode(frame("delta" in ev ? { d: ev.delta } : ev))); } catch { /* closed */ }
      };
      try {
        const t0 = Date.now();
        const r = await runBrain({ system, turns, llm, ctx, emit, signal: upstream.signal });
        console.log(JSON.stringify({ fn: "ai-chat", event: "answer", rounds: r.rounds, tools: r.tools, tin: r.usage.in, tcached: r.usage.cached, tout: r.usage.out, ms: Date.now() - t0 }));
        emit({ done: true, model: r.model || MODEL });
      } catch (e) {
        if (!upstream.signal.aborted) {
          console.error("brain_error", String(e).slice(0, 200));
          emit({ error: (e as { status?: number }).status === 429 ? "rate_limited" : "upstream_error" });
        }
      }
      try { ctrl.close(); } catch { /* closed */ }
    },
    cancel() { upstream.abort(); }, // the user pressed stop
  });
  return new Response(stream, {
    headers: { ...CORS, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
});
