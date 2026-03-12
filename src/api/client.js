/**
 * ATLAS API Client — Supabase-backed (with localStorage fallback)
 *
 * When VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set this module uses
 * Supabase for all data operations and auth.  Otherwise it falls back to the
 * original localStorage behaviour so development works without a database.
 *
 * The public interface is identical to the old client:
 *   client.entities.Booking.list()
 *   client.entities.Booking.filter({ org_id })
 *   client.entities.Booking.get(id)
 *   client.entities.Booking.create(data)
 *   client.entities.Booking.update(id, data)
 *   client.entities.Booking.delete(id)
 *   client.auth.me()
 *   client.auth.logout()
 *   client.auth.signUp({ email, password, full_name, organization_name })
 *   client.auth.signIn({ email, password })
 *   client.auth.updateMe(data)
 *   client.integrations.Core.InvokeLLM(...)
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

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

    return {
      id:                user.id,
      email:             user.email,
      full_name:         profile?.full_name || user.user_metadata?.full_name || '',
      phone:             profile?.phone || '',
      profile_image:     profile?.profile_image || '',
      organization_id:   profile?.organization_id || null,
      organization_name: profile?.organizations?.name || '',
      subscription_plan: profile?.organizations?.subscription_plan || 'starter',
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
    const path = returnUrl ? `/Login?return=${encodeURIComponent(returnUrl)}` : '/Login';
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
    const u = {
      id: `user_${Date.now()}`,
      email,
      full_name,
      organization_id: `org_${Date.now()}`,
      organization_name: organization_name || 'My Organization',
      subscription_plan: 'starter',
      created_date: new Date().toISOString(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return { user: u };
  },
  async signIn({ email }) {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u.email === email) return { user: u };
    }
    const u = { id: `user_${Date.now()}`, email, full_name: '', organization_id: `org_${Date.now()}`, subscription_plan: 'starter' };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return { user: u };
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
    window.location.href = returnUrl ? `/Login?return=${encodeURIComponent(returnUrl)}` : '/Login';
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
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return (
          'תכונת ה-AI אינה מוגדרת.\n' +
          'הוסף `VITE_OPENAI_API_KEY=<your-key>` לקובץ `.env` כדי להפעיל אותה.'
        );
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
      console.info('[SendEmail stub]', { to, subject, body });
      await new Promise(r => setTimeout(r, 300));
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
// createClient — picks the right backend
// =============================================================================

export function createClient(_options = {}) {
  if (isSupabaseConfigured) {
    return {
      entities:     supabaseEntitiesProxy,
      auth:         supabaseAuth,
      integrations,
      appLogs,
    };
  }

  // Fallback to localStorage when Supabase is not configured
  return {
    entities:     localEntitiesProxy,
    auth:         localAuth,
    integrations,
    appLogs,
  };
}

export default { createClient };
