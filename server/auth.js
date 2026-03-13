/**
 * JWT auth middleware and token helpers
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const JWT_SECRET      = process.env.JWT_SECRET      || 'atlas_jwt_secret_change_in_production';
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN  || '7d';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const payload = verifyToken(token);
    req.userId    = payload.userId;
    req.orgId     = payload.orgId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function getUserWithOrg(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.profile_image,
            u.organization_id,
            o.name  AS organization_name,
            o.subscription_plan
     FROM public.users u
     LEFT JOIN public.organizations o ON o.id = u.organization_id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0] || null;
}
