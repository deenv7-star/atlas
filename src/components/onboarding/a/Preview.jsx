/**
 * Version A live preview: the real v8 C "היום" look, built from the owner's answers as they type.
 * No invented bookings: the calendar shows their units as free nights; money starts at ‏₪0.
 * `focus` softly rings the part the current question changes.
 */
import React from 'react';
import { CalendarDays, Inbox, Users, Wallet, MessageCircle, Settings, Home, LogIn, LogOut, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuestAvatar, dayPart } from '@/components/app/atoms';
import { Wordmark } from '@/components/app/shell/shared';
import { formatDayHe, todayISO, addDays, formatMoney } from '@/lib/stay/format';
import { typeInfo, PROVIDERS } from '@/lib/onboarding/store';

const NAV = [
  { label: 'היום', Icon: Home },
  { label: 'לוח שנה', Icon: CalendarDays },
  { label: 'הזמנות', Icon: Inbox },
  { label: 'לידים', Icon: Users },
  { label: 'כספים', Icon: Wallet },
  { label: 'הודעות', Icon: MessageCircle },
  { label: 'הגדרות', Icon: Settings },
];

function firstOf(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }

function Ring({ on, children, className }) {
  return (
    <div className={cn('relative rounded-[22px] transition-shadow duration-300', on && 'shadow-[0_0_0_3px_rgba(62,43,241,0.35),0_0_0_9px_rgba(62,43,241,0.08)]', className)}>
      {children}
    </div>
  );
}

function coverOf(d) {
  return d.photos?.[0] || d.coverPhoto || d.units.find((u) => u.photo)?.photo || typeInfo(d.type).photo || '/demo/complex-pool.webp';
}

function Calendar({ d, focus, compact = false, tall = false }) {
  const days = Array.from({ length: compact ? 5 : 7 }, (_, i) => addDays(todayISO(), i));
  const units = d.units.length ? d.units : [];
  return (
    <Ring on={focus === 'units'} className={cn('v7-card min-w-0 p-4', tall && 'h-full p-5')}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-bold text-navy-900">לוח שנה</p>
        <p className="text-[12px] text-ink-400">השבוע</p>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `minmax(64px,1.3fr) repeat(${days.length}, minmax(0,1fr))` }}>
        <span />
        {days.map((day) => (
          <span key={day} className="text-center text-[11px] font-semibold text-ink-400">{formatDayHe(day).split(',')[0].replace('יום ', '')}</span>
        ))}
        {units.length === 0 ? (
          <p className="col-span-full rounded-[12px] bg-[#F6F7FB] px-3 py-4 text-center text-[13px] text-ink-400">כאן יופיעו היחידות שלכם</p>
        ) : units.slice(0, compact ? 3 : 8).map((u, r) => (
          <React.Fragment key={u.key}>
            <span className={cn('ob-pop flex min-w-0 items-center gap-1.5 truncate font-semibold text-navy-900', tall ? 'text-[13px]' : 'text-[12px]')} style={{ animationDelay: `${r * 60}ms` }}>
              <span className={cn('shrink-0 overflow-hidden rounded-[6px] bg-[#E4E1FD]', tall ? 'h-7 w-7' : 'h-5 w-5')}>
                {u.photo || typeInfo(d.type).photo ? <img src={u.photo || typeInfo(d.type).photo} alt="" className="h-full w-full object-cover" /> : null}
              </span>
              <span className="truncate">{u.name || 'יחידה'}</span>
            </span>
            {days.map((day, c) => (
              <span key={day} className={cn('ob-pop rounded-[8px] bg-[#F1EFFE]', tall ? 'h-9' : 'h-6')} style={{ animationDelay: `${r * 60 + c * 18}ms` }} />
            ))}
          </React.Fragment>
        ))}
      </div>
      {units.length > (compact ? 3 : 8) ? <p className="mt-2 text-[12px] text-ink-400">ועוד {units.length - (compact ? 3 : 8)}</p> : null}
    </Ring>
  );
}

