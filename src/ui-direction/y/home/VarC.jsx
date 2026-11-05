/**
 * Today · variation C "כרטיס אחד בנייבי": one navy hero on top. Empty account: the next setup step.
 * With bookings: who arrives next, check-in time, total and balance. Below it the tiles; the bookings list and
 * the calendar turn white so this hero is the only navy surface on the screen.
 */
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { moneyNum, guestLabel } from '../model';
import { whenOf } from '../ui';
import Face from '../Face';
import { SETUP_DONE, SETUP_TOTAL, SETUP_STEPS, SetupActions } from './shared';
import { cn } from '@/lib/utils';
import './var-c.css';

export const HOME_VAR = 'c';
export const HIDE_PHOTO = true;

export default function HomeTop({ m, noBookings, onAdd, hero, heroUnit, heroBal, openBooking }) {
  if (noBookings) {
    return (
      <section className="hvc-hero" aria-labelledby="hvc-h">
        <p className="hvc-k">הצעד הבא · {SETUP_DONE} מתוך {SETUP_TOTAL}</p>
        <h2 id="hvc-h">הוסיפו את ההזמנה הראשונה</h2>
        <p className="hvc-line">היא תיכנס ליומן, לכסף ולמשימות של היום</p>
        <ol className="hvc-dots" aria-hidden>{SETUP_STEPS.map((s, i) => <li key={s.key} className={cn(s.done && 'is-done', i === SETUP_DONE && 'is-next')} />)}</ol>
        <SetupActions onAdd={onAdd} light />
      </section>
    );
  }
  if (!hero) return null;
  const bal = heroBal;
  return (
    <section className="hvc-hero hvc-hero--data" aria-labelledby="hvc-h">
      <button type="button" className="hvc-hit press" onClick={() => openBooking(hero)} aria-label={`פתיחת ההזמנה של ${guestLabel(hero)}`} />
      <div className="hvc-who">
        <Face name={hero.guest_name || ''} size={52} ring />
        <div>
          <p className="hvc-k">{whenOf(hero, m.day)}</p>
          <h2 id="hvc-h" dir="auto">{guestLabel(hero)}</h2>
          <p className="hvc-line"><bdi>{heroUnit?.name || hero.property_name || 'יחידה'}</bdi></p>
        </div>
        <ChevronLeft className="hvc-chev" strokeWidth={1.75} aria-hidden />
      </div>
      <dl className="hvc-stats">
        <div><dt>כניסה</dt><dd dir="ltr">{heroUnit?.check_in_time || '15:00'}</dd></div>
        <div><dt>סה״כ</dt><dd dir="ltr">{bal ? `₪${moneyNum(bal.total)}` : '—'}</dd></div>
        <div><dt>יתרה</dt><dd dir="ltr">{!bal || bal.unknown ? '—' : bal.balance > 0 ? `₪${moneyNum(bal.balance)}` : 'שולם'}</dd></div>
      </dl>
    </section>
  );
}
