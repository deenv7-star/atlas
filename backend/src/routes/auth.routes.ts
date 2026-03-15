import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { generateRefreshToken, hashPassword, randomToken, signAccessToken, verifyPassword } from '../utils/auth.js';
import { createHash } from 'node:crypto';

const registerSchema = z.object({
  organizationName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const refreshSchema = z.object({ refreshToken: z.string().min(12) });

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.code(409).send({ message: 'Email already in use' });

    const passwordHash = await hashPassword(body.password);
    const verificationToken = randomToken();
    const organization = await prisma.organization.create({
      data: {
        name: body.organizationName,
        users: {
          create: {
            email: body.email,
            fullName: body.fullName,
            role: 'OWNER',
            passwordHash,
            verificationToken
          }
        }
      },
      include: { users: true }
    });

    return reply.code(201).send({
      message: 'Registered. Verify email using token.',
      verificationToken,
      userId: organization.users[0].id
    });
  });

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const accessToken = await signAccessToken(app, user.id, user.organizationId, user.role);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });

    return { accessToken, refreshToken };
  });

  app.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return reply.code(401).send({ message: 'Invalid refresh token' });
    }

    const accessToken = await signAccessToken(app, stored.userId, stored.organizationId, stored.user.role);
    return { accessToken };
  });

  app.post('/auth/verify-email', async (request, reply) => {
    const schema = z.object({ token: z.string().min(8) });
    const { token } = schema.parse(request.body);
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return reply.code(404).send({ message: 'Invalid token' });
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: null, emailVerifiedAt: new Date() } });
    return { message: 'Email verified' };
  });

  app.post('/auth/password-reset/request', async (request) => {
    const schema = z.object({ email: z.string().email() });
    const { email } = schema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If account exists, reset token generated' };
    const resetToken = randomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) }
    });
    return { message: 'Reset token generated', resetToken };
  });

  app.post('/auth/password-reset/confirm', async (request, reply) => {
    const schema = z.object({ token: z.string(), password: z.string().min(8) });
    const { token, password } = schema.parse(request.body);
    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return reply.code(400).send({ message: 'Invalid or expired token' });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    return { message: 'Password reset complete' };
  });
}
