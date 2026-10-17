import { useMemo, useState, useEffect } from 'react';
import { useActions, useAdmin } from './hooks';
import { AUDIT_ACTIONS, METHODS, ROLES, STATUS } from './config';
import { money, date } from './ui';
import { relTime } from './metrics';

/* ── customer list filtering ───────────────────────────────────────────── */
export function useCustomerFilters(customers = [], initialStatus = null) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(initialStatus && STATUS[initialStatus] ? initialStatus : 'all');
  const [plan, setPlan] = useState('all');
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' });
  const counts = useMemo(() => {
    const c = { all: customers.length };
    for (const x of customers) c[x.status] = (c[x.status] || 0) + 1;
    return c;
  }, [customers]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    const out = customers.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (plan !== 'all' && c.plan_key !== plan) return false;
      if (!term) return true;
      const hay = `${c.org_name} ${c.owner_name || ''} ${c.owner_email || ''}`.toLowerCase();
      return hay.includes(term) || (digits.length >= 3 && String(c.owner_phone || '').replace(/\D/g, '').includes(digits));
    });
    const k = sort.key;
    const dir = sort.dir === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      const va = a[k] ?? '';
      const vb = b[k] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'he') * dir;
    });
    return out;
  }, [customers, q, status, plan, sort]);
  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  return { q, setQ, status, setStatus, plan, setPlan, sort, toggleSort, rows, counts };
}

export const customerCsv = (plans) => [
  { label: 'עסק', value: 'org_name' },
  { label: 'בעלים', value: 'owner_name' },
  { label: 'אימייל', value: 'owner_email' },
  { label: 'טלפון', value: 'owner_phone' },
  { label: 'חבילה', value: (c) => plans.find((p) => p.key === c.plan_key)?.name || c.plan_key },
  { label: 'מחזור', value: (c) => (c.billing_cycle === 'yearly' ? 'שנתי' : 'חודשי') },
  { label: 'סטטוס', value: (c) => STATUS[c.status]?.label || c.status },
  { label: 'יחידות', value: 'units_count' },
  { label: 'הזמנות', value: 'bookings_count' },
  { label: 'נרשם', value: (c) => c.created_at?.slice(0, 10) },
  { label: 'סוף ניסיון', value: (c) => c.trial_ends_at?.slice(0, 10) },
  { label: 'פעילות אחרונה', value: (c) => c.last_active_at?.slice(0, 10) },
];
export const chargeCsv = [
  { label: 'תאריך', value: (x) => (x.paid_at || x.created_at)?.slice(0, 10) },
  { label: 'לקוח', value: 'org_name' },
  { label: 'תיאור', value: 'description' },
  { label: 'תקופה', value: (x) => [x.period_start, x.period_end].filter(Boolean).join(' – ') },
  { label: 'סכום (₪)', value: 'amount_ils' },
  { label: 'אמצעי', value: (x) => METHODS[x.method] || x.method },
  { label: 'מצב', value: 'status' },
  { label: 'מספר חשבונית', value: 'invoice_number' },
  { label: 'סיבת כישלון', value: 'failure_reason' },
];
export const auditCsv = [
  { label: 'זמן', value: 'created_at' },
  { label: 'מי', value: 'actor_email' },
  { label: 'פעולה', value: (a) => AUDIT_ACTIONS[a.action] || a.action },
  { label: 'לקוח', value: 'org_name' },
  { label: 'פרטים', value: (a) => auditDetail(a) },
];

export function auditDetail(a) {
  const d = a.details || {};
  switch (a.action) {
    case 'trial.extend': return `+${d.days} ימים${d.to ? `, עד ${date(d.to)}` : ''}`;
    case 'plan.change': return `${d.from || '—'} ← ${d.to}${d.cycle === 'yearly' ? ' · שנתי' : ''}${d.price_ils ? ` · ${money(d.price_ils)}` : ''}`;
    case 'account.suspend': return d.reason ? `סיבה: ${d.reason}` : '';
    case 'charge.record': return `${money(d.amount_ils)} · ${d.status === 'paid' ? 'שולם' : d.status === 'failed' ? 'נכשל' : 'ממתין'}`;
    case 'charge.mark_paid': return `${money(d.amount_ils)} · ${METHODS[d.method] || d.method || ''}`;
    case 'plan.update': return `${a.target_id}: ${money(d.before?.price_monthly)} ← ${money(d.after?.price_monthly)}`;
    case 'team.add': case 'team.role': return `${d.email} · ${ROLES[d.to]?.label || d.to}`;
    case 'team.remove': return d.email || '';
    default: return '';
  }
}

