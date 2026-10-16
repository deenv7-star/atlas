/**
 * Direction B — "Today" as a hospitality board: a navy day card, a visual timeline of
 * turnovers per unit, unit cards with the actual guest in each, then money and leads.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Home, ChevronLeft, LogIn, LogOut, Brush, Wallet, UserPlus } from 'lucide-react';
import {
  Page, Card, Section, SkelLine, SlowLoadNotice, EmptyState, ChannelBadge, Avatar, StatusPill, channelOf,
  fmtDay, fmtMoney, fmtShort, useLoadingGuard,
} from '@/components/ds';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { greetingFor, firstName, IncomeChart, bookingUrl, leadUrl } from '@/pages/dashboard/parts';
import { checkOutOf } from '@/pages/dashboard/useDashboardData';
import { differenceInCalendarDays } from 'date-fns';

const STATE = {
  turnover: { label: 'יציאה וכניסה היום', cls: 'bg-warning-50 text-warning-700' },
  arriving: { label: 'כניסה היום', cls: 'bg-brand-50 text-brand-700' },
  leaving: { label: 'יציאה היום', cls: 'bg-neutral-100 text-navy-900' },
  occupied: { label: 'מאוכלת', cls: 'bg-success-50 text-success-700' },
  free: { label: 'פנויה', cls: 'bg-neutral-100 text-ink-600' },
};

/* Day timeline 08:00–20:00 using the default policy: check-out by 11:00, check-in from 15:00. */
const H0 = 8;
const H1 = 20;
const pct = (h) => `${((h - H0) / (H1 - H0)) * 100}%`;

