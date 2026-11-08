/**
 * Small "design spells" for /early. Everything writes CSS custom properties on one element per frame
 * (no React state per frame); CSS turns them into transform/opacity only.
 */
import { useEffect } from 'react';

export const prefersReduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

/** Scroll progress 0..1 of a tall wrapper whose child is sticky. Writes --p on `stage`. */
export function useScrollProgress(wrapRef, stageRef) {
  useEffect(() => {
    const wrap = wrapRef.current; const stage = stageRef.current;
    if (!wrap || !stage) return undefined;
    if (prefersReduced()) return undefined; // CSS holds a static composition
    let raf = 0; let last = -1;
    const tick = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const span = Math.max(1, wrap.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      const q = Math.round(p * 1000) / 1000;
      if (q !== last) { last = q; stage.style.setProperty('--p', String(q)); stage.classList.toggle('is-ordered', q > 0.62); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
  }, [wrapRef, stageRef]);
}

/** Light that follows the cursor, or the finger on touch. Writes --gx/--gy (px) and --mx/--my (-1..1) on `el`. */
export function useGlow(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return undefined;
    let raf = 0; let x = 0; let y = 0;
    const flush = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const lx = x - r.left; const ly = y - r.top;
      el.style.setProperty('--gx', `${Math.round(lx)}px`);
      el.style.setProperty('--gy', `${Math.round(ly)}px`);
      el.style.setProperty('--mx', ((lx / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty('--my', ((ly / r.height) * 2 - 1).toFixed(3));
      el.classList.add('has-glow');
    };
    const move = (cx, cy) => { x = cx; y = cy; if (!raf) raf = requestAnimationFrame(flush); };
    const pm = (e) => move(e.clientX, e.clientY);
    const tm = (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); };
    el.addEventListener('pointermove', pm, { passive: true });
    el.addEventListener('touchstart', tm, { passive: true });
    el.addEventListener('touchmove', tm, { passive: true });
    return () => { el.removeEventListener('pointermove', pm); el.removeEventListener('touchstart', tm); el.removeEventListener('touchmove', tm); if (raf) cancelAnimationFrame(raf); };
  }, [ref]);
}

/** Magnetic button: leans toward a fine pointer within its box + 40px. Touch devices get the press + sheen only. */
export function useMagnet(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced() || !finePointer()) return undefined;
    const zone = el.parentElement || el;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2); const dy = e.clientY - (r.top + r.height / 2);
      const reach = Math.max(r.width, r.height) / 2 + 40;
      const d = Math.hypot(dx, dy);
      if (d > reach) { el.style.translate = ''; return; }
      el.style.translate = `${(dx * 0.18).toFixed(1)}px ${(dy * 0.28).toFixed(1)}px`;
    };
    const leave = () => { el.style.translate = ''; };
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerleave', leave);
    return () => { zone.removeEventListener('pointermove', move); zone.removeEventListener('pointerleave', leave); };
  }, [ref]);
}

/** Number roll: counts an element's number from `from` to `to` the first time it is half visible. */
export function useRoll(ref, from, to, fmt) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced() || typeof IntersectionObserver === 'undefined' || from === to) return undefined;
    el.textContent = fmt(from);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(); const dur = 1100;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - (1 - k) ** 4;
        el.textContent = fmt(Math.round(from + (to - from) * eased));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); el.textContent = fmt(to); };
  }, [ref, from, to, fmt]);
}
