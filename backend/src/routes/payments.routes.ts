import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

const paymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number(),
  type: z.enum(['DEPOSIT', 'BALANCE']),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  paidAt: z.string().datetime().optional(),
  method: z.string().min(2)
});

export async function paymentsRoutes(app: FastifyInstance) {
  app.get('/payments', { preHandler: [authenticate] }, async (request) => {
    return prisma.payment.findMany({
      where: { booking: { organizationId: request.authUser.organizationId } },
      include: { booking: true }
    });
  });

  app.post('/payments', { preHandler: [authenticate] }, async (request, reply) => {
    const body = paymentSchema.parse(request.body);
    const payment = await prisma.payment.create({
      data: {
        ...body,
        paidAt: body.paidAt ? new Date(body.paidAt) : undefined
      }
    });
    return reply.code(201).send(payment);
  });
}
