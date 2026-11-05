/**
 * Today · A5 "מהלך היום" (05.11.2026, Deen: more original options, keep the hills + milky glass).
 * The day told as a story along a line: morning departures, the turnover, afternoon arrivals, tomorrow's first guest.
 * Phone: a vertical line, each moment a glass row with its time, the guest's face and the one number that matters.
 * Desktop: the same moments on a horizontal hour axis (08:00 → 22:00, flowing right to left) with a "עכשיו" marker;
 * the month (received, waiting, occupancy, 6-month horizon) sits in its own glass card under it, beside the calendar.
 * Empty account: the same axis with the two hours the day will turn on (11:00 out, 15:00 in), the steps and two actions.
 * Palette: navy #1B2656, indigo #3E2BF1, white glass, one amber dot.
 */
import React, { useMemo } from 'react';
import { SETUP_DONE, SETUP_STEPS, SetupActions } from './shared';
import Face from '../Face';
import { money, guestLabel } from '../model';
import { formatDayHe } from '@/lib/stay/format';
import { cn } from '@/lib/utils';
import { Check, LogIn, LogOut, Sparkles, Sunrise } from 'lucide-react';
import './var-a5.css';

export const HOME_VAR = 'a5';
export const HIDE_PHOTO = true;
export const HIDE_TILES = true;
export const HIDE_CHART = true;

const H0 = 8; const H1 = 22;
const hourOf = (t, d) => { const [h, mm] = String(t || d).split(':').map(Number); return (h || 0) + (mm || 0) / 60; };
const pos = (h) => `${Math.min(100, Math.max(0, ((h - H0) / (H1 - H0)) * 100))}%`;
const one = (n, s, p) => (n === 1 ? s : p);

function useMoments(m, arrivals, departures) {
  return useMemo(() => {
    const out = [];
    departures.forEach((x) => {
      const p = m.prop(x.booking.property_id); const t = p?.check_out_time || '11:00';
      out.push({ k: `o-${x.booking.id}`, kind: 'out', t, h: hourOf(t, '11:00'), b: x.booking, unit: p?.name, label: 'יוצאים', note: 'שולם' });
      const back = arrivals.find((a) => a.booking.property_id === x.booking.property_id);
      const ct = '12:00';
      out.push({ k: `c-${x.booking.id}`, kind: 'clean', t: ct, h: hourOf(ct), unit: p?.name, label: back ? 'ניקיון לפני הגעה' : 'ניקיון' });
    });
    arrivals.forEach((x) => {
      const p = m.prop(x.booking.property_id); const t = p?.check_in_time || '15:00';
      const bal = m.balanceFor(x.booking);
      out.push({ k: `i-${x.booking.id}`, kind: 'in', t, h: hourOf(t, '15:00'), b: x.booking, unit: p?.name, label: 'מגיעים',
        note: bal?.unknown ? '' : bal?.balance > 0 ? `יתרה ${money(bal.balance)}` : 'שולם', owe: bal?.balance > 0 });
    });
    return out.sort((a, b) => a.h - b.h);
  }, [m, arrivals, departures]);
}

const ICON = { out: LogOut, in: LogIn, clean: Sparkles };

function Moment({ x, onOpen, axis }) {
  const I = ICON[x.kind];
  const body = (
    <>
      <span className="hv5-mt" dir="ltr">{x.t}</span>
      <span className="hv5-mb">
        <em className={cn('hv5-mk', `is-${x.kind}`)}><I strokeWidth={2} aria-hidden />{x.label}</em>
        <b dir="auto">{x.b ? guestLabel(x.b) : x.unit}</b>
        <small>{x.b ? <bdi>{x.unit}</bdi> : 'בין אורחים'}{x.note ? <> · <span className={cn(x.owe && 'hv5-owe')}>{x.note}</span></> : null}{x.owe ? <i className="hv5-amber" aria-hidden /> : null}</small>
      </span>
      {x.b ? <Face name={x.b.guest_name || ''} size={axis ? 36 : 40} ring /> : <span className="hv5-mic" aria-hidden><Sparkles strokeWidth={1.75} /></span>}
    </>
  );
  return x.b
    ? <button type="button" className={cn('hv5-m press', `is-${x.kind}`)} onClick={() => onOpen(x.b)}>{body}</button>
    : <div className={cn('hv5-m', `is-${x.kind}`)}>{body}</div>;
}

