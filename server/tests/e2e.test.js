import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { pool } from '../db.js';
import { env } from '../config/env.js';
import { up as migrationUp, down as migrationDown } from '../migrations/api-rate-limits.js';

function createMockDb() {
  const db = {
    orgs: [],
    users: [],
    refreshTokens: [],
    leads: [],
    bookings: [],
    payments: [],
    messageLogs: []
  };

  let id = 1;
  const uid = () => `00000000-0000-0000-0000-${String(id++).padStart(12, '0')}`;

  const client = {
    async query(sql, params = []) {
      return query(sql, params);
    },
    release() {}
  };

  function query(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q === 'BEGIN' || q === 'COMMIT' || q === 'ROLLBACK') return { rows: [], rowCount: 0 };
    if (q.includes('CREATE TABLE IF NOT EXISTS public.api_rate_limits')) return { rows: [], rowCount: 0 };

    if (q.includes('INSERT INTO public.api_rate_limits (key_hash, window_start, count, updated_at)')) {
      return { rows: [{ count: 1, window_start: params[1] }], rowCount: 1 };
    }
    if (q.includes('DROP TABLE IF EXISTS public.api_rate_limits')) return { rows: [], rowCount: 0 };
    if (q === 'SELECT 1') return { rows: [{ '?column?': 1 }], rowCount: 1 };

    if (q.includes('SELECT id FROM public.users WHERE email = $1')) {
      const rows = db.users.filter((u) => u.email === params[0]).map((u) => ({ id: u.id }));
      return { rows, rowCount: rows.length };
    }

    if (q.includes('INSERT INTO public.organizations (name) VALUES ($1) RETURNING id')) {
      const org = { id: uid(), name: params[0], owner_id: null };
      db.orgs.push(org);
      return { rows: [{ id: org.id }], rowCount: 1 };
    }

    if (q.includes('INSERT INTO public.users (email, password_hash, full_name, organization_id)')) {
      const user = { id: uid(), email: params[0], password_hash: params[1], full_name: params[2], organization_id: params[3], phone: '', profile_image: '' };
      db.users.push(user);
      return { rows: [{ id: user.id }], rowCount: 1 };
    }

    if (q.includes('UPDATE public.organizations SET owner_id = $1 WHERE id = $2')) {
      const org = db.orgs.find((o) => o.id === params[1]);
      if (org) org.owner_id = params[0];
      return { rows: [], rowCount: org ? 1 : 0 };
    }

    if (q.includes('SELECT id, password_hash, organization_id FROM public.users WHERE email = $1')) {
      const user = db.users.find((u) => u.email === params[0]);
      return { rows: user ? [{ id: user.id, password_hash: user.password_hash, organization_id: user.organization_id }] : [], rowCount: user ? 1 : 0 };
    }

    if (q.includes('INSERT INTO public.refresh_tokens (user_id, token, expires_at)')) {
      db.refreshTokens.push({ user_id: params[0], token: params[1], expires_at: params[2] });
      return { rows: [], rowCount: 1 };
    }

    if (q.includes('DELETE FROM public.refresh_tokens WHERE token = $1 AND expires_at > NOW() RETURNING user_id')) {
      const idx = db.refreshTokens.findIndex((t) => t.token === params[0]);
      if (idx === -1) return { rows: [], rowCount: 0 };
      const [removed] = db.refreshTokens.splice(idx, 1);
      return { rows: [{ user_id: removed.user_id }], rowCount: 1 };
    }

    if (q.includes('DELETE FROM public.refresh_tokens WHERE token = $1')) {
      const before = db.refreshTokens.length;
      db.refreshTokens = db.refreshTokens.filter((t) => t.token !== params[0]);
      return { rows: [], rowCount: before - db.refreshTokens.length };
    }

    if (q.includes('SELECT u.id, u.email, u.full_name, u.phone, u.profile_image,')) {
      const user = db.users.find((u) => u.id === params[0]);
      if (!user) return { rows: [], rowCount: 0 };
      const org = db.orgs.find((o) => o.id === user.organization_id);
      return {
        rows: [{
          ...user,
          org_id: org?.id || null,
          owner_id: org?.owner_id || null,
          organization_name: org?.name || null,
          subscription_plan: 'starter'
        }],
        rowCount: 1
      };
    }

    if (q.includes('INSERT INTO public.leads')) {
      const lead = { id: uid(), org_id: params[0], property_id: params[1], full_name: params[2], email: params[3], phone: params[4], status: params[5], check_in_date: params[6], check_out_date: params[7], budget: params[8] };
      db.leads.push(lead);
      return { rows: [lead], rowCount: 1 };
    }

    if (q.includes('UPDATE public.leads SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING *')) {
      const lead = db.leads.find((l) => l.id === params[1] && l.org_id === params[2]);
      if (!lead) return { rows: [], rowCount: 0 };
      lead.status = params[0];
      return { rows: [lead], rowCount: 1 };
    }

    if (q.includes('SELECT * FROM public.leads WHERE id = $1 AND org_id = $2')) {
      const lead = db.leads.find((l) => l.id === params[0] && l.org_id === params[1]);
      return { rows: lead ? [lead] : [], rowCount: lead ? 1 : 0 };
    }

    if (q.includes('INSERT INTO public.bookings (org_id, property_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, total_price, status, source)')) {
      const booking = { id: uid(), org_id: params[0], property_id: params[1], guest_name: params[2], guest_email: params[3], guest_phone: params[4], check_in_date: params[5], check_out_date: params[6], total_price: params[7], status: 'PENDING', source: 'lead_conversion' };
      db.bookings.push(booking);
      return { rows: [booking], rowCount: 1 };
    }

    if (q.includes("UPDATE public.leads SET status = 'WON' WHERE id = $1")) {
      const lead = db.leads.find((l) => l.id === params[0]);
      if (lead) lead.status = 'WON';
      return { rows: [], rowCount: lead ? 1 : 0 };
    }

    if (q.includes('INSERT INTO public.bookings (org_id, property_id, guest_name, guest_email, check_in_date, check_out_date, total_price, status)')) {
      const booking = { id: uid(), org_id: params[0], property_id: params[1], guest_name: params[2], guest_email: params[3], check_in_date: params[4], check_out_date: params[5], total_price: params[6], status: params[7] };
      db.bookings.push(booking);
      return { rows: [booking], rowCount: 1 };
    }

    if (q.includes('UPDATE public.bookings SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING *')) {
      const booking = db.bookings.find((b) => b.id === params[1] && b.org_id === params[2]);
      if (!booking) return { rows: [], rowCount: 0 };
      booking.status = params[0];
      return { rows: [booking], rowCount: 1 };
    }

    if (q.includes('INSERT INTO public.payments (org_id, booking_id, amount, payment_type, status)')) {
      const payment = { id: uid(), org_id: params[0], booking_id: params[1], amount: params[2], payment_type: params[3], status: params[4] };
      db.payments.push(payment);
      return { rows: [payment], rowCount: 1 };
    }

    if (q.includes('SELECT id, status FROM public.bookings WHERE id = $1 AND org_id = $2')) {
      const booking = db.bookings.find((b) => b.id === params[0] && b.org_id === params[1]);
      return { rows: booking ? [{ id: booking.id, status: booking.status }] : [], rowCount: booking ? 1 : 0 };
    }

    if (q.includes('INSERT INTO public.message_logs')) {
      db.messageLogs.push({ id: uid(), org_id: params[0], status: 'queued' });
      return { rows: [], rowCount: 1 };
    }

    if (q.includes('SELECT * FROM public.leads WHERE org_id = $1')) {
      return { rows: db.leads.filter((l) => l.org_id === params[0]), rowCount: 1 };
    }
    if (q.includes('SELECT * FROM public.bookings WHERE org_id = $1')) {
      return { rows: db.bookings.filter((b) => b.org_id === params[0]), rowCount: 1 };
    }
    if (q.includes('SELECT * FROM public.payments WHERE org_id = $1')) {
      return { rows: db.payments.filter((p) => p.org_id === params[0]), rowCount: 1 };
    }
    if (q.includes('SELECT id, email, full_name, phone, profile_image FROM public.users WHERE id = $1 AND organization_id = $2')) {
      const u = db.users.find((u) => u.id === params[0] && u.organization_id === params[1]);
      return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
    }
    if (q.includes('SELECT * FROM public.organizations WHERE id = $1')) {
      const o = db.orgs.find((o) => o.id === params[0]);
      return { rows: o ? [o] : [], rowCount: o ? 1 : 0 };
    }

    if (q.includes('DELETE FROM public.refresh_tokens WHERE user_id = $1')) {
      db.refreshTokens = db.refreshTokens.filter((t) => t.user_id !== params[0]);
      return { rows: [], rowCount: 1 };
    }
    if (q.includes('DELETE FROM public.users WHERE id = $1 AND organization_id = $2')) {
      const before = db.users.length;
      db.users = db.users.filter((u) => !(u.id === params[0] && u.organization_id === params[1]));
      return { rows: [], rowCount: before - db.users.length };
    }
    if (q.includes('DELETE FROM public.message_logs')) return { rows: [], rowCount: 0 };

    throw new Error(`Unhandled SQL in test mock: ${q}`);
  }

  return {
    db,
    query,
    async connect() { return client; }
  };
}

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  return { base, server };
}

