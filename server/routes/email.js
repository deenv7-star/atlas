import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { env } from '../config/env.js';

const router = Router();

router.post('/send', requireAuth, async (req, res) => {
  const parsed = z
    .object({
      to: z.string().email(),
      subject: z.string().min(1).max(200),
      text: z.string().max(100_000)
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return res.status(501).json({ error: 'Email not configured (RESEND_API_KEY and EMAIL_FROM on server)' });
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [parsed.data.to],
      subject: parsed.data.subject,
      text: parsed.data.text
    })
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return res.status(502).json({ error: data?.message || 'Resend request failed' });
  }

  return res.json({ success: true, id: data?.id });
});

export default router;
