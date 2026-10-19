/**
 * Frame for login, register and onboarding (v5, cool palette). The product is the hero: on desktop the
 * side panel shows a crisp, live-looking slice of the app (revenue card + today list) on a soft indigo
 * canvas. No photos, no warm tones. Phones get the form alone under the wordmark.
 * `photo` is accepted for backwards compatibility and ignored.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowUpRight } from 'lucide-react';
import { GuestAvatar } from '@/components/app/atoms';
import { Wordmark } from '@/components/app/shell/shared';
import { Sparkline } from '@/components/today/Sparkline';
import { cn } from '@/lib/utils';

const SPARK = [26260, 31010, 42400, 51820, 54410, 35830, 61540];

function PreviewRow({ name, time, title, meta, done }) {
  return (
    <div className="flex h-[60px] items-center gap-3 px-4">
      <GuestAvatar name={name || title} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-navy-900">{title}</span>
        <span className="block truncate text-[12px] text-ink-400"><span className="tabular font-medium text-ink-600">{time}</span> · {meta}</span>
      </span>
      {done ? (
        <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[var(--st-mint-bg)] px-2.5 text-[12px] font-semibold text-[var(--st-mint-fg)]"><Check className="h-3 w-3" strokeWidth={2.5} />בוצע</span>
      ) : (
        <span className="inline-flex h-7 items-center rounded-full bg-[#EEF0FF] px-3 text-[12px] font-semibold text-brand-700">נכנסו</span>
      )}
    </div>
  );
}

function ProductPreview({ caption }) {
  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[28px] bg-[#F2F3F8] px-12 py-12">
      {/* soft cool light, very subtle */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(62,43,241,0.10),rgba(62,43,241,0))]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(62,43,241,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(62,43,241,0.035)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="relative mx-auto w-full max-w-[440px]" dir="rtl">
        <p className="text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-navy-900">{caption}</p>
        <p className="mt-2 text-[15px] text-ink-600">הזמנות מכל הערוצים, תשלומים וניקיון. מסך אחד, בעברית.</p>

        <div className="relative mt-9">
          {/* revenue card: the one solid-indigo hero */}
          <div className="v5-rise v7-hero relative z-10 p-6" style={{ '--i': 1 }}>
            <div className="flex items-start justify-between">
              <p className="text-[13px] font-medium text-white/80">הכנסות החודש</p>
              <span aria-hidden className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15"><ArrowUpRight className="h-4 w-4" strokeWidth={1.75} /></span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="v5-num text-[34px] font-extrabold leading-none text-white" dir="ltr"><span className="me-1 text-[18px] font-bold text-white/70">₪</span>61,540</p>
                <p className="mt-3 inline-flex h-6 items-center gap-0.5 rounded-full bg-white/20 px-2 text-[12px] font-semibold text-white"><ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} /><span dir="ltr">+72%</span></p>
              </div>
              <Sparkline values={SPARK} width={128} height={48} color="#FFFFFF" dot="#3E2BF1" />
            </div>
          </div>
          {/* today card, layered below */}
          <div className="v5-rise v7-card relative mt-3 me-8 overflow-hidden pb-1" style={{ '--i': 2 }}>
            <div className="flex h-12 items-center justify-between px-4 pt-2">
              <span className="text-[14px] font-bold text-navy-900">כניסות ויציאות</span>
              <span className="text-[12px] text-ink-400">2 כניסות · 1 יציאה</span>
            </div>
            <PreviewRow time="15:00" title="משפחת לוי" meta="הזית · 3 לילות" />
            <PreviewRow time="15:00" title="Sarah Klein" meta="התאנה · 4 לילות" />
            <PreviewRow time="11:00" title="אורית בן חמו" meta="יציאה · הזית" done />
          </div>
        </div>

        <p className="mt-8 flex items-center gap-2 text-[13px] text-ink-400">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]"><Check className="h-3 w-3" strokeWidth={2.5} /></span>
          מסנכרן עם Booking.com ו-Airbnb · גיבוי יומי · תמיכה בעברית
        </p>
      </div>
    </div>
  );
}

export default function AuthShell({ children, caption = 'כל הצימר שלכם, במבט אחד.', wide = false, onKeyDown }) {
  return (
    <div className="min-h-[100dvh] bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" dir="rtl" onKeyDown={onKeyDown}>
      {/* form side (right in RTL) */}
      <main className="relative flex min-h-[100dvh] flex-col lg:min-h-0">
        <div className="flex h-16 shrink-0 items-center px-5 pt-[env(safe-area-inset-top)] lg:h-[88px] lg:px-16">
          <Link to="/" aria-label="atlas, לדף הבית" className="inline-flex min-h-[44px] items-center rounded-lg"><Wordmark size={21} /></Link>
        </div>
        <div className="flex flex-1 flex-col px-5 pb-10 pt-6 lg:px-16 lg:pt-0">
          <div className={cn('v5-rise mx-auto flex w-full flex-1 flex-col justify-start lg:justify-center lg:pb-20', wide ? 'max-w-[520px]' : 'max-w-[400px]')}>
            {children}
          </div>
        </div>
      </main>

      {/* product side (left in RTL), desktop only */}
      <aside aria-label="תצוגה של ATLAS" className="relative hidden p-4 lg:block">
        <div className="sticky top-4 h-[calc(100dvh-32px)]">
          <ProductPreview caption={caption} />
        </div>
      </aside>
    </div>
  );
}
