/**
 * Landing motion v3 (9.11.2026, from Deen's reference atlas-v3.html): only brings what is already on the
 * landing to life. No layout, colour, copy or image changes. CSS does the animating (landing-motion-v3.css);
 * this file only decides when, and pauses every loop while it is off screen.
 *
 * - Scroll progress bar: CSS scroll timeline; this hook drives it with rAF only where that is missing.
 * - WhatsApp tile: the bubble that is already there is "sent" when it comes into view
 *   (typing dots, then the same message, then the ticks). The text never changes, and no node is added:
 *   the dots are static markup (WaBubble `typing`), so hydration of the prerendered page is untouched.
 * - Loops (story progress, slow photo zoom, sync icon) run only while their card is on screen.
 * Reduced motion / no IntersectionObserver: nothing runs, everything stays in its final, static state.
 * Every node touched here is one React never re-renders, so the prerendered HTML hydrates unchanged.
 */
import { useEffect } from 'react';
import { prefersReducedMotion } from '../../v5/motion';

/** 'a' = עדין (subtle), 'b' = חי (fuller). */
export const MOTION_LEVEL = 'a';

const inView = (el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };
const off = () => prefersReducedMotion() || typeof window === 'undefined' || !('IntersectionObserver' in window);

/** Adds .mo-live to each element while it is on screen (loops are paused in CSS without it). */
export function watchLive(els) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('mo-live', e.isIntersecting));
  }, { rootMargin: '0px', threshold: 0 });
  els.forEach((el) => el && io.observe(el));
  return io;
}

/** Runs fn once, when el is well into view. */
function once(el, fn, threshold = 0.5) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(e.target); } });
  }, { threshold, rootMargin: '0px 0px -6% 0px' });
  io.observe(el);
  return io;
}

function progressFallback(root) {
  const bar = root.querySelector('.mo-prog i');
  if (!bar) return () => {};
  let raf = 0; let last = -1;
  const tick = () => {
    raf = 0;
    const d = document.documentElement;
    const max = d.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const v = Math.round(p * 1000) / 1000;
    if (v !== last) { last = v; bar.style.transform = `scaleX(${v})`; }
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
  window.addEventListener('scroll', on, { passive: true });
  window.addEventListener('resize', on, { passive: true });
  tick();
  return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
}

/** WhatsApp bubble: typing dots, then the same message, then the ticks. Layout never moves (opacity/transform). */
function waSim(root) {
  const wa = root.querySelector('.lm-tile-vis.is-msg .v8-wa');
  if (!wa || inView(wa)) return null;
  const msg = wa.querySelector('.v8-wa-msg');
  if (!msg) return null;
  wa.classList.add('mo-wa-wait');
  let t1 = 0; let t2 = 0;
  const io = once(wa, () => {
    t1 = window.setTimeout(() => {
      wa.classList.add('mo-wa-typing');
      t2 = window.setTimeout(() => { wa.classList.remove('mo-wa-typing', 'mo-wa-wait'); wa.classList.add('mo-wa-sent'); }, 1100);
    }, 250);
  }, 0.6);
  return () => { io.disconnect(); window.clearTimeout(t1); window.clearTimeout(t2); };
}

export function useLandingMotion3(rootRef, level = MOTION_LEVEL) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || off()) return undefined;
    root.classList.add(`mo-${level}`);
    const undo = [];
    const scrollTL = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline: scroll()');
    if (!scrollTL) undo.push(progressFallback(root));
    const wa = waSim(root);
    if (wa) undo.push(wa);
    const live = watchLive([...root.querySelectorAll('.lm-tile, .ph-hero')]);
    undo.push(() => live.disconnect());
    return () => undo.forEach((f) => f());
  }, [rootRef, level]);
}
