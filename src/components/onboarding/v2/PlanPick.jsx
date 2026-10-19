/**
 * Trial or plan. The 14-day free trial is the default and needs no card. Choosing a plan only records
 * the choice (orgSettings.plan_choice): there is no payment here. The trial starts either way, and the
 * setup journey links to the existing plans screen (/subscription) to complete it whenever they like.
 * Prices and limits come from config/pricing.js, the same source as the landing.
 */
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICING_PLANS, TRIAL_DAYS, CANCEL_LINE } from '@/config/pricing';

export default function PlanPick({ value = 'trial', onChange, compact = false }) {
  const trialOn = value === 'trial' || !value;
  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="איך מתחילים">
      <button type="button" role="radio" aria-checked={trialOn} onClick={() => onChange('trial')}
        className={cn('ob-press relative flex w-full flex-col gap-1 overflow-hidden rounded-[24px] p-5 text-start transition-colors',
          trialOn ? 'bg-brand-600 text-white shadow-[0_18px_40px_-18px_rgba(62,43,241,0.9)]' : 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05),0_8px_22px_-14px_rgba(27,38,86,0.2)]')}>
        <span className="flex items-center gap-2">
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border-2', trialOn ? 'border-white bg-white text-brand-600' : 'border-[#CBD0E0]')} aria-hidden>
            {trialOn ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
          </span>
          <span className="text-[19px] font-extrabold">{TRIAL_DAYS} יום ניסיון חינם</span>
          {!compact ? <span className={cn('ms-auto whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold', trialOn ? 'bg-white/20 text-white' : 'bg-[#E4E1FD] text-brand-700')}>מומלץ להתחלה</span> : null}
        </span>
        <span className={cn('ps-9 text-[15px] leading-snug', trialOn ? 'text-white/90' : 'text-ink-600')}>כל המערכת, בלי כרטיס אשראי. {CANCEL_LINE}</span>
      </button>

      <p className="mt-2 text-[15px] font-semibold text-ink-600">או לבחור מסלול כבר עכשיו</p>
      <div className={cn('grid gap-2.5', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3')}>
        {PRICING_PLANS.map((p) => {
          const on = value === p.key;
          return (
            <button key={p.key} type="button" role="radio" aria-checked={on} onClick={() => onChange(p.key)}
              className="ob2-option ob-press !min-h-[72px] !items-start sm:flex-col sm:!items-stretch sm:!gap-2">
              <span className={cn('ob2-radio mt-0.5 sm:hidden', on && 'is-on')} aria-hidden>{on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}</span>
              <span className="min-w-0 flex-1 text-start">
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-[17px] font-extrabold text-navy-900">{p.nameHe}</span>
                  {p.popular ? <span className="whitespace-nowrap rounded-full bg-[#E4E1FD] px-2 py-0.5 text-[12px] font-bold text-brand-700">הכי נבחר</span> : null}
                </span>
                <span className="mt-0.5 block text-[15px] text-ink-600">{p.limit}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-end sm:text-start" dir="ltr">
                <span className="text-[20px] font-extrabold tabular-nums text-navy-900">₪{p.price}</span>
                <span className="text-[13px] text-ink-600"> /חודש</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[14px] leading-snug text-ink-400">
        {trialOn ? 'אין חיוב בסוף הניסיון. ממשיכים רק אם בוחרים מסלול.' : `גם במסלול, ${TRIAL_DAYS} הימים הראשונים חינם. משלימים את המסלול מתי שנוח, במסך המסלולים.`}
      </p>
    </div>
  );
}
