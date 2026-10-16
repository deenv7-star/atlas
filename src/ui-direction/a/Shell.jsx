/**
 * v5 shell (both directions): white sidebar with hairline, indigo active state, quiet header with a
 * search field, iOS tab bar with a centre "new booking" button. No dark surfaces anywhere.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Plus, Search, ChevronsUpDown, MoreHorizontal, Building2, Check } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuickBooking } from '@/components/app/QuickBooking';
import {
  Wordmark, useShellProperties, useNavGroups, useIsActive, UserMenu, MoreSheet, navItem,
} from '@/components/app/shell/shared';
import { GuestAvatar } from '@/components/app/atoms';

export const shellClass = 'bg-canvas';

export function Sidebar({ onLogout, user }) {
  const groups = useNavGroups(user);
  const primary = groups[0].items;
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = groups.slice(1).some((g) => g.items.some((i) => isActive(i.page)));
  const linkCls = (active) => cn(
    'press flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium',
    active ? 'bg-[#EEF0FF] text-brand-700' : 'text-ink-600 hover:bg-[#F5F6F9] hover:text-navy-900',
  );
  return (
    <aside className="flex h-full w-[244px] flex-col border-l border-line bg-white" aria-label="ניווט ראשי">
      <div className="flex h-[72px] shrink-0 items-center px-6">
        <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="rounded-lg">
          <Wordmark size={21} />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
        <ul className="space-y-0.5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.page);
            return (
              <li key={item.page}>
                <Link to={createPageUrl(item.page)} aria-current={active ? 'page' : undefined} className={linkCls(active)}>
                  <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-brand-600' : 'text-ink-300')} strokeWidth={1.5} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} className={cn(linkCls(moreActive), 'w-full')}>
              <MoreHorizontal className={cn('h-[18px] w-[18px] shrink-0', moreActive ? 'text-brand-600' : 'text-ink-300')} strokeWidth={1.5} />
              <span className="truncate">עוד</span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <UserMenu user={user} onLogout={onLogout} align="start" side="top">
          <button type="button" className="press flex min-h-[52px] w-full items-center gap-3 rounded-[10px] px-2.5 text-start hover:bg-[#F5F6F9]">
            <GuestAvatar name={user?.full_name || user?.email || ''} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-navy-900">{user?.full_name || 'החשבון שלי'}</span>
              {user?.organization_name ? <span className="block truncate text-[12px] text-ink-400">{user.organization_name}</span> : null}
            </span>
          </button>
        </UserMenu>
      </div>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary.map((i) => i.page)} />
    </aside>
  );
}

function PropertySwitcher({ properties, selectedPropertyId, onPropertyChange, compact }) {
  if (properties.length < 2) return null;
  const current = properties.find((p) => p.id === selectedPropertyId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'press inline-flex h-11 max-w-[220px] items-center gap-2 rounded-[10px] border border-line bg-white px-3 text-[14px] font-medium text-navy-900 shadow-[0_1px_2px_rgba(16,24,64,0.04)] hover:bg-[#F9FAFC]',
            compact && 'h-10 px-2.5 text-[14px]',
          )}
          aria-label="בחירת יחידה"
        >
          <Building2 className="h-[18px] w-[18px] shrink-0 text-ink-400" strokeWidth={1.5} />
          <span className="truncate">{current?.name || 'כל היחידות'}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" dir="rtl">
        {[{ id: null, name: 'כל היחידות' }, ...properties].map((p) => (
          <DropdownMenuItem key={p.id ?? 'all'} onSelect={() => onPropertyChange(p.id)} className="min-h-11 justify-between text-[15px]">
            {p.name}
            {(selectedPropertyId ?? null) === p.id ? <Check className="h-4 w-4 text-brand-600" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ user, currentPageName, selectedPropertyId, onPropertyChange, onOpenCommandPalette, onLogout }) {
  const properties = useShellProperties(user);
  return (
    <header className="ds-material sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 lg:h-[64px] lg:border-line lg:bg-white/80 lg:px-10">
      {/* phone: compact title row; the page itself shows the large title */}
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
        <Wordmark size={19} />
      </div>
      {/* desktop: a quiet search field (Mercury-style), no shortcut hint */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="press hidden h-10 w-[300px] items-center gap-2.5 rounded-[10px] border border-line bg-[#F7F8FB] px-3 text-[14px] text-ink-400 hover:border-[#D9DCE6] hover:bg-white lg:inline-flex"
      >
        <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        חיפוש אורח, הזמנה או יחידה
      </button>
      <div className="hidden flex-1 lg:block" />
      <PropertySwitcher properties={properties} selectedPropertyId={selectedPropertyId} onPropertyChange={onPropertyChange} compact />
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="press inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-[#F3F4F8] lg:hidden"
        aria-label="חיפוש"
      >
        <Search className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <div className="lg:hidden">
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="press inline-flex h-11 w-11 items-center justify-center rounded-full">
            <GuestAvatar name={user?.full_name || user?.email || ''} size={32} />
          </button>
        </UserMenu>
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const slots = ['Dashboard', 'MultiCalendar', '__new__', 'Bookings', '__more__'];
  const primaryPages = ['Dashboard', 'MultiCalendar', 'Bookings'];
  const moreActive = !primaryPages.some((p) => isActive(p));
  return (
    <>
      <nav
        aria-label="ניווט תחתון"
        className="ds-material fixed inset-x-0 bottom-0 z-30 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid h-[60px] max-w-lg grid-cols-5">
          {slots.map((slot) => {
            if (slot === '__new__') {
              return (
                <li key={slot} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => quick.open()}
                    aria-label="הזמנה חדשה"
                    className="press inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_1px_2px_rgba(42,26,201,0.3),0_6px_14px_rgba(62,43,241,0.22)] active:bg-brand-700"
                  >
                    <Plus className="h-6 w-6" strokeWidth={2.25} />
                  </button>
                </li>
              );
            }
            if (slot === '__more__') {
              return (
                <li key={slot}>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className={cn('press flex h-full w-full flex-col items-center justify-center gap-1 text-[12px]', moreActive ? 'font-semibold text-brand-600' : 'font-medium text-ink-400')}
                  >
                    <MoreHorizontal className="h-6 w-6" strokeWidth={1.5} />
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
                <Link
                  to={createPageUrl(slot)}
                  aria-current={active ? 'page' : undefined}
                  className={cn('press flex h-full flex-col items-center justify-center gap-1 text-[12px]', active ? 'font-semibold text-brand-600' : 'font-medium text-ink-400')}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 1.75 : 1.5} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={['Dashboard', 'MultiCalendar', 'Bookings']} />
    </>
  );
}
