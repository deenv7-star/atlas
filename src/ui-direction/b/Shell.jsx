/**
 * Direction B — "rich hospitality". Navy sidebar, units as chips under the header,
 * floating tab bar on phones. Same brand, same words, different structure.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Plus, Search, MoreHorizontal, ChevronsUpDown } from 'lucide-react';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { PAGE_TITLES } from '@/config/navigation';
import {
  Wordmark, useShellProperties, useNavGroups, useIsActive, initialsOf, UserMenu, MoreSheet, navItem,
} from '@/components/app/shell/shared';

export const shellClass = 'bg-canvas';

export function Sidebar({ onLogout, user }) {
  const groups = useNavGroups(user);
  const isActive = useIsActive();
  return (
    <aside className="flex h-full w-[248px] flex-col bg-navy-900 text-white" aria-label="ניווט ראשי">
      <div className="flex h-[76px] shrink-0 items-center px-6">
        <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="rounded-lg">
          <Wordmark size={24} inverted />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgba(255,255,255,.2)_transparent]">
        {groups.map((g) => (
          <div key={g.id} className="mt-4 first:mt-0">
            {g.label ? <p className="px-3 pb-1.5 text-[13px] font-medium text-white/50">{g.label}</p> : null}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.page);
                return (
                  <li key={item.page}>
                    <Link
                      to={createPageUrl(item.page)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'press flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px]',
                        active ? 'bg-brand-600 font-bold text-white' : 'font-medium text-white/80 hover:bg-white/[0.07] hover:text-white',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <UserMenu user={user} onLogout={onLogout} align="start" side="top">
          <button type="button" className="press flex min-h-[52px] w-full items-center gap-3 rounded-[12px] px-2.5 text-start hover:bg-white/[0.07]">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-amber text-[13px] font-bold text-navy-900" style={{ background: 'var(--accent-amber)' }}>{initialsOf(user)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold text-white">{user?.full_name || 'החשבון שלי'}</span>
              <span className="block truncate text-[13px] text-white/55">{user?.organization_name || user?.email}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 text-white/50" />
          </button>
        </UserMenu>
      </div>
    </aside>
  );
}

function UnitChips({ properties, selectedPropertyId, onPropertyChange }) {
  if (!properties.length) return null;
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
  const quick = useQuickBooking();
  const title = PAGE_TITLES[currentPageName] || '';
  return (
    <header className="ds-material sticky top-0 z-20 shrink-0 border-b border-line px-4 lg:px-8">
      <div className="flex h-14 items-center gap-3 lg:h-[68px]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink-400 lg:hidden">{user?.organization_name || 'ATLAS'}</p>
          <p className="truncate text-[17px] font-extrabold text-navy-900 lg:text-[20px]">{title}</p>
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
        <button
          type="button"
          onClick={() => quick.open()}
          className="press hidden h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-[15px] font-bold text-white hover:bg-brand-500 lg:inline-flex"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />
          הזמנה חדשה
        </button>
        <div className="lg:hidden">
          <UserMenu user={user} onLogout={onLogout}>
            <button type="button" aria-label="החשבון שלי" className="press inline-flex h-11 w-11 items-center justify-center rounded-full">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-navy-900" style={{ background: 'var(--accent-amber)' }}>{initialsOf(user)}</span>
            </button>
          </UserMenu>
        </div>
      </div>
      <div className="lg:hidden">
        <UnitChips properties={properties} selectedPropertyId={selectedPropertyId} onPropertyChange={onPropertyChange} />
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const slots = ['Today', 'MultiCalendar', '__new__', 'Bookings', '__more__'];
  const moreActive = !['Today', 'MultiCalendar', 'Bookings'].some((p) => isActive(p));
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
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} />
    </>
  );
}
