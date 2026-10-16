import React, { useId, useMemo } from 'react';

const INDIGO = '#3E2BF1';

/** Tiny dependency-free SVG sparkline (kept out of the recharts chunk so auth pages stay light). */
export function Sparkline({ values, width = 120, height = 36, className }) {
  const id = useId().replace(/:/g, '');
  const pts = useMemo(() => {
    const v = values.length > 1 ? values : [0, ...values, 0];
    const max = Math.max(...v, 1);
    const min = Math.min(...v, 0);
    const span = max - min || 1;
    return v.map((x, i) => [3 + (i / (v.length - 1)) * (width - 6), height - 3 - ((x - min) / span) * (height - 6)]);
  }, [values, width, height]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className} aria-hidden>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={INDIGO} stopOpacity="0.16" />
          <stop offset="100%" stopColor={INDIGO} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} />
      <path d={line} fill="none" stroke={INDIGO} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.75" fill="#fff" stroke={INDIGO} strokeWidth="1.75" />
    </svg>
  );
}
