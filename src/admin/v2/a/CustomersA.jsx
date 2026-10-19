/* Admin v2 · version A "Ledger + drawer" (Stripe / Linear): dense sortable table, the customer opens in a side
   drawer over the list so you never lose your place. Deep link: /admin/customers?c=<org_id>. */
import { Navigate, useParams } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowDown, ArrowUp, Download, X, CalendarDays, MessageCircle } from 'lucide-react';
import '../v2.css';
import './a.css';
import { Head } from '../../b/Shell';
import { BError } from '../../b/pagesCustomers';
import { useCharges, usePlans } from '../../hooks';
import { StatusPill, Skel, date } from '../../ui';
import { relTime } from '../../metrics';
import { customerCsv } from '../../shared';
import { downloadCsv } from '../../csv';
import { CustomerDialogs } from '../../dialogs';
import { useCustomersV2, useCustomerV2, useBulk, logEvent } from '../hooks2';
import { useCustomerList } from '../useList';
import { SORTS } from '../listModel';
import {
  KpiStrip, FilterBar, Pager, BulkBar, TestPill, initials, displayName,
  SubscriptionCard, ContactCard, UsageCard, ConnectionsCard, TeamCard, PaymentsCard, ActivityCard, NotesCard, UnitsCard, ViewAsCard,
  DangerZone, DeleteFlow, MailDialog, ContactButtons, useCustomerActions,
} from '../parts';

