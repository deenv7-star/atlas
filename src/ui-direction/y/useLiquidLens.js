/**
 * Long-press-and-drag "liquid glass" lens for the phone tab bar (iOS 26 Apple Music behaviour).
 *
 * Press and hold (250ms) or slide sideways (8px) on the bar → a glass lens lifts (scale 1.15) over the
 * pressed tab, follows the finger, lights the tab beneath it, ticks a light haptic on every crossing, and on
 * release springs to the nearest tab and calls onCommit(index). A quick tap never lifts the lens, so the
 * links underneath keep their instant native click.
 *
 * Everything per-frame is written straight to the DOM (transform / opacity only, one rAF loop); React only
 * re-renders when the lit tab changes. Positions come from real rects, so RTL just works.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { nearestIndex, softClamp, stepSpring, shouldLift, LENS } from './lensMath';
import { hapticLift, hapticTick, hapticPrime, hapticEnd } from '@/lib/haptics';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/**
 * barRef: the <ul> capsule. lensRef: the lens element (absolute, inside the ul). tintRef: the indigo copy
 * of the row inside the lens. activeIndex: the tab that is current right now (lens rises from there when
 * pressed off-centre it still rises under the finger). onCommit(index): navigate.
 */
export function useLiquidLens({ barRef, lensRef, tintRef, itemSelector = ':scope > li', onCommit }) {
  const reduced = usePrefersReducedMotion();
  const [hot, setHot] = useState(-1); // tab lit under the lens, -1 when idle
  const [lifted, setLifted] = useState(false); // lens visible (drag + settle)
  const st = useRef(null);
  const suppressUntil = useRef(0); // swallow the click a browser may synthesize right after a drag
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  const paint = useCallback(() => {
    const s = st.current; const lens = lensRef.current; const tint = tintRef.current;
    if (!s || !lens) return;
    const x = s.x.v - s.lensW / 2; // lens left, in bar-local px
    const sc = s.scale.v;
    // scaleX narrows toward the tab-sized pill as the lens settles, so it lands as the resting pill does
    const sx = sc * (1 - s.morph.v * (1 - s.tabW / s.lensW));
    lens.style.transform = `translate3d(${x}px, ${s.lensTop}px, 0) scale(${sx}, ${sc})`;
    lens.style.opacity = String(Math.max(0, Math.min(1, s.alpha.v)));
    // the indigo copy stays put in bar space: inverse of the lens translate (scale magnifies it like glass)
    if (tint) tint.style.transform = `translate3d(${-x}px, ${-s.lensTop}px, 0)`;
  }, [lensRef, tintRef]);

  const loop = useCallback((t) => {
    const s = st.current;
    if (!s) return;
    const dt = Math.min(0.05, s.last ? (t - s.last) / 1000 : 1 / 60);
    s.last = t;
    const xs = s.dragging ? LENS.follow : LENS.snap;
    stepSpring(s.x, dt, xs.response, xs.damping);
    stepSpring(s.scale, dt, LENS.liftSpring.response, LENS.liftSpring.damping);
    stepSpring(s.alpha, dt, 0.22, 1);
    stepSpring(s.morph, dt, 0.3, 1);
    // landing: once the lens has nearly reached its tab and narrowed to pill size, cross-fade it into the resting pill
    if (s.released && s.alpha.target === 1 && ((Math.abs(s.x.v - s.x.target) < 2 && s.morph.v > 0.9) || t - s.releasedAt > 520)) { s.alpha.target = 0; setLifted(false); }
    paint();
    const done = s.released && s.alpha.target === 0 && s.alpha.v < 0.02;
    if (done) {
      s.raf = 0;
      if (lensRef.current) lensRef.current.style.opacity = '0';
      setHot(-1); st.current = null;
      return;
    }
    s.raf = requestAnimationFrame(loop);
  }, [paint, lensRef]);

  const kick = useCallback(() => {
    const s = st.current;
    if (s && !s.raf) { s.last = 0; s.raf = requestAnimationFrame(loop); }
  }, [loop]);

  const measure = useCallback(() => {
    const bar = barRef.current;
    // layout boxes (offset*), not rects, so a capsule caught mid-swell does not skew the geometry
    const br = bar.getBoundingClientRect();
    const r = { left: br.left + (br.width - bar.offsetWidth) / 2, width: bar.offsetWidth, height: bar.offsetHeight };
    const items = [...bar.querySelectorAll(itemSelector)];
    const centers = items.map((li) => li.offsetLeft + li.offsetWidth / 2);
    const tabW = items[0]?.offsetWidth || 56;
    const lensW = Math.round(tabW * LENS.widthRatio);
    const lensH = Math.round((items[0]?.offsetHeight || 52) + 12 - LENS.heightPad);
    return { r, centers, tabW, lensW, lensH, lensTop: (r.height - lensH) / 2, min: Math.min(...centers), max: Math.max(...centers) };
  }, [barRef, itemSelector]);

  const lift = useCallback((p) => {
    const s = st.current;
    s.dragging = true; s.active = true;
    s.x.v = s.x.target = s.downX; s.x.vel = 0;
    s.scale.v = 1; s.scale.vel = 0; s.scale.target = LENS.lift;
    s.alpha.v = 0.001; s.alpha.target = 1;
    s.morph.v = 0.6; s.morph.target = 0; // grows out of the pill footprint
    s.idx = nearestIndex(s.centers, s.downX);
    const lens = lensRef.current;
    if (lens) { lens.style.width = `${s.lensW}px`; lens.style.height = `${s.lensH}px`; }
    const tint = tintRef.current;
    if (tint) { tint.style.width = `${s.r.width}px`; tint.style.height = `${s.r.height}px`; }
    try { barRef.current.setPointerCapture(p); } catch { /* pointer already gone */ }
    setHot(s.idx); setLifted(true);
    hapticLift();
    paint(); kick();
  }, [barRef, lensRef, tintRef, paint, kick]);

  const finish = useCallback((commit) => {
    const s = st.current;
    if (!s || s.released) return;
    clearTimeout(s.timer);
    if (!s.dragging) { st.current = null; return; }
    s.dragging = false; s.released = true; s.releasedAt = performance.now();
    const idx = commit ? nearestIndex(s.centers, s.x.v + s.vx * 0.06) : (s.restIdx >= 0 ? s.restIdx : s.idx);
    s.x.target = s.centers[idx]; s.x.vel = s.vx; // hand the finger's velocity to the snap
    s.scale.target = 1; s.morph.target = 1; // alpha fades in the loop as it lands
    suppressUntil.current = performance.now() + 450;
    if (idx !== s.idx) { s.idx = idx; hapticTick(); }
    setHot(idx);
    hapticEnd();
    kick();
    if (commit) commitRef.current?.(idx);
  }, [kick]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || reduced) return undefined;

    const onDown = (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      if (st.current?.dragging) return; // ignore a second finger mid-drag
      const m = measure();
      const downX = e.clientX - m.r.left;
      const restIdx = [...bar.querySelectorAll(itemSelector)].findIndex((li) => li.querySelector('[aria-current="page"], .on'));
      const prev = st.current;
      if (prev?.raf) cancelAnimationFrame(prev.raf);
      if (prev?.released) { if (lensRef.current) lensRef.current.style.opacity = '0'; setLifted(false); setHot(-1); } // tapped mid-settle
      st.current = {
        ...m, downX, startX: e.clientX, startY: e.clientY, t0: e.timeStamp, pid: e.pointerId, restIdx,
        dragging: false, active: false, idx: -1, vx: 0, lastMoveX: e.clientX, lastMoveT: e.timeStamp, raf: 0, last: 0,
        x: { v: downX, vel: 0, target: downX }, scale: { v: 1, vel: 0, target: 1 }, alpha: { v: 0, vel: 0, target: 0 }, morph: { v: 0, vel: 0, target: 0 },
        timer: setTimeout(() => { const s = st.current; if (s && !s.dragging && s.pid === e.pointerId) lift(e.pointerId); }, LENS.holdMs),
      };
      hapticPrime();
    };

    const onMove = (e) => {
      const s = st.current;
      if (!s || e.pointerId !== s.pid) return;
      if (!s.dragging) {
        const dx = e.clientX - s.startX; const dy = e.clientY - s.startY;
        if (shouldLift({ heldMs: 0, dx, dy }, LENS.holdMs, LENS.moveThreshold)) lift(e.pointerId);
        else if (Math.abs(dy) > LENS.moveThreshold * 2) { clearTimeout(s.timer); st.current = null; return; }
        if (!st.current?.dragging) return;
      }
      e.preventDefault();
      const dtm = Math.max(1, e.timeStamp - s.lastMoveT);
      s.vx = s.vx * 0.6 + ((e.clientX - s.lastMoveX) / dtm) * 1000 * 0.4; // px/s, smoothed
      s.lastMoveX = e.clientX; s.lastMoveT = e.timeStamp;
      // the capsule grows a touch (BAR_LIFT) around its centre while lifted: map the finger back into bar space
      const raw = s.r.width / 2 + (e.clientX - s.r.left - s.r.width / 2) / LENS.barLift;
      s.x.target = softClamp(raw, s.min, s.max, s.tabW * 0.45);
      const idx = nearestIndex(s.centers, raw);
      if (idx !== s.idx) { s.idx = idx; setHot(idx); hapticTick(); }
      kick();
    };

    const onUp = (e) => { const s = st.current; if (s && e.pointerId === s.pid) finish(true); };
    const onCancel = (e) => { const s = st.current; if (s && e.pointerId === s.pid) finish(false); };
    // after a drag the browser may still synthesize a click on whatever is under the finger: swallow it
    const onClick = (e) => { if (performance.now() < suppressUntil.current) { e.preventDefault(); e.stopPropagation(); suppressUntil.current = 0; } };
    const onLost = (e) => { const s = st.current; if (s && e.pointerId === s.pid && s.dragging) finish(false); };
    const noMenu = (e) => { if (st.current) e.preventDefault(); };

    bar.addEventListener('pointerdown', onDown);
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onCancel);
    bar.addEventListener('lostpointercapture', onLost);
    bar.addEventListener('click', onClick, true);
    bar.addEventListener('contextmenu', noMenu);
    return () => {
      bar.removeEventListener('pointerdown', onDown);
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      bar.removeEventListener('pointercancel', onCancel);
      bar.removeEventListener('lostpointercapture', onLost);
      bar.removeEventListener('click', onClick, true);
      bar.removeEventListener('contextmenu', noMenu);
      const s = st.current;
      if (s) { clearTimeout(s.timer); if (s.raf) cancelAnimationFrame(s.raf); }
      st.current = null;
    };
  }, [barRef, lensRef, itemSelector, reduced, measure, lift, finish, kick]);

  return { hot, lifted, enabled: !reduced };
}
