/**
 * Landing motion (2.11.2026): brings what is already on the landing to life, adds nothing.
 * CSS does the animating (landing-motion.css); this hook only decides when.
 * - [data-count] numbers count up once from 0 when they enter view (only numbers already on the page).
 * - [data-sd] elements get .is-sd when in view: the fallback for browsers without CSS scroll-driven
 *   animations (iOS Safari < 26). With animation-timeline support, CSS drives them from scroll instead.
 * Reduced motion: nothing runs, everything is shown in its final state.
 * Runs after hydration and only touches nodes React never re-renders, so the prerendered HTML is unchanged.
 */
import { useEffect } from 'react';
import { prefersReducedMotion } from '../../v5/motion';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const inView = (el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };

function countUp(el, to, ms) {
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / ms);
    el.textContent = String(Math.round(to * easeOut(p)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function useLandingMotion(rootRef, { countMs = 700 } = {}) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !('IntersectionObserver' in window)) return undefined;
    root.classList.add('mo-on');
    const ios = [];

    /* count-up: the number is swapped for 0 only at the moment its card starts fading in (same margin as
       useReveal), never at load, so the text React hydrates is always the real number */
    const nums = [...root.querySelectorAll('[data-count]')].filter((el) => !inView(el));
    if (nums.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          e.target.textContent = '0';
          setTimeout(() => countUp(e.target, Number(e.target.dataset.count), countMs), 120);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
      nums.forEach((el) => io.observe(el));
      ios.push(io);
    }

    /* scroll-driven fallback */
    const sdOK = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline: view()');
    if (!sdOK) {
      root.classList.add('mo-sd-fb');
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-sd'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
      root.querySelectorAll('[data-sd]').forEach((el) => (inView(el) ? el.classList.add('is-sd') : io.observe(el)));
      ios.push(io);
    }
    return () => ios.forEach((io) => io.disconnect());
  }, [rootRef, countMs]);
}
