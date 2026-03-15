import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

const leadSchema = z.object({
  propertyId: z.string().uuid().optional(),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'OFFER_SENT', 'WON', 'LOST']).optional(),
  notes: z.string().optional(),
  checkInDate: z.string().datetime().optional(),
  checkOutDate: z.string().datetime().optional(),
  quotedPrice: z.number().optional()
});

export async function leadsRoutes(app: FastifyInstance) {
  app.get('/leads', { preHandler: [authenticate] }, async (request) => {
    const query = request.query as { status?: string; search?: string };
    return prisma.lead.findMany({
      where: {
        organizationId: request.authUser.organizationId,
        status: query.status as any,
        OR: query.search
          ? [{ fullName: { contains: query.search, mode: 'insensitive' } }, { email: { contains: query.search, mode: 'insensitive' } }]
          : undefined
      }
    });
  });

  app.post('/leads', { preHandler: [authenticate] }, async (request, reply) => {
    const body = leadSchema.parse(request.body);
    const lead = await prisma.lead.create({
      data: {
        ...body,
        checkInDate: body.checkInDate ? new Date(body.checkInDate) : undefined,
        checkOutDate: body.checkOutDate ? new Date(body.checkOutDate) : undefined,
        organizationId: request.authUser.organizationId
      }
    });
    return reply.code(201).send(lead);
  });

  app.patch('/leads/:id', { preHandler: [authenticate] }, async (request) => {
    const body = leadSchema.partial().parse(request.body);
    const id = (request.params as { id: string }).id;
    await prisma.lead.updateMany({ where: { id, organizationId: request.authUser.organizationId }, data: body as any });
    return prisma.lead.findUnique({ where: { id } });
  });

  app.post('/leads/:id/convert', { preHandler: [authenticate] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const lead = await prisma.lead.findFirst({ where: { id, organizationId: request.authUser.organizationId } });
    if (!lead || !lead.propertyId || !lead.checkInDate || !lead.checkOutDate || !lead.quotedPrice) {
      return reply.code(400).send({ message: 'Lead missing conversion data' });
    }

    const booking = await prisma.booking.create({
      data: {
        organizationId: lead.organizationId,
        propertyId: lead.propertyId,
        leadId: lead.id,
        status: 'PENDING',
        guestDetails: { fullName: lead.fullName, email: lead.email, phone: lead.phone },
        checkInDate: lead.checkInDate,
        checkOutDate: lead.checkOutDate,
        totalPrice: lead.quotedPrice,
        deposit: Number(lead.quotedPrice) * 0.3,
        balance: Number(lead.quotedPrice) * 0.7
      }
    });

    await prisma.lead.update({ where: { id: lead.id }, data: { status: 'WON' } });
    return reply.code(201).send(booking);
  });
}
