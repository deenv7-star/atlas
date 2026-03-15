import { randomUUID } from 'node:crypto';
import { logger } from '../utils/logger.js';

export function requestContext(req, res, next) {
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  const start = Date.now();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    logger.info('request.completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      userId: req.userId || null,
      orgId: req.orgId || null,
      ip: req.ip
    });
  });

  next();
}
