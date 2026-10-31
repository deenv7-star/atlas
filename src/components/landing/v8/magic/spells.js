/**
 * Pointer micro-interactions for the landing (UI/UX polish v1, 20.10.2026; qa/uiux-polish-v1/spells.md).
 * Loaded lazily on idle after hydration, never under reduced motion. Only custom properties that feed
 * transforms, transform and opacity are written; one rAF per frame; listeners are passive and delegated.
 *   spell 1  light follows the pointer inside primary buttons (Luma)          fine pointers
 *   spell 3  press ripple from the tap point (Ripples)                         all pointers
 * 'magical' also loads ./spells-plus.js (spells 7-12).
 */
const FINE = '(hover: hover) and (pointer: fine)';
const BTN = '.ph-btn, .l5-btn, .lm-sticky a';

/** Delegated pointer tracking: writes --gx/--gy (px, relative to the element) on the hovered match of `sel`
 *  and toggles .mg-hot. Shared by spell 1 and spell 10. */
export function track(sel) {
  let el = null; let x = 0; let y = 0; let raf = 0;
  const paint = () => { raf = 0; if (el) { el.style.setProperty('--gx', `${x.toFixed(1)}px`); el.style.setProperty('--gy', `${y.toFixed(1)}px`); } };
  const move = (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = e.target instanceof Element ? e.target.closest(sel) : null;
    if (t !== el) { if (el) el.classList.remove('mg-hot'); el = t; if (el) el.classList.add('mg-hot'); }
    if (!el) return;
    const r = el.getBoundingClientRect(); x = e.clientX - r.left; y = e.clientY - r.top;
    if (!raf) raf = requestAnimationFrame(paint);
  };
  const out = (e) => { if (el && !el.contains(e.relatedTarget)) { el.classList.remove('mg-hot'); el = null; } };
  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerout', out, { passive: true });
}

function ripple() {
  document.addEventListener('pointerdown', (e) => {
    const b = e.target instanceof Element ? e.target.closest(BTN) : null;
    if (!b || e.button > 0 || typeof b.animate !== 'function') return;
    const r = b.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'mg-rip'; s.setAttribute('aria-hidden', 'true');
    s.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0) scale(0)`;
    b.appendChild(s);
    const k = (Math.hypot(r.width, r.height) * 2) / 24;
    const a = s.animate([
      { transform: `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0) scale(0)`, opacity: 1 },
      { transform: `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0) scale(${k.toFixed(2)})`, opacity: 0 },
    ], { duration: 620, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' });
    a.onfinish = () => s.remove();
  }, { passive: true });
}

let cast0 = false;
export function cast(level = 'subtle') {
  if (cast0 || typeof window === 'undefined') return;
  cast0 = true;
  document.documentElement.classList.add('mg-on');
  ripple();
  if (window.matchMedia(FINE).matches) track('.ph-btn, .l5-btn');
  if (level === 'magical') import('./spells-plus').then((m) => m.castPlus());
}
