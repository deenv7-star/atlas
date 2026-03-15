import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

const bookingSchema = z.object({
  propertyId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']).optional(),
  guestDetails: z.record(z.any()),
  checkInDate: z.string().datetime(),
  checkOutDate: z.string().datetime(),
  totalPrice: z.number(),
  deposit: z.number(),
  balance: z.number(),
  notes: z.string().optional()
});

export async function bookingsRoutes(app: FastifyInstance) {
  app.get('/bookings', { preHandler: [authenticate] }, async (request) => {
    return prisma.booking.findMany({
      where: { organizationId: request.authUser.organizationId },
      include: { payments: true, cleaningTasks: true }
    });
  });

  app.post('/bookings', { preHandler: [authenticate] }, async (request, reply) => {
    const body = bookingSchema.parse(request.body);
    const booking = await prisma.booking.create({
      data: {
        ...body,
        checkInDate: new Date(body.checkInDate),
        checkOutDate: new Date(body.checkOutDate),
        organizationId: request.authUser.organizationId
      }
    });
    return reply.code(201).send(booking);
  });

  app.patch('/bookings/:id', { preHandler: [authenticate] }, async (request) => {
    const id = (request.params as { id: string }).id;
    const body = bookingSchema.partial().parse(request.body);
    await prisma.booking.updateMany({ where: { id, organizationId: request.authUser.organizationId }, data: body as any });
    return prisma.booking.findUnique({ where: { id } });
  });
}
