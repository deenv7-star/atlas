/**
 * v7 shell parts shared by both layout directions (brand/refs-app-deen.md):
 *   - Header: time-aware personal greeting + date, search pill, round icon buttons, avatar
 *   - TabBar: floating pill bottom bar with a round indigo "+" in the centre (phones)
 *   - PlanCard: the small indigo plan / trial card at the bottom of the sidebar
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Plus, Search, ChevronsUpDown, MoreHorizontal, Building2, Check, Bell, ArrowUpLeft } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { useShellProperties, useIsActive, UserMenu, MoreSheet, navItem } from '@/components/app/shell/shared';
import { GuestAvatar, dayPart } from '@/components/app/atoms';
import { IconButton } from '@/components/ds';
import { useSubscription } from '@/hooks/useSubscription';
import { trialShortText } from '@/lib/trial';
import { getPlanByKey } from '@/config/pricing';
import { formatDayHe, todayISO, firstName } from '@/lib/stay/format';

/** Re-renders on the hour so "בוקר טוב" turns into "צהריים טובים" without a reload. */
function useGreeting(user) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 10 * 60 * 1000);
    return () => window.clearInterval(t);
  }, []);
  const name = firstName(user?.full_name || '') || '';
  return { text: `${dayPart().greeting}${name ? `, ${name}` : ''}`, date: formatDayHe(todayISO()) };
}

