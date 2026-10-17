import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts';
import { Search, Download, MessageCircle, Mail, ChevronRight, ArrowUp, ArrowDown, Eye, MoreHorizontal, AlertCircle } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { PageHead } from './Shell';
import { useOverview, useCustomers, useCustomer, usePlans, useAdmin } from '../hooks';
import { StatusPill, ChargePill, Pill, Skel, money, moneyK, date, pct, contactLinks } from '../ui';
import { STATUS, STATUS_ORDER, METHODS, AUDIT_ACTIONS } from '../config';
import { relTime, daysUntil, fmtPhone, monthlyValue, monthLabel } from '../metrics';
import { useCustomerFilters, customerCsv, NotesBox, auditDetail } from '../shared';
import { downloadCsv } from '../csv';
import { CustomerDialogs } from '../dialogs';

const STATUS_COLOR = { active: '#3E2BF1', trialing: '#8B80F7', past_due: '#EF5B5B', expired: '#C9CEDD', churned: '#8C93AB', suspended: '#1B2656' };

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <div className="a-card a-error" role="alert">
      <AlertCircle size={18} strokeWidth={1.75} aria-hidden />
      <span>{error.message || 'לא הצלחנו לטעון את הנתונים'}</span>
    </div>
  );
}

function ChartTip({ active, payload, label, kind }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="a-tip">
      <b>{label}</b>
      <span>{kind === 'money' ? money(v) : `${v} הרשמות`}</span>
    </div>
  );
}

