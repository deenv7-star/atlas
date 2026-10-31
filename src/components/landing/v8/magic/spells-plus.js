/**
 * P2 "magical" extras (UI/UX polish v1, 20.10.2026; qa/uiux-polish-v1/spells.md). Lazy, after spells.js.
 *   spell 7  booking chip arcs into the calendar (Arc toss)                  CSS, gated by html.mg-2
 *   spell 8  confetti when visitors switch to yearly (Family waitlist)        once per visit
 *   spell 9  magnetic final CTA (Claude logo reacts to the mouse)            fine pointers
 *   spell 10 spotlight follows the pointer on tiles and plans (Luma)          fine pointers
 *   spell 11 squash on the monthly/yearly pill (foodpanda switch)
 *   spell 12 UI crops drift with the scroll (CSS view timeline)              CSS, gated by html.mg-2
 */
import { track } from './spells';

const FINE = '(hover: hover) and (pointer: fine)';
const COLORS = ['#3E2BF1', '#1B2656', 'rgba(62, 43, 241, 0.35)', '#FFFFFF'];

function confetti(x, y) {
  const box = document.createElement('div');
  box.className = 'mg-confetti'; box.setAttribute('aria-hidden', 'true');
  box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  document.body.appendChild(box);
  let left = 0;
  for (let i = 0; i < 26; i += 1) {
    const p = document.createElement('i');
    const c = COLORS[i % COLORS.length];
    p.style.background = c;
    if (c === '#FFFFFF') p.style.boxShadow = 'inset 0 0 0 1.5px #3E2BF1';
    box.appendChild(p);
    const ang = (-90 + (Math.random() * 140 - 70)) * (Math.PI / 180);
    const v = 120 + Math.random() * 140;
    const dx = Math.cos(ang) * v; const dy = Math.sin(ang) * v;
    const rot = (Math.random() * 720 - 360).toFixed(0);
    left += 1;
    const a = p.animate([
      { transform: 'translate3d(0, 0, 0) rotate(0) scale(0.6)', opacity: 1 },
      { transform: `translate3d(${dx.toFixed(0)}px, ${dy.toFixed(0)}px, 0) rotate(${rot / 2}deg) scale(1)`, opacity: 1, offset: 0.45 },
      { transform: `translate3d(${(dx * 1.25).toFixed(0)}px, ${(dy + 160).toFixed(0)}px, 0) rotate(${rot}deg) scale(0.9)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 300, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'forwards' });
    a.onfinish = () => { left -= 1; if (!left) box.remove(); };
  }
}

function yearlyCelebration() {
  let done = false;
  document.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('.v8p-seg button') : null;
    if (!b) return;
    const seg = b.closest('.v8p-seg');
    const hi = seg && seg.querySelector('.v8p-seg-hi');
    if (hi && typeof hi.animate === 'function') {
      hi.animate([{ transform: 'none' }, { transform: 'scale(1.03, 0.92)' }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    }
    const yearly = [...seg.querySelectorAll('button')].indexOf(b) === 1;
    if (!yearly || done || typeof b.animate !== 'function') return;
    done = true;
    const r = b.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2);
  });
}

function magnet() {
  const box = document.querySelector('.lm-x-box');
  const btn = box && box.querySelector('.v8x-cta .l5-btn');
  if (!btn) return;
  let raf = 0; let tx = 0; let ty = 0;
  const paint = () => { raf = 0; btn.style.translate = tx || ty ? `${tx.toFixed(1)}px ${ty.toFixed(1)}px` : ''; };
  box.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
    const dx = e.clientX - cx; const dy = e.clientY - cy;
    const reach = Math.max(0, 1 - (Math.max(0, Math.abs(dx) - r.width / 2) + Math.max(0, Math.abs(dy) - r.height / 2)) / 90);
    tx = Math.max(-6, Math.min(6, dx * 0.08)) * reach; ty = Math.max(-6, Math.min(6, dy * 0.14)) * reach;
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  box.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
}

export function castPlus() {
  document.documentElement.classList.add('mg-2');
  yearlyCelebration();
  if (window.matchMedia(FINE).matches) { track('.lm-tile, .v8p-plan'); magnet(); }
}
