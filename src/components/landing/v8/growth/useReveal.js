import { useEffect } from 'react';

/**
 * One-time scroll reveal for every [data-r] inside `ref`: adds .is-in when the element enters the viewport.
 * CSS owns the motion (transform + opacity only); under reduced motion the CSS shows everything at rest,
 * so this only toggles a class. One IntersectionObserver for the whole section.
 */
export default function useReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const els = [...root.querySelectorAll('[data-r]')];
    if (typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('is-in')); return undefined; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [ref]);
}
