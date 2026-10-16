/**
 * Direction A — "Today" as a calm agenda: what needs you today first, numbers second.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LogIn, LogOut, Brush, Wallet, UserPlus, Clock, ChevronLeft, Plus, Home, CalendarCheck2,
  BarChart3, Users,
} from 'lucide-react';
import {
  Page, Card, Section, StatTile, SkelLine, SkelRows, SlowLoadNotice, EmptyState, fmtDay, fmtMoney, fmtShort,
  useLoadingGuard,
} from '@/components/ds';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { greetingFor, firstName, IncomeChart, UpcomingList, bookingUrl, leadUrl } from '@/pages/dashboard/parts';

const TONE = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  amber: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  navy: 'bg-neutral-100 text-navy-900',
};

function AgendaRow({ icon: Icon, tone, title, meta, to, cta }) {
  return (
    <li>
      <Link to={to} className="press group flex min-h-[64px] items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-neutral-50">
        <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]', TONE[tone])}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-navy-900">{title}</span>
          {meta ? <span className="block truncate text-[13px] text-ink-400">{meta}</span> : null}
        </span>
        <span className="hidden shrink-0 text-[14px] font-medium text-brand-600 sm:inline">{cta}</span>
        <ChevronLeft className="h-4 w-4 shrink-0 text-ink-400 transition-transform duration-150 group-hover:-translate-x-0.5" />
      </Link>
    </li>
  );
}

function buildAgenda(d) {
  const rows = [];
  d.checkOuts.forEach((b) => rows.push({ key: `out-${b.id}`, icon: LogOut, tone: 'navy', title: `יציאה: ${b.guest_name || 'אורח'}`, meta: `${d.propName(b.property_id, b.property_name)} · לסגור חשבון ולבדוק את היחידה`, to: bookingUrl(b), cta: 'פרטי הזמנה' }));
  d.cleaningsToday.forEach((t) => rows.push({ key: `cl-${t.id}`, icon: Brush, tone: 'amber', title: `ניקיון: ${d.propName(t.property_id)}`, meta: `${t.title || 'ניקיון'}${t.cleaner_name || t.assigned_to_name ? ` · ${t.cleaner_name || t.assigned_to_name}` : ''}`, to: createPageUrl('Cleaning'), cta: 'למשימה' }));
  d.checkIns.forEach((b) => rows.push({ key: `in-${b.id}`, icon: LogIn, tone: 'brand', title: `כניסה: ${b.guest_name || 'אורח'}`, meta: `${d.propName(b.property_id, b.property_name)} · ${b.nights || 1} לילות`, to: bookingUrl(b), cta: 'פרטי הזמנה' }));
  d.dueSoon.slice(0, 3).forEach((p) => rows.push({ key: `pay-${p.id}`, icon: Wallet, tone: 'danger', title: `יתרה לגבייה: ${fmtMoney(p.amount)}`, meta: `${p.description || 'תשלום פתוח'} · עד ${fmtShort(p.due_date)}`, to: createPageUrl('Payments'), cta: 'לתשלומים' }));
  d.newLeads.slice(0, 3).forEach((l) => rows.push({ key: `lead-${l.id}`, icon: UserPlus, tone: 'success', title: `ליד חדש: ${l.full_name || 'ללא שם'}`, meta: l.check_in_date ? `מבקש ${fmtShort(l.check_in_date)}${l.nights ? ` · ${l.nights} לילות` : ''}` : 'מחכה לתשובה', to: leadUrl(l), cta: 'לחזור אליו' }));
  d.pendingBookings.slice(0, 2).forEach((b) => rows.push({ key: `pend-${b.id}`, icon: Clock, tone: 'amber', title: `הזמנה ממתינה לאישור: ${b.guest_name || 'אורח'}`, meta: `${d.propName(b.property_id, b.property_name)} · ${fmtShort(b.check_in_date)}`, to: bookingUrl(b), cta: 'לאשר' }));
  return rows;
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="טוען את מסך היום">
      <SkelLine className="h-4 w-32" />
      <SkelLine className="mt-3 h-9 w-64 max-w-full" />
      <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5"><SkelLine className="mb-5 h-5 w-40" /><SkelRows rows={4} /></Card>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <Card key={i} className="p-5"><SkelLine className="h-4 w-20" /><SkelLine className="mt-4 h-8 w-24" /></Card>)}
        </div>
      </div>
    </div>
  );
}

export default function DashboardA({ data }) {
  const quick = useQuickBooking();
  const [showAll, setShowAll] = useState(false);
  const timedOut = useLoadingGuard(data.isLoading);
  const name = firstName(data.user);
  const agenda = data.isLoading ? [] : buildAgenda(data);
  const noUnits = !data.isLoading && data.allProperties.length === 0;

  if (data.isLoading && !timedOut) return <Page><DashboardSkeleton /></Page>;

  return (
    <Page>
      {timedOut ? <SlowLoadNotice className="mb-5" onRetry={data.refetchAll} /> : null}
      <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[15px] font-medium text-ink-600">{fmtDay(data.now)}</p>
          <h1 className="mt-1 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-navy-900 md:text-[34px]">
            {greetingFor(data.now)}{name ? `, ${name}` : ''}
          </h1>
          {!noUnits ? (
            <p className="mt-2 text-[16px] text-ink-600">
              {agenda.length === 0 ? 'היום פנוי. אין כניסות, יציאות או משימות פתוחות.' : `${agenda.length} דברים מחכים לכם היום.`}
            </p>
          ) : null}
        </div>
        <Button onClick={() => quick.open()} className="hidden lg:inline-flex">
          <Plus strokeWidth={2.25} />
          הזמנה חדשה
        </Button>
      </header>

      {data.isError ? (
        <div role="alert" className="mb-5 rounded-[14px] border border-warning-200 bg-warning-50 px-4 py-3 text-[15px] text-warning-800">
          חלק מהנתונים לא נטען. בדקו את החיבור ורעננו את הדף.
        </div>
      ) : null}

      {noUnits ? (
        <Card className="mb-6">
          <EmptyState
            icon={Home}
            title="הוסיפו את הנכס הראשון"
            description="מוסיפים את היחידות במתחם, ומכאן ההזמנות, לוח השנה והתשלומים מתחילים לעבוד."
            action={<Button asChild><Link to={createPageUrl('Onboarding')}><Plus strokeWidth={2.25} />הוספת נכס</Link></Button>}
          />
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr] lg:gap-6">
        <Section
          title="מה מחכה לכם היום"
          subtitle={`${data.checkIns.length} כניסות · ${data.checkOuts.length} יציאות · ${data.cleaningsToday.length} ניקיונות`}
          bodyClassName="px-2 pb-3 pt-1"
        >
          {agenda.length ? (
            <>
              <ul className="space-y-0.5">{(showAll ? agenda : agenda.slice(0, 6)).map(({ key, ...r }) => <AgendaRow key={key} {...r} />)}</ul>
              {agenda.length > 6 ? (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="press mx-3 mt-1 inline-flex h-11 items-center rounded-[10px] px-2 text-[15px] font-medium text-brand-600 hover:bg-brand-50">
                  {showAll ? 'להציג פחות' : `להציג את כל ה-${agenda.length}`}
                </button>
              ) : null}
            </>
          ) : (
            <EmptyState compact icon={CalendarCheck2} title="אין משימות פתוחות להיום" description="כשתהיה כניסה, יציאה, ניקיון או תשלום שמחכה, הוא יופיע כאן." />
          )}
        </Section>

        <div className="grid grid-cols-2 content-start gap-3 lg:gap-4">
          <StatTile label="תפוסה החודש" value={`${data.occupancy}%`} hint={`${data.properties.length} יחידות`} icon={BarChart3} />
          <StatTile label="הכנסות החודש" value={fmtMoney(data.revenueMonth, { compact: true })} hint="תשלומים שהתקבלו" icon={Wallet} tone="success" />
          <StatTile label="יתרות פתוחות" value={fmtMoney(data.outstanding, { compact: true })} hint={`${data.dueSoon.length} לגבייה השבוע`} icon={Clock} tone="amber" />
          <StatTile label="לידים פתוחים" value={data.openLeads.length} hint={`${data.newLeads.length} חדשים`} icon={Users} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[1.45fr_1fr] lg:gap-6">
        <Section title="הכנסות" subtitle="6 החודשים האחרונים" action={<Link to={createPageUrl('Payments')} className="press inline-flex h-10 items-center rounded-[10px] px-2 text-[14px] font-medium text-brand-600 hover:bg-brand-50">לכל התשלומים</Link>}>
          <IncomeChart months={data.months} />
        </Section>
        <Section title="הגעות קרובות" action={<Link to={createPageUrl('Bookings')} className="press inline-flex h-10 items-center rounded-[10px] px-2 text-[14px] font-medium text-brand-600 hover:bg-brand-50">לכל ההזמנות</Link>} bodyClassName="px-3 pb-3 pt-1">
          <UpcomingList items={data.upcoming} propName={data.propName} onEmptyAction={() => quick.open()} />
        </Section>
      </div>
    </Page>
  );
}
