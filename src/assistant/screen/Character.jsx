/**
 * atlas, alive. The same speech-bubble face as everywhere in the app (atlasFace.js), driven by a small spring
 * engine instead of CSS loops, so every moment is physical and interruptible:
 *   idle       breathing (volume-preserving squash/stretch), blinks on an irregular rhythm (sometimes twice),
 *              eyes that wander in quick saccades and settle
 *   listening  leans in, eyes a touch wider, looking at you
 *   hearing    your voice moves her: eyes widen with the mic level, a small nod on each peak
 *   thinking   glances up and aside in saccades, head tilt, eyes narrowed
 *   speaking   bounces with her own voice (stretch on the syllable, squash on release), glow brightens
 *   happy      a jump with anticipation, squash on landing, smiling eyes   (pulse 'happy')
 *   nod        a small understanding nod                                      (pulse 'nod')
 *   look       eyes snap to a point (a new card, your finger)                 (gaze prop / pointer)
 *   concerned  droops, apologetic lids                                       (mood 'concerned')
 * One rAF loop, transform/opacity only, paused when the tab is hidden. Reduced motion: still, moods only.
 */
import React, { useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react';
import { faceMarkup } from '@/components/mascot/atlasFace.js';
import '@/components/mascot/atlasFace.css';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function spring(k, c) { return { x: 0, v: 0, t: 0, k, c }; }
// Semi-implicit Euler in fixed sub-steps of ≤ 1/240 s: stiff springs (the eyes) stay stable even when a frame
// takes 33 ms (one slow frame used to make the eye spring overshoot and grow: "her eyes run off to the sides").
function step(s, dt) {
  const n = Math.max(1, Math.ceil(dt * 240)); const h = dt / n;
  for (let i = 0; i < n; i += 1) { const a = s.k * (s.t - s.x) - s.c * s.v; s.v += a * h; s.x += s.v * h; }
  if (!Number.isFinite(s.x) || !Number.isFinite(s.v)) { s.x = s.t; s.v = 0; } // never leave a broken value on screen
  return s.x;
}
/* Eye travel limits, in face units (viewBox 120; the eyes sit 28 units from each side, 33 from the top):
   the pupils move at most 4.5 sideways and 3.5 up/down, so they always stay well inside the face. */
const GAZE_X = 4.5; const GAZE_Y = 3.5; const EYE_MIN = 0.8; const EYE_MAX = 1.22;

export function useReducedMotion() {
  const [r, setR] = React.useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)'); if (!m) return undefined;
    const on = () => setR(m.matches); m.addEventListener?.('change', on); return () => m.removeEventListener?.('change', on);
  }, []);
  return r;
}

/**
 * <Character state levels mood pulse gaze size />
 *   state  voice state (idle|connecting|listening|hearing|thinking|speaking|ended|error)
 *   levels () => ({ mic, out }) 0..1, read every frame
 *   mood   'neutral' | 'happy' | 'concerned' (sticky expression)
 *   pulse  { kind: 'happy'|'nod'|'hop'|'word', n } — bump n to fire once
 *   gaze   { x, y } in client px, or null — eyes look there (new card, a tap)
 *   from   DOMRect the character flies in from (the tab bar disc), once on mount
 */
