/**
 * X3 stay sheet: the card opened up. The unit photo large with the guest's name set on it, the stay in
 * one line, the same press-and-hold for what this stay needs next, and the journey as seven dots.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { X, Phone, CalendarDays, ArrowUpLeft, MessageCircle } from 'lucide-react';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatRangeHe, nightsBetween } from '@/lib/stay/format';
import { checkOutOf, channelOf, isPaid } from '@/lib/stay/bookings';
import { logSubjectFor, dueTemplateFor } from '@/lib/stay/whatsapp';
import { cn } from '@/lib/utils';
import { guestLabel, guestsOf, money } from './model';
import Face from './Face';
import HoldButton from './HoldButton';

const NOUN = ['ההזמנה', 'אישור הזמנה', 'מקדמה', 'הוראות הגעה', 'כניסה', 'יציאה', 'תודה וביקורת'];
function journeyOf(booking, sent, payments) {
  const has = (k) => sent.has(logSubjectFor(k));
  const st = String(booking.status || '').toUpperCase();
  const paid = (payments || []).some(isPaid);
  const ok = [true, has('confirmation'), paid, has('arrival_eve'), st === 'CHECKED_IN' || st === 'CHECKED_OUT', st === 'CHECKED_OUT', has('thanks_review')];
  return { ok, done: ok.filter(Boolean).length, current: ok.findIndex((x) => !x) };
}

export default function StaySheet({ open, onOpenChange, booking, model, onWhatsApp }) {
  const [held, setHeld] = useState(null);
  if (!booking) return null;
  const property = model.prop(booking.property_id);
  const sent = model.sentOf(booking);
  const bal = model.balanceFor(booking);
  const j = journeyOf(booking, sent, model.paysOf(booking));
  const nights = nightsBetween(booking.check_in_date, checkOutOf(booking));
  const ch = channelOf(booking);
  const due = dueTemplateFor(booking, sent, model.day);
  const item = held || (model.queue.find((q) => q.kind !== 'clean' && q.booking?.id === booking.id) || model.queue.find((q) => q.booking?.id === booking.id)) || null;
  const photo = unitPhoto(property);
  const isToday = booking.check_in_date === model.day; const leaving = checkOutOf(booking) === model.day;

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="x3s-overlay" />
        <D.Content className="x3s" dir="rtl" aria-describedby={undefined}>
          <div className="x3s-photo">
            {photo ? <img src={photo} alt="" decoding="async" /> : null}
            <span className="x3s-shade" aria-hidden />
            <D.Close className="x3s-close press" aria-label="סגירה"><X strokeWidth={1.75} /></D.Close>
            <div className="x3s-id">
              <Face name={booking.guest_name || ''} size={60} ring />
              <div>
                <D.Title className="x3s-name">{guestLabel(booking)}</D.Title>
                <p className="x3s-unit">{[property?.name || booking.property_name, ch.label || 'ישיר'].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
          </div>
          <div className="x3s-body">
            <p className="x3s-line">{[isToday ? 'הגעה היום' : leaving ? 'יציאה היום' : 'שוהים עכשיו', formatRangeHe(booking.check_in_date, checkOutOf(booking)), `${nights} ${nights === 1 ? 'לילה' : 'לילות'}`, guestsOf(booking)].filter(Boolean).join(' · ')}</p>
            <p className="x3s-pay">{bal.total > 0 ? (bal.balance > 0 ? <>שולמו {money(bal.paid)} מתוך {money(bal.total)} · <b>יתרה {money(bal.balance)}</b></> : <>שולם הכל, {money(bal.total)}</>) : null}</p>
            {item ? (
              <div className="x3s-next">
                <p className="x3-kick">הדבר הבא</p>
                <p className="x3s-nt">{item.title}</p>
                <HoldButton key={item.id} label="החזיקו לביצוע" doneLabel={item.doneText} onDone={() => { setHeld(item); model.doItem(item); setTimeout(() => setHeld(null), 1200); }} />
              </div>
            ) : null}
            <div className="x3s-j" aria-label={`מסע האורח, ${j.done} מתוך 7`}>
              <div className="x3s-dots">{j.ok.map((ok, i) => <i key={NOUN[i]} className={cn(ok && 'ok', i === j.current && 'cur')} />)}</div>
              <p>{j.current >= 0 ? <>השלב הבא: <b>{NOUN[j.current]}</b></> : 'המסע הושלם'}</p>
            </div>
            <div className="x3s-links">
              <button type="button" className="x3s-a press" onClick={() => onWhatsApp?.(booking, due || 'confirmation')}><MessageCircle strokeWidth={1.75} />וואטסאפ</button>
              {booking.guest_phone ? <a className="x3s-a press" href={`tel:${booking.guest_phone}`}><Phone strokeWidth={1.75} />שיחה</a> : null}
              <Link className="x3s-a press" to="/multicalendar"><CalendarDays strokeWidth={1.75} />ביומן</Link>
              <Link className="x3s-a press" to={`/booking/${booking.id}`}><ArrowUpLeft strokeWidth={1.75} />הזמנה מלאה</Link>
            </div>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
