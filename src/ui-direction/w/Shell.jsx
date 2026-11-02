/**
 * W2 · "סרגל כהה ורשימת עבודה" (refs IMG_0927 + IMG_0931): on desktop a floating navy panel holds the
 * icon rail, the day's four counters and the worklist; the light area is the day itself. On phones a
 * navy pill tab bar, and Today draws its own navy top (the global header stays for the other screens).
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

export const shellClass = 'bg-canvas w2-shell';

const RAIL = [
  { page: 'Dashboard', label: 'היום', icon: Sun },
  { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
  { page: 'Bookings', label: 'הזמנות', icon: CalendarDays },
  { page: 'Leads', label: 'פניות', icon: Inbox },
  { page: 'Payments', label: 'כסף', icon: Wallet },
];

/** The navy rail. Today fills the panel beside it (counters + worklist) through a portal target. */
export function Sidebar({ onLogout, user }) {
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="h-full py-4 ps-4">
      <aside className="w2-side" aria-label="ניווט ראשי">
        <div className="w2-rail">
          <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="w2-logo"><Wordmark size={17} inverted /></Link>
          <nav className="w2-rail-nav">
            {RAIL.map(({ page, label, icon: Icon }) => {
              const on = isActive(page);
              return (
                <Link key={page} to={createPageUrl(page)} aria-label={label} title={label} aria-current={on ? 'page' : undefined} className={cn('w2-ri press', on && 'on')}>
                  <Icon strokeWidth={on ? 2 : 1.75} />
                </Link>
              );
            })}
            <button type="button" aria-label="עוד" title="עוד" onClick={() => setMoreOpen(true)} className="w2-ri press"><MoreHorizontal strokeWidth={1.75} /></button>
          </nav>
          <div className="w2-rail-foot">
            <Link to={createPageUrl('Settings')} aria-label="הגדרות" className="w2-ri press"><Settings strokeWidth={1.75} /></Link>
            <UserMenu user={user} onLogout={onLogout} side="left">
              <button type="button" aria-label="החשבון שלי" className="press inline-flex h-12 w-12 items-center justify-center rounded-full">
                <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={42} />
              </button>
            </UserMenu>
          </div>
        </div>
        <div id="w2-panel" className="w2-panel" />
        <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={RAIL.map((i) => i.page)} />
      </aside>
    </div>
  );
}

export function Header({ user, currentPageName, onOpenCommandPalette, onLogout }) {
  const quick = useQuickBooking();
  const name = firstName(user?.full_name || '') || '';
  const today = useIsActive()('Dashboard');
  return (
    <header className={cn('w2-head', today && 'w2-head--today')}>
      <div className="w2-head-in">
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="press inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full lg:hidden">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={44} />
          </button>
        </UserMenu>
        <div className="min-w-0 flex-1">
          <p className="w2-hello">{dayPart().greeting}{name ? `, ${name}` : ''}</p>
          <p className="w2-date">{formatDayHe(todayISO())}{user?.organization_name ? ` · ${user.organization_name}` : ''}</p>
        </div>
        <button type="button" onClick={onOpenCommandPalette} className="w2-search press"><Search strokeWidth={1.75} />חיפוש אורח, הזמנה או יחידה</button>
        <Link to={createPageUrl('Messages')} className="w2-ibtn press" aria-label="הודעות"><Bell strokeWidth={1.75} /></Link>
        <button type="button" onClick={() => quick.open()} className="w2-new press"><Plus strokeWidth={2.25} />הזמנה חדשה</button>
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = ['Dashboard', 'MultiCalendar', 'Leads'];
  const tabs = [RAIL[0], RAIL[1], 'new', RAIL[3], 'more'];
  return (
    <>
      <nav aria-label="ניווט תחתון" className="w2-tabs lg:hidden">
        <ul>
          {tabs.map((t) => {
            if (t === 'new') return <li key="new"><button type="button" onClick={() => quick.open()} aria-label="הזמנה חדשה" className="w2-tab-new press"><Plus strokeWidth={2.25} /></button></li>;
            if (t === 'more') {
              const on = !primary.some((p) => isActive(p));
              return <li key="more"><button type="button" onClick={() => setMoreOpen(true)} className={cn('w2-tab press', on && 'on')}><MoreHorizontal strokeWidth={on ? 2 : 1.75} /><span>עוד</span></button></li>;
            }
            const on = isActive(t.page); const Icon = t.icon;
            return <li key={t.page}><Link to={createPageUrl(t.page)} aria-current={on ? 'page' : undefined} className={cn('w2-tab press', on && 'on')}><Icon strokeWidth={on ? 2 : 1.75} /><span>{t.label}</span></Link></li>;
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary} />
    </>
  );
}
