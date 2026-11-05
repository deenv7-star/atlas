/**
 * Today · variation D "הקצב של החודש": one bold card with three rings (occupancy, paid this month, today's
 * tasks) and the day as a 07:00–23:00 line with arrival and departure pins and a "now" marker. The tiles follow.
 * Empty account: rings sit at zero, the line shows only "now", and a slim setup row offers the next step.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { checkInTime, checkOutTime } from '@/components/today/TodayBoard';
import { money, guestLabel } from '../model';
import { Ring } from '../ui';
import { isActiveBooking } from '@/lib/stay/bookings';
import { heCount } from '@/lib/hebrewCount';
import { StepRing } from './shared';
import './var-d.css';

export const HOME_VAR = 'd';
export const HIDE_PHOTO = false;

const START = 7; const END = 23;
const toH = (t) => { const [h, mm] = String(t || '').split(':').map(Number); return Number.isFinite(h) ? h + (mm || 0) / 60 : null; };
const pos = (h) => Math.max(0, Math.min(1, (h - START) / (END - START))) * 100;

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(t); }, []);
  return now.getHours() + now.getMinutes() / 60;
}

function Gauge({ value, label, sub, children, empty }) {
  return (
    <div className={cn('hvd-g', empty && 'is-empty')}>
      <Ring value={value} size={78} stroke={8} track="rgba(27,38,86,.08)">{children}</Ring>
      <b>{label}</b>
      <small>{sub}</small>
    </div>
  );
}

export default function HomeTop({ m, noBookings, onAdd }) {
  const now = useNow();
  const occ = m.money.occupancy || 0;
  // paid this month = what guests already paid out of the bookings that start this month (same rule as the income sheet)
  const ym = m.day.slice(0, 7);
  const inMonth = (m.data.bookings || []).filter(isActiveBooking).filter((b) => String(b.check_in_date).slice(0, 7) === ym);
  const exp = m.moneyKnown ? inMonth.reduce((s, b) => s + (Number(b.total_price) || 0), 0) : 0;
  const rec = m.moneyKnown ? inMonth.reduce((s, b) => s + (Number(m.balanceFor(b).paid) || 0), 0) : 0;
  const paidPct = exp ? Math.min(100, Math.round((rec / exp) * 100)) : 0;
  const total = m.total || 0; const done = m.doneCount || 0;
  const pins = [
    ...m.board.departures.map(({ booking: b }) => ({ k: `o${b.id}`, dir: 'out', t: checkOutTime(b, m.prop(b.property_id)), who: guestLabel(b) })),
    ...m.board.arrivals.map(({ booking: b }) => ({ k: `i${b.id}`, dir: 'in', t: checkInTime(b, m.prop(b.property_id)), who: guestLabel(b) })),
  ].map((p) => ({ ...p, h: toH(p.t) })).filter((p) => p.h != null);
  const nowIn = now >= START && now <= END;
  const hours = [7, 23];
  return (
    <>
      <section className="hvd-card" aria-labelledby="hvd-h">
        <div className="hvd-head"><h2 id="hvd-h">הקצב של {m.money.month}</h2></div>
        <div className="hvd-rings">
          <Gauge value={occ / 100} label="תפוסה" sub={(m.data.properties || []).length ? heCount((m.data.properties || []).length, 'unit') : 'עוד אין יחידות'} empty={!occ}>
            <span className="hvd-n" dir="ltr">{occ}%</span>
          </Gauge>
          <Gauge value={paidPct / 100} label="שולם החודש" sub={m.moneyKnown ? (exp ? `מתוך ${money(exp)}` : 'אין עדיין סכומים') : '—'} empty={!paidPct}>
            <span className="hvd-n" dir="ltr">{m.moneyKnown ? `${paidPct}%` : '—'}</span>
          </Gauge>
          <Gauge value={total ? done / total : 0} label="משימות היום" sub={total ? `${total - done} פתוחות` : 'אין משימות'} empty={!total}>
            <span className="hvd-n" dir="ltr">{total ? `${done}/${total}` : '0'}</span>
          </Gauge>
        </div>
        <div className={cn("hvd-day", !pins.length && "no-pins")} role="img" aria-label={pins.length ? `היום: ${pins.map((p) => `${p.dir === 'in' ? 'הגעה' : 'יציאה'} ${p.t}`).join(', ')}` : 'היום אין הגעות ויציאות'}>
          <div className="hvd-line">
            <span className="hvd-done" style={{ width: `${nowIn ? pos(now) : now > END ? 100 : 0}%` }} />
            {pins.map((p) => (
              <span key={p.k} className={cn('hvd-pin', `is-${p.dir}`)} style={{ right: `${pos(p.h)}%` }}>
                <i />
                <em dir="ltr">{p.t}</em>
              </span>
            ))}
            {nowIn ? <span className="hvd-now" style={{ right: `${pos(now)}%` }}><i /><em>עכשיו</em></span> : null}
          </div>
          <div className="hvd-hours" aria-hidden>{hours.map((h) => <span key={h} style={{ right: `${pos(h)}%` }}>{String(h).padStart(2, '0')}:00</span>)}</div>
        </div>
        <p className="hvd-key">
          {pins.length ? (
            <><span><i className="is-in" />הגעה</span><span><i className="is-out" />יציאה</span></>
          ) : <span className="hvd-none">הגעות ויציאות של היום יופיעו על הקו</span>}
        </p>
      </section>
      {noBookings ? (
        <section className="hvd-setup" aria-labelledby="hvd-s">
          <StepRing size={40} />
          <div className="hvd-setup-t">
            <h2 id="hvd-s">הצעד הבא: הזמנה ראשונה</h2>
            <Link to={createPageUrl('Integrations')} className="hvd-link">או חברו את Booking ואת Airbnb</Link>
          </div>
          <button type="button" className="hvd-add press" onClick={onAdd}><Plus strokeWidth={2.2} aria-hidden />הוספה</button>
        </section>
      ) : null}
    </>
  );
}
