/** Bookings v2: grouped rows. One row = guest, unit, dates + nights, amount + payment, source, status. */
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { formatRangeHe } from '@/lib/stay/format';
import { checkOutOf } from '@/lib/stay/bookings';
import { guestLabel } from '@/ui-direction/y/model';
import Face from '@/ui-direction/y/Face';
import { cn } from '@/lib/utils';
import { Chip } from './BookingDetail';
import { statusOf, payOf, sourceOf, nightsOf, nightsLabel, isCancelled } from './model';

const ils = (n) => `₪${Math.round(Number(n) || 0).toLocaleString('he-IL')}`;

export function BookingRow({ booking: b, model: m, selected, onOpen }) {
  const day = m.day;
  const unit = m.prop(b.property_id);
  const bal = m.balanceFor(b);
  const st = statusOf(b, day);
  const pay = payOf(bal);
  const src = sourceOf(b);
  const n = nightsOf(b);
  const showStatus = st.key !== 'confirmed' && st.key !== 'past';
  const name = guestLabel(b);
  return (
    <li>
      <button
        type="button"
        className={cn('bk2-row press', selected && 'is-sel', isCancelled(b) && 'is-off')}
        aria-current={selected ? 'true' : undefined}
        onClick={() => onOpen(b)}
      >
        <Face name={b.guest_name || ''} size={44} />
        <span className="bk2-row-who">
          <b dir="auto">{name}</b>
          <small className="bk2-row-dm">{formatRangeHe(b.check_in_date, checkOutOf(b))} · {nightsLabel(n)}</small>
          {unit?.name ? <small className="bk2-row-unit-d"><bdi>{unit.name}</bdi></small> : null}
        </span>
        <span className="bk2-row-when" ><b>{formatRangeHe(b.check_in_date, checkOutOf(b))}</b><small>{nightsLabel(n)}</small></span>
        <span className="bk2-row-money">
          <b dir="ltr">{bal.total ? ils(bal.total) : '—'}</b>
          {pay.label ? <Chip kind={pay.key}>{pay.label}</Chip> : null}
        </span>
        <span className="bk2-row-tags">{unit?.name ? <span className="bk2-row-unit-m"><bdi>{unit.name}</bdi></span> : null}{showStatus ? <Chip kind={st.key}>{st.label}</Chip> : null}{src.key !== 'direct' ? <Chip kind="src">{src.label}</Chip> : null}</span>
        <ChevronLeft className="bk2-row-chev" aria-hidden strokeWidth={1.75} />
      </button>
    </li>
  );
}

export function BookingGroups({ groups, model, selId, onOpen }) {
  return (
    <div className="bk2-groups">
      {groups.map((g) => (
        <section key={g.key} className="bk2-group" aria-labelledby={`bk2-g-${g.key}`}>
          <h2 id={`bk2-g-${g.key}`} className="bk2-group-h"><span>{g.label}</span><em>{g.rows.length}</em></h2>
          <ul className="bk2-rows">
            {g.rows.map((b) => <BookingRow key={b.id} booking={b} model={model} selected={selId === b.id} onOpen={onOpen} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}
