import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, Cell } from 'recharts';
import { Search, Download, MessageCircle, Mail, ChevronLeft, ChevronRight, Eye, AlertCircle, CalendarPlus, Repeat, Wallet, PauseCircle, PlayCircle, ArrowUpRight } from 'lucide-react';
import { Head } from './Shell';
import { useOverview, useCustomers, useCustomer, usePlans, useAdmin } from '../hooks';
import { StatusPill, ChargePill, Skel, money, moneyK, date, pct, contactLinks } from '../ui';
import { STATUS, STATUS_ORDER, METHODS, AUDIT_ACTIONS } from '../config';
import { relTime, daysUntil, fmtPhone, monthlyValue, monthLabel } from '../metrics';
import { useCustomerFilters, customerCsv, NotesBox, auditDetail } from '../shared';
import { downloadCsv } from '../csv';
import { CustomerDialogs } from '../dialogs';

export const STATUS_COLOR = { active: '#3E2BF1', trialing: '#9D94F8', past_due: '#EF5B5B', expired: '#CDD2E2', churned: '#8C93AB', suspended: '#1B2656' };
const tick = { fill: '#646B85', fontSize: 12, fontFamily: 'Heebo' };

export function BError({ error }) {
  if (!error) return null;
  return <div className="b-tile b-error" role="alert"><AlertCircle size={18} strokeWidth={1.75} aria-hidden /><span>{error.message || 'לא הצלחנו לטעון את הנתונים'}</span></div>;
}
/** Donut as a conic gradient with 1.2° gaps (no focusable SVG, no animation needed). */
function conic(parts) {
  const total = parts.reduce((t, x) => t + x.value, 0) || 1;
  let at = 0;
  const stops = [];
  for (const x of parts) {
    const deg = (x.value / total) * 360;
    const gap = parts.length > 1 ? Math.min(1.2, deg / 3) : 0;
    stops.push(`${STATUS_COLOR[x.s]} ${at}deg ${at + deg - gap}deg`, `transparent ${at + deg - gap}deg ${at + deg}deg`);
    at += deg;
  }
  return `conic-gradient(${stops.join(', ')})`;
}
const initials = (s) => String(s || '').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((x) => x[0]).join('').slice(0, 2);

