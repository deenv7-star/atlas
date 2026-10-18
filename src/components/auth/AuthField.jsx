/**
 * One sign-up field: visible label, 52px input (≥44px target), inline Hebrew error tied with aria-describedby,
 * a quiet check once valid, optional show/hide for passwords. Error space is reserved only when shown.
 */
import React, { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthField({
  id, label, hint, error, ok, type = 'text', password = false, size = 'md', className, inputClassName, inputRef, children, ...rest
}) {
  const [show, setShow] = useState(false);
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('font-semibold text-navy-900', size === 'lg' ? 'text-[15px]' : 'text-[14px]')}>{label}</label>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type={password ? (show ? 'text' : 'password') : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'block w-full rounded-[14px] border bg-white text-navy-900 placeholder:text-ink-300',
            'transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
            'focus:outline-none focus:border-brand-600 focus:shadow-[0_0_0_4px_rgba(62,43,241,0.14)]',
            size === 'lg' ? 'h-[60px] px-4 text-[19px] font-semibold' : 'h-[52px] px-4 text-[16px]',
            error ? 'border-danger-500' : 'border-[#DCE0EB] hover:border-[#C5CADB]',
            password ? 'pl-14' : ok ? 'pl-11' : '',
            inputClassName,
          )}
          {...rest}
        />
        {password ? (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute left-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[10px] text-ink-400 hover:text-navy-900"
            aria-label={show ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}
          >
            {show ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
          </button>
        ) : ok ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-brand-50 text-brand-600" aria-hidden>
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      {children}
      {hint && !error ? <p id={hintId} className="text-[13px] text-ink-400">{hint}</p> : null}
      {error ? <p id={errId} role="alert" className="text-[13px] font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}

/** Four-segment strength meter (indigo only), with the word read out to screen readers. */
export function StrengthMeter({ strength, value }) {
  if (!value) return null;
  const n = Math.max(1, Math.min(4, Math.ceil(((strength?.score || 0) / 5) * 4)));
  return (
    <div className="flex items-center gap-2 pt-0.5">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-[#E6E8F0]">
            <span className="block h-full origin-right rounded-full bg-brand-600 transition-transform duration-300 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${k < n ? 1 : 0})` }} />
          </span>
        ))}
      </div>
      <span className="min-w-[44px] text-[12px] font-semibold text-ink-600">{strength?.label}</span>
    </div>
  );
}
