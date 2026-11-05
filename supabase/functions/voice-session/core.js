// voice-session: pure helpers (no Deno / network), shared by index.ts and node tests.
import { brainPrompt } from '../_shared/brain/prompt.js';
import { realtimeTools } from '../_shared/brain/tools.js';

export const VOICE = {
  model: 'eleven_realtime_v1_max',
  voice: 'enR7mijIG1cHGbbpygXW', // "אירה" (Ira, account voice, female, Hebrew; Deen's pick 04.11.2026 23:27). Before: s0T0DT6EAPeX57MQpn3I "Danit"
  dailySeconds: 30 * 60,          // 30 minutes a day per user
  sliceSeconds: 180,              // one secret = one slice (the cap); charged by seconds actually used (032_voice_usage_actual.sql)
  secretTtl: 60,                  // the secret must be used within a minute
  wsUrl: 'wss://api.elevenlabs.io/v1/convai/realtime',
  turn: { type: 'semantic_vad', eagerness: 'medium', create_response: true, interrupt_response: true },
  temperature: 0.7, // a natural spoken tone; facts still come only from tools
};

/** The ElevenLabs "Create realtime client secret" body. Same rules and tools as the text brain. */
export function secretRequest({ today, seconds, sessionId, owner = '', page = '', resume = '', native = false }) {
  const instructions = brainPrompt({ mode: 'voice', today, page, owner, native })
    + (resume ? `\n\nהמשך שיחה. זה מה שנאמר עד עכשיו (לא לחזור עליו, לא לברך שוב, רק להמשיך מאותה נקודה):\n${String(resume).slice(0, 1500)}` : '');
  return {
    session: {
      type: 'realtime',
      model: VOICE.model,
      instructions,
      output_modalities: ['audio'],
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24000 },
          transcription: { language: 'he' },
          // semantic_vad is the only mode Eleven accepts. 'medium' = what ran live in voice-session v8 (the v2 'high' was an
          // unverified guess, reverted 04.11.2026); the app's watchdog nudges a turn left unanswered.
          turn_detection: VOICE.turn,
        },
        output: { format: { type: 'audio/pcm' }, voice: VOICE.voice },
      },
      tools: realtimeTools(),
      tool_choice: 'auto',
      temperature: VOICE.temperature,
      max_response_output_tokens: 1024, // Max needs >= 1024
      max_duration_seconds: Math.max(60, Math.min(VOICE.sliceSeconds, Math.floor(seconds))), // ElevenLabs rejects < 60 (422)
      tracing: sessionId ? { group_id: String(sessionId).slice(0, 64) } : 'auto',
    },
    expires_after: { anchor: 'created_at', seconds: VOICE.secretTtl },
  };
}

/** What the browser gets back. Never the API key; only the short-lived secret. */
export function clientPayload({ secret, sessionId, seconds, usedToday }) {
  return {
    client_secret: secret.value,
    expires_at: secret.expires_at,
    session_id: sessionId,
    seconds,
    remaining_today: Math.max(0, VOICE.dailySeconds - usedToday - seconds),
    ws_url: VOICE.wsUrl,
    model: VOICE.model,
  };
}

/** Close / error telemetry from the app (op 'end' with `close`, op 'event'). Only short, typed fields reach the logs. */
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
const num = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
export const CLIENT_EVENTS = new Set(['ws_error', 'server_error', 'fatal_error', 'open', 'start_failed']);
export function closeLog({ user, session, close }) {
  const c = close && typeof close === 'object' ? close : {};
  return { fn: 'voice-session', event: 'close', user, session: str(session, 64), code: num(c.code), reason: str(c.reason, 200),
    clean: c.clean === true, by_us: c.by_us === true, age_ms: num(c.age_ms), open_ms: num(c.open_ms), state: str(c.state, 20), errors: str(c.errors, 300) };
}
export function eventLog({ user, body }) {
  const kind = CLIENT_EVENTS.has(body?.kind) ? body.kind : null;
  if (!kind) return null;
  return { fn: 'voice-session', event: 'client', kind, user, session: str(body.session_id, 64), code: str(String(body.code ?? ''), 80),
    message: str(body.message, 200), age_ms: num(body.age_ms), state: str(body.state, 20) };
}
