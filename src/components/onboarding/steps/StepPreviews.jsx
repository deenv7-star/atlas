/**
 * Onboarding A: the live result of each step, drawn from the owner's answers (no invented data).
 *   1 place    → their listing card (photo, name, settlement)
 *   2 units    → their week calendar with each unit as a row
 *   3 bookings → where bookings come from, flowing into one calendar
 *   4 guests   → the real WhatsApp confirmation template, with their times
 * Decorative copies of what the form already says: aria-hidden.
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Phone, Globe, Instagram, Check, LogIn, LogOut, CalendarDays, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { typeInfo } from '@/lib/onboarding/store';
import { WhatsAppPreview, sampleMessage } from '@/components/onboarding/kit';
import { formatMoney } from '@/lib/stay/format';

const EASE = [0.23, 1, 0.32, 1];
const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export const SOURCES = [
  { value: 'booking', label: 'Booking.com', short: 'Booking', mark: 'B.', tone: 'bg-navy-900 text-white' },
  { value: 'airbnb', label: 'Airbnb', short: 'Airbnb', mark: 'A', tone: 'bg-brand-600 text-white' },
  { value: 'phone', label: 'טלפון ווואטסאפ', short: 'וואטסאפ', Icon: Phone, tone: 'bg-brand-100 text-brand-700' },
  { value: 'website', label: 'אתר משלי', short: 'אתר משלי', Icon: Globe, tone: 'bg-brand-100 text-brand-700' },
  { value: 'social', label: 'פייסבוק ואינסטגרם', short: 'רשתות', Icon: Instagram, tone: 'bg-brand-100 text-brand-700' },
  { value: 'portals', label: 'אתרי צימרים', short: 'אתרי צימרים', Icon: MapPin, tone: 'bg-brand-100 text-brand-700' },
];

function cover(d) {
  return d.photos?.[0] || d.units.find((u) => u.photo)?.photo || typeInfo(d.type).photo || '/demo/complex-pool.webp';
}

export function PlacePreview({ d, size = 'lg' }) {
  const t = typeInfo(d.type);
  const lg = size === 'lg';
  return (
    <div className={cn('overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.05),0_24px_50px_-24px_rgba(27,38,86,0.35)]', lg ? 'w-[360px]' : 'flex h-[96px] items-center gap-3 p-2.5')} aria-hidden>
      <div className={cn('relative shrink-0 overflow-hidden bg-[#E9ECF4]', lg ? 'aspect-[4/3] w-full' : 'h-[76px] w-[96px] rounded-[16px]')}>
        <AnimatePresence initial={false}>
          <motion.img key={cover(d)} src={cover(d)} alt="" className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.2 } }} />
        </AnimatePresence>
        {lg && d.type ? <span className="absolute end-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[12px] font-bold text-navy-900 shadow-sm">{t.label}</span> : null}
      </div>
      <div className={cn('min-w-0', lg ? 'p-5' : 'flex-1')}>
        <p className={cn('truncate font-extrabold tracking-[-0.01em] text-navy-900', lg ? 'text-[22px]' : 'text-[17px]')}>{d.businessName.trim() || 'שם המקום שלכם'}</p>
        <p className={cn('mt-1 flex items-center gap-1 text-ink-400', lg ? 'text-[14px]' : 'text-[13px]')}><MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />{d.settlement.trim() || 'איפה זה?'}</p>
        {lg ? (
          <div className="mt-4 flex items-center justify-between border-t border-[#EEF0F5] pt-4">
            <span className="text-[13px] text-ink-400">{d.type ? (t.single ? t.line : `${t.units} · ${t.line}`) : 'בחרו סוג מקום'}</span>
            <span className="inline-flex h-7 items-center rounded-full bg-brand-50 px-2.5 text-[12px] font-bold text-brand-700">פנוי הלילה</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function UnitsPreview({ d, size = 'lg' }) {
  const lg = size === 'lg';
  const units = d.units.slice(0, lg ? 6 : 2);
  const total = d.units.reduce((s, u) => s + (Number(u.price) || 0), 0);
  return (
    <div className={cn('rounded-[24px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.05),0_24px_50px_-24px_rgba(27,38,86,0.35)]', lg ? 'w-[420px] p-5' : 'h-[96px] overflow-hidden p-3')} aria-hidden>
      <div className={cn('flex items-center justify-between', lg ? 'mb-4' : 'mb-1.5')}>
        <p className={cn('flex items-center gap-1.5 font-bold text-navy-900', lg ? 'text-[15px]' : 'text-[13px]')}><CalendarDays className="h-4 w-4 text-brand-600" />לוח השנה שלכם</p>
        <p className="text-[12px] font-semibold text-ink-400 tabular-nums">{d.units.length} {d.units.length === 1 ? 'יחידה' : 'יחידות'}{lg && total ? ` · עד ${formatMoney(total)} ללילה` : ''}</p>
      </div>
      <div className="grid gap-x-1 gap-y-1.5" style={{ gridTemplateColumns: `${lg ? 92 : 64}px repeat(7, minmax(0, 1fr))` }}>
        {lg ? <><span />{DAYS.map((x) => <span key={x} className="text-center text-[11px] font-semibold text-ink-400">{x}</span>)}</> : null}
        {units.map((u) => (
            <React.Fragment key={u.key}>
              <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE } }}
                className={cn('flex min-w-0 items-center gap-1.5 truncate font-semibold text-navy-900', lg ? 'h-[34px] text-[13px]' : 'h-[24px] text-[11px]')}>
                <span className={cn('shrink-0 overflow-hidden rounded-[7px] bg-brand-100', lg ? 'h-7 w-7' : 'h-5 w-5')}><img src={u.photo || typeInfo(d.type).photo} alt="" className="h-full w-full object-cover" /></span>
                <span className="truncate">{u.name || 'יחידה'}</span>
              </motion.span>
              {DAYS.map((x, k) => (
                <motion.span key={x} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.24, ease: EASE, delay: 0.04 * k } }}
                  className={cn('rounded-[8px] bg-[#F3F4F9]', lg ? 'h-[34px]' : 'h-[24px]')} />
              ))}
            </React.Fragment>
          ))}
      </div>
      {lg && d.units.length > 6 ? <p className="mt-3 text-center text-[12px] text-ink-400">ועוד {d.units.length - 6}</p> : null}
      {lg ? <p className="mt-4 rounded-[14px] bg-brand-50 px-3.5 py-2.5 text-[13px] font-medium text-brand-700">הכל פנוי. ההזמנה הראשונה תופיע כאן.</p> : null}
    </div>
  );
}

export function SourcesPreview({ d, size = 'lg' }) {
  const lg = size === 'lg';
  const chosen = SOURCES.filter((s) => (d.channelsToday || []).includes(s.value));
  const linked = (k) => Object.values(d.channels?.[k]?.links || {}).some((v) => /^(https?|webcal):\/\//i.test(String(v || '').trim()));
  return (
    <div className={cn('rounded-[24px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.05),0_24px_50px_-24px_rgba(27,38,86,0.35)]', lg ? 'w-[400px] p-6' : 'flex h-[96px] items-center gap-3 overflow-hidden px-3')} aria-hidden>
      <div className={cn('flex', lg ? 'flex-col gap-2.5' : 'min-w-0 flex-1 gap-1.5')}>
        {chosen.length === 0 ? (
          <p className={cn('rounded-[14px] border border-dashed border-[#D5D9E6] text-center text-ink-400', lg ? 'px-4 py-6 text-[14px]' : 'flex-1 px-2 py-3 text-[12px]')}>בחרו מאיפה מגיעות הזמנות</p>
        ) : (
          <AnimatePresence initial={false}>
            {chosen.map((s) => {
              const on = (s.value === 'booking' && linked('BOOKING_COM')) || (s.value === 'airbnb' && linked('AIRBNB'));
              return (
                <motion.div key={s.value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.14 } }}
                  className={cn('flex items-center gap-3', lg ? 'h-[52px] rounded-[16px] bg-[#F6F7FB] px-3' : 'shrink-0')}>
                  <span className={cn('flex shrink-0 items-center justify-center rounded-[11px] font-extrabold', s.tone, lg ? 'h-9 w-9 text-[14px]' : 'h-10 w-10 text-[14px]')}>
                    {s.Icon ? <s.Icon className="h-4 w-4" strokeWidth={2} /> : s.mark}
                  </span>
                  {lg ? <span className="flex-1 truncate text-[14px] font-semibold text-navy-900">{s.label}</span> : null}
                  {lg ? (
                    <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold', on ? 'bg-brand-600 text-white' : 'bg-white text-ink-400')}>
                      {on ? <><Check className="h-3 w-3" strokeWidth={3} />מסונכרן</> : 'נכנס ללוח'}
                    </span>
                  ) : null}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      <div className={cn('flex items-center', lg ? 'mt-4 flex-col gap-3' : 'shrink-0')}>
        {lg ? <svg width="2" height="28" className="text-brand-300"><line x1="1" y1="0" x2="1" y2="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="[animation:atlas-dash_1s_linear_infinite] motion-reduce:[animation:none]" /></svg> : null}
        <div className={cn('flex items-center gap-2.5 rounded-[16px] bg-brand-600 text-white shadow-[0_14px_30px_-14px_rgba(62,43,241,0.8)]', lg ? 'h-[56px] px-5' : 'h-[48px] px-3')}>
          <CalendarDays className="h-5 w-5" />
          <span className={cn('font-bold', lg ? 'text-[15px]' : 'text-[12px]')}>{lg ? 'לוח שנה אחד, בלי כפילויות' : 'לוח אחד'}</span>
        </div>
      </div>
      <style>{'@keyframes atlas-dash { to { stroke-dashoffset: -8 } }'}</style>
    </div>
  );
}

export function GuestsPreview({ d, size = 'lg' }) {
  const lg = size === 'lg';
  if (!lg) {
    return (
      <div className="flex h-[96px] items-center gap-3 overflow-hidden rounded-[24px] bg-white px-3 shadow-[0_1px_2px_rgba(27,38,86,0.05),0_12px_30px_-18px_rgba(27,38,86,0.35)]" aria-hidden>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"><MessageCircle className="h-5 w-5" strokeWidth={2.25} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-navy-900">{d.ownerName.trim() ? `${d.ownerName.trim().split(/\s+/)[0]} מ${d.businessName.trim() || 'המקום'}` : 'הודעת אישור לאורח'}</p>
          <div className="mt-1.5 flex gap-1.5">
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-brand-50 px-2.5 text-[12px] font-semibold text-brand-700 tabular-nums"><LogIn className="h-3.5 w-3.5" />{d.checkIn}</span>
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#F3F4F9] px-2.5 text-[12px] font-semibold text-navy-900 tabular-nums"><LogOut className="h-3.5 w-3.5" />{d.checkOut}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-[380px] [&_.ob-wa]:!bg-[#E9ECF6]" aria-hidden>
      <WhatsAppPreview text={sampleMessage(d)} />
      <div className="mt-3 flex justify-center gap-2">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-brand-700 shadow-sm tabular-nums"><LogIn className="h-4 w-4" />כניסה {d.checkIn}</span>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-navy-900 shadow-sm tabular-nums"><LogOut className="h-4 w-4" />יציאה {d.checkOut}</span>
      </div>
    </div>
  );
}

export const PREVIEWS = [PlacePreview, UnitsPreview, SourcesPreview, GuestsPreview];
