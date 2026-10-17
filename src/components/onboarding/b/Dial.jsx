/**
 * A clock dial for check-in / check-out: drag the handle around a 24-hour face (snaps to 30 minutes),
 * or use the big − / + buttons. Keyboard: arrows on the slider move 30 minutes.
 */
import React, { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

const toMin = (t) => { const [h, m] = String(t || '15:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const toHHMM = (m) => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

export function TimeDial({ value, onChange, label, color = '#3E2BF1', min = 6 * 60, max = 23 * 60 }) {
  const ref = useRef(null);
  const m = toMin(value);
  const clamp = (v) => Math.max(min, Math.min(max, v));
  const angle = (m / 1440) * 360; // 0 at top, clockwise
  const R = 92;
  const rad = ((angle - 90) * Math.PI) / 180;
  const hx = 110 + R * Math.cos(rad);
  const hy = 110 + R * Math.sin(rad);
  const fromPointer = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    let a = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (a < 0) a += 360;
    onChange(toHHMM(clamp(Math.round(((a / 360) * 1440) / 30) * 30)));
  };
  const arcEnd = { x: hx, y: hy };
  const large = angle > 180 ? 1 : 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={ref}
        className="relative h-[220px] w-[220px] touch-none select-none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
        onPointerMove={(e) => { if (e.buttons) fromPointer(e); }}
        role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={m} aria-valuetext={value}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); onChange(toHHMM(clamp(m + 30))); }
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); onChange(toHHMM(clamp(m - 30))); }
        }}
      >
        <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden>
          <circle cx="110" cy="110" r="106" fill="#fff" />
          <circle cx="110" cy="110" r={R} fill="none" stroke="#EEF0F6" strokeWidth="14" />
          <path d={`M110 ${110 - R} A ${R} ${R} 0 ${large} 1 ${arcEnd.x} ${arcEnd.y}`} fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="14" strokeLinecap="round" />
          {Array.from({ length: 24 }, (_, h) => {
            const a = ((h / 24) * 360 - 90) * (Math.PI / 180);
            const big = h % 3 === 0;
            return (
              <g key={h}>
                <line x1={110 + 74 * Math.cos(a)} y1={110 + 74 * Math.sin(a)} x2={110 + (big ? 66 : 70) * Math.cos(a)} y2={110 + (big ? 66 : 70) * Math.sin(a)} stroke="#B3B9CF" strokeWidth={big ? 2.5 : 1.5} strokeLinecap="round" />
                {big ? <text x={110 + 54 * Math.cos(a)} y={110 + 54 * Math.sin(a) + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="#646B85">{h}</text> : null}
              </g>
            );
          })}
          <line x1="110" y1="110" x2={110 + 60 * Math.cos(rad)} y2={110 + 60 * Math.sin(rad)} stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx={hx} cy={hy} r="15" fill={color} stroke="#fff" strokeWidth="4" />
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-white/90 px-2 text-[34px] font-extrabold tabular-nums text-navy-900">{value}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="ob-round ob-press" onClick={() => onChange(toHHMM(clamp(m - 30)))} aria-label={`${label}: חצי שעה מוקדם יותר`}><Minus className="h-5 w-5" strokeWidth={2.25} aria-hidden /></button>
        <span className="min-w-[96px] text-center text-[15px] font-semibold text-ink-600">חצי שעה</span>
        <button type="button" className="ob-round ob-press" onClick={() => onChange(toHHMM(clamp(m + 30)))} aria-label={`${label}: חצי שעה מאוחר יותר`}><Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden /></button>
      </div>
    </div>
  );
}
