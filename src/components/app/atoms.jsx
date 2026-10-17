/**
 * Small building blocks shared by every screen (v5, cool palette): unit thumbnails (neutral filter) and
 * indigo-tint unit tiles, cool guest initials, a time-of-day greeting, count-up numbers and the staggered
 * rise-in wrapper. All motion respects prefers-reduced-motion (premium.css + the hook below).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { guestPhoto } from '@/lib/stay/guestPhoto';
import { cn } from '@/lib/utils';

/* ── Unit photo ────────────────────────────────────────────────────────────── */
/** Small rounded thumbnail, always neutral/cool (warm wood tones are desaturated, faint indigo cast). */
export function UnitPhoto({ property, src, alt = '', className, rounded = 'rounded-[10px]', eager = false }) {
  const [failed, setFailed] = useState(false);
  const url = src || unitPhoto(property);
  if (failed || !url) return <UnitTile property={property} className={className} rounded={rounded} />;
  return (
    <span className={cn('v5-cool-wrap relative block shrink-0 overflow-hidden bg-[#EEF0F5] ring-1 ring-inset ring-[rgba(16,24,64,0.06)]', rounded, className)}>
      <img
        src={url}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        className="v5-cool h-full w-full object-cover"
      />
    </span>
  );
}

/** Indigo-tint tile with the unit's first letter: the calm default where a photo would be noise. */
export function UnitTile({ property, name, className, rounded = 'rounded-[10px]' }) {
  const label = String(name || property?.name || '').trim();
  const core = label.replace(/^(צימר|וילה|בקתת?)\s+/, '');
  // Hebrew unit names usually carry the definite article (הגפן, הזית): show the word's own first letter
  const ch = (core.length >= 3 && core[0] === 'ה' ? core[1] : core[0]) || 'י';
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 select-none items-center justify-center bg-[#EEF0FF] font-bold leading-none text-brand-700 ring-1 ring-inset ring-[rgba(62,43,241,0.08)]', rounded, className)}
    >
      <span style={{ fontSize: '0.95em' }}>{ch}</span>
    </span>
  );
}

/* ── Guest initials: cool palette only (indigo, sky, mint, lilac, slate, periwinkle), stable per name ── */
const TINTS = [
  { bg: '#E7E5FE', fg: '#3E2BF1' }, // indigo
  { bg: '#DDEEFC', fg: '#1557A0' }, // sky
  { bg: '#DCF4EA', fg: '#0F6E4C' }, // mint
  { bg: '#EEE6FD', fg: '#6233C9' }, // lilac
  { bg: '#E6E9F2', fg: '#3A4469' }, // slate
  { bg: '#E2E8FB', fg: '#2B3F9E' }, // periwinkle
];
function tintFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 33 + name.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}
export function guestInitials(name = '') {
  const clean = String(name).replace(/^(משפחת|קבוצת)\s+/, '').replace(/[-–].*$/, '').trim();
  const parts = clean.split(/\s+/).filter((p) => p && p !== 'ו' && !/^ו?[״"']/.test(p));
  if (!parts.length) return 'א';
  const first = parts[0][0] || '';
  const second = parts.length > 1 ? (parts[parts.length - 1].replace(/^ו/, '')[0] || '') : '';
  return (first + second).toUpperCase();
}
export function GuestAvatar({ name = '', size = 36, className, ring = false, record, photo }) {
  const t = tintFor(name || '?');
  const [failed, setFailed] = useState(false);
  const src = photo === false ? null : (photo || guestPhoto(name, record));
  const box = { width: size, height: size };
  if (src && !failed) {
    return (
      <span aria-hidden className={cn('relative inline-flex shrink-0 select-none overflow-hidden rounded-full bg-[#E6E9F2]', ring && 'ring-[3px] ring-white', className)} style={box}>
        <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold leading-none', ring && 'ring-[3px] ring-white', className)}
      style={{ ...box, background: t.bg, color: t.fg, fontSize: Math.round(size * 0.38) }}
    >
      {guestInitials(name)}
    </span>
  );
}

/** Overlapping faces (a couple, today's arrivals). `names` order = visual order; `max` then "+n". */
export function AvatarStack({ names = [], size = 32, max = 4, className, extra }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className={cn('inline-flex items-center', className)} aria-hidden>
      {shown.map((n, i) => (
        <GuestAvatar key={`${n}-${i}`} name={n} size={size} ring className={i ? '-ms-2.5' : ''} />
      ))}
      {rest > 0 || extra ? (
        <span className="-ms-2.5 inline-flex items-center justify-center rounded-full bg-[#EEF0F8] text-[12px] font-bold text-navy-900 ring-[3px] ring-white tabular" style={{ width: size, height: size }} dir="ltr">
          {extra || `+${rest}`}
        </span>
      ) : null}
    </span>
  );
}

/* ── Time of day ───────────────────────────────────────────────────────────── */
export function dayPart(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return { key: 'morning', greeting: 'בוקר טוב', Icon: Sunrise };
  if (h >= 12 && h < 17) return { key: 'noon', greeting: 'צהריים טובים', Icon: Sun };
  if (h >= 17 && h < 21) return { key: 'evening', greeting: 'ערב טוב', Icon: Sunset };
  return { key: 'night', greeting: 'לילה טוב', Icon: Moon };
}

/* ── Motion helpers ────────────────────────────────────────────────────────── */
export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const on = () => setReduce(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduce;
}

/** Counts from 0 to value once (ease-out, ~700ms). Static under reduced motion. */
export function CountUp({ value, duration = 700, format = (n) => String(n), className }) {
  const reduce = usePrefersReducedMotion();
  const target = Number(value) || 0;
  const [shown, setShown] = useState(reduce ? target : 0);
  const raf = useRef(0);
  useEffect(() => {
    if (reduce || target === 0) { setShown(target); return undefined; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, reduce]);
  return <span className={cn('tabular', className)}>{format(shown)}</span>;
}

/** Staggered fade-up: children rise 12px in order. `i` is the position in the sequence. */
export function Rise({ as: Comp = 'div', i = 0, className, children, ...rest }) {
  return (
    <Comp className={cn('v4-rise', className)} style={{ '--i': i }} {...rest}>
      {children}
    </Comp>
  );
}
