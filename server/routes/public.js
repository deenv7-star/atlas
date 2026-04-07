import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const router = Router();

const contactBody = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().min(10).max(8000),
  website: z.string().max(200).optional().default(''),
});

const SUBJECT_LABELS = {
  '': 'כללי',
  sales: 'שאלה לפני רכישה',
  support: 'תמיכה טכנית',
  billing: 'חיוב ותשלומים',
  partnership: 'שותפויות',
  other: 'אחר',
};

/**
 * Public contact form — no auth.
 * When RESEND_API_KEY, EMAIL_FROM, and CONTACT_INBOX_EMAIL are set, sends via Resend.
 * Otherwise returns 503 so the client can fall back to mailto.
 */
router.post('/contact', async (req, res) => {
  const raw = req.body && typeof req.body === 'object' ? req.body : {};
  if (raw.website && String(raw.website).trim().length > 0) {
    return res.status(204).send();
  }

  const parsed = contactBody.safeParse(raw);
  if (!parsed.success) {
    return res.status(400).json({ error: 'נתונים לא תקינים' });
  }

  const { name, email, phone, subject, message } = parsed.data;
  const topic = SUBJECT_LABELS[subject] || SUBJECT_LABELS[''];
  const text =
    `פנייה מטופס צור קשר באתר ATLAS\n\n` +
    `שם: ${name}\n` +
    `אימייל: ${email}\n` +
    `טלפון: ${phone || '—'}\n` +
    `נושא: ${topic}\n\n` +
    `${message}\n`;

  const inbox = env.CONTACT_INBOX_EMAIL;
  if (env.RESEND_API_KEY && env.EMAIL_FROM && inbox) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [inbox],
          reply_to: email,
          subject: `[ATLAS צור קשר] ${topic} — ${name}`,
          text,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        logger.warn('public.contact_resend_failed', { status: r.status, data });
        return res.status(502).json({ error: data?.message || 'שליחת המייל נכשלה' });
      }
      return res.json({ ok: true, id: data?.id });
    } catch (e) {
      logger.error('public.contact_resend_error', { error: String(e) });
      return res.status(502).json({ error: 'שגיאת רשת בשליחת המייל' });
    }
  }

  logger.info('public.contact_form_unconfigured', {
    name,
    email,
    subject: topic,
    ip: req.ip,
    messagePreview: message.slice(0, 160),
  });
  return res.status(503).json({ ok: false, code: 'EMAIL_NOT_CONFIGURED' });
});

export default router;
