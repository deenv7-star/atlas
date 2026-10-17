/**
 * Onboarding v1 kit: the few big, friendly controls both designs share.
 * Every target is at least 48px (most are 52-60px); type is large; labels are plain Hebrew.
 */
import React, { useId, useRef, useState } from 'react';
import { Minus, Plus, Camera, ImagePlus, Check, Copy, ClipboardPaste, Link2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fileToDataUrl, PROVIDERS } from '@/lib/onboarding/store';
import { renderTemplate } from '@/lib/stay/whatsapp';
import { addDays, todayISO, formatMoney } from '@/lib/stay/format';
import '@/styles/onboarding.css';

export function Primary({ children, className, ...rest }) {
  return <button type="button" className={cn('ob-primary ob-press', className)} {...rest}>{children}</button>;
}

export function Ghost({ children, className, ...rest }) {
  return <button type="button" className={cn('ob-ghost ob-press', className)} {...rest}>{children}</button>;
}

export function Field({ label, hint, error, children, id }) {
  return (
    <div className="flex flex-col gap-2">
      {label ? <label htmlFor={id} className="text-[16px] font-semibold text-navy-900">{label}</label> : null}
      {children}
      {error ? <p className="text-[15px] font-medium text-[#B4303A]" role="alert">{error}</p>
        : hint ? <p className="text-[15px] text-ink-400">{hint}</p> : null}
    </div>
  );
}

export function BigInput({ label, hint, error, className, inputRef, ...rest }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <input id={id} ref={inputRef} className={cn('ob-input', className)} aria-invalid={error ? 'true' : undefined} {...rest} />
    </Field>
  );
}

/** − 2 + with a big readable number. */
export function Stepper({ value, onChange, min = 1, max = 20, label, unit, size = 'lg' }) {
  const big = size === 'lg';
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button type="button" className="ob-round ob-press" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`פחות ${label || ''}`.trim()}>
        <Minus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>
      <span className={cn('min-w-[3ch] text-center font-extrabold tabular-nums text-navy-900', big ? 'text-[34px]' : 'text-[24px]')} aria-live="polite">
        {value}{unit ? <span className="ms-1 text-[15px] font-semibold text-ink-400">{unit}</span> : null}
      </span>
      <button type="button" className="ob-round ob-press" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`עוד ${label || ''}`.trim()}>
        <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}

export function Chips({ options, value, onChange, label, className }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-2.5', className)}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const text = typeof o === 'object' ? o.label : o;
        return (
          <button key={v} type="button" role="radio" aria-checked={value === v} className="ob-chip ob-press tabular-nums" onClick={() => onChange(v)}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Tap (or drop a file) to add a photo. Shows the photo itself once chosen.
 * shape: 'circle' (owner) | 'wide' (complex cover) | 'tile' (a unit)
 */
export function PhotoPick({ value, onChange, label, shape = 'circle', max = 640, className, children }) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState('');
  const take = async (file) => {
    setErr('');
    try { onChange(await fileToDataUrl(file, max)); } catch (e) { setErr(e.message); }
  };
  const box = shape === 'circle' ? 'h-[112px] w-[112px] rounded-full' : shape === 'tile' ? 'h-[92px] w-[92px] rounded-[18px]' : 'h-[150px] w-full rounded-[22px]';
  return (
    <div className={cn('flex flex-col items-center gap-2', shape === 'wide' && 'items-stretch', className)}>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) take(f); }}
        className={cn('ob-press relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed bg-white text-ink-400',
          over ? 'border-brand-600 bg-brand-50 text-brand-600' : 'border-[#D5D9E6]', value && 'border-solid border-transparent', box)}
        aria-label={value ? `${label}: להחליף תמונה` : label}
      >
        {value ? <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          : children || (
            <span className="flex flex-col items-center gap-1.5">
              {shape === 'circle' ? <Camera className="h-7 w-7" strokeWidth={1.75} aria-hidden /> : <ImagePlus className="h-7 w-7" strokeWidth={1.75} aria-hidden />}
              {shape !== 'tile' ? <span className="text-[15px] font-semibold">{shape === 'wide' ? 'הוספת תמונה של המתחם' : 'תמונה'}</span> : null}
            </span>
          )}
        {value ? (
          <span className="absolute bottom-1.5 end-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow" aria-hidden>
            <Camera className="h-4 w-4" strokeWidth={2} />
          </span>
        ) : null}
      </button>
      <input ref={ref} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) take(f); e.target.value = ''; }} />
      {err ? <p className="text-[14px] text-[#B4303A]" role="alert">{err}</p> : null}
    </div>
  );
}

