import BrandWordmark from '@/components/common/BrandWordmark';
/** Small brand primitives shared by the new feature screens (brand/atlas-brand.md). */
import React from 'react';
import { cn } from '@/lib/utils';
import { channelOf } from '@/lib/stay/bookings';
import { formatMoney } from '@/lib/stay/format';
import '@/styles/atlas-brand.css';

export function StayPage({ children, className, wide = false }) {
  return (
    <div dir="rtl" className={cn('ab-root ab-canvas min-h-full', className)}>
      <div className={cn('mx-auto px-5 pb-16 pt-3 md:px-10 md:pt-5', wide ? 'max-w-[var(--page-max,1200px)]' : 'max-w-[960px]')}>{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5 sm:mb-6">
      <div className="min-w-0">
        {eyebrow ? <p className="ab-meta font-bold mb-1" style={{ color: 'var(--brand-600)' }}>{eyebrow}</p> : null}
        <h1 className="ab-h1">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-[15px]" style={{ color: 'var(--ink-600)' }}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 ab-no-print">{actions}</div> : null}
    </header>
  );
}

export function SectionCard({ title, icon: Icon, count, action, children, className, id }) {
  return (
    <section id={id} className={cn('ab-card ab-enter overflow-hidden', className)}>
      <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-3">
        {Icon ? <span className="ab-icon-tile"><Icon size={20} strokeWidth={1.75} aria-hidden /></span> : null}
        <h2 className="ab-h3 flex-1 min-w-0 truncate">
          {title}
          {typeof count === 'number' ? <span className="ab-num mr-2 text-[15px] font-bold" style={{ color: 'var(--ink-400)' }}>{count}</span> : null}
        </h2>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function Row({ children, className }) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center px-4 sm:px-5 py-3.5 border-t', className)} style={{ borderColor: 'var(--line)' }}>
      {children}
    </div>
  );
}

export function EmptyLine({ children, action }) {
  return (
    <div className="px-4 sm:px-5 py-4 border-t flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--line)' }}>
      <p className="ab-meta flex-1 min-w-[12rem]">{children}</p>
      {action}
    </div>
  );
}

export function ChannelTag({ booking }) {
  const ch = channelOf(booking);
  return (
    <span className="inline-flex items-center gap-1.5 ab-meta whitespace-nowrap">
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: ch.color }} aria-hidden />
      {ch.label}
    </span>
  );
}

export function Money({ value, className, style }) {
  return <span className={cn('ab-num', className)} style={style}>{formatMoney(value)}</span>;
}

export function Pill({ tone = 'muted', children, className }) {
  return <span className={cn('ab-pill', `ab-pill-${tone}`, className)}>{children}</span>;
}

export function BalancePill({ balance }) {
  if (!balance || balance.state === 'no_price') return null;
  if (balance.balance <= 0) return <Pill tone="success">שולם</Pill>;
  if (balance.overdue) return <Pill tone="danger">באיחור · {formatMoney(balance.balance)}</Pill>;
  return <Pill tone="amber">יתרה {formatMoney(balance.balance)}</Pill>;
}

export function Btn({ variant = 'secondary', size, className, children, icon: Icon, ...rest }) {
  return (
    <button
      type="button"
      className={cn('ab-btn', `ab-btn-${variant}`, size && `ab-btn-${size}`, className)}
      {...rest}
    >
      {Icon ? <Icon size={size === 'sm' ? 16 : 18} strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function LinkBtn({ variant = 'secondary', size, className, children, icon: Icon, ...rest }) {
  return (
    <a className={cn('ab-btn', `ab-btn-${variant}`, size && `ab-btn-${size}`, className)} {...rest}>
      {Icon ? <Icon size={size === 'sm' ? 16 : 18} strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </a>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label} className="v7-strip inline-flex max-w-full gap-1.5 overflow-x-auto p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn('press inline-flex h-10 shrink-0 items-center rounded-full px-4 text-[14px] font-semibold',
              active ? 'bg-navy-900 text-white shadow-[0_6px_14px_-6px_rgba(27,38,86,0.5)]' : 'bg-white text-ink-600 ring-1 ring-inset ring-[#E3E6EF] hover:text-navy-900')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Wordmark({ size = 22 }) {
  return <span className="inline-flex items-center" style={{ color: '#202334' }} dir="ltr"><BrandWordmark size={size} /></span>;
}

export function StatTile({ label, value, hint, tone, hero = false }) {
  const color = hero ? '#fff' : tone === 'danger' ? 'var(--st-red-fg)' : 'var(--ink-900)';
  return (
    <div className={cn('min-w-0 px-5 py-5 md:px-6', hero ? 'v7-hero' : 'v7-card')}>
      <p className={cn('truncate text-[14px] font-medium', hero ? 'text-white/80' : 'text-[color:var(--ink-400)]')}>{label}</p>
      <p className="ab-num mt-2 whitespace-nowrap text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[32px]" style={{ color }}>{value}</p>
      {hint ? <p className={cn('mt-1 truncate text-[13px]', hero ? 'text-white/75' : 'text-[color:var(--ink-400)]')}>{hint}</p> : null}
    </div>
  );
}