function Hosting({ d, focus }) {
  const on = Object.entries(d.channels || {}).filter(([, c]) => c.on && Object.values(c.links || {}).some(Boolean)).map(([k]) => k);
  const today = (d.channelsToday || []).filter((v) => !['booking', 'airbnb'].includes(v));
  return (
    <Ring on={focus === 'hosting' || focus === 'channels' || focus === 'wa'} className="v7-card p-4">
      <p className="mb-3 text-[14px] font-bold text-navy-900">היום</p>
      <div className="flex flex-col gap-2.5">
        <div className={cn('flex items-center gap-3 rounded-[14px] p-2 transition-colors duration-300', focus === 'hosting' && 'bg-[#F1EFFE]')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]"><LogIn className="h-4 w-4" aria-hidden /></span>
          <p className="text-[13px] text-navy-900">כניסות מ-<b className="tabular-nums">{d.checkIn}</b></p>
        </div>
        <div className={cn('flex items-center gap-3 rounded-[14px] p-2 transition-colors duration-300', focus === 'hosting' && 'bg-[#F1EFFE]')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--st-sky-bg)] text-[var(--st-sky-fg)]"><LogOut className="h-4 w-4" aria-hidden /></span>
          <p className="text-[13px] text-navy-900">יציאות עד <b className="tabular-nums">{d.checkOut}</b></p>
        </div>
        <div className={cn('flex items-center gap-3 rounded-[14px] p-2 transition-colors duration-300', focus === 'wa' && 'bg-[#F1EFFE]')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F8EE] text-[#128C4B]"><MessageCircle className="h-4 w-4" aria-hidden /></span>
          <p className="text-[13px] text-navy-900">אישור הזמנה בוואטסאפ מוכן</p>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {on.length ? on.map((k) => (
            <span key={k} className="ob-pop inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: PROVIDERS[k].color }}>
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />{PROVIDERS[k].label}
            </span>
          )) : null}
          <span className="rounded-full bg-[#F1EFFE] px-2.5 py-1 text-[11px] font-semibold text-brand-600">ישיר{today.includes('phone') ? ' · טלפון' : ''}</span>
        </div>
      </div>
    </Ring>
  );
}

/** Desktop: the whole app frame. */
export function PreviewFull({ d, focus, className }) {
  const g = dayPart().greeting;
  const name = firstOf(d.ownerName);
  const t = typeInfo(d.type);
  const n = d.units.length;
  return (
    <div className={cn('flex h-full min-h-0 gap-4 rounded-[30px] bg-[#F2F3F8] p-4 shadow-[inset_0_0_0_1px_rgba(27,38,86,0.06)]', className)} aria-hidden>
      <aside className="flex w-[188px] shrink-0 flex-col gap-4 rounded-[24px] bg-white p-3.5 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_6px_24px_-8px_rgba(27,38,86,0.08)]">
        <div className="px-1.5 pt-1"><Wordmark size={17} /></div>
        <Ring on={focus === 'business'} className="flex items-center gap-2.5 bg-[#F6F7FB] p-2">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-[12px] bg-[#E4E1FD]"><img src={coverOf(d)} alt="" className="h-full w-full object-cover" /></span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold text-navy-900">{d.businessName || 'העסק שלי'}</span>
            <span className="block text-[11px] text-ink-400">{n ? `${n} ${n === 1 ? 'יחידה' : 'יחידות'}` : (d.type ? t.label : 'עוד לא הוגדר')}</span>
          </span>
        </Ring>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ label, Icon }, i) => (
            <span key={label} className={cn('flex h-9 items-center gap-2.5 rounded-[12px] px-2.5 text-[13px] font-medium', i === 0 ? 'bg-brand-600 text-white' : 'text-ink-600')}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />{label}
            </span>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Ring on={focus === 'owner'} className="flex items-center gap-3 p-1">
          {d.ownerPhoto ? <img src={d.ownerPhoto} alt="" className="h-12 w-12 rounded-full object-cover ring-[3px] ring-white" />
            : <GuestAvatar name={d.ownerName || 'א'} size={48} ring photo={false} />}
          <div className="min-w-0">
            <p className="truncate text-[22px] font-extrabold tracking-[-0.01em] text-navy-900">{g}{name ? `, ${name}` : ''}</p>
            <p className="text-[13px] text-ink-400">{formatDayHe(todayISO())}{d.businessName ? ` · ${d.businessName}` : ''}{d.settlement ? `, ${d.settlement}` : ''}</p>
          </div>
        </Ring>
        <div className="grid grid-cols-5 gap-4">
          <div className="v7-hero col-span-3 flex min-h-[200px] flex-col justify-between p-6 xl:min-h-[230px]">
            <p className="text-[14px] font-medium text-white/85">הכנסות החודש</p>
            <div>
              <p className="text-[44px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">{formatMoney(0)}</p>
              <p className="mt-2 text-[12px] text-white/85">החודש הראשון שלכם{n ? ` · עד ${formatMoney(d.units.reduce((s, u) => s + (Number(u.price) || 0), 0))} ללילה מלא` : ''}</p>
            </div>
          </div>
          <Ring on={focus === 'business' || focus === 'type'} className="col-span-2">
            <div className="c-photo flex h-full min-h-[200px] flex-col justify-end p-4 text-white xl:min-h-[230px]">
              <img src={coverOf(d)} alt="" />
              <p className="text-[15px] font-bold leading-tight drop-shadow">{d.businessName || (d.type ? t.label : '') || 'העסק שלכם'}</p>
              <p className="text-[12px] text-white/85">{d.settlement ? `${d.settlement} · ` : ''}{n ? `${n} ${typeInfo(d.type).single ? 'פנוי הלילה' : 'פנויות הלילה'}` : 'מוכן לאורחים הראשונים'}</p>
              {d.photos?.length > 1 ? (
                <div className="mt-2 flex gap-1">{d.photos.slice(1, 5).map((p, k) => <span key={k} className="ob-pop h-7 w-7 overflow-hidden rounded-[8px] ring-2 ring-white/70"><img src={p} alt="" className="h-full w-full object-cover" /></span>)}</div>
              ) : null}
            </div>
          </Ring>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-5 gap-4">
          <div className="col-span-3 min-w-0"><Calendar d={d} focus={focus} tall /></div>
          <div className="col-span-2 [&>div]:h-full"><Hosting d={d} focus={focus} /></div>
        </div>
      </div>
    </div>
  );
}

