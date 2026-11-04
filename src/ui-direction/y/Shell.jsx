/**
 * Y2 · "זכוכית" (after the visionOS fitness board Deen sent). The app floats over a real photo of a
 * zimmer: a frosted vertical rail (desktop), a floating glass toolbar on top, and a glass capsule at the
 * bottom on the phone. Active item: a white pill, indigo icon. lucide 1.75, nothing filled under icons.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { AtlasFace } from '@/components/mascot/AtlasFace.jsx';
import { setAssistantOpen, useAssistantOpen } from '@/assistant/launcher';
import { Search, Plus, Sun, CalendarRange, BedDouble, Inbox, Wallet, MoreHorizontal, Bell, LifeBuoy, Settings } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { useLiquidLens } from './useLiquidLens';
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

export function Header({ user, onOpenCommandPalette, onLogout, currentPageName }) {
  const quick = useQuickBooking();
  // the shell paints Today and Bookings straight on the photo; every other page sits in a calm canvas window
  useEffect(() => {
    const shell = document.querySelector('.y2-shell');
    if (!shell) return undefined;
    shell.dataset.page = currentPageName || '';
    return () => { delete shell.dataset.page; };
  }, [currentPageName]);
  return (
    <header className="y2-head">
      <div className="y2-bar">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="y2-bar-logo"><Wordmark size={19} /></Link>
        <button type="button" onClick={onOpenCommandPalette} className="y2-search press" aria-label="חיפוש אורח, הזמנה או יחידה">
          <Search strokeWidth={1.75} /><span>חיפוש אורח, הזמנה או יחידה</span>
        </button>
        <AskFace />
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

/** The living atlas face in the top bar: opens "שאלו את atlas" and reacts to what happens in the app. */
function AskFace() {
  const { isOpen } = useAssistantOpen();
  const { pathname } = useLocation();
  if (pathname.startsWith('/ai-assistant')) return null;
  return (
    <button type="button" className="y2-gb y2-gb--face press" aria-label="שאלו את atlas" aria-expanded={isOpen} aria-haspopup="dialog"
      onClick={(e) => setAssistantOpen(!isOpen, e.currentTarget)}>
      <AtlasFace live size={34} decorative />
    </button>
  );
}

/**
 * Phone tab bar. Tap = instant navigation (plain links). Long-press (or slide) on the capsule lifts an iOS 26
 * style liquid-glass lens that follows the finger, lights the tab under it, ticks a haptic per tab and springs
 * to the nearest tab on release (useLiquidLens). Reduced motion: no lens, taps only. Keyboard/a11y unchanged.
 */
export function TabBar({ user, onLogout }) {
  const active = useActive();
  const quick = useQuickBooking();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = NAV.filter((n) => n.page !== 'Bookings');
  const anyOn = items.some((n) => active(n.page));
  const all = [...items, { page: null, label: 'עוד', icon: MoreHorizontal }];
  const barRef = useRef(null);
  const lensRef = useRef(null);
  const tintRef = useRef(null);
  const onCommit = (i) => { // the hook keeps the latest one in a ref, so a fresh function per render is fine
    const it = all[i];
    if (!it) return;
    if (!it.page) { setMoreOpen(true); return; }
    if (!active(it.page)) navigate(createPageUrl(it.page));
  };
  const { hot, lifted, enabled } = useLiquidLens({ barRef, lensRef, tintRef, onCommit });
  return (
    <>
      <nav aria-label="ניווט" className="y2-tab" data-lens={lifted ? 'on' : undefined}>
        <div className="y2-tab-cap">
          <ul ref={barRef}>
            {items.map(({ page, label, icon: Icon }, i) => {
              const on = active(page);
              return (
                <li key={page} data-hot={hot === i ? '' : undefined}>
                  <Link to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('y2-ti press', on && 'on')} draggable={false}>
                    {on ? <motion.i layoutId="y2-tab-on" className="y2-ti-on" transition={SPRING} /> : null}
                    <Icon strokeWidth={1.75} /><span>{label}</span>
                  </Link>
                </li>
              );
            })}
            <li data-hot={hot === items.length ? '' : undefined}>
              <button type="button" onClick={() => setMoreOpen(true)} className={cn('y2-ti press', !anyOn && 'on')}>
                {!anyOn ? <motion.i layoutId="y2-tab-on" className="y2-ti-on" transition={SPRING} /> : null}
                <MoreHorizontal strokeWidth={1.75} /><span>עוד</span>
              </button>
            </li>
          </ul>
          {enabled ? (
            <div ref={lensRef} className="y2-lens" aria-hidden="true">
              <div ref={tintRef} className="y2-lens-row">
                {all.map(({ label, icon: Icon }) => <span key={label} className="y2-ti"><Icon strokeWidth={1.75} /><span>{label}</span></span>)}
              </div>
              <i className="y2-lens-rim" />
            </div>
          ) : null}
        </div>
        <button type="button" onClick={() => quick.open()} className="y2-tab-new press" aria-label="הזמנה חדשה"><Plus strokeWidth={2} /></button>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={items.map((n) => n.page)} />
    </>
  );
}
