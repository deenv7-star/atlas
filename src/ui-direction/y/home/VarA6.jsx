/**
 * Today desktop · "המספר של החודש" (05.11.2026, Deen's pick: A6 with A4's sentence).
 * One number leads: what came in this month, set very large on a frosted card, then the rest of the day in one
 * sentence (its numbers tappable, each opens its sheet), and the six-month horizon drawn under it like the hills behind.
 * Empty account: the big number is the units that are ready; a navy glass dock under the card carries the three setup steps.
 * Palette: navy #1B2656, indigo #3E2BF1, white glass, one amber dot.
 */
import React, { useMemo } from 'react';
import { SETUP_DONE, SETUP_STEPS, SetupActions } from './shared';
import { FaceStack } from '../ui';
import { money } from '../model';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import './var-a6.css';

const one = (n, s, p) => (n === 1 ? s : p);
const NB = '\u00A0';
const W = 600; const H = 150;

function Horizon({ values, labels = [], peak = '', empty = false }) {
  const d = useMemo(() => {
    const pts = !empty && values.length > 1 ? values : [0.5, 0.64, 0.58, 0.76, 0.7, 0.88];
    const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - 12 - v * (H - 44)]);
    let p = `M${xy[0][0]},${xy[0][1]}`;
    for (let i = 1; i < xy.length; i += 1) { const [x0, y0] = xy[i - 1]; const [x1, y1] = xy[i]; const cx = (x0 + x1) / 2; p += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
    return { line: p, area: `${p} L${W},${H} L0,${H} Z`, top: xy.reduce((a, b) => (b[1] < a[1] ? b : a)), now: xy[0] };
  }, [values, empty]);
  return (
    <div className={cn('hv6-hz', empty && 'is-empty')} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%">
        <defs><linearGradient id="hv6g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3E2BF1" stopOpacity=".32" /><stop offset="1" stopColor="#3E2BF1" stopOpacity=".02" /></linearGradient></defs>
        {empty ? null : <path d={d.area} fill="url(#hv6g)" />}
        <path d={d.line} className="hv6-hz-l" />
      </svg>
      {!empty && peak ? <span className="hv6-hz-peak" style={{ left: `${(d.top[0] / W) * 100}%`, top: `${(d.top[1] / H) * 100}%` }}>{peak}</span> : null}
      {!empty ? <i className="hv6-hz-now" style={{ left: `${(d.now[0] / W) * 100}%`, top: `${(d.now[1] / H) * 100}%` }} /> : null}
      {labels.length ? <div className="hv6-hz-x">{labels.map((l, i) => <span key={i}>{l}</span>)}</div> : null}
    </div>
  );
}

function Tok({ children, onClick, label, tone, tight = false }) {
  return <button type="button" className={cn('hv6-n', tone && `is-${tone}`, String(children).length <= 2 && 'is-short', tight && String(children).length === 1 && 'is-tight')} onClick={onClick} aria-haspopup="dialog" aria-label={label}>{children}</button>;
}

/* the rest of the day told in one sentence under the big number. The month's income is already the big number,
   so the sentence starts from today and never repeats it. Each number stays glued to its word (nbsp), never alone at a line end. */
function DaySentence({ m, arrivals, departures, dueCount, onTile }) {
  const a = arrivals.length; const dd = departures.length; const month = m.money.month;
  return (
    <p className="hv6-s">
      {a || dd ? (
        <>
          <span className="hv6-nw">היום{NB}<Tok onClick={() => onTile('arrivals')} label={`מגיעים היום: ${a}. פירוט`}>{a}</Tok>
            {a ? <FaceStack names={arrivals.map((x) => x.booking.guest_name || '')} size={28} max={3} className="hv6-sfaces" /> : null}
            {NB}{one(a, 'הגעה', 'הגעות')}</span>{' '}
          <span className="hv6-nw">ו־<Tok tight onClick={() => onTile('arrivals')} label={`יוצאים היום: ${dd}. פירוט`}>{dd}</Tok>{NB}{one(dd, 'יציאה', 'יציאות')}.</span>
        </>
      ) : <>היום אין הגעות ויציאות.</>}
      {' '}
      {m.pendingTotal > 0 ? (
        <><span className="hv6-nw">עוד{NB}<Tok tone="ind" onClick={() => onTile('pending')} label={`ממתינים לתשלום: ${money(m.pendingTotal)}. פירוט`}>{money(m.pendingTotal)}</Tok></span>
          <i className="hv6-samber" aria-hidden /> מחכים לתשלום{dueCount ? <> מ־<span className="hv6-nw">{dueCount}{NB}{one(dueCount, 'הזמנה', 'הזמנות')}</span></> : ''}, </>
      ) : <>אין תשלומים פתוחים, </>}
      <span className="hv6-nw">והתפוסה החודש{NB}<Tok onClick={() => onTile('occupancy')} label={`תפוסה ב${month}: ${m.money.occupancy}%. פירוט`}>{m.money.occupancy}%</Tok>.</span>
    </p>
  );
}

