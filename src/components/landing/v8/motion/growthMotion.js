/**
 * Growth section motion (landing motion v3, 9.11.2026). Its own small module so it stays in the lazily
 * loaded GrowthS chunk (importing it from LandingM's chunk breaks the prerender manifest).
 * Loops in the sample story run only while their tile is on screen. Reduced motion: nothing runs.
 */
import { useEffect } from 'react';
import { prefersReducedMotion } from '../../v5/motion';

const MOTION_LEVEL = 'a'; // keep in step with landingMotion3.js
const inView = (el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };
const off = () => prefersReducedMotion() || typeof window === 'undefined' || !('IntersectionObserver' in window);
function watchLive(els) {
  const io = new IntersectionObserver((entries) => { entries.forEach((e) => e.target.classList.toggle('mo-live', e.isIntersecting)); }, { threshold: 0 });
  els.forEach((el) => el && io.observe(el));
  return io;
}
function once(el, fn, threshold = 0.5) {
  const io = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(e.target); } }); }, { threshold, rootMargin: '0px 0px -6% 0px' });
  io.observe(el);
  return io;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function countTo(el, ms = 900) {
  const raw = el.textContent;
  const m = raw.match(/^(\D*)([\d,]+)(\D*)$/);
  if (!m) return;
  const to = Number(m[2].replace(/,/g, ''));
  if (!Number.isFinite(to)) return;
  const t0 = performance.now();
  const f = (now) => {
    const p = Math.min(1, (now - t0) / ms);
    el.textContent = p < 1 ? `${m[1]}${Math.round(to * easeOut(p)).toLocaleString('en-US')}${m[3]}` : raw;
    if (p < 1) requestAnimationFrame(f);
  };
  el.textContent = `${m[1]}0${m[3]}`;
  requestAnimationFrame(f);
}

export function useGrowthMotion(ref, level = MOTION_LEVEL) {
  useEffect(() => {
    const root = ref.current;
    if (!root || off()) return undefined;
    const undo = [];
    const live = watchLive([...root.querySelectorAll('.gs-tile')]);
    undo.push(() => live.disconnect());
    if (level === 'b') {
      // season chips: the highlight walks from the first season to the one the sample ad is for (once)
      const lis = [...root.querySelectorAll('.gs-seasons li')];
      const on = lis.findIndex((li) => li.classList.contains('is-on'));
      const wrap = root.querySelector('.gs-seasons');
      if (wrap && on > 0 && !inView(wrap)) {
        lis[on].classList.remove('is-on'); lis[0].classList.add('is-on');
        const timers = [];
        const io = once(wrap, () => {
          for (let i = 1; i <= on; i += 1) {
            timers.push(window.setTimeout(() => { lis[i - 1].classList.remove('is-on'); lis[i].classList.add('is-on'); }, 500 + (i - 1) * 520));
          }
        }, 0.8);
        undo.push(() => { io.disconnect(); timers.forEach((t) => window.clearTimeout(t)); lis.forEach((li, i) => li.classList.toggle('is-on', i === on)); });
      }
      // the sample report's numbers count up once (they stay the same numbers, labelled "דוגמה")
      const rep = root.querySelector('.gs-rep');
      if (rep && !inView(rep)) {
        const io = once(rep, () => {
          rep.querySelectorAll('.gs-rep-n, .gs-rep-rows dd').forEach((el) => countTo(el));
        }, 0.5);
        undo.push(() => io.disconnect());
      }
    }
    return () => undo.forEach((f) => f());
  }, [ref, level]);
}
