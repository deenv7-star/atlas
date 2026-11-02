/**
 * W1 · "בנטו עם צילום". Four blocks, nothing hidden:
 *   1. the complex photo card: "N מגיעים היום", who, and the ONE next action as a white pill
 *   2. four count tiles: יוצאים · ניקיון · פניות חדשות · ממתינים לתשלום (each one tap to its list/action)
 *   3. money in this month, big, with what is still expected
 *   4. the day by the hour (tap a row → booking sheet)
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DoorOpen, Brush, Inbox, Wallet, ArrowUpLeft, Check, KeyRound, ChevronLeft, BedDouble } from 'lucide-react';
import { AvatarStack, GuestAvatar } from '@/components/app/atoms';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { readOrgSettings } from '@/lib/onboarding/orgSettings';
import { uploadedPhoto } from '@/lib/stay/unitPhoto';
import { DEMO_PEOPLE } from '@/lib/demoPeople';
import { templateByKey } from '@/lib/stay/whatsapp';
import { firstName } from '@/lib/stay/format';
import { cn } from '@/lib/utils';
import { useTodayModel, guestLabel, money, moneyNum } from './model';
import StaySheet from './StaySheet';
import './w.css';

const ROW_ICON = { in: KeyRound, out: DoorOpen, clean: Brush };

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  const [composer, setComposer] = useState(null);
  const [sheet, setSheet] = useState(null);
  const settings = readOrgSettings();
  const photo = settings.cover_photo || uploadedPhoto((m.data.properties || [])[0]) || (DEMO_PEOPLE ? '/demo/complex-pool.webp' : null);
  const { board, next } = m;
  const arrivals = board.arrivals;
  const rows = m.rowsFor(board, m.day);
  const times = [...new Set(rows.filter((r) => r.kind === 'in').map((r) => r.time))].sort().slice(0, 3);

  const openWa = (booking, template) => setComposer({ booking, template });
  const nextLabel = !next ? null
    : next.kind === 'message' ? `${templateByKey(next.template).label} ל${firstName(next.booking.guest_name) || next.unit}`
      : next.kind === 'cleaning' ? `סימון ניקיון ${next.c.unit}`
        : `תזכורת תשלום ל${firstName(next.booking.guest_name) || next.unit}`;
  const doNext = () => {
    if (!next) return;
    if (next.kind === 'message') openWa(next.booking, next.template);
    else if (next.kind === 'cleaning') m.markCleaned(next.c);
    else openWa(next.booking, 'balance_reminder');
  };

  const tiles = [
    { k: 'out', icon: DoorOpen, n: board.departures.length, l: 'יוצאים היום', to: '/bookings' },
    { k: 'clean', icon: Brush, n: m.openCleanings.length, l: 'ניקיון פתוח', to: '/cleaning' },
    { k: 'leads', icon: Inbox, n: m.leads.length, l: 'פניות חדשות', to: '/leads', hot: m.leads.length > 0 },
    { k: 'pay', icon: Wallet, n: m.pending.length, l: 'ממתינים לתשלום', to: '/balances' },
  ];

  return (
    <div className="w1" dir="rtl">
      <h1 className="sr-only">היום</h1>
      <div className="w1-grid">
        {/* 1 · hero photo */}
        <section className="w1-hero w1-a-hero" aria-label="מי מגיע היום">
          {photo ? <img src={photo} alt="" className="w1-hero-img" decoding="async" /> : null}
          <span className="w1-hero-shade" aria-hidden />
          <span className="w1-chip w1-chip--glass">{user?.organization_name || 'המתחם שלכם'}</span>
          <div className="w1-hero-in">
            <div className="w1-hero-count">
              <span className="w1-huge" dir="ltr">{arrivals.length}</span>
              <span className="w1-hero-t">
                <span className="w1-h2">מגיעים היום</span>
                <span className="w1-hero-times" dir="ltr">{times.length ? times.join(' · ') : '\u00A0'}</span>
              </span>
              {arrivals.length ? <AvatarStack names={arrivals.map((a) => a.booking.guest_name).filter(Boolean)} size={36} max={3} className="w1-stack" /> : null}
            </div>
            {next ? (
              <button type="button" className="w1-cta press" onClick={doNext}>
                <span className="w1-cta-t"><span className="w1-cta-k">הדבר הבא</span><span className="w1-cta-l">{nextLabel}</span></span>
                <span className="w1-cta-go" aria-hidden><ArrowUpLeft strokeWidth={2.25} /></span>
              </button>
            ) : (
              <p className="w1-ready"><span className="w1-ready-i"><Check strokeWidth={2.5} /></span>הכל מוכן להיום</p>
            )}
          </div>
        </section>

        {/* 2 · count tiles */}
        <section className="w1-tiles w1-a-tiles" aria-label="מה מחכה לכם">
          {tiles.map(({ k, icon: Icon, n, l, to, hot }) => (
            <Link key={k} to={to} className={cn('w1-tile press', hot && 'hot')}>
              <span className="w1-tile-top"><span className="w1-ic"><Icon strokeWidth={1.9} /></span><ChevronLeft className="w1-tile-go" strokeWidth={2} /></span>
              <span className="w1-tile-n" dir="ltr">{n}</span>
              <span className="w1-tile-l">{l}</span>
            </Link>
          ))}
        </section>

        {/* 3 · money */}
        <section className="w1-card w1-money w1-a-money" aria-label="כסף">
          <div className="w1-row">
            <p className="w1-k">נכנס ב{m.money.month}</p>
            <Link to="/payments" className="w1-link press">לכל התשלומים</Link>
          </div>
          <p className="w1-big" dir="ltr"><span className="w1-cur">₪</span><span>{moneyNum(m.money.received)}</span></p>
          <div className="w1-money-foot">
            <span>תפוסה ב{m.money.month}</span>
            <b dir="ltr">{m.money.occupancy}%</b>
          </div>
          <span className="w1-bar" aria-hidden><i style={{ width: `${Math.max(4, m.money.occupancy)}%` }} /></span>
          {m.pendingTotal > 0 ? (
            <Link to="/balances" className="w1-due press"><i aria-hidden />{money(m.pendingTotal)} עוד לא שולמו<ChevronLeft strokeWidth={2} /></Link>
          ) : null}
        </section>

        {/* 4 · the day by the hour */}
        <section className="w1-card w1-day w1-a-day" aria-label="היום לפי שעות">
          <div className="w1-row"><p className="w1-h3">היום לפי שעות</p><Link to="/multicalendar" className="w1-link press">ליומן</Link></div>
          {rows.length ? (
            <ul className="w1-list">
              {rows.map((r) => {
                const Icon = ROW_ICON[r.kind];
                return (
                  <li key={r.key}>
                    <button type="button" className="w1-li press" onClick={() => (r.kind === 'clean' ? (r.done ? null : m.markCleaned(r.c)) : setSheet(r.booking))}>
                      <span className="w1-time" dir="ltr">{r.time}</span>
                      {r.kind === 'clean' ? <span className="w1-ic w1-ic--sm"><Icon strokeWidth={1.9} /></span> : r.booking.guest_name ? <GuestAvatar name={r.booking.guest_name} size={40} /> : <span className="w1-ic w1-ic--sm"><BedDouble strokeWidth={1.9} /></span>}
                      <span className="w1-li-t">
                        <span className="w1-li-n">{r.kind === 'clean' ? `ניקיון ${r.unit}` : guestLabel(r.booking)}</span>
                        <span className="w1-li-s">{r.kind === 'clean' ? (r.done ? 'בוצע' : 'הקישו לסימון שבוצע') : r.unit}</span>
                      </span>
                      <span className={cn('w1-pill', r.kind === 'in' && 'in', r.done && 'done')}>{r.done ? <Check strokeWidth={2.5} /> : <Icon strokeWidth={2} />}{r.status}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <p className="w1-empty">אין היום כניסות או יציאות.</p>}
        </section>
      </div>

      <StaySheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} booking={sheet} model={m} onWhatsApp={(b, t) => { setSheet(null); openWa(b, t); }} />
      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => { if (!o) setComposer(null); }}
        booking={composer?.booking}
        property={composer ? m.prop(composer.booking.property_id) : null}
        balance={composer ? m.balanceFor(composer.booking) : undefined}
        initialTemplate={composer?.template}
        orgId={orgId}
        orgName={user?.organization_name || ''}
        onSent={(key) => { if (composer) { m.markSent(composer.booking.id, composer.template); m.markSent(composer.booking.id, key); } }}
      />
    </div>
  );
}
