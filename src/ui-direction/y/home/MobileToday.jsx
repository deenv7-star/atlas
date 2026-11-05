/**
 * Today on the phone (<1024px) · home/var-combo (05.11.2026, Deen: "not clean and orderly" on every phone version; A7 dropped).
 * Two calm, single-column versions behind one flag (VITE_HOME_MOBILE=m1|m2, or ?m=m1|m2 on the URL for review):
 *  M1 "המספר של החודש": the day's sentence on top, the month's income large, a navy 2×2 of what the sentence does not say,
 *     the arriving guest, the next thing to do.
 *  M2 "שקט": greeting, the day's sentence, ONE next thing, today's arrivals/departures as plain rows, money as a quiet row.
 * Rules: one column, 16/24px rhythm, one card style (white glass, 24px radius, one shadow), one accent (indigo #3E2BF1),
 * no number said twice, no decorative graphs, nothing touching the screen edge.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronLeft } from 'lucide-react';
import { SETUP_DONE, SETUP_STEPS, SetupActions } from './shared';
import Face from '../Face';
import { FaceStack, whenOf } from '../ui';
import { money, guestLabel } from '../model';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatDayHe } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf } from '@/lib/stay/bookings';
import { dayPart } from '@/components/app/atoms';
import { cn } from '@/lib/utils';
import ImportEntryCard from '@/components/import/EntryCard';
import { MoneyLoadBanner } from '@/components/app/MoneyLoadBanner';
import StaleIndicator from '@/components/app/StaleIndicator';
import './mobile.css';

const one = (n, s, p) => (n === 1 ? s : p);
const BTN = { message: 'שליחה', clean: 'סימון', lead: 'מענה', balance: 'תזכורת' };
const KICK = { message: 'הודעה מוכנה', clean: 'ניקיון', lead: 'פנייה חדשה', balance: 'תשלום' };

export function mobileVariant() {
  try {
    const q = new URLSearchParams(window.location.search).get('m');
    if (q === 'm1' || q === 'm2') { window.sessionStorage.setItem('atlas_home_m', q); return q; }
    const s = window.sessionStorage.getItem('atlas_home_m');
    if (s === 'm1' || s === 'm2') return s;
  } catch { /* private mode */ }
  return import.meta.env.VITE_HOME_MOBILE === 'm2' ? 'm2' : 'm1';
}

function N({ children, onClick, label }) {
  return <button type="button" className="hm-n" onClick={onClick} aria-haspopup="dialog" aria-label={label}>{children}</button>;
}

/** the day in one sentence; withMoney adds what waits for payment and the month's occupancy (M1); M2 says the tasks instead */
function Sentence({ m, arrivals, departures, dueCount, onTile, withMoney, tasks = 0 }) {
  const a = arrivals.length; const d = departures.length;
  const day = a || d ? (
    <>
      היום <N onClick={() => onTile('arrivals')} label={`מגיעים היום: ${a}. פירוט`}>{a}</N>
      {a ? <FaceStack names={arrivals.map((x) => x.booking.guest_name || '')} size={24} max={3} className="hm-faces" /> : null}
      {' '}{one(a, 'הגעה', 'הגעות')} ו־<N onClick={() => onTile('arrivals')} label={`יוצאים היום: ${d}. פירוט`}>{d}</N> {one(d, 'יציאה', 'יציאות')}.
    </>
  ) : <>היום אין הגעות ויציאות.</>;
  if (!withMoney) {
    return (
      <p className="hm-s">{day}{' '}
        {tasks ? <><N onClick={() => onTile('day')} label={`${tasks} משימות להיום. פירוט`}>{tasks}</N> {one(tasks, 'משימה מחכה', 'משימות מחכות')} לכם.</> : 'אין משימות פתוחות.'}
      </p>
    );
  }
  return (
    <p className="hm-s">{day}{' '}
      {!m.moneyKnown ? null : m.pendingTotal > 0 ? (
        <><span className="hm-nw">עוד <N onClick={() => onTile('pending')} label={`ממתינים לתשלום: ${money(m.pendingTotal)}. פירוט`}>{money(m.pendingTotal)}</N></span> מחכים לתשלום{dueCount ? ` מ־${dueCount} ${one(dueCount, 'הזמנה', 'הזמנות')}` : ''}, </>
      ) : <>אין תשלומים פתוחים, </>}
      {m.moneyKnown ? <span className="hm-nw">והתפוסה החודש <N onClick={() => onTile('occupancy')} label={`תפוסה ב${m.money.month}: ${m.money.occupancy}%. פירוט`}>{m.money.occupancy}%</N>.</span> : null}
    </p>
  );
}