/** Phones: a compact card that shows only what the current question changes. */
export function PreviewCompact({ d, focus }) {
  const g = dayPart().greeting;
  const name = firstOf(d.ownerName);
  const n = d.units.length;
  const t = typeInfo(d.type);
  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.05),0_10px_28px_-14px_rgba(27,38,86,0.22)]" aria-hidden>
      <div className="flex items-center gap-2.5 px-3.5 pt-3">
        {d.ownerPhoto ? <img src={d.ownerPhoto} alt="" className="h-9 w-9 rounded-full object-cover" /> : <GuestAvatar name={d.ownerName || 'א'} size={36} photo={false} />}
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-[15px] font-extrabold text-navy-900 transition-colors', focus === 'owner' && 'text-brand-600')}>{g}{name ? `, ${name}` : ''}</p>
          <p className={cn('truncate text-[12px] text-ink-400', focus === 'business' && 'font-semibold text-brand-600')}>{d.businessName || (d.type ? t.label : '') || 'העסק שלכם'}{d.settlement ? ` · ${d.settlement}` : ''}</p>
        </div>
        <span className="h-9 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#E4E1FD]"><img src={coverOf(d)} alt="" className="h-full w-full object-cover" /></span>
      </div>
      <div className="flex gap-1.5 overflow-hidden px-3.5 pb-3 pt-2.5">
        {focus === 'channels' ? (
          <>
            {(d.channelsToday || []).length ? (d.channelsToday || []).slice(0, 3).map((v, k) => (
              <span key={v} className="ob-pop inline-flex h-8 items-center rounded-full bg-[#F1EFFE] px-3 text-[12px] font-semibold text-brand-700" style={{ animationDelay: `${k * 50}ms` }}>
                {{ phone: 'טלפון', booking: 'Booking', airbnb: 'Airbnb', website: 'אתר', social: 'רשתות', portals: 'אתרי צימרים' }[v]}
              </span>
            )) : <span className="inline-flex h-8 items-center rounded-full bg-[#F6F7FB] px-3 text-[12px] text-ink-400">ערוצי ההזמנות יופיעו כאן</span>}
          </>
        ) : focus === 'hosting' || focus === 'wa' || focus === 'deposit' ? (
          <>
            <span className="ob-pop inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--st-mint-bg)] px-3 text-[12px] font-semibold text-[var(--st-mint-fg)]"><LogIn className="h-3.5 w-3.5" aria-hidden />כניסה {d.checkIn}</span>
            <span className="ob-pop inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--st-sky-bg)] px-3 text-[12px] font-semibold text-[var(--st-sky-fg)]"><LogOut className="h-3.5 w-3.5" aria-hidden />יציאה {d.checkOut}</span>
          </>
        ) : n ? d.units.slice(0, 4).map((u, i) => (
          <span key={u.key} className="ob-pop inline-flex h-8 min-w-0 max-w-[96px] items-center gap-1.5 rounded-full bg-[#F1EFFE] px-2.5 text-[12px] font-semibold text-brand-700" style={{ animationDelay: `${i * 50}ms` }}>
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{u.name || 'יחידה'}</span>
          </span>
        )) : (
          <span className="inline-flex h-8 items-center rounded-full bg-[#F6F7FB] px-3 text-[12px] text-ink-400">היחידות יופיעו כאן</span>
        )}
        {n > 4 && !['hosting', 'wa', 'channels', 'deposit'].includes(focus) ? <span className="inline-flex h-8 items-center px-1 text-[12px] text-ink-400">+{n - 4}</span> : null}
      </div>
    </div>
  );
}
