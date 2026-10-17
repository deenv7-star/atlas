import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, Search, CheckCircle2, XCircle, CircleDashed, Trash2, ExternalLink, Database, Rocket, Layers, Bug, Wallet, Cloud } from 'lucide-react';
import { Head } from './Shell';
import { BError } from './pagesCustomers';
import { useCharges, useCustomers, usePlans, useTeam, useAudit, useHealth, useAdmin, useActions } from '../hooks';
import { ChargePill, Pill, Skel, money, date } from '../ui';
import { METHODS, ROLES, AUDIT_ACTIONS, BUILD_INFO, DEFAULT_PLANS } from '../config';
import { relTime } from '../metrics';
import { chargeCsv, auditCsv, auditDetail, usePlanForm, TeamAddForm, RoleSelect, healthRows } from '../shared';
import { downloadCsv } from '../csv';
import { RecordChargeDialog, MarkPaidDialog } from '../dialogs';

const initials = (s) => String(s || '').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((x) => x[0]).join('').slice(0, 2);

/* ── Payments ──────────────────────────────────────────────────────────── */
const FILTERS = [
  { k: 'all', label: 'כל החיובים' },
  { k: 'paid', label: 'שולמו' },
  { k: 'pending', label: 'ממתינים' },
  { k: 'failed', label: 'נכשלו' },
];
export function Payments() {
  const { data, isLoading, error } = useCharges();
  const customers = useCustomers();
  const { can } = useAdmin();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [rec, setRec] = useState(false);
  const [pay, setPay] = useState(null);
  const [limit, setLimit] = useState(40);
  const all = data || [];
  const month = new Date().toISOString().slice(0, 7);
  const sum = useMemo(() => {
    const failed = all.filter((x) => x.status === 'failed');
    return {
      collected: all.filter((x) => x.status === 'paid' && (x.paid_at || x.created_at).slice(0, 7) === month).reduce((s, x) => s + Number(x.amount_ils), 0),
      paidCount: all.filter((x) => x.status === 'paid' && (x.paid_at || x.created_at).slice(0, 7) === month).length,
      pending: all.filter((x) => x.status === 'pending').reduce((s, x) => s + Number(x.amount_ils), 0),
      failed,
      failedSum: failed.reduce((s, x) => s + Number(x.amount_ils), 0),
      counts: Object.fromEntries(FILTERS.map((t) => [t.k, t.k === 'all' ? all.length : all.filter((x) => x.status === t.k).length])),
    };
  }, [all, month]);
  const rows = all.filter((x) => (tab === 'all' || x.status === tab) && (!q.trim() || `${x.org_name} ${x.description || ''} ${x.invoice_number || ''}`.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <>
      <Head
        title="מנויים ותשלומים"
        sub="סליקה ידנית. שום כרטיס לא מחויב מכאן."
        actions={
          <>
            <button type="button" className="b-btn" onClick={() => downloadCsv(`atlas-charges-${new Date().toISOString().slice(0, 10)}.csv`, rows, chargeCsv)} disabled={!rows.length}><Download size={16} strokeWidth={1.75} aria-hidden />CSV</button>
            {can('admin') ? <button type="button" className="b-btn b-btn--primary" onClick={() => setRec(true)}><Plus size={16} strokeWidth={2} aria-hidden />רישום תשלום</button> : null}
          </>
        }
      />
      <BError error={error} />
      <div className="b-bento b-bento--pay">
        <section className="b-tile b-hero" aria-labelledby="h-coll">
          <div className="b-hero-top"><h2 id="h-coll">נגבה החודש</h2></div>
          {isLoading ? <Skel w={180} h={52} style={{ opacity: 0.3 }} /> : <p className="b-hero-val adm-num">{money(sum.collected)}</p>}
          <p className="b-hero-foot">{sum.paidCount} תשלומים</p>
        </section>
        <section className="b-tile b-stat" aria-labelledby="h-pend">
          <h2 id="h-pend">ממתין לתשלום</h2>
          {isLoading ? <Skel w={120} h={36} /> : <p className="b-stat-val adm-num">{money(sum.pending)}</p>}
          <p className="b-muted b-small">{sum.counts.pending} חיובים</p>
        </section>
        <section className="b-tile b-stat b-stat--warn" aria-labelledby="h-fail">
          <h2 id="h-fail">נכשלו</h2>
          {isLoading ? <Skel w={120} h={36} /> : <p className="b-stat-val adm-num">{money(sum.failedSum)}</p>}
          <p className="b-small">{sum.failed.length} לקוחות לטפל בהם</p>
        </section>
      </div>
      <div className="b-bar">
        <div className="b-pills" role="tablist" aria-label="סינון חיובים">
          {FILTERS.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}>{t.label} <span className="adm-num b-pill-n">{sum.counts[t.k]}</span></button>
          ))}
        </div>
        <label className="b-search b-search--sm">
          <Search size={18} strokeWidth={1.75} aria-hidden />
          <span className="adm-sr">חיפוש חיוב</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="לקוח, תיאור או חשבונית" />
        </label>
      </div>
      <section className="b-tile b-tile--list" aria-label="חיובים">
        {isLoading ? <Skel h={260} /> : rows.length === 0 ? <p className="b-muted b-pad">אין חיובים להצגה.</p> : (
          <>
            <ul className="b-clist">
              {rows.slice(0, limit).map((x) => (
                <li key={x.id} className="b-crow b-crow--static">
                  <span className={`b-av b-av--lg ${x.status === 'failed' ? 'b-av--red' : ''}`} aria-hidden>{initials(x.org_name)}</span>
                  <span className="b-crow-main"><Link to={`/admin/customers/${x.org_id}`} className="b-crow-link">{x.org_name}</Link><span>{x.description || '—'}{x.failure_reason ? ` · ${x.failure_reason}` : ''}</span></span>
                  <span className="b-crow-meta b-crow-meta--w"><b>{date(x.paid_at || x.created_at)}</b><span>{METHODS[x.method] || x.method}</span></span>
                  <span className="b-crow-amt adm-num">{money(x.amount_ils)}</span>
                  <span className="b-crow-status">
                    {can('admin') && (x.status === 'failed' || x.status === 'pending') ? <button type="button" className="b-btn b-btn--sm" onClick={() => setPay(x)}>סימון כשולם</button> : <ChargePill status={x.status} />}
                  </span>
                </li>
              ))}
            </ul>
            {rows.length > limit ? <div className="b-more"><button type="button" className="b-btn" onClick={() => setLimit((n) => n + 80)}>הצגת עוד ({rows.length - limit})</button></div> : null}
          </>
        )}
      </section>
      <RecordChargeDialog customers={customers.data || []} open={rec} onOpenChange={setRec} />
      <MarkPaidDialog charge={pay} open={Boolean(pay)} onOpenChange={(o) => { if (!o) setPay(null); }} />
    </>
  );
}

