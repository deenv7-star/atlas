// Local answer server for the demo build (VITE_SUPPORT_DEMO_URL=http://127.0.0.1:54410).
// Same system prompt + KB + model call as production, no database. For QA screenshots only.
//   deno run -A dev/server.ts [--port=54410] [--model=gpt-6-luna] [--replay=qa-luna.json]
// --replay answers known questions from a saved QA run (zero cost); anything else goes to OpenAI.
import kbJson from '../kb/kb.json' with { type: 'json' };
import { contextBlock, systemPrompt, type KB } from '../lib/prompt.ts';
import { openaiLlm } from '../lib/openai.ts';
import { sanitizeAnswer, mockAnswer } from '../lib/handler.ts';

const kb = kbJson as unknown as KB;
const args = Object.fromEntries(Deno.args.map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? 'true']; }));
const port = Number(args.port || 54410);
const llm = args.mock ? null : openaiLlm(Deno.env.get('OPENAI_API_KEY') || 'gateway', args.model || 'gpt-6-luna', 'low');
const replay = new Map<string, unknown>();
if (args.replay) for (const r of JSON.parse(await Deno.readTextFile(args.replay)).rows) replay.set(r.q, { answer: r.answer, links: r.links, confidence: r.meta?.confidence, suggest_human: r.meta?.suggest_human, follow_ups: r.meta?.follow_ups || [], model: r.model });
const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Content-Type': 'application/json; charset=utf-8' };
let spent = 0;

Deno.serve({ port, hostname: '127.0.0.1' }, async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: H });
  const url = new URL(req.url);
  if (url.pathname !== '/answer' || req.method !== 'POST') return new Response('{"ok":true}', { headers: H });
  const b = await req.json();
  const q = String(b.message || '').trim();
  if (replay.has(q)) return new Response(JSON.stringify(replay.get(q)), { headers: H });
  const ctx = { name: 'יעל לוי', org_name: 'צימרי הגליל', plan: 'starter', subscription_status: 'trialing', trial_days_left: 9, units: { count: 3, names: ['צימר הגפן', 'צימר התאנה', 'סוויטת הזית'] }, channels: [{ provider: 'BOOKING_COM', active: true }], bookings_count: 14, leads_count: 5, onboarding_completed: true, ...(b.context || {}) };
  if (!llm) return new Response(JSON.stringify(mockAnswer(kb, q)), { headers: H });
  const messages = [
    { role: 'system' as const, content: systemPrompt(kb) },
    { role: 'system' as const, content: contextBlock(ctx, b.device || 'desktop') },
    ...((b.history || []) as { sender: string; body: string }[]).map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.body })),
    { role: 'user' as const, content: q },
  ];
  try {
    const r = await llm(messages, { user: 'demo' });
    spent += r.cost_usd;
    console.log(`answer ${r.latency_ms}ms $${r.cost_usd.toFixed(5)} (total $${spent.toFixed(4)}) :: ${q.slice(0, 60)}`);
    return new Response(JSON.stringify({ ...sanitizeAnswer(r.answer, kb), model: r.model }), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: H });
  }
});
