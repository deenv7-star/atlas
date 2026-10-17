import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, Search, ExternalLink, CheckCircle2, XCircle, CircleDashed, Trash2 } from 'lucide-react';
import { PageHead } from './Shell';
import { ErrorNote } from './pagesCustomers';
import { useCharges, useCustomers, usePlans, useTeam, useAudit, useHealth, useAdmin, useActions } from '../hooks';
import { ChargePill, Pill, Skel, money, date } from '../ui';
import { METHODS, ROLES, AUDIT_ACTIONS, BUILD_INFO, DEFAULT_PLANS } from '../config';
import { relTime } from '../metrics';
import { chargeCsv, auditCsv, auditDetail, usePlanForm, TeamAddForm, RoleSelect, healthRows } from '../shared';
import { downloadCsv } from '../csv';
import { RecordChargeDialog, MarkPaidDialog } from '../dialogs';

/* ── Subscriptions & payments ──────────────────────────────────────────── */
const TABS = [
  { k: 'all', label: 'הכל' },
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
  const [limit, setLimit] = useState(50);
  const all = data || [];
  const month = new Date().toISOString().slice(0, 7);
  const sum = useMemo(() => ({
    collected: all.filter((x) => x.status === 'paid' && (x.paid_at || x.created_at).slice(0, 7) === month).reduce((s, x) => s + Number(x.amount_ils), 0),
    pending: all.filter((x) => x.status === 'pending').reduce((s, x) => s + Number(x.amount_ils), 0),
    failed: all.filter((x) => x.status === 'failed'),
    counts: Object.fromEntries(TABS.map((t) => [t.k, t.k === 'all' ? all.length : all.filter((x) => x.status === t.k).length])),
  }), [all, month]);
  const rows = all.filter((x) => (tab === 'all' || x.status === tab) && (!q.trim() || `${x.org_name} ${x.description || ''} ${x.invoice_number || ''}`.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <>
      <PageHead
        title="מנויים ותשלומים"
        sub="סליקה ידנית. אין ספק סליקה מחובר, ולכן אף כרטיס לא מחויב מכאן."
        actions={
          <>
            <button type="button" className="adm-btn" onClick={() => downloadCsv(`atlas-charges-${new Date().toISOString().slice(0, 10)}.csv`, rows, chargeCsv)} disabled={!rows.length}><Download size={16} strokeWidth={1.75} aria-hidden />ייצוא CSV</button>
            {can('admin') ? <button type="button" className="adm-btn adm-btn--primary" onClick={() => setRec(true)}><Plus size={16} strokeWidth={1.75} aria-hidden />רישום תשלום</button> : null}
          </>
        }
      />
      <ErrorNote error={error} />
      <section className="a-card a-kpis a-kpis--3" aria-label="סיכום תשלומים">
        <div className="a-kpi"><p className="a-kpi-label">נגבה החודש</p>{isLoading ? <Skel w={110} h={30} /> : <p className="a-kpi-value adm-num">{money(sum.collected)}</p>}</div>
        <div className="a-kpi"><p className="a-kpi-label">ממתין לתשלום</p>{isLoading ? <Skel w={110} h={30} /> : <p className="a-kpi-value adm-num">{money(sum.pending)}</p>}</div>
        <div className="a-kpi"><p className="a-kpi-label">תשלומים שנכשלו</p>{isLoading ? <Skel w={110} h={30} /> : <p className="a-kpi-value adm-num">{sum.failed.length}<span className="a-kpi-unit"> · {money(sum.failed.reduce((s, x) => s + Number(x.amount_ils), 0))}</span></p>}</div>
      </section>
      <div className="a-toolbar">
        <div className="adm-seg" role="tablist" aria-label="סינון חיובים">
          {TABS.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}>{t.label} <span className="adm-num a-seg-n">{sum.counts[t.k]}</span></button>
          ))}
        </div>
        <label className="a-search a-search--sm">
          <Search size={16} strokeWidth={1.75} aria-hidden />
          <span className="adm-sr">חיפוש חיוב</span>
          <input className="adm-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="לקוח, תיאור או מספר חשבונית" />
        </label>
      </div>
      <section className="a-card a-card--flush" aria-label="חיובים">
        {isLoading ? <div className="a-pad"><Skel h={260} /></div> : rows.length === 0 ? <p className="a-empty a-pad">אין חיובים להצגה.</p> : (
          <>
            <div className="a-table-wrap a-desk">
              <table className="a-table a-table--rows">
                <thead><tr><th scope="col">תאריך</th><th scope="col">לקוח</th><th scope="col">תיאור</th><th scope="col">תקופה</th><th scope="col">אמצעי</th><th scope="col" className="num">סכום</th><th scope="col">מצב</th><th scope="col"><span className="adm-sr">פעולה</span></th></tr></thead>
                <tbody>
                  {rows.slice(0, limit).map((x) => (
                    <tr key={x.id}>
                      <td className="adm-num">{date(x.paid_at || x.created_at)}</td>
                      <td><Link to={`/admin/customers/${x.org_id}`} className="a-cell-main">{x.org_name}</Link></td>
                      <td>{x.description || '—'}{x.failure_reason ? <span className="a-cell-sub a-bad">{x.failure_reason}</span> : null}</td>
                      <td className="a-muted adm-num">{x.period_start ? `${date(x.period_start)}${x.period_end ? ` – ${date(x.period_end)}` : ''}` : '—'}</td>
                      <td className="a-muted">{METHODS[x.method] || x.method}</td>
                      <td className="num adm-num">{money(x.amount_ils)}</td>
                      <td><ChargePill status={x.status} /></td>
                      <td className="a-td-action">{can('admin') && (x.status === 'failed' || x.status === 'pending') ? <button type="button" className="adm-btn adm-btn--sm" onClick={() => setPay(x)}>סימון כשולם</button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="a-mob-list a-mob">
              {rows.slice(0, limit).map((x) => (
                <li key={x.id} className="a-list-row a-list-row--static">
                  <span className="a-list-main"><b>{x.org_name}</b><span>{date(x.paid_at || x.created_at)} · {money(x.amount_ils)}{x.failure_reason ? ` · ${x.failure_reason}` : ''}</span></span>
                  <span className="a-list-end">
                    {can('admin') && (x.status === 'failed' || x.status === 'pending') ? <button type="button" className="adm-btn adm-btn--sm" onClick={() => setPay(x)}>סימון כשולם</button> : <ChargePill status={x.status} />}
                  </span>
                </li>
              ))}
            </ul>
            {rows.length > limit ? (
              <div className="a-more"><button type="button" className="adm-btn" onClick={() => setLimit((n) => n + 100)}>הצגת עוד {Math.min(100, rows.length - limit)} מתוך {rows.length - limit}</button></div>
            ) : null}
          </>
        )}
      </section>
      <RecordChargeDialog customers={customers.data || []} open={rec} onOpenChange={setRec} />
      <MarkPaidDialog charge={pay} open={Boolean(pay)} onOpenChange={(o) => { if (!o) setPay(null); }} />
    </>
  );
}

/* ── Plans & pricing ───────────────────────────────────────────────────── */
function PlanRow({ plan, customers }) {
  const { updatePlan } = useActions();
  const { can } = useAdmin();
  const { f, set, dirty, patch } = usePlanForm(plan);
  const landing = DEFAULT_PLANS.find((p) => p.key === plan.key);
  const differs = landing && (landing.price_monthly !== plan.price_monthly || landing.price_yearly !== plan.price_yearly);
  const n = customers.filter((c) => c.plan_key === plan.key && ['active', 'past_due'].includes(c.status)).length;
  const ro = !can('owner');
  if (!f) return null;
  return (
    <section className="a-card a-plan" aria-labelledby={`plan-${plan.key}`}>
      <div className="a-plan-head">
        <div>
          <h2 id={`plan-${plan.key}`}>{plan.name} <span className="a-muted">· {plan.name_he}</span></h2>
          <p className="a-muted">{n} משלמים{plan.is_popular ? ' · מסומנת כפופולרית' : ''}{plan.is_active === false ? ' · מוסתרת' : ''}</p>
        </div>
        {differs ? <Pill tone="lilac">שונה מדף הנחיתה</Pill> : null}
      </div>
      <form className="a-plan-form" onSubmit={(e) => { e.preventDefault(); updatePlan.mutate({ key: plan.key, patch }); }}>
        <label className="adm-field"><span>מחיר חודשי (₪)</span><input className="adm-input adm-num" inputMode="numeric" value={f.price_monthly} onChange={set('price_monthly')} disabled={ro} /></label>
        <label className="adm-field"><span>שנתי, לחודש (₪)</span><input className="adm-input adm-num" inputMode="numeric" value={f.price_yearly} onChange={set('price_yearly')} disabled={ro} /></label>
        <label className="adm-field"><span>מקסימום נכסים (ריק = ללא הגבלה)</span><input className="adm-input adm-num" inputMode="numeric" value={f.max_properties} onChange={set('max_properties')} disabled={ro} /></label>
        <label className="adm-field a-plan-wide"><span>תיאור קצר</span><input className="adm-input" value={f.description} onChange={set('description')} disabled={ro} /></label>
        <label className="adm-field a-plan-wide"><span>מה כלול (שורה לכל פריט)</span><textarea className="adm-textarea" rows={6} value={f.features} onChange={set('features')} disabled={ro} /></label>
        <div className="a-plan-foot a-plan-wide">
          <label className="adm-check"><input type="checkbox" checked={f.is_popular} onChange={set('is_popular')} disabled={ro} />פופולרית</label>
          <label className="adm-check"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} disabled={ro} />פעילה למכירה</label>
          <span className="a-spacer" />
          {!ro ? <button type="submit" className={`adm-btn ${dirty ? 'adm-btn--primary' : ''}`} disabled={!dirty || updatePlan.isPending}>{updatePlan.isPending ? 'שומרים…' : 'שמירה'}</button> : null}
        </div>
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
      <PageHead title="חבילות ומחירים" sub="המחירים שבהם נרשמים לקוחות חדשים. שינוי כאן משפיע על חיובים חדשים בלבד." />
      <ErrorNote error={error} />
      <div className="a-card a-note" role="note">
        {can('owner') ? 'דף הנחיתה עדיין מציג את המחירים שבקוד (src/config/pricing.js). חיבור שלו לטבלה הזו הוא צעד המשך קטן.' : 'רק בעלים יכולים לשנות מחירים. אפשר לצפות.'}
      </div>
      {isLoading ? <Skel h={300} /> : <div className="a-plans">{plans.map((p) => <PlanRow key={p.key} plan={p} customers={customers.data || []} />)}</div>}
    </>
  );
}

/* ── Team & roles ──────────────────────────────────────────────────────── */
export function Team() {
  const { data, isLoading, error } = useTeam();
  const { me, can } = useAdmin();
  const { removeTeamMember } = useActions();
  return (
    <>
      <PageHead title="צוות והרשאות" sub="מי יכול להיכנס לאזור הניהול. ההרשאות נבדקות במסד הנתונים בכל פעולה." />
      <ErrorNote error={error} />
      <section className="a-card a-roles" aria-label="סוגי הרשאות">
        {Object.entries(ROLES).map(([k, r]) => (
          <div key={k}><b>{r.label}</b><span>{r.desc}</span></div>
        ))}
      </section>
      {can('owner') ? (
        <section className="a-card" aria-labelledby="add-h">
          <h2 id="add-h" className="a-side-h">הוספת איש צוות</h2>
          <TeamAddForm className="a-team-add" />
        </section>
      ) : null}
      <section className="a-card a-card--flush" aria-label="אנשי צוות">
        {isLoading ? <div className="a-pad"><Skel h={140} /></div> : (
          <>
          <ul className="a-mob-list a-mob">
            {(data || []).map((m) => (
              <li key={m.user_id} className="a-list-row a-list-row--static">
                <span className="a-list-main"><b>{m.full_name || m.email}</b><span className="adm-ltr">{m.email}</span></span>
                <span className="a-list-end">{can('owner') ? <RoleSelect member={m} meEmail={me?.email} /> : <Pill tone={m.role === 'owner' ? 'brand' : 'gray'}>{ROLES[m.role]?.label}</Pill>}</span>
              </li>
            ))}
          </ul>
          <div className="a-table-wrap a-desk">
            <table className="a-table a-table--rows">
              <thead><tr><th scope="col">שם</th><th scope="col">אימייל</th><th scope="col">הרשאה</th><th scope="col">כניסה אחרונה</th><th scope="col"><span className="adm-sr">פעולה</span></th></tr></thead>
              <tbody>
                {(data || []).map((m) => (
                  <tr key={m.user_id}>
                    <td><span className="a-cell-main">{m.full_name || '—'}{m.email === me?.email ? <span className="a-muted"> · אתם</span> : null}</span></td>
                    <td className="a-muted"><span className="adm-ltr">{m.email}</span></td>
                    <td>{can('owner') ? <RoleSelect member={m} meEmail={me?.email} /> : <Pill tone={m.role === 'owner' ? 'brand' : 'gray'}>{ROLES[m.role]?.label}</Pill>}</td>
                    <td className="a-muted">{relTime(m.last_sign_in_at)}</td>
                    <td className="a-td-action">
                      {can('owner') && m.email !== me?.email ? (
                        <button type="button" className="adm-btn adm-btn--sm adm-btn--quiet adm-btn--danger" aria-label={`הסרת ${m.full_name || m.email}`} onClick={() => removeTeamMember.mutate({ userId: m.user_id })}><Trash2 size={16} strokeWidth={1.75} aria-hidden /></button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </>
  );
}

/* ── System health ─────────────────────────────────────────────────────── */
export function Health() {
  const { data, isLoading, error, refetch, isFetching } = useHealth();
  const rows = healthRows(data, BUILD_INFO);
  return (
    <>
      <PageHead
        title="תקינות מערכת"
        sub={data ? `נבדק ${relTime(data.db_time)}` : ' '}
        actions={<button type="button" className="adm-btn" onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'בודקים…' : 'בדיקה עכשיו'}</button>}
      />
      <ErrorNote error={error} />
      <section className="a-card a-card--flush" aria-label="רכיבים">
        {isLoading ? <div className="a-pad"><Skel h={220} /></div> : (
          <ul className="a-health">
            {rows.map((r) => {
              const Icon = r.ok === null ? CircleDashed : r.ok ? CheckCircle2 : XCircle;
              return (
                <li key={r.key}>
                  <Icon size={20} strokeWidth={1.75} className={r.ok === null ? 'a-muted' : r.ok ? 'a-ok' : 'a-bad'} aria-hidden />
                  <div className="a-health-main"><b>{r.label}</b>{r.meta ? <span>{r.meta}</span> : null}{r.note ? <span className="a-health-note">{r.note}</span> : null}</div>
                  <span className="a-health-val adm-num">{r.value}</span>
                </li>
              );
            })}
            <li>
              <ExternalLink size={20} strokeWidth={1.75} className="a-muted" aria-hidden />
              <div className="a-health-main"><b>Supabase</b><span>מצב השירות אצל הספק</span></div>
              <a className="a-link" href="https://status.supabase.com" target="_blank" rel="noreferrer">status.supabase.com</a>
            </li>
          </ul>
        )}
      </section>
      {data ? (
        <section className="a-card a-kpis" aria-label="נפח">
          <div className="a-kpi"><p className="a-kpi-label">ארגונים</p><p className="a-kpi-value adm-num">{data.counts.organizations}</p></div>
          <div className="a-kpi"><p className="a-kpi-label">משתמשים</p><p className="a-kpi-value adm-num">{data.counts.users}</p></div>
          <div className="a-kpi"><p className="a-kpi-label">הזמנות במערכת</p><p className="a-kpi-value adm-num">{data.counts.bookings.toLocaleString('he-IL')}</p></div>
          <div className="a-kpi"><p className="a-kpi-label">נכנסו ב-24 שעות</p><p className="a-kpi-value adm-num">{data.counts.signins_24h}</p></div>
        </section>
      ) : null}
    </>
  );
}

/* ── Audit log ─────────────────────────────────────────────────────────── */
export function Audit() {
  const { data, isLoading, error } = useAudit();
  const [type, setType] = useState('all');
  const rows = (data || []).filter((a) => type === 'all' || a.action === type);
  const present = [...new Set((data || []).map((a) => a.action))];
  return (
    <>
      <PageHead
        title="יומן פעולות"
        sub="כל פעולה של הצוות נרשמת כאן ואי אפשר למחוק אותה."
        actions={<button type="button" className="adm-btn" onClick={() => downloadCsv(`atlas-audit-${new Date().toISOString().slice(0, 10)}.csv`, rows, auditCsv)} disabled={!rows.length}><Download size={16} strokeWidth={1.75} aria-hidden />ייצוא CSV</button>}
      />
      <ErrorNote error={error} />
      <div className="a-toolbar">
        <label className="a-plan-filter">
          <span className="adm-sr">סוג פעולה</span>
          <select className="adm-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">כל הפעולות</option>
            {present.map((k) => <option key={k} value={k}>{AUDIT_ACTIONS[k] || k}</option>)}
          </select>
        </label>
      </div>
      <section className="a-card a-card--flush" aria-label="פעולות">
        {isLoading ? <div className="a-pad"><Skel h={200} /></div> : rows.length === 0 ? <p className="a-empty a-pad">אין פעולות עדיין.</p> : (
          <>
          <ul className="a-mob-list a-mob">
            {rows.map((a) => (
              <li key={a.id} className="a-list-row a-list-row--static">
                <span className="a-list-main"><b>{AUDIT_ACTIONS[a.action] || a.action}{a.org_name ? ` · ${a.org_name}` : ''}</b><span>{[auditDetail(a), a.actor_email?.split('@')[0], relTime(a.created_at)].filter(Boolean).join(' · ')}</span></span>
              </li>
            ))}
          </ul>
          <div className="a-table-wrap a-desk">
            <table className="a-table a-table--rows">
              <thead><tr><th scope="col">מתי</th><th scope="col">מי</th><th scope="col">פעולה</th><th scope="col">לקוח</th><th scope="col">פרטים</th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="a-muted adm-num" title={new Date(a.created_at).toLocaleString('he-IL')}>{relTime(a.created_at)}</td>
                    <td><span className="adm-ltr">{a.actor_email?.split('@')[0]}</span></td>
                    <td>{AUDIT_ACTIONS[a.action] || a.action}</td>
                    <td>{a.org_id ? <Link className="a-cell-main" to={`/admin/customers/${a.org_id}`}>{a.org_name || '—'}</Link> : <span className="a-muted">—</span>}</td>
                    <td className="a-muted">{auditDetail(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </>
  );
}
