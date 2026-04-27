/**
 * Generic CRUD routes for all entities.
 *
 * Every route is tenant-scoped using req.orgId from validated auth context.
 */

import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth, requireRole, ROLE } from '../auth.js';
import { logger } from '../utils/logger.js';

const router = Router({ mergeParams: true });

const TABLE_MAP = {
  bookings: 'bookings',
  booking: 'bookings',
  leads: 'leads',
  lead: 'leads',
  payments: 'payments',
  payment: 'payments',
  properties: 'properties',
  property: 'properties',
  units: 'units',
  unit: 'units',
  subscriptions: 'subscriptions',
  subscription: 'subscriptions',
  cleaningtask: 'cleaning_tasks',
  cleaningtasks: 'cleaning_tasks',
  invoices: 'invoices',
  invoice: 'invoices',
  guestrequests: 'guest_requests',
  guestrequest: 'guest_requests',
  contracttemplates: 'contract_templates',
  contracttemplate: 'contract_templates',
  contractinstances: 'contract_instances',
  contractinstance: 'contract_instances',
  messagelogs: 'message_logs',
  messagelog: 'message_logs',
  messages: 'messages',
  message: 'messages',
  reviewrequests: 'review_requests',
  reviewrequest: 'review_requests',
  automationrules: 'automation_rules',
  automationrule: 'automation_rules',
  automation: 'automation_rules',
  automations: 'automation_rules',
  calendarsync: 'calendar_syncs',
  calendarsyncs: 'calendar_syncs',
  messagingintegration: 'messaging_integrations',
  messagingintegrations: 'messaging_integrations',
  accountingintegration: 'accounting_integrations',
  accountingintegrations: 'accounting_integrations',
  pmsintegration: 'pms_integrations',
  pmsintegrations: 'pms_integrations',
  paymentgateway: 'payment_gateways',
  paymentgateways: 'payment_gateways',
  organization: 'organizations',
  organizations: 'organizations',
  users: 'users',
  user: 'users'
};

const ORG_SCOPED_BY_OWNER = new Set(['organizations']);
const TABLES_READONLY_FOR_MANAGER = new Set(['organizations', 'users', 'subscriptions']);

const SAFE_COL = /^[a-z_][a-z0-9_]{0,63}$/;
const RESERVED = new Set(['_sort', '_limit', '_offset', '_select']);
const LIMIT_SCHEMA = z.coerce.number().int().min(1).max(500);
const OFFSET_SCHEMA = z.coerce.number().int().min(0).max(1_000_000);

function resolveTable(entity) {
  const key = entity.toLowerCase().replace(/[-_]/g, '');
  return TABLE_MAP[key] || null;
}

function isSafeColumn(col) {
  return SAFE_COL.test(col) && !RESERVED.has(col);
}

function sanitize(body) {
  const STRIP = new Set(['id', 'created_at', 'updated_at', 'created_date', 'updated_date', 'org_id', 'organization_id', 'owner_id']);
  return Object.fromEntries(
    Object.entries(body).filter(([k, v]) => !STRIP.has(k) && v !== undefined && v !== null && isSafeColumn(k))
  );
}

function addAliases(row) {
  return {
    ...row,
    created_date: row.created_date || row.created_at,
    updated_date: row.updated_date || row.updated_at
  };
}