async function req(base, path, { method = 'GET', token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data };
}

test('auth lifecycle: register, login, refresh, logout, expiration', async () => {
  const mock = createMockDb();
  pool.query = mock.query;
  pool.connect = mock.connect;

  const { base, server } = await startServer();
  try {
    const signup = await req(base, '/api/auth/signup', { method: 'POST', body: { email: 'a@a.com', password: 'Password123!' } });
    assert.equal(signup.status, 201);
    assert.ok(signup.data.access_token);
    assert.ok(signup.data.refresh_token);

    const signin = await req(base, '/api/auth/signin', { method: 'POST', body: { email: 'a@a.com', password: 'Password123!' } });
    assert.equal(signin.status, 200);

    const refresh = await req(base, '/api/auth/refresh', { method: 'POST', body: { refresh_token: signin.data.refresh_token } });
    assert.equal(refresh.status, 200);
    assert.ok(refresh.data.refresh_token);

    const signout = await req(base, '/api/auth/signout', { method: 'POST', token: signin.data.access_token, body: { refresh_token: refresh.data.refresh_token } });
    assert.equal(signout.status, 200);

    const expiredToken = jwt.sign({ userId: 'x' }, env.JWT_SECRET, { expiresIn: -1 });
    const me = await req(base, '/api/auth/me', { token: expiredToken });
    assert.equal(me.status, 401);
  } finally {
    server.close();
  }
});

