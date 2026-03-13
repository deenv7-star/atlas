/**
 * POST /api/auth/signup
 * POST /api/auth/signin
 * POST /api/auth/signout
 * GET  /api/auth/me
 * PUT  /api/auth/me
 */
import { Router } from 'express';
import { pool } from '../db.js';
import {
  signToken, hashPassword, comparePassword,
  requireAuth, getUserWithOrg,
} from '../auth.js';

const router = Router();

// ── Sign up ───────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { email, password, full_name = '', organization_name = '' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check existing user
    const { rows: existing } = await client.query(
      'SELECT id FROM public.users WHERE email = $1', [email.toLowerCase()]
    );
    if (existing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'User already registered' });
    }

    // Create organization
    const orgName = organization_name.trim() || `${(full_name || email).split('@')[0]}'s Organization`;
    const { rows: [org] } = await client.query(
      `INSERT INTO public.organizations (name) VALUES ($1) RETURNING id`, [orgName]
    );

    // Create user
    const passwordHash = await hashPassword(password);
    const { rows: [user] } = await client.query(
      `INSERT INTO public.users (email, password_hash, full_name, organization_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [email.toLowerCase(), passwordHash, full_name.trim(), org.id]
    );

    // Set org owner
    await client.query(
      'UPDATE public.organizations SET owner_id = $1 WHERE id = $2',
      [user.id, org.id]
    );

    await client.query('COMMIT');

    const profile = await getUserWithOrg(user.id);
    const token   = signToken({ userId: user.id, orgId: org.id });

    res.status(201).json({ user: profile, token });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[signup]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── Sign in ───────────────────────────────────────────────────────────────────
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const { rows } = await pool.query(
    'SELECT id, password_hash, organization_id FROM public.users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid login credentials' });
  }

  const user = rows[0];
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid login credentials' });
  }

  const profile = await getUserWithOrg(user.id);
  const token   = signToken({ userId: user.id, orgId: user.organization_id });

  res.json({ user: profile, token });
});

// ── Sign out ──────────────────────────────────────────────────────────────────
router.post('/signout', requireAuth, (_req, res) => {
  // JWT is stateless — client discards the token
  res.json({ success: true });
});

// ── Get current user ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const profile = await getUserWithOrg(req.userId);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    res.json(profile);
  } catch (err) {
    console.error('[/me]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update current user ───────────────────────────────────────────────────────
router.put('/me', requireAuth, async (req, res) => {
  const { full_name, phone, profile_image } = req.body;

  await pool.query(
    `UPDATE public.users
     SET full_name = COALESCE($1, full_name),
         phone     = COALESCE($2, phone),
         profile_image = COALESCE($3, profile_image)
     WHERE id = $4`,
    [full_name, phone, profile_image, req.userId]
  );

  const profile = await getUserWithOrg(req.userId);
  res.json(profile);
});

export default router;