/** The confirmation message a guest would get, rendered by the real template with the owner's answers. */
export function sampleMessage(d) {
  const unit = d.units?.[0];
  const ci = addDays(todayISO(), 9);
  return renderTemplate('confirmation', {
    booking: { guest_name: 'נועה כהן', check_in_date: ci, check_out_date: addDays(ci, 2) },
    property: {
      name: unit?.name || 'הצימר',
      guest_info: { check_in_time: d.checkIn, check_out_time: d.checkOut, host_name: d.hostName || d.ownerName || '', closing_line: d.waGreeting },
    },
    orgName: d.businessName,
  });
}

export function WhatsAppPreview({ text, title = 'נועה כהן', className }) {
  return (
    <div className={cn('overflow-hidden rounded-[26px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.05),0_18px_40px_-16px_rgba(27,38,86,0.25)]', className)} aria-label="כך האורח יראה את ההודעה">
      <div className="flex items-center gap-3 bg-[#F0F2F5] px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DFE5E7] text-[14px] font-bold text-[#54656F]" aria-hidden>נכ</span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[#111B21]">{title}</p>
          <p className="text-[12px] text-[#667781]">וואטסאפ</p>
        </div>
      </div>
      <div className="ob-wa rounded-none">
        <div className="ob-wa-bubble" dir="rtl">
          {text}
          <span className="ob-wa-time">10:24 <Check className="inline h-3 w-3 text-[#53BDEB]" strokeWidth={3} aria-hidden /></span>
        </div>
      </div>
    </div>
  );
}

const HOWTO = {
  BOOKING_COM: [
    'נכנסים ל-Booking.com לניהול הנכס (Extranet)',
    'תעריפים וזמינות ← סנכרון לוחות שנה ← ייצוא',
    'מעתיקים את הקישור ומדביקים כאן',
  ],
  AIRBNB: [
    'נכנסים ל-Airbnb ← לוח שנה של המודעה',
    'זמינות ← חיבור לוחות שנה ← ייצוא לוח שנה',
    'מעתיקים את הקישור ומדביקים כאן',
  ],
};

/** A slow, looping three-frame how-to (static list under reduced motion). */
export function IcalHowTo({ provider }) {
  const p = PROVIDERS[provider];
  const steps = HOWTO[provider];
  const icons = [Link2, Copy, ClipboardPaste];
  return (
    <div className="rounded-[20px] bg-[#F6F7FB] p-4">
      <div className="ob-how grid min-h-[86px]" aria-hidden>
        {steps.map((s, i) => {
          const Icon = icons[i];
          return (
            <div key={s} className="col-start-1 row-start-1 flex items-center gap-3">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] text-white" style={{ background: p.color }}>
                <Icon className="h-6 w-6" strokeWidth={1.9} />
                {i === 2 ? <span className="ob-cursor absolute -bottom-1 -start-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-600" /> : null}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink-400">שלב {i + 1} מתוך 3</p>
                <p className="text-[16px] font-semibold leading-snug text-navy-900">{s}</p>
              </div>
            </div>
          );
        })}
      </div>
      <ol className="sr-only">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
    </div>
  );
}

export function LinkPaste({ value, onChange, label, valid }) {
  const id = useId();
  const paste = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) onChange(t.trim()); } catch { /* permission denied: type instead */ }
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-semibold text-navy-900">{label}</label>
      <div className="flex items-center gap-2">
        <input id={id} dir="ltr" inputMode="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…ics"
          className="ob-input !min-h-[52px] !text-[16px]" aria-invalid={value && !valid ? 'true' : undefined} />
        {value ? (
          <button type="button" className="ob-round ob-press shrink-0" onClick={() => onChange('')} aria-label="ניקוי הקישור"><X className="h-5 w-5" aria-hidden /></button>
        ) : (
          <button type="button" className="ob-round ob-press shrink-0" onClick={paste} aria-label="הדבקה"><ClipboardPaste className="h-5 w-5" aria-hidden /></button>
        )}
      </div>
      {value && !valid ? <p className="text-[14px] text-[#B4303A]">זה לא נראה כמו קישור לוח שנה. הוא מתחיל ב-https ונגמר בדרך כלל ב-ics.</p> : null}
      {value && valid ? <p className="flex items-center gap-1.5 text-[14px] font-medium text-[#0F6E4C]"><Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />קישור תקין</p> : null}
    </div>
  );
}

export const DEPOSIT_OPTIONS = [
  { value: 'none', label: 'בלי מקדמה' },
  { value: '30', label: '30%' },
  { value: '50', label: '50%' },
  { value: 'full', label: 'תשלום מלא' },
];

export function depositLine(dep, price) {
  if (dep === 'none') return 'האורחים משלמים בהגעה';
  if (dep === 'full') return `תשלום מלא בהזמנה (${formatMoney(price)} ללילה)`;
  return `מקדמה של ${dep}% (${formatMoney(Math.round((Number(price) || 0) * Number(dep) / 100))} על לילה אחד)`;
}

export const CHECKIN_TIMES = ['14:00', '15:00', '16:00'];
export const CHECKOUT_TIMES = ['10:00', '11:00', '12:00'];
