/**
 * Admin data layer. Two backends with the same shape:
 *  - Supabase: only the SECURITY DEFINER RPCs from migration 010 (each checks platform_admins).
 *  - Local demo: sample data from demoData.js, mutations persisted in localStorage.
 */
import { supabase } from '@/api/supabaseClient';
import { ADMIN_DEMO, DEMO_ADMIN_EMAILS } from './config';
import { loadDemo, saveDemo } from './demoData';

export class AdminAccessError extends Error {
  constructor(msg = 'אין הרשאה') {
    super(msg);
    this.name = 'AdminAccessError';
  }
}

const HE_ERRORS = [
  [/role .* required|insufficient|42501/i, 'אין לכם הרשאה לפעולה הזו'],
  [/days must be/i, 'אפשר להאריך בין יום ל-90 ימים'],
  [/unknown plan/i, 'החבילה לא קיימת'],
  [/no ATLAS user/i, 'אין משתמש ATLAS עם האימייל הזה. קודם צריך להירשם.'],
  [/last owner/i, 'חייב להישאר לפחות בעלים אחד'],
  [/yourself/i, 'אי אפשר להסיר את עצמכם'],
  [/already settled/i, 'החיוב כבר סומן'],
];
function toHebrew(e) {
  const m = String(e?.message || e || '');
  for (const [re, he] of HE_ERRORS) if (re.test(m) || re.test(String(e?.code || ''))) return he;
  return 'הפעולה לא הצליחה. נסו שוב בעוד רגע.';
}

async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args || {});
  if (error) {
    if (error.code === '42501') throw new AdminAccessError(toHebrew(error));
    const e = new Error(toHebrew(error));
    e.code = error.code;
    throw e;
  }
  return data;
}

/* ── demo backend ───────────────────────────────────────────────────────── */
let demo = null;
const D = () => (demo ||= loadDemo());
const wait = (v) => new Promise((res) => setTimeout(() => res(structuredClone(v)), 120));
const nowIso = () => new Date().toISOString();
let demoActor = 'deenv7@gmail.com';

function demoLog(action, target_type, target_id, org_id, details) {
  const d = D();
  const org = d.customers.find((c) => c.org_id === org_id);
  d.audit.unshift({ id: (d.audit[0]?.id || 0) + 1, actor_email: demoActor, action, target_type, target_id, org_id, org_name: org?.org_name || null, details: details || {}, created_at: nowIso() });
}
function demoCustomer(orgId) {
  const c = D().customers.find((x) => x.org_id === orgId);
  if (!c) throw new Error('הלקוח לא נמצא');
  return c;
}
function commit(v) {
  saveDemo(D());
  return wait(v);
}
function demoUsage(c) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
  });
  const created = c.created_at.slice(0, 7);
  const perMonth = c.bookings_count / Math.max(1, months.filter((m) => m >= created).length);
  return {
    bookings_total: c.bookings_count,
    bookings_30d: c.bookings_30d,
    leads_total: Math.round(c.bookings_count * 0.6),
    messages_total: Math.round(c.bookings_count * 2.4),
    revenue_ils: c.bookings_count * 1350,
    by_month: months.map((m, i) => ({ month: m, bookings: m < created ? 0 : Math.max(0, Math.round(perMonth * (0.7 + ((i * 37) % 10) / 15))) })),
  };
}

