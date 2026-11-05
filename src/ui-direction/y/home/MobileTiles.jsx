/**
 * Today on the phone · "לוח" (today/wow-v1, 05.11.2026, Deen: "כבר היה עדיף ככה" about the landing mockup).
 * The tile dashboard comes back, polished: a greeting card with what waits, four tiles that each carry a small live
 * picture (ticks, wave, ring, dots: they grow, draw and fill in once), a photo hero for the guest who matters now,
 * then the one next thing to do.
 * A quiet day never shows a dead ₪0 / 0%: each tile swaps to what is true and useful instead — the next arrival as a
 * countdown, the nights booked this week, units free tonight, a booking without a price (the reason money reads 0).
 * V2 "לוח חי" adds: the day as a moving line in the greeting card, the guests as a swipeable photo stack, a prep checklist
 * for the next arrival on a quiet day (what is ready, what is one tap away), and the next thing counting what got done.
 * Nothing invented: every number comes from the account. Reduced motion: no growth/draw, values shown at once.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, ChevronLeft, Send } from 'lucide-react';
import { Num, Ticks, Wave, DotGrid, Ring, FaceStack, useWeek } from '../ui';
import Face from '../Face';
import { money, guestLabel } from '../model';
import { SETUP_DONE, SETUP_STEPS, SetupActions } from './shared';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatDayHe, parseDay, firstName } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf } from '@/lib/stay/bookings';
import { dayPart } from '@/components/app/atoms';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import ImportEntryCard from '@/components/import/EntryCard';
import { MoneyLoadBanner } from '@/components/app/MoneyLoadBanner';
import StaleIndicator from '@/components/app/StaleIndicator';
import { DayLine } from './live';
import './tiles.css';
import './live.css';

const one = (n, s, p) => (n === 1 ? s : p);
const BTN = { message: 'שליחה', clean: 'סימון', lead: 'מענה', balance: 'תזכורת' };
const KICK = { message: 'הודעה מוכנה', clean: 'ניקיון', lead: 'פנייה חדשה', balance: 'תשלום' };
const DAY_L = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);
const priceOf = (b) => Number(b.total_price ?? b.total_amount ?? b.price ?? 0) || 0;

/** a tile: the whole surface is one button (a sheet, a booking or a screen) */
function Tile({ k, label, onClick, to, className, children, i = 0 }) {
  const body = <>{children}</>;
  const cls = cn('tl-tile press', className);
  const style = { '--i': i };
  // the visible text is the name (no aria-label, so what is read matches what is seen); `label` stays as the title for hover
  if (to) return <Link to={to} className={cls} style={style} title={label}>{body}</Link>;
  return <button type="button" className={cls} style={style} onClick={onClick} aria-haspopup={k ? 'dialog' : undefined} title={label}>{body}</button>;
}

function WeekBars({ week }) {
  return (
    <span className="tl-week" aria-hidden>
      {week.map((d, i) => (
        <span key={d.d} className="tl-wd" style={{ '--i': i }}>
          <span className="tl-wb"><i style={{ height: `${Math.max(8, d.occ * 100)}%` }} className={cn(d.occ > 0 && 'on', d.names.length && 'arr')} /></span>
          <small>{DAY_L[parseDay(d.d).getDay()]}</small>
        </span>
      ))}
    </span>
  );
}

function Hello({ m, name, arrivals, departures, quiet, onTile }) {
  const n = m.queue.length;
  const ev = [...departures.map((x) => ({ t: m.prop(x.booking.property_id)?.check_out_time || '11:00', dir: 'out', name: x.booking.guest_name || '' })),
    ...arrivals.map((x) => ({ t: m.prop(x.booking.property_id)?.check_in_time || '15:00', dir: 'in', name: x.booking.guest_name || '' }))];
  return (
    <header className="tl-hello">
      <h1>{dayPart().greeting}{name ? <>, <b>{name}</b></> : null}</h1>
      <p>{formatDayHe(m.day)}{quiet ? ' · יום שקט' : ` · ${arrivals.length} ${one(arrivals.length, 'מגיע', 'מגיעים')}, ${departures.length} ${one(departures.length, 'יוצא', 'יוצאים')}`}
        <StaleIndicator queries={m.data.queries} onRetry={m.retryLoad} className="y-stale-inline" /></p>
      {quiet ? null : <DayLine events={ev} />}
      {n ? (
        <button type="button" className="tl-chip press" aria-haspopup="dialog" onClick={() => onTile('day')}><i aria-hidden />{n === 1 ? 'דבר אחד מחכה לכם' : <><Num value={n} />{'\u00A0'}דברים מחכים לכם</>}</button>
      ) : (
        <span className="tl-chip is-ok"><Check strokeWidth={2.6} aria-hidden />הכל מוכן להיום</span>
      )}
    </header>
  );
}

