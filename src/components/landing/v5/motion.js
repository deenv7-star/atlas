/**
 * Small motion helpers for landing v4. No library: CSS does the animating, these hooks
 * only decide *when* (in view, reduced motion, tab visible).
 */
import { useEffect, useRef, useState } from 'react';

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Adds .is-in to every [data-reveal] inside root once it enters the viewport (fade-up 12px in CSS). */
export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const els = [...root.querySelectorAll('[data-reveal]')];
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    root.classList.add('l4-reveal-on');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

/** True once the element has been on screen (and stays true). */
export function useInView(ref, { once = true, margin = '0px' } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setInView(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); if (once) io.disconnect(); } else if (!once) setInView(false);
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, margin]);
  return inView;
}

/**
 * Steps through a scripted timeline: returns the current step index.
 * timeline = [ms at which step 1 starts, step 2, ...]; loops after `loop` ms.
 * Reduced motion: jumps straight to the final step and stays there.
 */
export function useTimeline(timeline, { loop = 0, active = true } = {}) {
  const last = timeline.length;
  const [step, setStep] = useState(0);
  const timers = useRef([]);
  useEffect(() => {
    if (!active) return undefined;
    if (prefersReducedMotion()) { setStep(last); return undefined; }
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      setStep(0);
      timers.current = timeline.map((t, i) => setTimeout(() => !cancelled && setStep(i + 1), t));
      if (loop) timers.current.push(setTimeout(run, loop));
    };
    run();
    return () => { cancelled = true; timers.current.forEach(clearTimeout); };
    // timeline is a module constant at every call site, so it is not a dependency.
  }, [active, loop, last]);
  return step;
}

/** Counts from 0 to `to` with ease-out once `start` is true. */
export function useCountUp(to, start, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return undefined;
    if (prefersReducedMotion()) { setV(to); return undefined; }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, start, duration]);
  return v;
}

export const fmt = (n) => n.toLocaleString('en-US');