function TodayTimeline({ units }) {
  const hours = [8, 10, 12, 14, 16, 18, 20];
  const rows = units.filter((u) => u.arriving || u.leaving || u.cleaning || u.current);
  if (!rows.length) {
    return <p className="py-6 text-center text-[15px] text-ink-600">אין היום תנועה ביחידות. יום שקט.</p>;
  }
  return (
    <div>
      <div className="relative mb-2 ms-[96px] h-5 sm:ms-[120px]" aria-hidden>
        {hours.map((h) => (
          <span key={h} className={cn('absolute text-[12px] tabular text-ink-400', h % 4 !== 0 && 'hidden sm:inline')} style={{ right: pct(h), transform: 'translateX(50%)' }}>
            {String(h).padStart(2, '0')}:00
          </span>
        ))}
      </div>
      <ul className="space-y-2">
        {rows.map((u) => {
          const leave = u.leaving;
          const arrive = u.arriving;
          const stay = !leave && !arrive ? u.current : null;
          return (
            <li key={u.property.id} className="flex items-center gap-3">
              <span className="w-[84px] shrink-0 truncate text-[15px] font-bold text-navy-900 sm:w-[108px]">{u.property.name}</span>
              <div className="relative h-11 flex-1 overflow-hidden rounded-[10px] bg-neutral-100">
                {hours.slice(1, -1).map((h) => (
                  <span key={h} aria-hidden className="absolute inset-y-0 w-px bg-white" style={{ right: pct(h) }} />
                ))}
                {stay ? (
                  <Link to={bookingUrl(stay)} className="press absolute inset-y-1 flex items-center rounded-[8px] px-2.5 text-[13px] font-medium text-white" style={{ right: '0.5%', left: '0.5%', background: channelOf(stay.booking_source).hex }}>
                    <span className="truncate">{stay.guest_name} · בשהייה</span>
                  </Link>
                ) : null}
                {leave ? (
                  <Link to={bookingUrl(leave)} className="press absolute inset-y-1 flex items-center rounded-[8px] px-2.5 text-[13px] font-medium text-white" style={{ right: '0.5%', left: `calc(100% - ${pct(11)})`, background: channelOf(leave.booking_source).hex }}>
                    <LogOut className="me-1 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{leave.guest_name}</span>
                  </Link>
                ) : null}
                {u.cleaning ? (
                  <Link to={createPageUrl('Cleaning')} className="press absolute inset-y-1 flex items-center justify-center rounded-[8px] px-2 text-[13px] font-bold text-navy-900" style={{ right: pct(11.25), left: `calc(100% - ${pct(14.75)})`, background: 'var(--accent-amber)' }}>
                    <Brush className="me-1 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">ניקיון</span>
                  </Link>
                ) : null}
                {arrive ? (
                  <Link to={bookingUrl(arrive)} className="press absolute inset-y-1 flex items-center rounded-[8px] px-2.5 text-[13px] font-medium text-white" style={{ right: pct(15), left: '0.5%', background: channelOf(arrive.booking_source).hex }}>
                    <LogIn className="me-1 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{arrive.guest_name}</span>
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[13px] text-ink-400">לפי שעות ברירת המחדל: יציאה עד 11:00, כניסה מ-15:00.</p>
    </div>
  );
}

function UnitCard({ u }) {
  const st = STATE[u.state];
  const guest = u.arriving || u.current || u.leaving;
  const nightsLeft = u.current ? differenceInCalendarDays(checkOutOf(u.current), new Date()) : null;
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-[18px] font-extrabold text-navy-900">{u.property.name}</h3>
        <span className={cn('inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[13px] font-medium', st.cls)}>{st.label}</span>
      </div>
      {guest ? (
        <Link to={bookingUrl(guest)} className="press -mx-2 mt-3 flex items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-neutral-50">
          <Avatar name={guest.guest_name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-navy-900">{guest.guest_name}</span>
            <span className="block truncate text-[13px] text-ink-400">
              {u.current && nightsLeft != null ? `עוד ${nightsLeft} לילות` : `${guest.nights || 1} לילות`} · יציאה {fmtShort(checkOutOf(guest))}
            </span>
          </span>
          <ChannelBadge source={guest.booking_source} />
        </Link>
      ) : (
        <div className="mt-3 rounded-[12px] bg-neutral-50 px-3 py-3 text-[14px] text-ink-600">
          {u.next ? <>הגעה הבאה: <b className="font-semibold text-navy-900">{u.next.guest_name}</b>, {fmtShort(u.next.check_in_date)}</> : 'אין הגעות מתוכננות'}
        </div>
      )}
      <div className="mt-4" aria-label="14 הימים הקרובים">
        <div className="flex gap-[3px]" dir="rtl">
          {u.strip.map((s, i) => (
            <span
              key={i}
              title={s.booking ? s.booking.guest_name : 'פנוי'}
              className={cn('h-2.5 flex-1 rounded-full', !s.booking && 'bg-neutral-200')}
              style={s.booking ? { background: channelOf(s.booking.booking_source).hex } : undefined}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[12px] text-ink-400"><span>היום</span><span>14 יום</span></div>
      </div>
    </Card>
  );
}

function Pipeline({ leads }) {
  const cols = [
    { key: 'NEW', label: 'חדשים' },
    { key: 'CONTACTED', label: 'בטיפול' },
    { key: 'OFFER_SENT', label: 'הצעה נשלחה' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cols.map((c) => {
        const list = leads.filter((l) => l.status === c.key);
        return (
          <div key={c.key} className="min-w-0 rounded-[12px] bg-neutral-50 p-3">
            <p className="text-[13px] font-medium text-ink-600">{c.label}</p>
            <p className="mt-0.5 text-[24px] font-extrabold tabular text-navy-900">{list.length}</p>
            <ul className="mt-2 space-y-1">
              {list.slice(0, 2).map((l) => (
                <li key={l.id}>
                  <Link to={leadUrl(l)} className="block truncate rounded-[6px] text-[13px] font-medium text-brand-700 hover:underline">{l.full_name}</Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="טוען את מסך היום">
      <SkelLine className="h-[188px] rounded-[20px]" />
      <SkelLine className="mt-4 h-[220px] rounded-[14px]" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <SkelLine key={i} className="h-[180px] rounded-[14px]" />)}
      </div>
    </div>
  );
}

export default function DashboardB({ data }) {
  const quick = useQuickBooking();
  const timedOut = useLoadingGuard(data.isLoading);
  if (data.isLoading && !timedOut) return <Page wide><BoardSkeleton /></Page>;
  const name = firstName(data.user);
  const noUnits = !data.isLoading && data.allProperties.length === 0;
  const dayStats = [
    { label: 'כניסות', value: data.checkIns.length, icon: LogIn },
    { label: 'יציאות', value: data.checkOuts.length, icon: LogOut },
    { label: 'ניקיונות', value: data.cleaningsToday.length, icon: Brush },
    { label: 'בשהייה', value: data.inHouse.length, icon: Home },
  ];
  return (
    <Page wide>
      {timedOut ? <SlowLoadNotice className="mb-4" onRetry={data.refetchAll} /> : null}

      <section className="rounded-[20px] bg-navy-900 p-5 text-white md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[15px] font-medium text-white/70">{fmtDay(data.now)}</p>
            <h1 className="mt-1 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white md:text-[34px]">
              {greetingFor(data.now)}{name ? `, ${name}` : ''}
            </h1>
          </div>
          <Button onClick={() => quick.open()} className="bg-white text-navy-900 hover:bg-white/90 active:bg-white/80 md:self-auto">
            <Plus strokeWidth={2.25} />
            הזמנה חדשה
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-2 md:gap-3">
          {dayStats.map((s) => (
            <div key={s.label} className="rounded-[14px] bg-white/[0.08] px-3 py-3 md:px-4">
              <s.icon className="h-5 w-5 text-[var(--accent-amber)]" strokeWidth={1.75} />
              <p className="mt-2 text-[26px] font-extrabold leading-none tabular md:text-[30px]">{s.value}</p>
              <p className="mt-1 text-[13px] text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {data.isError ? (
        <div role="alert" className="mt-4 rounded-[14px] border border-warning-200 bg-warning-50 px-4 py-3 text-[15px] text-warning-800">
          חלק מהנתונים לא נטען. בדקו את החיבור ורעננו את הדף.
        </div>
      ) : null}

      {noUnits ? (
        <Card className="mt-4">
          <EmptyState
            icon={Home}
            title="הוסיפו את הנכס הראשון"
            description="מוסיפים את היחידות במתחם, ומכאן ההזמנות, לוח השנה והתשלומים מתחילים לעבוד."
            action={<Button asChild><Link to={createPageUrl('Onboarding')}><Plus strokeWidth={2.25} />הוספת נכס</Link></Button>}
          />
        </Card>
      ) : (
        <>
          <Section title="ציר היום" subtitle="יציאות, ניקיונות וכניסות לפי יחידה" className="mt-4">
            <TodayTimeline units={data.units} />
          </Section>

          <div className="mt-6 flex items-end justify-between">
            <h2 className="text-[20px] font-extrabold text-navy-900">היחידות</h2>
            <Link to={createPageUrl('MultiCalendar')} className="press inline-flex h-10 items-center gap-1 rounded-[10px] px-2 text-[14px] font-medium text-brand-600 hover:bg-brand-50">
              ללוח השנה <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.units.map((u) => <UnitCard key={u.property.id} u={u} />)}
          </div>
        </>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Section
          title="הכנסות"
          subtitle={`החודש ${fmtMoney(data.revenueMonth)} · תפוסה ${data.occupancy}%`}
          action={<Link to={createPageUrl('Payments')} className="press inline-flex h-10 items-center rounded-[10px] px-2 text-[14px] font-medium text-brand-600 hover:bg-brand-50">תשלומים</Link>}
        >
          <IncomeChart months={data.months} height={200} />
        </Section>
        <div className="grid content-start gap-4">
          <Section title="כסף שמחכה" subtitle={`${fmtMoney(data.outstanding)} יתרות פתוחות`} icon={Wallet} bodyClassName="px-3 pb-3 pt-1">
            {data.dueSoon.length ? (
              <ul>
                {data.dueSoon.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link to={createPageUrl('Payments')} className="press flex min-h-[52px] items-center gap-3 rounded-[10px] px-2 hover:bg-neutral-50">
                      <span className="min-w-0 flex-1 truncate text-[15px] text-navy-900">{p.description || 'תשלום פתוח'}</span>
                      <span className="text-[13px] text-ink-400">{fmtShort(p.due_date)}</span>
                      <span className="text-[15px] font-bold tabular text-navy-900">{fmtMoney(p.amount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="px-2 py-3 text-[15px] text-ink-600">אין יתרות לגבייה השבוע.</p>}
          </Section>
          <Section title="לידים" icon={UserPlus} action={<Link to={createPageUrl('Leads')} className="press inline-flex h-10 items-center rounded-[10px] px-2 text-[14px] font-medium text-brand-600 hover:bg-brand-50">לכל הלידים</Link>}>
            <Pipeline leads={data.leads} />
          </Section>
        </div>
      </div>

      {data.pendingBookings.length ? (
        <Section title="ממתינות לאישור" className="mt-4" bodyClassName="px-3 pb-3 pt-1">
          <ul>
            {data.pendingBookings.slice(0, 4).map((b) => (
              <li key={b.id}>
                <Link to={bookingUrl(b)} className="press flex min-h-[56px] items-center gap-3 rounded-[10px] px-2 hover:bg-neutral-50">
                  <Avatar name={b.guest_name} tone="amber" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-navy-900">{b.guest_name}</span>
                    <span className="block truncate text-[13px] text-ink-400">{data.propName(b.property_id, b.property_name)} · {fmtShort(b.check_in_date)}</span>
                  </span>
                  <StatusPill status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </Page>
  );
}

