/**
 * Y2 · "זכוכית" (after the visionOS fitness board Deen sent). Background (04.11.2026): Today floats over a bright
 * green-hills photo (TodayBackdrop), every other screen over the calm canvas; a frosted vertical rail (desktop),
 * a floating toolbar on top, and a glass capsule at the bottom on the phone. Active item: a white pill, indigo icon. lucide 1.75, nothing filled under icons.
 */
import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { AtlasFace } from '@/components/mascot/AtlasFace.jsx';
import { openAssistant, useAssistantOpen } from '@/assistant/launcher';
import { Search, Plus, Sun, CalendarRange, BedDouble, Inbox, Wallet, LayoutGrid, Bell, Settings, CircleHelp, Headset, BookOpen } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { openHelp } from '@/support/openHelp';
import { helpVariant } from '@/support/helpVariant';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useHelpUnread } from '@/support/openHelp';
import { MoreSheetHost, openMore, useMoreOpen } from './MoreSheet';
import { Wordmark, useIsActive, UserMenu } from '@/components/app/shell/shared';
import { GuestAvatar, guestInitials } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { useLiquidLens } from './useLiquidLens';
import TodayBackdrop, { TODAY_PAGES, APP_BG } from './TodayBackdrop';
import './y2.css';
import './y-bg.css';
import './y-bg-story.css';
import './y-atlas-tab.css';
import './y-nav-clean.css';
import './y-nav.css';
import './y-help.css';

export const shellClass = 'y2-shell';

/**
 * Navigation (fix/today-tiles-c, picked by Deen 04.11.2026):
 *   phone (<1024): top bar logo · bell (real unread dot) · avatar. Tab bar היום · יומן · atlas · פניות · עוד;
 *     "עוד" opens the "כל המסכים" sheet (search, quick actions, every screen as a big tile). No "+" on the phone.
 *   desktop (≥1024): the rail gets the same "עוד" (sheet as a centred panel); the header keeps search, bell and "+".
 */

/** Something new for the owner: a help reply or a new guest enquiry. Drives the dot on the bell. */
function useNavUnread() {
  const help = useHelpUnread();
  const q = useQuery({
    queryKey: ['nav-unread-leads'],
    queryFn: async () => { try { return await base44.entities.Lead.filter({}, '-created_at', 50); } catch { return []; } },
    staleTime: 60_000,
  });
  const leads = (q.data || []).filter((l) => String(l.status || 'NEW').toUpperCase() === 'NEW').length;
  return { help, leads, any: help > 0 || leads > 0 };
}

const NAV = [
  { page: 'Dashboard', label: 'היום', icon: Sun },
  { page: 'MultiCalendar', label: 'יומן', icon: CalendarRange },
  { page: 'Bookings', label: 'הזמנות', icon: BedDouble },
  { page: 'Leads', label: 'שיחות', icon: Inbox },
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
  const moreOpen = useMoreOpen();
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
        <li>
          <button type="button" className={cn('y2-ri press', moreOpen && 'on')} aria-haspopup="dialog" aria-expanded={moreOpen}
            aria-label="עוד: כל המסכים, חיפוש ופעולות מהירות" onClick={openMore}>
            {moreOpen ? <motion.i layoutId="y2-rail-on" className="y2-ri-on" transition={SPRING} /> : null}
            <LayoutGrid strokeWidth={1.75} /><span>עוד</span>
          </button>
        </li>
      </ul>
      <div className="y2-rail-end">
        <Link to={createPageUrl('Settings')} className="y2-ri press" aria-label="הגדרות"><Settings strokeWidth={1.75} /><span>הגדרות</span></Link>
        <UserMenu user={user} onLogout={onLogout} side="left">
          <button type="button" aria-label={`החשבון שלי, ${guestInitials(user?.full_name || user?.email || '')}`} className="y2-rail-me press">
            <span aria-hidden="true" className="contents"><GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={44} /></span>
          </button>
        </UserMenu>
      </div>
    </aside>
  );
}