export function Character({ state = 'idle', levels, mood = 'neutral', pulse, gaze, size = 168, from = null, className = '', shadow = true, label = 'atlas' }) {
  const rid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const wrap = useRef(null); const body = useRef(null); const shadowRef = useRef(null);
  const html = useMemo(() => ({ __html: faceMarkup(`ch${rid}`, 'neutral', { still: true }) }), [rid]);
  const reduced = useReducedMotion();
  const live = useRef({ state, mood, levels, gaze: null });
  live.current.state = state; live.current.mood = mood; live.current.levels = levels; live.current.gaze = gaze;

  // the expression layer (smile eyes, apologetic lids) stays in the face CSS
  useLayoutEffect(() => {
    const svg = body.current?.querySelector('svg'); if (!svg) return;
    svg.dataset.mood = mood === 'happy' ? 'happy' : mood === 'concerned' || state === 'error' ? 'concerned' : 'neutral';
  }, [mood, state]);

  const S = useRef(null);
  if (!S.current) {
    S.current = {
      y: spring(190, 13), sx: spring(260, 15), sy: spring(260, 15), rot: spring(140, 12), lean: spring(120, 16),
      gx: spring(900, 48), gy: spring(900, 48), eye: spring(700, 40), glow: spring(60, 14), fx: spring(70, 15), fy: spring(70, 15), fs: spring(70, 15),
      blinkAt: 1.2, blink: -1, double: false, sacAt: 0.6, sx0: 0, sy0: 0, nodAt: 0, lastMic: 0, prevOut: 0, t0: 0,
    };
    ['sx', 'sy', 'lean', 'eye', 'fs'].forEach((k) => { S.current[k].x = 1; S.current[k].t = 1; });
    S.current.glow.x = 0.75; S.current.glow.t = 0.75;
  }

  // fly in from the tab bar disc (FLIP): start where the disc was, spring home
  useLayoutEffect(() => {
    if (!from || reduced || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    const s = S.current;
    s.fx.x = (from.left + from.width / 2) - (r.left + r.width / 2);
    s.fy.x = (from.top + from.height / 2) - (r.top + r.height / 2);
    s.fs.x = clamp(from.width / r.width, 0.15, 1);
    s.fy.v = -900; // a little arc upward on the way
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // pulses: impulses into the springs
  const lastPulse = useRef(pulse?.n);
  useEffect(() => {
    if (!pulse || pulse.n === lastPulse.current) return; lastPulse.current = pulse.n;
    const s = S.current;
    if (pulse.kind === 'happy') { s.sy.v -= 3.2; s.sx.v += 2.4; setTimeout(() => { s.y.v -= 520; s.sy.v += 5; s.sx.v -= 3.4; }, 110); }
    else if (pulse.kind === 'hop') { s.y.v -= 300; s.sy.v += 2.6; s.sx.v -= 1.8; }
    else if (pulse.kind === 'nod') { s.y.v += 160; s.gy.v += 40; setTimeout(() => { s.y.v += 120; s.gy.v += 30; }, 260); }
    else if (pulse.kind === 'word') { s.sy.v += 0.9; s.sx.v -= 0.6; s.y.v -= 50; }
    else if (pulse.kind === 'shake') { s.rot.v += 70; setTimeout(() => { s.rot.v -= 120; }, 140); setTimeout(() => { s.rot.v += 70; }, 290); }
  }, [pulse]);

  // eyes follow the owner's finger anywhere on the screen
  const touch = useRef({ x: 0, y: 0, until: 0 });
  useEffect(() => {
    if (reduced) return undefined;
    const on = (e) => { touch.current = { x: e.clientX, y: e.clientY, until: performance.now() + 1600 }; };
    window.addEventListener('pointerdown', on, { passive: true });
    window.addEventListener('pointermove', on, { passive: true });
    return () => { window.removeEventListener('pointerdown', on); window.removeEventListener('pointermove', on); };
  }, [reduced]);

  useEffect(() => {
    const el = body.current; const svg = el?.querySelector('svg'); if (!svg) return undefined;
    const gazeEl = svg.querySelector('.af-gaze'); const eyesEl = svg.querySelector('.af-eyes'); const glowEl = svg.querySelector('.af-glow');
    [gazeEl, eyesEl, glowEl].forEach((n) => n && (n.style.transition = 'none'));
    if (reduced) { el.style.transform = ''; return undefined; }
    let raf = 0; let last = performance.now(); const s = S.current;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now; const t = now / 1000;
      const { state: st, levels: lv, gaze: gz } = live.current;
      const { mic = 0, out = 0 } = (lv && lv()) || {};
      const sz = el.clientWidth || size;
      // breathing: slow, volume-preserving
      const br = Math.sin(t * (Math.PI * 2) / 3.8);
      let ty = -2.2 * br; let tsx = 1 - 0.014 * br; let tsy = 1 + 0.02 * br; let trot = 0; let tlean = 1; let teye = 1; let tglow = 0.72;
      let tgx = s.sx0; let tgy = s.sy0;
      // saccades: quick eye jumps between small random points
      if (t > s.sacAt) {
        s.sac = (s.sac || 0) + 1;
        if (s.sac % 2 === 0) { s.sx0 = 0; s.sy0 = 0; s.sacAt = t + rnd(1.2, 2.4); } // every other glance comes home to the centre
        else if (st === 'thinking' || st === 'connecting') { const side = Math.random() < 0.5 ? -1 : 1; s.sx0 = side * rnd(2.5, 3.5); s.sy0 = -rnd(2, 3); s.sacAt = t + rnd(0.7, 1.2); }
        else if (st === 'hearing' || st === 'listening') { s.sx0 = rnd(-1, 1); s.sy0 = rnd(0.5, 1.5); s.sacAt = t + rnd(1.4, 2.6); }
        else { s.sx0 = rnd(-2, 2); s.sy0 = rnd(-1.2, 1.2); s.sacAt = t + rnd(1.6, 3.6); }
      }
      if (st === 'listening') { tlean = 1.025; teye = 1.05; ty -= 2; }
      if (st === 'hearing') {
        tlean = 1.05 + mic * 0.05; teye = 1.08 + mic * 0.12; ty -= 4; trot = Math.sin(t * 1.7) * 2.2; tglow = 0.85 + mic * 0.15;
        if (mic - s.lastMic > 0.12 && t > s.nodAt) { s.y.v += 70; s.gy.v += 20; s.nodAt = t + 0.45; } // a listener's little nod
      }
      if (st === 'thinking' || st === 'connecting') { trot = 5 * Math.sin(t * 0.9); teye = 0.84; ty -= 1 + Math.sin(t * 2.2) * 1.5; tglow = 0.6 + 0.25 * (0.5 + 0.5 * Math.sin(t * 3)); }
      if (st === 'speaking') {
        const a = clamp(out, 0, 1);
        tsy += a * 0.1; tsx -= a * 0.065; ty -= a * 12; teye = 0.94 - a * 0.08; tglow = 0.85 + a * 0.3; trot = Math.sin(t * 2.4) * 1.6;
        if (a - s.prevOut > 0.16) { s.sy.v += 1.1; s.sx.v -= 0.7; } // the syllable kick
      }
      if (st === 'error') { ty += 5; tlean = 0.97; trot = -3; teye = 0.9; tglow = 0.45; }
      if (st === 'ended' || st === 'idle') { tglow = 0.62; }
      s.lastMic = mic; s.prevOut = out;
      // look at a point: a new card (gaze prop) wins over a recent touch, which wins over wandering
      const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
      const aim = gz || (touch.current.until > now ? touch.current : null);
      if (aim && Number.isFinite(aim.x) && Number.isFinite(aim.y)) { const dx = aim.x - cx; const dy = aim.y - cy; const d = Math.hypot(dx, dy) || 1; const m = Math.min(1, d / 260); tgx = (dx / d) * 3.8 * m; tgy = (dy / d) * 3 * m; teye = Math.max(teye, 1.04); }
      // blink: irregular, sometimes double; never while happy (smiling eyes)
      if (s.blink < 0 && t > s.blinkAt && live.current.mood !== 'happy') { s.blink = t; s.double = Math.random() < 0.22; }
      let lid = 1;
      if (s.blink >= 0) {
        const e = (t - s.blink) / 0.16;
        if (e >= 1) { if (s.double) { s.double = false; s.blink = t + 0.08; } else { s.blink = -1; s.blinkAt = t + (st === 'thinking' ? rnd(1.2, 2.6) : rnd(2.2, 5.8)); } }
        else if (e >= 0) lid = 1 - Math.sin(e * Math.PI) * 0.92;
      }
      s.y.t = ty * (sz / 168); s.sx.t = tsx; s.sy.t = tsy; s.rot.t = trot; s.lean.t = tlean; s.eye.t = teye; s.glow.t = tglow; s.gx.t = clamp(tgx, -GAZE_X, GAZE_X); s.gy.t = clamp(tgy, -GAZE_Y, GAZE_Y);
      const y = step(s.y, dt); const sx = step(s.sx, dt); const sy = step(s.sy, dt); const rot = step(s.rot, dt); const lean = step(s.lean, dt);
      const gx = step(s.gx, dt); const gy = step(s.gy, dt); const eye = step(s.eye, dt); const glow = step(s.glow, dt);
      const fx = step(s.fx, dt); const fy = step(s.fy, dt); const fs = step(s.fs, dt);
      el.style.transform = `translate3d(${fx.toFixed(2)}px, ${(y + fy).toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${(sx * lean * fs).toFixed(4)}, ${(sy * lean * fs).toFixed(4)})`;
      const ex = clamp(gx, -GAZE_X, GAZE_X); const ey = clamp(gy, -GAZE_Y, GAZE_Y); const es = clamp(eye, EYE_MIN, EYE_MAX); // hard limits, whatever the springs do
      if (gazeEl) gazeEl.style.transform = `translate(${ex.toFixed(2)}px, ${ey.toFixed(2)}px)`;
      if (eyesEl) eyesEl.style.transform = `scale(${(0.5 + es * 0.5).toFixed(3)}, ${(es * lid).toFixed(3)})`;
      if (glowEl) glowEl.style.opacity = clamp(glow, 0, 1).toFixed(3);
      if (shadowRef.current) { const lift = clamp(-y / (sz * 0.25), -0.3, 1); shadowRef.current.style.transform = `translateX(${fx.toFixed(1)}px) scale(${(1 - lift * 0.35) * fs}, 1)`; shadowRef.current.style.opacity = String(clamp((0.9 - lift * 0.5) * fs, 0, 1)); }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); };
    const vis = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    start(); document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); };
  }, [reduced, size]);

  return (
    <div ref={wrap} className={`ch ${className}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      {shadow ? <i ref={shadowRef} className="ch-shadow" aria-hidden="true" /> : null}
      <span ref={body} className="ch-body" dangerouslySetInnerHTML={html} />
    </div>
  );
}
