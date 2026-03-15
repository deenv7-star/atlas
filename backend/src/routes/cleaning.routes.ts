import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

const schema = z.object({
  bookingId: z.string().uuid(),
  assignedToId: z.string().uuid().optional(),
  scheduledTime: z.string().datetime(),
  checklist: z.array(z.string()).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional()
});

export async function cleaningRoutes(app: FastifyInstance) {
  app.get('/cleaning', { preHandler: [authenticate] }, async (request) => {
    return prisma.cleaningTask.findMany({ where: { booking: { organizationId: request.authUser.organizationId } } });
  });

  app.post('/cleaning-task', { preHandler: [authenticate] }, async (request, reply) => {
    const body = schema.parse(request.body);
    const task = await prisma.cleaningTask.create({
      data: {
        ...body,
        scheduledTime: new Date(body.scheduledTime)
      }
    });
    return reply.code(201).send(task);
  });
}