function NowMark() {
  const d = new Date(); const h = d.getHours() + d.getMinutes() / 60;
  if (h < H0 || h > H1) return null;
  return <span className="hv5-now" style={{ right: pos(h) }} aria-hidden><b>עכשיו</b></span>;
}

function Axis({ moments, onOpen, ghost = false }) {
  const ticks = [8, 10, 12, 14, 16, 18, 20, 22];
  return (
    <div className={cn('hv5-axis', ghost && 'is-ghost')}>
      <div className="hv5-rail" aria-hidden>
        {ticks.map((t) => <span key={t} style={{ right: pos(t) }}><i />{String(t).padStart(2, '0')}:00</span>)}
      </div>
      <NowMark />
      {ghost ? (
        <>
          <span className="hv5-ghost" style={{ right: pos(11) }}><b dir="ltr">11:00</b>כאן יופיעו היציאות</span>
          <span className="hv5-ghost" style={{ right: pos(15) }}><b dir="ltr">15:00</b>וכאן ההגעות</span>
        </>
      ) : moments.map((x, i) => {
        const f = (x.h - H0) / (H1 - H0);
        return (
        <div key={x.k} className={cn('hv5-pin', i % 2 ? 'is-down' : 'is-up', f < 0.14 && 'al-r', f > 0.86 && 'al-l')} style={{ right: pos(x.h) }}>
          <i className={cn('hv5-dot', `is-${x.kind}`)} aria-hidden />
          <Moment x={x} onOpen={onOpen} axis />
        </div>
        );
      })}
    </div>
  );
}

function Horizon({ values = [], peak = '' }) {
  const W = 360; const H = 90;
  const d = useMemo(() => {
    const pts = values.length > 1 ? values : [0.2, 0.35, 0.3, 0.5, 0.45, 0.62];
    const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - 8 - v * (H - 30)]);
    let p = `M${xy[0][0]},${xy[0][1]}`;
    for (let i = 1; i < xy.length; i += 1) { const [x0, y0] = xy[i - 1]; const [x1, y1] = xy[i]; const cx = (x0 + x1) / 2; p += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
    return { line: p, area: `${p} L${W},${H} L0,${H} Z`, top: xy.reduce((a, b) => (b[1] < a[1] ? b : a)) };
  }, [values]);
  return (
    <div className="hv5-hz" aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%">
        <defs><linearGradient id="hv5g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3E2BF1" stopOpacity=".3" /><stop offset="1" stopColor="#3E2BF1" stopOpacity=".03" /></linearGradient></defs>
        <path d={d.area} fill="url(#hv5g)" /><path d={d.line} className="hv5-hz-l" />
      </svg>
      {peak ? <span className="hv5-hz-peak" style={{ left: `${(d.top[0] / W) * 100}%`, top: `${(d.top[1] / H) * 100}%` }}>{peak}</span> : null}
    </div>
  );
}

