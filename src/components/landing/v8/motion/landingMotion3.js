/**
 * Landing motion v3 (9.11.2026, from Deen's reference atlas-v3.html): only brings what is already on the
 * landing to life. No layout, colour, copy or image changes. CSS does the animating (landing-motion-v3.css);
 * this file only decides when, and pauses every loop while it is off screen.
 *
 * - Scroll progress bar: CSS scroll timeline; this hook drives it with rAF only where that is missing.
 * - WhatsApp tile: the bubble that is already there is "sent" when it comes into view
 *   (typing dots, then the same message, then the ticks). The text never changes.
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
function waSim(root, level) {
  const wa = root.querySelector('.lm-tile-vis.is-msg .v8-wa');
  if (!wa || inView(wa)) return null;
  const msg = wa.querySelector('.v8-wa-msg');
  if (!msg) return null;
  if (level === 'b') {
    // word by word: the text node is wrapped in spans, same words, same order
    const node = [...msg.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (node) {
      const words = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      let k = 0;
      words.forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
        const s = document.createElement('span');
        s.className = 'mo-w'; s.style.setProperty('--w', String(k++)); s.textContent = w;
        frag.appendChild(s);
      });
      msg.replaceChild(frag, node);
      wa.style.setProperty('--wn', String(k));
    }
  }
  const dots = document.createElement('span');
  dots.className = 'mo-typing'; dots.setAttribute('aria-hidden', 'true');
  dots.innerHTML = '<i></i><i></i><i></i>';
  wa.appendChild(dots);
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
    const wa = waSim(root, level);
    if (wa) undo.push(wa);
    const live = watchLive([...root.querySelectorAll('.lm-tile, .ph-hero')]);
    undo.push(() => live.disconnect());
    return () => undo.forEach((f) => f());
  }, [rootRef, level]);
}

/* ---------------- growth section (mounted lazily, so it calls this itself) ---------------- */
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
