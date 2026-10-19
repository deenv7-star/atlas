/**
 * Talks to the assistant backend and hands the answer back piece by piece.
 *
 *   Live:  POST {VITE_SUPABASE_URL}/functions/v1/ai-chat with the signed-in user's JWT.
 *          v4 (this repo) streams SSE; v3 (what is deployed today) answers JSON {text}. Both work:
 *          the request carries `messages` + `context` for v4 and a flat `prompt` for v3.
 *   Demo:  no Supabase → the in-browser stand-in for POST /api/assistant/stream (demoAnswer.js),
 *          answering only from the local snapshot. No network call, so no console noise.
 *
 * The OpenAI key lives only in the edge function (secret OPENAI_API_KEY). Nothing here needs it.
 */
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { createSSEParser, chunkText } from './sse.js';
import { factsForModel, factsToText } from './facts.js';
import { demoAnswer, DEMO_STREAM_PATH } from './demoAnswer.js';

export const ASSISTANT_DEMO = !isSupabaseConfigured;
const FN_URL = `${String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')}/functions/v1/ai-chat`;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** Hebrew line for each failure the UI can show as is. */
export const ERRORS = {
  not_configured: 'התשובות של atlas עוד לא הופעלו בחשבון הזה. הנתונים שלכם בטוחים, ואפשר לראות הכל במסכים הרגילים.',
  rate_limited: 'הרבה שאלות בדקה האחרונה. אפשר לשאול שוב בעוד רגע.',
  daily_limit: 'הגעתם למכסת השאלות של היום. המכסה מתחדשת מחר בבוקר.',
  unauthorized: 'צריך להתחבר מחדש כדי לשאול.',
  network: 'אין חיבור לאינטרנט כרגע. בדקו את החיבור ונסו שוב.',
  upstream: 'לא הצלחנו לקבל תשובה הפעם. נסו שוב בעוד רגע.',
};
export class AssistantError extends Error {
  constructor(code) { super(ERRORS[code] || ERRORS.upstream); this.code = ERRORS[code] ? code : 'upstream'; }
}

const sleep = (ms, signal) => new Promise((res, rej) => {
  const t = setTimeout(res, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('aborted', 'AbortError')); }, { once: true });
});

/** Reveal a finished text calmly (JSON answers and demo), so both feel like the live stream. */
async function reveal(text, onDelta, signal, pace = 22) {
  for (const piece of chunkText(text, 2)) {
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
    onDelta(piece);
    await sleep(pace, signal);
  }
}

/** Short rules for the v3 function, which still accepts a client system line (v4 ignores it). */
const LEGACY_SYSTEM = 'אתם העוזר של atlas לבעלי צימרים. ענו בעברית פשוטה וקצרה, בלשון רבים, רק מהנתונים שנשלחו. אל תמציאו מספרים. כשמשווים, טבלת Markdown. אפשר לסיים בשורה של קישורים למסכים באפליקציה בלבד, למשל [פתיחת היתרות](/balances).';

function legacyPrompt(messages, facts) {
  const turns = messages.slice(-6, -1).map((m) => `${m.role === 'user' ? 'שאלה' : 'תשובה'}: ${m.content}`).join('\n');
  const last = messages[messages.length - 1]?.content || '';
  return `נתוני העסק כרגע:\n${factsToText(facts)}\n\n${turns ? `השיחה עד עכשיו:\n${turns}\n\n` : ''}השאלה: ${last}`;
}

/**
 * streamAnswer({ messages:[{role,content}], facts, page, signal, onDelta }) → { model }
 * Throws AssistantError, or an AbortError when the user pressed stop.
 */
export async function streamAnswer({ messages, facts, page = '', signal, onDelta }) {
  if (ASSISTANT_DEMO) {
    void DEMO_STREAM_PATH; // the demo stands in for this endpoint
    await sleep(650, signal); // "בודקים בנתונים שלכם" is real work in production; keep the rhythm honest-looking
    await reveal(demoAnswer(messages[messages.length - 1]?.content, facts), onDelta, signal);
    return { model: 'demo' };
  }

  const { data: s } = await supabase.auth.getSession();
  const jwt = s?.session?.access_token;
  if (!jwt) throw new AssistantError('unauthorized');
  const clean = messages.filter((m) => m.content).slice(-12).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content).slice(0, 2000) }));

  let res;
  try {
    res = await fetch(FN_URL, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${jwt}`, apikey: ANON },
      body: JSON.stringify({
        v: 4, stream: true, page,
        messages: clean,
        context: factsForModel(facts, page),
        prompt: legacyPrompt(clean, facts), system: LEGACY_SYSTEM, // v3 compatibility
      }),
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new AssistantError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'network' : 'upstream');
  }

  const type = res.headers.get('content-type') || '';
  if (type.includes('text/event-stream') && res.body) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let err = null; let meta = null;
    const parser = createSSEParser((ev) => { if (ev.delta) onDelta(ev.delta); if (ev.error) err = ev.error; if (ev.done) meta = ev.meta || {}; });
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        parser.push(dec.decode(value, { stream: true }));
        if (err) break;
      }
    } finally { try { reader.releaseLock(); } catch { /* */ } }
    if (err) throw new AssistantError(err);
    return { model: meta?.model || 'live' };
  }

  const body = await res.json().catch(() => ({}));
  if (res.status === 401) throw new AssistantError('unauthorized');
  if (res.status === 429) throw new AssistantError(body.error === 'daily_limit' ? 'daily_limit' : 'rate_limited');
  if (body.error) throw new AssistantError(body.error === 'upstream_error' ? 'upstream' : body.error);
  if (!res.ok || typeof body.text !== 'string' || !body.text.trim()) throw new AssistantError('upstream');
  await reveal(body.text, onDelta, signal, 12);
  return { model: body.model || 'v3' };
}