/** the guest who matters now: arriving today, or (quiet day) the next arrival with a countdown and the one message to prepare */
function Hero({ m, b, today, onOpen, onWhatsApp }) {
  if (!b) return null;
  const p = m.prop(b.property_id); const photo = unitPhoto(p);
  const days = daysBetween(m.day, b.check_in_date);
  const bal = m.moneyKnown ? m.balanceFor(b) : null;
  const sent = m.sentOf(b).has('arrival_eve');
  const who = firstName(b.guest_name || '');
  return (
    <section className={cn('tl-hero', !photo && 'is-plain')} aria-label={today ? 'מגיעים היום' : 'ההגעה הבאה'}>
      {photo ? <img src={photo} alt="" decoding="async" fetchPriority="high" /> : null}
      <span className="tl-hero-shade" aria-hidden />
      <button type="button" className="tl-hero-hit" onClick={() => onOpen(b)} aria-label={`${guestLabel(b)}, פרטי ההזמנה`} />
      <div className="tl-hero-top">
        <span className="tl-hero-t">
          <small>{today ? 'מגיעים היום' : days === 1 ? 'מגיעים מחר' : 'ההגעה הבאה'}</small>
          <b dir="auto">{guestLabel(b)}</b>
          <em><bdi>{p?.name}</bdi></em>
        </span>
        {today || days === 1 ? <Face name={b.guest_name || ''} size={48} ring /> : (
          <span className="tl-count" aria-label={`בעוד ${days} ימים`}><b><Num value={days} delay={300} /></b><small>ימים</small></span>
        )}
      </div>
      <div className="tl-hero-s">
        {today ? (
          <>
            <span><b dir="ltr">{p?.check_in_time || '15:00'}</b><small>כניסה</small></span>
            <span><b dir="ltr">{bal && !bal.unknown && bal.total ? money(bal.total) : '—'}</b><small>{!bal || bal.unknown || !bal.total ? 'בלי מחיר' : bal.balance > 0 ? `יתרה ${money(bal.balance)}` : 'שולם'}</small></span>
          </>
        ) : (
          <span className="lv-when"><b>{formatDayHe(b.check_in_date)}</b><small>כניסה ב-<bdi dir="ltr">{p?.check_in_time || '15:00'}</bdi></small></span>
        )}
      </div>
      {today ? null : (() => {
        const priced = !!priceOf(b);
        const ready = 1 + (sent ? 1 : 0) + (priced ? 1 : 0);
        return (
          <div className="lv-prep">
            <p className="lv-prep-h"><span>מוכנים לקראת{who ? ` ${who}` : ''}</span><b dir="ltr">{ready}/3</b><span className="lv-prep-bar" aria-hidden><i style={{ transform: `scaleX(${ready / 3})` }} /></span></p>
            <ul>
              <li className="is-done"><i aria-hidden><Check strokeWidth={3} /></i><span>ההזמנה ביומן</span></li>
              <li className={cn(sent && 'is-done')}><i aria-hidden>{sent ? <Check strokeWidth={3} /> : null}</i><span>הוראות הגעה לאורח</span>
                {sent ? null : <button type="button" className="lv-act press" onClick={() => onWhatsApp(b, 'arrival_eve')}><Send strokeWidth={2} aria-hidden />הכנה</button>}</li>
              <li className={cn(priced && 'is-done')}><i aria-hidden>{priced ? <Check strokeWidth={3} /> : null}</i><span>{priced ? `מחיר ${money(priceOf(b))}` : 'מחיר להזמנה'}</span>
                {priced ? null : <button type="button" className="lv-act press" onClick={() => onOpen(b)}>הוספה</button>}</li>
            </ul>
          </div>
        );
      })()}
    </section>
  );
}

