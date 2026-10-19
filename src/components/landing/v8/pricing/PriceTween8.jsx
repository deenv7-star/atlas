/**
 * Pricing toggle motion, version B "tween" (19.10.2026): the price counts smoothly from the old value
 * to the new one (450ms, ease-out cubic, requestAnimationFrame writing one text node, no React
 * re-renders per frame). A toggle in the middle of a count continues from the number on screen.
 * A hidden copy of the price ("ghost", tabular digits) holds the width and the baseline, so nothing
 * shifts while the digits change. Screen readers get the final price only (sr-only); the counting
 * digits are aria-hidden. Reduced motion: the number swaps instantly.
 */
import React, { useEffect, useRef } from 'react';
import { fmt } from '../../v5/motion';

const DURATION = 450;
const easeOut = (k) => 1 - (1 - k) ** 3;
const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PriceNumber({ value }) {
  const el = useRef(null);
  const shown = useRef(value); // the number currently on screen
  const raf = useRef(0);

  useEffect(() => {
    const node = el.current;
    const from = shown.current;
    if (!node || from === value) return undefined;
    cancelAnimationFrame(raf.current);
    if (reduced()) {
      shown.current = value;
      node.textContent = fmt(value);
      return undefined;
    }
    let t0 = 0;
    const step = (t) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / DURATION);
      const v = k === 1 ? value : Math.round(from + (value - from) * easeOut(k));
      if (v !== shown.current) { shown.current = v; node.textContent = fmt(v); }
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const text = fmt(value);
  return (
    <b className="num v8p-num" dir="ltr">
      <span className="sr-only">₪{text}</span>
      <span className="v8p-ghost" aria-hidden="true">₪{text}</span>
      <span className="v8p-tw-row" aria-hidden="true">₪<span ref={el} className="v8p-tw">{fmt(shown.current)}</span></span>
    </b>
  );
}