export function Header({ user, onOpenCommandPalette, onLogout, currentPageName }) {
  const quick = useQuickBooking();
  const unread = useNavUnread();
  useEffect(() => {
    const h = () => onOpenCommandPalette?.();
    window.addEventListener('atlas:open-search', h);
    return () => window.removeEventListener('atlas:open-search', h);
  }, [onOpenCommandPalette]);
  // data-page drives the background: Today = hills photo + frosted cards (TodayBackdrop), every other page = calm canvas
  useEffect(() => {
    const shell = document.querySelector('.y2-shell');
    if (!shell) return undefined;
    shell.dataset.page = currentPageName || '';
    shell.dataset.bg = APP_BG;
    return () => { delete shell.dataset.page; delete shell.dataset.bg; };
  }, [currentPageName]);
  return (
    <>
    <TodayBackdrop on={APP_BG !== 'off' || TODAY_PAGES.has(currentPageName || '')} />
    <header className="y2-head y2-nav">
      <div className="y2-bar">
        <Link to={createPageUrl('Dashboard')} aria-label="atlas, מסך היום" className="y2-bar-logo"><Wordmark size={19} /></Link>
        <button type="button" onClick={onOpenCommandPalette} className="y2-search press" aria-label="חיפוש אורח, הזמנה או יחידה">
          <Search strokeWidth={1.75} /><span>חיפוש אורח, הזמנה או יחידה</span>
        </button>
        {/* persona-clarity (05.11.2026): ONE help entry, labelled, on every width (was: lifebuoy + atlas face + two rows in עוד + the account menu) */}
        <HelpButton unread={unread.help} />
        <BellMenu unread={unread} />
        {/* quick-add: desktop only; on the phone adding lives in "עוד" and on each screen. Labelled so nobody has to guess "+". */}
        <button type="button" className="y2-gb y2-gb--ind y2-gb--lbl press" onClick={() => quick.open()} aria-label="הזמנה חדשה" title="רישום הזמנה חדשה"><Plus strokeWidth={2} /><span className="y2-gb-t" aria-hidden="true">הזמנה חדשה</span></button>
        <UserMenu user={user} onLogout={onLogout} hideMore>
          {/* a11y (label-in-name): the label carries the initials the avatar shows */}
          <button type="button" aria-label={`החשבון שלי, ${guestInitials(user?.full_name || user?.email || '')}`} className="y2-bar-me press">
            <span aria-hidden="true" className="contents"><GuestAvatar name={user?.full_name || user?.email || ''} src={user?.avatar_url} owner size={36} /></span>
          </button>
        </UserMenu>
      </div>
    </header>
    </>
  );
}

/**
 * ecosystem v1 #14: one inbox. The bell opens the same "מה מחכה לכם היום" sheet as the chip on Today (no second
 * dropdown). Dot only when something is really new (a guest enquiry or a help reply).
 */
function BellMenu({ unread }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const label = unread.any ? 'מה מחכה לכם היום, יש חדש' : 'מה מחכה לכם היום';
  const onToday = pathname === '/' || pathname.startsWith('/today') || pathname.startsWith(createPageUrl('Dashboard'));
  const open = () => {
    if (onToday) window.dispatchEvent(new CustomEvent('atlas:open-day'));
    else navigate(`${createPageUrl('Dashboard')}?sheet=day`);
  };
  return (
    <button type="button" className="y2-gb y2-bell y2-gb--lbl press" aria-label={label} aria-haspopup="dialog" onClick={open} title="מה מחכה לכם היום: הודעות לשלוח, ניקיונות ותשלומים">
      <Bell strokeWidth={1.75} />{unread.any ? <i className="y2-gb-dot" aria-hidden /> : null}<span className="y2-gb-t" aria-hidden="true">מה מחכה</span>
    </button>
  );
}

/**
 * The one help entry (persona-clarity, 05.11.2026). 'hub' (default): opens the help panel (שאלו את atlas · דברו עם נציג ·
 * מדריכים קצרים). 'menu' (version B): a small menu with the same three rows. See src/support/helpVariant.js.
 */
