import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

const schema = z.object({
  type: z.enum(['MESSAGING', 'PAYMENT', 'ACCOUNTING', 'PMS', 'CALENDAR']),
  provider: z.enum([
    'WHATSAPP',
    'EMAIL',
    'SMS',
    'STRIPE',
    'TRANZILA',
    'MORNING',
    'GREEN_INVOICE',
    'GUESTY',
    'HOSTAWAY',
    'GOOGLE_CALENDAR',
    'AIRBNB',
    'BOOKING'
  ]),
  config: z.record(z.any()),
  status: z.enum(['ACTIVE', 'DISCONNECTED', 'ERROR']).optional()
});

export async function integrationsRoutes(app: FastifyInstance) {
  app.get('/integrations', { preHandler: [authenticate] }, async (request) => {
    return prisma.integrationConfig.findMany({ where: { organizationId: request.authUser.organizationId } });
  });

  app.post('/integrations', { preHandler: [authenticate] }, async (request, reply) => {
    const body = schema.parse(request.body);
    const integration = await prisma.integrationConfig.create({
      data: { ...body, organizationId: request.authUser.organizationId }
    });
    return reply.code(201).send(integration);
  });
}
