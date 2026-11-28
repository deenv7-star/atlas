import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { requireActiveSubscription } from '../middleware/require-active-subscription.js';

const router = Router();

const leadSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'OFFER_SENT', 'WON', 'LOST']).default('NEW'),
  property_id: z.string().uuid().optional(),
  quoted_price: z.coerce.number().optional(),
  check_in_date: z.string().optional(),
  check_out_date: z.string().optional()
});

// C3: every write below requires an active trial/subscription (402 when the
// trial has ended and nothing is paid). Reads (GET /compliance/export) and
// account deletion stay open — a locked org must still see its data and be
// able to delete its account.
router.post('/leads', requireAuth, requireActiveSubscription, async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const lead = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO public.leads (org_id, property_id, full_name, email, phone, status, check_in_date, check_out_date, budget)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      req.orgId,
      lead.property_id || null,
      lead.full_name,
      lead.email || '',
      lead.phone || '',
      lead.status,
      lead.check_in_date || null,
      lead.check_out_date || null,
      lead.quoted_price || null
    ]
  );

  return res.status(201).json(rows[0]);
});

router.patch('/leads/:id/status', requireAuth, requireActiveSubscription, async (req, res) => {
  const schema = z.object({ status: z.enum(['NEW', 'CONTACTED', 'OFFER_SENT', 'WON', 'LOST']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { rows } = await pool.query(
    `UPDATE public.leads SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING *`,
    [parsed.data.status, req.params.id, req.orgId]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Lead not found' });
  return res.json(rows[0]);
});

router.post('/leads/:id/convert', requireAuth, requireActiveSubscription, async (req, res) => {
  const { rows: leadRows } = await pool.query('SELECT * FROM public.leads WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  const lead = leadRows[0];
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { rows: bookingRows } = await pool.query(
    `INSERT INTO public.bookings (org_id, property_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, total_price, status, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING','lead_conversion') RETURNING *`,
    [req.orgId, lead.property_id, lead.full_name, lead.email, lead.phone, lead.check_in_date, lead.check_out_date, lead.budget || 0]
  );

  // Lead-convert bug (audit): the UPDATE was unscoped (WHERE id=$1 only). The
  // lead was already fetched with org_id above, but scope the write too so a
  // future refactor cannot flip another org's lead to WON.
  await pool.query(`UPDATE public.leads SET status = 'WON' WHERE id = $1 AND org_id = $2`, [lead.id, req.orgId]);

  return res.status(201).json(bookingRows[0]);
});

const bookingSchema = z.object({
  property_id: z.string().uuid().optional(),
  guest_name: z.string().min(1),
  guest_email: z.string().email().optional(),
  check_in_date: z.string(),
  check_out_date: z.string(),
  total_price: z.coerce.number(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']).default('PENDING')
});

router.post('/bookings', requireAuth, requireActiveSubscription, async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const b = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO public.bookings (org_id, property_id, guest_name, guest_email, check_in_date, check_out_date, total_price, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.orgId, b.property_id || null, b.guest_name, b.guest_email || '', b.check_in_date, b.check_out_date, b.total_price, b.status]
  );
  return res.status(201).json(rows[0]);
});

router.patch('/bookings/:id/status', requireAuth, requireActiveSubscription, async (req, res) => {
  const schema = z.object({ status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { rows } = await pool.query(
    `UPDATE public.bookings SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING *`,
    [parsed.data.status, req.params.id, req.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
  return res.json(rows[0]);
});

router.post('/payments', requireAuth, requireActiveSubscription, async (req, res) => {
  const schema = z.object({
    booking_id: z.string().uuid(),
    amount: z.coerce.number().positive(),
    payment_type: z.enum(['deposit', 'balance']),
    status: z.enum(['pending', 'paid', 'failed']).default('pending')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const statusDb = String(data.status).toUpperCase();
  const { rows } = await pool.query(
    `INSERT INTO public.payments (org_id, booking_id, amount, payment_type, currency, status)
     VALUES ($1, $2, $3, $4, 'ILS', $5) RETURNING *`,
    [req.orgId, data.booking_id, data.amount, data.payment_type, statusDb]
  );
  return res.status(201).json(rows[0]);
});

router.post('/automations/booking-confirmed', requireAuth, requireActiveSubscription, async (req, res) => {
  const schema = z.object({ booking_id: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { rows: bookingRows } = await pool.query('SELECT id, status FROM public.bookings WHERE id = $1 AND org_id = $2', [parsed.data.booking_id, req.orgId]);
  if (!bookingRows[0]) return res.status(404).json({ error: 'Booking not found' });
  if (bookingRows[0].status !== 'CONFIRMED') return res.status(409).json({ error: 'Booking not confirmed' });

  await pool.query(
    `INSERT INTO public.message_logs (org_id, channel, direction, recipient, subject, body, status)
     VALUES ($1, 'whatsapp', 'outbound', 'guest', 'before_checkin', 'Automated check-in message', 'queued')`,
    [req.orgId]
  );

  return res.json({ triggered: true });
});

router.get('/compliance/export', requireAuth, async (req, res) => {
  const [userRes, orgRes, leadsRes, bookingsRes, paymentsRes] = await Promise.all([
    pool.query('SELECT id, email, full_name, phone, profile_image FROM public.users WHERE id = $1 AND organization_id = $2', [req.userId, req.orgId]),
    pool.query('SELECT * FROM public.organizations WHERE id = $1', [req.orgId]),
    pool.query('SELECT * FROM public.leads WHERE org_id = $1', [req.orgId]),
    pool.query('SELECT * FROM public.bookings WHERE org_id = $1', [req.orgId]),
    pool.query('SELECT * FROM public.payments WHERE org_id = $1', [req.orgId])
  ]);

  return res.json({
    exported_at: new Date().toISOString(),
    user: userRes.rows[0] || null,
    organization: orgRes.rows[0] || null,
    leads: leadsRes.rows,
    bookings: bookingsRes.rows,
    payments: paymentsRes.rows
  });
});

router.delete('/compliance/delete-account', requireAuth, async (req, res) => {
  // H13: the old code deleted only refresh_tokens + the users row, leaving the
  // org's business data and the Stripe subscription behind. This deletes the
  // whole org. Deliberately NOT gated by requireActiveSubscription — a locked
  // or past-due org must still be able to delete its account.
  const { rows: subRows } = await pool.query(
    'SELECT stripe_subscription_id FROM public.subscriptions WHERE org_id = $1 LIMIT 1',
    [req.orgId]
  );
  const stripeSubscriptionId = subRows[0]?.stripe_subscription_id || null;

  // Cancel the Stripe subscription first. Best effort: a failed cancel must not
  // trap the user, but it is logged so billing can be cancelled manually.
  if (stripeSubscriptionId && env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      await stripe.subscriptions.cancel(stripeSubscriptionId);
    } catch (e) {
      logger.error('domain.delete_account.stripe_cancel_failed', {
        orgId: req.orgId,
        subscriptionId: stripeSubscriptionId,
        error: String(e?.message || e)
      });
    }
  }

  // Delete the org's data rows (children first). Each table is best-effort so
  // a missing/renamed table cannot block the deletion; failures are logged.
  const orgTables = [
    'message_logs', 'messages', 'payments', 'bookings', 'leads',
    'review_requests', 'cleaning_tasks', 'contract_instances', 'contract_templates',
    'guest_requests', 'automation_rules', 'calendar_syncs', 'messaging_integrations',
    'accounting_integrations', 'pms_integrations', 'payment_gateways', 'invoices',
    'properties', 'units', 'subscriptions'
  ];
  for (const table of orgTables) {
    try {
      await pool.query(`DELETE FROM public.${table} WHERE org_id = $1`, [req.orgId]);
    } catch (e) {
      logger.error('domain.delete_account.table_delete_failed', {
        orgId: req.orgId,
        table,
        error: String(e?.message || e)
      });
    }
  }

  await pool.query(
    'DELETE FROM public.refresh_tokens WHERE user_id IN (SELECT id FROM public.users WHERE organization_id = $1)',
    [req.orgId]
  );
  await pool.query('DELETE FROM public.users WHERE organization_id = $1', [req.orgId]);
  await pool.query('DELETE FROM public.organizations WHERE id = $1', [req.orgId]);

  // TODO (Deen): also delete the user in Supabase Auth. That needs the Supabase
  // service-role key, which this Express server does not hold — call
  // supabase.auth.admin.deleteUser(userId) from a service that holds it, or
  // delete via the Supabase dashboard. Until then the Auth user remains, but
  // it can no longer reach any org data (deleted above) and its refresh
  // tokens are gone. (The Supabase path already deletes fully via the
  // delete_my_account RPC, migration 013b.)
  return res.json({ deleted: true });
});

router.post('/compliance/retention/run', requireAuth, requireActiveSubscription, async (req, res) => {
  const schema = z.object({ older_than_days: z.coerce.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { rowCount } = await pool.query(
    `DELETE FROM public.message_logs
     WHERE org_id = $1 AND created_at < NOW() - ($2::text || ' days')::interval`,
    [req.orgId, parsed.data.older_than_days]
  );

  return res.json({ deleted_rows: rowCount || 0 });
});

export default router;
