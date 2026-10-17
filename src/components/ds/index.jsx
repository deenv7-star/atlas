/**
 * ATLAS design-system primitives. Every page composes from these so type, spacing,
 * radius, color and states stay identical across the app (tokens: src/styles/brand.css).
 */
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/app/atoms';
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
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-white px-2.5 text-[13px] font-medium text-ink-600', className)}>
      <ChannelDot source={source} />
      {ch.short}
    </span>
  );
}

/* ── Status pills ──────────────────────────────────────────────────────────── */
/* v5: Linear-style tags. White pill, hairline, colour lives only in a 6px dot. Amber = the attention dot. */
const DOTS = {
  success: '#22B07D',
  warning: 'var(--attention)',
  danger: '#EF5B5B',
  brand: '#3E2BF1',
  neutral: '#A3A9BA',
};
export const STATUS_META = {
  // bookings
  PENDING: { label: 'ממתינה', tone: 'warning' },
  APPROVED: { label: 'מאושרת', tone: 'success' },
  CONFIRMED: { label: 'מאושרת', tone: 'success' },
  CHECKED_IN: { label: 'בשהייה', tone: 'brand' },
  CHECKED_OUT: { label: 'הסתיימה', tone: 'neutral' },
  CANCELLED: { label: 'בוטלה', tone: 'danger' },
  WAITLIST: { label: 'המתנה', tone: 'neutral' },
  // leads
  NEW: { label: 'חדש', tone: 'brand' },
  CONTACTED: { label: 'בטיפול', tone: 'warning' },
  OFFER_SENT: { label: 'הצעה נשלחה', tone: 'brand' },
  REJECTED: { label: 'לא רלוונטי', tone: 'neutral' },
  LOST: { label: 'לא נסגר', tone: 'neutral' },
  // payments
  PAID: { label: 'שולם', tone: 'success' },
  OVERDUE: { label: 'באיחור', tone: 'danger' },
  FAILED: { label: 'נכשל', tone: 'danger' },
  REFUNDED: { label: 'הוחזר', tone: 'neutral' },
  // tasks
  COMPLETED: { label: 'בוצע', tone: 'success' },
  IN_PROGRESS: { label: 'בביצוע', tone: 'brand' },
};
export function StatusPill({ status, label, tone, className }) {
  const meta = STATUS_META[String(status || '').toUpperCase()] || { label: label || status || '', tone: 'neutral' };
  const t = tone || meta.tone;
  return (
    <span className={cn('inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-2.5 text-[13px] font-medium text-ink-600', className)}>
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: DOTS[t] || DOTS.neutral }} />
      {label || meta.label}
    </span>
  );
}

/* ── Layout primitives ─────────────────────────────────────────────────────── */
export function Page({ children, className, wide = false }) {
  return (
    <div className={cn('mx-auto w-full px-5 pb-16 pt-6 md:px-10 md:pt-9', wide ? 'max-w-[1400px]' : 'max-w-[1200px]', className)} dir="rtl">
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, children, className }) {
  return (
    <header className={cn('v5-rise mb-7 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-navy-900 md:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-[15px] text-ink-400">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({ as: Comp = 'div', className, children, ...rest }) {
  return (
    <Comp className={cn('rounded-[14px] border border-line bg-white shadow-card', className)} {...rest}>
      {children}
    </Comp>
  );
}

export function Section({ title, subtitle, action, children, className, bodyClassName, icon: Icon }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex min-h-[56px] items-center justify-between gap-3 px-5 pt-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold text-navy-900">{title}</h2>
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

export function StatTile({ label, value, hint, tone = 'brand', className, loading, icon: Icon, attention }) {
  const valueCls = tone === 'danger' ? 'text-danger-600' : 'text-navy-900';
  return (
    <Card className={cn('v5-rise flex min-w-0 flex-col gap-1 px-5 py-4 md:px-6 md:py-5', className)}>
      <span className="flex items-center gap-2 truncate text-[13px] font-medium text-ink-400">
        
        {label}
        {attention ? <span aria-label="דורש תשומת לב" className="h-1.5 w-1.5 rounded-full bg-attention" /> : null}
      </span>
      {loading ? (
        <SkelLine className="mt-1 h-8 w-24" />
      ) : (
        <span className={cn('v5-num whitespace-nowrap text-[22px] font-bold leading-tight md:text-[26px]', valueCls)}><AnimatedValue value={value} /></span>
      )}
      {hint ? <span className="hidden truncate text-[13px] text-ink-400 md:block">{hint}</span> : null}
    </Card>
  );
}

export function SegmentedControl({ options, value, onChange, className, ariaLabel }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[12px] border border-line bg-[#F3F4F8] p-[3px]', className)}>
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
              'press inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-4 text-[14px] font-medium',
              active ? 'bg-white text-navy-900 shadow-[0_0_0_1px_rgba(16,24,64,0.06),0_1px_3px_rgba(16,24,64,0.08)]' : 'text-ink-400 hover:text-navy-900',
            )}
          >
            {o.label}
            {o.count != null ? (
              <span className="tabular text-[12px] text-ink-300">{o.count}</span>
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
        <span className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[16px] border border-line bg-white shadow-card" aria-hidden>
          <span className="absolute inset-[5px] rounded-[11px] bg-[#F4F3FF]" />
          {Icon ? <Icon className="relative h-6 w-6 text-brand-600" strokeWidth={1.5} /> : null}
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
    <div role="status" className={cn('flex flex-col items-start gap-3 rounded-[14px] border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <p className="font-bold text-navy-900">הטעינה לוקחת יותר מהרגיל</p>
        <p className="text-[14px] text-ink-600">ייתכן שהחיבור איטי. אפשר לנסות שוב, הנתונים שכבר נטענו נשמרים.</p>
      </div>
      <Button variant="outline" onClick={onRetry}>לנסות שוב</Button>
    </div>
  );
}

export function Avatar({ name, className, tone = 'brand' }) {
  const ch = (String(name || '').trim()[0] || 'א').toUpperCase();
  const toneCls = tone === 'neutral' || tone === 'amber' ? 'bg-[#EEF1F6] text-ink-600' : 'bg-[#EEF0FF] text-brand-700';
  return (
    <span aria-hidden className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold', toneCls, className)}>
      {ch}
    </span>
  );
}

/** Row for lists (bookings, leads, payments): large hit area, chevron, press feedback. */
export function ListRow({ as: Comp = 'div', leading, title, meta, trailing, className, ...rest }) {
  return (
    <Comp
      className={cn('press v5-row flex min-h-[64px] items-center gap-3 rounded-[10px] px-3 py-2.5 text-start', className)}
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
