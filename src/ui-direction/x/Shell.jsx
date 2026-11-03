/**
 * X3 · "פנים" (people and places first). No sidebar on any screen size: one floating dock at the
 * bottom, the same on the phone and on the desktop, with the indigo "+" in its middle. The active
 * item is a white-on-navy pill that slides between items. Header is just the greeting.
 * One line-icon set (lucide 1.75). No tiles, no shadows under icons.
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Search, Plus, Sun, CalendarRange, Inbox, Wallet, MoreHorizontal, Bell, LifeBuoy } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar, dayPart } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { firstName, formatDayHe, todayISO } from '@/lib/stay/format';
import './x.css';

export const shellClass = 'x3-shell';

const NAV = [
  { page: 'Dashboard', label: 'היום', icon: Sun },
  { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
  { page: 'Leads', label: 'פניות', icon: Inbox },
  { page: 'Payments', label: 'כסף', icon: Wallet },
];
const SPRING = { type: 'spring', duration: 0.42, bounce: 0.16 };

function useActive() {
  const isActive = useIsActive();
  const { pathname } = useLocation();
  return (page) => (page === 'Dashboard' ? (isActive(page) || pathname === '/' || pathname.startsWith('/today')) : isActive(page));
}

export function Sidebar() { return null; }

export function Header({ user, onOpenCommandPalette, onLogout }) {
  const name = firstName(user?.full_name || '');
  return (
    <header className="x3-head">
      <div className="x3-head-in">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="x3-logo"><Wordmark size={20} /></Link>
        <div className="x3-hello">
          <p className="x3-hello-t">{dayPart().greeting}{name ? `, ${name}` : ''}</p>
          <p className="x3-hello-d">{formatDayHe(todayISO())}{user?.organization_name ? ` · ${user.organization_name}` : ''}</p>
        </div>
        <button type="button" onClick={onOpenCommandPalette} className="x3-ib press" aria-label="חיפוש אורח, הזמנה או יחידה"><Search strokeWidth={1.75} /></button>
        <button type="button" className="x3-ib press" aria-label="עזרה" onClick={() => window.dispatchEvent(new CustomEvent('atlas:open-support'))}><LifeBuoy strokeWidth={1.75} /></button>
        <Link to={createPageUrl('Messages')} className="x3-ib press" aria-label="הודעות"><Bell strokeWidth={1.75} /></Link>
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="x3-ib press">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={38} />
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
  const anyOn = NAV.some((n) => active(n.page));
  const item = ({ page, label, icon: Icon }) => {
    const on = active(page);
    return (
      <li key={page}>
        <Link to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('x3-dk press', on && 'on')}>
          {on ? <motion.i layoutId="x3-dock-on" className="x3-dk-on" transition={SPRING} /> : null}
          <Icon strokeWidth={1.75} /><span>{label}</span>
        </Link>
      </li>
    );
  };
  return (
    <>
      <nav aria-label="ניווט" className="x3-dock">
        <ul>
          {item(NAV[0])}{item(NAV[1])}
          <li><button type="button" onClick={() => quick.open()} className="x3-dk-new press" aria-label="הזמנה חדשה"><Plus strokeWidth={2} /></button></li>
          {item(NAV[2])}{item(NAV[3])}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} className={cn('x3-dk press', !anyOn && 'on')}>
              {!anyOn ? <motion.i layoutId="x3-dock-on" className="x3-dk-on" transition={SPRING} /> : null}
              <MoreHorizontal strokeWidth={1.75} /><span>עוד</span>
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={NAV.map((n) => n.page)} />
    </>
  );
}
