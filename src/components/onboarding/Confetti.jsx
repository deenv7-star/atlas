/**
 * A short, quiet burst for the "המערכת שלכם מוכנה" moment. 50 small pieces in the brand blues and navy,
 * one amber dot (2%). Transform + opacity only, about 1.6s, then gone. Nothing at all with reduced motion.
 */
import React, { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

const COLORS = ['#3E2BF1', '#3E2BF1', '#6A5CF5', '#B9B2FA', '#1B2656', '#D9D5FD'];

export default function Confetti({ count = 50, className = '' }) {
  const still = useReducedMotion();
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.sin(i * 12.9898) * 0.35);
    const dist = 120 + ((i * 37) % 160);
    return {
      i,
      x: Math.round(Math.cos(angle) * dist),
      y: Math.round(Math.sin(angle) * dist * 0.7 - 40),
      fall: 90 + ((i * 53) % 120),
      r: ((i * 71) % 540) - 270,
      d: (i % 7) * 18,
      w: i % 3 === 0 ? 6 : 8,
      h: i % 3 === 0 ? 6 : 12,
      round: i % 3 === 0,
      c: i === 17 ? '#F5B83D' : COLORS[i % COLORS.length],
    };
  }), [count]);
  if (still) return null;
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-visible ${className}`}>
      <style>{`
        @keyframes atlas-confetti {
          0% { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0.6); opacity: 0; }
          12% { opacity: 1; }
          55% { transform: translate(-50%, -50%) translate(var(--x), var(--y)) rotate(calc(var(--r) * 0.6)) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--x), calc(var(--y) + var(--f))) rotate(var(--r)) scale(0.9); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.i}
          className="absolute left-1/2 top-1/2 block"
          style={{
            width: p.w, height: p.h, background: p.c, borderRadius: p.round ? 999 : 2,
            '--x': `${p.x}px`, '--y': `${p.y}px`, '--f': `${p.fall}px`, '--r': `${p.r}deg`,
            animation: `atlas-confetti 1600ms cubic-bezier(0.23, 1, 0.32, 1) ${p.d}ms both`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
