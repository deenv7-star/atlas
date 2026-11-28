import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * C8: this route used to be an open relay — any authenticated user could send
 * any subject/body (up to 100k chars) to any address via Resend.
 * Now: single recipient only, body capped, per-org daily quota, and the
 * recipient must be the user's own email, an address in the org's own records
 * (a lead, a booking guest, or another user of the same org), or an address
 * on the EMAIL_ALLOWED_RECIPIENTS env allowlist.
 *
 * Verified caller: integrations.Core.SendEmail in src/api/client.js (used by
 * the app's review/message flows) sends to guest/lead addresses from the
 * org's own records, so it stays working. It returns a mailto: fallback when
 * the server is unreachable, which is unchanged.
 */
const MAX_TEXT_CHARS = 10_000;
const EMAIL_DAILY_LIMIT = env.EMAIL_DAILY_LIMIT_PER_ORG ?? 50;

/**
 * Per-org daily quota, in memory.
 * NOTE: same multi-instance caveat as server/routes/ai.js — with several
 * instances (or a restart) each one counts separately. Move the counter to
 * Postgres/Redis for a shared quota.
 */
const dailyUsage = new Map(); // orgId -> { day: 'YYYY-MM-DD', count: number }

function checkDailyQuota(orgId) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = dailyUsage.get(orgId);
  if (!entry || entry.day !== today) {
    dailyUsage.set(orgId, { day: today, count: 1 });
    return true;
  }
  if (entry.count >= EMAIL_DAILY_LIMIT) return false;
  entry.count += 1;
  return true;
}

function envAllowlist() {
  return (env.EMAIL_ALLOWED_RECIPIENTS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function isAllowedRecipient(orgId, email, ownEmail) {
  const normalized = String(email || '').toLowerCase();
  if (!normalized) return false;
  if (ownEmail && normalized === String(ownEmail).toLowerCase()) return true;
  if (envAllowlist().includes(normalized)) return true;
  // The recipient must belong to the org's own records: a lead, a booking
  // guest, or another user of the same org.
  const { rows } = await pool.query(
    `SELECT 1 FROM public.leads WHERE org_id = $1 AND lower(email) = $2
     UNION ALL
     SELECT 1 FROM public.bookings WHERE org_id = $1 AND lower(guest_email) = $2
     UNION ALL
     SELECT 1 FROM public.users WHERE organization_id = $1 AND lower(email) = $2
     LIMIT 1`,
    [orgId, normalized]
  );
  return rows.length > 0;
}

router.post('/send', requireAuth, async (req, res) => {
  const parsed = z
    .object({
      to: z.string().email(),
      subject: z.string().min(1).max(200),
      text: z.string().max(MAX_TEXT_CHARS)
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return res.status(501).json({ error: 'Email not configured (RESEND_API_KEY and EMAIL_FROM on server)' });
  }

  let allowed;
  try {
    allowed = await isAllowedRecipient(req.orgId, parsed.data.to, req.authUser?.email);
  } catch (error) {
    // Fail closed: if the recipient cannot be verified, do not send.
    logger.error('email.recipient_check_failed', { error, requestId: req.requestId, orgId: req.orgId });
    return res.status(503).json({ error: 'Recipient check unavailable. Try again shortly.' });
  }
  if (!allowed) {
    return res.status(403).json({
      error: 'Recipient is not in this organization\'s records. Email can only be sent to your own address, a guest or lead of this organization, or an allowlisted address (EMAIL_ALLOWED_RECIPIENTS).'
    });
  }

  if (!checkDailyQuota(req.orgId)) {
    return res.status(429).json({ error: 'Daily email quota for this organization exceeded' });
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
