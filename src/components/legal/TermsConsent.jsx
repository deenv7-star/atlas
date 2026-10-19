/**
 * "קראתי והסכמתי לתקנון ולמדיניות הפרטיות" — an ACTIVE consent checkbox.
 *
 * Unchecked by default, a real <input type="checkbox"> (keyboard, screen readers, autofill-safe),
 * 44px touch target, RTL. The links open in a new tab so a half-filled form is never lost.
 * The parent owns `checked` and blocks its submit until it is true; pass `error` after a blocked
 * attempt to show the inline message (announced with role="alert").
 *
 * variant 'inline' (A): one quiet line under the form.
 * variant 'card'   (B): a bordered card that tints indigo once ticked, with the refund promise.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { CONSENT_VARIANT } from '@/config/consent';

const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' };
// Inline links are ~21px tall. Inline padding (cancelled by negative margin) grows the tap area to ≥44px
// on every line the link wraps to, without moving the text.
const LINK_HIT = 'relative z-[1] -mx-1.5 px-1.5 py-3 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]';
const SR_NEW_TAB = <span className="sr-only"> (נפתח בכרטיסייה חדשה)</span>;

export const CONSENT_ERROR = 'כדי להמשיך, סמנו שקראתם ואתם מסכימים לתקנון ולמדיניות הפרטיות.';

function Box({ id, checked, onChange, error, describedBy, size = 20 }) {
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <input
        id={id}
        type="checkbox"
        name="terms_consent"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        // No native `required`: the browser's own (English) bubble would pre-empt our Hebrew message.
        aria-required="true"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          'peer m-0 cursor-pointer appearance-none rounded-[6px] border-[1.5px] bg-white',
          'transition-[background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
          'checked:border-brand-600 checked:bg-brand-600',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-600/25 focus-visible:ring-offset-0',
          error ? 'border-danger-600' : 'border-[#BCC2D3] hover:border-brand-400',
        )}
        style={{ width: size, height: size }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute scale-75 text-white opacity-0 transition-[opacity,transform] duration-150 ease-out peer-checked:scale-100 peer-checked:opacity-100 motion-reduce:transition-none"
        style={{ width: size - 6, height: size - 6 }}
      >
        <path d="M3.5 8.4l2.9 2.8 6.1-6.4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ConsentText() {
  return (
    <>
      קראתי והסכמתי ל
      <a href="/terms" {...NEW_TAB} className={cn('font-semibold text-brand-600 underline decoration-brand-600/30 underline-offset-[3px] hover:decoration-brand-600', LINK_HIT)}>תקנון</a>
      {' '}ול
      <a href="/privacy" {...NEW_TAB} className={cn('font-semibold text-brand-600 underline decoration-brand-600/30 underline-offset-[3px] hover:decoration-brand-600', LINK_HIT)}>מדיניות הפרטיות</a>
    </>
  );
}

// refundLine: the card's ATLAS refund promise. Off on guest pages (BookDirect), where the guest deals with the host, not ATLAS.
export default function TermsConsent({ id = 'terms-consent', checked, onChange, error = false, variant = CONSENT_VARIANT, refundLine = true, className = '' }) {
  const errId = `${id}-error`;
  const describedBy = error ? errId : undefined;

  if (variant === 'card') {
    return (
      <div className={className}>
        <div
          className={cn(
            'relative flex items-start gap-3 rounded-[14px] border p-4 transition-colors duration-150 ease-out motion-reduce:transition-none',
            checked ? 'border-brand-600/60 bg-[#F1EFFE]' : error ? 'border-danger-600/70 bg-[#FDEEEE]/50' : 'border-line bg-[#F7F8FB]',
          )}
        >
          {/* The whole card is the label's hit area, except the two links. */}
          <label htmlFor={id} className="absolute inset-0 cursor-pointer rounded-[14px]" aria-hidden="true" />
          <span className="relative mt-[1px]"><Box id={id} checked={checked} onChange={onChange} error={error} describedBy={describedBy} size={22} /></span>
          <span className="relative min-w-0">
            <label htmlFor={id} className="block cursor-pointer text-[15px] font-medium leading-[1.5] text-navy-900">
              <ConsentText />
            </label>
            {refundLine ? <span className="mt-1 block text-[13px] leading-[1.5] text-ink-400">
              ביטול בכל רגע. לא קיבלתם את השירות? מקבלים את הכסף בחזרה.{' '}
              <a href="/cancellation" {...NEW_TAB} className="relative font-medium text-ink-600 underline decoration-ink-300 underline-offset-[3px] hover:text-navy-900">מדיניות ביטול{SR_NEW_TAB}</a>
            </span> : null}
          </span>
        </div>
        {error ? <p id={errId} role="alert" className="mt-2 text-[13px] font-medium text-danger-600">{CONSENT_ERROR}</p> : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative flex min-h-11 items-start gap-2.5 py-1">
        {/* The whole row (≥44px tall) toggles the box, except the two links. */}
        <label htmlFor={id} className="absolute inset-0 cursor-pointer" aria-hidden="true" />
        <span className="relative mt-[2px]"><Box id={id} checked={checked} onChange={onChange} error={error} describedBy={describedBy} /></span>
        <label htmlFor={id} className="relative cursor-pointer select-none text-[14px] leading-[1.6] text-ink-600">
          <ConsentText />
        </label>
      </div>
      {error ? <p id={errId} role="alert" className="mt-1 text-[13px] font-medium text-danger-600">{CONSENT_ERROR}</p> : null}
    </div>
  );
}
