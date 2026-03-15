import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { queues } from '../queues/index.js';

const schema = z.object({
  bookingId: z.string().uuid(),
  lineItems: z.array(z.object({ description: z.string(), amount: z.number() })),
  taxRate: z.number().default(17)
});

export async function invoicesRoutes(app: FastifyInstance) {
  app.get('/invoices', { preHandler: [authenticate] }, async (request) => {
    return prisma.invoice.findMany({ where: { booking: { organizationId: request.authUser.organizationId } } });
  });

  app.post('/invoices', { preHandler: [authenticate] }, async (request, reply) => {
    const body = schema.parse(request.body);
    const subtotal = body.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal + subtotal * (body.taxRate / 100);

    const invoice = await prisma.invoice.create({
      data: {
        bookingId: body.bookingId,
        number: `INV-${Date.now()}`,
        lineItems: body.lineItems,
        taxRate: body.taxRate,
        subtotal,
        total
      }
    });

    await queues.invoiceGeneration.add('generate-pdf', { invoiceId: invoice.id });

    return reply.code(201).send(invoice);
  });
}
