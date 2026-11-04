/**
 * Y2 · "זכוכית" (after the visionOS fitness board Deen sent). Background (04.11.2026): Today floats over a bright
 * green-hills photo (TodayBackdrop), every other screen over the calm canvas; a frosted vertical rail (desktop),
 * a floating toolbar on top, and a glass capsule at the bottom on the phone. Active item: a white pill, indigo icon. lucide 1.75, nothing filled under icons.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { AtlasFace } from '@/components/mascot/AtlasFace.jsx';
import { openAssistant, useAssistantOpen } from '@/assistant/launcher';
import { Search, Plus, Sun, CalendarRange, BedDouble, Inbox, Wallet, MoreHorizontal, LayoutGrid, Bell, LifeBuoy, Settings } from 'lucide-react';
import { Wordmark, useIsActive, MoreSheet, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { useLiquidLens } from './useLiquidLens';
import TodayBackdrop, { TODAY_PAGES } from './TodayBackdrop';
import './y2.css';
import './y-bg.css';
import './y-atlas-tab.css';

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
  // data-page drives the background: Today = hills photo + frosted cards (TodayBackdrop), every other page = calm canvas
  useEffect(() => {
    const shell = document.querySelector('.y2-shell');
    if (!shell) return undefined;
    shell.dataset.page = currentPageName || '';
    return () => { delete shell.dataset.page; };
  }, [currentPageName]);
  return (
    <>
    <TodayBackdrop on={TODAY_PAGES.has(currentPageName || '')} />
    <header className="y2-head">
      <div className="y2-bar">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="y2-bar-logo"><Wordmark size={19} /></Link>
        <button type="button" onClick={onOpenCommandPalette} className="y2-search press" aria-label="חיפוש אורח, הזמנה או יחידה">
          <Search strokeWidth={1.75} /><span>חיפוש אורח, הזמנה או יחידה</span>
        </button>
        <AskFaceDesk />
        <button type="button" className="y2-gb press y2-hide-m" aria-label="עזרה" onClick={() => window.dispatchEvent(new CustomEvent('atlas:open-support'))}><LifeBuoy strokeWidth={1.75} /></button>
        {/* phones: "עוד" moved up here from the tab bar (its slot went to atlas); hidden ≤359px, where the avatar menu has it */}
        <button type="button" className="y2-gb press y2-more-m" aria-label="כל המסכים" onClick={() => window.dispatchEvent(new CustomEvent('atlas:open-more'))}><LayoutGrid strokeWidth={1.75} /></button>
        <Link to={createPageUrl('Messages')} className="y2-gb press" aria-label="הודעות"><Bell strokeWidth={1.75} /><i className="y2-gb-dot" aria-hidden /></Link>
        {/* quick-add: was a floating "+" beside the tab bar (it overlapped content); now one fixed home in the header */}
        <button type="button" className="y2-gb y2-gb--ind press" onClick={() => quick.open()} aria-label="הזמנה חדשה"><Plus strokeWidth={2} /></button>
        <UserMenu user={user} onLogout={onLogout}>
          <button type="button" aria-label="החשבון שלי" className="y2-bar-me press">
            <GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={36} />
          </button>
        </UserMenu>
      </div>
    </header>
    </>
  );
}

/** Desktop only (phones have it in the centre of the tab bar): the living atlas face opens a voice conversation. */
function AskFaceDesk() {
  const { isOpen } = useAssistantOpen();
  const { pathname } = useLocation();
  if (pathname.startsWith('/ai-assistant')) return null;
  return (
    <button type="button" className="y2-gb y2-gb--face press y2-hide-m" aria-label="דברו עם atlas" aria-expanded={isOpen} aria-haspopup="dialog"
      onClick={(e) => openAssistant('voice', e.currentTarget)}>
      <AtlasFace live size={34} decorative />
    </button>
  );
}

/** The centre of the phone tab bar: atlas itself, raised. One tap opens straight into a live voice conversation. */
function AtlasTab({ hot }) {
  const { isOpen } = useAssistantOpen();
  return (
    <li className="y2-tab-atlas" data-hot={hot ? '' : undefined}>
      <button type="button" className="y2-ta press" aria-label="דברו עם atlas" aria-expanded={isOpen} aria-haspopup="dialog"
        onClick={(e) => openAssistant('voice', e.currentTarget)}>
        <span className="y2-ta-disc"><AtlasFace live size={48} decorative /></span>
      </button>
    </li>
  );
}

/**
 * Phone tab bar. Tap = instant navigation (plain links). Long-press (or slide) on the capsule lifts an iOS 26
 * style liquid-glass lens that follows the finger, lights the tab under it, ticks a haptic per tab and springs
 * to the nearest tab on release (useLiquidLens). Reduced motion: no lens, taps only. Keyboard/a11y unchanged.
 */
export function TabBar({ user, onLogout }) {
  const active = useActive();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => { // "עוד" now opens from the header (and the avatar menu)
    const open = () => setMoreOpen(true);
    window.addEventListener('atlas:open-more', open);
    return () => window.removeEventListener('atlas:open-more', open);
  }, []);
  // היום · יומן · [atlas] · פניות · כסף  (RTL: first item is rightmost)
  const tabs = NAV.filter((n) => n.page !== 'Bookings');
  const left = tabs.slice(0, 2); const right = tabs.slice(2);
  const all = [...left, { page: null, atlas: true, label: 'atlas' }, ...right];
  const barRef = useRef(null);
  const lensRef = useRef(null);
  const tintRef = useRef(null);
  const onCommit = (i) => { // the hook keeps the latest one in a ref, so a fresh function per render is fine
    const it = all[i];
    if (!it) return;
    if (it.atlas) { openAssistant('voice'); return; }
    if (!active(it.page)) navigate(createPageUrl(it.page));
  };
  const { hot, lifted, enabled } = useLiquidLens({ barRef, lensRef, tintRef, onCommit });
  const tab = ({ page, label, icon: Icon }, i) => {
    const on = active(page);
    return (
      <li key={page} data-hot={hot === i ? '' : undefined}>
        <Link to={createPageUrl(page)} aria-current={on ? 'page' : undefined} className={cn('y2-ti press', on && 'on')} draggable={false}>
          {on ? <motion.i layoutId="y2-tab-on" className="y2-ti-on" transition={SPRING} /> : null}
          <Icon strokeWidth={1.75} /><span>{label}</span>
        </Link>
      </li>
    );
  };
  return (
    <>
      <div className="y2-tab-scrim" aria-hidden="true" />
      <nav aria-label="ניווט" className="y2-tab" data-lens={lifted ? 'on' : undefined}>
        <div className="y2-tab-cap">
          <ul ref={barRef}>
            {left.map((t, i) => tab(t, i))}
            <AtlasTab hot={hot === 2} />
            {right.map((t, i) => tab(t, i + 3))}
          </ul>
          {enabled ? (
            <div ref={lensRef} className="y2-lens" aria-hidden="true">
              <div ref={tintRef} className="y2-lens-row">
                {all.map(({ label, icon: Icon, atlas }) => (atlas
                  ? <span key="atlas" className="y2-ti y2-ti--atlas" />
                  : <span key={label} className="y2-ti"><Icon strokeWidth={1.75} /><span>{label}</span></span>))}
              </div>
              <i className="y2-lens-rim" />
            </div>
          ) : null}
        </div>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={tabs.map((n) => n.page)} />
    </>
  );
}
