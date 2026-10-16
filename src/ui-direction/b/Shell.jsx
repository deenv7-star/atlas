/**
 * Direction B — "rich hospitality". Navy sidebar, units as chips under the header,
 * floating tab bar on phones. Same brand, same words, different structure.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { useQuickBooking } from '@/components/app/QuickBooking';
import {
  Wordmark, useShellProperties, useNavGroups, useIsActive, initialsOf, UserMenu, MoreSheet, navItem,
} from '@/components/app/shell/shared';

export const shellClass = 'bg-canvas';

export function Sidebar({ onLogout, user }) {
  const groups = useNavGroups(user);
  const primary = groups[0].items;
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = groups.slice(1).some((g) => g.items.some((i) => isActive(i.page)));
  const linkCls = (active) => cn(
    'press flex h-12 items-center gap-3.5 rounded-[12px] px-3.5 text-[16px]',
    active ? 'bg-white/[0.12] font-bold text-white' : 'font-medium text-white/75 hover:bg-white/[0.07] hover:text-white',
  );
  return (
    <aside className="flex h-full w-[248px] flex-col bg-navy-900 text-white" aria-label="ניווט ראשי">
      <div className="flex h-[76px] shrink-0 items-center px-6">
        <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="rounded-lg">
          <Wordmark size={24} inverted />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-1">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.page);
            return (
              <li key={item.page}>
                <Link to={createPageUrl(item.page)} aria-current={active ? 'page' : undefined} className={linkCls(active)}>
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} className={cn(linkCls(moreActive), 'w-full')}>
              <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              <span className="truncate">עוד</span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="border-t border-white/10 p-3">
        <UserMenu user={user} onLogout={onLogout} align="start" side="top">
          <button type="button" className="press flex min-h-[52px] w-full items-center gap-3 rounded-[12px] px-2.5 text-start hover:bg-white/[0.07]">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-amber text-[13px] font-bold text-navy-900" style={{ background: 'var(--accent-amber)' }}>{initialsOf(user)}</span>
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-white">{user?.full_name || 'החשבון שלי'}</span>
          </button>
        </UserMenu>
      </div>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary.map((i) => i.page)} />
    </aside>
  );
}

function UnitChips({ properties, selectedPropertyId, onPropertyChange }) {
  if (properties.length < 2) return null;
  const all = [{ id: null, name: 'כל המתחם' }, ...properties];
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 lg:mx-0 lg:px-0 lg:pb-0 [scrollbar-width:none]" role="tablist" aria-label="בחירת יחידה">
      {all.map((p) => {
        const active = (selectedPropertyId ?? null) === p.id;
        return (
          <button
            key={p.id ?? 'all'}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onPropertyChange(p.id)}
            className={cn(
              'press inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-[14px] font-medium',
              active ? 'border-navy-900 bg-navy-900 text-white' : 'border-line bg-white text-navy-900 hover:border-neutral-300',
            )}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

export function Header({ user, currentPageName, selectedPropertyId, onPropertyChange, onOpenCommandPalette, onLogout }) {
  const properties = useShellProperties(user);
  return (
    <header className="ds-material sticky top-0 z-20 shrink-0 border-b border-line px-4 lg:border-transparent lg:bg-transparent lg:px-10">
      <div className="flex h-14 items-center gap-3 lg:h-[68px]">
        <div className="min-w-0 flex-1">
          <span className="lg:hidden"><Wordmark size={19} /></span>
        </div>
        <div className="hidden lg:block">
          <UnitChips properties={properties} selectedPropertyId={selectedPropertyId} onPropertyChange={onPropertyChange} />
        </div>
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="press inline-flex h-11 w-11 items-center justify-center rounded-full text-navy-900 hover:bg-neutral-100"
          aria-label="חיפוש"
        >
          <Search className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <div className="lg:hidden">
          <UserMenu user={user} onLogout={onLogout}>
            <button type="button" aria-label="החשבון שלי" className="press inline-flex h-11 w-11 items-center justify-center rounded-full">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-navy-900" style={{ background: 'var(--accent-amber)' }}>{initialsOf(user)}</span>
            </button>
          </UserMenu>
        </div>
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const slots = ['Dashboard', 'MultiCalendar', '__new__', 'Bookings', '__more__'];
  const moreActive = !['Dashboard', 'MultiCalendar', 'Bookings'].some((p) => isActive(p));
  return (
    <>
      <nav aria-label="ניווט תחתון" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 lg:hidden">
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center rounded-[22px] bg-navy-900 px-1 shadow-[0_10px_30px_rgba(27,38,86,0.35)]">
          {slots.map((slot) => {
            if (slot === '__new__') {
              return (
                <li key={slot} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => quick.open()}
                    aria-label="הזמנה חדשה"
                    className="press inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-brand-600 text-white active:bg-brand-700"
                  >
                    <Plus className="h-6 w-6" strokeWidth={2.25} />
                  </button>
                </li>
              );
            }
            const isMore = slot === '__more__';
            const item = isMore ? { label: 'עוד', icon: MoreHorizontal } : navItem(slot);
            const Icon = item.icon;
            const active = isMore ? moreActive : isActive(slot);
            const cls = cn(
              'press flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-[16px] text-[12px]',
              active ? 'font-bold text-white' : 'font-medium text-white/60',
            );
            const inner = (
              <>
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2 : 1.75} />
                {item.label}
                <span aria-hidden className={cn('mt-0.5 h-1 w-1 rounded-full', active ? 'bg-[var(--accent-amber)]' : 'bg-transparent')} />
              </>
            );
            return (
              <li key={slot}>
                {isMore ? (
                  <button type="button" onClick={() => setMoreOpen(true)} className={cls}>{inner}</button>
                ) : (
                  <Link to={createPageUrl(slot)} aria-current={active ? 'page' : undefined} className={cls}>{inner}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={['Dashboard', 'MultiCalendar', 'Bookings']} />
    </>
  );
}
