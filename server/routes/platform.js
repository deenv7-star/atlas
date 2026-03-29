import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requirePlatformAdmin } from '../auth.js';

const router = Router();

router.get('/organizations', requireAuth, requirePlatformAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.id,
             o.name,
             o.subscription_plan,
             o.created_at,
             o.owner_id,
             (SELECT COUNT(*)::int FROM public.users u WHERE u.organization_id = o.id) AS user_count,
             (SELECT s.status FROM public.subscriptions s WHERE s.org_id = o.id ORDER BY s.updated_at DESC NULLS LAST LIMIT 1) AS subscription_status,
             (SELECT s.stripe_customer_id FROM public.subscriptions s WHERE s.org_id = o.id ORDER BY s.updated_at DESC NULLS LAST LIMIT 1) AS stripe_customer_id
      FROM public.organizations o
      ORDER BY o.created_at DESC
      LIMIT 500
    `);
    return res.json({ organizations: rows });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load organizations' });
  }
});

router.get('/stats', requireAuth, requirePlatformAdmin, async (_req, res) => {
  try {
    const [orgs, users, bookings] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM public.organizations'),
      pool.query('SELECT COUNT(*)::int AS c FROM public.users'),
      pool.query('SELECT COUNT(*)::int AS c FROM public.bookings')
    ]);
    return res.json({
      organization_count: orgs.rows[0]?.c ?? 0,
      user_count: users.rows[0]?.c ?? 0,
      booking_count: bookings.rows[0]?.c ?? 0
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load stats' });
  }
});

export default router;
