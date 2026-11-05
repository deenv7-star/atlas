/**
 * The calendar's status line (Deen 05.11.2026): ONE calendar on the page, and above it one plain sentence about the
 * period on screen plus at most two things worth doing. Written for every owner, including older ones: calm, short,
 * no jargon, numbers in words they use ("לילות פנויים", "סוף השבוע").
 *
 * Two versions behind a flag (?brief=a|b, remembered on the device; default A):
 *   A "משפט אחד": a single sentence card, then up to two quiet action buttons.            (recommended)
 *   B "שלוש שורות": three labelled facts side by side, then one "מה כדאי לעשות" line with one button.
 */
import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heCount } from '@/lib/hebrewCount';
import { HE_MONTHS, parseIso, shortDay } from '@/lib/calendar/calendarModel';
import { computeBrief } from './calendarBrief';

const KEY = 'atlas-cal-brief';
export function briefVariant() {
  if (typeof window === 'undefined') return 'a';
  try {
    const q = new URLSearchParams(window.location.search).get('brief');
    if (q === 'a' || q === 'b') { localStorage.setItem(KEY, q); return q; }
    const s = localStorage.getItem(KEY);
    return s === 'b' ? 'b' : 'a';
  } catch { return 'a'; }
}

const freeNights = (n) => (n === 1 ? 'לילה פנוי אחד' : `${n} לילות פנויים`);

function periodWord(view, days, today) {
  if (view === 'week') return days.includes(today) ? 'השבוע' : 'בשבוע הזה';
  return `ב${HE_MONTHS[parseIso(days[Math.floor(days.length / 2)]).getMonth()]}`;
}

/** The actions worth taking, most useful first, max two. Each opens a new booking already filled in. */
function actionsOf(b) {
  const out = [];
  if (b.weekend?.free && b.weekend.first) {
    out.push({ key: 'weekend', label: 'הזמנה לסוף השבוע', sub: `${b.weekend.first.unit.name} · ${shortDay(b.weekend.first.day)}`, unit: b.weekend.first.unit, day: b.weekend.first.day });
  }
  if (b.gaps?.first?.unit) {
    out.push({ key: 'gap', label: b.gaps.first.nights === 1 ? 'הזמנה ללילה שבין ההזמנות' : 'הזמנה ללילות שבין ההזמנות', sub: `${b.gaps.first.unit.name} · ${shortDay(b.gaps.first.day)}`, unit: b.gaps.first.unit, day: b.gaps.first.day });
  }
  return out.slice(0, 2);
}

/** Version A: the whole status in one sentence. */
function sentenceA(b, period) {
  const parts = [];
  if (b.empty) parts.push(`${period} עוד אין הזמנות.`);
  else parts.push(`${period} ${b.pct}% תפוסה${b.arrivals ? `, ${b.arrivals === 1 ? 'הגעה אחת' : `${b.arrivals} הגעות`}` : ''}.`);
  if (b.weekend) {
    parts.push(b.weekend.free
      ? `בסוף השבוע (${b.weekend.label}) עוד ${freeNights(b.weekend.free)}.`
      : `סוף השבוע (${b.weekend.label}) מלא.`);
  }
  if (b.gaps) parts.push(`${b.gaps.nights === 1 ? 'לילה אחד פנוי' : `${b.gaps.nights} לילות פנויים`} בין הזמנות, כדאי למלא.`);
  return parts.join(' ');
}

function ActionButton({ a, onNewBooking, primary }) {
  return (
    <button
      type="button"
      onClick={() => onNewBooking(a.unit, a.day)}
      className={cn('press inline-flex min-h-[48px] items-center gap-2 rounded-full px-4 text-start',
        primary ? 'bg-brand-600 text-white hover:bg-[#3322D9]' : 'bg-white text-navy-900 ring-1 ring-inset ring-navy-900/10 hover:bg-[#F7F8FB]')}
    >
      <Plus aria-hidden className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold">{a.label}</span>
        <span className={cn('text-[13px]', primary ? 'text-white/85' : 'text-navy-900/70')}>{a.sub}</span>
      </span>
    </button>
  );
}

export default function CalendarBrief({ variant = 'a', view = 'month', days, today, units, stays, occ, gaps, onNewBooking, className }) {
  const b = useMemo(() => computeBrief({ days, today, units, stays, occ, gaps }), [days, today, units, stays, occ, gaps]);
  if (!units.length || !days.length) return null;
  const period = periodWord(view, days, today);
  const acts = actionsOf(b);

  if (variant === 'b') {
    const facts = [
      { k: view === 'week' ? 'תפוסה השבוע' : `תפוסה ${period}`, v: b.empty ? 'אין הזמנות' : `${b.pct}%`, sub: b.empty ? '' : `${b.booked} מתוך ${heCount(b.total, 'night')}` },
      b.weekend ? { k: `סוף השבוע · ${b.weekend.label}`, v: b.weekend.free ? freeNights(b.weekend.free) : 'מלא', sub: b.weekend.free ? (b.weekend.freeUnits === 1 ? 'ביחידה אחת' : `ב־${b.weekend.freeUnits} יחידות`) : '' } : null,
      { k: 'בין הזמנות', v: b.gaps ? freeNights(b.gaps.nights) : 'אין חורים', sub: b.gaps ? 'לילות שקשה למכור לבד' : '' },
    ].filter(Boolean);
    const todo = acts[0];
    return (
      <section className={cn('v7-card p-4 md:p-5', className)} aria-label="מצב היומן">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          {facts.map((f) => (
            <div key={f.k} className="rounded-[16px] bg-[#F7F8FB] px-4 py-3">
              <dt className="text-[14px] text-navy-900/70">{f.k}</dt>
              <dd className="mt-1 text-[22px] font-bold leading-tight text-navy-900">{f.v}</dd>
              {f.sub ? <dd className="mt-0.5 text-[13px] text-navy-900/70">{f.sub}</dd> : null}
            </div>
          ))}
        </dl>
        {todo ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-brand-600/[0.06] px-4 py-3">
            <p className="text-[16px] text-navy-900"><b>מה כדאי לעשות:</b> {todo.key === 'weekend' ? 'למכור את סוף השבוע' : 'למלא את הלילות שבין ההזמנות'}.</p>
            <ActionButton a={todo} onNewBooking={onNewBooking} primary />
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className={cn('v7-card p-4 md:px-6 md:py-5', className)} aria-label="מצב היומן">
      <p className="text-[17px] leading-[1.55] text-navy-900 md:text-[19px]" aria-live="polite">{sentenceA(b, period)}</p>
      {acts.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {acts.map((a, i) => <ActionButton key={a.key} a={a} onNewBooking={onNewBooking} primary={i === 0} />)}
        </div>
      ) : null}
    </section>
  );
}
