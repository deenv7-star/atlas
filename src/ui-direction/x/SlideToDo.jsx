/**
 * X1's signature: the next thing is done in one gesture. Slide the knob across (toward the reading
 * direction's end, i.e. left in RTL) and it happens: the track fills, the arrow becomes a check that
 * draws itself, the label says what went out. A tap on the knob (or Enter) does the same, so it is
 * never gesture-only. Interruptible: let go early and it springs back.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const KNOB = 52; const PAD = 6;

export default function SlideToDo({ label, doneLabel, onDone, resetKey }) {
  const track = useRef(null);
  const x = useMotionValue(0);
  const [max, setMax] = useState(240);
  const [done, setDone] = useState(false);
  const moved = useRef(false);

  useLayoutEffect(() => {
    const el = track.current; if (!el) return undefined;
    const fit = () => setMax(Math.max(80, el.clientWidth - KNOB - PAD * 2));
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => { setDone(false); x.set(0); }, [resetKey, x]);

  const fillW = useTransform(x, (v) => KNOB + PAD * 2 + Math.min(max, Math.max(0, -v)));
  const labelO = useTransform(x, [0, -max * 0.55], [1, 0]);

  const finish = () => {
    if (done) return;
    setDone(true);
    onDone?.();
    animate(x, -max, { type: 'spring', duration: 0.35, bounce: 0 });
  };

  return (
    <div ref={track} className={`x1-slide${done ? ' is-done' : ''}`}>
      <motion.span className="x1-slide-fill" style={{ width: done ? '100%' : fillW }} aria-hidden />
      <motion.span className="x1-slide-l" style={{ opacity: done ? 0 : labelO }} aria-hidden>{label}</motion.span>
      {done ? (
        <motion.span className="x1-slide-done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: 0.12 }}>
          {doneLabel}
        </motion.span>
      ) : null}
      <motion.button
        type="button"
        className="x1-knob"
        aria-label={label}
        drag={done ? false : 'x'}
        dragConstraints={{ left: -max, right: 0 }}
        dragElastic={0.04}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => { moved.current = true; }}
        onDragEnd={() => {
          if (-x.get() > max * 0.62) finish();
          else animate(x, 0, { type: 'spring', duration: 0.4, bounce: 0.2 });
          setTimeout(() => { moved.current = false; }, 0);
        }}
        onClick={() => { if (!moved.current) finish(); }}
        whileTap={{ scale: 0.96 }}
      >
        {done ? (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1], delay: 0.08 }} />
          </svg>
        ) : <ArrowLeft strokeWidth={2} />}
      </motion.button>
    </div>
  );
}
