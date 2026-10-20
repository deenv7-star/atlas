/**
 * Onboarding v3 shared pieces: browser back/forward per step, the "נשמר" tick, the kind photo,
 * and the live calendar preview (the owner's real answers + sample bookings clearly labelled "דוגמה").
 * Palette only: #3E2BF1 indigo, #1B2656 navy, #F7F8FB canvas, white (+ indigo tints).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kindInfo, clampInt, UNITS_LIMIT, unitsLabel, guestsLabel, CHANNELS } from '@/lib/onboarding/v2/model';
import { COPY } from './copy';
import '@/styles/onboarding-v3.css';

const PHOTOS = {
  zimmer: '/demo/units/unit-6.webp',
  villa: '/demo/units/unit-3.webp',
  complex: '/demo/complex-pool.webp',
  zimmer_complex: '/demo/units/unit-1.webp',
  guesthouse: '/demo/types/boutique.webp',
  boutique: '/demo/types/boutique.webp',
  apartments: '/demo/types/apartments.webp',
  hotel: '/demo/types/hotel.webp',
};
export const kindPhoto = (kind) => PHOTOS[kind] || '/demo/complex-pool.webp';

/**
 * Each step is a browser history entry, so the phone's back gesture / the browser's back button goes to
 * the previous question instead of leaving onboarding (v2 lost the whole flow on "back").
 */
export function useStepHistory(step, setStep) {
  const first = useRef(true);
  useEffect(() => {
    const st = window.history.state || {};
    if (first.current) {
      first.current = false;
      window.history.replaceState({ ...st, obStep: step }, '');
      return;
    }
    if (st.obStep !== step) window.history.pushState({ ...st, obStep: step }, '');
  }, [step]);
  // One listener for the whole flow, reading the latest setStep from a ref. Re-subscribing on every render
  // lost the event: the router re-renders synchronously inside the same popstate dispatch, the effect
  // cleanup removed this listener mid-dispatch, and the new one never saw the event (QA 20.10).
  const latest = useRef(setStep);
  latest.current = setStep;
  useEffect(() => {
    const onPop = (e) => {
      const s = e.state && typeof e.state.obStep === 'number' ? e.state.obStep : null;
      if (s != null) latest.current(s, true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}

/** A quiet "נשמר ✓" that shows for a moment after each autosave. */
export function SavedTick({ stamp }) {
  const [on, setOn] = useState(false);
  const firstStamp = useRef(stamp);
  useEffect(() => {
    if (stamp === firstStamp.current) return undefined;
    setOn(true);
    const t = setTimeout(() => setOn(false), 1600);
    return () => clearTimeout(t);
  }, [stamp]);
  return (
    <span className={cn('ob3-saved', on && 'is-on')} aria-hidden>
      <Check className="h-3.5 w-3.5" strokeWidth={3} />{COPY.common.saved}
    </span>
  );
}

/** The next 7 days, starting today (real dates, he-IL). */
function week() {
  const out = [];
  const d0 = new Date();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i);
    out.push({ wd: d.toLocaleDateString('he-IL', { weekday: 'narrow' }), day: d.getDate(), weekend: d.getDay() === 5 || d.getDay() === 6 });
  }
  return out;
}

/** Sample bookings per row: [startCol, length] — only labelled by source, never by guest or price. */
const SAMPLE = [[1, 2], [3, 3], [0, 2], [4, 3], [2, 2], [5, 2]];

export function sources(a) {
  const ch = Array.isArray(a.channels) ? a.channels : [];
  const names = CHANNELS.filter((c) => ch.includes(c.value)).map((c) => ({ booking: 'Booking', airbnb: 'Airbnb', phone: COPY.preview.phone }[c.value] || c.label));
  return names.length ? names : ['Booking', 'Airbnb', COPY.preview.phone];
}

/** Unit names as they will appear in the calendar ("צימר 1"… or the place name for a single unit). */
export function unitNames(a, max = 4) {
  const k = kindInfo(a.kind || 'complex');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const single = n === 1 && a.name.trim();
  return Array.from({ length: Math.min(n, max) }, (_, i) => (single ? a.name.trim() : `${k.unit} ${i + 1}`));
}

/**
 * The calendar preview. Rows are the owner's real units; the bars are a sample (badge "דוגמה" + a note),
 * coloured only in indigo tints, labelled with the sources the owner picked.
 */
export function CalendarPreview({ a, compact = false, rows: maxRows = 4 }) {
  const days = week();
  const names = unitNames(a, maxRows);
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const src = sources(a);
  const tints = ['bg-brand-600 text-white', 'bg-[#E4E1FD] text-navy-900', 'bg-[#1B2656] text-white'];
  return (
    <div className={cn('ob3-cal', compact && 'is-compact')}>
      <div className="flex items-center gap-2">
        <p className="text-[14px] font-bold text-navy-900">{COPY.preview.calendar}</p>
        <span className="ob3-badge">{COPY.common.example}</span>
      </div>
      <div className="mt-3 grid gap-y-1.5" style={{ gridTemplateColumns: `${compact ? 58 : 72}px repeat(7, minmax(0, 1fr))` }}>
        <span />
        {days.map((d, i) => (
          <span key={i} className={cn('flex flex-col items-center text-[11px] font-semibold leading-tight', d.weekend ? 'text-brand-700' : 'text-ink-400')}>
            <span>{d.wd}</span><span className="tabular-nums text-[12px] text-navy-900">{d.day}</span>
          </span>
        ))}
        {names.map((nm, r) => {
          const [s, len] = SAMPLE[r % SAMPLE.length];
          return (
            <React.Fragment key={r}>
              <span className="flex min-h-[30px] items-center truncate pe-2 text-[12px] font-semibold text-navy-900">{nm}</span>
              <span className="relative col-span-7 grid grid-cols-7 gap-[3px]">
                {days.map((_, c) => <span key={c} className="h-[30px] rounded-[7px] bg-[#F1F2F7]" />)}
                <span className={cn('ob3-bar absolute inset-y-0 flex items-center rounded-[8px] px-2 text-[11px] font-bold', tints[r % tints.length])}
                  style={{ insetInlineStart: `calc(${(s / 7) * 100}% + 1px)`, width: `calc(${(len / 7) * 100}% - 4px)`, animationDelay: `${r * 80}ms` }}>
                  <span className="truncate">{src[r % src.length]}</span>
                </span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
      {n > names.length ? <p className="mt-1.5 text-[12px] text-ink-400">{COPY.preview.more(n - names.length)}</p> : null}
      <p className="mt-3 text-[12px] leading-snug text-ink-400">{COPY.preview.sampleNote}</p>
    </div>
  );
}

/** One line under the name: "3 יחידות · 10–30 אורחים · כניסה 15:00". */
export function summaryLine(a) {
  const k = kindInfo(a.kind || 'complex');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const parts = [a.kind ? k.label : null, unitsLabel(a.kind || 'complex', n), guestsLabel(a)];
  return parts.filter(Boolean).join(' · ');
}
