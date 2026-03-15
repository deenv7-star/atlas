import { env } from '../config/env.js';
import { logger } from './logger.js';

export async function captureException(error, context = {}) {
  if (!env.SENTRY_DSN) {
    return;
  }

  logger.error('sentry.capture', { error, ...context, dsnConfigured: true });
}
