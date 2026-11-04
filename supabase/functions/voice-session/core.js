// voice-session: pure helpers (no Deno / network), shared by index.ts and node tests.
import { brainPrompt } from '../_shared/brain/prompt.js';
import { realtimeTools } from '../_shared/brain/tools.js';

export const VOICE = {
  model: 'eleven_realtime_v1_max',
  voice: 's0T0DT6EAPeX57MQpn3I', // "Danit - Natural Israeli Hebrew" (library voice, female, native Hebrew); in the workspace of the ELEVENLABS_API_KEY secret (picked 04.11.2026)
  dailySeconds: 30 * 60,          // 30 minutes a day per user
  sliceSeconds: 180,              // one secret = one slice; the app renews quietly (see 031_voice_usage.sql)
  secretTtl: 60,                  // the secret must be used within a minute
  wsUrl: 'wss://api.elevenlabs.io/v1/convai/realtime',
};

/** The ElevenLabs "Create realtime client secret" body. Same rules and tools as the text brain. */
export function secretRequest({ today, seconds, sessionId, owner = '', page = '', resume = '' }) {
  const instructions = brainPrompt({ mode: 'voice', today, page, owner })
    + (resume ? `\n\nהמשך שיחה. זה מה שנאמר עד עכשיו (לא לחזור עליו, רק להמשיך):\n${String(resume).slice(0, 1500)}` : '');
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
          turn_detection: { type: 'semantic_vad', eagerness: 'medium', create_response: true, interrupt_response: true },
        },
        output: { format: { type: 'audio/pcm' }, voice: VOICE.voice },
      },
      tools: realtimeTools(),
      tool_choice: 'auto',
      temperature: 0.6,
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
