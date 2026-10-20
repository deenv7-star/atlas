/* Admin v2 shared parts: KPI strip, filters, bulk bar, pager, customer-360 sections, delete flow.
   Both visual versions (a: table + drawer, b: list + page) compose these. */
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import {
  Search, X, Info, Download, CalendarPlus, Repeat, PauseCircle, PlayCircle, FlaskConical, Mail, KeyRound, Eye,
  MessageCircle, Trash2, ShieldAlert, Check, AlertTriangle, CalendarDays, Wallet, Loader2, ChevronLeft, ChevronRight, StickyNote,
} from 'lucide-react';
import { Modal, Field, ChargePill, money, date, pct, contactLinks, heMessage } from '../ui';
import { STATUS, STATUS_ORDER, METHODS, AUDIT_ACTIONS } from '../config';
import { relTime, daysUntil, fmtPhone, monthLabel } from '../metrics';
import { useAdmin, usePlans } from '../hooks';
import { NotesBox, auditDetail, customerCsv } from '../shared';
import { downloadCsv } from '../csv';
import { adminApi } from '../api';
import { computeKpis, KPI_HELP, monthlyValue } from './kpis';
import { testInfo } from './testAccounts';
import { SIGNUP, ACTIVE, SIGNUP_ORDER, ACTIVE_ORDER, UNITS, TESTS, activeFilterCount } from './listModel';
import { useV2Actions, logEvent, downloadJson, slug } from './hooks2';

export const initials = (s) => String(s || '').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
export const displayName = (c) => c?.org_name || c?.owner_email?.split('@')[0] || 'ללא שם';
const tick = { fill: '#646B85', fontSize: 12, fontFamily: 'Heebo' };

/* ── tiny pieces ───────────────────────────────────────────────────────── */
export function TestPill({ c, compact }) {
  const t = testInfo(c);
  if (!t.is_test) return null;
  return <span className="x-test" title={t.source === 'manual' ? 'סומן ידנית כחשבון בדיקה' : 'זוהה אוטומטית לפי האימייל'}><FlaskConical size={13} strokeWidth={2} aria-hidden />{compact ? <span className="adm-sr">חשבון </span> : null}בדיקה</span>;
}
function Hint({ id, text }) {
  return (
    <span className="x-hint">
      <button type="button" className="x-hint-btn" aria-describedby={id} aria-label="מה זה אומר?"><Info size={14} strokeWidth={2} aria-hidden /></button>
      <span role="tooltip" id={id} className="x-hint-tip">{text}</span>
    </span>
  );
}
export function Health({ ok, label }) {
  return <span className={`x-health ${ok === true ? 'is-ok' : ok === false ? 'is-bad' : 'is-off'}`}><i aria-hidden />{label}</span>;
}

/* ── KPI strip ─────────────────────────────────────────────────────────── */
export function KpiStrip({ customers, charges, className = '' }) {
  const { plans } = usePlans();
  const k = useMemo(() => computeKpis(customers || [], charges || [], plans), [customers, charges, plans]);
  const items = [
    { id: 'mrr', label: 'הכנסה חודשית חוזרת', value: money(k.mrr), sub: k.paying ? `${money(k.arr)} בשנה` : 'אין עדיין לקוחות משלמים', hero: true },
    { id: 'paying', label: 'לקוחות משלמים', value: String(k.paying), sub: `${k.trialing} בניסיון כרגע` },
    { id: 'conversion', label: 'המרה מניסיון לתשלום', value: pct(k.conversion), sub: k.ended ? `${k.converted} מתוך ${k.ended} שסיימו ניסיון` : 'אף ניסיון עוד לא הסתיים' },
    { id: 'churn', label: 'נטישה ב-30 יום', value: pct(k.churn), sub: k.churnBase ? `${k.churned30} ביטלו` : 'אין עדיין בסיס לחישוב' },
  ];
  return (
    <section className={`x-kpis ${className}`} aria-label="מדדים">
      {items.map((it) => (
        <div key={it.id} className={`x-kpi ${it.hero ? 'is-hero' : ''}`}>
          <div className="x-kpi-top"><span>{it.label}</span><Hint id={`kpi-${it.id}`} text={KPI_HELP[it.id]} /></div>
          <b className="adm-num">{it.value}</b>
          <small>{it.sub}</small>
        </div>
      ))}
      <p className="x-kpis-foot">פעילים השבוע: <b className="adm-num">{k.active7}</b> · לא כולל {k.tests} חשבונות בדיקה</p>
    </section>
  );
}

