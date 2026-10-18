// Minimal OpenAI Chat Completions client (structured output). The key never leaves the Edge Function.
import { ANSWER_SCHEMA } from './prompt.ts';
import { costUsd } from './policy.ts';

export type BotAnswer = {
  answer: string;
  links: { label: string; path: string }[];
  confidence: 'high' | 'medium' | 'low';
  suggest_human: boolean;
  follow_ups: string[];
};
export type LlmResult = { answer: BotAnswer; model: string; tokens_in: number; tokens_cached: number; tokens_out: number; cost_usd: number; latency_ms: number };
export type Llm = (messages: { role: 'system' | 'user' | 'assistant'; content: string }[], opts: { user: string }) => Promise<LlmResult>;

export function openaiLlm(apiKey: string, model: string, effort = 'low', timeoutMs = 30000): Llm {
  return async (messages, { user }) => {
    const t0 = Date.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages,
          reasoning_effort: effort,
          max_completion_tokens: 1800,
          response_format: { type: 'json_schema', json_schema: ANSWER_SCHEMA },
          // A stable per-user key keeps one customer's traffic on the same cache shard; the system prompt (KB) is identical for everyone.
          prompt_cache_key: 'atlas-support-kb',
          safety_identifier: user,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`openai ${res.status}: ${j?.error?.message || 'error'}`);
      const content = j.choices?.[0]?.message?.content || '';
      const answer = JSON.parse(content) as BotAnswer;
      const u = j.usage || {};
      const tin = u.prompt_tokens || 0, tcached = u.prompt_tokens_details?.cached_tokens || 0, tout = u.completion_tokens || 0;
      return { answer, model: j.model || model, tokens_in: tin, tokens_cached: tcached, tokens_out: tout, cost_usd: costUsd(model, tin, tcached, tout), latency_ms: Date.now() - t0 };
    } finally {
      clearTimeout(timer);
    }
  };
}
