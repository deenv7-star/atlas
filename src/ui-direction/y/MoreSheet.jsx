/**
 * "כל המסכים" (fix/today-tiles-c, 04.11.2026): "עוד" in the phone tab bar and in the desktop rail opens this sheet. Built for owners who are not
 * technical: one search field on top, three quick actions, then every screen as a big labelled tile. Nothing is
 * hidden in a menu any more. Bottom sheet on the phone (grabber, 44px close), centred card from 640px.
 * Uses Radix Dialog directly (not the shared sheet component) so it owns its own look.
 */
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import * as D from '@radix-ui/react-dialog';
import { X, Search, Plus, Receipt, UserPlus, ChevronLeft, UserRound } from 'lucide-react';
import { formatDayHe } from '@/lib/stay/format';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { DB_FEATURES } from '@/config/dbFeatures';
import { useNavGroups, useIsActive } from '@/components/app/shell/shared';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { NAV_DESC } from '@/config/navigation';
import './y-more-sheet.css';

/** Extra words people type for a screen, so "ניקיון" or a tax-document word finds the right tile. */
const ALIASES = {
  Payments: 'תשלומים יתרות כסף מקדמה',
  ExpenseTracker: 'הוצאות',
  Invoices: 'קבלות חשבוניות מסמכים',
  Bookings: 'הזמנה אורחים',
  Leads: 'פניות הודעות וואטסאפ אורחים',
  Settings: 'יחידות פרטים הגדרות',
  Integrations: 'booking airbnb ערוצים סנכרון',
  Cleaning: 'ניקיון מנקה',
  Reviews: 'ביקורות דירוג',
  DynamicPricing: 'מחיר מחירים חגים',
  MonthlyReport: 'הכנסות דוח דוחות רואה חשבון',
};

/** Open state lives outside React so the rail, the tab bar and the sheet share it without prop drilling. */
let moreOpen = false;
const subs = new Set();
const setMore = (v) => { if (moreOpen === v) return; moreOpen = v; subs.forEach((f) => f()); };
export const openMore = () => setMore(true);
export function useMoreOpen() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => moreOpen, () => false);
}

/** What each layout already shows, so the sheet lists only the rest. Phone: the tab bar. Desktop: the rail. */
// today/wow (05.11.2026): כסף joined the phone tab bar, so the עוד sheet doesn't list it twice
const ON_PHONE_BAR = ['Dashboard', 'MultiCalendar', 'Leads', 'Payments'];
const ON_RAIL = ['Dashboard', 'MultiCalendar', 'Bookings', 'Leads', 'Payments', 'Settings'];
const DESKTOP_Q = '(min-width: 1024px)';
function useDesktop() {
  return useSyncExternalStore(
    (cb) => { const mq = window.matchMedia(DESKTOP_Q); mq.addEventListener('change', cb); return () => mq.removeEventListener('change', cb); },
    () => window.matchMedia(DESKTOP_Q).matches, () => false,
  );
}

/** Mounted once (from the tab bar). Also opens on the 'atlas:open-more' event other menus fire. */
export function MoreSheetHost({ user }) {
  const open = useMoreOpen();
  const desktop = useDesktop();
  useEffect(() => {
    window.addEventListener('atlas:open-more', openMore);
    return () => window.removeEventListener('atlas:open-more', openMore);
  }, []);
  return <MoreSheet open={open} onOpenChange={setMore} user={user} exclude={desktop ? ON_RAIL : ON_PHONE_BAR} />;
}

