/**
 * X3 · "פנים". The day is people and places, not rows. One strip with the four numbers, then a deck of
 * cards, each a real photo of the unit with the guest's face on it and the one thing to do for them,
 * most urgent first. Press and hold to do it; the card checks, steps aside, and the next one slides in.
 * Under it, every unit as a photo with what is happening in it today. Money in one line.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft } from 'lucide-react';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { readOrgSettings } from '@/lib/onboarding/orgSettings';
import { DEMO_PEOPLE } from '@/lib/demoPeople';
import { formatDayHe } from '@/lib/stay/format';
import { checkOutOf, isActiveBooking } from '@/lib/stay/bookings';
import { cn } from '@/lib/utils';
import { useTodayModel, money, moneyNum } from './model';
import Face from './Face';
import HoldButton from './HoldButton';
import StaySheet from './Sheet';
import './x.css';

const EASE = [0.23, 1, 0.32, 1];
const KICK = { message: 'הודעה מוכנה', clean: 'ניקיון', lead: 'פנייה חדשה', balance: 'תשלום' };
const HOLD_L = { message: 'החזיקו לשליחה', clean: 'החזיקו לסימון', lead: 'החזיקו למענה', balance: 'החזיקו לתזכורת' };

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  const [ghost, setGhost] = useState(() => new Set());
  const [sheet, setSheet] = useState(null);
  const [composer, setComposer] = useState(null);
  const deckRef = useRef(null);
  const cover = readOrgSettings().cover_photo || (DEMO_PEOPLE ? '/demo/complex-pool.webp' : null);

  const all = useMemo(() => {
    const seen = new Set(); const out = [];
    for (const a of [...m.queueAll, ...m.doneItems]) { if (!seen.has(a.id)) { seen.add(a.id); out.push(a); } }
    return out.sort((a, z) => a.score - z.score || String(a.time || '99').localeCompare(String(z.time || '99')));
  }, [m.queueAll, m.doneItems]);
  const deck = all.filter((a) => !m.isDone(a.id) || ghost.has(a.id));
  const curIdx = deck.findIndex((a) => !m.isDone(a.id));

  const complete = (a) => {
    setGhost((s) => new Set(s).add(a.id));
    m.doItem(a);
    setTimeout(() => setGhost((s) => { const n = new Set(s); n.delete(a.id); return n; }), 900);
  };

  // units today: one line of truth per unit, from the bookings
  const units = (m.data.properties || []).slice(0, 4).map((p) => {
    const act = (m.data.bookings || []).filter((b) => isActiveBooking(b) && b.property_id === p.id);
    const out = act.find((b) => checkOutOf(b) === m.day);
    const inn = act.find((b) => b.check_in_date === m.day);
    const stay = act.find((b) => b.check_in_date < m.day && checkOutOf(b) > m.day);
    const t = (b, k) => (k === 'in' ? (p.check_in_time || '15:00') : (p.check_out_time || '11:00'));
    let st = 'פנויה היום';
    if (out && inn) st = `מתפנה ${t(out, 'out')} · נכנסים ${t(inn, 'in')}`;
    else if (out) st = `יוצאים ${t(out, 'out')}`;
    else if (inn) st = `נכנסים ${t(inn, 'in')}`;
    else if (stay) st = 'מאוכלסת';
    return { p, st, busy: !!(out || inn || stay), b: inn || stay || out };
  });

  const stats = [
    { k: 'in', n: m.board.arrivals.length, l: 'מגיעים' },
    { k: 'out', n: m.board.departures.length, l: 'יוצאים' },
    { k: 'clean', n: m.openCleanings.length, l: 'ניקיון', to: '/cleaning' },
    { k: 'leads', n: m.leads.length, l: 'פניות', to: '/leads' },
  ];

  const photoFor = (a) => (a.kind === 'lead' ? cover : unitPhoto(m.prop(a.booking?.property_id || a.c?.departure?.property_id)));

  return (
    <div className="x3" dir="rtl">
      <h1 className="sr-only">היום</h1>
      <section className="x3-stats" aria-label="היום במספרים">
        {stats.map((s, i) => {
          const Body = (
            <motion.span className="x3-stat-in" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: i * 0.04 }}>
              <b dir="ltr">{s.n}</b><span>{s.l}</span>
            </motion.span>
          );
          return s.to ? <Link key={s.k} to={s.to} className="x3-stat press">{Body}</Link> : <div key={s.k} className="x3-stat">{Body}</div>;
        })}
      </section>

      <section className="x3-deck-wrap" aria-label="עכשיו">
        <div className="x3-row">
          <h2 className="x3-h2">עכשיו</h2>
          {curIdx >= 0 ? <span className="x3-count">{m.doneCount + 1} מתוך {m.total}</span> : null}
        </div>
        {deck.length && curIdx >= 0 ? (
          <motion.ul ref={deckRef} className="x3-deck" layout>
            <AnimatePresence initial={false} mode="popLayout">
              {deck.map((a, i) => {
                const isDone = m.isDone(a.id);
                const photo = photoFor(a);
                const face = a.kind === 'lead' ? a.lead.full_name : a.kind === 'clean' ? null : a.booking?.guest_name;
                return (
                  <motion.li key={a.id} layout className={cn('x3-card', i === curIdx && 'is-cur', isDone && 'is-done')}
                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: isDone ? 0.0 : 1, scale: isDone ? 0.94 : 1, transition: { duration: isDone ? 0.35 : 0.4, ease: EASE, delay: isDone ? 0.5 : 0.05 * i } }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}>
                    <button type="button" className="x3-card-photo" onClick={() => (a.booking ? setSheet(a.booking) : null)} aria-label={a.booking ? `פרטי ההזמנה, ${a.title}` : a.title}>
                      {photo ? <img src={photo} alt="" loading={i < 3 ? 'eager' : 'lazy'} decoding="async" draggable={false} /> : null}
                      {a.time ? <span className="x3-time" dir="ltr">{a.time}</span> : null}
                    </button>
                    {face !== null ? <span className="x3-card-face"><Face name={face || ''} size={52} ring /></span> : null}
                    <div className="x3-card-b">
                      <p className="x3-kick">{KICK[a.kind]}</p>
                      <p className="x3-title">{a.title}</p>
                      <p className="x3-sub">{a.sub}</p>
                      <HoldButton label={HOLD_L[a.kind]} doneLabel={a.doneText} done={isDone} onDone={() => complete(a)} />
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <p className="x3-clear"><Check strokeWidth={2} />הכל בוצע להיום.</p>
        )}
      </section>

      <div className="x3-lower">
        <section className="x3-units" aria-label="היחידות היום">
          <div className="x3-row"><h2 className="x3-h2">היחידות היום</h2><Link to="/multicalendar" className="x3-link">ליומן</Link></div>
          <ul className="x3-ugrid">
            {units.map(({ p, st, busy, b }, i) => (
              <motion.li key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE, delay: 0.15 + i * 0.05 }}>
                <button type="button" className="x3-unit press" onClick={() => (b ? setSheet(b) : null)}>
                  {unitPhoto(p) ? <img src={unitPhoto(p)} alt="" loading="lazy" decoding="async" /> : null}
                  <span className="x3-unit-shade" aria-hidden />
                  <span className="x3-unit-t"><b>{p.name}</b><span className={cn(!busy && 'free')}>{st}</span></span>
                </button>
              </motion.li>
            ))}
          </ul>
        </section>
        <section className="x3-money" aria-label="כסף">
          <div className="x3-row"><h2 className="x3-h2">כסף</h2><Link to="/payments" className="x3-link">לתשלומים</Link></div>
          <div className="x3-money-in">
            <div><span className="x3-mk">נכנס ב{m.money.month}</span><b className="x3-mn" dir="ltr">₪{moneyNum(m.money.received)}</b></div>
            <div><span className="x3-mk">תפוסה</span><b className="x3-mn x3-mn--s" dir="ltr">{m.money.occupancy}%</b></div>
          </div>
          {m.pendingTotal > 0 ? <Link to="/balances" className="x3-due press"><i aria-hidden />{money(m.pendingTotal)} ממתינים לתשלום<ChevronLeft strokeWidth={1.75} /></Link> : null}
        </section>
      </div>
      <p className="sr-only">{formatDayHe(m.day)}</p>

      <StaySheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} booking={sheet} model={m}
        onWhatsApp={(b, t) => { setSheet(null); setComposer({ booking: b, template: t }); }} />
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