/* ── Overview ──────────────────────────────────────────────────────────── */
export function Overview() {
  const { data, isLoading, error, plans } = useOverview();
  const [tab, setTab] = useState('signups');
  const segs = data ? STATUS_ORDER.map((s) => ({ s, n: data.counts[s] || 0 })).filter((x) => x.n) : [];
  return (
    <>
      <PageHead title="סקירה" sub={data ? `${data.counts.total} לקוחות · ${data.paying} משלמים` : ' '} />
      <ErrorNote error={error} />
      <section className="a-card a-kpis" aria-label="מדדים עיקריים">
        {[
          { label: 'MRR', value: data && money(data.mrr), sub: data && (data.atRisk ? `${money(data.atRisk)} בסיכון` : 'הכנסה חודשית חוזרת') },
          { label: 'ARR', value: data && moneyK(data.arr), sub: 'MRR × 12' },
          { label: 'לקוחות פעילים', value: data && String(data.paying), sub: data && `${data.counts.trialing || 0} בניסיון כרגע` },
          { label: 'המרה מניסיון לתשלום', value: data && pct(data.conversion), sub: data && `${data.convertedCount} מתוך ${data.trialEndedCount} שסיימו ניסיון` },
        ].map((k) => (
          <div key={k.label} className="a-kpi">
            <p className="a-kpi-label">{k.label}</p>
            {isLoading ? <Skel w={120} h={30} /> : <p className="a-kpi-value adm-num">{k.value}</p>}
            {isLoading ? <Skel w={90} h={12} style={{ marginTop: 8 }} /> : <p className="a-kpi-sub">{k.sub}</p>}
          </div>
        ))}
      </section>

      <section className="a-card a-mix" aria-labelledby="mix-h">
        <div className="a-card-head">
          <h2 id="mix-h">מצב הלקוחות</h2>
          <Link className="a-link" to="/admin/customers">לכל הלקוחות</Link>
        </div>
        {data ? (
          <>
            <div className="a-mixbar" role="img" aria-label={segs.map((x) => `${STATUS[x.s].label} ${x.n}`).join(', ')}>
              {segs.map((x) => <span key={x.s} style={{ flexGrow: x.n, background: STATUS_COLOR[x.s] }} />)}
            </div>
            <ul className="a-legend">
              {STATUS_ORDER.map((s) => (
                <li key={s}>
                  <Link to={`/admin/customers?status=${s}`}>
                    <i style={{ background: STATUS_COLOR[s] }} aria-hidden />
                    <span>{STATUS[s].label}</span>
                    <b className="adm-num">{data.counts[s] || 0}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : <Skel h={40} />}
      </section>

      <div className="a-grid-2">
        <section className="a-card a-chart" aria-labelledby="chart-h">
          <div className="a-card-head">
            <h2 id="chart-h">{tab === 'signups' ? 'הרשמות לפי חודש' : 'הכנסות שנגבו לפי חודש'}</h2>
            <div className="adm-seg" role="tablist" aria-label="גרף">
              <button type="button" role="tab" aria-selected={tab === 'signups'} onClick={() => setTab('signups')}>הרשמות</button>
              <button type="button" role="tab" aria-selected={tab === 'collected'} onClick={() => setTab('collected')}>הכנסות</button>
            </div>
          </div>
          <div className="a-chart-box" dir="ltr">
            {data ? (
              <ResponsiveContainer width="100%" height={240}>
                {tab === 'signups' ? (
                  <BarChart data={data.series} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#EEF0F6" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#646B85', fontSize: 12, fontFamily: 'Heebo' }} reversed />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} orientation="right" tick={{ fill: '#646B85', fontSize: 12, fontFamily: 'Heebo' }} />
                    <Tooltip cursor={{ fill: '#F1EFFE' }} content={<ChartTip />} />
                    <Bar dataKey="signups" fill="#3E2BF1" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                  </BarChart>
                ) : (
                  <AreaChart data={data.series} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="a-coll" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3E2BF1" stopOpacity={0.16} />
                        <stop offset="100%" stopColor="#3E2BF1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#EEF0F6" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#646B85', fontSize: 12, fontFamily: 'Heebo' }} reversed />
                    <YAxis tickLine={false} axisLine={false} width={44} orientation="right" tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)} tick={{ fill: '#646B85', fontSize: 12, fontFamily: 'Heebo' }} />
                    <Tooltip cursor={{ stroke: '#C9C3FB' }} content={<ChartTip kind="money" />} />
                    <Area dataKey="collected" stroke="#3E2BF1" strokeWidth={2} fill="url(#a-coll)" isAnimationActive={false} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : <Skel h={240} />}
          </div>
          {data ? (
            <p className="a-chart-foot">
              {tab === 'signups'
                ? `החודש: ${data.thisMonth.signups} הרשמות · חודש קודם: ${data.prevMonth.signups}`
                : `החודש: ${money(data.thisMonth.collected)} · חודש קודם: ${money(data.prevMonth.collected)}`}
            </p>
          ) : null}
        </section>

        <section className="a-card" aria-labelledby="att-h">
          <div className="a-card-head"><h2 id="att-h">דורש תשומת לב</h2></div>
          {data ? (
            data.failed.length + data.trialsEndingSoon.length === 0 ? (
              <p className="a-empty">הכל בסדר. אין תשלומים שנכשלו ואין ניסיונות שמסתיימים השבוע.</p>
            ) : (
              <ul className="a-list">
                {data.failed.slice(0, 4).map((x) => (
                  <li key={x.id}>
                    <Link to={`/admin/customers/${x.org_id}`} className="a-list-row">
                      <span className="a-list-main"><b>{x.org_name}</b><span>תשלום נכשל · {x.failure_reason || ''}</span></span>
                      <span className="a-list-end adm-num">{money(x.amount_ils)}</span>
                    </Link>
                  </li>
                ))}
                {data.trialsEndingSoon.slice(0, 4).map((c) => {
                  const d = daysUntil(c.trial_ends_at);
                  return (
                    <li key={c.org_id}>
                      <Link to={`/admin/customers/${c.org_id}`} className="a-list-row">
                        <span className="a-list-main"><b>{c.org_name}</b><span>{d <= 0 ? 'הניסיון מסתיים היום' : d === 1 ? 'הניסיון מסתיים מחר' : `הניסיון מסתיים בעוד ${d} ימים`}</span></span>
                        <span className="a-list-end"><Pill tone="sky">ניסיון</Pill></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )
          ) : <Skel h={160} />}
        </section>
      </div>

      <div className="a-grid-2">
        <section className="a-card" aria-labelledby="new-h">
          <div className="a-card-head"><h2 id="new-h">הצטרפו לאחרונה</h2></div>
          {data ? (
            <ul className="a-list">
              {data.newest.map((c) => (
                <li key={c.org_id}>
                  <Link to={`/admin/customers/${c.org_id}`} className="a-list-row">
                    <span className="a-list-main"><b>{c.org_name}</b><span>{c.owner_name || c.owner_email} · {relTime(c.created_at)}</span></span>
                    <span className="a-list-end"><StatusPill status={c.status} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Skel h={160} />}
        </section>
        <section className="a-card" aria-labelledby="plan-h">
          <div className="a-card-head"><h2 id="plan-h">MRR לפי חבילה</h2><Link className="a-link" to="/admin/plans">חבילות</Link></div>
          {data ? (
            <table className="a-table a-table--plain">
              <thead><tr><th scope="col">חבילה</th><th scope="col" className="num">משלמים</th><th scope="col" className="num">MRR</th></tr></thead>
              <tbody>
                {data.byPlan.map((p) => (
                  <tr key={p.key}><td>{p.name} <span className="a-muted">· {money(plans.find((x) => x.key === p.key)?.price_monthly)}</span></td><td className="num adm-num">{p.customers}</td><td className="num adm-num">{money(p.mrr)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <Skel h={120} />}
        </section>
      </div>
    </>
  );
}

/* ── Customers ─────────────────────────────────────────────────────────── */
function SortTh({ k, label, f, className = '' }) {
  const active = f.sort.key === k;
  const Icon = f.sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className={className} aria-sort={active ? (f.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="a-th-btn" onClick={() => f.toggleSort(k)}>
        {label}{active ? <Icon size={13} strokeWidth={2} aria-hidden /> : null}
      </button>
    </th>
  );
}

export function Customers() {
  const { data, isLoading, error } = useCustomers();
  const { plans } = usePlans();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const f = useCustomerFilters(data || [], sp.get('status'));
  const planName = (k) => plans.find((p) => p.key === k)?.name || k;
  return (
    <>
      <PageHead
        title="לקוחות"
        sub={data ? `${f.rows.length} מתוך ${data.length}` : ' '}
        actions={<button type="button" className="adm-btn" onClick={() => downloadCsv(`atlas-customers-${new Date().toISOString().slice(0, 10)}.csv`, f.rows, customerCsv(plans))} disabled={!f.rows.length}><Download size={16} strokeWidth={1.75} aria-hidden />ייצוא CSV</button>}
      />
      <ErrorNote error={error} />
      <div className="a-toolbar">
        <label className="a-search">
          <Search size={16} strokeWidth={1.75} aria-hidden />
          <span className="adm-sr">חיפוש לקוח</span>
          <input className="adm-input" type="search" value={f.q} onChange={(e) => f.setQ(e.target.value)} placeholder="חיפוש לפי עסק, בעלים, אימייל או טלפון" />
        </label>
        <label className="a-plan-filter">
          <span className="adm-sr">חבילה</span>
          <select className="adm-select" value={f.plan} onChange={(e) => f.setPlan(e.target.value)}>
            <option value="all">כל החבילות</option>
            {plans.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </label>
      </div>
      <div className="a-chips" role="group" aria-label="סינון לפי סטטוס">
        {['all', ...STATUS_ORDER].map((s) => (
          <button key={s} type="button" className="a-chip" aria-pressed={f.status === s} onClick={() => f.setStatus(s)}>
            {s === 'all' ? 'הכל' : STATUS[s].label}<span className="adm-num">{f.counts[s] || 0}</span>
          </button>
        ))}
      </div>
      <section className="a-card a-card--flush" aria-label="רשימת לקוחות">
        {isLoading ? (
          <div className="a-pad">{Array.from({ length: 8 }, (_, i) => <Skel key={i} h={36} style={{ marginBottom: 12 }} />)}</div>
        ) : f.rows.length === 0 ? (
          <p className="a-empty a-pad">אין לקוחות שמתאימים לסינון.</p>
        ) : (
          <>
            <div className="a-table-wrap a-desk">
              <table className="a-table a-table--rows">
                <thead>
                  <tr>
                    <SortTh k="org_name" label="לקוח" f={f} />
                    <th scope="col">איש קשר</th>
                    <SortTh k="units_count" label="יחידות" f={f} className="num" />
                    <SortTh k="bookings_count" label="הזמנות" f={f} className="num" />
                    <SortTh k="last_active_at" label="פעילות אחרונה" f={f} />
                    <SortTh k="plan_key" label="חבילה" f={f} />
                    <SortTh k="status" label="סטטוס" f={f} />
                    <SortTh k="trial_ends_at" label="סוף ניסיון" f={f} />
                  </tr>
                </thead>
                <tbody>
                  {f.rows.map((c) => (
                    <tr key={c.org_id} onClick={() => nav(`/admin/customers/${c.org_id}`)} className="a-tr-link">
                      <td>
                        <Link to={`/admin/customers/${c.org_id}`} className="a-cell-main" onClick={(e) => e.stopPropagation()}>{c.org_name}</Link>
                        <span className="a-cell-sub">{c.owner_name || '—'}</span>
                      </td>
                      <td>
                        <span className="a-cell-plain adm-ltr">{c.owner_email}</span>
                        <span className="a-cell-sub adm-ltr">{fmtPhone(c.owner_phone) || '—'}</span>
                      </td>
                      <td className="num adm-num">{c.units_count}</td>
                      <td className="num adm-num">{c.bookings_count}</td>
                      <td className="a-muted">{relTime(c.last_active_at)}</td>
                      <td>{planName(c.plan_key)}{c.billing_cycle === 'yearly' ? <span className="a-muted"> · שנתי</span> : null}</td>
                      <td><StatusPill status={c.status} /></td>
                      <td className="a-muted adm-num">{c.status === 'trialing' || c.status === 'expired' ? date(c.trial_ends_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="a-mob-list a-mob">
              {f.rows.map((c) => (
                <li key={c.org_id}>
                  <Link to={`/admin/customers/${c.org_id}`} className="a-list-row">
                    <span className="a-list-main"><b>{c.org_name}</b><span>{c.owner_name || c.owner_email} · {planName(c.plan_key)} · {c.units_count} יח׳</span></span>
                    <span className="a-list-end"><StatusPill status={c.status} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

/* ── Customer detail ───────────────────────────────────────────────────── */
function Stat({ label, value }) {
  return (
    <div className="a-stat">
      <p>{label}</p>
      <b className="adm-num">{value}</b>
    </div>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useCustomer(id);
  const { plans } = usePlans();
  const { can } = useAdmin();
  const [kind, setKind] = useState(null);
  const [viewAs, setViewAs] = useState(false);
  const c = data?.customer;
  const back = <Link to="/admin/customers" className="a-back-link"><ChevronRight size={16} strokeWidth={1.75} aria-hidden />לקוחות</Link>;
  if (isLoading) return <><PageHead title=" " back={back} /><Skel h={320} /></>;
  if (error || !c) return <><PageHead title="הלקוח לא נמצא" back={back} /><ErrorNote error={error} /></>;
  const { wa, mail } = contactLinks(c);
  const plan = plans.find((p) => p.key === c.plan_key);
  const mv = monthlyValue(c, plans);
  const td = daysUntil(c.trial_ends_at);
  return (
    <>
      <PageHead
        back={back}
        title={c.org_name}
        sub={<span className="a-detail-sub"><StatusPill status={c.status} /><span>{plan?.name || c.plan_key} · {c.billing_cycle === 'yearly' ? 'שנתי' : 'חודשי'} · {money(mv)} לחודש</span></span>}
        actions={
          <>
            {wa ? <a className="adm-btn" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} strokeWidth={1.75} aria-hidden />וואטסאפ</a> : null}
            {mail ? <a className="adm-btn" href={mail}><Mail size={16} strokeWidth={1.75} aria-hidden />אימייל</a> : null}
            <DropdownMenu.Root dir="rtl">
              <DropdownMenu.Trigger asChild>
                <button type="button" className="adm-btn adm-btn--primary">פעולות<MoreHorizontal size={16} strokeWidth={1.75} aria-hidden /></button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="a-menu" align="end" sideOffset={6}>
                  <DropdownMenu.Item className="a-menu-item" disabled={!can('admin')} onSelect={() => setKind('trial')}>הארכת ניסיון</DropdownMenu.Item>
                  <DropdownMenu.Item className="a-menu-item" disabled={!can('admin')} onSelect={() => setKind('plan')}>שינוי חבילה</DropdownMenu.Item>
                  <DropdownMenu.Item className="a-menu-item" disabled={!can('admin')} onSelect={() => setKind('charge')}>רישום תשלום</DropdownMenu.Item>
                  <DropdownMenu.Item className="a-menu-item" onSelect={() => setViewAs(true)}>צפייה כלקוח (קריאה בלבד)</DropdownMenu.Item>
                  <DropdownMenu.Separator className="a-menu-sep" />
                  <DropdownMenu.Item className={`a-menu-item ${c.suspended_at ? '' : 'is-danger'}`} disabled={!can('admin')} onSelect={() => setKind('suspend')}>
                    {c.suspended_at ? 'הפעלה מחדש' : 'השהיית החשבון'}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </>
        }
      />
      {c.suspended_at ? (
        <div className="a-card a-banner" role="status">החשבון מושהה מאז {date(c.suspended_at)}{c.suspended_reason ? ` · ${c.suspended_reason}` : ''}</div>
      ) : null}
      <div className="a-detail">
        <div className="a-detail-main">
          <section className="a-card" aria-labelledby="use-h">
            <div className="a-card-head"><h2 id="use-h">שימוש</h2><span className="a-muted">6 חודשים אחרונים</span></div>
            <div className="a-stats">
              <Stat label="יחידות" value={data.units.length} />
              <Stat label="הזמנות" value={data.usage.bookings_total} />
              <Stat label="ב-30 יום" value={data.usage.bookings_30d} />
              <Stat label="לידים" value={data.usage.leads_total} />
            </div>
            <div className="a-chart-box" dir="ltr">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={data.usage.by_month.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#646B85', fontSize: 12, fontFamily: 'Heebo' }} reversed />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#F1EFFE' }} content={({ active, payload, label }) => (active && payload?.length ? <div className="a-tip"><b>{label}</b><span>{payload[0].value} הזמנות</span></div> : null)} />
                  <Bar dataKey="bookings" fill="#3E2BF1" radius={[5, 5, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="a-card a-card--flush" aria-labelledby="bill-h">
            <div className="a-card-head a-pad-x"><h2 id="bill-h">חיובים</h2>{can('admin') ? <button type="button" className="adm-btn adm-btn--sm" onClick={() => setKind('charge')}>רישום תשלום</button> : null}</div>
            {data.charges.length ? (
              <div className="a-table-wrap">
                <table className="a-table a-table--rows">
                  <thead><tr><th scope="col">תאריך</th><th scope="col">תיאור</th><th scope="col">אמצעי</th><th scope="col" className="num">סכום</th><th scope="col">מצב</th></tr></thead>
                  <tbody>
                    {data.charges.slice(0, 12).map((x) => (
                      <tr key={x.id}>
                        <td className="adm-num">{date(x.paid_at || x.created_at)}</td>
                        <td>{x.description || '—'}{x.failure_reason ? <span className="a-cell-sub">{x.failure_reason}</span> : null}</td>
                        <td className="a-muted">{METHODS[x.method] || x.method}</td>
                        <td className="num adm-num">{money(x.amount_ils)}</td>
                        <td><ChargePill status={x.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="a-empty a-pad">עוד לא נרשמו חיובים.</p>}
          </section>

          <section className="a-card a-card--flush" aria-labelledby="units-h">
            <div className="a-card-head a-pad-x"><h2 id="units-h">יחידות</h2><span className="a-muted">{data.units.length}</span></div>
            {data.units.length ? (
              <div className="a-table-wrap">
                <table className="a-table a-table--rows">
                  <thead><tr><th scope="col">יחידה</th><th scope="col" className="a-hide-m">נכס</th><th scope="col" className="num">אורחים</th><th scope="col" className="num">מחיר בסיס</th></tr></thead>
                  <tbody>
                    {data.units.map((u) => (
                      <tr key={u.id}><td>{u.name}</td><td className="a-muted a-hide-m">{u.property || '—'}</td><td className="num adm-num">{u.max_guests ?? '—'}</td><td className="num adm-num">{u.base_price ? money(u.base_price) : '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="a-empty a-pad">עוד לא נוספו יחידות.</p>}
          </section>

          {viewAs ? (
            <section className="a-card a-viewas" aria-labelledby="va-h">
              <div className="a-card-head">
                <h2 id="va-h"><Eye size={18} strokeWidth={1.75} aria-hidden /> צפייה כלקוח</h2>
                <button type="button" className="adm-btn adm-btn--sm adm-btn--quiet" onClick={() => setViewAs(false)}>סגירה</button>
              </div>
              <p className="a-muted a-viewas-note">קריאה בלבד. שמות אורחים מוצגים כראשי תיבות, בלי טלפונים ואימיילים.</p>
              {data.recent_bookings.length ? (
                <ul className="a-list">
                  {data.recent_bookings.map((b) => (
                    <li key={b.id} className="a-list-row a-list-row--static">
                      <span className="a-initials" aria-hidden>{b.guest_initials || '·'}</span>
                      <span className="a-list-main"><b>{b.unit || 'יחידה'}</b><span>{date(b.check_in_date, { weekday: true })} עד {date(b.check_out_date)}</span></span>
                      <span className="a-list-end adm-num">{b.total_price ? money(b.total_price) : '—'}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="a-empty">אין הזמנות להצגה.</p>}
            </section>
          ) : null}
        </div>

        <aside className="a-detail-side">
          <section className="a-card" aria-labelledby="prof-h">
            <h2 id="prof-h" className="a-side-h">פרטים</h2>
            <dl className="a-dl">
              <div><dt>בעלים</dt><dd>{c.owner_name || '—'}</dd></div>
              <div><dt>אימייל</dt><dd className="adm-ltr">{c.owner_email || '—'}</dd></div>
              <div><dt>טלפון</dt><dd className="adm-ltr">{fmtPhone(c.owner_phone) || '—'}</dd></div>
              <div><dt>נרשם</dt><dd>{date(c.created_at, { year: true })}</dd></div>
              <div><dt>פעילות אחרונה</dt><dd>{relTime(c.last_active_at)}</dd></div>
              <div><dt>הגדרה ראשונית</dt><dd>{c.onboarding_completed ? 'הושלמה' : 'לא הושלמה'}</dd></div>
            </dl>
          </section>
          <section className="a-card" aria-labelledby="sub-h">
            <h2 id="sub-h" className="a-side-h">מנוי</h2>
            <dl className="a-dl">
              <div><dt>חבילה</dt><dd>{plan?.name || c.plan_key}</dd></div>
              <div><dt>מחזור</dt><dd>{c.billing_cycle === 'yearly' ? 'שנתי' : 'חודשי'}</dd></div>
              <div><dt>מחיר</dt><dd className="adm-num">{money(mv)} לחודש{c.price_ils != null ? ' · מיוחד' : ''}</dd></div>
              {c.status === 'trialing' || c.status === 'expired' ? (
                <div><dt>סוף ניסיון</dt><dd>{date(c.trial_ends_at)}{td != null ? <span className="a-muted"> · {td > 0 ? `עוד ${td} ימים` : 'הסתיים'}</span> : null}</dd></div>
              ) : null}
              {c.current_period_end ? <div><dt>חידוש</dt><dd>{date(c.current_period_end)}</dd></div> : null}
              <div><dt>סליקה</dt><dd>ידני</dd></div>
            </dl>
            {can('admin') && (c.status === 'trialing' || c.status === 'expired') ? (
              <button type="button" className="adm-btn adm-btn--sm a-side-btn" onClick={() => setKind('trial')}>הארכת ניסיון</button>
            ) : null}
          </section>
          <section className="a-card" aria-labelledby="notes-h">
            <h2 id="notes-h" className="a-side-h">הערות</h2>
            <NotesBox orgId={c.org_id} notes={data.notes} />
          </section>
          <section className="a-card" aria-labelledby="act-h">
            <h2 id="act-h" className="a-side-h">פעילות צוות</h2>
            {data.audit.length ? (
              <ul className="a-timeline">
                {data.audit.slice(0, 8).map((a) => (
                  <li key={a.id}><b>{AUDIT_ACTIONS[a.action] || a.action}</b><span>{auditDetail(a)}</span><time dateTime={a.created_at}>{a.actor_email?.split('@')[0]} · {relTime(a.created_at)}</time></li>
                ))}
              </ul>
            ) : <p className="a-muted">אין פעולות עדיין.</p>}
          </section>
        </aside>
      </div>
      <CustomerDialogs customer={c} kind={kind} setKind={setKind} />
    </>
  );
}

