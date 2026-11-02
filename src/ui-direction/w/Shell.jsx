/**
 * W1 · "בנטו עם צילום" (refs IMG_0397 + IMG_0928): a slim white icon rail on desktop, a light header
 * with the owner's greeting, and on phones a floating white pill tab bar with a round indigo "+".
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Search, Bell, Plus, MoreHorizontal, Settings, Sun, CalendarRange, Inbox, Wallet, CalendarDays } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar, dayPart } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { formatDayHe, todayISO, firstName } from '@/lib/stay/format';
import './w.css';

export const shellClass = 'bg-canvas w1-shell';

const RAIL = [
  { page: 'Dashboard', label: 'היום', icon: Sun },
  { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
  { page: 'Bookings', label: 'הזמנות', icon: CalendarDays },
  { page: 'Leads', label: 'פניות', icon: Inbox },
  { page: 'Payments', label: 'כסף', icon: Wallet },
];

export function Sidebar({ onLogout, user }) {
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="h-full py-4 ps-4">
      <aside className="w1-rail" aria-label="ניווט ראשי">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="w1-rail-logo"><Wordmark size={19} /></Link>
        <nav className="w1-rail-nav">
          {RAIL.map(({ page, label, icon: Icon }) => {
            const on = isActive(page);
            return (
              <Link key={page} to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('w1-rail-i press', on && 'on')}>
                <span className="w1-rail-ic"><Icon strokeWidth={on ? 2 : 1.75} /></span>
                <span className="w1-rail-l">{label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setMoreOpen(true)} className="w1-rail-i press">
            <span className="w1-rail-ic"><MoreHorizontal strokeWidth={1.75} /></span>
            <span className="w1-rail-l">עוד</span>
          </button>
        </nav>
        <div className="w1-rail-foot">
          <Link to={createPageUrl('Settings')} className="w1-rail-i press" aria-label="הגדרות"><span className="w1-rail-ic"><Settings strokeWidth={1.75} /></span></Link>
          <UserMenu user={user} onLogout={onLogout} side="left">
            <button type="button" aria-label="החשבון שלי" className="press inline-flex h-12 w-12 items-center justify-center rounded-full">
              <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={44} ring />
            </button>
          </UserMenu>
        </div>
        <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={RAIL.map((i) => i.page)} />
      </aside>
    </div>
  );
}

export function Header({ user, onOpenCommandPalette, onLogout }) {
  const quick = useQuickBooking();
  const name = firstName(user?.full_name || '') || '';
  return (
    <header className="w1-head">
      <div className="w1-head-in">
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="press inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full lg:hidden">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={44} ring />
          </button>
        </UserMenu>
        <div className="min-w-0 flex-1">
          <p className="w1-hello">{dayPart().greeting}{name ? `, ${name}` : ''}</p>
          <p className="w1-date">{formatDayHe(todayISO())}{user?.organization_name ? <span className="hidden sm:inline"> · {user.organization_name}</span> : null}</p>
        </div>
        <button type="button" onClick={onOpenCommandPalette} className="w1-search press">
          <Search strokeWidth={1.75} />חיפוש אורח, הזמנה או יחידה
        </button>
        <button type="button" onClick={onOpenCommandPalette} className="w1-ibtn press xl:hidden" aria-label="חיפוש"><Search strokeWidth={1.75} /></button>
        <Link to={createPageUrl('Messages')} className="w1-ibtn press" aria-label="הודעות"><Bell strokeWidth={1.75} /></Link>
        <button type="button" onClick={() => quick.open()} className="w1-new press">
          <Plus strokeWidth={2.25} />הזמנה חדשה
        </button>
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs = [RAIL[0], RAIL[1], null, RAIL[3], '__more__'];
  const primary = ['Dashboard', 'MultiCalendar', 'Leads'];
  return (
    <>
      <nav aria-label="ניווט תחתון" className="w1-tabs lg:hidden">
        <ul>
          {tabs.map((t, i) => {
            if (t === null) {
              return (
                <li key="new"><button type="button" onClick={() => quick.open()} aria-label="הזמנה חדשה" className="w1-tab-new press"><Plus strokeWidth={2.25} /></button></li>
              );
            }
            if (t === '__more__') {
              const on = !primary.some((p) => isActive(p));
              return (
                <li key="more"><button type="button" onClick={() => setMoreOpen(true)} className={cn('w1-tab press', on && 'on')}><MoreHorizontal strokeWidth={on ? 2 : 1.75} /><span>עוד</span></button></li>
              );
            }
            const on = isActive(t.page); const Icon = t.icon;
            return (
              <li key={t.page}><Link to={createPageUrl(t.page)} aria-current={on ? 'page' : undefined} className={cn('w1-tab press', on && 'on')}><Icon strokeWidth={on ? 2 : 1.75} /><span>{t.label}</span></Link></li>
            );
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary} />
    </>
  );
}