/* ── Plans ─────────────────────────────────────────────────────────────── */
function PlanCard({ plan, customers }) {
  const { updatePlan } = useActions();
  const { can } = useAdmin();
  const { f, set, dirty, patch } = usePlanForm(plan);
  const landing = DEFAULT_PLANS.find((p) => p.key === plan.key);
  const differs = landing && (landing.price_monthly !== plan.price_monthly || landing.price_yearly !== plan.price_yearly);
  const paying = customers.filter((c) => c.plan_key === plan.key && ['active', 'past_due'].includes(c.status)).length;
  const ro = !can('owner');
  if (!f) return null;
  return (
    <section className={`b-tile b-plan ${plan.is_popular ? 'is-pop' : ''}`} aria-labelledby={`p-${plan.key}`}>
      <div className="b-plan-top">
        <h2 id={`p-${plan.key}`}>{plan.name}<span>{plan.name_he}</span></h2>
        {plan.is_popular ? <Pill tone="brand">פופולרית</Pill> : null}
      </div>
      <p className="b-plan-price adm-num">{money(Number(f.price_monthly) || 0)}<span> לחודש</span></p>
      <p className="b-muted b-small">{paying} משלמים{differs ? ' · שונה מדף הנחיתה' : ''}</p>
      <form className="b-plan-form" onSubmit={(e) => { e.preventDefault(); updatePlan.mutate({ key: plan.key, patch }); }}>
        <div className="b-plan-two">
          <label className="adm-field"><span>חודשי ₪</span><input className="adm-input adm-num" inputMode="numeric" value={f.price_monthly} onChange={set('price_monthly')} disabled={ro} /></label>
          <label className="adm-field"><span>שנתי לחודש ₪</span><input className="adm-input adm-num" inputMode="numeric" value={f.price_yearly} onChange={set('price_yearly')} disabled={ro} /></label>
        </div>
        <label className="adm-field"><span>עד כמה נכסים (ריק = ללא הגבלה)</span><input className="adm-input adm-num" inputMode="numeric" value={f.max_properties} onChange={set('max_properties')} disabled={ro} /></label>
        <label className="adm-field"><span>תיאור</span><input className="adm-input" value={f.description} onChange={set('description')} disabled={ro} /></label>
        <label className="adm-field"><span>מה כלול, שורה לכל פריט</span><textarea className="adm-textarea" rows={5} value={f.features} onChange={set('features')} disabled={ro} /></label>
        <div className="b-plan-checks">
          <label className="adm-check"><input type="checkbox" checked={f.is_popular} onChange={set('is_popular')} disabled={ro} />פופולרית</label>
          <label className="adm-check"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} disabled={ro} />פעילה למכירה</label>
        </div>
        {!ro ? <button type="submit" className={`b-btn b-btn--block ${dirty ? 'b-btn--primary' : 'b-btn--sm'}`} disabled={!dirty || updatePlan.isPending}>{updatePlan.isPending ? 'שומרים…' : dirty ? 'שמירת שינויים' : 'אין שינויים'}</button> : null}
      </form>
    </section>
  );
}
export function Plans() {
  const { plans, isLoading, error } = usePlans();
  const customers = useCustomers();
  const { can } = useAdmin();
  return (
    <>
      <Head title="חבילות ומחירים" sub={can('owner') ? 'משפיע על חיובים חדשים. דף הנחיתה עדיין קורא את המחירים מהקוד.' : 'רק בעלים יכולים לשנות מחירים.'} />
      <BError error={error} />
      {isLoading ? <Skel h={420} r={24} /> : <div className="b-plans">{plans.map((p) => <PlanCard key={p.key} plan={p} customers={customers.data || []} />)}</div>}
    </>
  );
}

