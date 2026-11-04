/**
 * Dates in Hebrew, one field. DateRangeField: check-in → check-out with the nights count; tapping
 * opens an inline month calendar (tap arrival, then departure). DateField: one date.
 * Never a native <input type=date> (iOS shows "Nov 2026 4" in English and it overflows in RTL).
 */
import * as React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heDate, heDateLong, heMonthTitle, heNights, monthGrid, nightsBetween, parseIso, todayIsoIL, HE_WEEKDAY_SHORT } from '@/lib/heDate';
import { useSheetVariant, SheetError } from './fields';

function useMonth(anchorIso) {
  const a = parseIso(anchorIso) || parseIso(todayIsoIL());
  const [ym, setYm] = React.useState({ y: a.getUTCFullYear(), m: a.getUTCMonth() });
  const shift = (n) => setYm(({ y, m }) => {
    const t = m + n;
    return { y: y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
  });
  const jump = React.useCallback((iso) => {
    const d = parseIso(iso);
    if (d) setYm({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  }, []);
  return { ...ym, shift, jump };
}

/** Month grid. Sunday first, RTL (Sunday on the right). */
export function MonthCalendar({ start = '', end = '', onPick, min = '', hint = null, idPrefix }) {
  const today = todayIsoIL();
  const cal = useMonth(start || today);
  const rows = monthGrid(cal.y, cal.m);
  const inRange = (iso) => start && end && iso > start && iso < end;
  return (
    <div className="select-none" dir="rtl">
      <div className="mb-1 flex items-center justify-between">
        <button type="button" onClick={() => cal.shift(-1)} aria-label="החודש הקודם" className="press inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1B2656]/70 hover:bg-[#F7F8FB]">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <p className="text-[16px] font-semibold text-[#1B2656]" aria-live="polite" id={idPrefix ? `${idPrefix}-month` : undefined}>{heMonthTitle(cal.y, cal.m)}</p>
        <button type="button" onClick={() => cal.shift(1)} aria-label="החודש הבא" className="press inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1B2656]/70 hover:bg-[#F7F8FB]">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      </div>
      {hint ? <p className="mb-2 text-center text-[14px] text-[#1B2656]/60">{hint}</p> : null}
      <div className="grid grid-cols-7 text-center text-[12px] font-medium text-[#1B2656]/45" aria-hidden>
        {HE_WEEKDAY_SHORT.map((d) => <span key={d} className="py-1.5">{d.replace('׳', '')}</span>)}
      </div>
      <div role="grid" aria-labelledby={idPrefix ? `${idPrefix}-month` : undefined}>
        {rows.map((row, ri) => (
          <div role="row" key={ri} className="grid grid-cols-7">
            {row.map((iso, ci) => {
              if (!iso) return <span role="gridcell" key={ci} />;
              const isStart = iso === start;
              const isEnd = iso === end;
              const mid = inRange(iso);
              const disabled = Boolean(min && iso < min);
              const isToday = iso === today;
              // range band: connect start → end (RTL: start on the right)
              const band = (mid || (isStart && end) || (isEnd && start)) && start !== end;
              return (
                <div role="gridcell" key={ci} className="relative flex h-11 items-center justify-center">
                  {band ? (
                    <span
                      aria-hidden
                      className={cn('absolute inset-y-1 bg-[#3E2BF1]/[0.08]', isStart ? 'left-0 right-1/2' : isEnd ? 'left-1/2 right-0' : 'inset-x-0')}
                    />
                  ) : null}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(iso)}
                    aria-label={heDateLong(iso)}
                    aria-pressed={isStart || isEnd}
                    aria-current={isToday ? 'date' : undefined}
                    className={cn(
                      'relative z-[1] inline-flex h-10 w-10 items-center justify-center rounded-full text-[16px] tabular-nums transition-colors duration-100',
                      isStart || isEnd ? 'bg-[#3E2BF1] font-semibold text-white' : mid ? 'text-[#1B2656]' : 'text-[#1B2656] hover:bg-[#F7F8FB]',
                      disabled && 'cursor-not-allowed text-[#1B2656]/25 hover:bg-transparent',
                      isToday && !(isStart || isEnd) && 'font-bold text-[#3E2BF1]',
                    )}
                  >
                    {Number(iso.slice(8, 10))}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DateText({ iso, placeholder }) {
  if (!iso) return <span className="text-[#1B2656]/40">{placeholder}</span>;
  return <span dir="rtl">{heDate(iso, { year: 'auto' })}</span>;
}

/**
 * value: { start, end } ISO. onChange({ start, end }).
 * labels: { start: 'כניסה', end: 'יציאה' }.
 */
export function DateRangeField({ start = '', end = '', onChange, labels = { start: 'כניסה', end: 'יציאה' }, error = '', errorId, label = 'מתי', defaultOpen = false, idPrefix = 'dr' }) {
  const v = useSheetVariant();
  const [open, setOpen] = React.useState(defaultOpen);
  const [phase, setPhase] = React.useState(start && !end ? 'end' : 'start');
  const nights = nightsBetween(start, end);
  const panelId = `${idPrefix}-cal`;

  const pick = (iso) => {
    if (phase === 'start' || !start || iso <= start) {
      onChange({ start: iso, end: '' });
      setPhase('end');
      return;
    }
    onChange({ start, end: iso });
    setPhase('start');
    window.setTimeout(() => setOpen(false), 220);
  };
  const toggle = (which) => {
    const next = which === 'end' && start ? 'end' : 'start';
    if (open && phase === next) { setOpen(false); return; }
    setPhase(next);
    setOpen(true);
  };
  const hint = phase === 'end' && start ? `עכשיו תאריך ${labels.end}` : `בחרו תאריך ${labels.start}`;

  const trigger = v === 'b' ? (
    <div className="grid grid-cols-2 gap-2">
      {[['start', start], ['end', end]].map(([k, iso]) => {
        const active = open && phase === k;
        return (
          <button
            key={k}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => toggle(k)}
            className={cn(
              'press flex min-h-[72px] min-w-0 flex-col items-start justify-center rounded-[16px] px-4 py-2.5 text-start transition-[box-shadow,background-color]',
              active ? 'bg-white shadow-[0_0_0_2px_#3E2BF1]' : 'bg-[#F7F8FB]',
              error && !iso && 'shadow-[0_0_0_1px_rgb(252,165,165)]',
            )}
          >
            <span className="text-[13px] font-medium text-[#1B2656]/55">{labels[k]}</span>
            <span className="mt-0.5 block w-full truncate text-[17px] font-semibold text-[#1B2656]"><DateText iso={iso} placeholder="בחרו" /></span>
          </button>
        );
      })}
    </div>
  ) : (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => toggle(start && !end ? 'end' : 'start')}
      className={cn(
        'press flex min-h-[56px] w-full min-w-0 items-center gap-3 rounded-[14px] border bg-white px-4 py-2 text-start transition-[border-color,box-shadow]',
        open ? 'border-[#3E2BF1] shadow-[0_0_0_3px_rgba(62,43,241,0.14)]' : 'border-[#E3E6EF]',
        error && !open && 'border-red-300 bg-red-50/40',
      )}
    >
      <CalendarDays aria-hidden className="h-5 w-5 shrink-0 text-[#1B2656]/45" />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-[16px] font-medium text-[#1B2656]">
        <DateText iso={start} placeholder={`${labels.start} ויציאה`} />
        {start ? <ChevronLeft aria-hidden className="h-4 w-4 shrink-0 text-[#1B2656]/35" /> : null}
        {start ? <DateText iso={end} placeholder={labels.end} /> : null}
      </span>
      {nights ? <span className="shrink-0 rounded-full bg-[#F7F8FB] px-2.5 py-1 text-[13px] font-semibold text-[#1B2656]/75">{heNights(nights)}</span> : null}
    </button>
  );

  return (
    <div className="min-w-0">
      {label ? (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span id={`${idPrefix}-label`} className="text-[15px] font-semibold text-[#1B2656]">{label}</span>
          {v === 'b' && nights ? <span className="text-[13px] font-semibold text-[#3E2BF1]">{heNights(nights)}</span> : null}
        </div>
      ) : null}
      <div role="group" aria-labelledby={label ? `${idPrefix}-label` : undefined}>{trigger}</div>
      <div
        id={panelId}
        hidden={!open}
        className={cn('mt-2 rounded-[18px] p-2', v === 'b' ? 'bg-white' : 'border border-[#E9EBF2] bg-white')}
      >
        {open ? <MonthCalendar start={start} end={end} onPick={pick} hint={hint} idPrefix={idPrefix} /> : null}
      </div>
      <SheetError id={errorId}>{error}</SheetError>
    </div>
  );
}

/** One date. value ISO, onChange(iso). */
export function DateField({ value = '', onChange, label = 'תאריך', error = '', errorId, idPrefix = 'df', optional = false, placeholder = 'בחרו תאריך' }) {
  const v = useSheetVariant();
  const [open, setOpen] = React.useState(false);
  const panelId = `${idPrefix}-cal`;
  return (
    <div className="min-w-0">
      {label ? (
        <span id={`${idPrefix}-label`} className="mb-2 flex items-baseline gap-1.5 text-[15px] font-semibold text-[#1B2656]">
          {label}
          {optional ? <span className="text-[13px] font-normal text-[#1B2656]/50">לא חובה</span> : null}
        </span>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={label ? `${idPrefix}-label ${idPrefix}-value` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'press flex h-12 w-full min-w-0 items-center gap-3 rounded-[14px] px-4 text-start text-[16px] transition-[border-color,box-shadow,background-color]',
          v === 'b'
            ? (open ? 'bg-white shadow-[0_0_0_2px_#3E2BF1]' : 'bg-[#F7F8FB]')
            : cn('border bg-white', open ? 'border-[#3E2BF1] shadow-[0_0_0_3px_rgba(62,43,241,0.14)]' : 'border-[#E3E6EF]'),
          error && 'border-red-300',
        )}
      >
        <CalendarDays aria-hidden className="h-5 w-5 shrink-0 text-[#1B2656]/45" />
        <span id={`${idPrefix}-value`} className={cn('min-w-0 flex-1 truncate', value ? 'text-[#1B2656]' : 'text-[#1B2656]/40')} dir="rtl">
          {value ? heDate(value) : placeholder}
        </span>
      </button>
      <div id={panelId} hidden={!open} className={cn('mt-2 rounded-[18px] p-2', v === 'b' ? 'bg-white shadow-[0_0_0_1px_rgba(27,38,86,0.06)]' : 'border border-[#E9EBF2] bg-white')}>
        {open ? (
          <MonthCalendar
            start={value}
            end=""
            idPrefix={idPrefix}
            onPick={(iso) => { onChange(iso); window.setTimeout(() => setOpen(false), 160); }}
          />
        ) : null}
      </div>
      <SheetError id={errorId}>{error}</SheetError>
    </div>
  );
}
