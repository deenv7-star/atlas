// ai-chat: server-side LLM call for the in-app assistant. The OpenAI key is an edge-function secret
// (OPENAI_API_KEY) and never reaches the browser. Signed-in users only; light per-user rate limit.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"]);
const hits = new Map<string, number[]>(); // per isolate; good enough to stop a runaway loop

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const { data: u, error } = await sb.auth.getUser(jwt);
  if (error || !u?.user) return json({ error: "unauthorized" }, 401);

  const now = Date.now();
  const list = (hits.get(u.user.id) || []).filter((t) => now - t < 60_000);
  if (list.length >= 20) return json({ error: "rate_limited" }, 429);
  list.push(now);
  hits.set(u.user.id, list);

  const key = Deno.env.get("OPENAI_API_KEY");
  // 200 + error code: "not enabled yet" is a state, not a failure (no red console error in the app).
  if (!key) return json({ error: "not_configured", text: null }, 200);

  let body: { prompt?: string; model?: string; system?: string } = {};
  try { body = await req.json(); } catch { /* */ }
  const prompt = String(body.prompt || "").slice(0, 12_000);
  if (!prompt.trim()) return json({ error: "empty_prompt" }, 400);
  const model = ALLOWED_MODELS.has(String(body.model)) ? String(body.model) : "gpt-4o-mini";
  const messages = [
    { role: "system", content: String(body.system || "אתה העוזר של atlas, מערכת ניהול לצימרים ומתחמי נופש בישראל. ענה בעברית פשוטה, קצרה ומעשית.").slice(0, 2000) },
    { role: "user", content: prompt },
  ];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: 1024, temperature: 0.4 }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("openai_error", res.status, t.slice(0, 300));
    return json({ error: "upstream_error", status: res.status }, 502);
  }
  const data = await res.json();
  return json({ text: data?.choices?.[0]?.message?.content ?? "" });
});