/* ── Overview ──────────────────────────────────────────────────────────── */
export function Overview() {
  const { data, isLoading, error, plans } = useOverview();
  const [tab, setTab] = useState('signups');
  const donut = data ? STATUS_ORDER.map((s) => ({ s, name: STATUS[s].label, value: data.counts[s] || 0 })).filter((x) => x.value) : [];
  const maxPlan = data ? Math.max(1, ...data.byPlan.map((p) => p.mrr)) : 1;
  return (
    <>
      <Head greet sub={data ? `${data.counts.total} לקוחות במערכת` : ''} />
      <BError error={error} />
      <div className="b-bento b-bento--ov">
        <section className="b-tile b-hero" aria-labelledby="h-mrr">
          <div className="b-hero-top">
            <h2 id="h-mrr">הכנסה חודשית חוזרת</h2>
            <Link to="/admin/payments" className="b-round" aria-label="לתשלומים"><ArrowUpRight size={18} strokeWidth={2} /></Link>
          </div>
          {isLoading ? <Skel w={200} h={56} style={{ opacity: 0.3 }} /> : <p className="b-hero-val adm-num">{money(data.mrr)}</p>}
          <div className="b-hero-row">
            <div><span>ARR</span><b className="adm-num">{data ? moneyK(data.arr) : '—'}</b></div>
            <div><span>משלמים</span><b className="adm-num">{data ? data.paying : '—'}</b></div>
            <div><span>בסיכון</span><b className="adm-num">{data ? money(data.atRisk) : '—'}</b></div>
          </div>
        </section>

        <section className="b-tile b-donut" aria-labelledby="h-mix">
          <div className="b-tile-head"><h2 id="h-mix">מצב הלקוחות</h2><Link to="/admin/customers" className="b-round b-round--soft" aria-label="לכל הלקוחות"><ArrowUpRight size={18} strokeWidth={2} /></Link></div>
          {data ? (
            <div className="b-donut-body">
              <div className="b-donut-chart" role="img" aria-label={donut.map((x) => `${x.name} ${x.value}`).join(', ')}>
                <div className="b-donut-ring" aria-hidden style={{ background: conic(donut) }} />
                <div className="b-donut-center"><b className="adm-num">{data.counts.total}</b><span>לקוחות</span></div>
              </div>
              <ul className="b-legend">
                {STATUS_ORDER.map((s) => (
                  <li key={s}><Link to={`/admin/customers?status=${s}`}><i style={{ background: STATUS_COLOR[s] }} aria-hidden /><span>{STATUS[s].label}</span><b className="adm-num">{data.counts[s] || 0}</b></Link></li>
                ))}
              </ul>
            </div>
          ) : <Skel h={180} />}
        </section>

        <section className="b-tile b-conv" aria-labelledby="h-conv">
          <h2 id="h-conv">המרה מניסיון</h2>
          {data ? (
            <>
              <div className="b-ring" style={{ '--p': Math.round((data.conversion || 0) * 100) }} role="img" aria-label={`המרה ${pct(data.conversion)}`}>
                <b className="adm-num">{pct(data.conversion)}</b>
              </div>
              <p className="b-tile-foot">{data.convertedCount} מתוך {data.trialEndedCount} שסיימו ניסיון עברו לתשלום</p>
            </>
          ) : <Skel h={150} />}
        </section>

        <section className="b-tile b-signups" aria-labelledby="h-chart">
          <div className="b-tile-head">
            <div>
              <h2 id="h-chart">{tab === 'signups' ? 'הרשמות' : 'הכנסות שנגבו'}</h2>
              {data ? <p className="b-big adm-num">{tab === 'signups' ? data.thisMonth.signups : money(data.thisMonth.collected)}<span> החודש</span></p> : null}
            </div>
            <div className="b-pills" role="tablist" aria-label="גרף">
              <button type="button" role="tab" aria-selected={tab === 'signups'} onClick={() => setTab('signups')}>הרשמות</button>
              <button type="button" role="tab" aria-selected={tab === 'collected'} onClick={() => setTab('collected')}>הכנסות</button>
            </div>
          </div>
          <div className="b-chart" dir="ltr">
            {data ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} reversed interval={0} />
                  <Tooltip cursor={{ fill: 'rgba(62,43,241,0.06)', radius: 10 }} content={({ active, payload, label }) => (active && payload?.length ? <div className="b-tip"><b>{label}</b><span>{tab === 'signups' ? `${payload[0].value} הרשמות` : money(payload[0].value)}</span></div> : null)} />
                  <Bar dataKey={tab} radius={[10, 10, 10, 10]} maxBarSize={30} isAnimationActive={false}>
                    {data.series.map((x, i) => <Cell key={x.month} fill={i === data.series.length - 1 ? '#3E2BF1' : '#DCD8FC'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Skel h={200} />}
          </div>
        </section>

        <section className="b-tile b-attn" aria-labelledby="h-att">
          <div className="b-tile-head"><h2 id="h-att">דורש תשומת לב</h2></div>
          {data ? (
            data.failed.length + data.trialsEndingSoon.length === 0 ? <p className="b-muted">הכל בסדר. אין תשלומים שנכשלו ואין ניסיונות שמסתיימים השבוע.</p> : (
              <ul className="b-rows">
                {data.failed.slice(0, 3).map((x) => (
                  <li key={x.id}><Link to={`/admin/customers/${x.org_id}`} className="b-row">
                    <span className="b-dot b-dot--red" aria-hidden><Wallet size={16} strokeWidth={1.75} /></span>
                    <span className="b-row-main"><b>{x.org_name}</b><span>תשלום נכשל · {money(x.amount_ils)}</span></span>
                    <ChevronLeft size={18} strokeWidth={1.75} className="b-chev" aria-hidden />
                  </Link></li>
                ))}
                {data.trialsEndingSoon.slice(0, 3).map((c) => {
                  const d = daysUntil(c.trial_ends_at);
                  return (
                    <li key={c.org_id}><Link to={`/admin/customers/${c.org_id}`} className="b-row">
                      <span className="b-dot" aria-hidden><CalendarPlus size={16} strokeWidth={1.75} /></span>
                      <span className="b-row-main"><b>{c.org_name}</b><span>{d <= 0 ? 'הניסיון מסתיים היום' : d === 1 ? 'הניסיון מסתיים מחר' : `הניסיון מסתיים בעוד ${d} ימים`}</span></span>
                      <ChevronLeft size={18} strokeWidth={1.75} className="b-chev" aria-hidden />
                    </Link></li>
                  );
                })}
              </ul>
            )
          ) : <Skel h={180} />}
        </section>

        <section className="b-tile b-newest" aria-labelledby="h-new">
          <div className="b-tile-head"><h2 id="h-new">הצטרפו לאחרונה</h2></div>
          {data ? (
            <ul className="b-rows">
              {data.newest.slice(0, 4).map((c) => (
                <li key={c.org_id}><Link to={`/admin/customers/${c.org_id}`} className="b-row">
                  <span className="b-av" aria-hidden>{initials(c.org_name)}</span>
                  <span className="b-row-main"><b>{c.org_name}</b><span>{relTime(c.created_at)}</span></span>
                  <StatusPill status={c.status} />
                </Link></li>
              ))}
            </ul>
          ) : <Skel h={180} />}
        </section>

        <section className="b-tile b-plans-mini" aria-labelledby="h-plans">
          <div className="b-tile-head"><h2 id="h-plans">MRR לפי חבילה</h2><Link to="/admin/plans" className="b-round b-round--soft" aria-label="לחבילות"><ArrowUpRight size={18} strokeWidth={2} /></Link></div>
          {data ? (
            <ul className="b-pbars">
              {data.byPlan.map((p) => (
                <li key={p.key}>
                  <div className="b-pbar-top"><b>{p.name}</b><span className="adm-num">{money(p.mrr)} · {p.customers}</span></div>
                  <div className="b-pbar"><span style={{ width: `${Math.max(4, (p.mrr / maxPlan) * 100)}%` }} /></div>
                  <span className="adm-sr">{money(plans.find((x) => x.key === p.key)?.price_monthly)} לחודש</span>
                </li>
              ))}
            </ul>
          ) : <Skel h={150} />}
        </section>
      </div>
    </>
  );
}

/* ── Customers ─────────────────────────────────────────────────────────── */
export function Customers() {
  const { data, isLoading, error } = useCustomers();
  const { plans } = usePlans();
  const [sp] = useSearchParams();
  const f = useCustomerFilters(data || [], sp.get('status'));
  const planName = (k) => plans.find((p) => p.key === k)?.name || k;
  const tiles = ['all', 'active', 'trialing', 'past_due', 'expired', 'churned'];
  return (
    <>
      <Head
        title="לקוחות"
        sub={data ? `${f.rows.length} מתוך ${data.length}` : ' '}
        actions={<button type="button" className="b-btn" onClick={() => downloadCsv(`atlas-customers-${new Date().toISOString().slice(0, 10)}.csv`, f.rows, customerCsv(plans))} disabled={!f.rows.length}><Download size={16} strokeWidth={1.75} aria-hidden />ייצוא CSV</button>}
      />
      <BError error={error} />
      <div className="b-ftiles" role="group" aria-label="סינון לפי סטטוס">
        {tiles.map((s) => (
          <button key={s} type="button" className="b-ftile" aria-pressed={f.status === s} onClick={() => f.setStatus(s)}>
            <b className="adm-num">{f.counts[s] || 0}</b>
            <span>{s === 'all' ? 'כל הלקוחות' : STATUS[s].label}</span>
          </button>
        ))}
        {f.counts.suspended ? (
          <button type="button" className="b-ftile" aria-pressed={f.status === 'suspended'} onClick={() => f.setStatus('suspended')}>
            <b className="adm-num">{f.counts.suspended}</b><span>מושהים</span>
          </button>
        ) : null}
      </div>
      <div className="b-bar">
        <label className="b-search">
          <Search size={18} strokeWidth={1.75} aria-hidden />
          <span className="adm-sr">חיפוש לקוח</span>
          <input type="search" value={f.q} onChange={(e) => f.setQ(e.target.value)} placeholder="חיפוש עסק, בעלים, אימייל או טלפון" />
        </label>
        <div className="b-pills" role="group" aria-label="חבילה">
          <button type="button" aria-pressed={f.plan === 'all'} onClick={() => f.setPlan('all')}>הכל</button>
          {plans.map((p) => <button key={p.key} type="button" aria-pressed={f.plan === p.key} onClick={() => f.setPlan(p.key)}>{p.name}</button>)}
        </div>
      </div>
      <section className="b-tile b-tile--list" aria-label="רשימת לקוחות">
        {isLoading ? Array.from({ length: 7 }, (_, i) => <Skel key={i} h={56} style={{ margin: '10px 0' }} />) : f.rows.length === 0 ? (
          <p className="b-muted b-pad">אין לקוחות שמתאימים לסינון.</p>
        ) : (
          <ul className="b-clist">
            {f.rows.map((c) => (
              <li key={c.org_id}>
                <Link to={`/admin/customers/${c.org_id}`} className="b-crow">
                  <span className="b-av b-av--lg" aria-hidden>{initials(c.org_name)}</span>
                  <span className="b-crow-main"><b>{c.org_name}</b><span>{c.owner_name || '—'} · <span className="adm-ltr">{c.owner_email}</span></span></span>
                  <span className="b-crow-meta"><b className="adm-num">{c.units_count}</b><span>יחידות</span></span>
                  <span className="b-crow-meta"><b className="adm-num">{c.bookings_count}</b><span>הזמנות</span></span>
                  <span className="b-crow-meta b-crow-meta--w"><b>{planName(c.plan_key)}</b><span>{c.status === 'trialing' || c.status === 'expired' ? `ניסיון עד ${date(c.trial_ends_at)}` : relTime(c.last_active_at)}</span></span>
                  <span className="b-crow-status"><StatusPill status={c.status} /></span>
                  <ChevronLeft size={18} strokeWidth={1.75} className="b-chev" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/* ── Customer detail ───────────────────────────────────────────────────── */
export function CustomerDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useCustomer(id);
  const { plans } = usePlans();
  const { can } = useAdmin();
  const [kind, setKind] = useState(null);
  const [viewAs, setViewAs] = useState(false);
  const c = data?.customer;
  const back = <Link to="/admin/customers" className="b-back"><ChevronRight size={16} strokeWidth={1.75} aria-hidden />כל הלקוחות</Link>;
  if (isLoading) return <><Head title=" " back={back} /><Skel h={360} r={24} /></>;
  if (error || !c) return <><Head title="הלקוח לא נמצא" back={back} /><BError error={error} /></>;
  const { wa, mail } = contactLinks(c);
  const plan = plans.find((p) => p.key === c.plan_key);
  const mv = monthlyValue(c, plans);
  const td = daysUntil(c.trial_ends_at);
  const trialish = c.status === 'trialing' || c.status === 'expired';
  const ACTIONS = [
    { k: 'trial', label: 'הארכת ניסיון', icon: CalendarPlus, show: true },
    { k: 'plan', label: 'שינוי חבילה', icon: Repeat, show: true },
    { k: 'charge', label: 'רישום תשלום', icon: Wallet, show: true },
    { k: 'suspend', label: c.suspended_at ? 'הפעלה מחדש' : 'השהיה', icon: c.suspended_at ? PlayCircle : PauseCircle, show: true, danger: !c.suspended_at },
  ];
  return (
    <>
      <Head title=" " back={back} />
      <div className="b-bento b-bento--detail">
        <section className="b-tile b-id" aria-labelledby="h-org">
          <span className="b-av b-av--xl" aria-hidden>{initials(c.org_name)}</span>
          <div className="b-id-text">
            <h1 id="h-org">{c.org_name}</h1>
            <p><StatusPill status={c.status} /><span>{c.owner_name || '—'} · לקוח מאז {date(c.created_at, { year: true })}</span></p>
          </div>
          <div className="b-id-contact">
            {wa ? <a className="b-btn" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} strokeWidth={1.75} aria-hidden />וואטסאפ</a> : null}
            {mail ? <a className="b-btn" href={mail}><Mail size={16} strokeWidth={1.75} aria-hidden />אימייל</a> : null}
            <button type="button" className="b-btn" onClick={() => setViewAs((v) => !v)} aria-pressed={viewAs}><Eye size={16} strokeWidth={1.75} aria-hidden />צפייה כלקוח</button>
          </div>
        </section>

        <section className="b-tile b-hero b-sub" aria-labelledby="h-sub">
          <div className="b-hero-top"><h2 id="h-sub">מנוי</h2><span className="b-hero-chip">{c.billing_cycle === 'yearly' ? 'שנתי' : 'חודשי'} · ידני</span></div>
          <p className="b-hero-val b-hero-val--md">{plan?.name || c.plan_key}</p>
          <div className="b-hero-row">
            <div><span>לחודש</span><b className="adm-num">{money(mv)}</b></div>
            <div><span>{trialish ? 'סוף ניסיון' : 'חידוש'}</span><b>{trialish ? date(c.trial_ends_at) : c.current_period_end ? date(c.current_period_end) : '—'}</b></div>
            {trialish && td != null ? <div><span>נותרו</span><b className="adm-num">{td > 0 ? `${td} ימים` : 'הסתיים'}</b></div> : null}
          </div>
        </section>

        <section className="b-tile b-actions" aria-labelledby="h-act">
          <h2 id="h-act">פעולות</h2>
          <div className="b-act-grid">
            {ACTIONS.map((a) => (
              <button key={a.k} type="button" className={`b-act ${a.danger ? 'is-danger' : ''}`} disabled={!can('admin')} onClick={() => setKind(a.k)}>
                <a.icon size={20} strokeWidth={1.75} aria-hidden /><span>{a.label}</span>
              </button>
            ))}
          </div>
          {!can('admin') ? <p className="b-muted b-small">פעולות זמינות למנהלים ובעלים.</p> : null}
        </section>

        {c.suspended_at ? <div className="b-tile b-warn" role="status">החשבון מושהה מאז {date(c.suspended_at)}{c.suspended_reason ? ` · ${c.suspended_reason}` : ''}</div> : null}







        <div className="b-cols">
          <div className="b-col b-col--main">
            {viewAs ? (
              <section className="b-tile b-viewas" aria-labelledby="h-va">
                <div className="b-tile-head"><h2 id="h-va">צפייה כלקוח</h2><span className="b-hero-chip b-hero-chip--soft">קריאה בלבד</span></div>
                <p className="b-muted b-small">כך נראות ההזמנות האחרונות אצל {c.org_name}. אורחים מוצגים בראשי תיבות בלבד.</p>
                {data.recent_bookings.length ? (
                  <ul className="b-rows">
                    {data.recent_bookings.map((b) => (
                      <li key={b.id} className="b-row b-row--static">
                        <span className="b-av" aria-hidden>{b.guest_initials || '·'}</span>
                        <span className="b-row-main"><b>{b.unit || 'יחידה'}</b><span>{date(b.check_in_date, { weekday: true })} עד {date(b.check_out_date)}</span></span>
                        <b className="adm-num">{b.total_price ? money(b.total_price) : '—'}</b>
                      </li>
                    ))}
                  </ul>
                ) : <p className="b-muted">אין הזמנות להצגה.</p>}
              </section>
            ) : null}
            <section className="b-tile b-usage" aria-labelledby="h-use">
              <div className="b-tile-head"><h2 id="h-use">שימוש</h2><span className="b-muted b-small">6 חודשים</span></div>
              <div className="b-mini-stats">
                <div><b className="adm-num">{data.units.length}</b><span>יחידות</span></div>
                <div><b className="adm-num">{data.usage.bookings_total}</b><span>הזמנות</span></div>
                <div><b className="adm-num">{data.usage.bookings_30d}</b><span>ב-30 יום</span></div>
                <div><b className="adm-num">{data.usage.leads_total}</b><span>לידים</span></div>
              </div>
              <div className="b-chart" dir="ltr">
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={data.usage.by_month.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} reversed interval={0} />
                    <Tooltip cursor={{ fill: 'rgba(62,43,241,0.06)', radius: 8 }} content={({ active, payload, label }) => (active && payload?.length ? <div className="b-tip"><b>{label}</b><span>{payload[0].value} הזמנות</span></div> : null)} />
                    <Bar dataKey="bookings" radius={[8, 8, 8, 8]} maxBarSize={26} fill="#3E2BF1" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="b-tile b-charges" aria-labelledby="h-ch">
              <div className="b-tile-head"><h2 id="h-ch">היסטוריית חיובים</h2><span className="b-muted b-small">{data.charges.length}</span></div>
              {data.charges.length ? (
                <ul className="b-rows">
                  {data.charges.slice(0, 8).map((x) => (
                    <li key={x.id} className="b-row b-row--static">
                      <span className="b-row-main"><b className="adm-num">{money(x.amount_ils)}</b><span>{date(x.paid_at || x.created_at)} · {METHODS[x.method] || x.method}{x.failure_reason ? ` · ${x.failure_reason}` : ''}</span></span>
                      <ChargePill status={x.status} />
                    </li>
                  ))}
                </ul>
              ) : <p className="b-muted">עוד לא נרשמו חיובים.</p>}
            </section>
            <section className="b-tile b-notes-t" aria-labelledby="h-notes">
              <h2 id="h-notes">הערות צוות</h2>
              <NotesBox orgId={c.org_id} notes={data.notes} />
            </section>
          </div>
          <div className="b-col b-col--side">
            <section className="b-tile b-profile" aria-labelledby="h-prof">
              <h2 id="h-prof">פרטי קשר</h2>
              <dl className="b-dl">
                <div><dt>בעלים</dt><dd>{c.owner_name || '—'}</dd></div>
                <div><dt>אימייל</dt><dd className="adm-ltr">{c.owner_email || '—'}</dd></div>
                <div><dt>טלפון</dt><dd className="adm-ltr">{fmtPhone(c.owner_phone) || '—'}</dd></div>
                <div><dt>פעילות אחרונה</dt><dd>{relTime(c.last_active_at)}</dd></div>
                <div><dt>הגדרה ראשונית</dt><dd>{c.onboarding_completed ? 'הושלמה' : 'לא הושלמה'}</dd></div>
              </dl>
            </section>
            <section className="b-tile b-units" aria-labelledby="h-units">
              <div className="b-tile-head"><h2 id="h-units">יחידות</h2><span className="b-muted b-small">{data.units.length}</span></div>
              {data.units.length ? (
                <ul className="b-unit-grid">
                  {data.units.map((u) => (
                    <li key={u.id}><b>{u.name}</b><span>{u.max_guests ? `${u.max_guests} אורחים` : ''}{u.base_price ? ` · ${money(u.base_price)}` : ''}</span></li>
                  ))}
                </ul>
              ) : <p className="b-muted">עוד לא נוספו יחידות.</p>}
            </section>
            <section className="b-tile b-activity" aria-labelledby="h-actv">
              <h2 id="h-actv">פעילות</h2>
              {data.audit.length ? (
                <ul className="b-tl">
                  {data.audit.slice(0, 6).map((a) => (
                    <li key={a.id}><b>{AUDIT_ACTIONS[a.action] || a.action}</b><span>{auditDetail(a)}</span><time dateTime={a.created_at}>{relTime(a.created_at)} · {a.actor_email?.split('@')[0]}</time></li>
                  ))}
                </ul>
              ) : <p className="b-muted">אין פעולות עדיין.</p>}
            </section>
          </div>
        </div>
      </div>
      <CustomerDialogs customer={c} kind={kind} setKind={setKind} />
    </>
  );
}
