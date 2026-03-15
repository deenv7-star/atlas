import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { prisma } from '../config/prisma.js';

const connection = redis.duplicate();

new Worker(
  'message-sending',
  async (job) => {
    if (job.name === 'template-created') {
      await prisma.messageLog.create({
        data: {
          templateId: job.data.templateId,
          recipient: 'queued@atlas.local',
          channel: 'EMAIL',
          status: 'QUEUED'
        }
      });
    }
  },
  { connection }
);

new Worker(
  'automation-execution',
  async (job) => {
    if (job.name === 'automation-created') {
      const automation = await prisma.automationRule.findUnique({ where: { id: job.data.automationId } });
      console.log('Automation rule loaded', automation?.name);
    }
  },
  { connection }
);

new Worker(
  'invoice-generation',
  async (job) => {
    if (job.name === 'generate-pdf') {
      await prisma.invoice.update({ where: { id: job.data.invoiceId }, data: { pdfUrl: `s3://atlas/invoices/${job.data.invoiceId}.pdf` } });
    }
  },
  { connection }
);

new Worker('calendar-sync', async () => console.log('Calendar sync processed'), { connection });
new Worker('review-requests', async () => console.log('Review request processed'), { connection });

console.log('ATLAS workers running...');
