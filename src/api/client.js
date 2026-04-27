/**
 * ATLAS API Client — three-tier backend with automatic selection
 *
 * Priority order:
 *   1. Supabase cloud  (when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set)
 *   2. Local REST API  (when VITE_API_URL is set OR the local Express server
 *                       responds at http://localhost:3001 in dev mode)
 *   3. localStorage    (zero-config fallback for pure frontend demos)
 *
 * The public interface is identical in all three modes:
 *   client.entities.Booking.list()
 *   client.entities.Booking.filter({ property_id })
 *   client.entities.Booking.get(id)
 *   client.entities.Booking.create(data)
 *   client.entities.Booking.update(id, data)
 *   client.entities.Booking.delete(id)
 *   client.auth.me()
 *   client.auth.signUp({ email, password, full_name, organization_name })
 *   client.auth.signIn({ email, password })
 *   client.auth.logout()
 *   client.auth.updateMe(data)
 */

import { supabase, isSupabaseConfigured, LOCAL_API_URL } from './supabaseClient';

// =============================================================================
// Local REST API client (talks to server/index.js)
// =============================================================================

const TOKEN_KEY = 'atlas_jwt_token';

function getStoredToken() { return localStorage.getItem(TOKEN_KEY) || null; }
function setStoredToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }

async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const base = LOCAL_API_URL || '';
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

class RestEntityCollection {
  constructor(name) { this._name = name; }

