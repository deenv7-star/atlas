import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { queues } from '../queues/index.js';

const schema = z.object({
  name: z.string().min(2),
  trigger: z.string().min(2),
  condition: z.record(z.any()).optional(),
  action: z.record(z.any()),
  isActive: z.boolean().optional()
});

export async function automationsRoutes(app: FastifyInstance) {
  app.get('/automations', { preHandler: [authenticate] }, async (request) => {
    return prisma.automationRule.findMany({ where: { organizationId: request.authUser.organizationId } });
  });

  app.post('/automations', { preHandler: [authenticate] }, async (request, reply) => {
    const body = schema.parse(request.body);
    const automation = await prisma.automationRule.create({
      data: {
        ...body,
        organizationId: request.authUser.organizationId
      }
    });

    await queues.automationExecution.add('automation-created', { automationId: automation.id });
    return reply.code(201).send(automation);
  });
}
