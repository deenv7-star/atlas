// The text brain's tool loop: model → tools (with the owner's JWT) → model … → answer.
// Emits events so the edge function can stream: {status}, {action}, {delta}, {done}, {error}.
// Pure: the OpenAI call comes in as `llm`, the database as `ctx.db`, so node tests run it offline.
import { chatTools, runTool, forModel, WRITE_TOOLS } from './tools.js';
import { PERSONA } from './persona.js';

export const BRAIN = { maxRounds: 5, maxToolCallsPerRound: 4, resultChars: 6000 };
const FORCE_ANSWER = 'אין עוד קריאות לכלים. ענו עכשיו במילים ממה שיש. אם חסר משהו, אמרו מה כן ידוע והציעו צעד הבא אחד.';

// Status lines under her face follow the one persona switch (persona.js), so text matches the voice (female first person).
const STATUS = PERSONA.tools;
export const statusFor = (name) => STATUS[name] || PERSONA.checking;

/** OpenAI Chat Completions call with tools. Returns the assistant message + usage. */
// effort 'none': gpt-6-luna rejects function tools with any other reasoning_effort on /v1/chat/completions (verified 04.11.2026)
// opts.noTools: the last round / the empty-answer retry must produce words, not another tool call.
// One quiet retry on a 5xx or a dropped connection, so a passing hiccup never leaves a question unanswered.
export function openaiChat({ apiKey, model, effort = 'none', fetchImpl = fetch, user }) {
  return async (messages, signal, opts = {}) => {
    const body = JSON.stringify({ model, messages, tools: chatTools(), tool_choice: opts.noTools ? 'none' : 'auto', parallel_tool_calls: true,
      reasoning_effort: effort, max_completion_tokens: 1600, prompt_cache_key: 'atlas-brain-v7', safety_identifier: user });
    for (let attempt = 0; ; attempt += 1) {
      let res;
      try {
        res = await fetchImpl('https://api.openai.com/v1/chat/completions', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body });
      } catch (e) {
        if (attempt === 0 && !signal?.aborted) continue;
        throw e;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (attempt === 0 && res.status >= 500) continue;
        const e = new Error(`openai ${res.status}: ${j?.error?.message || 'error'}`); e.status = res.status; throw e;
      }
      return { message: j.choices?.[0]?.message || {}, usage: j.usage || {}, model: j.model || model };
    }
  };
}

/** Said when the model gave no words at all (never silence): what happened + the nearest real action. */
export const NO_ANSWER = 'לא הצלחנו לנסח תשובה הפעם. אפשר לשאול במילים אחרות, או שנעביר את השאלה לצוות של atlas, שזמין 24/7.';

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
    const add = (r) => { usage.in += r.usage?.prompt_tokens || 0; usage.cached += r.usage?.prompt_tokens_details?.cached_tokens || 0; usage.out += r.usage?.completion_tokens || 0; };
    const r = await llm(last ? [...messages, { role: 'system', content: FORCE_ANSWER }] : messages, signal, last ? { noTools: true } : {});
    add(r);
    const calls = (r.message.tool_calls || []).slice(0, BRAIN.maxToolCallsPerRound);
    if (!calls.length || last) {
      let text = String(r.message.content || '').trim();
      if (!text) { // a reply with neither words nor tools: ask once more for words only, then the honest fallback
        const again = await llm([...messages, { role: 'system', content: FORCE_ANSWER }], signal, { noTools: true }).catch(() => null);
        if (again) { add(again); text = String(again.message?.content || '').trim(); }
      }
      text = text || NO_ANSWER;
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
  for (const p of pieces(NO_ANSWER)) emit({ delta: p });
  return { text: NO_ANSWER, usage, rounds: BRAIN.maxRounds, tools: used };
}