/** several guests today: a swipeable stack (scroll-snap), the dots say where you are */
function HeroStack({ m, items, today, onOpen, onWhatsApp }) {
  const [at, setAt] = React.useState(0);
  if (!items.length) return null;
  if (items.length === 1) return <Hero m={m} b={items[0]} today={today} onOpen={onOpen} onWhatsApp={onWhatsApp} />;
  const onScroll = (e) => { const el = e.currentTarget; const w = el.firstChild?.getBoundingClientRect().width || 1; setAt(Math.round(Math.abs(el.scrollLeft) / (w + 10))); };
  return (
    <div className="lv-stack">
      <div className="lv-rail" onScroll={onScroll}>
        {items.map((b) => <div key={b.id} className="lv-slide"><Hero m={m} b={b} today={today} onOpen={onOpen} onWhatsApp={onWhatsApp} /></div>)}
      </div>
      <p className="lv-dots" aria-hidden>{items.map((b, i) => <i key={b.id} className={cn(i === at && 'on')} />)}</p>
    </div>
  );
}

function Next({ m, q, onDo, going }) {
  if (!q) return null;
  const photo = q.kind === 'lead' ? null : unitPhoto(m.prop(q.booking?.property_id || q.c?.departure?.property_id));
  return (
    <section className="tl-next" aria-label="הדבר הבא">
      <div className="tl-row-h"><p className="tl-k">הדבר הבא<span className="tl-kind"> · {KICK[q.kind]}</span></p>{m.queue.length > 1 ? <Link to="/messages" className="tl-link">כל המשימות<ChevronLeft strokeWidth={1.75} /></Link> : null}</div>
      {m.doneCount ? (
        <div className="lv-prog" aria-live="polite"><span>בוצעו <b><Num value={m.doneCount} /></b> מתוך {m.total}</span><span className="lv-prog-b" aria-hidden><i style={{ transform: `scaleX(${m.doneCount / Math.max(1, m.total)})` }} /></span></div>
      ) : null}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={q.id} className="tl-next-b" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
          <span className="tl-thumb">{photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : <Face name={q.kind === 'lead' ? q.lead.full_name : (q.booking?.guest_name || '')} size={52} />}</span>
          <span className="tl-next-t"><b>{q.title}</b><small>{q.sub}</small></span>
        </motion.div>
      </AnimatePresence>
      <button type="button" className={cn('tl-btn press', going && 'is-go')} onClick={() => !going && onDo(q)}>
        {going ? <span className="tl-ok"><Check strokeWidth={2.4} />בוצע</span> : <>{BTN[q.kind] || 'ביצוע'}<ArrowLeft strokeWidth={2} /></>}
      </button>
    </section>
  );
}

