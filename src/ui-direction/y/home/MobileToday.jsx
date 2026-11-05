/**
 * Today on the phone (<1024px) · "שקט" (M2, picked 05.11.2026): greeting, the day's sentence, ONE next thing,
 * today's arrivals/departures as plain rows, money as a quiet row. Empty account: the sentence + the next setup step.
 * Rules: one column, 16/24px rhythm, one card style (white glass, 24px radius, one shadow), one accent (indigo #3E2BF1),
 * no number said twice, no decorative graphs, nothing touching the screen edge.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronLeft } from 'lucide-react';
import { SETUP_DONE, SETUP_STEPS, SetupActions } from './shared';
import Face from '../Face';
import { FaceStack } from '../ui';
import { money, guestLabel } from '../model';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatDayHe } from '@/lib/stay/format';
import { isActiveBooking } from '@/lib/stay/bookings';
import { dayPart } from '@/components/app/atoms';
import { cn } from '@/lib/utils';
import ImportEntryCard from '@/components/import/EntryCard';
import { MoneyLoadBanner } from '@/components/app/MoneyLoadBanner';
import StaleIndicator from '@/components/app/StaleIndicator';
import './mobile.css';

const one = (n, s, p) => (n === 1 ? s : p);
const BTN = { message: 'שליחה', clean: 'סימון', lead: 'מענה', balance: 'תזכורת' };
const KICK = { message: 'הודעה מוכנה', clean: 'ניקיון', lead: 'פנייה חדשה', balance: 'תשלום' };

/** a tappable number inside the sentence; a 1–2 digit number gets a full 44×44 target (is-short), its side margins
 *  eat the nbsp around it so the sentence keeps its rhythm */
function N({ children, onClick, label }) {
  return <button type="button" className={cn('hm-n', String(children).length <= 2 && 'is-short')} onClick={onClick} aria-haspopup="dialog" aria-label={label}>{children}</button>;
}

const NB = '\u00A0';

/** the day in one sentence, then the open tasks. Every number is glued to its word (nbsp + nowrap), so a number never
 *  ends a line on its own (it did at 390: "9" alone at the line end). */
function Sentence({ arrivals, departures, onTile, tasks = 0 }) {
  const a = arrivals.length; const d = departures.length;
  return (
    <p className="hm-s">
      {a || d ? (
        <>
          <span className="hm-nw">היום{NB}<N onClick={() => onTile('arrivals')} label={`מגיעים היום: ${a}. פירוט`}>{a}</N>
            {a ? <FaceStack names={arrivals.map((x) => x.booking.guest_name || '')} size={24} max={3} className="hm-faces" /> : null}
            {NB}{one(a, 'הגעה', 'הגעות')}</span>{' '}
          <span className="hm-nw">ו־<N onClick={() => onTile('arrivals')} label={`יוצאים היום: ${d}. פירוט`}>{d}</N>{NB}{one(d, 'יציאה', 'יציאות')}.</span>
        </>
      ) : <>היום אין הגעות ויציאות.</>}
      {' '}
      {tasks ? <><span className="hm-nw"><N onClick={() => onTile('day')} label={`${tasks} משימות להיום. פירוט`}>{tasks}</N>{NB}{one(tasks, 'משימה', 'משימות')}</span> {one(tasks, 'מחכה', 'מחכות')} לכם.</> : 'אין משימות פתוחות.'}
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
      <div className="hm-row-h"><p className="hm-k">הדבר הבא{KICK[q.kind] ? <span className="hm-kind"> · {KICK[q.kind]}</span> : null}</p>{m.queue.length > 1 ? <Link to="/messages" className="hm-link">כל המשימות<ChevronLeft strokeWidth={1.75} /></Link> : null}</div>
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

/** today's arrivals and departures as plain rows (no badges); when today is empty, the next arrivals */
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

export default function MobileToday(props) {
  const { m, name, noUnits, noBookings, onAdd, arrivals, departures, dueCount, onTile, openBooking, onDo, going } = props;
  const units = (m?.data?.properties || []).length;
  const q = m.queue[0];
  return (
    <div className={cn('hm', noBookings && 'is-empty')}>
      <Hello m={m} name={name} />
      {m.paymentsState === 'error' ? <MoneyLoadBanner onRetry={m.retryLoad} /> : null}
      {noUnits ? <ImportEntryCard where="today" className="y-first-unit-import" /> : null}
      {noUnits ? null : noBookings ? (
        <>
          <section className="hm-card hm-lead" aria-label="היום">
            <p className="hm-s">יש לכם <span className="hm-nw"><span className="hm-n is-static">{units}</span>{NB}{one(units, 'יחידה מוכנה', 'יחידות מוכנות')}</span>. מההזמנה הראשונה, כאן תקראו כל בוקר מי מגיע, כמה נכנס ומה מחכה לתשלום.</p>
          </section>
          <Next m={m} empty onAdd={onAdd} />
        </>
      ) : (
        <>
          <section className="hm-card hm-lead" aria-label="היום">
            <Sentence arrivals={arrivals} departures={departures} onTile={onTile} tasks={m.queue.length} />
          </section>
          <Next m={m} q={q} onDo={onDo} going={going} />
          <TodayList m={m} arrivals={arrivals} departures={departures} openBooking={openBooking} />
          <MoneyRow m={m} dueCount={dueCount} onTile={onTile} />
        </>
      )}
    </div>
  );
}
