/**
 * Generic CRUD routes for all entities.
 *
 * Every route is org-scoped — the org_id is injected from the JWT so users
 * can never access another organisation's data.
 *
 * Routes (all prefixed with /api/:entity):
 *   GET    /             list / filter  (?field=value&_sort=-created_at&_limit=50)
 *   GET    /:id          get one
 *   POST   /             create
 *   PUT    /:id          update
 *   DELETE /:id          delete
 */

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router({ mergeParams: true });

// ─── Entity → table name ──────────────────────────────────────────────────────
const TABLE_MAP = {
  bookings:                 'bookings',
  booking:                  'bookings',
  leads:                    'leads',
  lead:                     'leads',
  payments:                 'payments',
  payment:                  'payments',
  properties:               'properties',
  property:                 'properties',
  units:                    'units',
  unit:                     'units',
  subscriptions:            'subscriptions',
  subscription:             'subscriptions',
  cleaningtask:             'cleaning_tasks',
  cleaningtasks:            'cleaning_tasks',
  invoices:                 'invoices',
  invoice:                  'invoices',
  guestrequests:            'guest_requests',
  guestrequest:             'guest_requests',
  contracttemplates:        'contract_templates',
  contracttemplate:         'contract_templates',
  contractinstances:        'contract_instances',
  contractinstance:         'contract_instances',
  messagelogs:              'message_logs',
  messagelog:               'message_logs',
  reviewrequests:           'review_requests',
  reviewrequest:            'review_requests',
  automationrules:          'automation_rules',
  automationrule:           'automation_rules',
  automation:               'automation_rules',
  automations:              'automation_rules',
  calendarsync:             'calendar_syncs',
  calendarsyncs:            'calendar_syncs',
  messaginintegration:      'messaging_integrations',
  messagingintegrations:    'messaging_integrations',
  accountingintegration:    'accounting_integrations',
  accountingintegrations:   'accounting_integrations',
  pmsintegration:           'pms_integrations',
  pmsintegrations:          'pms_integrations',
  paymentgateway:           'payment_gateways',
  paymentgateways:          'payment_gateways',
  organization:             'organizations',
  organizations:            'organizations',
};

// Tables that do NOT have an org_id column (scoped via owner_id instead)
const ORG_SCOPED_BY_OWNER = new Set(['organizations']);

function resolveTable(entity) {
  const key = entity.toLowerCase().replace(/[-_]/g, '');
  return TABLE_MAP[key] || null;
}

// ─── Allowed filter columns (whitelist to prevent SQL injection) ──────────────
const SAFE_COL = /^[a-z_][a-z0-9_]{0,63}$/;
const RESERVED = new Set(['_sort', '_limit', '_offset', '_select']);

function isSafeColumn(col) {
  return SAFE_COL.test(col) && !RESERVED.has(col);
}

// ─── All routes require auth ──────────────────────────────────────────────────
router.use(requireAuth);

// ─── Resolve table ────────────────────────────────────────────────────────────
router.param('entity', (req, res, next, entity) => {
  const table = resolveTable(entity);
  if (!table) return res.status(404).json({ error: `Unknown entity: ${entity}` });
  req.tableName = table;
  next();
});

// ─── LIST / FILTER ────────────────────────────────────────────────────────────
router.get('/:entity', async (req, res) => {
  try {
    const { tableName } = req;
    const { _sort = '-created_at', _limit, _offset, _select, ...filters } = req.query;

    const values  = [];
    const clauses = [];

    // Org scope
    if (ORG_SCOPED_BY_OWNER.has(tableName)) {
      values.push(req.orgId);
      clauses.push(`id = $${values.length}`);
    } else {
      values.push(req.orgId);
      clauses.push(`org_id = $${values.length}`);
    }

    // Additional filters
    for (const [col, val] of Object.entries(filters)) {
      if (!isSafeColumn(col) || val === '' || val === undefined) continue;
      values.push(val);
      clauses.push(`${col} = $${values.length}`);
    }

    const where = clauses.join(' AND ');

    // Sort
    let orderBy = 'created_at DESC';
    if (_sort) {
      const desc  = _sort.startsWith('-');
      const col   = desc ? _sort.slice(1) : _sort;
      const mapped = col === 'created_date' ? 'created_at'
                   : col === 'updated_date' ? 'updated_at'
                   : col;
      if (isSafeColumn(mapped)) orderBy = `${mapped} ${desc ? 'DESC' : 'ASC'}`;
    }

    let sql = `SELECT * FROM public.${tableName} WHERE ${where} ORDER BY ${orderBy}`;
    if (_limit)  { values.push(parseInt(_limit, 10));  sql += ` LIMIT $${values.length}`; }
    if (_offset) { values.push(parseInt(_offset, 10)); sql += ` OFFSET $${values.length}`; }

    const { rows } = await pool.query(sql, values);
    res.json(rows.map(addAliases));
  } catch (err) {
    console.error(`[GET /${req.tableName}]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET ONE ──────────────────────────────────────────────────────────────────
router.get('/:entity/:id', async (req, res) => {
  try {
    const { tableName } = req;
    const orgClause = ORG_SCOPED_BY_OWNER.has(tableName)
      ? 'id = $2'
      : 'org_id = $2';

    const { rows } = await pool.query(
      `SELECT * FROM public.${tableName} WHERE id = $1 AND ${orgClause}`,
      [req.params.id, req.orgId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(addAliases(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
router.post('/:entity', async (req, res) => {
  try {
    const { tableName } = req;
    const payload = sanitize(req.body);

    // Auto-inject org_id
    if (!ORG_SCOPED_BY_OWNER.has(tableName)) {
      payload.org_id = req.orgId;
    }

    const cols   = Object.keys(payload);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(payload);

    const { rows } = await pool.query(
      `INSERT INTO public.${tableName} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(addAliases(rows[0]));
  } catch (err) {
    console.error(`[POST /${req.tableName}]`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
router.put('/:entity/:id', async (req, res) => {
  try {
    const { tableName } = req;
    const payload = sanitize(req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    const orgClause = ORG_SCOPED_BY_OWNER.has(tableName) ? 'id = $' : 'org_id = $';
    const sets   = Object.keys(payload).map((col, i) => `${col} = $${i + 1}`).join(', ');
    const values = [...Object.values(payload), req.params.id, req.orgId];

    const { rows } = await pool.query(
      `UPDATE public.${tableName}
       SET ${sets}
       WHERE id = $${values.length - 1} AND ${orgClause}${values.length}
       RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(addAliases(rows[0]));
  } catch (err) {
    console.error(`[PUT /${req.tableName}/${req.params.id}]`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:entity/:id', async (req, res) => {
  try {
    const { tableName } = req;
    const orgClause = ORG_SCOPED_BY_OWNER.has(tableName)
      ? 'id = $2'
      : 'org_id = $2';

    const { rowCount } = await pool.query(
      `DELETE FROM public.${tableName} WHERE id = $1 AND ${orgClause}`,
      [req.params.id, req.orgId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Remove system / read-only fields the client should not set directly */
const STRIP = new Set(['id', 'created_at', 'updated_at', 'created_date', 'updated_date', 'org_id']);

function sanitize(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([k, v]) => !STRIP.has(k) && v !== undefined && v !== null && isSafeColumn(k))
  );
}

/** Add created_date / updated_date aliases so the UI code keeps working */
function addAliases(row) {
  return {
    ...row,
    created_date: row.created_date || row.created_at,
    updated_date: row.updated_date || row.updated_at,
  };
}

export default router;