test('tenant isolation and lead lifecycle + booking conversion', async () => {
  const mock = createMockDb();
  pool.query = mock.query;
  pool.connect = mock.connect;
  const { base, server } = await startServer();

  try {
    const u1 = await req(base, '/api/auth/signup', { method: 'POST', body: { email: 'u1@a.com', password: 'Password123!' } });
    const u2 = await req(base, '/api/auth/signup', { method: 'POST', body: { email: 'u2@a.com', password: 'Password123!' } });

    const lead = await req(base, '/api/leads', {
      method: 'POST',
      token: u1.data.access_token,
      body: { full_name: 'Lead One', status: 'NEW', check_in_date: '2026-01-01', check_out_date: '2026-01-03', quoted_price: 1000 }
    });
    assert.equal(lead.status, 201);

    const forbiddenUpdate = await req(base, `/api/leads/${lead.data.id}/status`, {
      method: 'PATCH',
      token: u2.data.access_token,
      body: { status: 'CONTACTED' }
    });
    assert.equal(forbiddenUpdate.status, 404);

    const update = await req(base, `/api/leads/${lead.data.id}/status`, {
      method: 'PATCH',
      token: u1.data.access_token,
      body: { status: 'CONTACTED' }
    });
    assert.equal(update.status, 200);

    const converted = await req(base, `/api/leads/${lead.data.id}/convert`, {
      method: 'POST',
      token: u1.data.access_token
    });
    assert.equal(converted.status, 201);
    assert.equal(converted.data.status, 'PENDING');
  } finally {
    server.close();
  }
});

test('booking lifecycle, payments and automation trigger', async () => {
  const mock = createMockDb();
  pool.query = mock.query;
  pool.connect = mock.connect;
  const { base, server } = await startServer();

  try {
    const u = await req(base, '/api/auth/signup', { method: 'POST', body: { email: 'book@a.com', password: 'Password123!' } });
    const token = u.data.access_token;

    const booking = await req(base, '/api/bookings', {
      method: 'POST',
      token,
      body: { guest_name: 'Guest', check_in_date: '2026-01-01', check_out_date: '2026-01-05', total_price: 2000, status: 'PENDING' }
    });
    assert.equal(booking.status, 201);

    const confirmed = await req(base, `/api/bookings/${booking.data.id}/status`, {
      method: 'PATCH',
      token,
      body: { status: 'CONFIRMED' }
    });
    assert.equal(confirmed.status, 200);

    const cancelled = await req(base, `/api/bookings/${booking.data.id}/status`, {
      method: 'PATCH',
      token,
      body: { status: 'CANCELLED' }
    });
    assert.equal(cancelled.status, 200);

    const deposit = await req(base, '/api/payments', {
      method: 'POST',
      token,
      body: { booking_id: booking.data.id, amount: 600, payment_type: 'deposit', status: 'pending' }
    });
    assert.equal(deposit.status, 201);

    const balance = await req(base, '/api/payments', {
      method: 'POST',
      token,
      body: { booking_id: booking.data.id, amount: 1400, payment_type: 'balance', status: 'paid' }
    });
    assert.equal(balance.status, 201);

    await req(base, `/api/bookings/${booking.data.id}/status`, {
      method: 'PATCH',
      token,
      body: { status: 'CONFIRMED' }
    });

    const trigger = await req(base, '/api/automations/booking-confirmed', {
      method: 'POST',
      token,
      body: { booking_id: booking.data.id }
    });

    assert.equal(trigger.status, 200);
    assert.equal(trigger.data.triggered, true);
  } finally {
    server.close();
  }
});

test('migration up/down safety', async () => {
  const calls = [];
  const client = { query: async (sql) => { calls.push(sql); return { rows: [] }; } };

  await migrationUp(client);
  await migrationDown(client);

  assert.equal(calls.length, 2);
  assert.match(calls[0], /CREATE TABLE IF NOT EXISTS public\.api_rate_limits/);
  assert.match(calls[1], /DROP TABLE IF EXISTS public\.api_rate_limits/);
});
