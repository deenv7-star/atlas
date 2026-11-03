/**
 * Y1 · "לוח בהיר, פאנל כהה" (after the Salesforce invoices board Deen sent).
 * Light upper half: the month in three big thin numbers with the week ahead as striped bars and the
 * faces arriving each day; beside it "עכשיו" with the next three things as cards, the first one indigo,
 * and one dark pill that does it. Dark navy lower panel: the bookings as a list, the chosen one open
 * beside it (desktop) or as a sheet (phone).
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUpLeft, Check, ChevronLeft, CalendarRange, Sparkles } from 'lucide-react';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { formatDayHe } from '@/lib/stay/format';
import { checkOutOf } from '@/lib/stay/bookings';
import { cn } from '@/lib/utils';
import { useTodayModel, money, guestLabel } from './model';
import Face from './Face';
import { Num, StripeBar, FaceStack, useWeek, useBookingList, whenOf } from './ui';
import { Detail, StaySheet, Journey } from './Detail';

const EASE = [0.23, 1, 0.32, 1];
const KICK = { message: 'הודעה מוכנה', clean: 'ניקיון', lead: 'פנייה חדשה', balance: 'תשלום' };
const rise = (i = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE, delay: 0.05 + i * 0.07 } });

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  const week = useWeek(m, 7);
  const list = useBookingList(m);
  const [tab, setTab] = useState('all');
  const [selId, setSelId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [composer, setComposer] = useState(null);
  const [pressed, setPressed] = useState(false);

  const shown = useMemo(() => {
    if (tab === 'today') return list.filter((b) => b.check_in_date === m.day || checkOutOf(b) === m.day);
    if (tab === 'due') return list.filter((b) => m.balanceFor(b).balance > 0);
    return list;
  }, [tab, list, m]);
  const sel = shown.find((b) => b.id === selId) || shown.find((b) => b.check_in_date === m.day) || shown[0] || null;
  const dueCount = list.filter((b) => m.balanceFor(b).balance > 0).length;
  const todayCount = list.filter((b) => b.check_in_date === m.day || checkOutOf(b) === m.day).length;

  const q3 = m.queue.slice(0, 3);
  const cur = q3[0];
  const doNext = () => {
    if (!cur) return;
    setPressed(true); m.doItem(cur); setTimeout(() => setPressed(false), 700);
  };

  const arrivals = m.board.arrivals.map((a) => a.booking.guest_name || '');
  const departures = m.board.departures.map((a) => a.booking.guest_name || '');
  const recvTotal = Math.max(1, m.money.expected);
  const months = m.money.months || [];
  const best = Math.max(1, ...months.map((x) => (x.value || 0) + (x.expected || 0)));

  const pills = [
    { k: 'in', n: arrivals.length, l: 'מגיעים', faces: arrivals, on: () => setTab('today') },
    { k: 'out', n: departures.length, l: 'יוצאים', faces: departures, on: () => setTab('today') },
    { k: 'clean', n: m.openCleanings.length, l: m.openCleanings.length === 1 ? 'ניקיון' : 'ניקיונות', note: m.openCleanings[0]?.unit, to: '/cleaning' },
    { k: 'leads', n: m.leads.length, l: 'פניות חדשות', faces: m.leads.map((l) => l.full_name || ''), to: '/leads' },
  ];

  return (
    <div className="y1" dir="rtl">
      <motion.div className="y1-title" {...rise(0)}>
        <div>
          <h1 className="y1-h1">היום</h1>
          <p className="y1-date">{formatDayHe(m.day)}{user?.organization_name ? ` · ${user.organization_name}` : ''}</p>
        </div>
        <p className="y1-lede"><b dir="ltr">{arrivals.length}</b> מגיעים, <b dir="ltr">{departures.length}</b> יוצאים{m.queue.length ? <>, <b dir="ltr">{m.queue.length}</b> דברים מחכים לכם</> : null}</p>
      </motion.div>

      <div className="y1-top">
        {/* the month + the week ahead */}
        <motion.section className="y1-card y1-sum" aria-label="החודש והשבוע" {...rise(1)}>
          <div className="y1-metrics">
            <div className="y1-m">
              <p className="y1-k">נכנס ב{m.money.month}</p>
              <Num value={m.money.received} pre="₪" className="y1-big" />
              <div className="y1-m-viz">
                <span className="y1-bars" aria-hidden>
                  {months.map((x, i) => <i key={i} className={i === months.length - 1 ? 'hot' : ''} style={{ height: `${Math.max(8, (((x.value || 0) + (x.expected || 0)) / best) * 100)}%`, animationDelay: `${200 + i * 60}ms` }} />)}
                </span>
                <span className="y1-m-cap">6 חודשים</span>
              </div>
            </div>
            <div className="y1-m">
              <p className="y1-k">ממתינים לתשלום</p>
              <Num value={m.pendingTotal} pre="₪" className="y1-big" delay={80} />
              <div className="y1-m-viz">
                <StripeBar value={m.money.received / recvTotal} delay={250} className="y1-m-bar" />
                <span className="y1-m-cap"><i className="y1-amber" aria-hidden />{m.pending.length} {m.pending.length === 1 ? 'הזמנה' : 'הזמנות'} עם יתרה</span>
              </div>
            </div>
            <div className="y1-m">
              <p className="y1-k">תפוסה ב{m.money.month}</p>
              <Num value={m.money.occupancy} post="%" className="y1-big" delay={160} />
              <div className="y1-m-viz">
                <span className="y1-dotrow" aria-hidden>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < Math.round(m.money.occupancy / 10) ? 'on' : ''} style={{ animationDelay: `${300 + i * 40}ms` }} />)}</span>
                <span className="y1-m-cap">מהלילות בחודש</span>
              </div>
            </div>
          </div>
          <div className="y1-week" aria-label="השבוע הקרוב">
            {week.map((d, i) => (
              <div key={d.d} className={cn('y1-wd', i === 0 && 'is-today')}>
                <p className="y1-wd-l">{d.label}</p>
                <StripeBar value={d.occ} delay={350 + i * 70} tone={i === 0 ? 'ind' : 'navy'} />
                <div className="y1-wd-f">{d.names.length ? <FaceStack names={d.names} size={32} max={3} /> : <span className="y1-wd-free">{d.occN ? `${d.occN}/${d.units}` : 'פנוי'}</span>}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* now: the next three, the first one indigo, one dark pill */}
        <motion.section className="y1-card y1-now" aria-label="עכשיו" {...rise(2)}>
          <div className="y1-now-h">
            <div>
              <p className="y1-k">מחכה לכם היום</p>
              <p className="y1-now-n"><Num value={m.queue.length} className="y1-big" delay={120} /><span>{m.queue.length === 1 ? 'משימה' : 'משימות'}</span>{m.doneCount ? <em className="y1-chip"><Check strokeWidth={2} />{m.doneCount} בוצעו</em> : null}</p>
            </div>
            <Link to="/messages" className="y1-cb press" aria-label="כל ההודעות"><ArrowUpLeft strokeWidth={1.75} /></Link>
          </div>
          <div className="y1-now-b">
            <ul className="y1-tiles">
              <AnimatePresence initial={false} mode="popLayout">
                {q3.map((a, i) => (
                  <motion.li key={a.id} layout className={cn('y1-tile', i === 0 && 'is-hot')}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -24, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: EASE }}>
                    <p className="y1-tile-k">{KICK[a.kind]}</p>
                    <p className="y1-tile-t">{a.title}</p>
                    <span className="y1-tile-f">
                      {a.kind === 'clean' ? <Sparkles strokeWidth={1.75} /> : <Face name={a.kind === 'lead' ? a.lead.full_name : (a.booking?.guest_name || '')} size={30} />}
                      <span>{a.kind === 'lead' ? (a.lead.full_name || '').split(' ')[0] : a.unit}</span>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {!q3.length ? <li className="y1-tile y1-tile--clear"><Check strokeWidth={2} />הכל בוצע להיום</li> : null}
            </ul>
            {cur ? (
              <button type="button" className={cn('y1-go press', pressed && 'is-go')} onClick={doNext}>
                <span className="y1-go-t"><b>{cur.verb}</b><small>{cur.title}</small></span>
                <span className="y1-go-c">{pressed ? <Check strokeWidth={2.2} /> : <ArrowLeft strokeWidth={2} />}</span>
              </button>
            ) : null}
          </div>
        </motion.section>
      </div>

      <motion.section className="y1-pills" aria-label="היום בקצרה" {...rise(3)}>
        <p className="y1-pills-l">היום<span className="y1-badge" dir="ltr">{m.board.arrivals.length + m.board.departures.length}</span></p>
        <div className="y1-pills-row">
          {pills.map((p) => {
            const inner = (
              <>
                {p.faces?.length ? <FaceStack names={p.faces} size={28} max={3} /> : p.k === 'clean' ? <Sparkles strokeWidth={1.75} className="y1-pill-ic" /> : null}
                <span className="y1-pill-t"><b dir="ltr">{p.n}</b> {p.l}{p.note ? <small> · {p.note}</small> : null}</span>
                <span className="y1-pill-c"><ChevronLeft strokeWidth={1.75} /></span>
              </>
            );
            return p.to ? <Link key={p.k} to={p.to} className="y1-pill press">{inner}</Link> : <button key={p.k} type="button" className="y1-pill press" onClick={p.on}>{inner}</button>;
          })}
        </div>
      </motion.section>

      <motion.section className="y1-panel" aria-label="ההזמנות" {...rise(4)}>
        <div className="y1-notch" role="tablist" aria-label="סינון הזמנות">
          {[['all', 'הכל', list.length], ['today', 'היום', todayCount], ['due', 'יתרות', dueCount]].map(([k, l, n]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={cn('y1-nt press', tab === k && 'on')} onClick={() => { setTab(k); setSelId(null); }}>
              {tab === k ? <motion.i layoutId="y1-nt-on" className="y1-nt-on" transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }} /> : null}
              <span>{l}</span><em dir="ltr">{n}</em>
            </button>
          ))}
        </div>
        <div className="y1-panel-h">
          <h2 className="y1-panel-t">ההזמנות</h2>
          <Link to="/multicalendar" className="y1-cb y1-cb--d press" aria-label="ליומן"><CalendarRange strokeWidth={1.75} /></Link>
        </div>
        <div className="y1-split">
          <ul className="y1-list">
            {shown.slice(0, 6).map((b, i) => {
              const bal = m.balanceFor(b);
              const on = sel?.id === b.id;
              return (
                <motion.li key={b.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.35 + i * 0.05 }}>
                  <button type="button" className={cn('y1-row press', on && 'on')} aria-pressed={on}
                    onClick={() => { setSelId(b.id); if (window.matchMedia('(max-width: 1023px)').matches) setSheet(b); }}>
                    <Face name={b.guest_name || ''} size={44} />
                    <span className="y1-row-n"><b>{guestLabel(b)}</b><small>{m.prop(b.property_id)?.name || ''} · {whenOf(b, m.day)}</small></span>
                    <span className={cn('y1-st', bal.balance > 0 ? 'due' : 'ok')}>{bal.total === 0 ? 'בלי מחיר' : bal.balance > 0 ? (bal.paid > 0 ? 'מקדמה' : 'לא שולם') : 'שולם'}</span>
                    <span className="y1-row-a" dir="ltr"><small>₪</small>{Math.round(Number(b.total_price) || 0).toLocaleString('he-IL')}</span>
                  </button>
                </motion.li>
              );
            })}
            {!shown.length ? <li className="y1-empty">אין הזמנות כאן כרגע</li> : null}
            {shown.length > 6 ? <li><Link to="/bookings" className="y1-more press">עוד {shown.length - 6} הזמנות<ChevronLeft strokeWidth={1.75} /></Link></li> : null}
          </ul>
          <div className="y1-split-d">
            <AnimatePresence mode="wait">
              {sel ? (
                <motion.div key={sel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EASE }}>
                  <Detail booking={sel} model={m} onWhatsApp={(b, t) => setComposer({ booking: b, template: t })} />
                  <Journey booking={sel} model={m} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>
      <p className="sr-only">{money(m.pendingTotal)} ממתינים לתשלום</p>

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
