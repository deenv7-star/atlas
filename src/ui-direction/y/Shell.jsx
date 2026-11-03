/**
 * Y1 · "לוח בהיר, פאנל כהה". Desktop: no sidebar. The nav is one dark navy capsule in the header with
 * the active item as an indigo pill; quiet outlined circle buttons beside it. Phone: the same capsule
 * floats at the bottom. lucide 1.75, nothing filled under an icon.
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Search, Plus, Sun, CalendarRange, BedDouble, Inbox, Wallet, MoreHorizontal, Bell, LifeBuoy } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import './y1.css';

export const shellClass = 'y1-shell';

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

export function Sidebar() { return null; }

function Capsule({ id, compact = false, onMore }) {
  const active = useActive();
  const anyOn = NAV.some((n) => active(n.page));
  return (
    <ul className={cn('y1-cap', compact && 'y1-cap--m')}>
      {NAV.filter((n) => !compact || n.page !== 'Bookings').map(({ page, label, icon: Icon }) => {
        const on = active(page);
        return (
          <li key={page}>
            <Link to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('y1-cap-i press', on && 'on')}>
              {on ? <motion.i layoutId={`y1-on-${id}`} className="y1-cap-on" transition={SPRING} /> : null}
              <Icon strokeWidth={1.75} /><span>{label}</span>
            </Link>
          </li>
        );
      })}
      {compact ? (
        <li>
          <button type="button" onClick={onMore} className={cn('y1-cap-i press', !anyOn && 'on')}>
            {!anyOn ? <motion.i layoutId={`y1-on-${id}`} className="y1-cap-on" transition={SPRING} /> : null}
            <MoreHorizontal strokeWidth={1.75} /><span>עוד</span>
          </button>
        </li>
      ) : null}
    </ul>
  );
}

export function Header({ user, onOpenCommandPalette, onLogout }) {
  const quick = useQuickBooking();
  return (
    <header className="y1-head">
      <div className="y1-head-in">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="y1-logo"><Wordmark size={22} /></Link>
        <nav aria-label="ניווט" className="y1-head-nav"><Capsule id="d" /></nav>
        <div className="y1-head-end">
          <button type="button" onClick={onOpenCommandPalette} className="y1-cb press" aria-label="חיפוש אורח, הזמנה או יחידה"><Search strokeWidth={1.75} /></button>
          <button type="button" className="y1-cb press y1-hide-m" aria-label="עזרה" onClick={() => window.dispatchEvent(new CustomEvent('atlas:open-support'))}><LifeBuoy strokeWidth={1.75} /></button>
          <Link to={createPageUrl('Messages')} className="y1-cb press" aria-label="הודעות"><Bell strokeWidth={1.75} /><i className="y1-cb-dot" aria-hidden /></Link>
          <button type="button" className="y1-new press y1-hide-m" onClick={() => quick.open()}><Plus strokeWidth={2} />הזמנה חדשה</button>
          <UserMenu user={user} onLogout={onLogout}>
            <button type="button" aria-label="החשבון שלי" className="y1-me press">
              <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={42} />
            </button>
          </UserMenu>
        </div>
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <nav aria-label="ניווט" className="y1-tab">
        <Capsule id="m" compact onMore={() => setMoreOpen(true)} />
        <button type="button" onClick={() => quick.open()} className="y1-tab-new press" aria-label="הזמנה חדשה"><Plus strokeWidth={2} /></button>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={NAV.map((n) => n.page)} />
    </>
  );
}
