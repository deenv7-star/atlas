/**
 * JWT auth middleware and authz helpers
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { pool } from './db.js';
import { env } from './config/env.js';

const ROLE = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF'
};

export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function hashOpaqueToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueRefreshToken(userId) {
  const rawToken = randomBytes(48).toString('hex');
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO public.refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return rawToken;
}

export async function rotateRefreshToken(rawToken) {
  const tokenHash = hashOpaqueToken(rawToken);

  const { rows } = await pool.query(
    `DELETE FROM public.refresh_tokens
     WHERE token = $1 AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );

  if (!rows[0]) return null;

  const newToken = await issueRefreshToken(rows[0].user_id);
  return { userId: rows[0].user_id, refreshToken: newToken };
}

export async function revokeRefreshToken(rawToken) {
  const tokenHash = hashOpaqueToken(rawToken);
  await pool.query('DELETE FROM public.refresh_tokens WHERE token = $1', [tokenHash]);
}

export async function getUserWithOrg(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.profile_image,
            u.organization_id,
            o.id AS org_id,
            o.owner_id,
            o.name  AS organization_name,
            o.subscription_plan
     FROM public.users u
     LEFT JOIN public.organizations o ON o.id = u.organization_id
     WHERE u.id = $1`,
    [userId]
  );

  if (!rows[0]) return null;

  const row = rows[0];
  return {
    ...row,
    role: row.owner_id === row.id ? ROLE.ADMIN : ROLE.MANAGER
  };
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const payload = verifyToken(token);
    const user = await getUserWithOrg(payload.userId);

    if (!user || !user.organization_id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    req.userId = user.id;
    req.orgId = user.organization_id;
    req.role = user.role;
    req.authUser = user;

    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

export { ROLE };
