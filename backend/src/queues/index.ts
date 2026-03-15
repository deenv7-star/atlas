import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

const connection = redis.duplicate();

export const queues = {
  messageSending: new Queue('message-sending', { connection }),
  automationExecution: new Queue('automation-execution', { connection }),
  invoiceGeneration: new Queue('invoice-generation', { connection }),
  calendarSync: new Queue('calendar-sync', { connection }),
  reviewRequests: new Queue('review-requests', { connection })
};
