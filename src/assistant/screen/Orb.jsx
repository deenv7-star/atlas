/**
 * A: the voice, drawn. One indigo body on navy that breathes while listening, ripples with the owner's voice,
 * turns a quiet arc while thinking and swells with atlas's voice. Canvas, one rAF loop, levels read from the
 * audio graph (never React state). Reduced motion: one still frame.
 */
import React, { useEffect, useRef } from 'react';

export function Orb({ state, levels, size = 220, label = '' }) {
  const ref = useRef(null);
  const st = useRef(state);
  st.current = state;
  useEffect(() => {
    const c = ref.current; if (!c) return undefined;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const S = size * 1.7;
    c.width = S * dpr; c.height = S * dpr;
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0; let lv = 0; let rot = 0;
    const draw = (now) => {
      const t = now / 1000;
      const s = st.current;
      const { mic = 0, out = 0 } = levels?.() || {};
      const target = s === 'hearing' ? mic : s === 'speaking' ? out : 0;
      lv += (target - lv) * 0.18;
      const r = size / 2 * (0.78 + (s === 'speaking' ? lv * 0.1 : 0) + (s === 'listening' ? Math.sin(t * 1.6) * 0.012 : 0));
      const cx = S / 2; const cy = S / 2;
      g.clearRect(0, 0, S, S);
      // light around it: indigo, soft, brighter while someone speaks
      const glow = g.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.75);
      glow.addColorStop(0, `rgba(62, 43, 241, ${0.42 + lv * 0.35})`);
      glow.addColorStop(1, 'rgba(62, 43, 241, 0)');
      g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, r * 1.75, 0, Math.PI * 2); g.fill();
      // the body: a circle that ripples with the voice
      const amp = (s === 'hearing' || s === 'speaking') ? 0.012 + lv * 0.03 : 0.006; // a ripple, not a blob
      g.beginPath();
      for (let i = 0; i <= 120; i += 1) {
        const a = (i / 120) * Math.PI * 2;
        const k = 1 + amp * (Math.sin(a * 3 + t * 2.1) + 0.6 * Math.sin(a * 5 - t * 1.7) + 0.35 * Math.sin(a * 2 + t * 3.3));
        const x = cx + Math.cos(a) * r * k; const y = cy + Math.sin(a) * r * k;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.closePath();
      g.fillStyle = '#3E2BF1'; g.fill();
      // a single soft highlight, high on the body (light from above)
      const hi = g.createRadialGradient(cx - r * 0.25, cy - r * 0.45, 0, cx - r * 0.25, cy - r * 0.45, r * 1.1);
      hi.addColorStop(0, 'rgba(255, 255, 255, 0.28)'); hi.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = hi; g.fill();
      g.lineWidth = 1; g.strokeStyle = 'rgba(255, 255, 255, 0.22)'; g.stroke();
      // thinking: one quiet arc that turns
      if (s === 'thinking' || s === 'connecting') {
        rot += reduce ? 0 : 0.045;
        g.beginPath(); g.arc(cx, cy, r * 1.22, rot, rot + 1.1);
        g.lineWidth = 2; g.lineCap = 'round'; g.strokeStyle = 'rgba(255, 255, 255, 0.7)'; g.stroke();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, levels]);
  return (
    <div className="ax-orb" style={{ width: size, height: size }} role="img" aria-label={label}>
      <canvas ref={ref} style={{ position: 'absolute', width: size * 1.7, height: size * 1.7, insetInlineStart: -size * 0.35, top: -size * 0.35 }} />
    </div>
  );
}
