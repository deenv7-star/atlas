/**
 * X3's signature: press and hold. The button fills across in 0.6s; when it is full it turns into a
 * check (and the phone gives a tiny tick), and letting go does it. Let go early and it drains back,
 * nothing happens. Keyboard / screen readers: Enter or Space does it straight away.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const HOLD = 600;
const EASE = [0.23, 1, 0.32, 1];

export default function HoldButton({ label, armedLabel = 'שחררו', doneLabel, onDone, done: doneProp = false }) {
  const [st, setSt] = useState(doneProp ? 'done' : 'idle'); // idle | holding | armed | done
  const t = useRef(null);
  const viaPointer = useRef(false);
  useEffect(() => () => clearTimeout(t.current), []);
  useEffect(() => { if (doneProp) setSt('done'); }, [doneProp]);

  const down = (e) => {
    if (st !== 'idle') return;
    viaPointer.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setSt('holding');
    t.current = setTimeout(() => { setSt('armed'); try { navigator.vibrate?.(12); } catch { /* no haptics */ } }, HOLD);
  };
  const up = () => {
    clearTimeout(t.current);
    if (st === 'armed') { setSt('done'); onDone?.(); } else if (st === 'holding') setSt('idle');
  };
  const key = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && st === 'idle') { e.preventDefault(); setSt('done'); onDone?.(); }
  };

  return (
    <button
      type="button"
      className={`x3-hold is-${st}`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => { clearTimeout(t.current); if (st !== 'done') setSt('idle'); }}
      onKeyDown={key}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={st === 'done' ? doneLabel : `${label}. לחצו Enter לביצוע`}
    >
      <span className="x3-hold-fill" aria-hidden />
      <span className="x3-hold-l">
        {st === 'done' || st === 'armed' ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.28, ease: EASE }} />
          </svg>
        ) : null}
        {st === 'done' ? doneLabel : st === 'armed' ? armedLabel : label}
      </span>
    </button>
  );
}
