import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { queues } from '../queues/index.js';

const schema = z.object({
  name: z.string().min(2),
  trigger: z.enum(['before_checkin', 'checkout_day', 'review_request']),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  content: z.string().min(4)
});

export async function messagesRoutes(app: FastifyInstance) {
  app.get('/message-templates', { preHandler: [authenticate] }, async (request) => {
    return prisma.messageTemplate.findMany({ where: { organizationId: request.authUser.organizationId } });
  });

  app.post('/message-templates', { preHandler: [authenticate] }, async (request, reply) => {
    const body = schema.parse(request.body);
    const template = await prisma.messageTemplate.create({
      data: { ...body, organizationId: request.authUser.organizationId }
    });

    await queues.messageSending.add('template-created', {
      templateId: template.id,
      organizationId: request.authUser.organizationId
    });

    return reply.code(201).send(template);
  });
}
