import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { queues } from '../queues/index.js';

export async function calendarRoutes(app: FastifyInstance) {
  app.post('/calendar-sync/import', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({ propertyId: z.string().uuid(), provider: z.enum(['AIRBNB', 'BOOKING', 'GOOGLE_CALENDAR']), iCalUrl: z.string().url() });
    const body = schema.parse(request.body);
    const sync = await prisma.calendarSync.create({
      data: {
        organizationId: request.authUser.organizationId,
        propertyId: body.propertyId,
        provider: body.provider,
        iCalUrl: body.iCalUrl,
        status: 'ACTIVE'
      }
    });
    await queues.calendarSync.add('calendar-sync-import', { syncId: sync.id });
    return reply.code(201).send(sync);
  });

  app.get('/calendar-sync/:propertyId/export', { preHandler: [authenticate] }, async (request) => {
    const propertyId = (request.params as { propertyId: string }).propertyId;
    const bookings = await prisma.booking.findMany({ where: { propertyId, organizationId: request.authUser.organizationId } });
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ATLAS//Calendar//EN'];

    for (const booking of bookings) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${booking.id}@atlas`);
      lines.push(`DTSTART:${booking.checkInDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      lines.push(`DTEND:${booking.checkOutDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      lines.push(`SUMMARY:Booking ${booking.id}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return { iCal: lines.join('\n') };
  });
}