function Hello({ m, name }) {
  return (
    <header className="hm-hello">
      <h1>{dayPart().greeting}{name ? <>, <b>{name}</b></> : null}</h1>
      <p>{formatDayHe(m.day)}<StaleIndicator queries={m.data.queries} onRetry={m.retryLoad} className="y-stale-inline" /></p>
    </header>
  );
}

/** the one next thing to do; empty account: the next setup step */
function Next({ m, q, onDo, going, empty, onAdd }) {
  if (empty) {
    const nx = SETUP_STEPS[SETUP_DONE];
    return (
      <section className="hm-card hm-next" aria-label="הדבר הבא">
        <p className="hm-k">הדבר הבא</p>
        <p className="hm-h">{nx?.t}</p>
        <p className="hm-sub">ההזמנות שלהם ייכנסו ליומן לבד.</p>
        <SetupActions onAdd={onAdd} compact />
      </section>
    );
  }
  if (!q) return null;
  const photo = q.kind === 'lead' ? null : unitPhoto(m.prop(q.booking?.property_id || q.c?.departure?.property_id));
  return (
    <section className="hm-card hm-next" aria-label="הדבר הבא">
      <div className="hm-row-h"><p className="hm-k">הדבר הבא · {KICK[q.kind] || ''}</p>{m.queue.length > 1 ? <Link to="/messages" className="hm-link">כל המשימות<ChevronLeft strokeWidth={1.75} /></Link> : null}</div>
      <div className="hm-next-b">
        <span className="hm-thumb">{photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : <Face name={q.kind === 'lead' ? q.lead.full_name : (q.booking?.guest_name || '')} size={56} />}</span>
        <span className="hm-next-t"><b>{q.title}</b><small>{q.sub}</small></span>
      </div>
      <button type="button" className={cn('hm-btn press', going === q.id && 'is-go')} onClick={() => onDo(q)}>
        {going === q.id ? <><Check strokeWidth={2.2} />{q.doneText}</> : <>{BTN[q.kind] || 'ביצוע'}<ArrowLeft strokeWidth={2} /></>}
      </button>
    </section>
  );
}

function Guest({ m, hero, heroUnit, heroBal, openBooking }) {
  if (!hero) return null;
  const photo = unitPhoto(heroUnit);
  return (
    <button type="button" className="hm-card hm-guest press" onClick={() => openBooking(hero)}>
      <span className="hm-thumb is-lg">{photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : null}<span className="hm-thumb-face"><Face name={hero.guest_name || ''} size={30} ring /></span></span>
      <span className="hm-guest-t">
        <small className="hm-k">{whenOf(hero, m.day)}</small>
        <b dir="auto">{guestLabel(hero)}</b>
        <small><bdi>{heroUnit?.name}</bdi> · כניסה <span dir="ltr">{heroUnit?.check_in_time || '15:00'}</span>
          {heroBal && !heroBal.unknown ? (heroBal.balance > 0 ? <> · יתרה <span dir="ltr">{money(heroBal.balance)}</span></> : ' · שולם') : ''}</small>
      </span>
      <ChevronLeft strokeWidth={1.75} className="hm-chev" aria-hidden />
    </button>
  );
}