  _qs(filters = {}) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') p.set(k, v);
    }
    return p.toString() ? '?' + p.toString() : '';
  }

  async list(filters = {}) {
    return apiFetch(`/api/entities/${this._name}${this._qs(filters)}`);
  }

  async filter(filters = {}, sort = '-created_at', limit = null) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    }
    if (sort)  qs.set('_sort',  sort);
    if (limit) qs.set('_limit', limit);
    return apiFetch(`/api/entities/${this._name}?${qs.toString()}`);
  }

  async get(id) {
    return apiFetch(`/api/entities/${this._name}/${id}`);
  }

  async create(data) {
    return apiFetch(`/api/entities/${this._name}`, { method: 'POST', body: JSON.stringify(data) });
  }

  async update(id, data) {
    return apiFetch(`/api/entities/${this._name}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async delete(id) {
    return apiFetch(`/api/entities/${this._name}/${id}`, { method: 'DELETE' });
  }
}

const restEntitiesProxy = new Proxy({}, {
  get(_, name) { return new RestEntityCollection(String(name)); },
});

const restAuth = {
  async me() {
    if (!getStoredToken()) { const e = new Error('Not authenticated'); e.status = 401; throw e; }
    return apiFetch('/api/auth/me');
  },

  async signUp({ email, password, full_name = '', organization_name = '' }) {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, organization_name }),
    });
    setStoredToken(data.access_token);
    return data;
  },

  async signIn({ email, password }) {
    const data = await apiFetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.access_token);
    return data;
  },

  async logout() {
    try { await apiFetch('/api/auth/signout', { method: 'POST' }); } catch {}
    setStoredToken(null);
    return { success: true };
  },

  async updateMe(profileData) {
    return apiFetch('/api/auth/me', { method: 'PUT', body: JSON.stringify(profileData) });
  },

  async deleteAccount() {
    setStoredToken(null);
    return { success: true };
  },

  redirectToLogin(returnUrl) {
    window.location.href = returnUrl
      ? `/login?return=${encodeURIComponent(returnUrl)}`
      : '/login';
  },

  setUser() {},
  hasUser() { return Boolean(getStoredToken()); },
  onAuthStateChange() { return () => {}; },
};

// ─── Probe local server on startup ───────────────────────────────────────────
let _localApiAvailable = null;
async function checkLocalApi() {
  if (_localApiAvailable !== null) return _localApiAvailable;
  try {
    const healthUrl = LOCAL_API_URL ? `${LOCAL_API_URL}/api/health` : '/api/health';
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) {
      _localApiAvailable = false;
      return false;
    }
    // Static hosts often return 200 + index.html for every path; res.ok alone would
    // wrongly enable REST and then POST /api/auth/* returns 404.
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      _localApiAvailable = false;
      return false;
    }
    const body = await res.json().catch(() => ({}));
    _localApiAvailable = body?.status === 'ok';
  } catch {
    _localApiAvailable = false;
  }
  return _localApiAvailable;
}

/** Same-origin or explicit API base — used so prod + /api proxy still hits the server. */
async function isBackendApiReachable() {
  if (import.meta.env.VITE_API_URL) return true;
  if (LOCAL_API_URL) return true;
  return checkLocalApi();
}

function apiRootPrefix() {
  return (import.meta.env.VITE_API_URL || LOCAL_API_URL || '').replace(/\/$/, '');
}

// =============================================================================
// Entity → table name mapping
// =============================================================================

const TABLE_MAP = {
  Booking:                'bookings',
  Lead:                   'leads',
  Payment:                'payments',
  Property:               'properties',
  Unit:                   'units',
  Subscription:           'subscriptions',
  CleaningTask:           'cleaning_tasks',
  Invoice:                'invoices',
  GuestRequest:           'guest_requests',
  ContractTemplate:       'contract_templates',
  ContractInstance:       'contract_instances',
  MessageLog:             'message_logs',
  ReviewRequest:          'review_requests',
  AutomationRule:         'automation_rules',
  Automation:             'automation_rules',       // alias
  CalendarSync:           'calendar_syncs',
  MessagingIntegration:   'messaging_integrations',
  AccountingIntegration:  'accounting_integrations',
  PMSIntegration:         'pms_integrations',
  PaymentGateway:         'payment_gateways',
  Organization:           'organizations',
  Message:                'messages',
  User:                   'users',
};

function resolveTable(entityName) {
  return TABLE_MAP[entityName] || entityName.toLowerCase() + 's';
}

// =============================================================================
// Supabase EntityCollection
// =============================================================================

class SupabaseEntityCollection {
  constructor(name) {
    this._name  = name;
    this._table = resolveTable(name);
  }

  async list(filters = {}) {
    let q = supabase.from(this._table).select('*');
    q = this._applyFilters(q, filters);
    const { data, error } = await q;
    if (error) throw this._wrapError(error);
    return this._normaliseRows(data || []);
  }

  async filter(filters = {}, sortField = '-created_at', limit = null) {
    let q = supabase.from(this._table).select('*');
    q = this._applyFilters(q, filters);
    q = this._applySort(q, sortField);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw this._wrapError(error);
    return this._normaliseRows(data || []);
  }

  async get(id) {
    const { data, error } = await supabase
      .from(this._table)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw this._wrapError(error, id);
    return this._normaliseRow(data);
  }

  async create(payload) {
    // Strip generated / read-only columns the UI might pass through
    const clean = this._cleanPayload(payload);
    const { data, error } = await supabase
      .from(this._table)
      .insert(clean)
      .select()
      .single();
    if (error) throw this._wrapError(error);
    return this._normaliseRow(data);
  }

  async update(id, payload) {
    const clean = this._cleanPayload(payload);
    const { data, error } = await supabase
      .from(this._table)
      .update(clean)
      .eq('id', id)
      .select()
      .single();
    if (error) throw this._wrapError(error, id);
    return this._normaliseRow(data);
  }

  async delete(id) {
    const { error } = await supabase
      .from(this._table)
      .delete()
      .eq('id', id);
    if (error) throw this._wrapError(error, id);
    return { success: true };
  }

  // ── private helpers ────────────────────────────────────────────────────────

  _applyFilters(query, filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      query = query.eq(key, value);
    }
    return query;
  }

  _applySort(query, sortField) {
    if (!sortField) return query;
    const desc  = sortField.startsWith('-');
    const field = desc ? sortField.slice(1) : sortField;
    // Map legacy field names to real column names
    const col = field === 'created_date' ? 'created_at'
              : field === 'updated_date' ? 'updated_at'
              : field;
    return query.order(col, { ascending: !desc });
  }

  _cleanPayload(data) {
    // Remove generated columns and undefined values
    const GENERATED = new Set(['created_date', 'updated_date', 'created_at', 'updated_at', 'id']);
    return Object.fromEntries(
      Object.entries(data).filter(([k, v]) => !GENERATED.has(k) && v !== undefined)
    );
  }

  /**
   * Add convenience aliases so UI code using `item.created_date` continues to
   * work even though Supabase stores the value as `created_at`.
   */
  _normaliseRow(row) {
    if (!row) return row;
    return {
      ...row,
      created_date: row.created_date || row.created_at,
      updated_date: row.updated_date || row.updated_at,
    };
  }

  _normaliseRows(rows) {
    return rows.map(r => this._normaliseRow(r));
  }

  _wrapError(error, id) {
    const msg = error?.message || String(error);
    const err = new Error(msg);
    err.status = error?.code === 'PGRST116' ? 404 : 500;
    if (id) err.resourceId = id;
    return err;
  }
}

// =============================================================================
// Supabase Auth
// =============================================================================

const supabaseAuth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }

    // Fetch profile (has full_name, organization_id, etc.)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single();

    let onboarding_completed = Boolean(profile?.onboarding_completed);
    const orgId = profile?.organization_id || null;

    // טריגר handle_new_user נותן organization_id כבר בהרשמה, אז דגל false לבד לא אומר "חדש".
    // אם כבר יש נכסים/הזמנות/לידים בארגון — נחשב אונבורדינג כהושלם לניתוב (ותיקים שלא סומנו ב-DB).
    if (!onboarding_completed && orgId) {
      try {
        const [pRes, bRes, lRes] = await Promise.all([
          supabase.from('properties').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
          supabase.from('leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        ]);
        const hasActivity =
          (pRes.count || 0) > 0 || (bRes.count || 0) > 0 || (lRes.count || 0) > 0;
        if (hasActivity) {
          onboarding_completed = true;
          supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('id', user.id)
            .then(({ error: upErr }) => {
              if (upErr) console.warn('[auth.me] persist onboarding_completed:', upErr.message);
            });
        }
      } catch {
        /* keep DB flag */
      }
    }

    return {
      id:                   user.id,
      email:                user.email,
      full_name:            profile?.full_name || user.user_metadata?.full_name || '',
      phone:                profile?.phone || '',
      profile_image:        profile?.profile_image || '',
      organization_id:      orgId,
      organization_name:    profile?.organizations?.name || '',
      subscription_plan:    profile?.organizations?.subscription_plan || 'starter',
      onboarding_completed,
      onboarding_step:      Math.max(1, parseInt(profile?.onboarding_step, 10) || 1),
      selected_plan:        profile?.selected_plan || 'trial',
      trial_ends_at:        profile?.trial_ends_at || null,
      subscription_status:  profile?.subscription_status || 'trialing',
      is_platform_admin:    Boolean(profile?.is_platform_admin),
    };
  },

  async signUp({ email, password, full_name = '', organization_name = '' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, organization_name },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  async logout() {
    await supabase.auth.signOut();
    return { success: true };
  },

  async updateMe(profileData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:     profileData.full_name,
        phone:         profileData.phone,
        profile_image: profileData.profile_image,
      })
      .eq('id', user.id);

    if (error) throw new Error(error.message);
    return this.me();
  },

  async deleteAccount() {
    // Supabase does not expose a client-side delete-user API.
    // This should be implemented as a server-side edge function.
    throw new Error('Account deletion requires a server-side function.');
  },

  redirectToLogin(returnUrl) {
    const path = returnUrl ? `/login?return=${encodeURIComponent(returnUrl)}` : '/login';
    window.location.href = path;
  },

  // Legacy stubs used by the old Login page — kept for compatibility
  setUser() {},
  hasUser() {
    return false; // Supabase manages its own session
  },

  /**
   * Subscribe to auth state changes.
   * Returns an unsubscribe function.
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  },
};

// =============================================================================
// Supabase entities proxy
// =============================================================================

const supabaseEntitiesProxy = new Proxy({}, {
  get(_, name) {
    return new SupabaseEntityCollection(String(name));
  },
});

// =============================================================================
// localStorage fallback (original implementation — unchanged)
// =============================================================================

const STORAGE_PREFIX = 'atlas_entity_';
const USER_KEY       = 'atlas_current_user';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readCollection(name) {
  try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + name) || '[]'); }
  catch { return []; }
}

function writeCollection(name, items) {
  localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(items));
}

function applySortAndLimit(items, sortField, limit) {
  if (sortField) {
    const desc  = sortField.startsWith('-');
    const field = desc ? sortField.slice(1) : sortField;
    items = [...items].sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }
  if (limit) items = items.slice(0, limit);
  return items;
}

class LocalEntityCollection {
  constructor(name) { this._name = name; }

  async list(filters = {}) {
    return this._filter(readCollection(this._name), filters);
  }

  async filter(filters = {}, sortField = '-created_date', limit = null) {
    return applySortAndLimit(this._filter(readCollection(this._name), filters), sortField, limit);
  }

  async get(id) {
    const item = readCollection(this._name).find(i => i.id === id);
    if (!item) throw Object.assign(new Error(`${this._name} ${id} not found`), { status: 404 });
    return item;
  }

  async create(data) {
    const items = readCollection(this._name);
    const now = new Date().toISOString();
    const newItem = { id: generateId(), created_date: now, updated_date: now, ...data };
    items.push(newItem);
    writeCollection(this._name, items);
    return newItem;
  }

  async update(id, data) {
    const items = readCollection(this._name);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw Object.assign(new Error(`${this._name} ${id} not found`), { status: 404 });
    items[idx] = { ...items[idx], ...data, updated_date: new Date().toISOString() };
    writeCollection(this._name, items);
    return items[idx];
  }

  async delete(id) {
    writeCollection(this._name, readCollection(this._name).filter(i => i.id !== id));
    return { success: true };
  }

  _filter(items, filters) {
    if (!filters || !Object.keys(filters).length) return items;
    return items.filter(item =>
      Object.entries(filters).every(([k, v]) => v == null || item[k] === v)
    );
  }
}

const localEntitiesProxy = new Proxy({}, {
  get(_, name) { return new LocalEntityCollection(String(name)); },
});

const localAuth = {
  async me() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) { const e = new Error('Not authenticated'); e.status = 401; throw e; }
    try { return JSON.parse(raw); }
    catch { const e = new Error('Not authenticated'); e.status = 401; throw e; }
  },
  async signUp({ email, password: _p, full_name = '', organization_name = '' }) {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        const existing = JSON.parse(raw);
        if (existing.email && String(existing.email).toLowerCase() === String(email).toLowerCase()) {
          throw new Error('User already registered');
        }
      } catch (e) {
        if (e.message === 'User already registered') throw e;
      }
    }
    const u = {
      id: `user_${Date.now()}`,
      email,
      full_name,
      organization_id: `org_${Date.now()}`,
      organization_name: organization_name || 'My Organization',
      subscription_plan: 'starter',
      onboarding_completed: false,
      is_platform_admin: false,
      created_date: new Date().toISOString(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return { user: u, session: {} };
  },
  async signIn({ email }) {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u.email === email) return { user: u, session: {} };
    }
    const u = {
      id: `user_${Date.now()}`,
      email,
      full_name: '',
      organization_id: `org_${Date.now()}`,
      organization_name: '',
      subscription_plan: 'starter',
      onboarding_completed: false,
      is_platform_admin: false,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return { user: u, session: {} };
  },
  async logout() { localStorage.removeItem(USER_KEY); return { success: true }; },
  async updateMe(data) {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) throw new Error('Not authenticated');
    const u = { ...JSON.parse(raw), ...data };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return u;
  },
  async deleteAccount() { localStorage.removeItem(USER_KEY); },
  redirectToLogin(returnUrl) {
    window.location.href = returnUrl ? `/login?return=${encodeURIComponent(returnUrl)}` : '/login';
  },
  setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); },
  hasUser() { return Boolean(localStorage.getItem(USER_KEY)); },
  onAuthStateChange() { return () => {}; },
};

// =============================================================================
// Integrations (shared — Supabase or localStorage)
// =============================================================================

const integrations = {
  Core: {
    async InvokeLLM({ prompt, model = 'gpt-4o-mini' } = {}) {
      const token = getStoredToken();
      const root = apiRootPrefix();
      const aiUrl = root ? `${root}/api/ai/chat` : '/api/ai/chat';
      const canTryServer =
        token &&
        !isSupabaseConfigured &&
        (await isBackendApiReachable());
      if (canTryServer) {
        try {
          const res = await fetch(aiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ prompt, model }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.text) return data.text;
        } catch {
          /* fall through to browser key or message */
        }
      }
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return 'הגדר OPENAI_API_KEY בשרת (מומלץ) או VITE_OPENAI_API_KEY לפיתוח מקומי.';
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 1024 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
      }
      return (await res.json()).choices?.[0]?.message?.content ?? '';
    },

    async SendEmail({ to, subject, body } = {}) {
      const token = getStoredToken();
      const root = apiRootPrefix();
      const emailUrl = root ? `${root}/api/email/send` : '/api/email/send';
      const canTryServer =
        token &&
        !isSupabaseConfigured &&
        (await isBackendApiReachable());
      if (canTryServer) {
        try {
          const res = await fetch(emailUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ to, subject, text: body || '' }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) return { success: true, id: data.id };
        } catch {
          /* fall through */
        }
      }
      console.info('[SendEmail stub]', { to, subject, body });
      await new Promise((r) => setTimeout(r, 300));
      return { success: true };
    },

    async UploadFile({ file } = {}) {
      if (isSupabaseConfigured) {
        // Upload to Supabase Storage
        const ext      = file.name?.split('.').pop() || 'bin';
        const path     = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage.from('atlas-files').upload(path, file);
        if (error) throw new Error(error.message);
        const { data: { publicUrl } } = supabase.storage.from('atlas-files').getPublicUrl(data.path);
        return { file_url: publicUrl, file_id: data.path };
      }
      // localStorage fallback
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('No file provided'));
        const reader = new FileReader();
        reader.onload = () => {
          const id = generateId();
          localStorage.setItem(`atlas_file_${id}`, reader.result);
          resolve({ file_url: `local://file/${id}`, file_id: id });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },

    async ExtractDataFromUploadedFile({ file_url } = {}) {
      console.info('[ExtractDataFromUploadedFile stub]', { file_url });
      await new Promise(r => setTimeout(r, 300));
      return { status: 'success', output: {} };
    },
  },
};

