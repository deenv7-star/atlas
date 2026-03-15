import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

const propertySchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  calendarAvailability: z.record(z.any()).optional(),
  pricingRules: z.record(z.any()).optional(),
  cleaningSettings: z.record(z.any()).optional()
});

export async function propertiesRoutes(app: FastifyInstance) {
  app.get('/properties', { preHandler: [authenticate] }, async (request) => {
    return prisma.property.findMany({ where: { organizationId: request.authUser.organizationId } });
  });

  app.post('/properties', { preHandler: [authenticate] }, async (request, reply) => {
    const body = propertySchema.parse(request.body);
    const property = await prisma.property.create({
      data: { ...body, organizationId: request.authUser.organizationId }
    });
    return reply.code(201).send(property);
  });

  app.patch('/properties/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const body = propertySchema.partial().parse(request.body);
    const id = (request.params as { id: string }).id;
    const existing = await prisma.property.findFirst({ where: { id, organizationId: request.authUser.organizationId } });
    if (!existing) return reply.code(404).send({ message: 'Property not found' });
    return prisma.property.update({ where: { id }, data: body });
  });

  app.delete('/properties/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const existing = await prisma.property.findFirst({ where: { id, organizationId: request.authUser.organizationId } });
    if (!existing) return reply.code(404).send({ message: 'Property not found' });
    await prisma.property.delete({ where: { id } });
    return reply.code(204).send();
  });
}
