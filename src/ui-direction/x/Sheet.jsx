/**
 * X1 booking sheet: an editorial page about one stay. The unit photo, the guest's name set big, the
 * stay told as one sentence, then the same slide-to-do for whatever this booking needs next.
 * Phone: bottom sheet. Desktop: a page sliding in from the left edge.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { X, Phone, CalendarDays, ArrowUpLeft, MessageCircle } from 'lucide-react';
import { UnitPhoto } from '@/components/app/atoms';
import Face from './Face';
import { formatRangeHe, nightsBetween } from '@/lib/stay/format';
import { checkOutOf, channelOf, isPaid } from '@/lib/stay/bookings';
import { logSubjectFor, dueTemplateFor } from '@/lib/stay/whatsapp';
import { cn } from '@/lib/utils';
import { guestLabel, guestsOf, money } from './model';
import SlideToDo from './SlideToDo';

export function journeyOf(booking, sent, payments) {
  const has = (k) => sent.has(logSubjectFor(k));
  const st = String(booking.status || '').toUpperCase();
  const paid = (payments || []).some(isPaid);
  const NOUN = ['ההזמנה', 'אישור הזמנה', 'מקדמה', 'הוראות הגעה', 'כניסה', 'יציאה', 'תודה וביקורת'];
  const steps = [
    { l: 'ההזמנה נקלטה', ok: true },
    { l: 'אישור הזמנה נשלח', ok: has('confirmation') },
    { l: 'מקדמה שולמה', ok: paid },
    { l: 'הוראות הגעה נשלחו', ok: has('arrival_eve') },
    { l: 'נכנסו', ok: st === 'CHECKED_IN' || st === 'CHECKED_OUT' },
    { l: 'יצאו', ok: st === 'CHECKED_OUT' },
    { l: 'תודה ובקשת ביקורת', ok: has('thanks_review') },
  ];
  steps.forEach((x, i) => { x.n = NOUN[i]; });
  return { steps, done: steps.filter((s) => s.ok).length, current: steps.findIndex((s) => !s.ok) };
}

export default function StaySheet({ open, onOpenChange, booking, model, onWhatsApp }) {
  const [held, setHeld] = useState(null);
  if (!booking) return null;
  const property = model.prop(booking.property_id);
  const sent = model.sentOf(booking);
  const pays = model.paysOf(booking);
  const bal = model.balanceFor(booking);
  const j = journeyOf(booking, sent, pays);
  const nights = nightsBetween(booking.check_in_date, checkOutOf(booking));
  const ch = channelOf(booking);
  const item = held || model.queue.find((q) => q.booking?.id === booking.id) || null;
  const due = dueTemplateFor(booking, sent, model.day);
  const isToday = booking.check_in_date === model.day;
  const leaving = checkOutOf(booking) === model.day;
  const story = [isToday ? 'הגעה היום' : leaving ? 'יציאה היום' : 'שוהים עכשיו', property?.name || booking.property_name, `${nights} ${nights === 1 ? 'לילה' : 'לילות'}`, guestsOf(booking)].filter(Boolean).join(' · ');

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="x1s-overlay" />
        <D.Content className="x1s" dir="rtl" aria-describedby={undefined}>
          <div className="x1s-photo"><UnitPhoto property={property} className="x1s-img" rounded="" eager /></div>
          <D.Close className="x1s-close press" aria-label="סגירה"><X strokeWidth={1.75} /></D.Close>
          <div className="x1s-body">
            <div className="x1s-id">
              <Face name={booking.guest_name || ''} size={64} ring className="x1s-av" />
              <span className="x1s-ch">{ch.label || 'ישיר'}</span>
            </div>
            <D.Title className="x1s-name">{guestLabel(booking)}</D.Title>
            <p className="x1s-story">
              {story}
            </p>
            <p className="x1s-pay">
              {bal.total > 0 ? (bal.balance > 0 ? <>שולמו {money(bal.paid)} מתוך {money(bal.total)}.</> : <>שולם הכל, {money(bal.total)}.</>) : null}
            </p>
            <p className="x1s-dates">{formatRangeHe(booking.check_in_date, checkOutOf(booking))}</p>

            {item ? (
              <div className="x1s-next">
                <p className="x1s-k">הדבר הבא</p>
                <p className="x1s-nt">{item.title}</p>
                <SlideToDo resetKey={item.id} label={`החליקו ל${item.verb}`} doneLabel={item.doneText}
                  onDone={() => { setHeld(item); model.doItem(item); setTimeout(() => setHeld(null), 1300); }} />
              </div>
            ) : null}

            <div className="x1s-journey" aria-label={`מסע האורח, ${j.done} מתוך 7`}>
              <div className="x1s-seg">{j.steps.map((s, i) => <i key={s.l} className={cn(s.ok && 'ok', i === j.current && 'cur')} />)}</div>
              <p className="x1s-jl"><b>{j.done}/7</b> · {j.current >= 0 ? `השלב הבא: ${j.steps[j.current].n}` : 'המסע הושלם'}</p>
            </div>

            <div className="x1s-links">
              <button type="button" className="x1s-a press" onClick={() => onWhatsApp?.(booking, due || 'confirmation')}><MessageCircle strokeWidth={1.75} />וואטסאפ</button>
              {booking.guest_phone ? <a className="x1s-a press" href={`tel:${booking.guest_phone}`}><Phone strokeWidth={1.75} />שיחה</a> : null}
              <Link className="x1s-a press" to="/multicalendar"><CalendarDays strokeWidth={1.75} />ביומן</Link>
              <Link className="x1s-a press" to={`/booking/${booking.id}`}><ArrowUpLeft strokeWidth={1.75} />הזמנה מלאה</Link>
            </div>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
