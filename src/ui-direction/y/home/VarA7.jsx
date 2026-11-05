/**
 * Today · A7 "המתחם" (05.11.2026, Deen: more original options, keep the hills + milky glass).
 * The complex itself is the main visual: every unit is a glass room card with its photo, tonight's status
 * (arriving 15:00 / leaving 11:00 / changeover / occupied until / free tonight), the guest's face, and the next
 * 14 nights as a quiet strip. One sentence above says how full tonight is; the month's money is a quiet row below.
 * Empty account: the same rooms, all free and waiting, with the setup steps and the two actions on top.
 * Palette: navy #1B2656, indigo #3E2BF1, white glass, one amber dot.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SETUP_DONE, SETUP_STEPS, SetupActions } from './shared';
import Face from '../Face';
import { money, guestLabel } from '../model';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatDayHe, parseDay } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf } from '@/lib/stay/bookings';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft } from 'lucide-react';
import './var-a7.css';

export const HOME_VAR = 'a7';
export const HIDE_PHOTO = true;
export const HIDE_TILES = true;
export const HIDE_CHART = true;

const NIGHTS = 14;
const MAX = 6;
const one = (n, s, p) => (n === 1 ? s : p);
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function useRooms(m) {
  return useMemo(() => {
    const day = m.day; const base = parseDay(day);
    const nights = Array.from({ length: NIGHTS }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i); return isoOf(d); });
    const act = (m.data.bookings || []).filter(isActiveBooking);
    return (m.data.properties || []).map((p) => {
      const mine = act.filter((b) => b.property_id === p.id);
      const arr = mine.find((b) => b.check_in_date === day);
      const dep = mine.find((b) => checkOutOf(b) === day);
      const stay = mine.find((b) => b.check_in_date < day && checkOutOf(b) > day);
      const next = mine.filter((b) => b.check_in_date > day).sort((a, b) => (a.check_in_date < b.check_in_date ? -1 : 1))[0];
      const strip = nights.map((k) => mine.some((b) => b.check_in_date <= k && checkOutOf(b) > k));
      let st; let b = null;
      if (arr && dep) { st = 'swap'; b = arr; } else if (arr) { st = 'in'; b = arr; } else if (stay) { st = 'stay'; b = stay; } else if (dep) { st = 'out'; b = dep; } else { st = 'free'; b = next || null; }
      return { p, st, b, arr, dep, next, strip, tonight: !!(arr || stay) };
    });
  }, [m.day, m.data.bookings, m.data.properties]);
}

function Status({ r }) {
  const ci = r.p.check_in_time || '15:00'; const co = r.p.check_out_time || '11:00';
  if (r.st === 'swap') return <em className="hv7-st is-in">החלפה · <span dir="ltr">{co}</span> → <span dir="ltr">{ci}</span></em>;
  if (r.st === 'in') return <em className="hv7-st is-in">מגיעים <span dir="ltr">{ci}</span></em>;
  if (r.st === 'out') return <em className="hv7-st is-out">יוצאים <span dir="ltr">{co}</span></em>;
  if (r.st === 'stay') return <em className="hv7-st is-stay">תפוס עד {formatDayHe(checkOutOf(r.b), { weekday: false })}</em>;
  return <em className="hv7-st is-free">פנוי הלילה</em>;
}

function Room({ r, onOpen, empty }) {
  const photo = unitPhoto(r.p);
  const who = r.st === 'free' ? null : r.b;
  const inner = (
    <>
      <span className={cn('hv7-ph', !photo && 'is-none')}>
        {photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : <b aria-hidden>{(r.p.name || '').replace(/^ה/, '').slice(0, 1)}</b>}
        <Status r={r} />
      </span>
      <span className="hv7-body">
        <span className="hv7-nm"><b dir="auto">{r.p.name}</b>{who ? <Face name={who.guest_name || ''} size={30} ring /> : null}</span>
        <small className="hv7-who">
          {empty ? 'מחכה להזמנה הראשונה'
            : who ? <><bdi>{guestLabel(who)}</bdi>{r.st === 'out' && r.next ? ` · הבא ${formatDayHe(r.next.check_in_date, { weekday: false })}` : ''}</>
            : r.next ? <>הבא: <bdi>{guestLabel(r.next)}</bdi> · {formatDayHe(r.next.check_in_date, { weekday: false })}</> : 'אין הזמנות קרובות'}
        </small>
        <span className="hv7-strip" aria-label={`${r.strip.filter(Boolean).length} מתוך ${NIGHTS} הלילות הקרובים תפוסים`}>
          {r.strip.map((on, i) => <i key={i} className={cn(on && 'on', i === 0 && 'now')} />)}
        </span>
      </span>
    </>
  );
  const b = r.st === 'free' ? r.next : r.b;
  return b && !empty
    ? <button type="button" className={cn('hv7-room press', `is-${r.st}`)} onClick={() => onOpen(b)}>{inner}</button>
    : <Link to={createPageUrl('MultiCalendar')} className={cn('hv7-room press', `is-${r.st}`, empty && 'is-empty')}>{inner}</Link>;
}

export default function HomeTop({ m, noBookings, onAdd, dueCount = 0, onTile, openBooking }) {
  const rooms = useRooms(m);
  const total = rooms.length; const full = rooms.filter((r) => r.tonight).length;
  const shown = rooms.slice(0, MAX);
  const grid = (
    <div className={cn('hv7-grid', `n-${Math.min(shown.length, 4)}`)}>
      {shown.map((r) => <Room key={r.p.id} r={r} onOpen={openBooking} empty={noBookings} />)}
    </div>
  );
  if (noBookings) {
    return (
      <section className="hv7 is-empty" aria-labelledby="hv7-h">
        <div className="hv7-head">
          <div>
            <p className="hv7-k">המתחם</p>
            <h2 id="hv7-h" className="hv7-t"><span className="hv7-n">{total}</span> {one(total, 'יחידה מוכנה', 'יחידות מוכנות')}, כולן פנויות. נמלא אותן.</h2>
          </div>
          <SetupActions onAdd={onAdd} compact />
        </div>
        <ol className="hv7-steps" aria-label="צעדי ההגדרה">
          {SETUP_STEPS.map((s, i) => (
            <li key={s.key} className={cn(s.done && 'is-done', !s.done && i === SETUP_DONE && 'is-next')}>
              <i aria-hidden>{s.done ? <Check strokeWidth={3} /> : i + 1}</i>{s.short}{s.done ? <span className="sr-only"> (בוצע)</span> : null}
            </li>
          ))}
        </ol>
        {grid}
      </section>
    );
  }
  return (
    <section className="hv7" aria-labelledby="hv7-h">
      <div className="hv7-head">
        <div>
          <p className="hv7-k">המתחם הלילה</p>
          <h2 id="hv7-h" className="hv7-t">
            <button type="button" className="hv7-n" onClick={() => onTile('occupancy')} aria-haspopup="dialog">{full}</button> מתוך {total} {one(total, 'יחידה', 'יחידות')} {one(full, 'תפוסה', 'תפוסות')} הלילה
          </h2>
        </div>
        <span className="hv7-meter" aria-hidden>{rooms.map((r) => <i key={r.p.id} className={cn(r.tonight && 'on')} />)}</span>
      </div>
      {grid}
      {total > MAX ? <Link to={createPageUrl('MultiCalendar')} className="hv7-more press">כל {total} היחידות ביומן<ChevronLeft strokeWidth={1.75} /></Link> : null}
      <div className="hv7-money">
        <button type="button" className="hv7-mi press" onClick={() => onTile('income')} aria-haspopup="dialog"><span>נכנסו ב{m.money.month}</span><b dir="ltr">{money(m.money.received)}</b></button>
        <button type="button" className="hv7-mi press" onClick={() => onTile('pending')} aria-haspopup="dialog"><span>מחכים לתשלום{dueCount ? ` · ${dueCount}` : ''}{m.pendingTotal > 0 ? <i className="hv7-amber" aria-hidden /> : null}</span><b dir="ltr" className="is-ind">{money(m.pendingTotal)}</b></button>
        <button type="button" className="hv7-mi press" onClick={() => onTile('occupancy')} aria-haspopup="dialog"><span>תפוסה ב{m.money.month}</span><b dir="ltr">{m.money.occupancy}%</b></button>
      </div>
    </section>
  );
}
