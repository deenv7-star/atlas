/**
 * /api/properties — Property service
 */

import { base44 } from '@/api/base44Client';

const entity = () => base44.entities.Property;

export async function fetchProperties(filters = {}) {
  return entity().list(filters);
}

export async function getProperty(id) {
  return entity().get(id);
}

export async function createProperty(data) {
  return entity().create(data);
}

export async function updateProperty(id, data) {
  return entity().update(id, data);
}

export async function deleteProperty(id) {
  return entity().delete(id);
}
