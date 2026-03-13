/**
 * /api/leads — Lead service
 */

import { base44 } from '@/api/base44Client';

const entity = () => base44.entities.Lead;

export async function fetchLeads(filters = {}) {
  return entity().list(filters);
}

export async function filterLeads(filters = {}, sort = '-created_at', limit = null) {
  return entity().filter(filters, sort, limit);
}

export async function getLead(id) {
  return entity().get(id);
}

export async function createLead(data) {
  return entity().create(data);
}

export async function updateLead(id, data) {
  return entity().update(id, data);
}

export async function deleteLead(id) {
  return entity().delete(id);
}