const demoApi = {
  async whoami(user) {
    const email = String(user?.email || '').toLowerCase();
    if (!DEMO_ADMIN_EMAILS.includes(email)) return null;
    demoActor = email;
    const t = D().team.find((m) => m.email === email);
    // Demo only: both allow-listed logins act as owner so every screen can be tried.
    return { user_id: t?.user_id || user.id, email, full_name: t?.full_name || user.full_name || '', role: 'owner' };
  },
  listCustomers: () => wait(D().customers),
  async getCustomer(orgId) {
    const c = demoCustomer(orgId);
    const d = D();
    return wait({
      customer: c,
      units: d.units[orgId] || [],
      usage: demoUsage(c),
      recent_bookings: d.bookings[orgId] || [],
      charges: d.charges.filter((x) => x.org_id === orgId),
      notes: d.notes.filter((x) => x.org_id === orgId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
      audit: d.audit.filter((x) => x.org_id === orgId),
    });
  },
  listCharges: () => wait(D().charges),
  listPlans: () => wait(D().plans),
  listTeam: () => wait(D().team),
  listAudit: () => wait(D().audit),
  async health() {
    const d = D();
    return wait({
      db_time: nowIso(),
      db_version: 'הדגמה',
      schema: { guest_pages_008: false, expenses_009: false, platform_admin_010: true },
      counts: { organizations: d.customers.length, users: d.customers.length + d.team.length, bookings: d.customers.reduce((s, c) => s + c.bookings_count, 0), signins_24h: d.customers.filter((c) => Date.now() - new Date(c.last_active_at) < 864e5).length },
      audit_events_24h: d.audit.filter((a) => Date.now() - new Date(a.created_at) < 864e5).length,
      failed_charges_30d: d.charges.filter((x) => x.status === 'failed' && Date.now() - new Date(x.created_at) < 30 * 864e5).length,
    });
  },
  async extendTrial(orgId, days) {
    if (!(days >= 1 && days <= 90)) throw new Error(toHebrew('days must be'));
    const c = demoCustomer(orgId);
    const from = c.trial_ends_at;
    const base = Math.max(Date.now(), new Date(from || Date.now()).getTime());
    c.trial_ends_at = new Date(base + days * 864e5).toISOString();
    if (c.status === 'expired' || c.status === 'trialing') c.status = 'trialing';
    demoLog('trial.extend', 'organization', orgId, orgId, { days, from, to: c.trial_ends_at });
    return commit({ trial_ends_at: c.trial_ends_at });
  },
  async changePlan(orgId, { plan, cycle = 'monthly', price = null, status = null }) {
    const c = demoCustomer(orgId);
    const from = c.plan_key;
    c.plan_key = plan;
    c.billing_cycle = cycle;
    c.price_ils = price;
    if (status === 'active') c.status = c.suspended_at ? 'suspended' : 'active';
    if (status === 'canceled') { c.status = 'churned'; c.canceled_at = nowIso(); }
    if (status === 'trialing') c.status = 'trialing';
    demoLog('plan.change', 'organization', orgId, orgId, { from, to: plan, cycle, price_ils: price, status });
    return commit({ plan_key: plan });
  },
  async setSuspended(orgId, suspended, reason) {
    const c = demoCustomer(orgId);
    c.suspended_at = suspended ? nowIso() : null;
    c.suspended_reason = suspended ? reason || null : null;
    if (suspended) c.status = 'suspended';
    else {
      const ch = D().charges.find((x) => x.org_id === orgId);
      c.status = ch?.status === 'failed' ? 'past_due' : ch ? 'active' : new Date(c.trial_ends_at) > new Date() ? 'trialing' : 'expired';
    }
    demoLog(suspended ? 'account.suspend' : 'account.reactivate', 'organization', orgId, orgId, { reason });
    return commit({ suspended });
  },
  async addNote(orgId, body) {
    demoCustomer(orgId);
    const n = { id: crypto.randomUUID(), org_id: orgId, body: String(body).trim(), author_email: demoActor, created_at: nowIso() };
    D().notes.unshift(n);
    demoLog('note.add', 'organization', orgId, orgId, { note_id: n.id });
    return commit(n);
  },
  async recordCharge(orgId, { amount, status = 'paid', method = 'bank_transfer', description = null }) {
    const c = demoCustomer(orgId);
    const today = new Date().toISOString().slice(0, 10);
    const ch = { id: crypto.randomUUID(), org_id: orgId, org_name: c.org_name, amount_ils: Number(amount), status, method, description, period_start: today, period_end: null, due_date: today, paid_at: status === 'paid' ? nowIso() : null, failure_reason: null, provider: 'manual', created_at: nowIso() };
    D().charges.unshift(ch);
    if (status === 'paid' && ['past_due', 'expired', 'trialing'].includes(c.status) && !c.suspended_at) c.status = 'active';
    demoLog('charge.record', 'charge', ch.id, orgId, { amount_ils: ch.amount_ils, status, method });
    return commit(ch);
  },
  async markChargePaid(chargeId, method = 'bank_transfer') {
    const ch = D().charges.find((x) => x.id === chargeId);
    if (!ch || !['pending', 'failed'].includes(ch.status)) throw new Error(toHebrew('already settled'));
    ch.status = 'paid';
    ch.paid_at = nowIso();
    ch.method = method;
    ch.failure_reason = null;
    const c = D().customers.find((x) => x.org_id === ch.org_id);
    if (c && c.status === 'past_due') c.status = 'active';
    demoLog('charge.mark_paid', 'charge', chargeId, ch.org_id, { method, amount_ils: ch.amount_ils });
    return commit(ch);
  },
  async updatePlan(key, patch) {
    const p = D().plans.find((x) => x.key === key);
    if (!p) throw new Error(toHebrew('unknown plan'));
    const before = { price_monthly: p.price_monthly, price_yearly: p.price_yearly };
    Object.assign(p, patch, { updated_at: nowIso() });
    demoLog('plan.update', 'plan', key, null, { before, after: { price_monthly: p.price_monthly, price_yearly: p.price_yearly } });
    return commit(p);
  },
  async setTeamMember(email, role) {
    const e = String(email).trim().toLowerCase();
    const team = D().team;
    let m = team.find((x) => x.email === e);
    const known = m || D().customers.find((c) => c.owner_email === e);
    if (!known) throw new Error(toHebrew('no ATLAS user'));
    const from = m?.role || null;
    if (from === 'owner' && role !== 'owner' && team.filter((x) => x.role === 'owner').length <= 1) throw new Error(toHebrew('last owner'));
    if (m) m.role = role;
    else {
      m = { user_id: known.owner_id || crypto.randomUUID(), email: e, full_name: known.owner_name || '', role, created_at: nowIso(), last_sign_in_at: known.last_active_at || null };
      team.push(m);
    }
    demoLog(from ? 'team.role' : 'team.add', 'admin', m.user_id, null, { email: e, from, to: role });
    return commit(m);
  },
  async removeTeamMember(userId) {
    const team = D().team;
    const m = team.find((x) => x.user_id === userId);
    if (!m) throw new Error('לא נמצא בצוות');
    if (m.email === demoActor) throw new Error(toHebrew('yourself'));
    if (m.role === 'owner' && team.filter((x) => x.role === 'owner').length <= 1) throw new Error(toHebrew('last owner'));
    D().team = team.filter((x) => x.user_id !== userId);
    demoLog('team.remove', 'admin', userId, null, { email: m.email, role: m.role });
    return commit({ removed: userId });
  },
};

/* ── Supabase backend ───────────────────────────────────────────────────── */
const dbApi = {
  whoami: () => rpc('admin_whoami'),
  listCustomers: () => rpc('admin_list_customers'),
  getCustomer: (orgId) => rpc('admin_get_customer', { p_org: orgId }),
  listCharges: () => rpc('admin_list_charges', { p_limit: 2000 }),
  listPlans: () => rpc('admin_list_plans'),
  listTeam: () => rpc('admin_list_team'),
  listAudit: () => rpc('admin_list_audit', { p_limit: 500 }),
  health: () => rpc('admin_system_health'),
  extendTrial: (orgId, days) => rpc('admin_extend_trial', { p_org: orgId, p_days: days }),
  changePlan: (orgId, { plan, cycle = 'monthly', price = null, status = null }) =>
    rpc('admin_change_plan', { p_org: orgId, p_plan: plan, p_cycle: cycle, p_price_ils: price, p_status: status }),
  setSuspended: (orgId, suspended, reason) => rpc('admin_set_suspended', { p_org: orgId, p_suspended: suspended, p_reason: reason || null }),
  addNote: (orgId, body) => rpc('admin_add_note', { p_org: orgId, p_body: body }),
  recordCharge: (orgId, { amount, status = 'paid', method = 'bank_transfer', description = null }) =>
    rpc('admin_record_charge', { p_org: orgId, p_amount: amount, p_status: status, p_method: method, p_description: description }),
  markChargePaid: (chargeId, method = 'bank_transfer') => rpc('admin_mark_charge_paid', { p_charge: chargeId, p_method: method }),
  updatePlan: (key, p) =>
    rpc('admin_update_plan', {
      p_key: key, p_price_monthly: p.price_monthly, p_price_yearly: p.price_yearly, p_max_properties: p.max_properties,
      p_description: p.description, p_features: p.features, p_is_popular: p.is_popular, p_is_active: p.is_active,
    }),
  setTeamMember: (email, role) => rpc('admin_set_team_member', { p_email: email, p_role: role }),
  removeTeamMember: (userId) => rpc('admin_remove_team_member', { p_user: userId }),
};

export const adminApi = ADMIN_DEMO ? demoApi : dbApi;