export default function HomeTop({ m, noBookings, onAdd, arrivals = [], departures = [], wave = [], hasRevenue, bestLabel, dueCount = 0, onTile, openBooking }) {
  const moments = useMoments(m, arrivals, departures);
  const units = (m?.data?.properties || []).length;
  if (noBookings) {
    return (
      <section className="hv5 is-empty" aria-labelledby="hv5-h">
        <p className="hv5-k"><Sunrise strokeWidth={1.75} aria-hidden />מהלך היום</p>
        <h2 id="hv5-h" className="hv5-t">{units} {one(units, 'יחידה מוכנה', 'יחידות מוכנות')}. מההזמנה הראשונה, כאן יסופר כל יום: מי יוצא בבוקר, מה מתנקה, ומי מגיע אחר הצהריים.</h2>
        <ol className="hv5-line is-ghost" aria-hidden>
          <li className="is-out"><div className="hv5-m"><span className="hv5-mt" dir="ltr">11:00</span><span className="hv5-mb"><b>היציאות של הבוקר</b><small>מי עוזב, ומה שולם</small></span></div></li>
          <li className="is-in"><div className="hv5-m"><span className="hv5-mt" dir="ltr">15:00</span><span className="hv5-mb"><b>ההגעות של אחר הצהריים</b><small>מי מגיע, ומה היתרה</small></span></div></li>
        </ol>
        <Axis ghost moments={[]} onOpen={() => {}} />
        <ol className="hv5-steps" aria-label="צעדי ההגדרה">
          {SETUP_STEPS.map((s, i) => (
            <li key={s.key} className={cn(s.done && 'is-done', !s.done && i === SETUP_DONE && 'is-next')}>
              <i aria-hidden>{s.done ? <Check strokeWidth={3} /> : i + 1}</i>{s.short}{s.done ? <span className="sr-only"> (בוצע)</span> : null}
            </li>
          ))}
        </ol>
        <SetupActions onAdd={onAdd} compact />
      </section>
    );
  }
  const a = arrivals.length; const dd = departures.length;
  const tomorrow = (m.data.bookings || []).filter((b) => b.check_in_date === m.tomorrow && b.status !== 'CANCELLED')[0];
  const month = m.money.month;
  return (
    <>
      <section className="hv5" aria-labelledby="hv5-h">
        <div className="hv5-head">
          <p className="hv5-k"><Sunrise strokeWidth={1.75} aria-hidden />מהלך היום</p>
          <h2 id="hv5-h" className="hv5-t">
            {moments.length ? <><button type="button" className="hv5-n" onClick={() => onTile('arrivals')} aria-haspopup="dialog">{dd}</button> {one(dd, 'יציאה', 'יציאות')} בבוקר, <button type="button" className="hv5-n" onClick={() => onTile('arrivals')} aria-haspopup="dialog">{a}</button> {one(a, 'הגעה', 'הגעות')} אחר הצהריים.</> : 'יום שקט: אין היום הגעות או יציאות.'}
          </h2>
        </div>
        {moments.length ? (
          <>
            <ol className="hv5-line">
              {moments.map((x) => <li key={x.k} className={`is-${x.kind}`}><Moment x={x} onOpen={openBooking} /></li>)}
            </ol>
            <Axis moments={moments} onOpen={openBooking} />
          </>
        ) : null}
        {tomorrow ? (
          <button type="button" className="hv5-tmr press" onClick={() => openBooking(tomorrow)}>
            <span>מחר</span><b dir="auto">{guestLabel(tomorrow)}</b><small><bdi>{m.prop(tomorrow.property_id)?.name}</bdi> · {formatDayHe(tomorrow.check_in_date, { weekday: false })}</small>
            <Face name={tomorrow.guest_name || ''} size={30} ring />
          </button>
        ) : null}
      </section>
      <section className="hv5-month" aria-labelledby="hv5-mh">
        <h2 id="hv5-mh" className="hv5-k">{month} עד היום</h2>
        <div className="hv5-stats">
          <button type="button" className="hv5-st press" onClick={() => onTile('income')} aria-haspopup="dialog"><b dir="ltr">{money(m.money.received)}</b><span>נכנסו</span></button>
          <button type="button" className="hv5-st press" onClick={() => onTile('pending')} aria-haspopup="dialog"><b dir="ltr" className="is-ind">{money(m.pendingTotal)}</b><span>מחכים לתשלום{m.pendingTotal > 0 ? <i className="hv5-amber" aria-hidden /> : null}{dueCount ? ` · ${dueCount} ${one(dueCount, 'הזמנה', 'הזמנות')}` : ''}</span></button>
          <button type="button" className="hv5-st press" onClick={() => onTile('occupancy')} aria-haspopup="dialog"><b dir="ltr">{m.money.occupancy}%</b><span>תפוסה</span></button>
        </div>
        {hasRevenue ? <button type="button" className="hv5-hzb press" onClick={() => onTile('revenue')} aria-label="הכנסות לפי חודש: פירוט"><Horizon values={[...wave].reverse()} peak={bestLabel} /><span className="hv5-hz-k">6 חודשים</span></button> : null}
      </section>
    </>
  );
}