export default function MobileTiles(props) {
  const { m, name, noUnits, noBookings, onAdd, arrivals, departures, dueCount, onTile, openBooking, onDo, going, onWhatsApp } = props;
  const week = useWeek(m, 7);
  const units = (m.data.properties || []).length;
  const act = (m.data.bookings || []).filter(isActiveBooking);
  const quiet = !arrivals.length && !departures.length;
  const next = act.filter((b) => b.check_in_date > m.day).sort((a, b) => (a.check_in_date < b.check_in_date ? -1 : 1))[0] || null;
  const noPrice = act.filter((b) => checkOutOf(b) >= m.day && !priceOf(b));
  const months = m.money.months || [];
  const mx = Math.max(1, ...months.map((x) => (x.value || 0) + (x.expected || 0)));
  const wave = [...months.map((x) => ((x.value || 0) + (x.expected || 0)) / mx)].reverse();
  const received = m.money.received || 0; const expected = m.money.expected || 0;
  const nights = week.reduce((s, d) => s + d.occN, 0);
  const freeTonight = Math.max(0, units - (week[0]?.occN || 0));
  const hours = Array.from({ length: 13 }, (_, i) => {
    const h = String(8 + i).padStart(2, '0');
    if (arrivals.some((a) => String(m.prop(a.booking.property_id)?.check_in_time || '15:00').startsWith(h))) return 1;
    if (departures.some((a) => String(m.prop(a.booking.property_id)?.check_out_time || '11:00').startsWith(h))) return 0.7;
    return 0.16;
  });
  const nowH = new Date().getHours() - 8;
  const soon = act.filter((b) => b.check_in_date > m.day && daysBetween(m.day, b.check_in_date) <= 30);

  if (noUnits) return <div className="tl"><Hello m={m} name={name} arrivals={[]} departures={[]} quiet onTile={onTile} /><ImportEntryCard where="today" className="y-first-unit-import" /></div>;

  const slot2Week = m.moneyKnown && !received && !expected;
  return (
    <div className="tl">
      <Hello m={m} name={name} arrivals={arrivals} departures={departures} quiet={quiet} onTile={onTile} />
      {m.paymentsState === 'error' ? <MoneyLoadBanner onRetry={m.retryLoad} /> : null}
      {noBookings ? (
        <section className="tl-next" aria-label="הדבר הבא">
          <p className="tl-k">הדבר הבא</p>
          <p className="tl-h">{SETUP_STEPS[SETUP_DONE]?.t}</p>
          <p className="tl-sub">ההזמנות שלהם ייכנסו ליומן לבד.</p>
          <SetupActions onAdd={onAdd} compact />
        </section>
      ) : (
        <>
          <section className="tl-tiles" aria-label="היום במספרים">
            {/* 1 · today's arrivals, or the next arrival as a countdown */}
            {!quiet ? (
              <Tile k i={0} label={`מגיעים היום: ${arrivals.length}, יוצאים ${departures.length}. פירוט`} onClick={() => onTile('arrivals')}>
                <span className="tl-tk">מגיעים היום<FaceStack names={arrivals.map((a) => a.booking.guest_name || '').filter((x) => x.trim())} size={24} max={3} /></span>
                <span className="tl-viz tl-ticks"><Ticks values={hours} hot={hours.indexOf(1)} height={46} />{nowH >= 0 && nowH < 13 ? <i className="tl-now" style={{ insetInlineStart: `${((nowH + 0.5) / 13) * 100}%` }} /> : null}</span>
                <span className="tl-tn"><Num value={arrivals.length} /><span>{one(arrivals.length, 'הגעה', 'הגעות')} · {departures.length} {one(departures.length, 'יציאה', 'יציאות')}</span></span>
              </Tile>
            ) : next ? (
              /* quiet day: the hero below already counts down to the next guest, so this tile says how many are coming */
              <Tile i={0} label={`${soon.length} הזמנות ב-30 הימים הבאים. לכל ההזמנות`} to="/bookings" className="is-ind">
                <span className="tl-tk">בקרוב<FaceStack names={soon.map((x) => x.guest_name || '').filter((x) => x.trim())} size={24} max={3} /></span>
                <span className="tl-viz tl-empty">ב-30 הימים הבאים</span>
                <span className="tl-tn"><Num value={soon.length} delay={120} /><span>{one(soon.length, 'הגעה', 'הגעות')}</span></span>
              </Tile>
            ) : (
              <Tile i={0} label="אין הגעות קרובות. הוספת הזמנה" onClick={onAdd}>
                <span className="tl-tk">ההגעה הבאה</span>
                <span className="tl-viz tl-empty">עוד אין הגעות קרובות</span>
                <span className="tl-tn"><span className="tl-word tl-word--s">הוספת הזמנה</span></span>
              </Tile>
            )}

            {/* 2 · money: what came in, else what is expected, else the week */}
            {!slot2Week ? (
              <Tile k i={1} label={`${received ? 'נכנס' : 'צפוי'} ב${m.money.month}: ${money(received || expected)}. פירוט`} onClick={() => onTile('income')}>
                <span className="tl-tk">{received || !m.moneyKnown ? 'נכנס' : 'צפוי'} ב{m.money.month}</span>
                <span className="tl-viz"><Wave values={wave} h={46} /></span>
                <span className="tl-tn"><Num value={m.moneyKnown ? (received || expected) : null} pre="₪" delay={80} /></span>
              </Tile>
            ) : (
              <Tile i={1} label={`השבוע: ${nights} מתוך ${7 * Math.max(1, units)} לילות תפוסים. ליומן`} to={createPageUrl('MultiCalendar')}>
                <span className="tl-tk">השבוע</span>
                <span className="tl-viz"><WeekBars week={week} /></span>
                <span className="tl-tn"><Num value={nights} delay={80} /><span>מתוך {7 * Math.max(1, units)} לילות</span></span>
              </Tile>
            )}

            {/* 3 · occupancy, else units free tonight */}
            {m.moneyKnown && m.money.occupancy > 0 ? (
              <Tile k i={2} label={`תפוסה ב${m.money.month}: ${m.money.occupancy}%. פירוט`} onClick={() => onTile('occupancy')} className="tl-tile--ring">
                <span className="tl-tk">תפוסה ב{m.money.month}</span>
                <Ring value={m.money.occupancy / 100} size={80} stroke={8} className="tl-viz tl-ring"><Num value={m.money.occupancy} post="%" delay={160} className="tl-ring-n" /></Ring>
                <span className="tl-tn tl-tn--c"><span>{units} {one(units, 'יחידה', 'יחידות')}</span></span>
              </Tile>
            ) : (
              <Tile i={2} label={`פנויות הלילה: ${freeTonight} מתוך ${units}. ליומן`} to={createPageUrl('MultiCalendar')} className="tl-tile--ring">
                <span className="tl-tk">פנוי הלילה</span>
                <Ring value={units ? freeTonight / units : 0} size={80} stroke={8} color="#1B2656" className="tl-viz tl-ring"><Num value={freeTonight} delay={160} className="tl-ring-n" /></Ring>
                <span className="tl-tn tl-tn--c"><span>מתוך {units} {one(units, 'יחידה', 'יחידות')}</span></span>
              </Tile>
            )}

            {/* 4 · waiting for payment, else a booking without a price (why money reads 0), else all paid */}
            {m.moneyKnown && m.pendingTotal > 0 ? (
              <Tile k i={3} label={`ממתינים לתשלום: ${money(m.pendingTotal)} מ-${dueCount} הזמנות. פירוט`} onClick={() => onTile('pending')}>
                <span className="tl-tk">ממתינים לתשלום<i className="tl-amber" aria-hidden /></span>
                <DotGrid total={20} on={Math.min(20, Math.round((received / Math.max(1, expected)) * 20))} cols={10} className="tl-viz tl-dots" />
                <span className="tl-tn"><Num value={m.pendingTotal} pre="₪" delay={240} /><span>{dueCount} {one(dueCount, 'הזמנה', 'הזמנות')}</span></span>
              </Tile>
            ) : noPrice.length ? (
              <Tile i={3} label={`${noPrice.length} הזמנות בלי מחיר. הוספת מחיר`} onClick={() => openBooking(noPrice[0])} className="is-nudge">
                <span className="tl-tk">בלי מחיר</span>
                <span className="tl-viz tl-empty">הוסיפו מחיר, ונראה כמה ייכנס ומה מחכה לתשלום</span>
                <span className="tl-tn"><Num value={noPrice.length} delay={240} /><span>{one(noPrice.length, 'הזמנה', 'הזמנות')} · הוספה</span></span>
              </Tile>
            ) : (
              <Tile k i={3} label="אין יתרות פתוחות. פירוט" onClick={() => onTile('pending')}>
                <span className="tl-tk">תשלומים</span>
                <span className="tl-viz tl-okc"><Check strokeWidth={2.4} aria-hidden /></span>
                <span className="tl-tn"><span className="tl-word tl-word--s">אין יתרות פתוחות</span></span>
              </Tile>
            )}
          </section>

          <HeroStack m={m} items={arrivals.length ? arrivals.map((a) => a.booking) : (next ? [next] : [])} today={!!arrivals.length} onOpen={openBooking} onWhatsApp={onWhatsApp} />
          <Next m={m} q={m.queue[0]} onDo={onDo} going={going} />
        </>
      )}
    </div>
  );
}
