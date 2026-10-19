/**
 * ATLAS design-system primitives. Every page composes from these so type, spacing,
 * radius, color and states stay identical across the app (tokens: src/styles/brand.css).
 */
import HelpHint from '@/components/help/HelpHint';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CountUp, GuestAvatar } from '@/components/app/atoms';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';

/* ── Formatting (brand voice: "יום ו׳, 16 באוק׳", "‏₪1,250") ───────────────── */
const HEB_DAY_LETTER = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const HEB_MONTH_SHORT = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return isValid(v) ? v : null;
  try {
    const d = parseISO(String(v));
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}
export function fmtDay(v, { weekday = true } = {}) {
  const d = toDate(v);
  if (!d) return '';
  const core = `${d.getDate()} ב${HEB_MONTH_SHORT[d.getMonth()]}`;
  return weekday ? `יום ${HEB_DAY_LETTER[d.getDay()]}, ${core}` : core;
}
export function fmtShort(v) {
  const d = toDate(v);
  return d ? `${d.getDate()} ב${HEB_MONTH_SHORT[d.getMonth()]}` : '';
}
export function fmtMoney(n, { compact = false } = {}) {
  const num = Number(n) || 0;
  if (compact && Math.abs(num) >= 10000) return `\u200F₪${(num / 1000).toLocaleString('he-IL', { maximumFractionDigits: 1 })}K`;
  return `\u200F₪${num.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
}
export function fmtMonthYear(d) {
  return format(d, 'LLLL yyyy', { locale: he });
}

/* ── Channels (identical everywhere) ───────────────────────────────────────── */
export const CHANNELS = {
  booking: { key: 'booking', label: 'Booking.com', short: 'Booking', color: 'var(--ch-booking)', hex: '#1B2656' },
  airbnb: { key: 'airbnb', label: 'Airbnb', short: 'Airbnb', color: 'var(--ch-airbnb)', hex: '#EF5B5B' },
  direct: { key: 'direct', label: 'ישיר', short: 'ישיר', color: 'var(--ch-direct)', hex: '#3E2BF1' },
  other: { key: 'other', label: 'אחר', short: 'אחר', color: 'var(--ch-other)', hex: '#8C93AB' },
};
export function channelOf(source) {
  const s = String(source || 'direct').toLowerCase();
  if (s.includes('airbnb')) return CHANNELS.airbnb;
  if (s.includes('booking')) return CHANNELS.booking;
  if (!s || s === 'direct' || s.includes('direct') || s.includes('website') || s.includes('phone') || s.includes('whatsapp')) return CHANNELS.direct;
  return CHANNELS.other;
}
export function ChannelDot({ source, className }) {
  const ch = channelOf(source);
  return <span aria-hidden className={cn('inline-block h-2 w-2 shrink-0 rounded-full', className)} style={{ background: ch.color }} />;
}
export function ChannelBadge({ source, className }) {
  const ch = channelOf(source);
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full bg-[#F1F2F7] px-3 text-[13px] font-medium text-navy-900', className)}>
      <ChannelDot source={source} />
      {ch.short}
    </span>
  );
}

/* ── Status pills ──────────────────────────────────────────────────────────── */
/* v7: tinted cool pills (owner refs). mint = paid/done, sky = confirmed, lilac = pending, soft red = overdue. */
export const TONES = {
  mint: { bg: 'var(--st-mint-bg)', fg: 'var(--st-mint-fg)' },
  sky: { bg: 'var(--st-sky-bg)', fg: 'var(--st-sky-fg)' },
  lilac: { bg: 'var(--st-lilac-bg)', fg: 'var(--st-lilac-fg)' },
  red: { bg: 'var(--st-red-bg)', fg: 'var(--st-red-fg)' },
  slate: { bg: 'var(--st-slate-bg)', fg: 'var(--st-slate-fg)' },
  brand: { bg: '#E9E7FE', fg: '#3E2BF1' },
};
const TONE_ALIAS = { success: 'mint', warning: 'lilac', amber: 'lilac', danger: 'red', neutral: 'slate', info: 'sky' };
export function toneOf(t) { return TONES[t] || TONES[TONE_ALIAS[t]] || TONES.slate; }
export const STATUS_META = {
  // bookings
  PENDING: { label: 'ממתינה', tone: 'lilac' },
  APPROVED: { label: 'מאושרת', tone: 'sky' },
  CONFIRMED: { label: 'מאושרת', tone: 'sky' },
  CHECKED_IN: { label: 'בשהייה', tone: 'brand' },
  CHECKED_OUT: { label: 'הסתיימה', tone: 'neutral' },
  CANCELLED: { label: 'בוטלה', tone: 'danger' },
  WAITLIST: { label: 'המתנה', tone: 'neutral' },
  // leads
  NEW: { label: 'חדש', tone: 'brand' },
  CONTACTED: { label: 'בטיפול', tone: 'warning' },
  OFFER_SENT: { label: 'הצעה נשלחה', tone: 'sky' },
  REJECTED: { label: 'לא רלוונטי', tone: 'neutral' },
  LOST: { label: 'לא נסגר', tone: 'neutral' },
  // payments
  PAID: { label: 'שולם', tone: 'success' },
  OVERDUE: { label: 'באיחור', tone: 'danger' },
  FAILED: { label: 'לא עבר', tone: 'danger' },
  REFUNDED: { label: 'הוחזר', tone: 'neutral' },
  // tasks
  COMPLETED: { label: 'בוצע', tone: 'success' },
  IN_PROGRESS: { label: 'בביצוע', tone: 'brand' },
};
export function StatusPill({ status, label, tone, className }) {
  const meta = STATUS_META[String(status || '').toUpperCase()] || { label: label || status || '', tone: 'neutral' };
  const t = toneOf(tone || meta.tone);
  return (
    <span className={cn('inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold', className)} style={{ background: t.bg, color: t.fg }}>
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'currentColor', opacity: 0.75 }} />
      {label || meta.label}
    </span>
  );
}

/** Small "+12%" pill beside a big number. On the indigo hero it turns white-on-glass. */
export function DeltaPill({ pct, onHero = false, className }) {
  if (pct == null || !Number.isFinite(pct)) return null;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const style = onHero
    ? { background: 'rgba(255,255,255,0.18)', color: '#fff' }
    : up ? { background: 'var(--st-mint-bg)', color: 'var(--st-mint-fg)' } : { background: 'var(--st-red-bg)', color: 'var(--st-red-fg)' };
  return (
    <span className={cn('inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-[12px] font-semibold', className)} style={style}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      <span className="tabular" dir="ltr">{up ? '+' : '−'}{Math.abs(Math.round(pct))}%</span>
    </span>
  );
}

/** Round icon button (44px on touch, 40px with a fine pointer). */
export const IconButton = React.forwardRef(function IconButton({ as: Comp = 'button', label, tone = 'plain', className, children, ...rest }, ref) {
  const toneCls = {
    plain: 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.06)] ring-1 ring-inset ring-[#E8EAF2] hover:bg-[#F7F8FC]',
    soft: 'bg-[#EEF0F6] text-navy-900 hover:bg-[#E6E9F2]',
    brand: 'bg-brand-600 text-white hover:bg-brand-500',
    glass: 'bg-white/15 text-white hover:bg-white/25',
  }[tone];
  return (
    <Comp ref={ref} aria-label={label} {...(Comp === 'button' ? { type: 'button' } : {})} className={cn('press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full [&_svg]:h-[19px] [&_svg]:w-[19px]', toneCls, className)} {...rest}>
      {children}
    </Comp>
  );
});

/** The round ↗ mark in a card corner: tells the owner the whole card opens. Decorative (the card is the link). */
export function CardArrow({ onHero = false, className }) {
  return (
    <span aria-hidden className={cn('v7-arrow inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full', onHero ? 'bg-white/15 text-white' : 'bg-[#F1F2F7] text-navy-900', className)}>
      <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
  );
}

/* ── Layout primitives ─────────────────────────────────────────────────────── */
export function Page({ children, className, wide = false }) {
  return (
    <div className={cn('mx-auto w-full px-5 pb-16 pt-3 md:px-10 md:pt-5', wide ? 'max-w-[1400px]' : 'max-w-[var(--page-max,1200px)]', className)} dir="rtl">
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, children, className, help, tour }) {
  return (
    <header data-tour={tour} className={cn('v5-rise mb-7 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-1 text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 md:text-[34px]">
          <span className="min-w-0">{title}</span>
          {help ? <HelpHint id={help} /> : null}
        </h1>
        {subtitle ? <p className="mt-2 text-[15px] text-ink-400">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({ as: Comp = 'div', className, children, ...rest }) {
  return (
    <Comp className={cn('v7-card', className)} {...rest}>
      {children}
    </Comp>
  );
}

export function Section({ title, subtitle, action, children, className, bodyClassName, icon: Icon, help }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex min-h-[60px] items-center justify-between gap-3 px-5 pt-5 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            
            <div className="min-w-0">
              <h2 className="flex min-w-0 items-center gap-0.5 text-[17px] font-bold text-navy-900"><span className="truncate">{title}</span>{help ? <HelpHint id={help} /> : null}</h2>
              {subtitle ? <p className="truncate text-[13px] text-ink-400">{subtitle}</p> : null}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-5 pt-3 md:px-6', bodyClassName)}>{children}</div>
    </Card>
  );
}

/** A quiet number. No icon squares (simplicity rules); amber/danger tone only tints the value. */
/** "₪12,300" / "84%" / 7 count up from zero; anything else renders as is. */
function AnimatedValue({ value }) {
  if (typeof value === 'number') return <CountUp value={value} format={(n) => n.toLocaleString('he-IL')} />;
  const m = typeof value === 'string' ? value.match(/^([^\d-]*)(\d[\d,]*)([^\d]*)$/) : null;
  if (!m) return value ?? null;
  const n = Number(m[2].replace(/,/g, ''));
  return <CountUp value={n} format={(x) => `${m[1]}${x.toLocaleString('en-US')}${m[3]}`} />;
}

export function StatTile({ label, value, hint, tone = 'brand', className, loading, icon: Icon, attention, to, hero = false, delta, help }) {
  const valueCls = hero ? 'text-white' : tone === 'danger' ? 'text-[var(--st-red-fg)]' : 'text-navy-900';
  const Comp = to ? Link : 'div';
  return (
    <Comp
      {...(to ? { to } : {})}
      className={cn('v5-rise flex min-w-0 flex-col gap-1 px-5 py-5 md:px-6', hero ? 'v7-hero' : 'v7-card', to && 'press v7-lift', className)}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cn('flex min-w-0 items-center gap-2 truncate text-[14px] font-medium', hero ? 'text-white/80' : 'text-ink-400')}>
          {label}
          {attention ? <span aria-label="דורש תשומת לב" className="h-1.5 w-1.5 rounded-full bg-attention" /> : null}
        </span>
        {help && !to ? <HelpHint id={help} tone={hero ? 'onHero' : 'plain'} /> : null}
        {to ? <CardArrow onHero={hero} className="-me-1 -mt-1" /> : null}
      </span>
      {loading ? (
        <SkelLine className="mt-1 h-9 w-24" />
      ) : (
        <span className={cn('v5-num mt-1 whitespace-nowrap text-[28px] font-extrabold leading-tight md:text-[32px]', valueCls)}><AnimatedValue value={value} /></span>
      )}
      {hint || delta != null ? (
        <span className={cn('mt-0.5 flex min-w-0 items-center gap-2 text-[13px]', hero ? 'text-white/75' : 'text-ink-400')}>
          {delta != null ? <DeltaPill pct={delta} onHero={hero} /> : null}
          {hint ? <span className="truncate">{hint}</span> : null}
        </span>
      ) : null}
    </Comp>
  );
}

/** Pill tabs / filter pills. The chosen pill fills navy; the rest are quiet white pills. */
export function SegmentedControl({ options, value, onChange, className, ariaLabel, size = 'md' }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('v7-strip inline-flex max-w-full gap-1.5 overflow-x-auto p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'press inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold',
              size === 'sm' ? 'h-11 px-3.5 text-[13px]' : 'h-11 px-4 text-[14px]',
              active
                ? 'bg-navy-900 text-white shadow-[0_6px_14px_-6px_rgba(27,38,86,0.5)]'
                : 'bg-white text-ink-600 ring-1 ring-inset ring-[#E3E6EF] hover:text-navy-900 hover:ring-[#D2D6E3]',
            )}
          >
            {o.label}
            {o.count != null ? (
              <span className={cn('tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[12px]', active ? 'bg-white/20 text-white' : 'bg-[#EEF0F6] text-ink-600')}>{o.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, action, className, compact = false, photo }) {
  return (
    <div className={cn('v5-rise flex flex-col items-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      {Icon || photo ? (
        <span className="relative mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ECEAFE]" aria-hidden>
          {Icon ? <Icon className="relative h-7 w-7 text-brand-600" strokeWidth={1.5} /> : null}
        </span>
      ) : null}
      <p className="text-[17px] font-semibold text-navy-900">{title}</p>
      {description ? <p className="mt-1.5 max-w-sm text-[15px] text-ink-400">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-6">{actionLabel}</Button>
      ) : null}
    </div>
  );
}

/** Calm placeholder for a feature that is not switched on for this account yet. */
export function ComingSoon({ icon: Icon, title, description, className }) {
  return (
    <Card className={cn('v5-rise', className)}>
      <div className="flex flex-col items-center px-6 py-16 text-center">
        {Icon ? (
          <span className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[16px] border border-line bg-white shadow-card" aria-hidden>
            <span className="absolute inset-[5px] rounded-[11px] bg-[#F4F3FF]" />
            <Icon className="relative h-6 w-6 text-brand-600" strokeWidth={1.5} />
          </span>
        ) : null}
        <span className="mb-3 inline-flex h-7 items-center rounded-full border border-line bg-white px-3 text-[13px] font-medium text-ink-600">בקרוב</span>
        <p className="text-[17px] font-semibold text-navy-900">{title}</p>
        {description ? <p className="mt-1.5 max-w-sm text-[15px] text-ink-400">{description}</p> : null}
      </div>
    </Card>
  );
}

export function SkelLine({ className, style }) {
  return <div aria-hidden className={cn('atlas-skeleton h-4 rounded-[8px]', className)} style={style} />;
}
export function SkelRows({ rows = 3, avatar = true }) {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="טוען">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {avatar ? <SkelLine className="h-10 w-10 shrink-0 rounded-[10px]" /> : null}
          <div className="flex-1 space-y-2">
            <SkelLine className="h-4 w-2/5" />
            <SkelLine className="h-3 w-1/4" />
          </div>
          <SkelLine className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Ends an endless skeleton: after `ms` the caller shows a calm retry state instead. */
export function useLoadingGuard(isLoading, ms = 12000) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return undefined;
    }
    const t = window.setTimeout(() => setTimedOut(true), ms);
    return () => window.clearTimeout(t);
  }, [isLoading, ms]);
  return timedOut;
}

export function SlowLoadNotice({ onRetry, className }) {
  return (
    <div role="status" className={cn('v7-card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <p className="font-bold text-navy-900">הטעינה לוקחת יותר מהרגיל</p>
        <p className="text-[14px] text-ink-600">ייתכן שהחיבור איטי. אפשר לנסות שוב, הנתונים שכבר נטענו נשמרים.</p>
      </div>
      <Button variant="outline" onClick={onRetry}>נסו שוב</Button>
    </div>
  );
}

export function Avatar({ name, className }) {
  return <GuestAvatar name={String(name || 'א')} size={40} className={className} />;
}

/** Row for lists (bookings, leads, payments): large hit area, chevron, press feedback. */
export function ListRow({ as: Comp = 'div', leading, title, meta, trailing, className, ...rest }) {
  return (
    <Comp
      className={cn('press v7-row flex min-h-[64px] items-center gap-3 rounded-[16px] px-3 py-2.5 text-start', className)}
      {...rest}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-navy-900">{title}</p>
        {meta ? <div className="mt-0.5 truncate text-[13px] text-ink-400">{meta}</div> : null}
      </div>
      {trailing}
    </Comp>
  );
}

export function monthShort(v) {
  const d = toDate(v);
  return d ? HEB_MONTH_SHORT[d.getMonth()] : '';
}
export function dayNum(v) {
  const d = toDate(v);
  return d ? d.getDate() : '–';
}
