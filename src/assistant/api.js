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
import { demoAnswer, demoProposal, DEMO_STREAM_PATH } from './demoAnswer.js';
import { createDeadline } from './deadline.js';

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
  timeout: 'התשובה מתעכבת יותר מדי. בדקו את החיבור ונסו שוב.',
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
export async function streamAnswer({ messages, facts, page = '', signal, onDelta, onStatus = () => {}, onAction = () => {} }) {
  if (ASSISTANT_DEMO) {
    void DEMO_STREAM_PATH; // the demo stands in for this endpoint
    const q = messages[messages.length - 1]?.content;
    onStatus('בודקים בנתונים שלכם');
    await sleep(650, signal); // the live brain calls tools here; keep the rhythm honest-looking
    const proposal = demoProposal(q, facts);
    if (proposal) onAction(proposal);
    await reveal(proposal ? proposal.say : demoAnswer(q, facts), onDelta, signal);
    return { model: 'demo' };
  }

  const { data: s } = await supabase.auth.getSession();
  const jwt = s?.session?.access_token;
  if (!jwt) throw new AssistantError('unauthorized');
  const clean = messages.filter((m) => m.content).slice(-12).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content).slice(0, 2000) }));

  // Audit 04.11 #3: 30 s for a first response, then a stall timer between streamed pieces.
  const dl = createDeadline(signal);
  const timeoutOr = (e) => {
    if (dl.timedOut()) return new AssistantError('timeout');
    return e;
  };
  try {
  let res;
  try {
    res = await fetch(FN_URL, {
      method: 'POST',
      signal: dl.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${jwt}`, apikey: ANON },
      body: JSON.stringify({
        v: 4, stream: true, page,
        messages: clean,
        context: factsForModel(facts, page),
        prompt: legacyPrompt(clean, facts), system: LEGACY_SYSTEM, // v3 compatibility
      }),
    });
  } catch (e) {
    if (dl.timedOut()) throw new AssistantError('timeout');
    if (e?.name === 'AbortError') throw e;
    throw new AssistantError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'network' : 'upstream');
  }
  dl.bump();

  const type = res.headers.get('content-type') || '';
  if (type.includes('text/event-stream') && res.body) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let err = null; let meta = null;
    const parser = createSSEParser((ev) => {
      if (ev.delta) onDelta(ev.delta);
      if (ev.status) onStatus(ev.status);
      if (ev.action) onAction(ev.action);
      if (ev.error) err = ev.error;
      if (ev.done) meta = ev.meta || {};
    });
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        dl.bump();
        parser.push(dec.decode(value, { stream: true }));
        if (err) break;
      }
    } catch (e) {
      throw timeoutOr(e);
    } finally { try { reader.releaseLock(); } catch { /* */ } }
    if (err) throw new AssistantError(err);
    return { model: meta?.model || 'live' };
  }

  let body;
  try { body = await res.json(); } catch (e) { if (dl.timedOut()) throw new AssistantError('timeout'); body = {}; }
  dl.clear();
  if (res.status === 401) throw new AssistantError('unauthorized');
  if (res.status === 429) throw new AssistantError(body.error === 'daily_limit' ? 'daily_limit' : 'rate_limited');
  if (body.error) throw new AssistantError(body.error === 'upstream_error' ? 'upstream' : body.error);
  if (!res.ok || typeof body.text !== 'string' || !body.text.trim()) throw new AssistantError('upstream');
  await reveal(body.text, onDelta, signal, 12);
  return { model: body.model || 'v3' };
  } finally {
    dl.clear();
  }
}

/* ── voice + tools (same brain) ───────────────────────────────────────── */
const fnUrl = (name) => `${String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')}/functions/v1/${name}`;
async function callFn(name, body, signal) {
  const { data: s } = await supabase.auth.getSession();
  const jwt = s?.session?.access_token;
  if (!jwt) throw new AssistantError('unauthorized');
  let res;
  try {
    res = await fetch(fnUrl(name), { method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}`, apikey: ANON }, body: JSON.stringify(body) });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new AssistantError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'network' : 'upstream');
  }
  const j = await res.json().catch(() => ({}));
  return { status: res.status, body: j };
}

/** Run one brain tool for the voice agent (server-side, with the user's JWT). → { result, proposal } */
export async function runVoiceTool(name, args, signal) {
  const { status, body } = await callFn('ai-chat', { op: 'tool', name, args }, signal);
  if (status === 401) throw new AssistantError('unauthorized');
  if (status === 429) return { result: { error: 'rate_limited' }, proposal: null };
  return { result: body.result ?? { error: body.error || 'lookup_failed' }, proposal: body.proposal || null };
}

/** Ask voice-session for a short-lived ElevenLabs secret (one slice). Throws AssistantError with a voice code. */
export async function startVoiceSession({ page = '', resume = '' } = {}, signal) {
  const { status, body } = await callFn('voice-session', { op: 'start', page, resume }, signal);
  if (status === 401) throw new AssistantError('unauthorized');
  if (body?.client_secret) return body;
  throw new VoiceError(body?.error || (status === 429 ? 'daily_limit' : 'upstream'));
}
export function endVoiceSession(sessionId) {
  if (!sessionId || ASSISTANT_DEMO) return;
  callFn('voice-session', { op: 'end', session_id: sessionId }).catch(() => {});
}

export const VOICE_ERRORS = {
  not_configured: 'השיחה הקולית עוד לא הופעלה בחשבון. אפשר לשאול בכתב.',
  voice_not_ready: 'השיחה הקולית עוד לא הופעלה בחשבון. אפשר לשאול בכתב.',
  daily_limit: 'נגמרו 30 דקות הדיבור של היום. מחר בבוקר אפשר שוב, ובינתיים אפשר לשאול בכתב.',
  mic_denied: 'אין הרשאה למיקרופון. אפשר לאשר בהגדרות, או לשאול בכתב.',
  mic_missing: 'לא מצאנו מיקרופון במכשיר הזה. אפשר לשאול בכתב.',
  network: 'החיבור נקטע. בדקו את האינטרנט ונסו שוב.',
  unauthorized: 'צריך להתחבר מחדש כדי לדבר עם atlas.',
  upstream: 'לא הצלחנו להתחבר לשיחה הקולית. נסו שוב בעוד רגע.',
};
export class VoiceError extends Error {
  constructor(code) { super(VOICE_ERRORS[code] || VOICE_ERRORS.upstream); this.code = VOICE_ERRORS[code] ? code : 'upstream'; }
}
