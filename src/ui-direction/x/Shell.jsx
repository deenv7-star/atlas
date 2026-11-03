/**
 * X2 · "ציר חי" (the day as a live line). Desktop: a quiet white sidebar, words with line icons, the
 * active item marked by a thin indigo edge that glides between items. Phone: a floating white pill
 * where only the active tab carries its label, and the label grows out of the icon when you switch.
 * One line-icon set (lucide 1.75). No tiles, no shadows under icons.
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Search, Plus, Sun, CalendarRange, CalendarDays, Inbox, Wallet, MoreHorizontal, Settings } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar, dayPart } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { firstName } from '@/lib/stay/format';
import './x.css';

export const shellClass = 'x2-shell';

const NAV = [
  { page: 'Dashboard', label: 'היום', icon: Sun },
  { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
  { page: 'Bookings', label: 'הזמנות', icon: CalendarDays },
  { page: 'Leads', label: 'פניות', icon: Inbox },
  { page: 'Payments', label: 'כסף', icon: Wallet },
];
const SPRING = { type: 'spring', duration: 0.42, bounce: 0.14 };

function useActive() {
  const isActive = useIsActive();
  const { pathname } = useLocation();
  return (page) => (page === 'Dashboard' ? (isActive(page) || pathname === '/' || pathname.startsWith('/today')) : isActive(page));
}

export function Sidebar({ onLogout, user }) {
  const active = useActive();
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <aside className="x2-side" aria-label="ניווט ראשי">
      <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="x2-logo"><Wordmark size={20} /></Link>
      <nav className="x2-nav">
        {NAV.map(({ page, label, icon: Icon }) => {
          const on = active(page);
          return (
            <Link key={page} to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('x2-ni', on && 'on')}>
              {on ? <motion.i layoutId="x2-edge" className="x2-edge" transition={SPRING} /> : null}
              <Icon strokeWidth={1.75} /><span>{label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(true)} className="x2-ni"><MoreHorizontal strokeWidth={1.75} /><span>עוד</span></button>
      </nav>
      <div className="x2-side-foot">
        <Link to={createPageUrl('Settings')} className="x2-ni"><Settings strokeWidth={1.75} /><span>הגדרות</span></Link>
        <UserMenu user={user} onLogout={onLogout} side="left">
          <button type="button" className="x2-me press">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={36} />
            <span className="x2-me-t"><b>{user?.full_name || ''}</b><span>{user?.organization_name || ''}</span></span>
          </button>
        </UserMenu>
      </div>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={NAV.map((n) => n.page)} />
    </aside>
  );
}

export function Header({ user, onOpenCommandPalette, onLogout }) {
  const quick = useQuickBooking();
  const name = firstName(user?.full_name || '');
  return (
    <header className="x2-head">
      <div className="x2-head-in">
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="x2-ib press lg:hidden">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={36} />
          </button>
        </UserMenu>
        <p className="x2-hello">{dayPart().greeting}{name ? `, ${name}` : ''}</p>
        <button type="button" onClick={onOpenCommandPalette} className="x2-search press"><Search strokeWidth={1.75} /><span>חיפוש אורח, הזמנה או יחידה</span></button>
        <button type="button" onClick={onOpenCommandPalette} className="x2-ib press lg:hidden" aria-label="חיפוש"><Search strokeWidth={1.75} /></button>
        <button type="button" onClick={() => quick.open()} className="x2-new press" aria-label="הזמנה חדשה"><Plus strokeWidth={2} /><span>הזמנה חדשה</span></button>
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const active = useActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs = [NAV[0], NAV[1], NAV[3], NAV[4]];
  const anyOn = tabs.some((n) => active(n.page));
  return (
    <>
      <nav aria-label="ניווט תחתון" className="x2-tabs lg:hidden">
        <ul>
          {tabs.map(({ page, label, icon: Icon }) => {
            const on = active(page);
            return (
              <li key={page}>
                <Link to={createPageUrl(page)} aria-current={on ? 'page' : undefined} aria-label={label} className={cn('x2-tab press', on && 'on')}>
                  {on ? <motion.i layoutId="x2-tab-bg" className="x2-tab-bg" transition={SPRING} /> : null}
                  <Icon strokeWidth={1.75} />
                  <AnimatePresence initial={false}>
                    {on ? <motion.span key="l" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>{label}</motion.span> : null}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} aria-label="עוד" className={cn('x2-tab press', !anyOn && 'on')}><MoreHorizontal strokeWidth={1.75} /></button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={tabs.map((n) => n.page)} />
    </>
  );
}