function PropertySwitcher({ properties, selectedPropertyId, onPropertyChange }) {
  if (properties.length < 2) return null;
  const current = properties.find((p) => p.id === selectedPropertyId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="press inline-flex h-11 max-w-[200px] items-center gap-2 rounded-full bg-white px-4 text-[14px] font-medium text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.06)] ring-1 ring-inset ring-[#E8EAF2] hover:bg-[#F7F8FC]"
          aria-label="בחירת יחידה"
        >
          <Building2 className="h-[18px] w-[18px] shrink-0 text-ink-400" strokeWidth={1.5} />
          <span className="truncate">{current?.name || 'כל היחידות'}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-[16px]" dir="rtl">
        {[{ id: null, name: 'כל היחידות' }, ...properties].map((p) => (
          <DropdownMenuItem key={p.id ?? 'all'} onSelect={() => onPropertyChange(p.id)} className="min-h-11 justify-between rounded-[10px] text-[15px]">
            {p.name}
            {(selectedPropertyId ?? null) === p.id ? <Check className="h-4 w-4 text-brand-600" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ user, selectedPropertyId, onPropertyChange, onOpenCommandPalette, onLogout, wide = false }) {
  const properties = useShellProperties(user);
  const g = useGreeting(user);
  return (
    <header className={cn('sticky top-0 z-20 shrink-0 bg-[color-mix(in_srgb,var(--canvas)_86%,transparent)] backdrop-blur-md', 'px-5 pt-3 pb-2 lg:px-10 lg:pt-6 lg:pb-3')}>
      <div className={cn('mx-auto flex w-full items-center gap-3', 'max-w-[var(--page-max,1200px)]')}>
        {/* greeting: avatar + name on phones, text only on desktop (the avatar sits at the far end) */}
        <div className="lg:hidden">
          <UserMenu user={user} onLogout={onLogout}>
            <button type="button" aria-label="החשבון שלי" className="press inline-flex h-11 w-11 items-center justify-center rounded-full">
              <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={40} ring />
            </button>
          </UserMenu>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-navy-900 lg:text-[22px] lg:font-extrabold lg:tracking-[-0.02em]">
            {g.text} <span aria-hidden>👋</span>
          </p>
          <p className="mt-0.5 truncate text-[12px] text-ink-400 lg:mt-1 lg:text-[14px]">{g.date}</p>
        </div>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="press hidden h-11 w-[280px] items-center gap-2.5 rounded-full bg-white px-4 text-[14px] text-ink-400 shadow-[0_1px_2px_rgba(27,38,86,0.05)] ring-1 ring-inset ring-[#E8EAF2] hover:text-navy-900 lg:inline-flex xl:w-[320px]"
        >
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          חיפוש אורח, הזמנה או יחידה
        </button>
        <div className="hidden lg:block">
          <PropertySwitcher properties={properties} selectedPropertyId={selectedPropertyId} onPropertyChange={onPropertyChange} />
        </div>
        <IconButton label="חיפוש" onClick={onOpenCommandPalette} className="lg:hidden">
          <Search strokeWidth={1.75} />
        </IconButton>
        <IconButton as={Link} to={createPageUrl('Messages')} label="הודעות">
          <Bell strokeWidth={1.75} />
        </IconButton>
        <div className="hidden lg:block">
          <UserMenu user={user} onLogout={onLogout}>
            <button type="button" className="press flex h-11 items-center gap-2.5 rounded-full bg-white py-1 pe-1 ps-4 shadow-[0_1px_2px_rgba(27,38,86,0.05)] ring-1 ring-inset ring-[#E8EAF2] hover:bg-[#F7F8FC]" aria-label="החשבון שלי">
              <span className="max-w-[140px] truncate text-[14px] font-semibold text-navy-900">{user?.full_name || 'החשבון שלי'}</span>
              <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={36} />
            </button>
          </UserMenu>
        </div>
      </div>
    </header>
  );
}

/** Floating pill tab bar: four destinations around a round indigo "+" (new booking). */
export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const slots = ['Dashboard', 'MultiCalendar', '__new__', 'Bookings', '__more__'];
  const primaryPages = ['Dashboard', 'MultiCalendar', 'Bookings'];
  const moreActive = !primaryPages.some((p) => isActive(p));
  const tab = (active) => cn(
    'press flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-full text-[11px]',
    active ? 'font-bold text-brand-600' : 'font-medium text-ink-400',
  );
  return (
    <>
      <nav
        aria-label="ניווט תחתון"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] lg:hidden"
      >
        <ul className="pointer-events-auto mx-auto grid h-[68px] max-w-[420px] grid-cols-5 items-center rounded-full bg-white/95 px-1.5 shadow-[0_1px_2px_rgba(27,38,86,0.06),0_16px_40px_-10px_rgba(27,38,86,0.28)] ring-1 ring-[#E8EAF2] backdrop-blur-md">
          {slots.map((slot) => {
            if (slot === '__new__') {
              return (
                <li key={slot} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => quick.open()}
                    aria-label="הזמנה חדשה"
                    className="press inline-flex h-[54px] w-[54px] items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_2px_4px_rgba(42,26,201,0.3),0_10px_22px_-6px_rgba(62,43,241,0.6)] active:bg-brand-700"
                  >
                    <Plus className="h-6 w-6" strokeWidth={2.25} />
                  </button>
                </li>
              );
            }
            if (slot === '__more__') {
              return (
                <li key={slot}>
                  <button type="button" onClick={() => setMoreOpen(true)} className={tab(moreActive)}>
                    <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={1.75} />
                    עוד
                  </button>
                </li>
              );
            }
            const item = navItem(slot);
            const Icon = item.icon;
            const active = isActive(slot);
            return (
              <li key={slot}>
                <Link to={createPageUrl(slot)} aria-current={active ? 'page' : undefined} className={tab(active)}>
                  <span className={cn('inline-flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-200', active && 'bg-[#ECEAFE]')}>
                    <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2 : 1.6} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primaryPages} />
    </>
  );
}

/** Small indigo card at the bottom of the sidebar: trial days left, or the plan. */
export function PlanCard({ compact = false }) {
  const { daysLeft, isTrialing, isExpired, isLoading, plan } = useSubscription();
  if (isLoading) return null;
  const title = isExpired || isTrialing ? trialShortText(daysLeft, isExpired) : `atlas ${getPlanByKey(plan).nameHe}`;
  const sub = isTrialing || isExpired ? 'בוחרים מסלול וממשיכים בלי הפסקה.' : 'ערוצים, תשלומים והודעות במקום אחד.';
  if (compact) {
    return (
      <Link to={createPageUrl('Subscription')} className="v7-tt press inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_8px_18px_-6px_rgba(62,43,241,0.6)]" aria-label={`${title}, מנוי`}>
        <span className="text-[13px] font-extrabold tabular">{isTrialing ? daysLeft : <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />}</span>
        <span className="v7-tt-label" aria-hidden>{title}</span>
      </Link>
    );
  }
  return (
    <div className="v7-hero p-4">
      <p className="text-[15px] font-bold">{title}</p>
      <p className="mt-1 text-[13px] leading-snug text-white/80">{sub}</p>
      <Link
        to={createPageUrl('Subscription')}
        className="press mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-bold text-brand-700 hover:bg-[#F4F3FF]"
      >
        {isTrialing || isExpired ? 'בחירת מסלול' : 'ניהול המנוי'}
        <ArrowUpLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}
