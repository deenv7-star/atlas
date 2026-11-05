/**
 * home/var (05.11.2026): shared pieces for the Today top area. The setup steps an account with units but no
 * bookings still has, a small progress ring, and the quiet placeholder the revenue chart shows before money.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

/** units exist (the empty Today only shows when they do), so step 1 is done; the next two are the actions */
export const SETUP_STEPS = [
  { key: 'unit', t: 'הוסיפו יחידה', short: 'יחידה', done: true },
  { key: 'channels', t: 'חברו את Booking או Airbnb', short: 'ערוצים' },
  { key: 'booking', t: 'הוסיפו הזמנה ראשונה', short: 'הזמנה ראשונה' },
];
export const SETUP_DONE = SETUP_STEPS.filter((s) => s.done).length;
export const SETUP_TOTAL = SETUP_STEPS.length;

/** a 1/3-style progress ring: indigo arc on a quiet track, the count inside */
export function StepRing({ done = SETUP_DONE, total = SETUP_TOTAL, size = 44, stroke = 4, light = false }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (
    <span className={cn('hv-sring', light && 'is-light')} style={{ width: size, height: size }} role="img" aria-label={`${done} מתוך ${total} צעדים`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="hv-sring-t" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" className="hv-sring-a"
          strokeDasharray={c} strokeDashoffset={c * (1 - done / total)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <b dir="ltr" aria-hidden>{done}/{total}</b>
    </span>
  );
}

export function SetupActions({ onAdd, light = false, compact = false }) {
  return (
    <div className={cn('hv-acts', compact && 'is-compact')}>
      <button type="button" className={cn('hv-btn press', light && 'is-light')} onClick={onAdd}><Plus strokeWidth={2} aria-hidden />הוספת הזמנה</button>
      <Link to={createPageUrl('Integrations')} className={cn('hv-btn hv-btn--ghost press', light && 'is-light')}>חיבור ערוצים</Link>
    </div>
  );
}

export function StepList({ inline = false }) {
  return (
    <ol className={cn('hv-steps', inline && 'is-inline')}>
      {SETUP_STEPS.map((s, i) => (
        <li key={s.key} className={cn(s.done && 'is-done')}>
          <i aria-hidden>{s.done ? <Check strokeWidth={2.5} /> : i + 1}</i>
          <span>{inline ? s.short : s.t}{s.done ? <span className="sr-only"> (בוצע)</span> : null}</span>
        </li>
      ))}
    </ol>
  );
}

/** the revenue chart before the first shekel: a faint dashed line where the wave will be, one honest line of text */
export function ChartPlaceholder() {
  return (
    <div className="hv-chart-ph">
      <svg viewBox="0 0 520 150" preserveAspectRatio="none" width="100%" height="150" aria-hidden>
        {[30, 70, 110].map((y) => <line key={y} x1="0" x2="520" y1={y} y2={y} className="hv-chart-grid" />)}
        <path d="M4,128 C70,124 110,104 176,100 C242,96 280,70 346,74 C412,78 450,48 516,40" className="hv-chart-dash" />
      </svg>
      <p><b>עוד אין הכנסות להצגה</b><span>הגרף יתמלא מההזמנה הראשונה</span></p>
    </div>
  );
}
