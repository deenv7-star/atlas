/**
 * v8 direction D, "mobile-first task app" (brand/refs-app-deen.md, ref: the mobile task app
 * "Let's make today productive" / "Task schedule").
 *   - Phones: the owner's photo + greeting, round icon buttons, and a floating pill tab bar with a
 *     round indigo "+" in the centre (the active tab is a filled navy pill with its label).
 *   - Desktop: no sidebar. A clean floating pill navigation across the top (active = filled indigo),
 *     the content below as a wide centred column with a right context panel (see DSplit).
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Search, Bell, Plus, Building2, Check } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wordmark, useNavGroups, useIsActive, MoreSheet, UserMenu, useShellProperties, navItem } from '@/components/app/shell/shared';
import { GuestAvatar, dayPart } from '@/components/app/atoms';
import { IconButton } from '@/components/ds';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { formatDayHe, todayISO, firstName } from '@/lib/stay/format';

export const shellClass = 'bg-canvas';

/** No sidebar in D: navigation lives in the top pill bar (desktop) and the tab bar (phones). */
export function Sidebar() {
  return null;
}

function UnitSwitcher({ properties, selectedPropertyId, onPropertyChange }) {
  if (properties.length < 2) return null;
  const current = properties.find((p) => p.id === selectedPropertyId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn('press inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.06)] hover:bg-[#F7F8FC]', current && 'bg-brand-50 text-brand-700')}
          aria-label={current ? `יחידה: ${current.name}` : 'בחירת יחידה, כל היחידות'}
        >
          <Building2 className="h-[19px] w-[19px]" strokeWidth={1.75} />
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

function TopNav({ user, onLogout }) {
  const groups = useNavGroups(user);
  const primary = groups[0].items.filter((i) => i.page !== 'Settings');
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = !primary.some((i) => isActive(i.page));
  const cls = (on) => cn(
    'press inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[14px] transition-colors duration-150 xl:px-[18px] xl:text-[15px]',
    on ? 'bg-brand-600 font-semibold text-white shadow-[0_8px_18px_-8px_rgba(62,43,241,0.7)]' : 'font-medium text-ink-600 hover:bg-[#F3F4F9] hover:text-navy-900',
  );
  return (
    <nav aria-label="ניווט ראשי" className="rounded-full bg-white p-1 shadow-[0_1px_2px_rgba(27,38,86,0.05),0_10px_28px_-14px_rgba(27,38,86,0.2)]">
      <ul className="flex items-center gap-0.5">
        {primary.map((item) => {
          const Icon = item.icon;
          const on = isActive(item.page);
          return (
            <li key={item.page}>
              <Link to={createPageUrl(item.page)} aria-current={on ? 'page' : undefined} className={cls(on)}>
                <Icon className="hidden h-[18px] w-[18px] xl:block" strokeWidth={on ? 2 : 1.6} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={() => setMoreOpen(true)} className={cls(moreActive)} aria-label="עוד מסכים">
            <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            <span className="hidden xl:inline">עוד</span>
          </button>
        </li>
      </ul>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary.map((i) => i.page)} />
    </nav>
  );
}

export function Header({ user, currentPageName, selectedPropertyId, onPropertyChange, onOpenCommandPalette, onLogout }) {
  const properties = useShellProperties(user);
  const quick = useQuickBooking();
  const name = firstName(user?.full_name || '') || '';
  const home = currentPageName === 'Dashboard' || currentPageName === 'Today';
  const avatar = (size) => (
    <UserMenu user={user} onLogout={onLogout}>
      <button type="button" aria-label="החשבון שלי" className="press inline-flex shrink-0 items-center justify-center rounded-full" style={{ width: Math.max(44, size), height: Math.max(44, size) }}>
        <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={size} ring className="shadow-[0_6px_14px_-8px_rgba(27,38,86,0.5)]" />
      </button>
    </UserMenu>
  );
  return (
    <header className="sticky top-0 z-20 shrink-0 bg-[color-mix(in_srgb,var(--canvas)_88%,transparent)] backdrop-blur-md">
      {/* phones */}
      <div className="flex items-center gap-3 px-5 pb-2 pt-3 lg:hidden">
        {avatar(44)}
        <div className="min-w-0 flex-1">
          {home ? (
            <>
              <p className="truncate text-[13px] text-ink-400">{dayPart().greeting}</p>
              <p className="truncate text-[16px] font-bold leading-tight text-navy-900">{user?.full_name || name || 'החשבון שלי'}</p>
            </>
          ) : (
            <span className="inline-flex h-9 items-center rounded-full bg-white px-3.5 text-[13px] font-semibold text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)]">{formatDayHe(todayISO())}</span>
          )}
        </div>
        <IconButton label="חיפוש" onClick={onOpenCommandPalette} className="ring-0">
          <Search strokeWidth={1.75} />
        </IconButton>
        <IconButton as={Link} to={createPageUrl('Messages')} label="הודעות" className="ring-0">
          <Bell strokeWidth={1.75} />
        </IconButton>
      </div>

      {/* desktop: floating top pill navigation */}
      <div className="mx-auto hidden w-full max-w-[var(--page-max,1280px)] items-center gap-3 px-10 pb-3 pt-5 lg:flex">
        <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="inline-flex h-11 shrink-0 items-center rounded-full px-1">
          <Wordmark size={22} />
        </Link>
        <div className="flex min-w-0 flex-1 justify-center">
          <TopNav user={user} onLogout={onLogout} />
        </div>
        <IconButton label="חיפוש" onClick={onOpenCommandPalette} className="ring-0">
          <Search strokeWidth={1.75} />
        </IconButton>
        <UnitSwitcher properties={properties} selectedPropertyId={selectedPropertyId} onPropertyChange={onPropertyChange} />
        <IconButton as={Link} to={createPageUrl('Messages')} label="הודעות" className="ring-0">
          <Bell strokeWidth={1.75} />
        </IconButton>
        <button
          type="button"
          onClick={() => quick.open()}
          className="press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-navy-900 pe-5 ps-4 text-[14px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(27,38,86,0.6)] hover:bg-[#25316B]"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />
          הזמנה חדשה
        </button>
        {avatar(44)}
      </div>
    </header>
  );
}

/* ── Tab bar (phones) ──────────────────────────────────────────────────────── */
export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const slots = ['Dashboard', 'MultiCalendar', '__new__', 'Bookings', '__more__'];
  const primaryPages = ['Dashboard', 'MultiCalendar', 'Bookings'];
  const moreActive = !primaryPages.some((p) => isActive(p));
  const tab = (active) => cn(
    'press mx-auto flex h-[50px] w-full max-w-[74px] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] transition-colors duration-200',
    active ? 'bg-navy-900 font-bold text-white' : 'font-medium text-ink-400',
  );
  return (
    <>
      <nav aria-label="ניווט תחתון" className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden">
        <ul className="pointer-events-auto mx-auto grid h-[66px] max-w-[400px] grid-cols-5 items-center gap-0.5 rounded-full bg-white/95 px-2 shadow-[0_1px_2px_rgba(27,38,86,0.06),0_18px_44px_-12px_rgba(27,38,86,0.3)] backdrop-blur-md">
          {slots.map((slot) => {
            if (slot === '__new__') {
              return (
                <li key={slot} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => quick.open()}
                    aria-label="הזמנה חדשה"
                    className="press -mt-7 inline-flex h-[60px] w-[60px] items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_0_0_5px_var(--canvas),0_12px_24px_-8px_rgba(62,43,241,0.75)] active:bg-brand-700"
                  >
                    <Plus className="h-7 w-7" strokeWidth={2.25} />
                  </button>
                </li>
              );
            }
            if (slot === '__more__') {
              return (
                <li key={slot}>
                  <button type="button" onClick={() => setMoreOpen(true)} className={tab(moreActive)}>
                    <MoreHorizontal className="h-[20px] w-[20px]" strokeWidth={1.75} />
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
                  <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2 : 1.6} />
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
