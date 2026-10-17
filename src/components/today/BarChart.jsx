/**
 * v7 revenue bars (owner refs: one highlighted bar + a floating tooltip pill).
 * Dependency-free: bars are plain elements that grow from the baseline (CSS, reduced-motion safe).
 * The current month is highlighted indigo; hovering or focusing another month moves the highlight.
 * Time reads left-to-right like every finance chart, newest month on the right.
 */
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/stay/format';

function compact(n) {
  if (n >= 1000) return `₪${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: n >= 100000 ? 0 : 1 })}K`;
  return `₪${Math.round(n)}`;
}

/** `height` in px, or 'fill' to take the remaining height of a flex column (min 220px). */
export default function BarChart({ data, height = 240, className }) {
  const fill = height === 'fill';
  const last = data.length - 1;
  const [sel, setSel] = useState(null);
  const active = sel ?? last;
  const max = Math.max(...data.map((d) => d.value), 1);
  const top = Math.ceil((max * 1.15) / 5000) * 5000 || 5000;
  const grid = [top, (top * 2) / 3, top / 3, 0];
  return (
    <div className={cn('relative', fill && 'flex flex-1 flex-col', className)} dir="ltr">
      <div className={cn('relative', fill && 'min-h-[220px] flex-1')} style={fill ? undefined : { height }} role="list" aria-label="הכנסות לפי חודש">
        {/* grid lines + y labels */}
        {grid.map((g, i) => (
          <div key={g} aria-hidden className="absolute inset-x-0 flex items-center gap-2" style={{ top: `${(i / (grid.length - 1)) * 100}%`, transform: 'translateY(-50%)' }}>
            <span className="w-10 shrink-0 text-right text-[11px] tabular text-ink-400">{g ? compact(g) : '0'}</span>
            <span className="h-px flex-1 border-t border-dashed border-[#E6E8F0]" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-12 right-0 flex items-end justify-between gap-[6%] px-1 md:gap-[5%]">
          {data.map((d, i) => {
            const h = Math.max(3, (d.value / top) * 100);
            const on = i === active;
            return (
              <div
                key={d.key}
                role="listitem"
                tabIndex={0}
                aria-label={`${d.long}: ${formatMoney(d.value)}`}
                onMouseEnter={() => setSel(i)}
                onMouseLeave={() => setSel(null)}
                onFocus={() => setSel(i)}
                onBlur={() => setSel(null)}
                className="relative flex h-full flex-1 cursor-default items-end justify-center outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-brand-600 focus-visible:[&>span]:ring-offset-2"
              >
                {on ? (
                  <span
                    key={`tip-${i}`}
                    className="v7-tip pointer-events-none absolute z-10 whitespace-nowrap rounded-full bg-navy-900 px-3 py-1.5 text-[12px] font-bold text-white shadow-[0_8px_18px_-6px_rgba(27,38,86,0.5)]"
                    style={{ bottom: `calc(${h}% + 10px)`, ...(i === last && data.length > 1 ? { right: 0, '--tx': '0%' } : i === 0 ? { left: 0, '--tx': '0%' } : { left: '50%', '--tx': '-50%' }) }}
                  >
                    {formatMoney(d.value)}
                  </span>
                ) : null}
                <span
                  className={cn('v7-bar block w-full max-w-[44px] rounded-[12px] transition-colors duration-200', on ? 'bg-brand-600' : 'bg-[#E9EBF4]')}
                  style={{ height: `${h}%`, '--i': i }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="ml-12 mt-3 flex justify-between gap-[6%] px-1 md:gap-[5%]" aria-hidden>
        {data.map((d, i) => (
          <span key={d.key} className={cn('flex-1 text-center text-[12px]', i === active ? 'font-bold text-navy-900' : 'text-ink-400')}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Radial progress ring (occupancy). */
export function Ring({ value, size = 112, stroke = 12, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECEAFE" strokeWidth={stroke} />
        <circle
          className="v7-ring"
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3E2BF1" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ '--c': c }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="v5-num text-[24px] font-extrabold leading-none text-navy-900" dir="ltr">{Math.round(v)}<span className="text-[0.6em] text-ink-400">%</span></span>
      </span>
    </span>
  );
}
