import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { env } from '../config/env.js';

const router = Router();

router.post('/chat', requireAuth, async (req, res) => {
  const parsed = z
    .object({
      prompt: z.string().min(1).max(100_000),
      model: z.string().max(64).optional()
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (!env.OPENAI_API_KEY) {
    return res.status(501).json({ error: 'AI not configured (OPENAI_API_KEY on server)' });
  }

  const model = parsed.data.model || 'gpt-4o-mini';

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: parsed.data.prompt }],
      max_tokens: 2048
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
