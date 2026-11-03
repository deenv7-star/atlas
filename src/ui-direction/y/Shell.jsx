/**
 * Y2 · "זכוכית" (after the visionOS fitness board Deen sent). The app floats over a real photo of a
 * zimmer: a frosted vertical rail (desktop), a floating glass toolbar on top, and a glass capsule at the
 * bottom on the phone. Active item: a white pill, indigo icon. lucide 1.75, nothing filled under icons.
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Search, Plus, Sun, CalendarRange, BedDouble, Inbox, Wallet, MoreHorizontal, Bell, LifeBuoy, Settings } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import './y2.css';

export const shellClass = 'y2-shell';

const NAV = [
  { page: 'Dashboard', label: 'היום', icon: Sun },
  { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
  { page: 'Bookings', label: 'הזמנות', icon: BedDouble },
  { page: 'Leads', label: 'פניות', icon: Inbox },
  { page: 'Payments', label: 'כסף', icon: Wallet },
];
const SPRING = { type: 'spring', duration: 0.45, bounce: 0.18 };

function useActive() {
  const isActive = useIsActive();
  const { pathname } = useLocation();
  return (page) => (page === 'Dashboard' ? (isActive(page) || pathname === '/' || pathname.startsWith('/today')) : isActive(page));
}

export function Sidebar({ user, onLogout }) {
  const active = useActive();
  return (
    <aside className="y2-rail" aria-label="ניווט">
      <Link to={createPageUrl('Dashboard')} className="y2-rail-logo" aria-label="atlas, מסך היום"><Wordmark size={17} /></Link>
      <ul>
        {NAV.map(({ page, label, icon: Icon }) => {
          const on = active(page);
          return (
            <li key={page}>
              <Link to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('y2-ri press', on && 'on')}>
                {on ? <motion.i layoutId="y2-rail-on" className="y2-ri-on" transition={SPRING} /> : null}
                <Icon strokeWidth={1.75} /><span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="y2-rail-end">
        <Link to={createPageUrl('Settings')} className="y2-ri press" aria-label="הגדרות"><Settings strokeWidth={1.75} /><span>הגדרות</span></Link>
        <UserMenu user={user} onLogout={onLogout} side="left">
          <button type="button" aria-label="החשבון שלי" className="y2-rail-me press">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={44} />
          </button>
        </UserMenu>
      </div>
    </aside>
  );
}

export function Header({ user, onOpenCommandPalette, onLogout }) {
  const quick = useQuickBooking();
  return (
    <header className="y2-head">
      <div className="y2-bar">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="y2-bar-logo"><Wordmark size={19} /></Link>
        <button type="button" onClick={onOpenCommandPalette} className="y2-search press">
          <Search strokeWidth={1.75} /><span>חיפוש אורח, הזמנה או יחידה</span>
        </button>
        <button type="button" className="y2-gb press y2-hide-m" aria-label="עזרה" onClick={() => window.dispatchEvent(new CustomEvent('atlas:open-support'))}><LifeBuoy strokeWidth={1.75} /></button>
        <Link to={createPageUrl('Messages')} className="y2-gb press" aria-label="הודעות"><Bell strokeWidth={1.75} /><i className="y2-gb-dot" aria-hidden /></Link>
        <button type="button" className="y2-gb y2-gb--ind press y2-hide-m" onClick={() => quick.open()} aria-label="הזמנה חדשה"><Plus strokeWidth={2} /></button>
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="y2-bar-me press">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={36} />
          </button>
        </UserMenu>
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const active = useActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = NAV.filter((n) => n.page !== 'Bookings');
  const anyOn = items.some((n) => active(n.page));
  return (
    <>
      <nav aria-label="ניווט" className="y2-tab">
        <ul>
          {items.map(({ page, label, icon: Icon }) => {
            const on = active(page);
            return (
              <li key={page}>
                <Link to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('y2-ti press', on && 'on')}>
                  {on ? <motion.i layoutId="y2-tab-on" className="y2-ti-on" transition={SPRING} /> : null}
                  <Icon strokeWidth={1.75} /><span>{label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} className={cn('y2-ti press', !anyOn && 'on')}>
              {!anyOn ? <motion.i layoutId="y2-tab-on" className="y2-ti-on" transition={SPRING} /> : null}
              <MoreHorizontal strokeWidth={1.75} /><span>עוד</span>
            </button>
          </li>
        </ul>
        <button type="button" onClick={() => quick.open()} className="y2-tab-new press" aria-label="הזמנה חדשה"><Plus strokeWidth={2} /></button>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={items.map((n) => n.page)} />
    </>
  );
}
