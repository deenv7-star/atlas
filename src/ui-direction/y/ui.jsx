/**
 * Round Y shared pieces: numbers that count up, and the small live viz every metric tile carries
 * (striped bars, ticks, a wave, a dot grid, a ring). Pure SVG/CSS, palette only (indigo, navy, white).
 * All motion turns off under prefers-reduced-motion.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { isActiveBooking, checkOutOf, channelOf } from '@/lib/stay/bookings';
import { addDays, parseDay, formatRangeHe } from '@/lib/stay/format';
import Face from './Face';
import './y-ui.css';

export function useCount(to, { dur = 600, delay = 0 } = {}) {
  const reduce = useReducedMotion();
  const target = Number(to) || 0;
  const [v, setV] = useState(reduce ? target : 0);
  const from = useRef(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setV(target); return undefined; }
    let raf; const t0 = performance.now() + delay; const a = from.current;
    const tick = (t) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      const val = a + (target - a) * (1 - (1 - p) ** 4); from.current = val;
      setV(val);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce, dur, delay]);
  return v;
}

/** A big thin numeral with a small unit: <Num value={13270} pre="₪" />, <Num value={41} post="%" /> */
export function Num({ value, pre = '', post = '', delay = 0, className = '' }) {
  const unknown = value == null || Number.isNaN(Number(value));
  const v = useCount(unknown ? 0 : value, { delay });
  // Audit 04.11 #2: a value we could not load is "—", never a made-up 0.
  if (unknown) return <span className={`y-num ${className}`}><span aria-hidden>—</span><span className="sr-only">לא ידוע כרגע</span></span>;
  return (
    <span className={`y-num ${className}`} dir="ltr">
      {pre ? <small>{pre}</small> : null}{Math.round(v).toLocaleString('he-IL')}{post ? <small>{post}</small> : null}
    </span>
  );
}

/** Striped progress (filled part striped, rest a soft track). value 0..1 */
export function StripeBar({ value = 0, tone = 'ind', delay = 0, className = '' }) {
  return (
    <span className={`y-stripe y-stripe--${tone} ${className}`} role="presentation">
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, animationDelay: `${delay}ms` }} />
    </span>
  );
}

/** Vertical tick bars (like an audio meter). values 0..1, `hot` index gets the accent. */
export function Ticks({ values = [], hot = -1, height = 44, className = '' }) {
  return (
    <span className={`y-ticks ${className}`} style={{ height }} aria-hidden>
      {values.map((v, i) => <i key={i} className={i === hot ? 'hot' : v > 0 ? 'on' : ''} style={{ height: `${Math.max(10, v * 100)}%`, animationDelay: `${120 + i * 35}ms` }} />)}
    </span>
  );
}

/** Smooth wave through values (0..1), with a marker on the last point. */
export function Wave({ values = [], w = 160, h = 48, stroke = '#3E2BF1', fill = true, marker = true, className = '' }) {
  const pts = values.length > 1 ? values : [0.3, 0.5];
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * (w - 8) + 4, h - 6 - v * (h - 14)]);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i += 1) {
    const [x0, y0] = xy[i - 1]; const [x1, y1] = xy[i]; const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const last = xy[xy.length - 1];
  const id = useMemo(() => `yw${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg className={`y-wave ${className}`} viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden>
      {fill ? (
        <>
          <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={stroke} stopOpacity=".22" /><stop offset="1" stopColor={stroke} stopOpacity="0" /></linearGradient></defs>
          <path d={`${d} L${last[0]},${h} L${xy[0][0]},${h} Z`} fill={`url(#${id})`} className="y-wave-fill" />
        </>
      ) : null}
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" pathLength="1" className="y-wave-line" />
      {marker ? <circle cx={last[0]} cy={last[1]} r="4" fill="#fff" stroke={stroke} strokeWidth="2.2" className="y-wave-dot" /> : null}
    </svg>
  );
}

/** A grid of dots: `on` filled indigo, the rest soft. */
export function DotGrid({ total = 20, on = 0, cols = 10, tone = 'ind', className = '' }) {
  return (
    <span className={`y-dots y-dots--${tone} ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} aria-hidden>
      {Array.from({ length: total }, (_, i) => <i key={i} className={i < on ? 'on' : ''} style={{ animationDelay: `${200 + i * 22}ms` }} />)}
    </span>
  );
}

/** One ring (occupancy). */
export function Ring({ value = 0, size = 64, stroke = 7, color = '#3E2BF1', track = 'rgba(27,38,86,.1)', children, className = '' }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (
    <span className={`y-ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} transform={`rotate(-90 ${size / 2} ${size / 2})`} className="y-ring-arc" style={{ '--c': c }} />
      </svg>
      {children ? <span className="y-ring-in">{children}</span> : null}
    </span>
  );
}

/** Overlapping faces. */
export function FaceStack({ names = [], size = 34, max = 4, ring = true, className = '' }) {
  const shown = names.slice(0, max); const rest = names.length - shown.length;
  return (
    <span className={`y-stack ${className}`} aria-hidden>
      {shown.map((n, i) => <Face key={`${n}-${i}`} name={n} size={size} ring={ring} />)}
      {rest > 0 ? <span className="y-stack-more" style={{ width: size, height: size }}>+{rest}</span> : null}
    </span>
  );
}

const DAY_L = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
/** The next `n` days: occupancy (0..1), who arrives (names, '' for an unnamed channel booking), channels. */
export function useWeek(model, n = 7) {
  const { data, day } = model;
  return useMemo(() => {
    const units = Math.max(1, (data.properties || []).length);
    const act = (data.bookings || []).filter(isActiveBooking);
    return Array.from({ length: n }, (_, i) => {
      const d = addDays(day, i);
      const occ = act.filter((b) => b.check_in_date <= d && checkOutOf(b) > d).length;
      const arr = act.filter((b) => b.check_in_date === d);
      const dt = parseDay(d);
      return {
        d, label: i === 0 ? 'היום' : i === 1 ? 'מחר' : `${DAY_L[dt.getDay()]} ${dt.getDate()}`,
        occ: Math.min(1, occ / units), occN: occ, units,
        names: arr.map((b) => b.guest_name || ''), channels: arr.map((b) => channelOf(b).key),
      };
    });
  }, [data.properties, data.bookings, day, n]);
}

/** Bookings worth seeing now: staying, arriving and leaving from today on, soonest first. */
export function useBookingList(model) {
  const { data, day } = model;
  return useMemo(() => (data.bookings || [])
    .filter((b) => isActiveBooking(b) && checkOutOf(b) >= day)
    .sort((a, z) => String(a.check_in_date).localeCompare(String(z.check_in_date))), [data.bookings, day]);
}

export function whenOf(b, day) {
  if (String(b.status || '').toUpperCase() === 'CANCELLED') return 'בוטלה';
  if (checkOutOf(b) < day) return formatRangeHe(b.check_in_date, checkOutOf(b));
  if (checkOutOf(b) === day) return 'יוצאים היום';
  if (b.check_in_date === day) return 'מגיעים היום';
  if (b.check_in_date < day) return 'שוהים עכשיו';
  const diff = Math.round((parseDay(b.check_in_date) - parseDay(day)) / 86400000);
  return diff === 1 ? 'מגיעים מחר' : `בעוד ${diff} ימים`;
}
