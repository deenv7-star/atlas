import { prisma } from '../config/prisma.js';

type AuditInput = {
  organizationId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(input: AuditInput) {
  return prisma.auditLog.create({ data: input });
}
