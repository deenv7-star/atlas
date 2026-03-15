import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

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

router.post('/leads', requireAuth, async (req, res) => {
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

router.patch('/leads/:id/status', requireAuth, async (req, res) => {
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

router.post('/leads/:id/convert', requireAuth, async (req, res) => {
  const { rows: leadRows } = await pool.query('SELECT * FROM public.leads WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  const lead = leadRows[0];
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { rows: bookingRows } = await pool.query(
    `INSERT INTO public.bookings (org_id, property_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, total_price, status, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING','lead_conversion') RETURNING *`,
    [req.orgId, lead.property_id, lead.full_name, lead.email, lead.phone, lead.check_in_date, lead.check_out_date, lead.budget || 0]
  );

  await pool.query(`UPDATE public.leads SET status = 'WON' WHERE id = $1`, [lead.id]);

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

router.post('/bookings', requireAuth, async (req, res) => {
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

router.patch('/bookings/:id/status', requireAuth, async (req, res) => {
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

router.post('/payments', requireAuth, async (req, res) => {
  const schema = z.object({
    booking_id: z.string().uuid(),
    amount: z.coerce.number().positive(),
    payment_type: z.enum(['deposit', 'balance']),
    status: z.enum(['pending', 'paid', 'failed']).default('pending')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO public.payments (org_id, booking_id, amount, payment_type, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.orgId, data.booking_id, data.amount, data.payment_type, data.status]
  );
  return res.status(201).json(rows[0]);
});

router.post('/automations/booking-confirmed', requireAuth, async (req, res) => {
  const schema = z.object({ booking_id: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { rows: bookingRows } = await pool.query('SELECT id, status FROM public.bookings WHERE id = $1 AND org_id = $2', [parsed.data.booking_id, req.orgId]);
  if (!bookingRows[0]) return res.status(404).json({ error: 'Booking not found' });
  if (bookingRows[0].status !== 'CONFIRMED') return res.status(409).json({ error: 'Booking not confirmed' });

  await pool.query(
    `INSERT INTO public.message_logs (org_id, guest_name, channel, message_type, status, content)
     VALUES ($1, 'guest', 'whatsapp', 'before_checkin', 'queued', 'Automated check-in message')`,
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
  await pool.query('DELETE FROM public.refresh_tokens WHERE user_id = $1', [req.userId]);
  await pool.query('DELETE FROM public.users WHERE id = $1 AND organization_id = $2', [req.userId, req.orgId]);
  return res.json({ deleted: true });
});

router.post('/compliance/retention/run', requireAuth, async (req, res) => {
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
