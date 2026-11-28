import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * C7: this route used to be an open OpenAI proxy — a client prompt up to
 * 100k chars and a client-chosen model, no system prompt, no quota.
 * Now: fixed server-side system prompt, fixed model, 4000-char prompt cap,
 * per-user daily quota.
 */

/** The model is fixed server-side; any client-supplied `model` is ignored. */
const MODEL = 'gpt-4o-mini';
const MAX_PROMPT_CHARS = 4000;
const MAX_TOKENS = 2048;

/** Fixed server-side system prompt (Hebrew-first). The client cannot override it. */
const SYSTEM_PROMPT = [
  'אתם העוזר של atlas, מערכת לניהול צימרים ומתחמי נופש בישראל.',
  'אתם עונים לבעלי המתחם על העסק שלהם: הזמנות, לוח שנה, תשלומים ויתרות, אורחים, לידים ותמחור.',
  'ענו בעברית פשוטה וקצרה, בלשון רבים ("אתם"). אל תמציאו מספרים, שמות או תאריכים — אם אין לכם את הנתון, אמרו זאת והציעו איפה לבדוק באפליקציה.',
  'אתם רק עונים. לא שולחים הודעות, לא משנים הזמנות, לא גובים כסף ולא מבטיחים לעשות דבר.',
].join('\n');

/**
 * Per-user daily quota, in memory (same style as the in-memory maps in
 * server/middleware/ip-abuse-protection.js).
 * NOTE: this counter lives in one process only — with several instances (or a
 * restart) each one counts separately. For a shared quota, move the counter
 * to Postgres/Redis, following the ai_usage_bump RPC used by the
 * supabase/functions/ai-chat edge function.
 */
const AI_DAILY_LIMIT = env.AI_CHAT_DAILY_LIMIT ?? 150;
const dailyUsage = new Map(); // userId -> { day: 'YYYY-MM-DD', count: number }

function checkDailyQuota(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = dailyUsage.get(userId);
  if (!entry || entry.day !== today) {
    dailyUsage.set(userId, { day: today, count: 1 });
    return true;
  }
  if (entry.count >= AI_DAILY_LIMIT) return false;
  entry.count += 1;
  return true;
}

router.post('/chat', requireAuth, async (req, res) => {
  const parsed = z
    .object({
      prompt: z.string().min(1).max(MAX_PROMPT_CHARS),
      // Accepted for backward compatibility with older clients, but ignored:
      // the model is fixed server-side (see MODEL above).
      model: z.string().max(64).optional()
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (!env.OPENAI_API_KEY) {
    return res.status(501).json({ error: 'AI not configured (OPENAI_API_KEY on server)' });
  }

  if (!checkDailyQuota(req.userId)) {
    return res.status(429).json({ error: 'Daily AI quota exceeded. Try again tomorrow.' });
  }

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: parsed.data.prompt }
      ],
      max_tokens: MAX_TOKENS
    })
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return res.status(502).json({ error: data?.error?.message || 'OpenAI request failed' });
  }

  const text = data.choices?.[0]?.message?.content ?? '';
  return res.json({ text });
});

export default router;
