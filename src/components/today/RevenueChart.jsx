/**
 * v5 revenue visuals: the one elegant chart on the home screen (indigo line + soft indigo area, hairline
 * grid, no y-axis noise) and the mini sparkline used in the KPI card. Time reads left-to-right like every
 * finance chart (newest month on the right, where the eye lands in RTL).
 */
import React, { useId, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts';
import { formatMoney } from '@/lib/stay/format';
import { isActiveBooking } from '@/lib/stay/bookings';

const MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
const MONTHS_LONG = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const INDIGO = '#3E2BF1';

/** Revenue per month (by check-in month) for the last `count` months, oldest first. */
export function monthlyRevenue(bookings, count = 6, now = new Date()) {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS[d.getMonth()], long: `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`, value: 0 });
  }
  const byKey = new Map(out.map((m) => [m.key, m]));
  for (const b of bookings || []) {
    if (!isActiveBooking(b)) continue;
    const m = byKey.get(String(b.check_in_date).slice(0, 7));
    if (m) m.value += Number(b.total_price) || 0;
  }
  return out;
}

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

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-[10px] border border-line bg-white px-3 py-2 text-right shadow-[0_8px_24px_rgba(16,24,64,0.10)]" dir="rtl">
      <p className="text-[12px] text-ink-400">{p.long}</p>
      <p className="v5-num text-[15px] font-bold text-navy-900">{formatMoney(p.value)}</p>
    </div>
  );
}

export default function RevenueChart({ data, height = '100%', axis = false }) {
  const id = useId().replace(/:/g, '');
  const last = data[data.length - 1];
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = Math.max(1000, Math.ceil((max * 1.12) / 3 / 5000) * 5000);
  const ticks = [0, step, step * 2, step * 3];
  return (
    <div className="v5-chart" style={{ height }} dir="ltr" role="img" aria-label={`הכנסות לפי חודש, ${data.map((d) => `${d.label} ${formatMoney(d.value)}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 16 }}>
          <defs>
            <linearGradient id={`rev-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={INDIGO} stopOpacity="0.18" />
              <stop offset="70%" stopColor={INDIGO} stopOpacity="0.04" />
              <stop offset="100%" stopColor={INDIGO} stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#EDEFF4" strokeDasharray="3 4" />
          <XAxis dataKey="label" axisLine={false} padding={{ left: 8, right: 8 }} tickLine={false} tickMargin={10} interval={0} />
          <YAxis
            hide={!axis}
            orientation="right"
            axisLine={false}
            tickLine={false}
            width={44}
            ticks={ticks}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))}
            domain={[0, step * 3]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#C9C3FB', strokeWidth: 1 }} isAnimationActive={false} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={INDIGO}
            strokeWidth={2}
            fill={`url(#rev-${id})`}
            activeDot={{ r: 5, fill: '#fff', stroke: INDIGO, strokeWidth: 2 }}
            animationDuration={700}
            animationEasing="ease-out"
          />
          {last ? <ReferenceDot x={last.label} y={last.value} r={4.5} fill={INDIGO} stroke="#fff" strokeWidth={2} /> : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
