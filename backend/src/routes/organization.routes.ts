import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

export async function organizationRoutes(app: FastifyInstance) {
  app.get('/organization', { preHandler: [authenticate] }, async (request) => {
    return prisma.organization.findUnique({ where: { id: request.authUser.organizationId } });
  });

  app.patch('/organization', { preHandler: [authenticate] }, async (request) => {
    const schema = z.object({ name: z.string().min(2) });
    const body = schema.parse(request.body);
    return prisma.organization.update({
      where: { id: request.authUser.organizationId },
      data: { name: body.name }
    });
  });
}
