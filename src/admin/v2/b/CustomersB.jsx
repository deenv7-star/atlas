/* Admin v2 · version B "Profiles" (Intercom-like): saved views + rich customer cards, and a full customer page
   with a header band and tabs. Deep links: /admin/customers/<org_id>?tab=team */
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, CalendarDays, MessageCircle, Users as UsersIcon } from 'lucide-react';
import '../v2.css';
import './b2.css';
import { Head } from '../../b/Shell';
import { BError } from '../../b/pagesCustomers';
import { useCharges, usePlans } from '../../hooks';
import { StatusPill, Skel, date, money } from '../../ui';
import { relTime } from '../../metrics';
import { customerCsv } from '../../shared';
import { downloadCsv } from '../../csv';
import { CustomerDialogs } from '../../dialogs';
import { useCustomersV2, useCustomerV2, useBulk, logEvent } from '../hooks2';
import { useCustomerList } from '../useList';
import { SORTS, DEFAULT_FILTERS } from '../listModel';
import { monthlyValue } from '../kpis';
import {
  KpiStrip, FilterBar, Pager, BulkBar, TestPill, Health, initials, displayName,
  SubscriptionCard, ContactCard, UsageCard, ConnectionsCard, TeamCard, PaymentsCard, ActivityCard, NotesCard, UnitsCard, ViewAsCard,
  DangerZone, DeleteFlow, MailDialog, ContactButtons, useCustomerActions,
} from '../parts';

const VIEWS = [
  { k: 'all', label: 'כל הלקוחות', f: {} },
  { k: 'paying', label: 'משלמים', f: { status: 'active' } },
  { k: 'trial', label: 'בניסיון', f: { status: 'trialing' } },
  { k: 'expired', label: 'הניסיון הסתיים', f: { status: 'expired' } },
  { k: 'never', label: 'לא נכנסו מעולם', f: { active: 'never' } },
  { k: 'nounits', label: 'בלי יחידות', f: { units: 'no' } },
  { k: 'tests', label: 'חשבונות בדיקה', f: { tests: 'only' } },
];
const viewOf = (f) => VIEWS.find((v) => Object.entries({ ...DEFAULT_FILTERS, ...v.f }).every(([k, val]) => f[k] === val || k === 'q'))?.k || null;

