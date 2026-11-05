/**
 * Today (release/today-channels, 05.11.2026). Desktop: one frosted window over the hills photo; at the top the month's
 * income as one large number with the day told in one sentence under it and the six-month horizon (./home/VarA6),
 * then "הדבר הבא" as three cards, the month calendar + today's list in the side column, and the navy bookings panel.
 * Phone (<1024): its own calm single column (./home/MobileToday): greeting, the day's sentence, one next thing,
 * today's rows, a quiet money row.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, MoreHorizontal, Sparkles } from 'lucide-react';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatDayHe, firstName, parseDay } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, channelOf } from '@/lib/stay/bookings';
import { dayPart, GuestAvatar } from '@/components/app/atoms';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { useTodayModel, money, guestLabel, MONTHS } from './model';
import Face from './Face';
import { useBookingList, whenOf } from './ui';
import { BookingsPanel, BookingSheet, isPhone } from './Bookings';
import { ArrivalsSheet, IncomeSheet, OccupancySheet, PendingSheet, RevenueSheet, DaySheet } from './TodaySheets';
import HomeTop from './home/HomeTop';
import MobileToday from './home/MobileToday';
import './home/home.css';
import { useQuickBooking } from '@/components/app/QuickBooking';
import './y3.css';
import './y-fix.css';
import StaleIndicator from '@/components/app/StaleIndicator';
import ImportEntryCard from '@/components/import/EntryCard';
import { MoneyLoadBanner } from '@/components/app/MoneyLoadBanner';
import { canShowValues } from '@/lib/stay/loadState';

const EASE = [0.23, 1, 0.32, 1];
const rise = (i = 0) => ({ initial: { opacity: 0, y: 16, scale: 0.985 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.7, ease: EASE, delay: 0.05 + i * 0.07 } });
const KICK = { message: 'הודעה מוכנה', clean: 'ניקיון', lead: 'פנייה חדשה', balance: 'תשלום' };
const BTN = { message: 'שליחה', clean: 'סימון', lead: 'מענה', balance: 'תזכורת' };
const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function MonthCal({ model }) {
  const now = parseDay(model.day);
  const y = now.getFullYear(); const mth = now.getMonth();
  const first = new Date(y, mth, 1).getDay(); const days = new Date(y, mth + 1, 0).getDate();
  const iso = (d) => `${y}-${String(mth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const act = (model.data.bookings || []).filter(isActiveBooking);
  const units = Math.max(1, (model.data.properties || []).length);
  const cells = [];
  for (let i = 0; i < first; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) {
    const k = iso(d);
    const arr = act.some((b) => b.check_in_date === k);
    const occ = act.filter((b) => b.check_in_date <= k && checkOutOf(b) > k).length;
    cells.push({ d, k, arr, occ: occ / units, today: k === model.day });
  }
  return (
    <div className="y2-cal">
      <div className="y2-cal-h">
        <p>{MONTHS[mth]} {y}</p>
        <span><Link to={createPageUrl('MultiCalendar')} className="y2-cal-nav press" aria-label="החודש הקודם ביומן"><ChevronRight strokeWidth={1.75} /></Link><Link to={createPageUrl('MultiCalendar')} className="y2-cal-nav press" aria-label="החודש הבא ביומן"><ChevronLeft strokeWidth={1.75} /></Link></span>
      </div>
      <div className="y2-cal-g">
        {DAYS.map((d) => <b key={d}>{d}</b>)}
        {cells.map((c, i) => (c ? (
          <span key={c.k} className={cn('y2-cd', c.arr && 'arr', !c.arr && c.occ > 0 && 'occ', c.today && 'today')} style={{ animationDelay: `${300 + i * 12}ms` }}>{c.d}</span>
        ) : <span key={`e${i}`} />))}
      </div>
      <div className="y2-cal-k"><span><i className="arr" />הגעות</span><span><i className="occ" />תפוס</span><span><i className="today" />היום</span></div>
    </div>
  );
}

const NARROW = '(max-width: 1023px)';
function useNarrow() {
  const [n, setN] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(NARROW); if (!mq) return undefined;
    const on = () => setN(mq.matches); on(); mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return n;
}

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  // release/today-channels (05.11.2026): the phone (<1024) gets its own calm single-column Today (M2); desktop keeps the board
  const narrow = useNarrow();
  const list = useBookingList(m);
  const [sheet, setSheet] = useState(null);
  const [selId, setSelId] = useState(null);
  const panelRef = useRef(null);
  // phone: the navy sheet; desktop: pick it in the bookings panel and bring the panel into view
  const openBooking = (b) => {
    if (isPhone()) { setSheet(b); return; }
    setSelId(b.id);
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [composer, setComposer] = useState(null);
  const remindQueue = useRef([]);
  const sentRef = useRef(false);
  // fix/today-tiles: which tile's sheet is open (arrivals | income | occupancy | pending | revenue | day)
  const [tileSheet, setTileSheet] = useState(null);
  const closeTile = (o) => { if (!o) setTileSheet(null); };
  // ecosystem v1 #14: the bell opens this same "מה מחכה לכם היום" sheet (one inbox); from another screen it lands here with ?sheet=day
  useEffect(() => {
    const open = () => setTileSheet('day');
    window.addEventListener('atlas:open-day', open);
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('sheet') === 'day') {
      open();
      sp.delete('sheet');
      const qs = sp.toString();
      window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    }
    return () => window.removeEventListener('atlas:open-day', open);
  }, []);
  const fromTile = (b) => { setTileSheet(null); window.setTimeout(() => openBooking(b), 180); };
  const quick = useQuickBooking();
  const [going, setGoing] = useState(null);
  const name = firstName(user?.full_name || '');
  // Audit 04.11 #7: a new account with no units gets one prompt to add the first unit, not "הכל בוצע" twice.
  const noUnits = m.data.propertiesState === 'ready' && !(m.data.properties || []).length;
  // fix-1104 QA: until the bookings are read, no "0 מגיעים" and no "הכל בוצע להיום" (a slow first load said the day was empty).
  const boardKnown = canShowValues(m.data.bookingsState);
  // fix/today-tiles: units but no bookings at all = one honest card, not a board of zeros that reads as broken
  const noBookings = !noUnits && boardKnown && m.data.propertiesState === 'ready' && !(m.data.bookings || []).some(isActiveBooking);

  const arrivals = m.board.arrivals; const departures = m.board.departures;
  const months = m.money.months || [];
  const mx = Math.max(1, ...months.map((x) => (x.value || 0) + (x.expected || 0)));
  const wave = months.map((x) => ((x.value || 0) + (x.expected || 0)) / mx);
  const bestI = wave.indexOf(Math.max(...wave));
  // no revenue at all: the horizon draws dashed instead of a flat ₪0 line
  const hasRevenue = months.some((x) => (x.value || 0) + (x.expected || 0) > 0);
  const q3 = m.queue.slice(0, 3);
  const dueCount = m.owed.length;

  const go = (a) => { setGoing(a.id); m.doItem(a); setTimeout(() => setGoing(null), 900); };
  const today = [...departures.map((x) => ({ ...x, dir: 'out' })), ...arrivals.map((x) => ({ ...x, dir: 'in' }))];
  const upcoming = list.filter((b) => b.check_in_date > m.day).slice(0, 3);

  // reducedMotion="user": with reduced motion the entrance keeps only the fade, no scale(.985) shrinking 44px targets to 43
  return (
    <MotionConfig reducedMotion="user">
    <div className={cn('y2 hv hv-a6', noBookings && 'hv-empty', narrow && 'hm-on')} dir="rtl">
      {narrow ? (
        <motion.div {...rise(0)}>
          <MobileToday m={m} name={name} noUnits={noUnits} noBookings={noBookings} onAdd={() => quick.open()}
            arrivals={arrivals} departures={departures} dueCount={dueCount} onTile={setTileSheet}
            openBooking={openBooking} onDo={go} going={going} />
        </motion.div>
      ) : (
      <motion.div className="y2-win" {...rise(0)}>
        {/* home/var desktop (05.11.2026): the greeting is the full-width first row, so the side column and the first card share one top edge */}
        <div className="y2-hello">
          <div>
            <h1 className="y2-h1">{dayPart().greeting}{name ? <>, <b>{name}</b></> : null}</h1>
            <p className="y2-sub">{formatDayHe(m.day)}<StaleIndicator queries={m.data.queries} onRetry={m.retryLoad} className="y-stale-inline" /></p>
          </div>
          {noUnits || !boardKnown ? null : (
            <button type="button" className="y2-hello-chip press" aria-haspopup="dialog" onClick={() => setTileSheet('day')}><i aria-hidden />{m.queue.length ? (m.queue.length === 1 ? 'דבר אחד מחכה לכם' : `${m.queue.length} דברים מחכים לכם`) : 'אין משימות להיום'}</button>
          )}
        </div>

        <div className="y2-main">
          {m.paymentsState === 'error' ? <MoneyLoadBanner onRetry={m.retryLoad} /> : null}

          {/* 0 units: one way in, the import card (ייבוא מתחם → /import); manual setup stays inside /import */}
          {noUnits ? <ImportEntryCard where="today" className="y-first-unit-import" /> : null}

          {noUnits ? null : <HomeTop m={m} noBookings={noBookings} onAdd={() => quick.open()}
            arrivals={arrivals} departures={departures} wave={wave} hasRevenue={hasRevenue} dueCount={dueCount} onTile={setTileSheet}
            bestLabel={bestI >= 0 && hasRevenue ? money((months[bestI]?.value || 0) + (months[bestI]?.expected || 0)) : ''} />}

          {!q3.length ? null : (
          <section className="y2-next" aria-label="הדבר הבא">
            <div className="y2-sec-h"><h2>הדבר הבא</h2><Link to="/messages" className="y2-link">כל המשימות</Link></div>
            <ul className="y2-next-row">
              <AnimatePresence initial={false} mode="popLayout">
                {q3.map((a, i) => {
                  const photo = a.kind === 'lead' ? null : unitPhoto(m.prop(a.booking?.property_id || a.c?.departure?.property_id));
                  return (
                    <motion.li key={a.id} layout className={cn('y2-nc', i === 0 && 'is-hot')}
                      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -12 }} transition={{ duration: 0.5, ease: EASE }}>
                      <div className="y2-nc-t">
                        <p className="y2-nc-k">{KICK[a.kind]}</p>
                        <p className="y2-nc-h">{a.title}</p>
                        <p className="y2-nc-s">{a.sub}</p>
                        <button type="button" className={cn('y2-go press', going === a.id && 'is-go')} onClick={() => go(a)}>
                          {going === a.id ? <><Check strokeWidth={2.2} />{a.doneText}</> : <>{BTN[a.kind]}<ArrowLeft strokeWidth={2} /></>}
                        </button>
                      </div>
                      <span className="y2-nc-img">
                        {photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : null}
                        {a.kind === 'clean' ? <Sparkles strokeWidth={1.75} className="y2-nc-ic" /> : <span className="y2-nc-face"><Face name={a.kind === 'lead' ? a.lead.full_name : (a.booking?.guest_name || '')} size={34} ring /></span>}
                      </span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </section>
          )}
        </div>

        <aside className="y2-side" aria-label="החודש ומי מגיע">
          <div className="y2-me">
            <GuestAvatar name={user?.full_name || ''} src={user?.avatar_url} owner size={46} />
            <span className="y2-me-t"><b>{user?.organization_name || 'המתחם שלי'}</b><small>{user?.full_name || ''}</small></span>
            <Link to="/settings" className="y2-gb y2-gb--d press" aria-label="הגדרות המתחם"><MoreHorizontal strokeWidth={1.75} /></Link>
          </div>
          {/* M7 (audit 04.11): the side column's own 3 numbers repeated the tiles; removed for a calmer desktop. */}
          <MonthCal model={m} />
          {noBookings ? null : <>
          <div className="y2-sec-h y2-sec-h--d"><h2>היום</h2><Link to="/bookings" className="y2-link">כל ההזמנות</Link></div>
          <ul className="y2-arr">
            {[...today.map((x) => ({ b: x.booking, dir: x.dir })), ...upcoming.map((b) => ({ b, dir: 'soon' }))].slice(0, 5).map(({ b, dir }, i) => {
              const p = m.prop(b.property_id); const ch = channelOf(b);
              return (
                <motion.li key={`${dir}-${b.id}`} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.4 + i * 0.06 }}>
                  <button type="button" className="y2-arr-row press" onClick={() => openBooking(b)}>
                    {unitPhoto(p) ? <span className="y2-arr-img"><img src={unitPhoto(p)} alt="" loading="lazy" decoding="async" /><Face name={b.guest_name || ''} size={26} ring /></span> : <span className="y2-arr-img y3-row-img--face"><Face name={b.guest_name || ''} size={46} /></span>}
                    <span className="y2-arr-t">
                      <em className={cn('y2-src', `y2-src--${ch.key}`)}>{dir === 'in' ? 'הגעה' : dir === 'out' ? 'יציאה' : 'בקרוב'} · {ch.key === 'direct' ? 'ישיר' : ch.label.replace('.com', '')}</em>
                      <b dir="auto">{guestLabel(b)}</b>
                      <small><bdi>{p?.name}</bdi>{dir === 'soon' ? ` · ${whenOf(b, m.day)}` : ''}</small>
                    </span>
                    <span className="y2-arr-time" dir="ltr">{dir === 'out' ? (p?.check_out_time || '11:00') : dir === 'in' ? (p?.check_in_time || '15:00') : formatDayHe(b.check_in_date, { weekday: false })}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
          </>}
        </aside>

        {noBookings ? null : <BookingsPanel ref={panelRef} model={m} list={list} selId={selId} setSelId={setSelId} onOpen={setSheet} delay={0.45}
          onWhatsApp={(b, t) => setComposer({ booking: b, template: t })} />}
      </motion.div>
      )}

      <ArrivalsSheet open={tileSheet === 'arrivals'} onOpenChange={closeTile} model={m} onOpenBooking={fromTile} />
      <IncomeSheet open={tileSheet === 'income'} onOpenChange={closeTile} model={m} />
      <OccupancySheet open={tileSheet === 'occupancy'} onOpenChange={closeTile} model={m} />
      <PendingSheet open={tileSheet === 'pending'} onOpenChange={closeTile} model={m} onOpenBooking={fromTile}
        onRemind={(b) => { setTileSheet(null); setComposer({ booking: b, template: 'balance_reminder' }); }}
        onRemindAll={(list) => { setTileSheet(null); remindQueue.current = list.slice(1); setComposer({ booking: list[0], template: 'balance_reminder' }); }} />
      <RevenueSheet open={tileSheet === 'revenue'} onOpenChange={closeTile} model={m} />
      <DaySheet open={tileSheet === 'day'} onOpenChange={closeTile} model={m} onDo={(a) => { go(a); }} />
      <BookingSheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} booking={sheet} model={m}
        onWhatsApp={(b, t) => { setSheet(null); setComposer({ booking: b, template: t }); }} />
      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => {
          if (o) return;
          // "תזכורת לכולם": each reminder opens ready in WhatsApp and the owner presses send; then the next one
          const next = sentRef.current ? remindQueue.current.shift() : undefined;
          if (!sentRef.current) remindQueue.current = []; // closed without sending = stop the round
          sentRef.current = false;
          if (next) { setComposer(null); window.setTimeout(() => setComposer({ booking: next, template: 'balance_reminder' }), 220); } else setComposer(null);
        }}
        booking={composer?.booking}
        property={composer ? m.prop(composer.booking.property_id) : null}
        balance={composer && m.moneyKnown ? m.balanceFor(composer.booking) : undefined}
        initialTemplate={composer?.template}
        orgId={orgId}
        orgName={user?.organization_name || ''}
        onSent={(key) => { sentRef.current = true; if (composer) { m.markSent(composer.booking.id, composer.template); m.markSent(composer.booking.id, key); } }}
      />
    </div>
    </MotionConfig>
  );
}