/** M2: today's arrivals and departures as plain rows (no badges); when today is empty, the next arrivals */
function TodayList({ m, arrivals, departures, openBooking }) {
  const rows = [...departures.map((x) => ({ b: x.booking, dir: 'out' })), ...arrivals.map((x) => ({ b: x.booking, dir: 'in' }))];
  const soon = rows.length ? [] : (m.data.bookings || []).filter(isActiveBooking).filter((b) => b.check_in_date > m.day)
    .sort((a, b) => (a.check_in_date < b.check_in_date ? -1 : 1)).slice(0, 3).map((b) => ({ b, dir: 'soon' }));
  const all = (rows.length ? rows : soon).slice(0, 4);
  if (!all.length) return null;
  return (
    <section className="hm-card hm-list" aria-labelledby="hm-list-h">
      <div className="hm-row-h"><h2 id="hm-list-h" className="hm-k">{rows.length ? 'היום' : 'בקרוב'}</h2><Link to="/bookings" className="hm-link">כל ההזמנות<ChevronLeft strokeWidth={1.75} /></Link></div>
      <ul>
        {all.map(({ b, dir }) => {
          const p = m.prop(b.property_id);
          const t = dir === 'out' ? (p?.check_out_time || '11:00') : dir === 'in' ? (p?.check_in_time || '15:00') : formatDayHe(b.check_in_date, { weekday: false });
          return (
            <li key={`${dir}-${b.id}`}>
              <button type="button" className="hm-li press" onClick={() => openBooking(b)}>
                <Face name={b.guest_name || ''} size={40} />
                <span className="hm-li-t"><b dir="auto">{guestLabel(b)}</b><small>{dir === 'in' ? 'הגעה' : dir === 'out' ? 'יציאה' : 'הגעה'} · <bdi>{p?.name}</bdi></small></span>
                <span className="hm-li-time" dir="ltr">{t}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MoneyRow({ m, dueCount, onTile }) {
  const v = (x) => (m.moneyKnown ? money(x) : '—');
  return (
    <section className="hm-card hm-money" aria-label="כסף החודש">
      <button type="button" className="hm-mi press" onClick={() => onTile('income')} aria-haspopup="dialog"><span>נכנסו ב{m.money.month}</span><b dir="ltr">{v(m.money.received)}</b></button>
      <button type="button" className="hm-mi press" onClick={() => onTile('pending')} aria-haspopup="dialog"><span>מחכים{dueCount ? ` · ${dueCount}` : ''}</span><b dir="ltr">{v(m.pendingTotal)}</b></button>
      <button type="button" className="hm-mi press" onClick={() => onTile('occupancy')} aria-haspopup="dialog"><span>תפוסה</span><b dir="ltr">{m.moneyKnown ? `${m.money.occupancy}%` : '—'}</b></button>
    </section>
  );
}

/** M1's navy 2×2: only what the sentence and the big number do not already say */
function Quad({ m, onTile }) {
  const months = m.money.months || [];
  const prev = months[months.length - 2];
  const wk = (() => {
    const d = new Date(`${m.day}T12:00:00`); d.setDate(d.getDate() + 7);
    const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return (m.data.bookings || []).filter(isActiveBooking).filter((b) => b.check_in_date > m.day && b.check_in_date <= end).length;
  })();
  const ym = m.day.slice(0, 7);
  const inMonth = (m.data.bookings || []).filter(isActiveBooking).filter((b) => String(b.check_in_date).slice(0, 7) === ym).length;
  const inHouse = (m.data.bookings || []).filter(isActiveBooking).filter((b) => b.check_in_date <= m.day && checkOutOf(b) > m.day).length;
  const v = (x) => (m.moneyKnown ? money(x) : '—');
  const cells = [
    { k: 'count', l: `הזמנות ב${m.money.month}`, n: String(inMonth), t: 'arrivals' },
    { k: 'prev', l: prev?.label ? `ב${prev.label}` : 'בחודש הקודם', n: v(prev ? (prev.value || 0) + (prev.expected || 0) : 0), t: 'revenue' },
    { k: 'house', l: 'שוהים הלילה', n: String(inHouse), t: 'occupancy' },
    { k: 'week', l: 'מגיעים השבוע', n: String(wk), t: 'arrivals' },
  ];
  return (
    <div className="hm-quad">
      {cells.map((c) => (
        <button key={c.k} type="button" className="hm-q press" onClick={() => onTile(c.t)} aria-haspopup="dialog"><span>{c.l}</span><b dir="ltr">{c.n}</b></button>
      ))}
    </div>
  );
}

export default function MobileToday(props) {
  const { variant, m, name, noUnits, noBookings, onAdd, arrivals, departures, dueCount, onTile, hero, heroUnit, heroBal, openBooking, onDo, going } = props;
  const units = (m?.data?.properties || []).length;
  const q = m.queue[0];
  return (
    <div className={cn('hm', `hm-${variant}`, noBookings && 'is-empty')}>
      <Hello m={m} name={name} />
      {m.paymentsState === 'error' ? <MoneyLoadBanner onRetry={m.retryLoad} /> : null}
      {noUnits ? <ImportEntryCard where="today" className="y-first-unit-import" /> : null}
      {noUnits ? null : noBookings ? (
        <>
          <section className="hm-card hm-lead" aria-label="היום">
            <p className="hm-s">יש לכם <span className="hm-n is-static">{units}</span> {one(units, 'יחידה מוכנה', 'יחידות מוכנות')}. מההזמנה הראשונה, כאן תקראו כל בוקר מי מגיע, כמה נכנס ומה מחכה לתשלום.</p>
            {variant === 'm1' ? (
              <ol className="hm-steps" aria-label="צעדי ההגדרה">
                {SETUP_STEPS.map((s, i) => (
                  <li key={s.key} className={cn(s.done && 'is-done', !s.done && i === SETUP_DONE && 'is-next')}>
                    <i aria-hidden>{s.done ? <Check strokeWidth={3} /> : i + 1}</i><span>{s.t}</span>{s.done ? <span className="sr-only"> (בוצע)</span> : null}
                  </li>
                ))}
              </ol>
            ) : null}
            {variant === 'm1' ? <SetupActions onAdd={onAdd} compact /> : null}
          </section>
          {variant === 'm2' ? <Next m={m} empty onAdd={onAdd} /> : null}
        </>
      ) : variant === 'm1' ? (
        <>
          <section className="hm-card hm-lead" aria-label="היום והחודש">
            <Sentence m={m} arrivals={arrivals} departures={departures} dueCount={dueCount} onTile={onTile} withMoney />
            <button type="button" className="hm-big press" onClick={() => onTile('income')} aria-haspopup="dialog">
              <span className="hm-k">נכנסו ב{m.money.month}</span>
              <b dir="ltr">{m.moneyKnown ? money(m.money.received) : '—'}</b>
            </button>
            <Quad m={m} onTile={onTile} />
          </section>
          <Guest m={m} hero={hero} heroUnit={heroUnit} heroBal={heroBal} openBooking={openBooking} />
          <Next m={m} q={q} onDo={onDo} going={going} />
        </>
      ) : (
        <>
          <section className="hm-card hm-lead" aria-label="היום">
            <Sentence m={m} arrivals={arrivals} departures={departures} dueCount={dueCount} onTile={onTile} tasks={m.queue.length} />
          </section>
          <Next m={m} q={q} onDo={onDo} going={going} />
          <TodayList m={m} arrivals={arrivals} departures={departures} openBooking={openBooking} />
          <MoneyRow m={m} dueCount={dueCount} onTile={onTile} />
        </>
      )}
    </div>
  );
}
