// The support-chat request handler. Pure: everything outside (DB, auth, OpenAI, notifications) comes in
// through `deps`, so dev/qa.ts runs the exact production code against an in-memory store.
import { contextBlock, retrieve, systemPrompt, approxTokens, type KB } from './prompt.ts';
import { RATE, UNHELPFUL_LIMIT, wantsHuman } from './policy.ts';
import type { Llm, BotAnswer } from './openai.ts';
import type { Store } from './store.ts';
import type { Handoff } from './notify.ts';

export type Deps = {
  store: Store;
  kb: KB;
  llm: Llm | null;            // null → mock answers from retrieval (no key / SUPPORT_MOCK=1)
  notify: (h: Handoff) => Promise<string[]>;
  allowedOrigins: string[];   // CORS allow-list ('*' allowed for local dev only)
  log?: (event: string, data: Record<string, unknown>) => void;
};

const HE = {
  auth: 'צריך להתחבר מחדש כדי לקבל עזרה.',
  rate: 'שלחתם הרבה הודעות ברצף. נסו שוב בעוד כמה דקות, או לחצו "דבר עם נציג".',
  empty: 'כתבו שאלה ונעזור.',
  long: 'ההודעה ארוכה מדי. נסו לקצר לכמה משפטים.',
  server: 'משהו השתבש אצלנו. נסו שוב בעוד רגע, או לחצו "דבר עם נציג".',
  botFail: 'לא הצלחתי לענות כרגע. אפשר לנסות שוב, או ללחוץ **דבר עם נציג** ונציג מהצוות ימשיך מכאן.',
  handoff: 'העברנו את השיחה לנציג מצוות atlas. הוא רואה את כל מה שכתבתם, ויענה כאן באותו חלון. אפשר להמשיך לכתוב בינתיים.',
  inHuman: '',
};

