/**
 * v8 direction C, "bento command center" (brand/refs-app-deen.md, refs: DealDeck sales report,
 * Fenco "Hello", activity floating sidebar).
 *   - Sidebar: a detached white panel floating on the lilac-grey canvas, the complex as a small
 *     photo card on top, the active item a filled indigo tile, the indigo plan card at the bottom.
 *   - Header: the owner's own photo + "בוקר טוב, יעל", a search pill and round icon buttons.
 *   - TabBar (phones): floating white pill, the active tab a filled tint pill with its label,
 *     a round indigo "+" in the centre.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { heCount } from '@/lib/hebrewCount';
import { MoreHorizontal, Search, Bell, Settings, Building2, Check, Plus, ArrowUpLeft, Gem } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wordmark, useNavGroups, useIsActive, MoreSheet, UserMenu, useShellProperties, navItem } from '@/components/app/shell/shared';
import { GuestAvatar, UnitPhoto, dayPart } from '@/components/app/atoms';
import { IconButton } from '@/components/ds';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { useSubscription } from '@/hooks/useSubscription';
import { trialShortText, TRIAL_DAYS } from '@/lib/trial';
import { formatDayHe, todayISO, firstName } from '@/lib/stay/format';

export const shellClass = 'bg-canvas';

/* ── Sidebar ───────────────────────────────────────────────────────────────── */
function PlanCard() {
  const { daysLeft, isTrialing, isExpired, isLoading } = useSubscription();
  if (isLoading) return null;
  const trial = isTrialing || isExpired;
  const title = isExpired || isTrialing ? trialShortText(daysLeft, isExpired) : 'ATLAS Pro';
  const sub = trial ? 'בוחרים מסלול וממשיכים בלי הפסקה.' : 'כל הערוצים, התשלומים וההודעות במקום אחד.';
  const pct = isTrialing ? Math.max(6, Math.min(100, ((TRIAL_DAYS - (daysLeft || 0)) / TRIAL_DAYS) * 100)) : null;
  return (
    <div className="c-plan relative overflow-hidden rounded-[24px] bg-brand-600 p-4 text-white">
      <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        <Gem className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <p className="mt-3 text-[16px] font-bold leading-tight">{title}</p>
      <p className="mt-1 text-[13px] leading-snug text-white/85">{sub}</p>
      {pct != null ? (
        <span aria-hidden className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/20"><span className="block h-full rounded-full bg-white" style={{ width: `${pct}%` }} /></span>
      ) : null}
      <Link
        to={createPageUrl('Subscription')}
        className="press mt-3.5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-bold text-brand-700 hover:bg-[#F4F3FF]"
      >
        {trial ? 'בחירת מסלול' : 'ניהול המנוי'}
        <ArrowUpLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}

function WorkspaceCard({ user }) {
  const properties = useShellProperties(user);
  const name = user?.organization_name || '';
  if (!name && !properties.length) return null;
  return (
    <div className="mx-3 mb-4 flex items-center gap-3 rounded-[20px] bg-[#F4F4FA] p-2.5">
      <UnitPhoto property={properties[0]} className="h-11 w-11" rounded="rounded-[14px]" />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold text-navy-900">{name || 'המתחם שלי'}</p>
        <p className="truncate text-[12px] text-ink-400">{heCount(properties.length, 'unit')}</p>
      </div>
    </div>
  );
}

export function Sidebar({ onLogout, user }) {
  const groups = useNavGroups(user);
  const primary = groups[0].items;
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = groups.slice(1).some((g) => g.items.some((i) => isActive(i.page)));
  const linkCls = (active) => cn(
    'press flex h-12 items-center gap-3 rounded-[16px] px-3.5 text-[15px] transition-colors duration-150',
    active
      ? 'bg-brand-600 font-semibold text-white shadow-[0_1px_2px_rgba(42,26,201,0.3),0_12px_22px_-12px_rgba(62,43,241,0.8)]'
      : 'font-medium text-ink-600 hover:bg-[#F4F4FA] hover:text-navy-900',
  );
  return (
    <div className="h-full py-4 ps-4">
      <aside className="flex h-full w-[256px] flex-col rounded-[30px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.04),0_18px_48px_-18px_rgba(27,38,86,0.18)]" aria-label="ניווט ראשי">
        <div className="flex h-[78px] shrink-0 items-center px-6">
          <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="-mx-2 inline-flex h-11 items-center rounded-full px-2">
            <Wordmark size={22} />
          </Link>
        </div>
        <WorkspaceCard user={user} />
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {primary.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.page);
              return (
                <li key={item.page}>
                  <Link to={createPageUrl(item.page)} aria-current={active ? 'page' : undefined} className={linkCls(active)}>
                    <Icon className={cn('h-[19px] w-[19px] shrink-0', active ? 'text-white' : 'text-ink-400')} strokeWidth={active ? 2 : 1.6} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button type="button" onClick={() => setMoreOpen(true)} className={cn(linkCls(moreActive), 'w-full')}>
                <MoreHorizontal className={cn('h-[19px] w-[19px] shrink-0', moreActive ? 'text-white' : 'text-ink-400')} strokeWidth={1.6} />
                <span className="truncate">עוד</span>
              </button>
            </li>
          </ul>
        </nav>
        <div className="p-3">
          <PlanCard />
        </div>
        <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary.map((i) => i.page)} />
      </aside>
    </div>
  );
}

/* ── Header ────────────────────────────────────────────────────────────────── */
function UnitSwitcher({ properties, selectedPropertyId, onPropertyChange }) {
  if (properties.length < 2) return null;
  const current = properties.find((p) => p.id === selectedPropertyId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'press relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.06)] hover:bg-[#F7F8FC]',
            current && 'bg-brand-50 text-brand-700',
          )}
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

export function Header({ user, selectedPropertyId, onPropertyChange, onOpenCommandPalette, onLogout }) {
  const properties = useShellProperties(user);
  const quick = useQuickBooking();
  const name = firstName(user?.full_name || '') || '';
  const greeting = `${dayPart().greeting}${name ? `, ${name}` : ''}`;
  return (
    <header className="sticky top-0 z-20 shrink-0 bg-[color-mix(in_srgb,var(--canvas)_88%,transparent)] px-5 pb-2 pt-3 backdrop-blur-md lg:px-10 lg:pb-3 lg:pt-6">
      <div className="mx-auto flex w-full max-w-[var(--page-max,1200px)] items-center gap-3">
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="press inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full lg:h-[52px] lg:w-[52px]">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={48} ring className="shadow-[0_6px_16px_-8px_rgba(27,38,86,0.45)] lg:!h-[52px] lg:!w-[52px]" />
          </button>
        </UserMenu>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-extrabold leading-tight tracking-[-0.01em] text-navy-900 lg:text-[24px] lg:tracking-[-0.02em]">{greeting}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-400 lg:text-[14px]">{formatDayHe(todayISO())}{user?.organization_name ? <span className="hidden sm:inline"> · {user.organization_name}</span> : null}</p>
        </div>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="press hidden h-12 w-[280px] items-center gap-2.5 rounded-full bg-white px-5 text-[14px] text-ink-400 shadow-[0_1px_2px_rgba(27,38,86,0.05)] hover:text-navy-900 xl:inline-flex 2xl:w-[320px]"
        >
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          חיפוש אורח, הזמנה או יחידה
        </button>
        <IconButton label="חיפוש" onClick={onOpenCommandPalette} className="ring-0 xl:hidden">
          <Search strokeWidth={1.75} />
        </IconButton>
        <div className="hidden lg:block">
          <UnitSwitcher properties={properties} selectedPropertyId={selectedPropertyId} onPropertyChange={onPropertyChange} />
        </div>
        <IconButton as={Link} to={createPageUrl('Messages')} label="הודעות" className="ring-0">
          <Bell strokeWidth={1.75} />
        </IconButton>
        <IconButton as={Link} to={createPageUrl('Settings')} label="הגדרות" className="hidden ring-0 lg:inline-flex">
          <Settings strokeWidth={1.75} />
        </IconButton>
        <button
          type="button"
          onClick={() => quick.open()}
          className="press hidden h-12 shrink-0 items-center gap-1.5 rounded-full bg-brand-600 pe-5 ps-4 text-[14px] font-bold text-white shadow-[0_10px_22px_-10px_rgba(62,43,241,0.75)] hover:bg-brand-500 lg:inline-flex"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />
          הזמנה חדשה
        </button>
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
    'press mx-auto flex h-[52px] w-full max-w-[76px] flex-col items-center justify-center gap-0.5 rounded-[20px] text-[11px] transition-colors duration-200',
    active ? 'bg-[#ECEAFE] font-bold text-brand-700' : 'font-medium text-ink-400',
  );
  return (
    <>
      <nav aria-label="ניווט תחתון" className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] lg:hidden">
        <ul className="pointer-events-auto mx-auto grid h-[68px] max-w-[420px] grid-cols-5 items-center gap-0.5 rounded-[28px] bg-white/95 px-2 shadow-[0_1px_2px_rgba(27,38,86,0.06),0_18px_44px_-12px_rgba(27,38,86,0.3)] backdrop-blur-md">
          {slots.map((slot) => {
            if (slot === '__new__') {
              return (
                <li key={slot} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => quick.open()}
                    aria-label="הזמנה חדשה"
                    className="press inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_2px_4px_rgba(42,26,201,0.3),0_10px_22px_-6px_rgba(62,43,241,0.6)] active:bg-brand-700"
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
                    <MoreHorizontal className="h-[21px] w-[21px]" strokeWidth={1.75} />
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
                  <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2 : 1.6} />
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
