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
              {shape !== 'tile' ? <span className="text-[15px] font-semibold">{shape === 'wide' ? 'הוספת תמונה של המקום' : 'תמונה'}</span> : null}
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

function renderTemplateClean(key, ctx) {
  // the sample booking has no guest page yet: drop its link line instead of showing a dead url
  return renderTemplate(key, ctx).split('\n').filter((l) => !/\/g\/(undefined|null)?$|\/g\/\s*$/.test(l.trim())).join('\n');
}

/** The confirmation message a guest would get, rendered by the real template with the owner's answers. */
export function sampleMessage(d) {
  const unit = d.units?.[0];
  const ci = addDays(todayISO(), 9);
  return renderTemplateClean('confirmation', {
    booking: { guest_name: 'נועה כהן', check_in_date: ci, check_out_date: addDays(ci, 2) },
    property: {
      name: unit?.name || 'המקום',
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
          <p className="text-[12px] text-[#54656F]">וואטסאפ</p>
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

/* ── added for the full first-run setup (location, photos, links, verify, multi-select) ── */

let settlementsCache = null;
function loadSettlements() {
  if (!settlementsCache) {
    settlementsCache = fetch('/data/il-settlements.json').then((r) => (r.ok ? r.json() : [])).catch(() => []);
  }
  return settlementsCache;
}
const norm = (v) => String(v || '').replace(/["'״׳`-]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Settlement picker: type two letters, tap your settlement. Source: the official list of Israeli
 * settlements (data.gov.il, יישובים). Anything not on the list can still be typed and kept.
 */
export function SettlementInput({ value, onChange, autoFocus }) {
  const id = useId();
  const [q, setQ] = useState(value || '');
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  React.useEffect(() => { let alive = true; loadSettlements().then((l) => { if (alive) setList(l); }); return () => { alive = false; }; }, []);
  React.useEffect(() => { setQ(value || ''); }, [value]);
  const nq = norm(q);
  const matches = nq.length < 2 ? [] : list
    .filter(([n]) => norm(n).includes(nq))
    .sort((a, b) => (norm(a[0]).startsWith(nq) ? 0 : 1) - (norm(b[0]).startsWith(nq) ? 0 : 1) || a[0].length - b[0].length)
    .slice(0, 6);
  const exact = list.some(([n]) => n === value);
  const listShown = open && matches.length > 0 && !(exact && matches.length === 1);
  return (
    <div className="relative flex flex-col gap-2">
      <label htmlFor={id} className="text-[16px] font-semibold text-navy-900">יישוב</label>
      <input id={id} className="ob-input" value={q} autoFocus={autoFocus} autoComplete="off" placeholder="מתחילים להקליד, למשל: ראש פינה"
        role="combobox" aria-expanded={listShown} aria-controls={listShown ? `${id}-list` : undefined} aria-autocomplete="list"
        onChange={(e) => { setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {listShown ? (
        <ul id={`${id}-list`} role="listbox" className="ob-fade overflow-hidden rounded-[18px] bg-white shadow-[0_2px_4px_rgba(27,38,86,0.06),0_18px_36px_-14px_rgba(27,38,86,0.25)]">
          {matches.map(([n, region]) => (
            <li key={n + region} role="option" aria-selected={n === value}>
              <button type="button" className="ob-press flex min-h-[56px] w-full items-center justify-between gap-3 border-b border-[#F0F2F7] px-5 text-start last:border-0"
                onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(n); setQ(n); setOpen(false); }}>
                <span className="text-[18px] font-semibold text-navy-900">{n}</span>
                {region ? <span className="text-[14px] text-ink-400">{region}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {exact ? <p className="flex items-center gap-1.5 text-[15px] font-medium text-[#0F6E4C]"><Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />{value}</p> : null}
    </div>
  );
}

/** Big gallery uploader: one huge "add photos" tile, multiple at once from phone or gallery; the first is the main photo. */
export function PhotoGallery({ photos = [], onChange, max = 8 }) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const add = async (files) => {
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type)).slice(0, Math.max(0, max - photos.length));
    if (!list.length) return;
    setBusy(true);
    const out = [];
    for (const f of list) { try { out.push(await fileToDataUrl(f, 960, 0.72)); } catch { /* skip that one */ } }
    setBusy(false);
    onChange([...photos, ...out].slice(0, max));
  };
  const remove = (k) => onChange(photos.filter((_, n) => n !== k));
  const main = (k) => onChange([photos[k], ...photos.filter((_, n) => n !== k)]);
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        className={cn('ob-press flex min-h-[132px] w-full flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed px-4 text-center',
          over ? 'border-brand-600 bg-brand-50' : 'border-[#C9C3FB] bg-white')} disabled={photos.length >= max}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_8px_18px_-8px_rgba(62,43,241,0.7)]">
          {busy ? <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/40 border-t-white motion-reduce:animate-none" /> : <ImagePlus className="h-7 w-7" strokeWidth={1.9} aria-hidden />}
        </span>
        <span className="text-[19px] font-bold text-navy-900">{photos.length ? 'עוד תמונות' : 'הוספת תמונות מהטלפון'}</span>
        <span className="text-[15px] text-ink-400">אפשר לבחור כמה ביחד{photos.length ? ` · ${photos.length} מתוך ${max}` : ''}</span>
      </button>
      <input ref={ref} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      {photos.length ? (
        <ul className="grid grid-cols-3 gap-2.5">
          {photos.map((src, k) => (
            <li key={src.slice(-24) + k} className="ob-pop relative aspect-square overflow-hidden rounded-[16px] bg-[#E9ECF4]" style={{ animationDelay: `${k * 40}ms` }}>
              <img src={src} alt={k === 0 ? 'התמונה הראשית' : `תמונה ${k + 1}`} className="h-full w-full object-cover" />
              {k === 0 ? <span className="absolute bottom-1.5 start-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[12px] font-bold text-navy-900">ראשית</span>
                : <button type="button" onClick={() => main(k)} className="absolute bottom-0 start-0 flex h-11 items-end px-1.5 pb-1.5" aria-label={`לקבוע את תמונה ${k + 1} כראשית`}><span className="rounded-full bg-white/85 px-2 py-0.5 text-[12px] font-semibold text-navy-900">לראשית</span></button>}
              <button type="button" onClick={() => remove(k)} className="absolute end-0 top-0 flex h-11 w-11 items-start justify-end p-1.5" aria-label={`הסרת תמונה ${k + 1}`}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-navy-900 shadow"><X className="h-4 w-4" strokeWidth={2.5} aria-hidden /></span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Multi-select big chips (checkbox semantics). */
export function MultiChips({ options, value = [], onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" role="checkbox" aria-checked={on} className="ob-chip ob-press gap-2"
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}>
            {on ? <Check className="h-[18px] w-[18px]" strokeWidth={3} aria-hidden /> : null}{o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Phone check without an SMS provider: send yourself a WhatsApp from ATLAS and confirm it arrived.
 * (Real SMS one-time codes need an SMS provider on the Supabase project.)
 */
export function VerifyPhone({ phone, verified, onVerified }) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  const intl = digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
  const [sent, setSent] = useState(false);
  if (verified) {
    return <p className="flex min-h-[52px] items-center gap-2 rounded-[16px] bg-[var(--st-mint-bg)] px-4 text-[16px] font-semibold text-[var(--st-mint-fg)]"><Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />המספר אומת</p>;
  }
  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_8px_22px_-12px_rgba(27,38,86,0.16)]">
      <p className="text-[16px] font-semibold text-navy-900">רוצים לוודא שהמספר נכון?</p>
      {!sent ? (
        <a href={`https://wa.me/${intl}?text=${encodeURIComponent('בדיקה מ-atlas: המספר שלי נכון.')}`} target="_blank" rel="noreferrer" onClick={() => setSent(true)}
          className="ob-press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#1FA855] px-5 text-[17px] font-bold text-white" aria-disabled={digits.length < 9}>
          שליחת הודעת בדיקה לעצמי
        </a>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ob-chip ob-press" onClick={onVerified}><Check className="me-1.5 h-5 w-5" strokeWidth={2.5} aria-hidden />קיבלתי, הכל טוב</button>
          <button type="button" className="ob-ghost ob-press" onClick={() => setSent(false)}>לא הגיע</button>
        </div>
      )}
    </div>
  );
}