const appLogs = {
  async logUserInApp() { return { success: true }; },
};

// =============================================================================
// createClient — picks the right backend (Supabase → Local REST → localStorage)
// =============================================================================

// We probe the local server once and cache the result.  The first call to
// createClient() starts the probe in the background; subsequent calls use the
// cached result.  If the server isn't running we fall through to localStorage.
let _restClientCache = null;

export function createClient(_options = {}) {
  // 1. Supabase cloud (highest priority)
  if (isSupabaseConfigured) {
    return {
      entities:     supabaseEntitiesProxy,
      auth:         supabaseAuth,
      integrations,
      appLogs,
    };
  }

  // 2. Local REST API — return a client that dynamically delegates based on
  //    server availability.  The first entity/auth call will probe the server.
  const allowHybridRest =
    !import.meta.env.PROD ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_ALLOW_LOCAL_DEMO === 'true' ||
    import.meta.env.VITE_DISABLE_RELATIVE_API !== 'true';

  if (allowHybridRest) {
    if (_restClientCache) return _restClientCache;

    // Build a transparent proxy that routes to REST when available, else localStorage
    const makeRestOrLocal = (restColl, localColl) => {
      return new Proxy({}, {
        get(_, method) {
          return async (...args) => {
            const useRest = await checkLocalApi();
            return useRest
              ? restColl[method](...args)
              : localColl[method](...args);
          };
        },
      });
    };

    const hybridAuth = {
      async me()                       { return (await checkLocalApi()) ? restAuth.me()                       : localAuth.me(); },
      async signUp(p)                  { return (await checkLocalApi()) ? restAuth.signUp(p)                  : localAuth.signUp(p); },
      async signIn(p)                  { return (await checkLocalApi()) ? restAuth.signIn(p)                  : localAuth.signIn(p); },
      async logout()                   { return (await checkLocalApi()) ? restAuth.logout()                   : localAuth.logout(); },
      async updateMe(d)                { return (await checkLocalApi()) ? restAuth.updateMe(d)                : localAuth.updateMe(d); },
      async deleteAccount()            { return (await checkLocalApi()) ? restAuth.deleteAccount()            : localAuth.deleteAccount(); },
      redirectToLogin(u)               { return restAuth.redirectToLogin(u); },
      setUser(u)                       { localAuth.setUser(u); },
      hasUser()                        { return restAuth.hasUser() || localAuth.hasUser(); },
      onAuthStateChange(cb)            { return localAuth.onAuthStateChange(cb); },
    };

    const hybridEntities = new Proxy({}, {
      get(_, name) {
        const restColl  = restEntitiesProxy[name];
        const localColl = localEntitiesProxy[name];
        return makeRestOrLocal(restColl, localColl);
      },
    });

    _restClientCache = { entities: hybridEntities, auth: hybridAuth, integrations, appLogs };
    return _restClientCache;
  }

  // 3. Pure localStorage fallback
  return {
    entities:     localEntitiesProxy,
    auth:         localAuth,
    integrations,
    appLogs,
  };
}

export default { createClient };
