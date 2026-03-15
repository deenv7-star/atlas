import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAccessToken(app: FastifyInstance, userId: string, organizationId: string, role: string) {
  return app.jwt.sign({ userId, organizationId, role }, { expiresIn: env.ACCESS_TOKEN_TTL });
}

export function generateRefreshToken(): string {
  return randomUUID() + randomUUID();
}

export function randomToken(): string {
  return randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '');
}
