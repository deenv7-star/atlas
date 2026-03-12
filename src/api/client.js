/**
 * Standalone API client — drop-in replacement for @base44/sdk.
 *
 * Data is persisted in localStorage.  Each entity collection lives under
 * the key `atlas_entity_<EntityName>`.
 *
 * Auth is handled via localStorage as well:
 *   - `atlas_current_user`  – JSON-serialised user object (or null)
 *
 * Integrations:
 *   - InvokeLLM  → OpenAI chat-completions if VITE_OPENAI_API_KEY is set
 *   - SendEmail  → console-log stub (configure a real backend if needed)
 *   - UploadFile / ExtractDataFromUploadedFile → client-side stubs
 */

// ─── helpers ────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'atlas_entity_';
const USER_KEY       = 'atlas_current_user';

function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function readCollection(name) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + name) || '[]');
  } catch {
    return [];
  }
}

function writeCollection(name, items) {
  localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(items));
}

function applySortAndLimit(items, sortField, limit) {
  if (sortField) {
    const desc = sortField.startsWith('-');
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

// ─── EntityCollection ────────────────────────────────────────────────────────

class EntityCollection {
  constructor(name) {
    this._name = name;
  }

  async list(filters = {}) {
    const items = readCollection(this._name);
    return this._filter(items, filters);
  }

  async filter(filters = {}, sortField = '-created_date', limit = null) {
    const items = readCollection(this._name);
    const filtered = this._filter(items, filters);
    return applySortAndLimit(filtered, sortField, limit);
  }

  async get(id) {
    const items = readCollection(this._name);
    const item = items.find(i => i.id === id);
    if (!item) throw Object.assign(new Error(`${this._name} ${id} not found`), { status: 404 });
    return item;
  }

  async create(data) {
    const items = readCollection(this._name);
    const now = new Date().toISOString();
    const newItem = {
      id: generateId(),
      created_date: now,
      updated_date: now,
      ...data,
    };
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
    const items = readCollection(this._name);
    const filtered = items.filter(i => i.id !== id);
    writeCollection(this._name, filtered);
    return { success: true };
  }

  _filter(items, filters) {
    if (!filters || Object.keys(filters).length === 0) return items;
    return items.filter(item =>
      Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return item[key] === value;
      })
    );
  }
}

// ─── EntitiesProxy ───────────────────────────────────────────────────────────
// Returns an EntityCollection for any property access: entities.Booking → EntityCollection('Booking')

const entitiesProxy = new Proxy({}, {
  get(_, name) {
    return new EntityCollection(String(name));
  }
});

// ─── Auth ────────────────────────────────────────────────────────────────────

const auth = {
  async me() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    try {
      return JSON.parse(raw);
    } catch {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
  },

  async logout() {
    localStorage.removeItem(USER_KEY);
    return { success: true };
  },

  redirectToLogin(returnUrl) {
    const path = returnUrl ? `/Login?return=${encodeURIComponent(returnUrl)}` : '/Login';
    window.location.href = path;
  },

  // Store a user object (called by the Login page)
  setUser(userObj) {
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
  },

  // Check if a user is currently stored
  hasUser() {
    return Boolean(localStorage.getItem(USER_KEY));
  },
};

// ─── Integrations ─────────────────────────────────────────────────────────────

const integrations = {
  Core: {
    /**
     * InvokeLLM — calls OpenAI if VITE_OPENAI_API_KEY is set, otherwise
     * returns a placeholder message.
     */
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    },

    /**
     * SendEmail — stub implementation.
     * To wire up real email sending, replace this with a call to your
     * backend endpoint (e.g. POST /api/send-email).
     */
    async SendEmail({ to, subject, body } = {}) {
      console.info('[SendEmail stub]', { to, subject, body });
      // Simulate network delay
      await new Promise(r => setTimeout(r, 300));
      return { success: true };
    },

    /**
     * UploadFile — stores the file as a data-URL in localStorage and
     * returns a synthetic file_url.
     */
    async UploadFile({ file } = {}) {
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('No file provided'));
        const reader = new FileReader();
        reader.onload = () => {
          const fileId = generateId();
          const fileUrl = `local://file/${fileId}`;
          // Store the data URL so ExtractDataFromUploadedFile can read it
          localStorage.setItem(`atlas_file_${fileId}`, reader.result);
          resolve({ file_url: fileUrl, file_id: fileId });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },

    /**
     * ExtractDataFromUploadedFile — stub; returns an empty success response.
     * Wire up a real OCR/extraction backend here if needed.
     */
    async ExtractDataFromUploadedFile({ file_url, json_schema } = {}) {
      console.info('[ExtractDataFromUploadedFile stub]', { file_url });
      await new Promise(r => setTimeout(r, 300));
      return { status: 'success', output: {} };
    },
  },
};

// ─── AppLogs ──────────────────────────────────────────────────────────────────

const appLogs = {
  async logUserInApp(pageName) {
    // no-op in standalone mode
    return { success: true };
  },
};

// ─── createClient ─────────────────────────────────────────────────────────────

export function createClient(_options = {}) {
  return {
    entities: entitiesProxy,
    auth,
    integrations,
    appLogs,
  };
}

export default { createClient };
