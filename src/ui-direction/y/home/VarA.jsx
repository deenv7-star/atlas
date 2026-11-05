/**
 * Today · variation A "כרטיס הגדרה קומפקטי": an account with units and no bookings gets one compact white
 * setup card (1 מתוך 3, three short steps, two actions) on top; the four tiles and the chart stay below it,
 * calm and empty, so the screen already looks like the app it will become.
 */
import React from 'react';
import { SETUP_DONE, SETUP_TOTAL, SETUP_STEPS, SetupActions } from './shared';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import './var-a.css';
import './var-a2.css';

export const HOME_VAR = 'a2';
export const HIDE_PHOTO = false;

export default function HomeTop({ noBookings, onAdd }) {
  if (!noBookings) return null;
  return (
    <section className="hva-card" aria-labelledby="hva-h">
      <div className="hva-head">
        <h2 id="hva-h">נתחיל מההזמנה הראשונה</h2>
        <span className="hva-count" dir="rtl">{SETUP_DONE} מתוך {SETUP_TOTAL}</span>
      </div>
      <ol className="hva-track" aria-label="צעדי ההגדרה">
        {SETUP_STEPS.map((s, i) => (
          <li key={s.key} className={cn(s.done && 'is-done', !s.done && i === SETUP_DONE && 'is-next')}>
            <i aria-hidden />
            <span>{s.done ? <Check strokeWidth={2.5} aria-hidden /> : null}{s.short}{s.done ? <span className="sr-only"> (בוצע)</span> : null}</span>
          </li>
        ))}
      </ol>
      <SetupActions onAdd={onAdd} compact />
    </section>
  );
}