/* ── Team ──────────────────────────────────────────────────────────────── */
export function Team() {
  const { data, isLoading, error } = useTeam();
  const { me, can } = useAdmin();
  const { removeTeamMember } = useActions();
  return (
    <>
      <Head title="צוות והרשאות" sub="ההרשאות נבדקות במסד הנתונים בכל פעולה." />
      <BError error={error} />
      <div className="b-team">
        {isLoading ? <Skel h={160} r={24} /> : (data || []).map((m) => (
          <section key={m.user_id} className="b-tile b-member" aria-label={m.full_name || m.email}>
            <span className={`b-av b-av--xl ${m.role === 'owner' ? 'b-av--brand' : ''}`} aria-hidden>{initials(m.full_name || m.email)}</span>
            <b className="b-member-name">{m.full_name || m.email.split('@')[0]}{m.email === me?.email ? <span className="b-muted"> · אתם</span> : null}</b>
            <span className="b-muted b-small adm-ltr">{m.email}</span>
            <span className="b-muted b-small">כניסה אחרונה {relTime(m.last_sign_in_at)}</span>
            <div className="b-member-foot">
              {can('owner') ? <RoleSelect member={m} meEmail={me?.email} /> : <Pill tone={m.role === 'owner' ? 'brand' : 'gray'}>{ROLES[m.role]?.label}</Pill>}
              {can('owner') && m.email !== me?.email ? (
                <button type="button" className="b-btn b-btn--icon b-btn--ghost" aria-label={`הסרת ${m.full_name || m.email}`} onClick={() => removeTeamMember.mutate({ userId: m.user_id })}><Trash2 size={18} strokeWidth={1.75} /></button>
              ) : null}
            </div>
          </section>
        ))}
        <section className="b-tile b-roles-t" aria-labelledby="h-roles">
          <h2 id="h-roles">מי יכול מה</h2>
          <ul>
            {Object.entries(ROLES).map(([k, r]) => <li key={k}><b>{r.label}</b><span>{r.desc}</span></li>)}
          </ul>
        </section>
      </div>
      {can('owner') ? (
        <section className="b-tile b-add" aria-labelledby="h-add">
          <h2 id="h-add">הוספת איש צוות</h2>
          <TeamAddForm className="b-team-add" />
        </section>
      ) : null}
    </>
  );
}

