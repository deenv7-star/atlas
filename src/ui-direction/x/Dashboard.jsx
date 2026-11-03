/**
 * X1 · "מכתב הבוקר". The day reads like the first line of a letter: one big sentence with the numbers
 * that matter, the faces of who is coming, then ONE thing to do now, done with a single slide.
 * When it is done the next one rises into its place and the sentence updates. Nothing else competes.
 * Desktop: the same letter on the right, the day by the hour as a quiet agenda on the left.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Brush, Inbox, Wallet, ChevronLeft, Check } from 'lucide-react';
import { dayPart } from '@/components/app/atoms';
import Face from './Face';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { firstName, formatDayHe } from '@/lib/stay/format';
import { cn } from '@/lib/utils';
import { useTodayModel, guestLabel, money, moneyNum } from './model';
import SlideToDo from './SlideToDo';
import StaySheet from './Sheet';
import './x.css';

const KIND_ICON = { message: MessageCircle, clean: Brush, lead: Inbox, balance: Wallet };
const EASE = [0.23, 1, 0.32, 1];

function count(n, one, many) { return n === 1 ? `1 ${one}` : `${n} ${many}`; }

export function NowCard({ item, onDone, onOpen, compact = false }) {
  const Icon = KIND_ICON[item.kind] || MessageCircle;
  return (
    <div className={cn('x1-now', compact && 'x1-now--c')}>
      <div className="x1-now-top">
        <span className="x1-now-k"><Icon strokeWidth={1.75} />{item.kind === 'message' ? 'הודעה מוכנה' : item.kind === 'clean' ? 'ניקיון' : item.kind === 'lead' ? 'פנייה' : 'תשלום'}</span>
        {item.time ? <span className="x1-now-time" dir="ltr">{item.time}</span> : null}
      </div>
      <button type="button" className="x1-now-t" onClick={onOpen} disabled={!onOpen}>{item.title}</button>
      <p className="x1-now-s">{item.sub}</p>
      <SlideToDo resetKey={item.id} label={`החליקו ל${item.verb}`} doneLabel={item.doneText} onDone={onDone} />
    </div>
  );
}

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  const [sheet, setSheet] = useState(null);
  const [composer, setComposer] = useState(null);
  const [held, setHeld] = useState(null);
  const { board } = m;
  const cur = held || m.queue[0] || null;
  const later = m.queue.filter((q) => q.id !== cur?.id).slice(0, 3);
  const rows = m.rowsFor(board, m.day);
  const name = firstName(user?.full_name || '');

  const complete = (q) => {
    setHeld(q);
    m.doItem(q);
    setTimeout(() => setHeld(null), 1300);
  };

  const arrivals = board.arrivals;
  const nIn = arrivals.length; const nOut = board.departures.length;
  const lede = nIn || nOut
    ? <>{nIn ? <><b>{nIn}</b> {nIn === 1 ? 'מגיע' : 'מגיעים'}</> : 'אין מגיעים'}{nOut ? <>, <b>{nOut}</b> {nOut === 1 ? 'יוצא' : 'יוצאים'}.</> : '.'}</>
    : <>יום שקט. אין כניסות ויציאות.</>;
  const facts = [
    m.openCleanings.length ? { k: 'clean', t: count(m.openCleanings.length, 'ניקיון פתוח', 'ניקיונות פתוחים'), to: '/cleaning' } : null,
    m.leads.length ? { k: 'lead', t: count(m.leads.length, 'פנייה חדשה', 'פניות חדשות'), to: '/leads' } : null,
    m.pendingTotal > 0 ? { k: 'pay', t: `${money(m.pendingTotal)} ממתינים לתשלום`, to: '/balances', due: true } : null,
  ].filter(Boolean);

  return (
    <div className="x1" dir="rtl">
      <div className="x1-grid">
        <section className="x1-letter" aria-label="היום">
          <motion.p className="x1-kicker" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            {dayPart().greeting}{name ? `, ${name}` : ''} · {formatDayHe(m.day)}
          </motion.p>
          <motion.h1 className="x1-lede" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}>
            <span className="x1-lede-k">היום</span> {lede}
          </motion.h1>
          {facts.length ? (
            <motion.p className="x1-facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
              {facts.map((f, i) => (
                <React.Fragment key={f.k}>
                  {i ? <span className="x1-sep" aria-hidden>·</span> : null}
                  <Link to={f.to} className="x1-fact">{f.due ? <i className="x1-due" aria-hidden /> : null}{f.t}</Link>
                </React.Fragment>
              ))}
            </motion.p>
          ) : null}

          {arrivals.length ? (
            <ul className="x1-faces" aria-label="מי מגיע היום">
              {arrivals.slice(0, 4).map(({ booking, unit }, i) => (
                <motion.li key={booking.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE, delay: 0.2 + i * 0.05 }}>
                  <button type="button" className="x1-face press" onClick={() => setSheet(booking)}>
                    <Face name={booking.guest_name || ''} size={44} />
                    <span className="x1-face-t">
                      <span className="x1-face-n">{firstName(booking.guest_name) || guestLabel(booking)}</span>
                      <span className="x1-face-s"><span dir="ltr">{rows.find((r) => r.booking?.id === booking.id && r.kind === 'in')?.time}</span> · {unit}</span>
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          ) : null}

          <div className="x1-now-wrap">
            <div className="x1-now-head">
              <h2 className="x1-h2">עכשיו</h2>
              {m.total ? (
                <span className="x1-prog" aria-label={`${m.doneCount} מתוך ${m.total} בוצעו`}>
                  {Array.from({ length: Math.min(m.total, 8) }).map((_, i) => <i key={i} className={i < m.doneCount ? 'on' : ''} />)}
                </span>
              ) : null}
            </div>
            <AnimatePresence mode="popLayout" initial={false}>
              {cur ? (
                <motion.div key={cur.id} layout initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.97, transition: { duration: 0.28, ease: EASE } }} transition={{ duration: 0.45, ease: EASE }}>
                  <NowCard item={cur} onDone={() => complete(cur)} onOpen={cur.booking ? () => setSheet(cur.booking) : null} />
                </motion.div>
              ) : (
                <motion.p key="clear" className="x1-clear" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Check strokeWidth={2} />הכל בוצע להיום.
                </motion.p>
              )}
            </AnimatePresence>
            {later.length ? (
              <motion.ul layout className="x1-later" aria-label="אחר כך">
                <AnimatePresence initial={false}>
                  {later.map((q) => {
                    const Icon = KIND_ICON[q.kind] || MessageCircle;
                    return (
                      <motion.li key={q.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                        <button type="button" className="x1-li press" onClick={() => (q.booking ? setSheet(q.booking) : null)}>
                          <Icon strokeWidth={1.75} className="x1-li-ic" />
                          <span className="x1-li-t"><span className="x1-li-n">{q.title}</span><span className="x1-li-s">{q.sub}</span></span>
                          {q.time ? <span className="x1-li-time" dir="ltr">{q.time}</span> : <ChevronLeft strokeWidth={1.75} className="x1-li-go" />}
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            ) : null}
          </div>
        </section>

        <aside className="x1-side" aria-label="היום לפי שעות וכסף">
          <section className="x1-agenda">
            <div className="x1-row"><h2 className="x1-h2">לפי שעות</h2><Link to="/multicalendar" className="x1-link">ליומן</Link></div>
            {rows.length ? (
              <ul>
                {rows.map((r) => (
                  <li key={r.key}>
                    <button type="button" className={cn('x1-ag press', r.done && 'done')} onClick={() => (r.kind === 'clean' ? null : setSheet(r.booking))}>
                      <span className="x1-ag-time" dir="ltr">{r.time}</span>
                      <span className="x1-ag-t">
                        <span className="x1-ag-n">{r.kind === 'clean' ? `ניקיון ${r.unit}` : guestLabel(r.booking)}</span>
                        <span className="x1-ag-s">{r.kind === 'clean' ? (r.done ? 'בוצע' : 'אחרי היציאה') : r.unit}</span>
                      </span>
                      <span className={cn('x1-ag-st', r.kind === 'in' && 'in')}>{r.done ? <Check strokeWidth={2} /> : null}{r.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="x1-muted">אין היום כניסות או יציאות.</p>}
          </section>
          <section className="x1-money">
            <p className="x1-money-k">נכנס ב{m.money.month}</p>
            <p className="x1-money-n" dir="ltr"><span>₪</span>{moneyNum(m.money.received)}</p>
            <p className="x1-money-s">תפוסה <b dir="ltr">{m.money.occupancy}%</b> · <Link to="/payments" className="x1-link">לכל התשלומים</Link></p>
          </section>
        </aside>
      </div>

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