export default function HomeTop({ m, noBookings, onAdd, arrivals = [], departures = [], wave = [], hasRevenue, bestLabel, dueCount = 0, onTile }) {
  const units = (m?.data?.properties || []).length;
  if (noBookings) {
    return (
      <div className="hv6-wrap is-empty">
        <section className="hv6" aria-labelledby="hv6-h">
          <p className="hv6-k" id="hv6-h">המתחם מוכן</p>
          <p className="hv6-big"><span dir="ltr">{units}</span><small>{one(units, 'יחידה', 'יחידות')}</small></p>
          <p className="hv6-sub">מההזמנה הראשונה, כאן יעמוד בגדול כמה נכנס החודש, והקו יתחיל לעלות.</p>
          <SetupActions onAdd={onAdd} compact />
          <Horizon empty values={[]} />
        </section>
        <ol className="hv6-dock is-steps" aria-label="צעדי ההגדרה">
          {SETUP_STEPS.map((s, i) => (
            <li key={s.key} className={cn('hv6-di', s.done && 'is-done', !s.done && i === SETUP_DONE && 'is-next')}>
              <span className="hv6-dl">{s.done ? 'בוצע' : `צעד ${i + 1}`}</span>
              <b>{s.done ? <i className="hv6-ck" aria-hidden><Check strokeWidth={3} /></i> : null}{s.short}{s.done ? <span className="sr-only"> (בוצע)</span> : null}</b>
            </li>
          ))}
        </ol>
      </div>
    );
  }
  const months = m.money.months || [];
  // months run oldest → current; the chart is drawn right (oldest) to left (now), as Hebrew reads
  const prev = months[months.length - 2]; const month = m.money.month;
  const labels = months.length ? [months[months.length - 1].label || '', months[0].label || ''] : [];
  return (
    <div className="hv6-wrap has-sentence">
      <section className="hv6" aria-labelledby="hv6-h">
        <button type="button" className="hv6-hit" onClick={() => onTile('income')} aria-haspopup="dialog" aria-label={`הכנסות ב${month}: ${money(m.money.received)}. פירוט`} />
        <div className="hv6-top">
          <div>
            <p className="hv6-k" id="hv6-h">נכנסו ב{month}</p>
            <p className="hv6-big"><span dir="ltr">{money(m.money.received)}</span></p>
          </div>
          {prev ? (
            <p className="hv6-cmp"><span>{prev.label ? `ב${prev.label}` : 'בחודש הקודם'}</span><b dir="ltr">{money((prev.value || 0) + (prev.expected || 0))}</b></p>
          ) : null}
        </div>
        <DaySentence m={m} arrivals={arrivals} departures={departures} dueCount={dueCount} onTile={onTile} />
        {/* the horizon's own labels stay visible text; the tap target is an empty overlay so its name never mismatches them */}
        <div className="hv6-hzb">
          <Horizon values={hasRevenue ? [...wave].reverse() : []} empty={!hasRevenue} labels={labels}
            peak={prev && bestLabel === money((prev.value || 0) + (prev.expected || 0)) ? '' : bestLabel} />
          <button type="button" className="hv6-hzhit" onClick={() => onTile('revenue')} aria-haspopup="dialog" aria-label="הכנסות לפי חודש: פירוט" />
        </div>
      </section>
    </div>
  );
}
