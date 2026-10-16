/**
 * Small warm building blocks shared by every screen (v4): unit cover photos, soft guest initials,
 * a time-of-day icon, count-up numbers and the staggered rise-in wrapper. All motion respects
 * prefers-reduced-motion (the CSS fallback in warm.css + the hook below).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { cn } from '@/lib/utils';

/* ── Unit photo ────────────────────────────────────────────────────────────── */
export function UnitPhoto({ property, src, alt = '', className, rounded = 'rounded-[18px]', eager = false }) {
  const [failed, setFailed] = useState(false);
  const url = src || unitPhoto(property);
  return (
    <span className={cn('relative block shrink-0 overflow-hidden bg-[#EFE9E1]', rounded, className)}>
      {!failed && url ? (
        <img
          src={url}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className="v4-photo h-full w-full object-cover"
        />
      ) : null}
    </span>
  );
}

/* ── Guest initials: six soft tints, stable per name ───────────────────────── */
const TINTS = [
  { bg: '#FDEBDD', fg: '#9A4A12' }, // peach
  { bg: '#E3F1E8', fg: '#2C6B47' }, // sage
  { bg: '#E6E9FB', fg: '#3B33A8' }, // periwinkle
  { bg: '#FBE6EC', fg: '#9B3355' }, // rose
  { bg: '#FDF1D6', fg: '#8A5F0B' }, // butter
  { bg: '#E1F0F4', fg: '#2B6475' }, // sky
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
export function GuestAvatar({ name = '', size = 36, className, ring = false }) {
  const t = tintFor(name || '?');
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold leading-none', ring && 'ring-[3px] ring-white', className)}
      style={{ width: size, height: size, background: t.bg, color: t.fg, fontSize: Math.round(size * 0.38) }}
    >
      {guestInitials(name)}
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