export function MoreSheet({ open, onOpenChange, user, exclude = [] }) {
  const navigate = useNavigate();
  const quick = useQuickBooking();
  const isActive = useIsActive();
  const [q, setQ] = useState('');
  const groups = useNavGroups(user);

  // ecosystem v1 #6: grouped list rows by the nav map's own groups (תפעול / אורחים / דוחות / חשבון), not an app drawer.
  const sections = useMemo(() => {
    const seen = new Set();
    return groups.map((g) => ({
      id: g.id,
      label: g.label || 'מסכים ראשיים',
      items: g.items.filter((i) => { if (exclude.includes(i.page) || seen.has(i.page)) return false; seen.add(i.page); return true; }),
    })).filter((g) => g.items.length);
  }, [groups, exclude]);
  const screens = useMemo(() => sections.flatMap((g) => g.items), [sections]);

  const term = q.trim().toLowerCase();
  const shown = term ? screens.filter((s) => `${s.label} ${ALIASES[s.page] || ''}`.toLowerCase().includes(term)) : screens;

  // audit 05.11 UX-5: guests/bookings already on the device show inline (top 5), no extra tap; no network call here.
  const qc = useQueryClient();
  const people = useMemo(() => {
    if (term.length < 2) return [];
    const seen = new Map();
    for (const [, data] of qc.getQueriesData({ queryKey: ['bookings'] })) {
      if (!Array.isArray(data)) continue;
      for (const b of data) {
        if (!b?.id || seen.has(b.id)) continue;
        const hay = `${b.guest_name || ''} ${b.guest_phone || ''}`.toLowerCase();
        if (hay.includes(term)) seen.set(b.id, b);
      }
    }
    return [...seen.values()].sort((a, b) => String(b.check_in_date || '').localeCompare(String(a.check_in_date || ''))).slice(0, 5);
  }, [qc, term, open]);
  const close = () => { onOpenChange(false); setQ(''); };
  const go = (page, state) => { close(); navigate(createPageUrl(page), state ? { state } : undefined); };
  const actions = [
    { key: 'booking', label: 'הזמנה חדשה', icon: Plus, primary: true, run: () => { close(); window.setTimeout(() => quick.open(), 0); } },
    ...(DB_FEATURES.expenses ? [{ key: 'expense', label: 'הוצאה חדשה', icon: Receipt, run: () => go('ExpenseTracker', { commandPalette: { newExpense: true } }) }] : []),
    { key: 'lead', label: 'פנייה חדשה', icon: UserPlus, run: () => go('Leads', { commandPalette: { newGuest: true } }) },
  ];

  return (
    <D.Root open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <D.Portal>
        <D.Overlay className="ycm-scrim" />
        <D.Content className="ycm" dir="rtl" aria-describedby={undefined}>
          <i className="ycm-grab" aria-hidden />
          <div className="ycm-head">
            <D.Title className="ycm-title">כל המסכים</D.Title>
            <D.Close className="ycm-x press" aria-label="סגירה"><X strokeWidth={2} /></D.Close>
          </div>

          <label className="ycm-search">
            <Search strokeWidth={1.75} aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="מה מחפשים? מסך, אורח או הזמנה"
              aria-label="חיפוש מסך, אורח או הזמנה" enterKeyHint="search"
              onKeyDown={(e) => { if (e.key === 'Enter' && term && !shown.length) { close(); window.dispatchEvent(new CustomEvent('atlas:open-search')); } }} />
          </label>

          {term ? null : (
            <div className="ycm-acts" role="group" aria-label="פעולות מהירות">
              {actions.map(({ key, label, icon: Icon, primary, run }) => (
                <button key={key} type="button" className={cn('ycm-act press', primary && 'ycm-act--p')} onClick={run}>
                  <Icon strokeWidth={2} aria-hidden /><span>{label}</span>
                </button>
              ))}
            </div>
          )}

          {term ? (
            <button type="button" className="ycm-find press" onClick={() => { close(); window.dispatchEvent(new CustomEvent('atlas:open-search')); }}>
              <Search strokeWidth={1.75} aria-hidden />
              <span>חיפוש „{q.trim()}" באורחים ובהזמנות</span>
              <ChevronLeft strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}

          {people.length ? (
            <section className="ycm-group" aria-label="אורחים והזמנות">
              <p className="ycm-sec">אורחים והזמנות</p>
              <ul className="ycm-list">
                {people.map((b) => (
                  <li key={b.id}>
                    <button type="button" className="ycm-row press" onClick={() => { close(); navigate(`${createPageUrl('BookingDetail')}/${b.id}`); }}>
                      <UserRound strokeWidth={1.75} aria-hidden className="ycm-row-ic" />
                      <span className="ycm-lb">{b.guest_name || 'אורח'}{b.check_in_date ? <span className="ycm-meta"> · {formatDayHe(b.check_in_date, { weekday: false })}</span> : null}</span>
                      <ChevronLeft strokeWidth={1.75} aria-hidden className="ycm-row-chev" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(term ? (shown.length ? [{ id: 'found', label: people.length ? 'מסכים' : null, items: shown }] : []) : sections).map((g) => (
            <section key={g.id} className="ycm-group" aria-label={g.label || 'תוצאות'}>
              {g.label ? <p className="ycm-sec">{g.label}</p> : null}
              {g.items.length ? (
                <ul className="ycm-list">
                  {g.items.map(({ page, label, icon: Icon, desc }) => {
                    const on = isActive(page);
                    const line = desc || NAV_DESC[page];
                    return (
                      <li key={page}>
                        <button type="button" className={cn('ycm-row press', on && 'on', line && 'ycm-row--2')} aria-current={on ? 'page' : undefined} onClick={() => go(page)}>
                          <Icon strokeWidth={1.75} aria-hidden className="ycm-row-ic" />
                          <span className="ycm-lb">{label}{line ? <span className="ycm-desc">{line}</span> : null}</span>
                          <ChevronLeft strokeWidth={1.75} aria-hidden className="ycm-row-chev" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          ))}
          {term && !shown.length && !people.length ? <p className="ycm-none">אין מסך בשם הזה. אפשר לחפש אותו באורחים ובהזמנות.</p> : null}

          {/* persona-clarity (05.11.2026): no help row here any more; help has ONE place, "עזרה" in the top bar */}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
