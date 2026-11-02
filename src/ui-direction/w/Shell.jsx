/**
 * W3 · "זכוכית חלבית" (refs IMG_0932 + IMG_0929): the complex photo, blurred under a navy-to-indigo
 * wash, is the backdrop of the whole app; every surface is frosted glass floating over it. Desktop:
 * a see-through sidebar with labels and an indigo active pill (tablet feel). Phones: a glass pill tab bar.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Search, Bell, Plus, MoreHorizontal, Settings, Sun, CalendarRange, Inbox, Wallet, CalendarDays } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar, dayPart } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { readOrgSettings } from '@/lib/onboarding/orgSettings';
import { DEMO_PEOPLE } from '@/lib/demoPeople';
import { formatDayHe, todayISO, firstName } from '@/lib/stay/format';
import './w.css';

export const shellClass = 'w3-shell';

const NAV = [
  { page: 'Dashboard', label: 'היום', icon: Sun },
  { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
  { page: 'Bookings', label: 'הזמנות', icon: CalendarDays },
  { page: 'Leads', label: 'פניות', icon: Inbox },
  { page: 'Payments', label: 'כסף', icon: Wallet },
];

function Backdrop() {
  const photo = readOrgSettings().cover_photo || (DEMO_PEOPLE ? '/demo/complex-pool.webp' : null);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="w3-bg" aria-hidden>
      {photo ? <img src={photo} alt="" decoding="async" /> : null}
      <span className="w3-wash" />
    </div>,
    document.body,
  );
}

export function Sidebar({ onLogout, user }) {
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="h-full py-5 ps-5">
      <aside className="w3-side" aria-label="ניווט ראשי">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="w3-logo"><Wordmark size={22} inverted /></Link>
        <nav className="w3-nav">
          {NAV.map(({ page, label, icon: Icon }) => {
            const on = isActive(page);
            return (
              <Link key={page} to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('w3-ni press', on && 'on')}>
                <Icon strokeWidth={on ? 2 : 1.75} /><span>{label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setMoreOpen(true)} className="w3-ni press"><MoreHorizontal strokeWidth={1.75} /><span>עוד</span></button>
          <Link to={createPageUrl('Settings')} className="w3-ni press"><Settings strokeWidth={1.75} /><span>הגדרות</span></Link>
        </nav>
        <UserMenu user={user} onLogout={onLogout} side="left">
          <button type="button" className="w3-me press">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={44} ring />
            <span className="min-w-0 text-start"><span className="w3-me-n">{user?.full_name || 'החשבון שלי'}</span><span className="w3-me-s">{user?.organization_name || ''}</span></span>
          </button>
        </UserMenu>
        <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={NAV.map((i) => i.page)} />
      </aside>
    </div>
  );
}

export function Header({ user, onOpenCommandPalette, onLogout }) {
  const quick = useQuickBooking();
  const name = firstName(user?.full_name || '') || '';
  return (
    <header className="w3-head">
      <Backdrop />
      <div className="w3-head-in">
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="press inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full lg:hidden">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={44} ring />
          </button>
        </UserMenu>
        <div className="min-w-0 flex-1">
          <p className="w3-hello">{dayPart().greeting}{name ? `, ${name}` : ''}</p>
          <p className="w3-date">{formatDayHe(todayISO())}</p>
        </div>
        <button type="button" onClick={onOpenCommandPalette} className="w3-search press"><Search strokeWidth={1.75} />חיפוש אורח, הזמנה או יחידה</button>
        <Link to={createPageUrl('Messages')} className="w3-ibtn press" aria-label="הודעות"><Bell strokeWidth={1.75} /></Link>
        <button type="button" onClick={() => quick.open()} className="w3-new press"><Plus strokeWidth={2.25} />הזמנה חדשה</button>
      </div>
    </header>
  );
}

export function TabBar({ user, onLogout }) {
  const isActive = useIsActive();
  const quick = useQuickBooking();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = ['Dashboard', 'MultiCalendar', 'Leads'];
  const tabs = [NAV[0], NAV[1], 'new', NAV[3], 'more'];
  return (
    <>
      <nav aria-label="ניווט תחתון" className="w3-tabs lg:hidden">
        <ul>
          {tabs.map((t) => {
            if (t === 'new') return <li key="new"><button type="button" onClick={() => quick.open()} aria-label="הזמנה חדשה" className="w3-tab-new press"><Plus strokeWidth={2.25} /></button></li>;
            if (t === 'more') {
              const on = !primary.some((p) => isActive(p));
              return <li key="more"><button type="button" onClick={() => setMoreOpen(true)} className={cn('w3-tab press', on && 'on')}><MoreHorizontal strokeWidth={on ? 2 : 1.75} /><span>עוד</span></button></li>;
            }
            const on = isActive(t.page); const Icon = t.icon;
            return <li key={t.page}><Link to={createPageUrl(t.page)} aria-current={on ? 'page' : undefined} className={cn('w3-tab press', on && 'on')}><Icon strokeWidth={on ? 2 : 1.75} /><span>{t.label}</span></Link></li>;
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary} />
    </>
  );
}