/* ── filters ───────────────────────────────────────────────────────────── */
function Select({ label, value, onChange, options }) {
  return (
    <label className="x-select">
      <span className="adm-sr">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} data-on={value !== options[0][0] ? 'true' : undefined}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
export function FilterBar({ f, set, reset, plans, counts }) {
  const n = activeFilterCount(f);
  return (
    <div className="x-filters" role="search">
      <label className="x-search">
        <Search size={17} strokeWidth={1.75} aria-hidden />
        <span className="adm-sr">חיפוש לקוח</span>
        <input type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="חיפוש עסק, בעלים, אימייל או טלפון" />
      </label>
      <div className="x-filter-row" role="group" aria-label="מסננים">
        <Select label="סטטוס" value={f.status} onChange={(v) => set({ status: v })} options={[['all', `כל הסטטוסים${counts ? ` (${counts.all})` : ''}`], ...STATUS_ORDER.map((s) => [s, `${STATUS[s].label}${counts ? ` (${counts[s] || 0})` : ''}`])]} />
        <Select label="חבילה" value={f.plan} onChange={(v) => set({ plan: v })} options={[['all', 'כל החבילות'], ...plans.map((p) => [p.key, p.name])]} />
        <Select label="הצטרפו" value={f.signup} onChange={(v) => set({ signup: v })} options={SIGNUP_ORDER.map((k) => [k, SIGNUP[k]]).map(([k, v]) => [k, k === 'any' ? 'הצטרפו: כל זמן' : `הצטרפו: ${v}`])} />
        <Select label="פעילות אחרונה" value={f.active} onChange={(v) => set({ active: v })} options={ACTIVE_ORDER.map((k) => [k, ACTIVE[k]])} />
        <Select label="יחידות" value={f.units} onChange={(v) => set({ units: v })} options={Object.entries(UNITS)} />
        <Select label="חשבונות בדיקה" value={f.tests} onChange={(v) => set({ tests: v })} options={Object.entries(TESTS)} />
        {n ? <button type="button" className="x-clear" onClick={reset}><X size={14} strokeWidth={2} aria-hidden />ניקוי {n}</button> : null}
      </div>
    </div>
  );
}
export function countsOf(rows) {
  const c = { all: rows.length };
  for (const x of rows) c[x.status] = (c[x.status] || 0) + 1;
  return c;
}

/* ── pager ─────────────────────────────────────────────────────────────── */
export function Pager({ p, onPage }) {
  if (p.total <= 0) return null;
  return (
    <nav className="x-pager" aria-label="עמודים">
      <span className="adm-num">{p.from}–{p.to} מתוך {p.total}</span>
      <div>
        <button type="button" className="x-icon-btn" onClick={() => onPage(p.page - 1)} disabled={p.page <= 1} aria-label="עמוד קודם"><ChevronRight size={18} strokeWidth={1.75} /></button>
        <span className="adm-num" aria-current="page">{p.page} / {p.pages}</span>
        <button type="button" className="x-icon-btn" onClick={() => onPage(p.page + 1)} disabled={p.page >= p.pages} aria-label="עמוד הבא"><ChevronLeft size={18} strokeWidth={1.75} /></button>
      </div>
    </nav>
  );
}

/* ── bulk ──────────────────────────────────────────────────────────────── */
export function BulkBar({ selected, rows, clear, bulk }) {
  const { can } = useAdmin();
  const { plans } = usePlans();
  const [kind, setKind] = useState(null);
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState('starter');
  const [reason, setReason] = useState('');
  const n = selected.length;
  if (!n) return null;
  const picked = rows.filter((c) => selected.includes(c.org_id));
  const go = async (label, fn) => { setKind(null); await bulk.run(label, selected, fn); clear(); };
  const TITLES = { trial: 'הארכת ניסיון', plan: 'שינוי חבילה', suspend: 'השהיה', reactivate: 'הפעלה מחדש', test: 'סימון כחשבונות בדיקה', real: 'סימון כלקוחות אמיתיים' };
  return (
    <>
      <div className="x-bulk" role="region" aria-label="פעולות על הנבחרים">
        <b className="adm-num">{n} נבחרו</b>
        {bulk.state ? <span className="x-bulk-prog" role="status"><Loader2 size={16} className="x-spin" aria-hidden />{bulk.state.label} {bulk.state.done}/{bulk.state.total}</span> : (
          <div className="x-bulk-actions">
            <button type="button" disabled={!can('admin')} onClick={() => setKind('trial')}><CalendarPlus size={16} strokeWidth={1.75} aria-hidden />הארכת ניסיון</button>
            <button type="button" disabled={!can('admin')} onClick={() => setKind('plan')}><Repeat size={16} strokeWidth={1.75} aria-hidden />חבילה</button>
            <button type="button" disabled={!can('admin')} onClick={() => setKind('suspend')}><PauseCircle size={16} strokeWidth={1.75} aria-hidden />השהיה</button>
            <button type="button" disabled={!can('admin')} onClick={() => setKind('reactivate')}><PlayCircle size={16} strokeWidth={1.75} aria-hidden />הפעלה</button>
            <button type="button" disabled={!can('admin')} onClick={() => setKind('test')}><FlaskConical size={16} strokeWidth={1.75} aria-hidden />בדיקה</button>
            <button type="button" disabled={!can('admin')} onClick={() => setKind('real')}>לא בדיקה</button>
            <button type="button" onClick={() => { downloadCsv(`atlas-customers-selected-${new Date().toISOString().slice(0, 10)}.csv`, picked, customerCsv(plans)); logEvent('customers.export_csv', null, { count: picked.length, selected: true }); }}><Download size={16} strokeWidth={1.75} aria-hidden />CSV</button>
          </div>
        )}
        <button type="button" className="x-icon-btn" onClick={clear} aria-label="ביטול הבחירה"><X size={18} strokeWidth={1.75} /></button>
      </div>
      <Modal open={Boolean(kind)} onOpenChange={(o) => !o && setKind(null)} title={`${TITLES[kind] || ''} · ${n} לקוחות`} sub={picked.slice(0, 4).map(displayName).join(', ') + (n > 4 ? ` ועוד ${n - 4}` : '')}>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (kind === 'trial') go(`הארכת ניסיון ב-${days} ימים`, (id) => adminApi.extendTrial(id, days));
          if (kind === 'plan') go('שינוי חבילה', (id) => adminApi.changePlan(id, { plan }));
          if (kind === 'suspend') go('השהיה', (id) => adminApi.setSuspended(id, true, reason));
          if (kind === 'reactivate') go('הפעלה מחדש', (id) => adminApi.setSuspended(id, false));
          if (kind === 'test') go('סימון כבדיקה', (id) => adminApi.setTestFlag(id, true, 'bulk'));
          if (kind === 'real') go('סימון כאמיתי', (id) => adminApi.setTestFlag(id, false, 'bulk'));
        }}>
          {kind === 'trial' ? (
            <div className="adm-seg" role="group" aria-label="כמה ימים">
              {[7, 14, 30].map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{d} ימים</button>)}
            </div>
          ) : null}
          {kind === 'plan' ? (
            <Field label="חבילה חדשה לכולם">
              <select className="adm-select" value={plan} onChange={(e) => setPlan(e.target.value)}>{plans.map((p) => <option key={p.key} value={p.key}>{p.name} · {money(p.price_monthly)}</option>)}</select>
            </Field>
          ) : null}
          {kind === 'suspend' ? <Field label="סיבה (נראית רק לצוות)"><input className="adm-input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field> : null}
          <p className="x-muted">כל לקוח מקבל שורה משלו ביומן הפעולות. מחיקה בבת אחת לא קיימת בכוונה.</p>
          <div className="adm-dialog-actions">
            <button type="submit" className={`adm-btn ${kind === 'suspend' ? 'adm-btn--danger adm-btn--solid' : 'adm-btn--primary'}`}>אישור ל-{n}</button>
            <button type="button" className="adm-btn adm-btn--quiet" onClick={() => setKind(null)}>ביטול</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ── customer 360 sections ─────────────────────────────────────────────── */
export function SubscriptionCard({ c, className = '' }) {
  const { plans } = usePlans();
  const plan = plans.find((p) => p.key === c.plan_key);
  const td = daysUntil(c.trial_ends_at);
  const trialish = c.status === 'trialing' || c.status === 'expired';
  return (
    <section className={`x-card x-sub ${className}`} aria-labelledby={`sub-${c.org_id}`}>
      <div className="x-card-head"><h3 id={`sub-${c.org_id}`}>מנוי</h3><span className="x-chip">{c.billing_cycle === 'yearly' ? 'שנתי' : 'חודשי'} · {c.provider === 'manual' ? 'ידני' : c.provider}</span></div>
      <p className="x-sub-plan">{plan?.name || c.plan_key}<span className="adm-num">{money(monthlyValue(c, plans))} לחודש{c.price_ils != null ? ' · מחיר מיוחד' : ''}</span></p>
      <dl className="x-dl x-dl--row">
        <div><dt>{trialish ? 'סוף ניסיון' : 'חידוש'}</dt><dd>{trialish ? date(c.trial_ends_at) : c.current_period_end ? date(c.current_period_end) : '—'}</dd></div>
        {trialish && td != null ? <div><dt>נותרו</dt><dd className="adm-num">{td > 0 ? `${td} ימים` : 'הסתיים'}</dd></div> : null}
        <div><dt>הצטרפו</dt><dd>{date(c.created_at, { year: true })}</dd></div>
      </dl>
    </section>
  );
}

export function ContactCard({ c, data }) {
  const owner = (data?.members || []).find((m) => m.is_owner);
  return (
    <section className="x-card" aria-labelledby={`contact-${c.org_id}`}>
      <h3 id={`contact-${c.org_id}`}>בעלים ופרטי קשר</h3>
      <dl className="x-dl">
        <div><dt>בעלים</dt><dd>{c.owner_name || '—'}</dd></div>
        <div><dt>אימייל</dt><dd><span className="adm-ltr">{c.owner_email || '—'}</span>{c.email_confirmed === false || owner?.email_confirmed === false ? <span className="x-flag">לא אומת</span> : null}</dd></div>
        <div><dt>טלפון</dt><dd className="adm-ltr">{fmtPhone(c.owner_phone) || '—'}</dd></div>
        <div><dt>כניסה אחרונה</dt><dd>{'last_sign_in_at' in c ? (c.last_sign_in_at ? relTime(c.last_sign_in_at) : 'לא נכנסו מעולם') : relTime(c.last_active_at)}</dd></div>
        <div><dt>פעילות אחרונה</dt><dd>{relTime(c.last_active_at)}</dd></div>
        <div><dt>הגדרה ראשונית</dt><dd>{c.onboarding_completed ? 'הושלמה' : 'לא הושלמה'}</dd></div>
      </dl>
    </section>
  );
}

export function UsageCard({ data }) {
  const u = data.usage;
  return (
    <section className="x-card" aria-labelledby="h-usage">
      <div className="x-card-head"><h3 id="h-usage">שימוש</h3><span className="x-muted x-small">6 חודשים</span></div>
      <div className="x-stats">
        <div><b className="adm-num">{data.units.length}</b><span>יחידות</span></div>
        <div><b className="adm-num">{u.bookings_total}</b><span>הזמנות</span></div>
        <div><b className="adm-num">{u.bookings_30d}</b><span>ב-30 יום</span></div>
        <div><b className="adm-num">{data.counts?.leads ?? u.leads_total}</b><span>לידים</span></div>
        {data.counts ? <div><b className="adm-num">{data.counts.invoices}</b><span>קבלות</span></div> : null}
        <div><b className="adm-num">{money(u.revenue_ils)}</b><span>הזמנות בש״ח</span></div>
      </div>
      <div className="x-chart" dir="ltr">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={u.by_month.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} reversed interval={0} />
            <Tooltip cursor={{ fill: 'rgba(62,43,241,0.06)', radius: 8 }} content={({ active, payload, label }) => (active && payload?.length ? <div className="b-tip"><b>{label}</b><span>{payload[0].value} הזמנות</span></div> : null)} />
            <Bar dataKey="bookings" radius={[6, 6, 6, 6]} maxBarSize={24} fill="#3E2BF1" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const PENDING_023 = <p className="x-muted x-small">יוצג אחרי עדכון מסד הנתונים (מיגרציה 023).</p>;

export function ConnectionsCard({ data }) {
  const syncs = data.calendar_syncs;
  const wa = data.whatsapp;
  return (
    <section className="x-card" aria-labelledby="h-conn">
      <h3 id="h-conn">חיבורים</h3>
      <h4 className="x-sub-h"><CalendarDays size={15} strokeWidth={1.75} aria-hidden />סנכרון יומנים (iCal)</h4>
      {!data.v2 ? PENDING_023 : syncs.length ? (
        <ul className="x-list">
          {syncs.map((s) => {
            const fresh = s.last_success_at && Date.now() - new Date(s.last_success_at).getTime() < 2 * 3600e3;
            const ok = s.is_active && !s.error_message && fresh;
            return (
              <li key={s.id}>
                <span className="x-list-main"><b>{s.label || s.provider}</b><span>{s.property || ''}{s.events_count ? ` · ${s.events_count} אירועים` : ''}</span></span>
                <Health ok={!s.is_active ? null : ok} label={!s.is_active ? 'מושהה' : s.error_message ? `שגיאה: ${s.error_message}` : s.last_success_at ? `סונכרן ${relTime(s.last_success_at)}` : 'עוד לא סונכרן'} />
              </li>
            );
          })}
        </ul>
      ) : <p className="x-muted">לא חוברו יומנים של Airbnb / Booking.</p>}
      <h4 className="x-sub-h"><MessageCircle size={15} strokeWidth={1.75} aria-hidden />וואטסאפ</h4>
      {!data.v2 ? PENDING_023 : wa ? (
        <div className="x-wa">
          <Health ok={wa.host_phone ? (wa.setup_done ? true : null) : false} label={wa.host_phone ? (wa.setup_done ? 'מוכן לשליחה בלחיצה' : 'מספר נשמר, ההגדרה לא הושלמה') : 'לא הוגדר מספר'} />
          <span className="x-muted x-small adm-num">{wa.sent_30d} נשלחו ב-30 יום · {wa.queue_pending} ממתינות{wa.failed_30d ? ` · ${wa.failed_30d} נכשלו` : ''}</span>
        </div>
      ) : <p className="x-muted">אין נתונים.</p>}
    </section>
  );
}

export function TeamCard({ data, onReset }) {
  const { can } = useAdmin();
  if (!data.v2) return <section className="x-card" aria-labelledby="h-team"><h3 id="h-team">צוות הלקוח</h3>{PENDING_023}</section>;
  return (
    <section className="x-card" aria-labelledby="h-team">
      <div className="x-card-head"><h3 id="h-team">צוות הלקוח</h3><span className="x-muted x-small adm-num">{data.members.length}</span></div>
      <ul className="x-list">
        {data.members.map((m) => (
          <li key={m.user_id}>
            <span className="x-av" aria-hidden>{initials(m.full_name || m.email)}</span>
            <span className="x-list-main"><b>{m.full_name || m.email?.split('@')[0]}{m.is_owner ? <span className="x-chip x-chip--soft">בעלים</span> : null}{m.is_staff ? <span className="x-chip x-chip--soft">צוות atlas</span> : null}</b><span><span className="adm-ltr">{m.email}</span> · {m.last_sign_in_at ? `נכנס/ה ${relTime(m.last_sign_in_at)}` : 'לא נכנס/ה מעולם'}{m.email_confirmed ? '' : ' · לא אימת/ה אימייל'}</span></span>
            {can('admin') && !m.is_staff ? <button type="button" className="x-link-btn" onClick={() => onReset(m)}>{m.email_confirmed ? 'איפוס סיסמה' : 'שליחת אימות'}</button> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PaymentsCard({ data }) {
  return (
    <section className="x-card" aria-labelledby="h-pay">
      <div className="x-card-head"><h3 id="h-pay">תשלומים ל-atlas</h3><span className="x-muted x-small adm-num">{data.charges.length}</span></div>
      {data.charges.length ? (
        <ul className="x-list">
          {data.charges.slice(0, 10).map((x) => (
            <li key={x.id}>
              <span className="x-list-main"><b className="adm-num">{money(x.amount_ils)}</b><span>{date(x.paid_at || x.created_at)} · {METHODS[x.method] || x.method}{x.invoice_number ? ` · ${x.invoice_number}` : ''}{x.failure_reason ? ` · ${x.failure_reason}` : ''}</span></span>
              <ChargePill status={x.status} />
            </li>
          ))}
        </ul>
      ) : <p className="x-muted">עוד לא נרשמו תשלומים. אין ספק סליקה מחובר, תשלומים נרשמים ידנית.</p>}
    </section>
  );
}

export function ActivityCard({ data, limit = 8 }) {
  return (
    <section className="x-card" aria-labelledby="h-act2">
      <h3 id="h-act2">יומן פעולות על הלקוח</h3>
      {data.audit.length ? (
        <ol className="x-tl">
          {data.audit.slice(0, limit).map((a) => (
            <li key={a.id}><b>{AUDIT_ACTIONS[a.action] || a.action}</b>{auditDetail(a) ? <span>{auditDetail(a)}</span> : null}<time dateTime={a.created_at}>{relTime(a.created_at)} · {a.actor_email?.split('@')[0]}</time></li>
          ))}
        </ol>
      ) : <p className="x-muted">אין פעולות עדיין.</p>}
    </section>
  );
}

export function NotesCard({ c, data }) {
  return (
    <section className="x-card" aria-labelledby="h-notes2">
      <h3 id="h-notes2"><StickyNote size={15} strokeWidth={1.75} aria-hidden />הערות פנימיות</h3>
      <NotesBox orgId={c.org_id} notes={data.notes} />
    </section>
  );
}

export function UnitsCard({ data }) {
  return (
    <section className="x-card" aria-labelledby="h-units2">
      <div className="x-card-head"><h3 id="h-units2">יחידות</h3><span className="x-muted x-small adm-num">{data.units.length}</span></div>
      {data.units.length ? (
        <ul className="x-units">{data.units.map((u) => <li key={u.id}><b>{u.name}</b><span>{u.max_guests ? `${u.max_guests} אורחים` : ''}{u.base_price ? ` · ${money(u.base_price)}` : ''}</span></li>)}</ul>
      ) : <p className="x-muted">עוד לא נוספו יחידות.</p>}
    </section>
  );
}

/** Read-only "view as": what the owner sees today, no guest PII. Opening it writes an audit row. */
export function ViewAsCard({ c, data }) {
  useEffect(() => { logEvent('customer.view_as', c.org_id, { surface: 'today' }); }, [c.org_id]);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = data.recent_bookings.filter((b) => (b.check_out_date || '') >= today);
  return (
    <section className="x-card x-viewas" aria-labelledby="h-va2">
      <div className="x-card-head"><h3 id="h-va2"><Eye size={15} strokeWidth={1.75} aria-hidden />צפייה כלקוח</h3><span className="x-chip">קריאה בלבד · נרשם ביומן</span></div>
      <p className="x-muted x-small">מה {displayName(c)} רואים היום במסך הבית. אורחים מוצגים בראשי תיבות בלבד, בלי טלפונים ואימיילים.</p>
      <div className="x-va-grid">
        <div><b className="adm-num">{upcoming.length}</b><span>הזמנות קרובות</span></div>
        <div><b className="adm-num">{data.units.length}</b><span>יחידות</span></div>
        <div><b className="adm-num">{data.whatsapp?.queue_pending ?? '—'}</b><span>הודעות להכנה</span></div>
      </div>
      {data.recent_bookings.length ? (
        <ul className="x-list">
          {data.recent_bookings.slice(0, 6).map((b) => (
            <li key={b.id}>
              <span className="x-av" aria-hidden>{b.guest_initials || '·'}</span>
              <span className="x-list-main"><b>{b.unit || 'יחידה'}</b><span>{date(b.check_in_date, { weekday: true })} עד {date(b.check_out_date)}{b.source ? ` · ${b.source}` : ''}</span></span>
              <b className="adm-num">{b.total_price ? money(b.total_price) : '—'}</b>
            </li>
          ))}
        </ul>
      ) : <p className="x-muted">אין הזמנות להצגה.</p>}
    </section>
  );
}

/* ── actions ───────────────────────────────────────────────────────────── */
export function useCustomerActions(c) {
  const { can } = useAdmin();
  const [kind, setKind] = useState(null);       // trial | plan | charge | suspend (existing dialogs)
  const [mail, setMail] = useState(null);       // member for reset / confirmation
  const [del, setDel] = useState(false);
  const [viewAs, setViewAs] = useState(false);
  const v2 = useV2Actions();
  const t = testInfo(c || {});
  const list = c ? [
    { k: 'trial', label: 'הארכת ניסיון', icon: CalendarPlus, on: () => setKind('trial'), role: 'admin' },
    { k: 'plan', label: 'שינוי חבילה', icon: Repeat, on: () => setKind('plan'), role: 'admin' },
    { k: 'charge', label: 'רישום תשלום', icon: Wallet, on: () => setKind('charge'), role: 'admin' },
    { k: 'suspend', label: c.suspended_at ? 'הפעלה מחדש' : 'השהיה', icon: c.suspended_at ? PlayCircle : PauseCircle, on: () => setKind('suspend'), role: 'admin' },
    { k: 'reset', label: 'איפוס סיסמה / אימות', icon: KeyRound, on: () => setMail({ email: c.owner_email, email_confirmed: c.email_confirmed !== false, is_owner: true }), role: 'admin' },
    { k: 'viewas', label: viewAs ? 'סגירת צפייה כלקוח' : 'צפייה כלקוח', icon: Eye, on: () => setViewAs((v) => !v), role: 'support', pressed: viewAs },
    { k: 'export', label: 'ייצוא הלקוח (JSON)', icon: Download, on: () => v2.exportOne.mutate({ orgId: c.org_id, name: displayName(c) }), role: 'admin', busy: v2.exportOne.isPending },
    { k: 'test', label: t.is_test ? 'סימון כלקוח אמיתי' : 'סימון כחשבון בדיקה', icon: FlaskConical, on: () => v2.setTestFlag.mutate({ orgId: c.org_id, isTest: !t.is_test }), role: 'admin' },
  ].map((a) => ({ ...a, disabled: !can(a.role) || a.busy })) : [];
  return { list, kind, setKind, mail, setMail, del, setDel, viewAs, setViewAs, canDelete: can('owner') };
}

export function MailDialog({ c, member, onClose }) {
  const v2 = useV2Actions();
  const [done, setDone] = useState(null);
  const confirmed = member?.email_confirmed !== false;
  useEffect(() => { setDone(null); }, [member]);
  const send = (which) => {
    const m = which === 'reset' ? v2.passwordReset : v2.resendConfirmation;
    m.mutate({ orgId: c.org_id, email: member.email }, { onSuccess: (r) => setDone({ which, email: r?.email || member.email }) });
  };
  const busy = v2.passwordReset.isPending || v2.resendConfirmation.isPending;
  return (
    <Modal open={Boolean(member)} onOpenChange={(o) => !o && onClose()} title="שליחת אימייל לכניסה" sub={<>אל <span className="adm-ltr">{member?.email}</span>. המייל יוצא מ-noreply@atlas-il.com ונרשם ביומן.</>}>
      {done ? (
        <div className="x-done" role="status"><Check size={18} strokeWidth={2} aria-hidden />{done.which === 'reset' ? 'נשלח מייל לאיפוס סיסמה' : 'נשלח שוב מייל אימות'} אל <span className="adm-ltr">{done.email}</span>.</div>
      ) : (
        <div className="x-mail-opts">
          <button type="button" className="x-opt" disabled={busy} onClick={() => send('reset')}><KeyRound size={18} strokeWidth={1.75} aria-hidden /><span><b>איפוס סיסמה</b><small>קישור לבחירת סיסמה חדשה. מתאים כשהלקוח לא מצליח להיכנס.</small></span></button>
          <button type="button" className="x-opt" disabled={busy || confirmed} onClick={() => send('confirm')}><Mail size={18} strokeWidth={1.75} aria-hidden /><span><b>שליחה חוזרת של מייל אימות</b><small>{confirmed ? 'האימייל כבר אומת.' : 'למי שנרשם ולא אישר את המייל.'}</small></span></button>
        </div>
      )}
      <div className="adm-dialog-actions"><button type="button" className="adm-btn adm-btn--quiet" onClick={onClose}>סגירה</button></div>
    </Modal>
  );
}

/* ── danger zone + delete flow ─────────────────────────────────────────── */
export function DangerZone({ c, onSuspend, onDelete, canDelete }) {
  return (
    <section className="x-card x-danger" aria-labelledby={`dz-${c.org_id}`}>
      <h3 id={`dz-${c.org_id}`}><ShieldAlert size={16} strokeWidth={1.75} aria-hidden />אזור מסוכן</h3>
      <div className="x-danger-row">
        <div><b>{c.suspended_at ? 'הפעלת החשבון מחדש' : 'השהיית החשבון'}</b><p>{c.suspended_at ? 'הלקוח יחזור לעבוד כרגיל.' : 'הלקוח לא יוכל לעבוד במערכת, וכל הנתונים נשמרים. אפשר לבטל בכל רגע. זו הדרך הבטוחה.'}</p></div>
        <button type="button" className="adm-btn" onClick={onSuspend}>{c.suspended_at ? 'הפעלה מחדש' : 'השהיה'}</button>
      </div>
      <div className="x-danger-row">
        <div><b>מחיקת הלקוח לצמיתות</b><p>העסק, היחידות, ההזמנות, הלידים, הקבלות, הקבצים וחשבונות הכניסה נמחקים. לפני כן יורד גיבוי מלא.</p></div>
        <button type="button" className="adm-btn adm-btn--danger" onClick={onDelete} disabled={!canDelete} title={canDelete ? undefined : 'רק בעלים יכולים למחוק לקוח'}><Trash2 size={16} strokeWidth={1.75} aria-hidden />מחיקה</button>
      </div>
      {!canDelete ? <p className="x-muted x-small">מחיקה זמינה רק להרשאת בעלים.</p> : null}
    </section>
  );
}

const GROUPS = [
  ['org', 'העסק והגדרות'], ['users', 'משתמשים וכניסות'], ['units', 'יחידות'], ['bookings', 'הזמנות'], ['leads', 'לידים'],
  ['money', 'כסף: תשלומי אורחים, קבלות, הוצאות'], ['messages', 'הודעות'], ['ops', 'תפעול, חוזים וחיבורי iCal'],
  ['integrations', 'חיבורים חיצוניים'], ['atlas', 'נתוני atlas: מנוי, חיובים, הערות, תמיכה'],
];

export function DeleteFlow({ c, open, onOpenChange, onSuspend, onDeleted }) {
  const [step, setStep] = useState('choose');
  const qc = useQueryClient();
  /* After a delete the cached list still holds the customer: drop it from the cache, then leave. */
  const finish = () => { qc.removeQueries({ queryKey: ['admin', 'customer', c.org_id] }); qc.invalidateQueries({ queryKey: ['admin'] }); onOpenChange(false); onDeleted?.(); };
  const [pv, setPv] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState(null);
  const [typed, setTyped] = useState('');
  const [ack, setAck] = useState(false);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState(null);
  useEffect(() => { if (open) { setStep('choose'); setPv(null); setErr(null); setBackup(null); setTyped(''); setAck(false); setReason(''); setResult(null); } }, [open]);
  const name = displayName(c);
  const norm = (s) => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
  const target = pv?.org_name || pv?.owner_email || name;
  const matches = Boolean(typed) && [pv?.org_name, pv?.owner_email].filter(Boolean).map(norm).includes(norm(typed));

  const step1 = async () => {
    setBusy(true); setErr(null);
    try { setPv(await adminApi.customerOp('preview', c.org_id)); setStep('preview'); } catch (e) { setErr(heMessage(e)); } finally { setBusy(false); }
  };
  const step2 = async () => {
    setBusy(true); setErr(null);
    try {
      const data = await adminApi.customerOp('export', c.org_id);
      const file = `atlas-backup-${slug(name)}-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(file, data);
      const rows = Object.values(data.tables || {}).reduce((s, t) => s + t.length, 0);
      setBackup({ file, rows });
      setStep('confirm');
    } catch (e) { setErr(heMessage(e)); } finally { setBusy(false); }
  };
  const run = async () => {
    setBusy(true); setErr(null); setStep('running');
    try {
      const r = await adminApi.customerOp('delete', c.org_id, { confirm: typed, acknowledge: ack, fingerprint: pv.fingerprint, reason: reason || null });
      setResult(r); setStep('done');
    } catch (e) { setErr(heMessage(e)); setStep('confirm'); } finally { setBusy(false); }
  };
  const lines = pv ? GROUPS.map(([g, label]) => {
    const n = Object.entries(pv.counts).filter(([t]) => TABLE_GROUP[t] === g).reduce((s, [, v]) => s + v, 0);
    return { g, label, n };
  }).filter((x) => x.n > 0 || x.g === 'users') : [];

  return (
    <Modal open={open} onOpenChange={(o) => { if (busy) return; if (!o && step === 'done') finish(); else onOpenChange(o); }} title={step === 'done' ? 'הלקוח נמחק' : `מחיקת ${name}`} sub={step === 'done' ? null : 'מחיקה סופית. שום דבר מזה לא חוזר מתוך המערכת.'}>
      <ol className="x-steps" aria-label="שלבים">
        {[['choose', 'בחירה'], ['preview', 'מה יימחק'], ['backup', 'גיבוי'], ['confirm', 'אישור']].map(([k, l], i) => (
          <li key={k} data-state={stepIndex(step) > i ? 'done' : stepIndex(step) === i ? 'now' : 'next'}><span className="adm-num">{i + 1}</span>{l}</li>
        ))}
      </ol>
      {err ? <p className="x-err" role="alert"><AlertTriangle size={16} strokeWidth={2} aria-hidden />{err}</p> : null}

      {step === 'choose' ? (
        <div className="x-flow">
          <div className="x-safer">
            <PauseCircle size={20} strokeWidth={1.75} aria-hidden />
            <div><b>אולי השהיה מספיקה?</b><p>השהיה חוסמת את הגישה ושומרת הכל. אפשר לבטל אותה בלחיצה. מחיקה מתאימה לבקשת מחיקה של הלקוח או לחשבון בדיקה.</p></div>
          </div>
          <div className="adm-dialog-actions">
            {!c.suspended_at ? <button type="button" className="adm-btn adm-btn--primary" onClick={() => { onSuspend(); onOpenChange(false); }}>השהיה במקום</button> : null}
            <button type="button" className="adm-btn adm-btn--danger" onClick={step1} disabled={busy}>{busy ? <Loader2 size={16} className="x-spin" aria-hidden /> : null}להמשיך למחיקה</button>
          </div>
        </div>
      ) : null}

      {step === 'preview' && pv ? (
        <div className="x-flow">
          {pv.blocked ? <p className="x-err" role="alert"><ShieldAlert size={16} strokeWidth={2} aria-hidden />בחשבון הזה יש איש צוות של atlas ({pv.staff.join(', ')}). אי אפשר למחוק אותו מכאן.</p> : null}
          <ul className="x-will">
            {lines.map((x) => (
              <li key={x.g}>
                <span>{x.label}</span>
                <b className="adm-num">{x.g === 'users' ? `${pv.auth_users.length} ${pv.auth_users.length === 1 ? 'כניסה' : 'כניסות'}` : x.n}</b>
                {x.g === 'users' && pv.auth_users.length ? <small className="adm-ltr">{pv.auth_users.join(', ')}</small> : null}
              </li>
            ))}
            <li><span>קבצים ותמונות</span><b className="adm-num">{pv.files}</b></li>
          </ul>
          {pv.warnings.includes('platform_charges') ? <p className="x-warn"><AlertTriangle size={16} strokeWidth={2} aria-hidden />ללקוח יש חיובים של atlas. הם נשמרים בגיבוי. חשבוניות שהנפקתם צריך לשמור גם בהנהלת החשבונות.</p> : null}
          {pv.warnings.includes('invoices') ? <p className="x-warn"><AlertTriangle size={16} strokeWidth={2} aria-hidden />ללקוח יש קבלות שהנפיק לאורחים. הן נמחקות מכאן ונשמרות רק בגיבוי.</p> : null}
          <p className="x-muted x-small">היומן של atlas שומר שורה על המחיקה (מי, מתי, כמה). אין בה תוכן של הלקוח.</p>
          <div className="adm-dialog-actions">
            <button type="button" className="adm-btn adm-btn--primary" onClick={step2} disabled={busy || Boolean(pv.blocked)}>{busy ? <Loader2 size={16} className="x-spin" aria-hidden /> : <Download size={16} strokeWidth={1.75} aria-hidden />}הורדת גיבוי והמשך</button>
            <button type="button" className="adm-btn adm-btn--quiet" onClick={() => onOpenChange(false)}>ביטול</button>
          </div>
        </div>
      ) : null}

      {step === 'confirm' ? (
        <form className="x-flow" onSubmit={(e) => { e.preventDefault(); if (matches && ack) run(); }}>
          {backup ? <p className="x-done"><Check size={16} strokeWidth={2} aria-hidden />הגיבוי ירד למחשב: <span className="adm-ltr">{backup.file}</span> ({backup.rows} רשומות). עותק מלא נוסף נשמר בשרת לפני המחיקה.</p> : null}
          <Field label={<>כדי לאשר, הקלידו את שם העסק: <b className="x-target">{target}</b></>}>
            <input className="adm-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} aria-invalid={typed && !matches ? 'true' : undefined} />
          </Field>
          <Field label="סיבה (אופציונלי, נשמרת ביומן)"><input className="adm-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="למשל: הלקוח ביקש מחיקה" /></Field>
          <label className="adm-check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />הבנתי שהמחיקה סופית, ושאפשר לשחזר רק מקובץ הגיבוי</label>
          <div className="adm-dialog-actions">
            <button type="submit" className="adm-btn adm-btn--danger adm-btn--solid" disabled={!matches || !ack || busy}><Trash2 size={16} strokeWidth={1.75} aria-hidden />מחיקה לצמיתות</button>
            <button type="button" className="adm-btn adm-btn--quiet" onClick={() => onOpenChange(false)}>ביטול</button>
          </div>
        </form>
      ) : null}

      {step === 'running' ? <div className="x-running" role="status"><Loader2 size={22} className="x-spin" aria-hidden />שומרים גיבוי בשרת ומוחקים…</div> : null}

      {step === 'done' && result ? (
        <div className="x-flow">
          <p className="x-done"><Check size={18} strokeWidth={2} aria-hidden />{name} נמחק{result.partial ? ' חלקית' : ''}. {result.users_deleted?.length || 0} כניסות נמחקו.</p>
          {result.partial ? <p className="x-warn"><AlertTriangle size={16} strokeWidth={2} aria-hidden />לא הכל נמחק: {result.failures.join(', ')}. הפרטים ביומן הפעולות.</p> : null}
          <dl className="x-dl"><div><dt>גיבוי בשרת</dt><dd className="adm-ltr">{result.backup_path}</dd></div></dl>
          <div className="adm-dialog-actions">
            {result.backup_url ? <a className="adm-btn" href={result.backup_url}><Download size={16} strokeWidth={1.75} aria-hidden />הורדת הגיבוי מהשרת</a> : null}
            <button type="button" className="adm-btn adm-btn--primary" onClick={finish}>חזרה ללקוחות</button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
const stepIndex = (s) => ({ choose: 0, preview: 1, backup: 2, confirm: 3, running: 3, done: 4 }[s] ?? 0);
const TABLE_GROUP = {
  organizations: 'org', profiles: 'users', users: 'users', audit_log: 'users', contact_messages: 'users',
  properties: 'units', units: 'units', bookings: 'bookings', leads: 'leads',
  payments: 'money', invoices: 'money', expenses: 'money', messages: 'messages', message_logs: 'messages', message_queue: 'messages',
  cleaning_tasks: 'ops', calendar_syncs: 'ops', automation_rules: 'ops', contract_templates: 'ops', contract_instances: 'ops', review_requests: 'ops', guest_requests: 'ops',
  messaging_integrations: 'integrations', accounting_integrations: 'integrations', pms_integrations: 'integrations', payment_gateways: 'integrations',
  subscriptions: 'atlas', support_conversations: 'atlas', support_messages: 'atlas', platform_subscriptions: 'atlas', platform_charges: 'atlas', platform_customer_notes: 'atlas', platform_org_flags: 'atlas',
};

export function ContactButtons({ c }) {
  const { wa, mail } = contactLinks(c);
  return (
    <>
      {wa ? <a className="x-pill-btn" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} strokeWidth={1.75} aria-hidden />וואטסאפ</a> : null}
      {mail ? <a className="x-pill-btn" href={mail}><Mail size={16} strokeWidth={1.75} aria-hidden />אימייל</a> : null}
    </>
  );
}
