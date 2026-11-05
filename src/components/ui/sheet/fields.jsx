/**
 * Field kit for AtlasSheet: white SheetGroup cards on the canvas sheet, soft-fill inputs, chips.
 * Rules: inputs 16px+ (no iOS zoom), taps 44px+, labels above, errors only after the owner acts.
 */
import * as React from 'react';
import { Check, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A block of related fields: a white card with an optional small title above it. */
export function SheetGroup({ title = null, className, children, ...rest }) {
  return (
    <section className={cn('mb-4', className)} {...rest}>
      {title ? <h3 className="mb-2 ps-1 text-[13px] font-semibold text-[#1B2656]/70">{title}</h3> : null}
      <div className="flex flex-col gap-4 rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(27,38,86,0.06),0_0_0_1px_rgba(27,38,86,0.04)]">
        {children}
      </div>
    </section>
  );
}

export function SheetError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[14px] font-medium leading-snug text-red-700">
      <AlertCircle className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Label + control + (error | hint). `optional` adds a quiet "לא חובה". */
export function SheetField({ label, htmlFor, labelId, error, errorId, hint = null, optional = false, className, children }) {
  return (
    <div className={cn('min-w-0', className)}>
      {label ? (
        <label htmlFor={htmlFor} id={labelId} className="mb-2 flex items-baseline gap-1.5 text-[15px] font-semibold text-[#1B2656]">
          {label}
          {optional ? <span className="text-[13px] font-normal text-[#1B2656]/70">לא חובה</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <SheetError id={errorId}>{error}</SheetError> : hint ? <p className="mt-1.5 text-[13px] leading-snug text-[#1B2656]/70">{hint}</p> : null}
    </div>
  );
}

export function inputClass(invalid) {
  return cn(
    'block h-12 w-full min-w-0 rounded-[16px] px-4 text-[16px] text-[#1B2656] outline-none transition-[background-color,box-shadow,border-color] duration-150',
    'placeholder:text-[#1B2656]/35 disabled:opacity-50',
    'border border-transparent bg-[#F7F8FB] focus:bg-white focus:shadow-[0_0_0_2px_#3E2BF1]',
    invalid && 'border-red-300 bg-red-50/40',
  );
}

export const SheetInput = React.forwardRef(function SheetInput({ className, invalid, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass(invalid), className)} aria-invalid={invalid || undefined} {...props} />;
});

export const SheetTextarea = React.forwardRef(function SheetTextarea({ className, invalid, rows = 2, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputClass(invalid), 'h-auto min-h-[76px] resize-none py-3 leading-relaxed', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

/** Native select (iOS wheel picker), styled like the inputs. options: [{value,label}]. */
export const SheetSelect = React.forwardRef(function SheetSelect({ className, invalid, options = [], placeholder = null, value, ...props }, ref) {
  return (
    <div className="relative min-w-0">
      <select
        ref={ref}
        value={value ?? ''}
        className={cn(inputClass(invalid), 'appearance-none pe-4 ps-10', !value && placeholder ? 'text-[#1B2656]/70' : '', className)}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {placeholder ? <option value="" disabled>{placeholder}</option> : null}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#1B2656]/45" />
    </div>
  );
});

/** One-of choice as chips (wrap on narrow screens). */
export function SheetSegmented({ value, onChange, options, ariaLabel, labelledBy, className }) {
  return (
    <div role="radiogroup" aria-label={labelledBy ? undefined : ariaLabel} aria-labelledby={labelledBy} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'press inline-flex h-11 min-w-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-[15px] font-medium transition-colors',
              on ? 'border-[#3E2BF1] bg-[#3E2BF1]/[0.06] text-[#3E2BF1]' : 'border-[#E3E6EF] bg-white text-[#1B2656]/80',
            )}
          >
            {on ? <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden /> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** "פרטים נוספים": collapsed extras. `summary` lists what is filled ("טלפון, מחיר"). */
export function SheetMore({ label = 'פרטים נוספים', summary = '', open, onOpenChange, children, id }) {
  const autoId = React.useId();
  const panelId = id || `${autoId}-more`;
  const btn = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => onOpenChange(!open)}
      className={cn(
        'press flex min-h-[52px] w-full items-center gap-3 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3E2BF1] focus-visible:ring-offset-2',
        'rounded-[20px] bg-white px-4 shadow-[0_1px_2px_rgba(27,38,86,0.06),0_0_0_1px_rgba(27,38,86,0.04)]',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[#1B2656]">{label}</span>
        <span className="block truncate text-[13px] text-[#1B2656]/70">{summary || 'טלפון, אימייל, מחיר והערות'}</span>
      </span>
      <ChevronDown aria-hidden className={cn('h-5 w-5 shrink-0 text-[#1B2656]/50 transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')} />
    </button>
  );
  return (
    <div className="mb-5">
      {open ? null : btn}
      <div id={panelId} hidden={!open}>
        {open ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="ps-1 text-[13px] font-semibold text-[#1B2656]/70">{label}</span>
              <button type="button" onClick={() => onOpenChange(false)} aria-expanded aria-controls={panelId} className="press -me-2 inline-flex min-h-[44px] items-center gap-1 px-2 text-[14px] font-medium text-[#1B2656]/70">
                הסתרה
                <ChevronDown aria-hidden className="h-4 w-4 rotate-180" />
              </button>
            </div>
            {children}
          </>
        ) : null}
      </div>
    </div>
  );
}

/** Sticky action area at the bottom of the sheet body. Put ONE SheetSubmit in it. */
export function SheetFooter({ note = null, children, className }) {
  const bg = '#F7F8FB';
  return (
    <div
      data-sheet-footer=""
      className={cn(
        'sticky bottom-0 z-10 -mx-5 mt-auto px-5 pt-3 sm:-mx-6 sm:px-6',
        '-mb-[calc(20px+env(safe-area-inset-bottom))] pb-[calc(14px+env(safe-area-inset-bottom))]',
        className,
      )}
      style={{ background: bg }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-5 h-5" style={{ background: `linear-gradient(to top, ${bg}, ${bg}00)` }} />
      {note ? <div className="mb-2.5" role="status">{note}</div> : null}
      {children}
    </div>
  );
}

/** The one primary button. state: idle | submitting | success. */
export function SheetSubmit({ children, state = 'idle', disabled, onClick, type = 'button', meta = null, className, ...rest }) {
  const busy = state === 'submitting';
  const done = state === 'success';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        'press relative flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#3E2BF1] px-5 text-[17px] font-semibold text-white',
        'shadow-[0_8px_20px_-8px_rgba(62,43,241,0.55)] transition-[background-color,opacity] duration-150 hover:bg-[#3322D9]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3E2BF1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
        className,
      )}
      {...rest}
    >
      {busy ? (
        <>
          <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
          שומרים…
        </>
      ) : done ? (
        <>
          <Check className="h-5 w-5" strokeWidth={2.4} aria-hidden />
          נשמר
        </>
      ) : (
        <>
          <span>{children}</span>
          {meta ? <span className="font-normal text-white/75">· {meta}</span> : null}
        </>
      )}
    </button>
  );
}

/** Quiet secondary action under the primary one (text only). */
export function SheetTextButton({ children, className, tone = 'neutral', ...rest }) {
  return (
    <button
      type="button"
      className={cn(
        'press mt-1 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[12px] text-[15px] font-medium',
        tone === 'danger' ? 'text-red-700' : 'text-[#1B2656]/70',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Server/save error at the top of the body. */
export function SheetBanner({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="mb-4 flex items-start gap-2 rounded-[16px] bg-red-50 px-4 py-3 text-[15px] leading-snug text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