function cors(origin: string | null, allowed: string[]) {
  const ok = allowed.includes('*') || (origin && allowed.includes(origin));
  return {
    'Access-Control-Allow-Origin': ok ? (allowed.includes('*') ? '*' : origin!) : allowed[0] || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function sanitizeAnswer(a: BotAnswer, kb: KB): BotAnswer {
  const allowed = new Map(kb.routes.map((r) => [r.path, r.label]));
  const links = (Array.isArray(a.links) ? a.links : [])
    .map((l) => ({ label: String(l?.label || '').slice(0, 40), path: String(l?.path || '').trim() }))
    .filter((l) => allowed.has(l.path))
    .map((l) => ({ label: l.label || allowed.get(l.path)!, path: l.path }))
    .slice(0, 2);
  return {
    answer: String(a.answer || '').trim().slice(0, 4000) || HE.botFail,
    links,
    confidence: (['high', 'medium', 'low'] as const).includes(a.confidence) ? a.confidence : 'low',
    suggest_human: Boolean(a.suggest_human),
    follow_ups: (Array.isArray(a.follow_ups) ? a.follow_ups : []).map((s) => String(s).slice(0, 80)).filter(Boolean).slice(0, 3),
  };
}

/**
 * No OpenAI key (or SUPPORT_MOCK=1): answer with the best-matching section of the guide itself, said
 * plainly, so the help still works and costs nothing. Weak matches go straight to a human offer.
 */
export function mockAnswer(kb: KB, q: string): BotAnswer {
  const top = retrieve(kb, q, 1)[0];
  if (!top) return { answer: 'לא מצאתי את זה במדריך של atlas. אפשר לנסח אחרת, או ללחוץ **דבר עם נציג** ונציג מהצוות ימשיך מכאן.', links: [], confidence: 'low', suggest_human: true, follow_ups: [] };
  const body = top.text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 10).join('\n');
  return { answer: `זה מה שמצאתי במדריך של atlas, בנושא "${top.heading.split(' › ').pop()}":\n\n${body}\n\nלא בדיוק מה שחיפשתם? לחצו **דבר עם נציג**.`, links: [], confidence: 'medium', suggest_human: false, follow_ups: [] };
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const { store, kb } = deps;
  const origin = req.headers.get('origin');
  const H = { ...cors(origin, deps.allowedOrigins), 'Content-Type': 'application/json; charset=utf-8' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: H });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: H });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const user = jwt ? await store.getUser(jwt).catch(() => null) : null;
  if (!user) return json({ error: 'auth', message: HE.auth }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || 'send');
  const device = body.device === 'mobile' ? 'mobile' : 'desktop';
  const page = typeof body.page === 'string' ? body.page.slice(0, 120) : null;

  try {
    // conversation (own only)
    let conv = body.conversation_id ? await store.getConversation(String(body.conversation_id)) : null;
    if (conv && conv.user_id !== user.id) return json({ error: 'forbidden' }, 403);
    const ctx = await store.orgContext(jwt, user);
    ctx.page = page;
    if (!conv) {
      conv = await store.createConversation({
        user_id: user.id, org_id: ctx.org_id, user_email: user.email, user_name: ctx.name || user.name || null,
        user_phone: (ctx as Record<string, unknown>).phone as string || null, page_path: page,
        context: { plan: ctx.plan, units: ctx.units?.count ?? null, channels: ctx.channels?.map((c) => c.provider) ?? [], org_name: ctx.org_name },
      });
    }

    if (action === 'handoff') {
      const reason = ['button', 'keyword', 'unhelpful', 'bot_error'].includes(String(body.reason)) ? String(body.reason) : 'button';
      if (conv.mode !== 'human') {
        await store.updateConversation(conv.id, { mode: 'human', status: 'open', handoff_at: new Date().toISOString(), handoff_reason: reason, unread_admin: 1 });
      }
      const sys = await store.insertMessage({ conversation_id: conv.id, user_id: user.id, org_id: conv.org_id, sender: 'system', body: HE.handoff, meta: { reason } });
      const last = (await store.recentMessages(conv.id, 12)).filter((m) => m.sender === 'user').pop();
      const channels = conv.mode === 'human' ? [] : await deps.notify({
        conversation_id: conv.id, customer: ctx.name || user.email || 'לקוח', email: user.email, phone: ((ctx as Record<string, unknown>).phone as string) || null,
        org: ctx.org_name || null, reason, last_question: last?.body?.slice(0, 300) || '(עוד לא נכתבה שאלה)',
      }).catch(() => []);
      deps.log?.('handoff', { conv: conv.id, reason, notified: channels });
      return json({ conversation_id: conv.id, mode: 'human', system_message: sys, notified: channels.length > 0 });
    }

    // send
    const text = String(body.message || '').trim();
    if (!text) return json({ error: 'empty', message: HE.empty }, 400);
    if (text.length > 2000) return json({ error: 'too_long', message: HE.long }, 400);
    for (const w of [RATE.burst, RATE.hour, RATE.day]) {
      if ((await store.countUserMessages(user.id, w.minutes)) >= w.max) {
        deps.log?.('rate_limited', { user: user.id, window: w.minutes });
        return json({ error: 'rate_limited', message: HE.rate, retry_after_s: Math.min(w.minutes * 60, 600) }, 429);
      }
    }
    const clientId = typeof body.client_id === 'string' ? body.client_id.slice(0, 64) : null;
    let userMsg;
    try {
      userMsg = await store.insertMessage({ conversation_id: conv.id, user_id: user.id, org_id: conv.org_id, sender: 'user', body: text, client_id: clientId, meta: { device, page } });
    } catch (e) {
      if (/idx_support_msg_client|duplicate/.test(String((e as Error).message))) return json({ conversation_id: conv.id, mode: conv.mode, duplicate: true });
      throw e;
    }

    // After a handoff the bot stays quiet: the agent answers in the same thread.
    if (conv.mode === 'human') return json({ conversation_id: conv.id, mode: 'human', user_message: userMsg, reply: null, offer_handoff: false });

    const keyword = wantsHuman(text);
    const history = (await store.recentMessages(conv.id, 13)).filter((m) => m.id !== userMsg.id && (m.sender === 'user' || m.sender === 'bot' || m.sender === 'agent'));
    const messages = [
      { role: 'system' as const, content: systemPrompt(kb) },
      { role: 'system' as const, content: contextBlock(ctx, device) },
      ...history.slice(-12).map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.body.slice(0, 2000) })),
      { role: 'user' as const, content: text },
    ];

    let ans: BotAnswer, usage = { model: 'mock', tokens_in: approxTokens(messages.map((m) => m.content).join('')), tokens_cached: 0, tokens_out: 0, cost_usd: 0, latency_ms: 0 };
    let failed = false;
    if (deps.llm) {
      try {
        const r = await deps.llm(messages, { user: user.id });
        ans = sanitizeAnswer(r.answer, kb);
        usage = { model: r.model, tokens_in: r.tokens_in, tokens_cached: r.tokens_cached, tokens_out: r.tokens_out, cost_usd: r.cost_usd, latency_ms: r.latency_ms };
      } catch (e) {
        failed = true;
        deps.log?.('llm_error', { conv: conv.id, error: String((e as Error).message).slice(0, 200) });
        ans = { answer: HE.botFail, links: [], confidence: 'low', suggest_human: true, follow_ups: [] };
      }
    } else ans = sanitizeAnswer(mockAnswer(kb, text), kb);

    const weak = ans.confidence === 'low' || ans.suggest_human;
    const unhelpful = weak ? (conv.unhelpful_count || 0) + 1 : 0;
    const offer = keyword || failed || unhelpful >= UNHELPFUL_LIMIT;
    const offerReason = keyword ? 'keyword' : failed ? 'bot_error' : unhelpful >= UNHELPFUL_LIMIT ? 'unhelpful' : null;
    await store.updateConversation(conv.id, { unhelpful_count: unhelpful });
    const reply = await store.insertMessage({
      conversation_id: conv.id, user_id: user.id, org_id: conv.org_id, sender: 'bot', body: ans.answer, links: ans.links,
      meta: { confidence: ans.confidence, suggest_human: ans.suggest_human, follow_ups: ans.follow_ups, offer_handoff: offer, offer_reason: offerReason, kb: kb.git, ctx_errors: ctx.errors?.length ? ctx.errors : undefined },
      ...usage,
    });
    deps.log?.('answer', { conv: conv.id, model: usage.model, tin: usage.tokens_in, cached: usage.tokens_cached, tout: usage.tokens_out, usd: usage.cost_usd, ms: usage.latency_ms, conf: ans.confidence, offer });
    return json({ conversation_id: conv.id, mode: 'bot', user_message: userMsg, reply, offer_handoff: offer, offer_reason: offerReason });
  } catch (e) {
    deps.log?.('error', { error: String((e as Error).message).slice(0, 300) });
    return json({ error: 'server', message: HE.server }, 500);
  }
}