function SortTh({ k, list, className = '' }) {
  const on = list.sort.key === k;
  return (
    <th scope="col" className={className} aria-sort={on ? (list.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="xa-sort" onClick={() => list.setSort(k)}>
        {SORTS[k].label}
        {on ? (list.sort.dir === 'asc' ? <ArrowUp size={13} strokeWidth={2} aria-hidden /> : <ArrowDown size={13} strokeWidth={2} aria-hidden />) : null}
      </button>
    </th>
  );
}

function Signals({ c }) {
  if (c.ical_feeds == null && c.wa_ready == null) return <span className="x-muted">—</span>;
  return (
    <span className="xa-sig">
      <span title={c.ical_feeds ? (c.ical_errors ? 'יש שגיאה בסנכרון יומן' : 'יומנים מסונכרנים') : 'לא חוברו יומנים'} className={`xa-sig-i ${c.ical_feeds ? (c.ical_errors ? 'is-bad' : 'is-ok') : ''}`}>
        <CalendarDays size={15} strokeWidth={1.75} aria-hidden /><span className="adm-sr">{c.ical_feeds ? (c.ical_errors ? 'iCal: שגיאה' : 'iCal: תקין') : 'iCal: לא מחובר'}</span>
      </span>
      <span title={c.wa_ready ? 'וואטסאפ מוכן' : 'וואטסאפ לא הוגדר'} className={`xa-sig-i ${c.wa_ready ? 'is-ok' : ''}`}>
        <MessageCircle size={15} strokeWidth={1.75} aria-hidden /><span className="adm-sr">{c.wa_ready ? 'וואטסאפ: מוכן' : 'וואטסאפ: לא הוגדר'}</span>
      </span>
    </span>
  );
}

export function CustomersA() {
  const { data, isLoading, error } = useCustomersV2();
  const charges = useCharges().data || [];
  const list = useCustomerList(data || []);
  const bulk = useBulk();
  const { plans } = usePlans();
  const planName = (k) => plans.find((p) => p.key === k)?.name || k;
  const exportAll = () => {
    downloadCsv(`atlas-customers-${new Date().toISOString().slice(0, 10)}.csv`, list.rows, customerCsv(plans));
    logEvent('customers.export_csv', null, { count: list.rows.length });
  };
  return (
    <div className="xa">
      <Head title="לקוחות" sub={data ? `${list.rows.length} מתוך ${data.length}` : ' '} actions={<button type="button" className="b-btn" onClick={exportAll} disabled={!list.rows.length}><Download size={16} strokeWidth={1.75} aria-hidden />ייצוא CSV</button>} />
      <BError error={error} />
      <KpiStrip customers={data} charges={charges} />
      <FilterBar f={list.f} set={list.set} reset={list.reset} plans={plans} counts={list.counts} />
      <BulkBar selected={list.selected} rows={data || []} clear={() => list.setSelected([])} bulk={bulk} />
      <section className="xa-table-wrap" aria-label="רשימת לקוחות">
        {isLoading ? <div className="xa-pad">{Array.from({ length: 8 }, (_, i) => <Skel key={i} h={44} style={{ margin: '8px 0' }} />)}</div> : list.rows.length === 0 ? (
          <p className="x-empty">אין לקוחות שמתאימים לסינון. <button type="button" className="x-link-btn" onClick={list.reset}>ניקוי המסננים</button></p>
        ) : (
          <table className="xa-table">
            <thead>
              <tr>
                <th scope="col" className="xa-c-check"><label className="x-hit"><input type="checkbox" checked={list.allOnPage} onChange={list.togglePage} aria-label="בחירת כל הלקוחות בעמוד" /></label></th>
                <SortTh k="org_name" list={list} className="xa-c-name" />
                <th scope="col">סטטוס</th>
                <th scope="col">חבילה</th>
                <SortTh k="units_count" list={list} className="xa-c-num" />
                <SortTh k="bookings_count" list={list} className="xa-c-num" />
                <SortTh k="last_seen" list={list} />
                <SortTh k="trial_ends_at" list={list} />
                <SortTh k="created_at" list={list} />
                <th scope="col">חיבורים</th>
              </tr>
            </thead>
            <tbody>
              {list.p.rows.map((c) => {
                const sel = list.selected.includes(c.org_id);
                return (
                  <tr key={c.org_id} data-selected={sel || undefined} data-open={list.openId === c.org_id || undefined}>
                    <td className="xa-c-check"><label className="x-hit"><input type="checkbox" checked={sel} onChange={() => list.toggle(c.org_id)} aria-label={`בחירת ${displayName(c)}`} /></label></td>
                    <td className="xa-c-name">
                      <button type="button" className="xa-open" onClick={() => list.open(c.org_id)}>
                        <span className="x-av" aria-hidden>{initials(displayName(c))}</span>
                        <span className="xa-name"><b>{displayName(c)}<TestPill c={c} /></b><span className="adm-ltr">{c.owner_email}</span></span>
                      </button>
                    </td>
                    <td data-label="סטטוס"><StatusPill status={c.status} /></td>
                    <td data-label="חבילה">{planName(c.plan_key)}</td>
                    <td data-label="יחידות" className="xa-c-num adm-num">{c.units_count}</td>
                    <td data-label="הזמנות" className="xa-c-num adm-num">{c.bookings_count}</td>
                    <td data-label="כניסה">{'last_sign_in_at' in c && !c.last_sign_in_at ? <span className="x-muted">לא נכנסו</span> : relTime(c.last_sign_in_at || c.last_active_at)}</td>
                    <td data-label="סוף ניסיון">{c.status === 'trialing' || c.status === 'expired' ? date(c.trial_ends_at) : <span className="x-muted">—</span>}</td>
                    <td data-label="הצטרפו">{date(c.created_at)}</td>
                    <td data-label="חיבורים"><Signals c={c} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pager p={list.p} onPage={list.setPage} />
      </section>
      <CustomerDrawer id={list.openId} onClose={() => list.open(null)} />
    </div>
  );
}

function CustomerDrawer({ id, onClose }) {
  const { data, isLoading, error } = useCustomerV2(id);
  const c = data?.customer;
  const a = useCustomerActions(c);
  return (
    <DialogPrimitive.Root open={Boolean(id)} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="xa-scrim" />
        <DialogPrimitive.Content className="xa-drawer adm-root" dir="rtl" aria-describedby={undefined}>
          {isLoading || !c ? (
            <div className="xa-drawer-body">
              <DialogPrimitive.Title className="adm-sr">טוען לקוח</DialogPrimitive.Title>
              {error ? <BError error={error} /> : <><Skel h={64} r={16} /><Skel h={160} r={16} style={{ marginTop: 16 }} /><Skel h={220} r={16} style={{ marginTop: 16 }} /></>}
            </div>
          ) : (
            <>
              <header className="xa-drawer-head">
                <span className="x-av x-av--lg" aria-hidden>{initials(displayName(c))}</span>
                <div className="xa-drawer-id">
                  <DialogPrimitive.Title asChild><h2>{displayName(c)}</h2></DialogPrimitive.Title>
                  <p><StatusPill status={c.status} /><TestPill c={c} /><span className="adm-ltr">{c.owner_email}</span></p>
                </div>
                <DialogPrimitive.Close asChild><button type="button" className="x-icon-btn" aria-label="סגירה"><X size={20} strokeWidth={1.75} /></button></DialogPrimitive.Close>
              </header>
              <div className="xa-toolbar" role="toolbar" aria-label="פעולות על הלקוח">
                <ContactButtons c={c} />
                {a.list.map((x) => (
                  <button key={x.k} type="button" className="x-pill-btn" onClick={x.on} disabled={x.disabled} aria-pressed={x.pressed}><x.icon size={16} strokeWidth={1.75} aria-hidden />{x.label}</button>
                ))}
              </div>
              <div className="xa-drawer-body">
                {c.suspended_at ? <p className="x-warn" role="status">החשבון מושהה מאז {date(c.suspended_at)}{c.suspended_reason ? ` · ${c.suspended_reason}` : ''}</p> : null}
                {a.viewAs ? <ViewAsCard c={c} data={data} /> : null}
                <div className="xa-two"><SubscriptionCard c={c} /><ContactCard c={c} data={data} /></div>
                <UsageCard data={data} />
                <ConnectionsCard data={data} />
                <TeamCard data={data} onReset={(m) => a.setMail(m)} />
                <PaymentsCard data={data} />
                <UnitsCard data={data} />
                <NotesCard c={c} data={data} />
                <ActivityCard data={data} />
                <DangerZone c={c} canDelete={a.canDelete} onSuspend={() => a.setKind('suspend')} onDelete={() => a.setDel(true)} />
              </div>
              <CustomerDialogs customer={c} kind={a.kind} setKind={a.setKind} />
              <MailDialog c={c} member={a.mail} onClose={() => a.setMail(null)} />
              <DeleteFlow c={c} open={a.del} onOpenChange={a.setDel} onSuspend={() => a.setKind('suspend')} onDeleted={onClose} />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** /admin/customers/:id in version A = the list with that customer's drawer open. */
export function CustomerRedirectA() {
  const { id } = useParams();
  return <Navigate to={`/admin/customers?c=${id}`} replace />;
}