function HelpButton({ unread = 0 }) {
  const variant = helpVariant();
  const btn = (props) => (
    <button type="button" className="y2-help press" aria-label={unread ? 'עזרה, יש תשובה חדשה מנציג' : 'עזרה: שאלו את atlas, נציג או מדריך'} title="עזרה: שאלו את atlas, דברו עם נציג או קראו מדריך קצר" {...props}>
      <CircleHelp strokeWidth={1.9} aria-hidden /><span>עזרה</span>{unread ? <i className="y2-gb-dot" aria-hidden /> : null}
    </button>
  );
  if (variant !== 'menu') return btn({ 'aria-haspopup': 'dialog', onClick: () => openHelp() });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{btn({})}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="y2-help-menu w-[300px] p-2" dir="rtl">
        <DropdownMenuItem className="y2-help-item" onSelect={() => openAssistant('voice')}>
          <span className="y2-help-ic y2-help-ic--face" aria-hidden><AtlasFace live size={30} decorative /></span>
          <span className="min-w-0"><b>שאלו את atlas</b><small>שאלה או בקשה, בקול או בכתב</small></span>
        </DropdownMenuItem>
        <DropdownMenuItem className="y2-help-item" onSelect={() => window.setTimeout(() => openHelp({ person: true }), 0)}>
          <span className="y2-help-ic" aria-hidden><Headset strokeWidth={1.75} /></span>
          <span className="min-w-0"><b>דברו עם נציג</b><small>בן אדם מהצוות, 24/7</small></span>
        </DropdownMenuItem>
        <DropdownMenuItem className="y2-help-item" onSelect={() => window.setTimeout(() => openHelp(), 0)}>
          <span className="y2-help-ic" aria-hidden><BookOpen strokeWidth={1.75} /></span>
          <span className="min-w-0"><b>מדריכים קצרים</b><small>איך מחברים את Booking, מוסיפים חדר ועוד</small></span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** (persona-clarity: no longer in the header; the assistant opens from "עזרה" → שאלו את atlas, and from the phone's round atlas button.) */
// eslint-disable-next-line no-unused-vars
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

/** today/wow (05.11.2026): atlas sits beside the capsule as its own round button (where the landing mockup had "+"),
 *  so the capsule is five calm tabs. One tap opens straight into a live voice conversation. */
function AtlasFab() {
  const { isOpen } = useAssistantOpen();
  return (
    <button type="button" className="y2-fab press" aria-label="דברו עם atlas" aria-expanded={isOpen} aria-haspopup="dialog"
      onClick={(e) => openAssistant('voice', e.currentTarget)}>
      <AtlasFace live size={40} decorative />
    </button>
  );
}

/** The centre of the phone tab bar: atlas itself, raised. One tap opens straight into a live voice conversation. */
// eslint-disable-next-line no-unused-vars
function AtlasTab({ hot }) {
  const { isOpen } = useAssistantOpen();
  return (
    <li className="y2-tab-atlas" data-hot={hot ? '' : undefined}>
      <button type="button" className="y2-ta press" aria-label="דברו עם atlas" aria-expanded={isOpen} aria-haspopup="dialog"
        onClick={(e) => openAssistant('voice', e.currentTarget)}>
        <span className="y2-ta-disc"><AtlasFace live size={46} decorative /></span>
      </button>
    </li>
  );
}

/**
 * Phone tab bar. Tap = instant navigation (plain links). Long-press (or slide) on the capsule lifts an iOS 26
 * style liquid-glass lens that follows the finger, lights the tab under it, ticks a haptic per tab and springs
 * to the nearest tab on release (useLiquidLens). Reduced motion: no lens, taps only. Keyboard/a11y unchanged.
 */
export function TabBar({ user }) {
  const active = useActive();
  const navigate = useNavigate();
  const moreOpen = useMoreOpen();
  // today/wow (05.11.2026): היום · יומן · פניות · כסף · עוד in one clean capsule, atlas as a round button beside it (RTL: first item is rightmost)
  const MORE = { page: null, more: true, label: 'עוד', icon: LayoutGrid };
  const all = [...NAV.filter((n) => ['Dashboard', 'MultiCalendar', 'Leads', 'Payments'].includes(n.page)), MORE];
  const barRef = useRef(null);
  const lensRef = useRef(null);
  const tintRef = useRef(null);
  const onCommit = (i) => { // the hook keeps the latest one in a ref, so a fresh function per render is fine
    const it = all[i];
    if (!it) return;
    if (it.atlas) { openAssistant('voice'); return; }
    if (it.more) { openMore(); return; }
    if (!active(it.page)) navigate(createPageUrl(it.page));
  };
  const { hot, lifted, enabled } = useLiquidLens({ barRef, lensRef, tintRef, onCommit });
  const tab = ({ page, label, icon: Icon, more }, i) => {
    if (more) {
      return (
        <li key="more" data-hot={hot === i ? '' : undefined}>
          <button type="button" className={cn('y2-ti press', moreOpen && 'on')} aria-haspopup="dialog" aria-expanded={moreOpen} aria-label="עוד: כל המסכים, חיפוש ופעולות מהירות" onClick={openMore}>
            {moreOpen ? <motion.i layoutId="y2-tab-on" className="y2-ti-on" transition={SPRING} /> : null}
            <Icon strokeWidth={1.75} /><span>{label}</span>
          </button>
        </li>
      );
    }
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
      <nav aria-label="ניווט" className="y2-tab y2-nav y2-nav--clean" data-lens={lifted ? 'on' : undefined}>
        <div className="y2-tab-cap">
          <ul ref={barRef}>
            {all.map((t, i) => tab(t, i))}
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
        <AtlasFab />
      </nav>
      {/* one sheet for both layouts (the tab bar is mounted at every width, hidden by CSS on desktop) */}
      <MoreSheetHost user={user} />
    </>
  );
}
