/**
 * v8 direction F (soft layered glass): no sidebar. A floating translucent pill nav at the top,
 * the active place a filled indigo pill that glides between items (Dei / glass health refs).
 * Phones: wordmark + round icon buttons on top, a floating glass tab bar with a round "+" below.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Search, Bell, Plus } from 'lucide-react';
import { Wordmark, useNavGroups, useIsActive, MoreSheet, UserMenu, navItem } from '@/components/app/shell/shared';
import { GuestAvatar, usePrefersReducedMotion } from '@/components/app/atoms';
import { IconButton } from '@/components/ds';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { useSubscription } from '@/hooks/useSubscription';

export const shellClass = 'f-canvas';

/** No side navigation in F: the top pill carries it. */
export function Sidebar() { return null; }

function TrialPill() {
  const { daysLeft, isTrialing, isExpired, isLoading } = useSubscription();
  if (isLoading || (!isTrialing && !isExpired)) return null;
  return (
    <Link to={createPageUrl('Subscription')} className="press hidden h-11 items-center rounded-full bg-white/70 px-4 text-[13px] font-semibold text-brand-700 ring-1 ring-inset ring-white xl:inline-flex">
      {isExpired ? 'הניסיון הסתיים' : `נשארו ${daysLeft} ימי ניסיון`}
    </Link>
  );
}

function NavPill({ user, onLogout }) {
  const groups = useNavGroups(user);
  const primary = groups[0].items;
  const isActive = useIsActive();
  const reduce = usePrefersReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = groups.slice(1).some((g) => g.items.some((i) => isActive(i.page)));
  const item = (active) => cn('press relative inline-flex h-11 items-center gap-2 rounded-full px-4 text-[14px] transition-colors duration-150', active ? 'font-semibold text-white' : 'font-medium text-ink-600 hover:text-navy-900');
  const Active = () => (
    <motion.span
      layoutId={reduce ? undefined : 'f-nav-active'}
      transition={{ type: 'spring', stiffness: 480, damping: 38 }}
      aria-hidden
      className="absolute inset-0 rounded-full bg-brand-600 shadow-[0_1px_2px_rgba(42,26,201,0.3),0_8px_18px_-8px_rgba(62,43,241,0.7)]"
    />
  );
  return (
    <nav aria-label="ניווט ראשי" className="f-pillnav hidden items-center rounded-full p-1.5 lg:flex">
      <ul className="flex items-center gap-0.5">
        {primary.map((it, idx) => {
          const Icon = it.icon;
          const active = isActive(it.page);
          return (
            <li key={it.page} className={cn(idx >= 5 && 'hidden xl:block')}>
              <Link to={createPageUrl(it.page)} aria-current={active ? 'page' : undefined} className={item(active)}>
                {active ? <Active /> : null}
                <Icon className="relative h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.6} aria-hidden />
                <span className="relative">{it.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={() => setMoreOpen(true)} className={item(moreActive)} aria-label="עוד">
            {moreActive ? <Active /> : null}
            <MoreHorizontal className="relative h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            <span className="relative hidden xl:inline">עוד</span>
          </button>
        </li>
      </ul>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary.map((i) => i.page)} />
    </nav>
  );
}

export function Header({ user, onOpenCommandPalette, onLogout }) {
  return (
    <header className="sticky top-0 z-20 shrink-0 px-4 pb-2 pt-3 lg:px-8 lg:pt-5">
      <div className="mx-auto flex w-full max-w-[var(--page-max,1240px)] items-center gap-3">
        <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="press inline-flex h-11 items-center rounded-full px-1">
          <Wordmark size={21} />
        </Link>
        <div className="flex flex-1 justify-center">
          <NavPill user={user} onLogout={onLogout} />
        </div>
        <TrialPill />
        <IconButton label="חיפוש" onClick={onOpenCommandPalette} className="f-pillnav bg-transparent ring-0">
          <Search strokeWidth={1.75} />
        </IconButton>
        <IconButton as={Link} to={createPageUrl('Messages')} label="הודעות" className="f-pillnav bg-transparent ring-0">
          <Bell strokeWidth={1.75} />
        </IconButton>
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="press inline-flex h-11 w-11 items-center justify-center rounded-full">
            <GuestAvatar name={user?.full_name || user?.email || ''} size={42} ring />
          </button>
        </UserMenu>
      </div>
    </header>
  );
}

/** Floating glass tab bar: icons, the active one in an indigo-tint pill, a round indigo "+" in the middle. */
export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const slots = ['Dashboard', 'MultiCalendar', '__new__', 'Bookings', '__more__'];
  const primaryPages = ['Dashboard', 'MultiCalendar', 'Bookings'];
  const moreActive = !primaryPages.some((p) => isActive(p));
  return (
    <>
      <nav aria-label="ניווט תחתון" className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] lg:hidden">
        <ul className="f-pillnav pointer-events-auto mx-auto grid h-[70px] max-w-[420px] grid-cols-5 items-center rounded-full px-1.5">
          {slots.map((slot) => {
            if (slot === '__new__') {
              return (
                <li key={slot} className="flex items-center justify-center">
                  <button type="button" onClick={() => quick.open()} aria-label="הזמנה חדשה" className="press inline-flex h-[56px] w-[56px] items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_2px_4px_rgba(42,26,201,0.3),0_12px_24px_-8px_rgba(62,43,241,0.65)]">
                    <Plus className="h-6 w-6" strokeWidth={2.25} />
                  </button>
                </li>
              );
            }
            const more = slot === '__more__';
            const it = more ? { icon: MoreHorizontal, label: 'עוד' } : navItem(slot);
            const Icon = it.icon;
            const active = more ? moreActive : isActive(slot);
            const cls = cn('press flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-full text-[11px]', active ? 'font-bold text-brand-700' : 'font-medium text-ink-600');
            const inner = (
              <>
                <span className={cn('inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200', active && 'bg-white shadow-[0_1px_2px_rgba(27,38,86,0.08)]')}>
                  <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2 : 1.6} aria-hidden />
                </span>
                {it.label}
              </>
            );
            return (
              <li key={slot}>
                {more
                  ? <button type="button" onClick={() => setMoreOpen(true)} className={cls}>{inner}</button>
                  : <Link to={createPageUrl(slot)} aria-current={active ? 'page' : undefined} className={cls}>{inner}</Link>}
              </li>
            );
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primaryPages} />
    </>
  );
}
