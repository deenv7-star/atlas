/** Month grid of free / taken nights with range selection (check-in then check-out). */
import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { toISODay, todayISO, addDays, monthLabelHe } from '@/lib/stay/format';
import { cn } from '@/lib/utils';

const DOW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export function isNightBusy(day, busy) {
  return busy.some((r) => r.from <= day && day < r.to);
}

export function rangeIsFree(ci, co, busy) {
  for (let d = ci; d < co; d = addDays(d, 1)) if (isNightBusy(d, busy)) return false;
  return true;
}

function Month({ year, monthIndex, busy, value, onPick, today }) {
  const first = new Date(year, monthIndex, 1);
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(toISODay(new Date(year, monthIndex, d)));

  return (
    <div className="min-w-0">
      <p className="font-bold text-center mb-2">{monthLabelHe(year, monthIndex)}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DOW.map((d) => <span key={d} className="ab-faint py-1">{d}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const past = day < today;
          const taken = isNightBusy(day, busy);
          const isStart = value.ci === day;
          const isEnd = value.co === day;
          const inRange = value.ci && value.co && day > value.ci && day < value.co;
          // A taken night can still be a check-out day for the selection.
          const canCheckout = value.ci && !value.co && day > value.ci && rangeIsFree(value.ci, day, busy);
          const disabled = past || (taken && !canCheckout);
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onPick(day)}
              aria-pressed={isStart || isEnd}
              aria-label={`${day}${taken ? ' תפוס' : ' פנוי'}`}
              className={cn('relative mx-auto w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] text-[15px] ab-num transition-[background-color,color] duration-150',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
              style={
                isStart || isEnd ? { background: 'var(--brand-600)', color: '#fff', fontWeight: 800 }
                  : inRange ? { background: 'var(--brand-50)', color: 'var(--brand-700)', fontWeight: 700 }
                    : past ? { color: '#C3C7D4' }
                      : taken ? { color: '#B4B9CA', textDecoration: 'line-through', background: '#F0F2F7' }
                        : { color: 'var(--ink-900)', fontWeight: 600 }
              }
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AvailabilityCalendar({ busy, value, onChange }) {
  const today = todayISO();
  const [offset, setOffset] = useState(0);
  const base = useMemo(() => new Date(), []);
  const m1 = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const m2 = new Date(base.getFullYear(), base.getMonth() + offset + 1, 1);

  const pick = (day) => {
    if (!value.ci || value.co || day <= value.ci) {
      if (isNightBusy(day, busy)) return;
      onChange({ ci: day, co: '' });
      return;
    }
    if (rangeIsFree(value.ci, day, busy)) onChange({ ci: value.ci, co: day });
    else onChange({ ci: isNightBusy(day, busy) ? '' : day, co: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" className="ab-btn ab-btn-secondary ab-btn-sm !px-2" aria-label="חודש קודם" disabled={offset === 0} onClick={() => setOffset((o) => o - 1)}><ChevronRight size={18} strokeWidth={1.75} /></button>
        <div className="flex items-center gap-4 ab-faint">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-[4px] border" style={{ borderColor: 'var(--line)', background: '#fff' }} />פנוי</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-[4px]" style={{ background: '#F0F2F7' }} />תפוס</span>
        </div>
        <button type="button" className="ab-btn ab-btn-secondary ab-btn-sm !px-2" aria-label="חודש הבא" disabled={offset >= 10} onClick={() => setOffset((o) => o + 1)}><ChevronLeft size={18} strokeWidth={1.75} /></button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Month year={m1.getFullYear()} monthIndex={m1.getMonth()} busy={busy} value={value} onPick={pick} today={today} />
        <div className="hidden sm:block"><Month year={m2.getFullYear()} monthIndex={m2.getMonth()} busy={busy} value={value} onPick={pick} today={today} /></div>
      </div>
    </div>
  );
}
