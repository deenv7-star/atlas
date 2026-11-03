/**
 * X1 · "מכתב הבוקר" (editorial). No sidebar: on desktop the navigation is a quiet line of words in the
 * top bar, like a magazine masthead. On phones a flat white tab bar with a hairline and a sliding
 * indicator. One line-icon set (lucide, 1.75), no tiles, no shadows under icons.
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Search, Plus, Sun, CalendarRange, Inbox, Wallet, MoreHorizontal, Bell } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import './x.css';

export const shellClass = 'x1-shell';

const NAV = [
  { page: 'Dashboard', label: 'היום', icon: Sun },
  { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
  { page: 'Leads', label: 'פניות', icon: Inbox },
  { page: 'Payments', label: 'כסף', icon: Wallet },
];

function useActive() {
  const isActive = useIsActive();
  const { pathname } = useLocation();
  return (page) => (page === 'Dashboard' ? (isActive(page) || pathname === '/' || pathname.startsWith('/today')) : isActive(page));
}

export function Sidebar() { return null; }

export function Header({ user, onOpenCommandPalette, onLogout }) {
  const active = useActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <header className="x1-head">
      <div className="x1-head-in">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="x1-logo"><Wordmark size={20} /></Link>
        <nav className="x1-mast" aria-label="ניווט ראשי">
          {NAV.map(({ page, label }) => {
            const on = active(page);
            return (
              <Link key={page} to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('x1-mast-i', on && 'on')}>
                {label}
                {on ? <motion.i layoutId="x1-mast-line" className="x1-mast-line" transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }} /> : null}
              </Link>
            );
          })}
          <Link to={createPageUrl('Bookings')} className={cn('x1-mast-i', active('Bookings') && 'on')}>הזמנות</Link>
          <button type="button" className="x1-mast-i" onClick={() => setMoreOpen(true)}>עוד</button>
        </nav>
        <span className="x1-grow" />
        <button type="button" onClick={onOpenCommandPalette} className="x1-ib press" aria-label="חיפוש אורח, הזמנה או יחידה"><Search strokeWidth={1.75} /></button>
        <Link to={createPageUrl('Messages')} className="x1-ib press x1-desk" aria-label="הודעות"><Bell strokeWidth={1.75} /></Link>
        <button type="button" onClick={() => quick.open()} className="x1-new press"><Plus strokeWidth={2} /><span>הזמנה חדשה</span></button>
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="x1-me press">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={36} />
          </button>
        </UserMenu>
      </div>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={[...NAV.map((n) => n.page), 'Bookings']} />
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const active = useActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const anyOn = NAV.some((n) => active(n.page));
  return (
    <>
      <nav aria-label="ניווט תחתון" className="x1-tabs lg:hidden">
        <ul>
          {NAV.map(({ page, label, icon: Icon }) => {
            const on = active(page);
            return (
              <li key={page}>
                <Link to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('x1-tab press', on && 'on')}>
                  {on ? <motion.i layoutId="x1-tab-line" className="x1-tab-line" transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }} /> : null}
                  <Icon strokeWidth={1.75} /><span>{label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} className={cn('x1-tab press', !anyOn && 'on')}>
              <MoreHorizontal strokeWidth={1.75} /><span>עוד</span>
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={NAV.map((n) => n.page)} />
    </>
  );
}
