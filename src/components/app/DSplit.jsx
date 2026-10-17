/**
 * v8 D page frame: a wide centred column with a right context panel on desktop (no sidebar),
 * one column on phones. `aside` stacks after the main column on phones unless `asideOnPhone` is false.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export function DPage({ children, className }) {
  return <div className={cn('mx-auto w-full max-w-[var(--page-max,1280px)] px-5 pb-16 pt-2 lg:px-10 lg:pt-4', className)} dir="rtl">{children}</div>;
}

export function DSplit({ main, aside, asideLabel, asideOnPhone = true, className }) {
  return (
    <div className={cn('grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_380px]', className)}>
      <div className="min-w-0">{main}</div>
      {aside ? (
        <aside aria-label={asideLabel} className={cn('min-w-0 space-y-4 lg:sticky lg:top-[88px] lg:self-start', !asideOnPhone && 'hidden lg:block')}>
          {aside}
        </aside>
      ) : null}
    </div>
  );
}

/** Big bold phone-first title (the task-app ref): two short lines on phones, one line on desktop. */
export function DTitle({ children, sub, action, className }) {
  return (
    <div className={cn('mb-5 flex items-end justify-between gap-3 lg:mb-6', className)}>
      <div className="min-w-0">
        <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-navy-900 lg:text-[40px]">{children}</h1>
        {sub ? <p className="mt-2 text-[15px] text-ink-400">{sub}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Chip with a count circle, like "4 כניסות". */
export function CountChip({ on, count, children, onClick, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'press inline-flex h-12 shrink-0 items-center gap-2 rounded-full pe-4 ps-1.5 text-[14px] font-semibold transition-colors duration-150',
        on ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)] hover:bg-[#F7F8FC]',
      )}
      {...rest}
    >
      <span className={cn('tabular inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-[14px] font-bold', on ? 'bg-white text-navy-900' : 'bg-[#F0F1F7] text-navy-900')}>{count}</span>
      {children}
    </button>
  );
}

/** Tinted tag pill: sky / lilac / mint / red / slate (cool only). */
export function Tag({ tone = 'slate', children, className }) {
  const t = {
    sky: 'bg-[var(--st-sky-bg)] text-[var(--st-sky-fg)]',
    lilac: 'bg-[var(--st-lilac-bg)] text-[var(--st-lilac-fg)]',
    mint: 'bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]',
    red: 'bg-[var(--st-red-bg)] text-[var(--st-red-fg)]',
    slate: 'bg-[var(--st-slate-bg)] text-[var(--st-slate-fg)]',
    indigo: 'bg-[#ECEAFE] text-brand-700',
  }[tone];
  return (
    <span className={cn('inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold', t, className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}

/** Progress ring (track + arc), optional centre content. */
export function ProgressRing({ pct = 0, size = 44, stroke = 5, color = '#3E2BF1', track = '#ECEAFE', label, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct));
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {v > 0 ? <circle className="d-arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ '--c': c }} /> : null}
      </svg>
      {children ? <span className="absolute inset-0 flex items-center justify-center" aria-hidden>{children}</span> : null}
    </span>
  );
}