export function CustomersB() {
  const { data, isLoading, error } = useCustomersV2();
  const charges = useCharges().data || [];
  const list = useCustomerList(data || []);
  const bulk = useBulk();
  const { plans } = usePlans();
  const view = viewOf(list.f);
  const planName = (k) => plans.find((p) => p.key === k)?.name || k;
  return (
    <div className="xb">
      <Head title="לקוחות" sub={data ? `${list.rows.length} מתוך ${data.length}` : ' '} actions={<button type="button" className="b-btn" onClick={() => { downloadCsv(`atlas-customers-${new Date().toISOString().slice(0, 10)}.csv`, list.rows, customerCsv(plans)); logEvent('customers.export_csv', null, { count: list.rows.length }); }} disabled={!list.rows.length}><Download size={16} strokeWidth={1.75} aria-hidden />ייצוא CSV</button>} />
      <BError error={error} />
      <KpiStrip customers={data} charges={charges} className="x-kpis--b" />
      <nav className="xb-views" aria-label="תצוגות שמורות">
        {VIEWS.map((v) => (
          <button key={v.k} type="button" aria-pressed={view === v.k} onClick={() => list.set({ ...DEFAULT_FILTERS, ...v.f })}>{v.label}</button>
        ))}
      </nav>
      <FilterBar f={list.f} set={list.set} reset={list.reset} plans={plans} counts={list.counts} />
      <div className="xb-listbar">
        <label className="adm-check"><input type="checkbox" checked={list.allOnPage} onChange={list.togglePage} />בחירת העמוד</label>
        <label className="x-select xb-sort"><span>מיון</span>
          <select value={`${list.sort.key}:${list.sort.dir}`} onChange={(e) => { const [k] = e.target.value.split(':'); list.setSort(k); }}>
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={`${k}:${list.sort.key === k ? list.sort.dir : 'desc'}`}>{s.label}{list.sort.key === k ? (list.sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}</option>)}
          </select>
        </label>
      </div>
      <BulkBar selected={list.selected} rows={data || []} clear={() => list.setSelected([])} bulk={bulk} />
      {isLoading ? <div className="xb-grid">{Array.from({ length: 6 }, (_, i) => <Skel key={i} h={148} r={20} />)}</div> : list.rows.length === 0 ? (
        <p className="x-empty">אין לקוחות בתצוגה הזו. <button type="button" className="x-link-btn" onClick={list.reset}>לכל הלקוחות</button></p>
      ) : (
        <ul className="xb-grid" aria-label="רשימת לקוחות">
          {list.p.rows.map((c) => {
            const sel = list.selected.includes(c.org_id);
            const mv = ['active', 'past_due'].includes(c.status) ? monthlyValue(c, plans) : null;
            return (
              <li key={c.org_id} className="xb-card" data-selected={sel || undefined}>
                <label className="x-hit xb-check-hit"><input type="checkbox" className="xb-check" checked={sel} onChange={() => list.toggle(c.org_id)} aria-label={`בחירת ${displayName(c)}`} /></label>
                <Link to={`/admin/customers/${c.org_id}`} className="xb-card-link">
                  <span className="xb-card-top">
                    <span className="x-av x-av--lg" aria-hidden>{initials(displayName(c))}</span>
                    <span className="xb-card-id"><b>{displayName(c)}</b><span className="adm-ltr">{c.owner_email}</span></span>
                    <ChevronLeft size={18} strokeWidth={1.75} className="xb-chev" aria-hidden />
                  </span>
                  <span className="xb-card-pills"><StatusPill status={c.status} /><span className="x-chip x-chip--soft">{planName(c.plan_key)}</span><TestPill c={c} /></span>
                  <span className="xb-card-stats">
                    <span><b className="adm-num">{c.units_count}</b>יחידות</span>
                    <span><b className="adm-num">{c.bookings_count}</b>הזמנות</span>
                    <span><b className="adm-num">{mv != null ? money(mv) : '—'}</b>לחודש</span>
                  </span>
                  <span className="xb-card-foot">
                    <span>{'last_sign_in_at' in c && !c.last_sign_in_at ? 'לא נכנסו מעולם' : `כניסה ${relTime(c.last_sign_in_at || c.last_active_at)}`}{c.status === 'trialing' || c.status === 'expired' ? ` · ניסיון עד ${date(c.trial_ends_at)}` : ''}</span>
                    <span className="xb-sig">
                      <CalendarDays size={14} strokeWidth={1.75} aria-hidden className={c.ical_feeds ? (c.ical_errors ? 'is-bad' : 'is-ok') : ''} /><span className="adm-sr">{c.ical_feeds ? (c.ical_errors ? 'iCal שגיאה' : 'iCal תקין') : 'iCal לא מחובר'}</span>
                      <MessageCircle size={14} strokeWidth={1.75} aria-hidden className={c.wa_ready ? 'is-ok' : ''} /><span className="adm-sr">{c.wa_ready ? 'וואטסאפ מוכן' : 'וואטסאפ לא הוגדר'}</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Pager p={list.p} onPage={(n) => { list.setPage(n); window.scrollTo({ top: 0 }); }} />
    </div>
  );
}

const TABS = [
  ['overview', 'סקירה'], ['connections', 'חיבורים'], ['team', 'צוות'], ['payments', 'תשלומים'], ['activity', 'הערות ויומן'], ['settings', 'הגדרות'],
];

export function CustomerPageB() {
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const tab = TABS.some(([k]) => k === sp.get('tab')) ? sp.get('tab') : 'overview';
  const { data, isLoading, error } = useCustomerV2(id);
  const c = data?.customer;
  const a = useCustomerActions(c);
  const { plans } = usePlans();
  const back = <Link to="/admin/customers" className="b-back"><ChevronRight size={16} strokeWidth={1.75} aria-hidden />כל הלקוחות</Link>;
  if (isLoading) return <><Head title=" " back={back} /><Skel h={200} r={24} /><Skel h={320} r={24} style={{ marginTop: 16 }} /></>;
  if (error || !c) return <><Head title="הלקוח לא נמצא" back={back} /><BError error={error} /></>;
  const mv = ['active', 'past_due'].includes(c.status) ? monthlyValue(c, plans) : null;
  const go = (k) => setSp(k === 'overview' ? {} : { tab: k }, { replace: true });
  return (
    <div className="xb">
      <Head title=" " back={back} />
      <section className="xb-hero" aria-labelledby="xb-name">
        <div className="xb-hero-id">
          <span className="x-av x-av--xl" aria-hidden>{initials(displayName(c))}</span>
          <div>
            <h1 id="xb-name">{displayName(c)}</h1>
            <p><StatusPill status={c.status} /><TestPill c={c} /><span>{c.owner_name || '—'} · <span className="adm-ltr">{c.owner_email}</span></span></p>
          </div>
          <div className="xb-hero-contact"><ContactButtons c={c} /></div>
        </div>
        <dl className="xb-hero-stats">
          <div><dt>לחודש</dt><dd className="adm-num">{mv != null ? money(mv) : '—'}</dd></div>
          <div><dt>יחידות</dt><dd className="adm-num">{c.units_count}</dd></div>
          <div><dt>הזמנות</dt><dd className="adm-num">{c.bookings_count}</dd></div>
          <div><dt>כניסה אחרונה</dt><dd>{'last_sign_in_at' in c && !c.last_sign_in_at ? 'אף פעם' : relTime(c.last_sign_in_at || c.last_active_at)}</dd></div>
          <div><dt>צוות</dt><dd className="adm-num"><UsersIcon size={15} strokeWidth={1.75} aria-hidden /> {data.members?.length ?? c.members_count ?? '—'}</dd></div>
          <div><dt>יומנים</dt><dd><Health ok={c.ical_feeds ? !c.ical_errors : null} label={c.ical_feeds ? (c.ical_errors ? 'שגיאה' : 'תקין') : 'לא חובר'} /></dd></div>
        </dl>
        <div className="xb-actions" role="toolbar" aria-label="פעולות על הלקוח">
          {a.list.map((x) => (
            <button key={x.k} type="button" className="xb-act" onClick={x.on} disabled={x.disabled} aria-pressed={x.pressed}><x.icon size={18} strokeWidth={1.75} aria-hidden /><span>{x.label}</span></button>
          ))}
        </div>
      </section>
      {c.suspended_at ? <p className="x-warn xb-warn" role="status">החשבון מושהה מאז {date(c.suspended_at)}{c.suspended_reason ? ` · ${c.suspended_reason}` : ''}</p> : null}
      {a.viewAs ? <ViewAsCard c={c} data={data} /> : null}
      <div className="xb-tabs" role="tablist" aria-label="אזורים בכרטיס הלקוח">
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" id={`tab-${k}`} aria-controls="xb-panel" aria-selected={tab === k} onClick={() => go(k)}>{l}</button>)}
      </div>
      <div className="xb-panel" id="xb-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'overview' ? <div className="xb-cols"><div><SubscriptionCard c={c} /><UsageCard data={data} /><UnitsCard data={data} /></div><div><ContactCard c={c} data={data} /><ActivityCard data={data} limit={5} /></div></div> : null}
        {tab === 'connections' ? <ConnectionsCard data={data} /> : null}
        {tab === 'team' ? <TeamCard data={data} onReset={(m) => a.setMail(m)} /> : null}
        {tab === 'payments' ? <PaymentsCard data={data} /> : null}
        {tab === 'activity' ? <div className="xb-cols"><NotesCard c={c} data={data} /><ActivityCard data={data} limit={50} /></div> : null}
        {tab === 'settings' ? <DangerZone c={c} canDelete={a.canDelete} onSuspend={() => a.setKind('suspend')} onDelete={() => a.setDel(true)} /> : null}
      </div>
      <CustomerDialogs customer={c} kind={a.kind} setKind={a.setKind} />
      <MailDialog c={c} member={a.mail} onClose={() => a.setMail(null)} />
      <DeleteFlow c={c} open={a.del} onOpenChange={a.setDel} onSuspend={() => a.setKind('suspend')} onDeleted={() => nav('/admin/customers', { replace: true })} />
    </div>
  );
}
