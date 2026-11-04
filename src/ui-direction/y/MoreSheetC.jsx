/**
 * Nav C (fix/today-tiles-c, 04.11.2026): "עוד" in the phone tab bar opens this sheet. Built for owners who are not
 * technical: one search field on top, three quick actions, then every screen as a big labelled tile. Nothing is
 * hidden in a menu any more. Bottom sheet on the phone (grabber, 44px close), centred card from 640px.
 * Uses Radix Dialog directly (not the shared sheet component) so it owns its own look.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { X, Search, Plus, Receipt, UserPlus, LifeBuoy, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { DB_FEATURES } from '@/config/dbFeatures';
import { useNavGroups, useIsActive } from '@/components/app/shell/shared';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { HELP_ENABLED, openHelp, useHelpUnread } from '@/support/openHelp';
import './y-nav-c.css';

/** Extra words people type for a screen, so "ניקיון" or "קבלה" finds the right tile. */
const ALIASES = {
  Payments: 'תשלומים יתרות כסף מקדמה',
  ExpenseTracker: 'הוצאות',
  Invoices: 'קבלות חשבוניות מסמכים',
  Bookings: 'הזמנה אורחים',
  Messages: 'וואטסאפ הודעות',
  Settings: 'יחידות פרטים הגדרות',
  Integrations: 'booking airbnb ערוצים סנכרון',
  Cleaning: 'ניקיון מנקה',
  Reviews: 'ביקורות דירוג',
  DynamicPricing: 'מחיר מחירים חגים',
  RevenueIntelligence: 'הכנסות דוח',
};

/** Order the owner reaches for most; what is not listed keeps the nav map's order after it. */
const FIRST = ['Bookings', 'Payments', 'Messages', 'Cleaning', 'Reviews', 'Settings'];

export function MoreSheetC({ open, onOpenChange, user, exclude = [] }) {
  const navigate = useNavigate();
  const quick = useQuickBooking();
  const isActive = useIsActive();
  const helpUnread = useHelpUnread();
  const [q, setQ] = useState('');
  const groups = useNavGroups(user);

  const screens = useMemo(() => {
    const all = [];
    groups.forEach((g) => g.items.forEach((i) => { if (!exclude.includes(i.page) && !all.some((a) => a.page === i.page)) all.push(i); }));
    const rank = (p) => { const k = FIRST.indexOf(p); return k < 0 ? 99 : k; };
    return all.map((s, n) => ({ ...s, n })).sort((a, b) => rank(a.page) - rank(b.page) || a.n - b.n);
  }, [groups, exclude]);

  const term = q.trim().toLowerCase();
  const shown = term ? screens.filter((s) => `${s.label} ${ALIASES[s.page] || ''}`.toLowerCase().includes(term)) : screens;

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
          ) : <p className="ycm-sec">מסכים</p>}

          <ul className="ycm-grid">
            {shown.map(({ page, label, icon: Icon }) => {
              const on = isActive(page);
              return (
                <li key={page}>
                  <button type="button" className={cn('ycm-tile press', on && 'on')} aria-current={on ? 'page' : undefined} onClick={() => go(page)}>
                    <span className="ycm-ic"><Icon strokeWidth={1.75} aria-hidden /></span>
                    <span className="ycm-lb">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {term && !shown.length ? <p className="ycm-none">אין מסך בשם הזה. אפשר לחפש אותו באורחים ובהזמנות.</p> : null}

          {HELP_ENABLED && !term ? (
            <button type="button" className="ycm-help press" onClick={() => { close(); window.setTimeout(openHelp, 0); }}>
              <LifeBuoy strokeWidth={1.75} aria-hidden /><span>עזרה ושאלות</span>
              {helpUnread ? <i className="ycm-dot" aria-label="יש תשובה חדשה" /> : null}
              <ChevronLeft strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
