/**
 * POST /api/auth/signup
 * POST /api/auth/signin
 * POST /api/auth/refresh
 * POST /api/auth/signout
 * GET  /api/auth/me
 * PUT  /api/auth/me
 */
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { logger } from '../utils/logger.js';
import { ipAbuseProtection, recordAuthFailure, clearAuthFailure } from '../middleware/ip-abuse-protection.js';
import {
  signToken,
  hashPassword,
  comparePassword,
  requireAuth,
  getUserWithOrg,
  ROLE,
  requireRole,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken
} from '../auth.js';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().max(200).optional().default(''),
  organization_name: z.string().max(200).optional().default('')
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refresh_token: z.string().min(40)
});

const updateMeSchema = z.object({
  full_name: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  profile_image: z.string().url().max(2048).optional()
});

router.post('/signup', ipAbuseProtection, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password, full_name, organization_name } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query('SELECT id FROM public.users WHERE email = $1', [normalizedEmail]);
    if (existing.length > 0) {
      await client.query('ROLLBACK');
      recordAuthFailure(req.ip);
      return res.status(409).json({ error: 'User already registered' });
    }

    const orgName = organization_name.trim() || `${(full_name || email).split('@')[0]}'s Organization`;
    const { rows: [org] } = await client.query('INSERT INTO public.organizations (name) VALUES ($1) RETURNING id', [orgName]);

    const passwordHash = await hashPassword(password);
    const { rows: [user] } = await client.query(
      `INSERT INTO public.users (email, password_hash, full_name, organization_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [normalizedEmail, passwordHash, full_name.trim(), org.id]
    );

    await client.query('UPDATE public.organizations SET owner_id = $1 WHERE id = $2', [user.id, org.id]);
    await client.query('COMMIT');

    const profile = await getUserWithOrg(user.id);
    const access_token = signToken({ userId: user.id, orgId: org.id, role: ROLE.ADMIN });
    const refresh_token = await issueRefreshToken(user.id);
    clearAuthFailure(req.ip);
    return res.status(201).json({ user: profile, access_token, refresh_token });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('auth.signup.failed', { error, requestId: req.requestId });
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/signin', ipAbuseProtection, async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const { rows } = await pool.query(
    'SELECT id, password_hash, organization_id FROM public.users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (rows.length === 0) {
    recordAuthFailure(req.ip);
    return res.status(401).json({ error: 'Invalid login credentials' });
  }

  const user = rows[0];
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    recordAuthFailure(req.ip);
    return res.status(401).json({ error: 'Invalid login credentials' });
  }

  const profile = await getUserWithOrg(user.id);
  const access_token = signToken({ userId: user.id, orgId: user.organization_id, role: profile?.role || ROLE.STAFF });
  const refresh_token = await issueRefreshToken(user.id);

  clearAuthFailure(req.ip);
  return res.json({ user: profile, access_token, refresh_token });
});

router.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const rotated = await rotateRefreshToken(parsed.data.refresh_token);
  if (!rotated) return res.status(401).json({ error: 'Invalid refresh token' });

  const profile = await getUserWithOrg(rotated.userId);
  if (!profile) return res.status(401).json({ error: 'Invalid session' });

  const access_token = signToken({
    userId: profile.id,
    orgId: profile.organization_id,
    role: profile.role
  });

  return res.json({ access_token, refresh_token: rotated.refreshToken });
});

router.post('/signout', requireAuth, async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body || {});
  if (parsed.success) {
    await revokeRefreshToken(parsed.data.refresh_token);
  }
  return res.json({ success: true });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const profile = await getUserWithOrg(req.userId);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    return res.json(profile);
  } catch (error) {
    logger.error('auth.me.failed', { error, requestId: req.requestId, userId: req.userId });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me', requireAuth, requireRole([ROLE.ADMIN, ROLE.MANAGER, ROLE.STAFF]), async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { full_name, phone, profile_image } = parsed.data;

  await pool.query(
    `UPDATE public.users
     SET full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         profile_image = COALESCE($3, profile_image)
     WHERE id = $4`,
    [full_name, phone, profile_image, req.userId]
  );

  const profile = await getUserWithOrg(req.userId);
  return res.json(profile);
});

export default router;
