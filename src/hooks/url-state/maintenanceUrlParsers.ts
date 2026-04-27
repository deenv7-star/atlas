import { parseAsString, parseAsStringLiteral } from 'nuqs';

const REQ_STATUS = ['all', 'NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
const REQ_URGENCY = ['all', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const maintenanceUrlParsers = {
  openMaintenanceId: parseAsString,
  filterStatus: parseAsStringLiteral([...REQ_STATUS]).withDefault('all'),
  filterUrgency: parseAsStringLiteral([...REQ_URGENCY]).withDefault('all'),
};