function ensureWritePermissions(req, res, next) {
  if (req.role === ROLE.ADMIN) return next();
  if (TABLES_READONLY_FOR_MANAGER.has(req.tableName)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  return next();
}

router.use(requireAuth);
router.use(requireRole([ROLE.ADMIN, ROLE.MANAGER]));

router.param('entity', (req, res, next, entity) => {
  const table = resolveTable(entity);
  if (!table) return res.status(404).json({ error: `Unknown entity: ${entity}` });
  req.tableName = table;
  return next();
});

router.get('/:entity', async (req, res) => {
  try {
    const { tableName } = req;
    const { _sort = '-created_at', _limit, _offset, _select, ...filters } = req.query;

    const values = [];
    const clauses = [];

    if (ORG_SCOPED_BY_OWNER.has(tableName)) {
      values.push(req.orgId);
      clauses.push(`id = $${values.length}`);
    } else if (tableName === 'users') {
      values.push(req.orgId);
      clauses.push(`organization_id = $${values.length}`);
    } else {
      values.push(req.orgId);
      clauses.push(`org_id = $${values.length}`);
    }

    for (const [col, val] of Object.entries(filters)) {
      if (!isSafeColumn(col) || val === '' || val === undefined) continue;
      values.push(val);
      clauses.push(`${col} = $${values.length}`);
    }

    let orderBy = 'created_at DESC';
    if (_sort) {
      const sortValue = String(_sort);
      const desc = sortValue.startsWith('-');
      const col = desc ? sortValue.slice(1) : sortValue;
      const mapped = col === 'created_date' ? 'created_at' : col === 'updated_date' ? 'updated_at' : col;
      if (isSafeColumn(mapped)) orderBy = `${mapped} ${desc ? 'DESC' : 'ASC'}`;
    }

    const selectClause = _select
      ? String(_select).split(',').map((value) => value.trim()).filter(isSafeColumn).join(', ')
      : '*';

    const safeSelect = selectClause.length > 0 ? selectClause : '*';

    let sql = `SELECT ${safeSelect} FROM public.${tableName} WHERE ${clauses.join(' AND ')} ORDER BY ${orderBy}`;

    if (_limit !== undefined) {
      const limit = LIMIT_SCHEMA.parse(_limit);
      values.push(limit);
      sql += ` LIMIT $${values.length}`;
    }

    if (_offset !== undefined) {
      const offset = OFFSET_SCHEMA.parse(_offset);
      values.push(offset);
      sql += ` OFFSET $${values.length}`;
    }

    const { rows } = await pool.query(sql, values);
    return res.json(rows.map(addAliases));
  } catch (error) {
    logger.error('entities.list.failed', { error, requestId: req.requestId, tableName: req.tableName });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:entity/:id', async (req, res) => {
  try {
    const { tableName } = req;

    let orgClause = 'org_id = $2';
    if (ORG_SCOPED_BY_OWNER.has(tableName)) orgClause = 'id = $2';
    if (tableName === 'users') orgClause = 'organization_id = $2';

    const { rows } = await pool.query(
      `SELECT * FROM public.${tableName} WHERE id = $1 AND ${orgClause}`,
      [req.params.id, req.orgId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json(addAliases(rows[0]));
  } catch (error) {
    logger.error('entities.get.failed', { error, requestId: req.requestId, tableName: req.tableName, entityId: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:entity', ensureWritePermissions, async (req, res) => {
  try {
    const { tableName } = req;
    const payload = sanitize(req.body);

    if (!ORG_SCOPED_BY_OWNER.has(tableName)) {
      if (tableName === 'users') {
        payload.organization_id = req.orgId;
      } else {
        payload.org_id = req.orgId;
      }
    }

    const cols = Object.keys(payload);
    if (cols.length === 0) {
      return res.status(400).json({ error: 'No writable fields provided' });
    }

    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(payload);

    const { rows } = await pool.query(
      `INSERT INTO public.${tableName} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return res.status(201).json(addAliases(rows[0]));
  } catch (error) {
    logger.error('entities.create.failed', { error, requestId: req.requestId, tableName: req.tableName });
    return res.status(400).json({ error: 'Invalid payload' });
  }
});

router.put('/:entity/:id', ensureWritePermissions, async (req, res) => {
  try {
    const { tableName } = req;
    const payload = sanitize(req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    const sets = Object.keys(payload).map((col, i) => `${col} = $${i + 1}`).join(', ');
    const values = [...Object.values(payload), req.params.id, req.orgId];

    let orgClause = 'org_id = $';
    if (ORG_SCOPED_BY_OWNER.has(tableName)) orgClause = 'id = $';
    if (tableName === 'users') orgClause = 'organization_id = $';

    const { rows } = await pool.query(
      `UPDATE public.${tableName}
       SET ${sets}
       WHERE id = $${values.length - 1} AND ${orgClause}${values.length}
       RETURNING *`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json(addAliases(rows[0]));
  } catch (error) {
    logger.error('entities.update.failed', { error, requestId: req.requestId, tableName: req.tableName, entityId: req.params.id });
    return res.status(400).json({ error: 'Invalid payload' });
  }
});

router.delete('/:entity/:id', ensureWritePermissions, async (req, res) => {
  try {
    const { tableName } = req;

    let orgClause = 'org_id = $2';
    if (ORG_SCOPED_BY_OWNER.has(tableName)) orgClause = 'id = $2';
    if (tableName === 'users') orgClause = 'organization_id = $2';

    const { rowCount } = await pool.query(
      `DELETE FROM public.${tableName} WHERE id = $1 AND ${orgClause}`,
      [req.params.id, req.orgId]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (error) {
    logger.error('entities.delete.failed', { error, requestId: req.requestId, tableName: req.tableName, entityId: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
