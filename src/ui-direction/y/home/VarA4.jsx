/**
 * Today · A4 "היום במשפט אחד" (05.11.2026, Deen: original, not a recoloured grid). The four tiles and the chart card
 * become ONE frosted-glass card over the hills: the day told as a sentence, its numbers set big inside the words
 * (each number opens its sheet), and the six months of revenue drawn as a horizon along the card's bottom edge,
 * echoing the hills behind it. Empty account: the same card tells what is ready and what is next, with the two actions.
 * Palette: navy #1B2656, indigo #3E2BF1, white glass, one amber dot.
 */
import React, { useMemo } from 'react';
import { SETUP_DONE, SETUP_STEPS, SetupActions } from './shared';
import { FaceStack } from '../ui';
import { money } from '../model';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import './var-a4.css';

export const HOME_VAR = 'a4';
export const HIDE_PHOTO = false;
export const HIDE_TILES = true;
export const HIDE_CHART = true;

const W = 360; const H = 96;
function Horizon({ values = [], empty = false, peak = '', onOpen }) {
  const d = useMemo(() => {
    const pts = values.length > 1 ? values : [0.2, 0.35, 0.3, 0.5, 0.45, 0.62];
    const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - 10 - v * (H - 34)]);
    let p = `M${xy[0][0]},${xy[0][1]}`;
    for (let i = 1; i < xy.length; i += 1) { const [x0, y0] = xy[i - 1]; const [x1, y1] = xy[i]; const cx = (x0 + x1) / 2; p += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
    return { line: p, area: `${p} L${W},${H} L0,${H} Z`, top: xy.reduce((a, b) => (b[1] < a[1] ? b : a)) };
  }, [values]);
  return (
    <button type="button" className={cn('hv4-hz', empty && 'is-empty')} onClick={onOpen} disabled={empty} aria-label={empty ? undefined : 'הכנסות לפי חודש: פירוט'}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} aria-hidden>
        <defs><linearGradient id="hv4g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3E2BF1" stopOpacity=".34" /><stop offset="1" stopColor="#3E2BF1" stopOpacity=".04" /></linearGradient></defs>
        {empty ? null : <path d={d.area} fill="url(#hv4g)" />}
        <path d={d.line} className="hv4-hz-l" />
      </svg>
      {!empty && peak ? <span className="hv4-hz-peak" style={{ left: `${(d.top[0] / W) * 100}%`, top: `${(d.top[1] / H) * 100}%` }}>{peak}</span> : null}
      <span className="hv4-hz-k">{empty ? 'כאן יעלה קו ההכנסות' : '6 חודשים'}</span>
    </button>
  );
}

function Tok({ children, onClick, label, tone }) {
  return <button type="button" className={cn('hv4-n', tone && `is-${tone}`)} onClick={onClick} aria-haspopup="dialog" aria-label={label}>{children}</button>;
}

const one = (n, s, p) => (n === 1 ? s : p);

export default function HomeTop({ m, noBookings, onAdd, arrivals = [], departures = [], wave = [], hasRevenue, bestLabel, dueCount = 0, onTile }) {
  const units = (m?.data?.properties || []).length;
  if (noBookings) {
    return (
      <section className="hv4 is-empty" aria-labelledby="hv4-h">
        <h2 id="hv4-h" className="sr-only">היום</h2>
        <p className="hv4-s">
          יש לכם <span className="hv4-n is-static">{units}</span> {one(units, 'יחידה מוכנה', 'יחידות מוכנות')}.
          {' '}מההזמנה הראשונה, כאן תקראו כל בוקר מי מגיע, כמה נכנס ומה מחכה לתשלום.
        </p>
        <ol className="hv4-steps" aria-label="צעדי ההגדרה">
          {SETUP_STEPS.map((s, i) => (
            <li key={s.key} className={cn(s.done && 'is-done', !s.done && i === SETUP_DONE && 'is-next')}>
              <i aria-hidden>{s.done ? <Check strokeWidth={3} /> : i + 1}</i>{s.short}{s.done ? <span className="sr-only"> (בוצע)</span> : null}
            </li>
          ))}
        </ol>
        <SetupActions onAdd={onAdd} compact />
        <Horizon empty />
      </section>
    );
  }
  const a = arrivals.length; const dd = departures.length;
  const month = m.money.month;
  return (
    <section className="hv4" aria-labelledby="hv4-h">
      <h2 id="hv4-h" className="sr-only">היום במספרים</h2>
      <p className="hv4-s">
        היום <Tok onClick={() => onTile('arrivals')} label={`מגיעים היום: ${a}. פירוט`}>{a}</Tok>
        {a ? <FaceStack names={arrivals.map((x) => x.booking.guest_name || '')} size={30} max={3} className="hv4-faces" /> : null}
        {' '}{one(a, 'הגעה', 'הגעות')} ו־<Tok onClick={() => onTile('arrivals')} label={`יוצאים היום: ${dd}. פירוט`}>{dd}</Tok> {one(dd, 'יציאה', 'יציאות')}.
        {' '}ב{month} נכנסו <Tok onClick={() => onTile('income')} label={`הכנסות ב${month}: ${money(m.money.received)}. פירוט`}>{money(m.money.received)}</Tok>,
        {' '}ועוד <Tok tone="ind" onClick={() => onTile('pending')} label={`ממתינים לתשלום: ${money(m.pendingTotal)}. פירוט`}>{money(m.pendingTotal)}</Tok>
        {m.pendingTotal > 0 ? <i className="hv4-amber" aria-hidden /> : null} מחכים לתשלום{dueCount ? ` מ־${dueCount} ${one(dueCount, 'הזמנה', 'הזמנות')}` : ''}.
        {' '}התפוסה החודש <Tok onClick={() => onTile('occupancy')} label={`תפוסה ב${month}: ${m.money.occupancy}%. פירוט`}>{m.money.occupancy}%</Tok>.
      </p>
      {hasRevenue ? <Horizon values={[...wave].reverse()} peak={bestLabel} onOpen={() => onTile('revenue')} /> : <Horizon empty />}
    </section>
  );
}
