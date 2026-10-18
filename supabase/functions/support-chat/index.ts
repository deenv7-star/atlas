/**
 * ATLAS Edge Function — support-chat (help bot + human handoff). See README.md in this folder.
 *
 * POST { action: 'send', message, conversation_id?, client_id?, page?, device? }
 *   → { conversation_id, mode, user_message, reply, offer_handoff, offer_reason }
 * POST { action: 'handoff', conversation_id?, reason? }   → { conversation_id, mode: 'human', system_message }
 *
 * Env (Edge Function secrets; SUPABASE_* are provided by Supabase):
 *   OPENAI_API_KEY        required for real answers (without it the function answers in mock mode)
 *   SUPPORT_MODEL         default gpt-6-luna
 *   SUPPORT_REASONING     default low
 *   SUPPORT_ALLOWED_ORIGINS  comma list, default https://atlas-il.com,https://www.atlas-il.com
 *   SUPPORT_MOCK=1        force mock answers (no OpenAI calls)
 *   RESEND_API_KEY, SUPPORT_NOTIFY_EMAIL, SUPPORT_NOTIFY_WEBHOOK, SUPPORT_ADMIN_URL  (optional handoff alerts)
 *   SUPPORT_RATE_BURST / _HOUR / _DAY  per-user message limits (default 8 / 2 min, 40 / hour, 120 / day)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import kb from './kb/kb.ts';
import { handle } from './lib/handler.ts';
import { supabaseStore } from './lib/store.ts';
import { openaiLlm } from './lib/openai.ts';
import { notifyHandoff } from './lib/notify.ts';
import type { KB } from './lib/prompt.ts';

const env = (k: string, d = '') => Deno.env.get(k) || d;
const store = supabaseStore(createClient, env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), env('SUPABASE_SERVICE_ROLE_KEY'));
const key = env('OPENAI_API_KEY');
const llm = key && env('SUPPORT_MOCK') !== '1' ? openaiLlm(key, env('SUPPORT_MODEL', 'gpt-6-luna'), env('SUPPORT_REASONING', 'low')) : null;
const allowedOrigins = env('SUPPORT_ALLOWED_ORIGINS', 'https://atlas-il.com,https://www.atlas-il.com').split(',').map((s) => s.trim()).filter(Boolean);

Deno.serve((req) => handle(req, {
  store,
  kb: kb as unknown as KB,
  llm,
  notify: notifyHandoff,
  allowedOrigins,
  // Structured logs (no message text, no PII) → Supabase Dashboard → Edge Functions → Logs.
  log: (event, data) => console.log(JSON.stringify({ fn: 'support-chat', event, ...data })),
}));
