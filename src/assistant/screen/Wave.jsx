/**
 * B: the voice as a line of light. 32 rounded bars across the navy stage: a slow idle swell while listening,
 * the owner's voice while hearing, a soft travelling pulse while thinking, atlas's voice while speaking.
 * Canvas, one rAF loop, levels read from the audio graph. Reduced motion: one still frame.
 */
import React, { useEffect, useRef } from 'react';

export function Wave({ state, levels, height = 96, label = '' }) {
  const ref = useRef(null);
  const st = useRef(state);
  st.current = state;
  useEffect(() => {
    const c = ref.current; if (!c) return undefined;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = c.clientWidth || 300; const H = height;
    const size = () => { W = c.clientWidth || 300; c.width = W * dpr; c.height = H * dpr; };
    size();
    const g = c.getContext('2d');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const N = 32; const vals = new Array(N).fill(0.08);
    let raf = 0; let lv = 0;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(size) : null; ro?.observe(c);
    const draw = (now) => {
      const t = now / 1000; const s = st.current;
      const { mic = 0, out = 0 } = levels?.() || {};
      lv += ((s === 'hearing' ? mic : s === 'speaking' ? out : 0) - lv) * 0.2;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      const gap = Math.max(4, W / N * 0.42); const bw = Math.max(3, W / N - gap);
      for (let i = 0; i < N; i += 1) {
        const x = i / (N - 1); const mid = Math.cos((x - 0.5) * Math.PI) ** 1.5; // taller in the middle, quiet at the edges
        let target;
        if (s === 'thinking' || s === 'connecting') target = 0.1 + 0.28 * Math.max(0, Math.cos((x - ((t * 0.6) % 1.4) + 0.2) * 9)) * mid;
        else if (s === 'hearing' || s === 'speaking') target = 0.1 + mid * lv * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.9 + t * 6) * Math.cos(i * 0.37 - t * 3.1)));
        else target = 0.08 + 0.05 * mid * (1 + Math.sin(t * 1.4 + i * 0.35));
        vals[i] += (target - vals[i]) * 0.25;
        const h = Math.max(bw, vals[i] * H);
        const px = i * (bw + gap) + (W - N * (bw + gap) + gap) / 2;
        g.fillStyle = s === 'speaking' ? '#fff' : s === 'hearing' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
        g.beginPath();
        const r = bw / 2; const y = (H - h) / 2;
        g.moveTo(px, y + r); g.arc(px + r, y + r, r, Math.PI, 0); g.lineTo(px + bw, y + h - r); g.arc(px + r, y + h - r, r, 0, Math.PI); g.closePath(); g.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, [height, levels]);
  return <canvas ref={ref} className="bx-wave" style={{ width: '100%', height }} role="img" aria-label={label} />;
}
