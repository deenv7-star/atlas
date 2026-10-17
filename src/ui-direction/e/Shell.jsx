/**
 * v8 direction E (guest-centric CRM): a slim floating pill rail with an icon over a short label,
 * the active place sits in a filled indigo pill that glides between items. A quiet top bar
 * (search pill, bell, account) and the floating mobile tab bar.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Search, Bell, Plus } from 'lucide-react';
import { useNavGroups, useIsActive, MoreSheet, UserMenu, navItem } from '@/components/app/shell/shared';
import { GuestAvatar, usePrefersReducedMotion } from '@/components/app/atoms';
import { IconButton } from '@/components/ds';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { PlanCard } from '@/components/app/shell/v7';

export const shellClass = 'bg-canvas';

function RailItem({ to, onClick, active, icon: Icon, label, reduce }) {
  const Comp = to ? Link : 'button';
  return (
    <Comp
      {...(to ? { to, 'aria-current': active ? 'page' : undefined } : { type: 'button', onClick })}
      className={cn('e-rail-item press relative flex h-[60px] w-[64px] flex-col items-center justify-center gap-1 rounded-[22px]', active ? 'text-white' : 'text-ink-600 hover:text-navy-900')}
    >
      {active ? (
        <motion.span
          layoutId={reduce ? undefined : 'e-rail-active'}
          transition={{ type: 'spring', stiffness: 520, damping: 40 }}
          aria-hidden
          className="absolute inset-0 rounded-[22px] bg-brand-600 shadow-[0_1px_2px_rgba(42,26,201,0.3),0_10px_22px_-10px_rgba(62,43,241,0.75)]"
        />
      ) : null}
      <Icon className="relative h-[21px] w-[21px]" strokeWidth={active ? 2 : 1.6} aria-hidden />
      <span className={cn('relative text-[11px] leading-none', active ? 'font-bold' : 'font-medium')}>{label}</span>
    </Comp>
  );
}

export function Sidebar({ onLogout, user }) {
  const groups = useNavGroups(user);
  const primary = groups[0].items;
  const isActive = useIsActive();
  const reduce = usePrefersReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = groups.slice(1).some((g) => g.items.some((i) => isActive(i.page)));
  return (
    <div className="flex h-full flex-col items-center gap-3 py-4 ps-4">
      <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="press inline-flex h-[60px] w-[84px] items-center justify-center rounded-[26px] bg-white shadow-[var(--shadow-card)] ring-1 ring-[#E8EAF2]/70">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-[17px] font-extrabold text-white" dir="ltr">A</span>
      </Link>
      <aside aria-label="ניווט ראשי" className="flex w-[84px] flex-col items-center rounded-[30px] bg-white py-2.5 shadow-[var(--shadow-card)] ring-1 ring-[#E8EAF2]/70">
        <nav>
          <ul className="flex flex-col items-center gap-1">
            {primary.map((item) => (
              <li key={item.page}>
                <RailItem to={createPageUrl(item.page)} active={isActive(item.page)} icon={item.icon} label={item.label} reduce={reduce} />
              </li>
            ))}
            <li>
              <RailItem onClick={() => setMoreOpen(true)} active={moreActive} icon={MoreHorizontal} label="עוד" reduce={reduce} />
            </li>
          </ul>
        </nav>
      </aside>
      <div className="mt-auto">
        <PlanCard compact />
      </div>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary.map((i) => i.page)} />
    </div>
  );
}

export function Header({ user, onOpenCommandPalette, onLogout }) {
  return (
    <header className="sticky top-0 z-20 shrink-0 bg-[color-mix(in_srgb,var(--canvas)_88%,transparent)] px-5 pb-2 pt-3 backdrop-blur-md lg:px-8 lg:pt-4">
      <div className="mx-auto flex w-full max-w-[var(--page-max,1280px)] items-center gap-2.5">
        <div className="lg:hidden">
          <UserMenu user={user} onLogout={onLogout}>
            <button type="button" aria-label="החשבון שלי" className="press inline-flex h-11 w-11 items-center justify-center rounded-full">
              <GuestAvatar name={user?.full_name || user?.email || ''} size={40} ring />
            </button>
          </UserMenu>
        </div>
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="press hidden h-12 w-[360px] items-center gap-2.5 rounded-full bg-white px-5 text-[14px] text-ink-400 shadow-[0_1px_2px_rgba(27,38,86,0.05)] ring-1 ring-inset ring-[#E8EAF2] hover:text-navy-900 lg:inline-flex"
        >
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
          חיפוש אורח, טלפון או הזמנה
        </button>
        <div className="flex-1" />
        <IconButton label="חיפוש" onClick={onOpenCommandPalette} className="lg:hidden">
          <Search strokeWidth={1.75} />
        </IconButton>
        <IconButton as={Link} to={createPageUrl('Messages')} label="הודעות">
          <Bell strokeWidth={1.75} />
        </IconButton>
        <div className="hidden lg:block">
          <UserMenu user={user} onLogout={onLogout}>
            <button type="button" className="press flex h-12 items-center gap-2.5 rounded-full bg-white py-1 pe-1.5 ps-4 shadow-[0_1px_2px_rgba(27,38,86,0.05)] ring-1 ring-inset ring-[#E8EAF2] hover:bg-[#F7F8FC]" aria-label="החשבון שלי">
              <span className="text-start leading-tight">
                <span className="block max-w-[150px] truncate text-[14px] font-semibold text-navy-900">{user?.full_name || 'החשבון שלי'}</span>
                <span className="block max-w-[150px] truncate text-[12px] text-ink-400">{user?.organization_name || 'בעלים'}</span>
              </span>
              <GuestAvatar name={user?.full_name || user?.email || ''} size={38} />
            </button>
          </UserMenu>
        </div>
      </div>
    </header>
  );
}

/** Floating white pill tab bar; the active tab is a filled indigo pill with its label, the "+" is round. */
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
        <ul className="pointer-events-auto mx-auto grid h-[70px] max-w-[420px] grid-cols-5 items-center rounded-full bg-white px-1.5 shadow-[0_1px_2px_rgba(27,38,86,0.06),0_18px_40px_-12px_rgba(27,38,86,0.3)] ring-1 ring-[#E8EAF2]">
          {slots.map((slot) => {
            if (slot === '__new__') {
              return (
                <li key={slot} className="flex items-center justify-center">
                  <button type="button" onClick={() => quick.open()} aria-label="הזמנה חדשה" className="press inline-flex h-[56px] w-[56px] items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_2px_4px_rgba(42,26,201,0.3),0_10px_22px_-6px_rgba(62,43,241,0.6)]">
                    <Plus className="h-6 w-6" strokeWidth={2.25} />
                  </button>
                </li>
              );
            }
            const more = slot === '__more__';
            const item = more ? { icon: MoreHorizontal, label: 'עוד' } : navItem(slot);
            const Icon = item.icon;
            const active = more ? moreActive : isActive(slot);
            const cls = cn('press mx-auto flex h-[52px] w-full max-w-[72px] flex-col items-center justify-center gap-0.5 rounded-full text-[11px]', active ? 'bg-brand-50 font-bold text-brand-700' : 'font-medium text-ink-400');
            return (
              <li key={slot}>
                {more ? (
                  <button type="button" onClick={() => setMoreOpen(true)} className={cls}>
                    <Icon className="h-[21px] w-[21px]" strokeWidth={1.75} aria-hidden />{item.label}
                  </button>
                ) : (
                  <Link to={createPageUrl(slot)} aria-current={active ? 'page' : undefined} className={cls}>
                    <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2 : 1.6} aria-hidden />{item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primaryPages} />
    </>
  );
}
