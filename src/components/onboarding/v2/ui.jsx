/**
 * Onboarding v2 kit, shared by both versions and the setup journey.
 * Mobile-first for owners of every age: 16px+ inputs (no iOS zoom), targets ≥ 48px, plain Hebrew,
 * the bottom bar rides above the on-screen keyboard (visualViewport), safe areas respected.
 */
import React, { useEffect, useId } from 'react';
import { Minus, Plus, Check, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEGAL } from '@/config/legal';
import { GUESTS_LIMIT } from '@/lib/onboarding/v2/model';
import '@/styles/onboarding.css';
import '@/styles/onboarding-v2.css';

/**
 * iPhone Safari keeps position:fixed bars under the keyboard. This publishes the keyboard height as
 * --ob-kb on <html> so the bar can sit on top of it, and keeps the focused field in view.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const root = document.documentElement;
    const apply = () => {
      if (!vv) return;
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      root.style.setProperty('--ob-kb', `${kb > 80 ? kb : 0}px`);
    };
    const onFocus = (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !el.matches('input, textarea')) return;
      setTimeout(() => { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* old Safari */ } }, 280);
    };
    apply();
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    document.addEventListener('focusin', onFocus);
    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      document.removeEventListener('focusin', onFocus);
      root.style.removeProperty('--ob-kb');
    };
  }, []);
}

export const HELP_WA = `https://wa.me/${LEGAL.WHATSAPP_NUMBER_INTL}?text=${encodeURIComponent('היי, אני באמצע ההגדרה של atlas ואשמח לעזרה')}`;

export function HelpLink({ className, compact = false }) {
  return (
    <a href={HELP_WA} target="_blank" rel="noopener noreferrer" aria-label={compact ? `צריך עזרה? וואטסאפ ${LEGAL.WHATSAPP_DISPLAY}` : undefined}
      className={cn('ob2-help ob-press', compact && 'is-compact', className)}>
      <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
      {compact ? <span aria-hidden>עזרה</span> : <span><span className="max-[359px]:hidden">צריך עזרה? </span>וואטסאפ <span dir="ltr" className="whitespace-nowrap tabular-nums">{LEGAL.WHATSAPP_DISPLAY}</span></span>}
    </a>
  );
}

/** A big − n + control. */
export function Count({ value, onChange, min = 1, max = GUESTS_LIMIT, label, size = 'lg' }) {
  const id = useId();
  return (
    <div className="flex flex-col items-center gap-2">
      {label ? <span id={id} className="text-[15px] font-semibold text-ink-600">{label}</span> : null}
      <div className="flex items-center gap-3" role="group" aria-labelledby={label ? id : undefined}>
        <button type="button" className="ob-round ob-press !h-14 !w-14" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`פחות${label ? `: ${label}` : ''}`}>
          <Minus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </button>
        <span className={cn('min-w-[2.6ch] text-center font-extrabold tabular-nums text-navy-900', size === 'lg' ? 'text-[40px] leading-none' : 'text-[28px] leading-none')} aria-live="polite">{value}</span>
        <button type="button" className="ob-round ob-press !h-14 !w-14" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`עוד${label ? `: ${label}` : ''}`}>
          <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** One row: label on the start side, − n + on the end side (fits 320px). */
export function CountRow({ label, value, onChange, min = 1, max = GUESTS_LIMIT }) {
  const id = useId();
  return (
    <div className="flex min-h-[72px] items-center gap-3 px-4">
      <span id={id} className="min-w-0 flex-1 text-[17px] font-bold text-navy-900">{label}</span>
      <div className="flex items-center gap-2" role="group" aria-labelledby={id}>
        <button type="button" className="ob-round ob-press !h-12 !w-12" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`פחות: ${label}`}><Minus className="h-5 w-5" strokeWidth={2.25} aria-hidden /></button>
        <span className="min-w-[2.4ch] text-center text-[28px] font-extrabold tabular-nums leading-none text-navy-900" aria-live="polite">{value}</span>
        <button type="button" className="ob-round ob-press !h-12 !w-12" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`עוד: ${label}`}><Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden /></button>
      </div>
    </div>
  );
}

/** Guests as a range: "לפחות" and "עד", each its own row. */
export function GuestRange({ min, max, onChange, disabled = false }) {
  return (
    <div className={cn('ob2-card flex flex-col divide-y divide-[#EEF0F5] py-1 transition-opacity', disabled && 'pointer-events-none opacity-40')} aria-disabled={disabled || undefined}>
      <CountRow label="לפחות" value={min} min={1} max={max} onChange={(v) => onChange([v, Math.max(v, max)])} />
      <CountRow label="עד" value={max} min={Math.max(1, min)} max={GUESTS_LIMIT} onChange={(v) => onChange([Math.min(min, v), v])} />
    </div>
  );
}

/** Tap-sized radio cards with a title and one plain line. */
export function Options({ options, value, onChange, label, labelledBy, className }) {
  return (
    <div role="radiogroup" aria-label={label} aria-labelledby={labelledBy} className={cn('flex flex-col gap-2.5', className)}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className="ob2-option ob-press">
            <span className={cn('ob2-radio', on && 'is-on')} aria-hidden>{on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}</span>
            <span className="min-w-0 flex-1 text-start">
              <span className="block text-[17px] font-bold leading-snug text-navy-900">{o.label}</span>
              {o.line ? <span className="mt-0.5 block text-[15px] leading-snug text-ink-600">{o.line}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A full-width switch row ("משתנה לפי יום ועונה"). */
export function SwitchRow({ checked, onChange, label, line }) {
  const id = useId();
  return (
    <button type="button" role="switch" aria-checked={checked} aria-labelledby={id} onClick={() => onChange(!checked)} className="ob2-option ob-press">
      <span className="min-w-0 flex-1 text-start" id={id}>
        <span className="block text-[17px] font-bold leading-snug text-navy-900">{label}</span>
        {line ? <span className="mt-0.5 block text-[15px] leading-snug text-ink-600">{line}</span> : null}
      </span>
      <span className={cn('ob2-switch', checked && 'is-on')} aria-hidden><span /></span>
    </button>
  );
}

/** Numeric ₪ field: 16px+, numeric keypad, LTR digits. */
export function MoneyInput({ value, onChange, label, placeholder = '0', autoFocus }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[16px] font-semibold text-navy-900">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-[19px] font-bold text-ink-400" aria-hidden>₪</span>
        <input id={id} className="ob-input !pl-11 tabular-nums" inputMode="numeric" dir="ltr" autoComplete="off" autoFocus={autoFocus}
          value={value ? String(value) : ''} placeholder={placeholder}
          onChange={(e) => onChange(Number(e.target.value.replace(/[^\d]/g, '').slice(0, 6)) || '')} />
      </div>
    </div>
  );
}

export function TimeChips({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {options.map((t) => (
        <button key={t} type="button" role="radio" aria-checked={value === t} onClick={() => onChange(t)} className="ob2-chip ob-press tabular-nums">{t}</button>
      ))}
    </div>
  );
}

/** Thin progress bar with a readable label for screen readers. */
export function Progress({ value, total, label }) {
  const pct = Math.max(0, Math.min(1, total ? value / total : 0));
  return (
    <div className="flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} aria-label={label}>
      <div className="h-2 overflow-hidden rounded-full bg-[#E4E1FD]">
        <div className="h-full origin-right rounded-full bg-brand-600 transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${pct})` }} />
      </div>
    </div>
  );
}

/** Circular progress (setup card and checklist header). */
export function Ring({ value, total, size = 56, stroke = 6, className, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, value / total) : 0;
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4E1FD" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3E2BF1" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}
