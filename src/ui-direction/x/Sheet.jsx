/**
 * X2 stay detail. On desktop it lives beside the day (no modal); on phones it is a bottom sheet.
 * The guest journey is drawn as its own small timeline, matching the day's line.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { X, Phone, CalendarDays, ArrowUpLeft, MessageCircle, Check } from 'lucide-react';
import { UnitPhoto } from '@/components/app/atoms';
import { formatRangeHe, nightsBetween } from '@/lib/stay/format';
import { checkOutOf, channelOf, isPaid } from '@/lib/stay/bookings';
import { logSubjectFor, dueTemplateFor } from '@/lib/stay/whatsapp';
import { cn } from '@/lib/utils';
import { guestLabel, guestsOf, money } from './model';
import Face from './Face';
import MorphButton from './MorphButton';

function journeyOf(booking, sent, payments) {
  const has = (k) => sent.has(logSubjectFor(k));
  const st = String(booking.status || '').toUpperCase();
  const paid = (payments || []).some(isPaid);
  const steps = [
    { l: 'ההזמנה נקלטה', ok: true },
    { l: 'אישור הזמנה נשלח', ok: has('confirmation') },
    { l: 'מקדמה שולמה', ok: paid },
    { l: 'הוראות הגעה נשלחו', ok: has('arrival_eve') },
    { l: 'נכנסו', ok: st === 'CHECKED_IN' || st === 'CHECKED_OUT' },
    { l: 'יצאו', ok: st === 'CHECKED_OUT' },
    { l: 'תודה ובקשת ביקורת', ok: has('thanks_review') },
  ];
  return { steps, done: steps.filter((s) => s.ok).length, current: steps.findIndex((s) => !s.ok) };
}

export function StayDetail({ booking, model, onWhatsApp, Title = 'h2' }) {
  const [held, setHeld] = useState(null);
  const property = model.prop(booking.property_id);
  const sent = model.sentOf(booking);
  const pays = model.paysOf(booking);
  const bal = model.balanceFor(booking);
  const j = journeyOf(booking, sent, pays);
  const nights = nightsBetween(booking.check_in_date, checkOutOf(booking));
  const ch = channelOf(booking);
  const due = dueTemplateFor(booking, sent, model.day);
  const item = held || model.queue.find((q) => q.booking?.id === booking.id) || null;
  const pct = bal.total > 0 ? Math.round((bal.paid / bal.total) * 100) : 0;
  const T = Title;
  return (
    <div className="x2d">
      <div className="x2d-photo"><UnitPhoto property={property} className="x2d-img" rounded="" eager /></div>
      <div className="x2d-id">
        <Face name={booking.guest_name || ''} size={56} ring />
        <div className="x2d-idt">
          <T className="x2d-name">{guestLabel(booking)}</T>
          <p className="x2d-sub">{[property?.name || booking.property_name, guestsOf(booking), ch.label || 'ישיר'].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <div className="x2d-facts">
        <div><span>תאריכים</span><b>{formatRangeHe(booking.check_in_date, checkOutOf(booking))}</b></div>
        <div><span>לילות</span><b>{nights}</b></div>
        <div><span>{bal.balance > 0 ? 'יתרה' : 'שולם'}</span><b className={cn(bal.balance > 0 && 'x2d-due')}>{money(bal.balance > 0 ? bal.balance : bal.total)}</b></div>
      </div>
      <span className="x2d-bar" aria-hidden><i style={{ width: `${pct}%` }} /></span>
      {item ? (
        <div className="x2d-next">
          <span className="x2d-k">הדבר הבא</span>
          <MorphButton key={item.id} className="x2-go x2-go--wide" label={item.short} doneLabel={item.doneText}
            onRun={() => { setHeld(item); model.doItem(item); }} onSettled={() => setHeld(null)} />
        </div>
      ) : null}
      <ol className="x2d-j" aria-label={`מסע האורח, ${j.done} מתוך 7`}>
        {j.steps.map((s, i) => (
          <li key={s.l} className={cn(s.ok && 'ok', i === j.current && 'cur')}><i aria-hidden>{s.ok ? <Check strokeWidth={2.5} /> : null}</i><span>{s.l}</span></li>
        ))}
      </ol>
      <div className="x2d-links">
        <button type="button" className="x2d-a press" onClick={() => onWhatsApp?.(booking, due || 'confirmation')}><MessageCircle strokeWidth={1.75} />וואטסאפ</button>
        {booking.guest_phone ? <a className="x2d-a press" href={`tel:${booking.guest_phone}`}><Phone strokeWidth={1.75} />שיחה</a> : null}
        <Link className="x2d-a press" to="/multicalendar"><CalendarDays strokeWidth={1.75} />ביומן</Link>
        <Link className="x2d-a press" to={`/booking/${booking.id}`}><ArrowUpLeft strokeWidth={1.75} />הזמנה מלאה</Link>
      </div>
    </div>
  );
}

export default function StaySheet({ open, onOpenChange, booking, model, onWhatsApp }) {
  if (!booking) return null;
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="x2s-overlay" />
        <D.Content className="x2s" dir="rtl" aria-describedby={undefined}>
          <span className="x2s-grab" aria-hidden />
          <D.Close className="x2s-close press" aria-label="סגירה"><X strokeWidth={1.75} /></D.Close>
          <StayDetail booking={booking} model={model} onWhatsApp={onWhatsApp} Title={D.Title} />
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