/* ── notes ─────────────────────────────────────────────────────────────── */
export function NotesBox({ orgId, notes = [], className = '' }) {
  const { addNote } = useActions();
  const [body, setBody] = useState('');
  return (
    <div className={`adm-notes ${className}`}>
      <form
        className="adm-notes-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          addNote.mutate({ orgId, body }, { onSuccess: () => setBody('') });
        }}
      >
        <label className="adm-sr" htmlFor={`note-${orgId}`}>הערה חדשה</label>
        <textarea id={`note-${orgId}`} className="adm-textarea" rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="הערה פנימית, רק הצוות רואה" maxLength={4000} />
        <button type="submit" className="adm-btn adm-btn--sm" disabled={!body.trim() || addNote.isPending}>הוספת הערה</button>
      </form>
      {notes.length ? (
        <ul className="adm-notes-list">
          {notes.map((n) => (
            <li key={n.id}>
              <p>{n.body}</p>
              <span>{n.author_email?.split('@')[0]} · {relTime(n.created_at)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="adm-muted">אין הערות עדיין.</p>}
    </div>
  );
}

/* ── plan editor (one plan) ────────────────────────────────────────────── */
export function usePlanForm(plan) {
  const [f, setF] = useState(null);
  useEffect(() => {
    if (plan) setF({
      price_monthly: String(plan.price_monthly ?? ''),
      price_yearly: String(plan.price_yearly ?? ''),
      max_properties: plan.max_properties == null ? '' : String(plan.max_properties),
      description: plan.description || '',
      features: (plan.features || []).join('\n'),
      is_popular: Boolean(plan.is_popular),
      is_active: plan.is_active !== false,
    });
  }, [plan]);
  const dirty = Boolean(f && plan && (
    f.price_monthly !== String(plan.price_monthly) || f.price_yearly !== String(plan.price_yearly)
    || f.max_properties !== (plan.max_properties == null ? '' : String(plan.max_properties))
    || f.description !== (plan.description || '') || f.features !== (plan.features || []).join('\n')
    || f.is_popular !== Boolean(plan.is_popular) || f.is_active !== (plan.is_active !== false)
  ));
  const patch = f && {
    price_monthly: Number(f.price_monthly) || 0,
    price_yearly: Number(f.price_yearly) || 0,
    max_properties: f.max_properties === '' ? null : Number(f.max_properties),
    description: f.description.trim(),
    features: f.features.split('\n').map((s) => s.trim()).filter(Boolean),
    is_popular: f.is_popular,
    is_active: f.is_active,
  };
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : (['price_monthly', 'price_yearly', 'max_properties'].includes(k) ? e.target.value.replace(/\D/g, '') : e.target.value) }));
  return { f, set, dirty, patch, reset: () => setF(null) };
}

/* ── team add form ─────────────────────────────────────────────────────── */
export function TeamAddForm({ className = '' }) {
  const { setTeamMember } = useActions();
  const { can } = useAdmin();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('support');
  const disabled = !can('owner');
  return (
    <form
      className={`adm-team-add ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setTeamMember.mutate({ email, role }, { onSuccess: () => setEmail('') });
      }}
    >
      <label className="adm-field adm-team-email">
        <span>אימייל של משתמש ATLAS קיים</span>
        <input className="adm-input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" disabled={disabled} />
      </label>
      <label className="adm-field">
        <span>הרשאה</span>
        <select className="adm-select" value={role} onChange={(e) => setRole(e.target.value)} disabled={disabled}>
          {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
        </select>
      </label>
      <button type="submit" className="adm-btn adm-btn--primary" disabled={disabled || !email.trim() || setTeamMember.isPending}>הוספה לצוות</button>
    </form>
  );
}

export function RoleSelect({ member, meEmail }) {
  const { setTeamMember } = useActions();
  const { can } = useAdmin();
  const self = member.email === meEmail;
  return (
    <select
      className="adm-select adm-role-select"
      aria-label={`הרשאה של ${member.full_name || member.email}`}
      value={member.role}
      disabled={!can('owner') || self || setTeamMember.isPending}
      onChange={(e) => setTeamMember.mutate({ email: member.email, role: e.target.value })}
    >
      {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
    </select>
  );
}

/** Supabase status page + build info, rendered as rows by each version. */
export function healthRows(h, build) {
  const sha = build?.sha ? String(build.sha).slice(0, 7) : null;
  return [
    { key: 'db', label: 'מסד נתונים', ok: Boolean(h?.db_time), value: h?.db_time ? <>תקין · <span className="adm-ltr">{h.latency_ms} ms</span></> : 'לא זמין', meta: h?.db_version ? `Postgres ${h.db_version}` : '' },
    { key: 'deploy', label: 'פריסה אחרונה', ok: true, value: sha ? <span className="adm-ltr">{sha}{build.branch ? ` · ${build.branch}` : ''}</span> : 'גרסה מקומית', meta: build?.time ? `נבנתה ${date(build.time, { weekday: true })} · ${new Date(build.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}` : '', note: build?.message || '' },
    { key: 'schema', label: 'מיגרציות', ok: true, value: [h?.schema?.guest_pages_008 ? '008 ✓' : '008 לא הוחלה', h?.schema?.expenses_009 ? '009 ✓' : '009 לא הוחלה', '010 ✓'].join(' · '), meta: '' },
    { key: 'errors', label: 'שגיאות באפליקציה', ok: null, value: 'עוד לא מחובר', meta: 'מומלץ לחבר Sentry כדי לראות כאן שגיאות של לקוחות' },
    { key: 'charges', label: 'חיובים שנכשלו (30 יום)', ok: !(h?.failed_charges_30d > 0), value: String(h?.failed_charges_30d ?? '—'), meta: '' },
  ];
}
