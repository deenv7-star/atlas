// The text brain's tool loop: model → tools (with the owner's JWT) → model … → answer.
// Emits events so the edge function can stream: {status}, {action}, {delta}, {done}, {error}.
// Pure: the OpenAI call comes in as `llm`, the database as `ctx.db`, so node tests run it offline.
import { chatTools, runTool, forModel, WRITE_TOOLS } from './tools.js';

export const BRAIN = { maxRounds: 5, maxToolCallsPerRound: 4, resultChars: 6000 };

const STATUS = {
  get_day_overview: 'בודקים את היום', find_bookings: 'מחפשים בהזמנות', get_booking: 'פותחים את ההזמנה',
  check_availability: 'בודקים מה פנוי', get_leads: 'בודקים פניות', get_money: 'בודקים בכספים',
  get_business_settings: 'בודקים את ההגדרות', search_help: 'בודקים במדריך', propose_booking: 'מכינים הזמנה',
  propose_guest_message: 'מכינים הודעה', propose_support_handoff: 'מכינים פנייה לנציג',
};
export const statusFor = (name) => STATUS[name] || 'בודקים';

/** OpenAI Chat Completions call with tools. Returns the assistant message + usage. */
export function openaiChat({ apiKey, model, effort = 'low', fetchImpl = fetch, user }) {
  return async (messages, signal) => {
    const res = await fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, tools: chatTools(), tool_choice: 'auto', parallel_tool_calls: true,
        reasoning_effort: effort, max_completion_tokens: 1600, prompt_cache_key: 'atlas-brain-v5', safety_identifier: user }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(`openai ${res.status}: ${j?.error?.message || 'error'}`); e.status = res.status; throw e; }
    return { message: j.choices?.[0]?.message || {}, usage: j.usage || {}, model: j.model || model };
  };
}

/** Split an answer into small pieces so the app can reveal it like a stream. */
export function* pieces(text, size = 3) {
  const words = String(text).split(/(\s+)/);
  for (let i = 0; i < words.length; i += size * 2) yield words.slice(i, i + size * 2).join('');
}

/**
 * runBrain({ system, turns, llm, ctx, emit, signal }) → { text, usage, rounds, tools }
 * turns: [{role:'user'|'assistant', content}] (already sanitised). Proposals go out as {action}.
 */
export async function runBrain({ system, turns, llm, ctx, emit = () => {}, signal }) {
  const messages = [{ role: 'system', content: system }, ...turns];
  const usage = { in: 0, cached: 0, out: 0 };
  const used = [];
  for (let round = 0; round < BRAIN.maxRounds; round += 1) {
    const last = round === BRAIN.maxRounds - 1;
    const r = await llm(last ? [...messages, { role: 'system', content: 'אין עוד קריאות לכלים. ענו עכשיו ממה שיש.' }] : messages, signal);
    usage.in += r.usage.prompt_tokens || 0; usage.cached += r.usage.prompt_tokens_details?.cached_tokens || 0; usage.out += r.usage.completion_tokens || 0;
    const calls = (r.message.tool_calls || []).slice(0, BRAIN.maxToolCallsPerRound);
    if (!calls.length || last) {
      const text = String(r.message.content || '').trim() || 'לא הצלחנו לנסח תשובה הפעם. נסו לשאול שוב במילים אחרות.';
      for (const p of pieces(text)) emit({ delta: p });
      return { text, usage, rounds: round + 1, tools: used, model: r.model };
    }
    messages.push({ role: 'assistant', content: r.message.content || null, tool_calls: calls });
    for (const c of calls) {
      const name = c.function?.name;
      emit({ status: statusFor(name) });
      const { result, proposal } = await runTool(name, c.function?.arguments, ctx);
      used.push(name);
      if (proposal && WRITE_TOOLS.has(name)) emit({ action: { id: c.id, ...proposal } });
      let content = JSON.stringify(forModel(result));
      if (content.length > BRAIN.resultChars) content = `${content.slice(0, BRAIN.resultChars)}…(קוצר)`;
      messages.push({ role: 'tool', tool_call_id: c.id, content });
    }
  }
  return { text: '', usage, rounds: BRAIN.maxRounds, tools: used };
}
