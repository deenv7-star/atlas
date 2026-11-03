/**
 * X2's action button. One tap: the pill folds into a circle while it works, the circle draws a check,
 * then the row it lives in slides behind the "now" line. The action itself (opening WhatsApp, marking a
 * cleaning) runs on the tap, so the browser treats it as the user's gesture.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const EASE = [0.23, 1, 0.32, 1];

export default function MorphButton({ label, doneLabel, onRun, onSettled, className = '' }) {
  const [st, setSt] = useState('idle');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const go = () => {
    if (st !== 'idle') return;
    setSt('busy');
    onRun?.();
    timers.current.push(setTimeout(() => setSt('done'), 420));
    timers.current.push(setTimeout(() => onSettled?.(), 1150));
  };
  return (
    <motion.button
      type="button"
      layout
      onClick={go}
      className={`x2-morph is-${st} ${className}`}
      transition={{ layout: { duration: 0.32, ease: EASE } }}
      whileTap={st === 'idle' ? { scale: 0.97 } : undefined}
      aria-live="polite"
    >
      {st === 'idle' ? <motion.span key="l" layout="position" className="x2-morph-l">{label}</motion.span> : null}
      {st === 'busy' ? <span key="s" className="x2-spin" aria-label="שולחים" /> : null}
      {st === 'done' ? (
        <motion.span key="d" className="x2-morph-d" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: EASE }} />
          </svg>
          <span className="sr-only">{doneLabel}</span>
        </motion.span>
      ) : null}
    </motion.button>
  );
}