/* ── Health ────────────────────────────────────────────────────────────── */
const HICON = { db: Database, deploy: Rocket, schema: Layers, errors: Bug, charges: Wallet };
export function Health() {
  const { data, isLoading, error, refetch, isFetching } = useHealth();
  const rows = healthRows(data, BUILD_INFO);
  const ok = rows.every((r) => r.ok !== false);
  return (
    <>
      <Head title="תקינות מערכת" sub={data ? `נבדק ${relTime(data.db_time)}` : ' '} actions={<button type="button" className="b-btn" onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'בודקים…' : 'בדיקה עכשיו'}</button>} />
      <BError error={error} />
      {isLoading ? <Skel h={300} r={24} /> : (
        <div className="b-bento b-bento--health">
          <section className={`b-tile b-hero ${ok ? '' : 'b-hero--warn'}`} aria-labelledby="h-sys">
            <div className="b-hero-top"><h2 id="h-sys">מצב כללי</h2></div>
            <p className="b-hero-val b-hero-val--md">{ok ? 'הכל עובד' : 'יש מה לבדוק'}</p>
            <div className="b-hero-row">
              <div><span>ארגונים</span><b className="adm-num">{data.counts.organizations}</b></div>
              <div><span>משתמשים</span><b className="adm-num">{data.counts.users}</b></div>
              <div><span>הזמנות</span><b className="adm-num">{data.counts.bookings.toLocaleString('he-IL')}</b></div>
            </div>
          </section>
          {rows.map((r) => {
            const Icon = HICON[r.key] || Cloud;
            const St = r.ok === null ? CircleDashed : r.ok ? CheckCircle2 : XCircle;
            return (
              <section key={r.key} className="b-tile b-hcomp" aria-label={r.label}>
                <div className="b-hcomp-top"><span className="b-dot" aria-hidden><Icon size={18} strokeWidth={1.75} /></span><St size={20} strokeWidth={1.75} className={r.ok === null ? 'b-muted' : r.ok ? 'b-ok' : 'b-bad'} aria-hidden /></div>
                <h2>{r.label}</h2>
                <p className="b-hcomp-val adm-num">{r.value}</p>
                {r.meta ? <p className="b-muted b-small">{r.meta}</p> : null}
                {r.note ? <p className="b-muted b-small b-clip">{r.note}</p> : null}
              </section>
            );
          })}
          <section className="b-tile b-hcomp" aria-label="Supabase">
            <div className="b-hcomp-top"><span className="b-dot" aria-hidden><Cloud size={18} strokeWidth={1.75} /></span><ExternalLink size={18} strokeWidth={1.75} className="b-muted" aria-hidden /></div>
            <h2>Supabase</h2>
            <p className="b-small b-muted">מצב השירות אצל הספק</p>
            <a className="b-link" href="https://status.supabase.com" target="_blank" rel="noreferrer">status.supabase.com</a>
          </section>
        </div>
      )}
    </>
  );
}

/* ── Audit ─────────────────────────────────────────────────────────────── */
export function Audit() {
  const { data, isLoading, error } = useAudit();
  const [type, setType] = useState('all');
  const rows = (data || []).filter((a) => type === 'all' || a.action === type);
  const present = [...new Set((data || []).map((a) => a.action))];
  const groups = useMemo(() => {
    const g = new Map();
    for (const a of rows) {
      const k = date(a.created_at, { weekday: true, year: true });
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(a);
    }
    return [...g.entries()];
  }, [rows]);
  return (
    <>
      <Head title="יומן פעולות" sub="כל פעולה של הצוות נשמרת לתמיד." actions={<button type="button" className="b-btn" onClick={() => downloadCsv(`atlas-audit-${new Date().toISOString().slice(0, 10)}.csv`, rows, auditCsv)} disabled={!rows.length}><Download size={16} strokeWidth={1.75} aria-hidden />CSV</button>} />
      <BError error={error} />
      <div className="b-bar">
        <div className="b-pills" role="group" aria-label="סוג פעולה">
          <button type="button" aria-pressed={type === 'all'} onClick={() => setType('all')}>הכל</button>
          {present.map((k) => <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)}>{AUDIT_ACTIONS[k] || k}</button>)}
        </div>
      </div>
      {isLoading ? <Skel h={240} r={24} /> : rows.length === 0 ? <p className="b-tile b-muted">אין פעולות עדיין.</p> : groups.map(([day, list]) => (
        <section key={day} className="b-tile b-audit-day" aria-label={day}>
          <h2>{day}</h2>
          <ul className="b-rows">
            {list.map((a) => (
              <li key={a.id} className="b-row b-row--static">
                <span className="b-av" aria-hidden>{initials(a.actor_email?.split('@')[0] || '·').toUpperCase() || '·'}</span>
                <span className="b-row-main">
                  <b>{AUDIT_ACTIONS[a.action] || a.action}{a.org_name ? <> · {a.org_id ? <Link to={`/admin/customers/${a.org_id}`} className="b-crow-link b-inline">{a.org_name}</Link> : a.org_name}</> : null}</b>
                  <span>{[auditDetail(a), a.actor_email?.split('@')[0]].filter(Boolean).join(' · ')}</span>
                </span>
                <time className="b-muted b-small" dateTime={a.created_at}>{new Date(a.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</time>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
