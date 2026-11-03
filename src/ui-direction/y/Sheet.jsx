/**
 * Y2 booking: a floating glass card over the blurred room (desktop) or a glass sheet (phone). A floating
 * pill toolbar above it (Orriso style), the unit photo large with the guest on it, the money as three
 * glass tiles, the guest journey as seven steps, and one indigo pill for the next thing.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { X, Phone, CalendarDays, ArrowUpLeft, MessageCircle, ArrowLeft, Check } from 'lucide-react';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatRangeHe, nightsBetween } from '@/lib/stay/format';
import { checkOutOf, channelOf, isPaid } from '@/lib/stay/bookings';
import { logSubjectFor, dueTemplateFor, templateByKey } from '@/lib/stay/whatsapp';
import { cn } from '@/lib/utils';
import { guestLabel, guestsOf } from './model';
import Face from './Face';
import { Num, StripeBar, whenOf } from './ui';

const STEPS = ['ההזמנה', 'אישור', 'מקדמה', 'הוראות הגעה', 'כניסה', 'יציאה', 'תודה'];
function journeyOf(booking, sent, payments) {
  const has = (k) => sent.has(logSubjectFor(k));
  const st = String(booking.status || '').toUpperCase();
  const paid = (payments || []).some(isPaid);
  const ok = [true, has('confirmation'), paid, has('arrival_eve'), st === 'CHECKED_IN' || st === 'CHECKED_OUT', st === 'CHECKED_OUT', has('thanks_review')];
  return { ok, done: ok.filter(Boolean).length, current: ok.findIndex((x) => !x) };
}

export default function StaySheet({ open, onOpenChange, booking, model, onWhatsApp }) {
  const [done, setDone] = useState(null);
  if (!booking) return null;
  const property = model.prop(booking.property_id);
  const bal = model.balanceFor(booking);
  const j = journeyOf(booking, model.sentOf(booking), model.paysOf(booking));
  const nights = nightsBetween(booking.check_in_date, checkOutOf(booking));
  const ch = channelOf(booking);
  const due = dueTemplateFor(booking, model.sentOf(booking), model.day);
  const item = model.queue.find((q) => q.kind !== 'clean' && q.booking?.id === booking.id) || null;
  const photo = unitPhoto(property);
  const isDone = done && done === item?.id;
  const act = () => { if (item) { setDone(item.id); model.doItem(item); setTimeout(() => setDone(null), 1400); } else onWhatsApp?.(booking, due || 'confirmation'); };

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="y2s-overlay" />
        <D.Content className="y2s" dir="rtl" aria-describedby={undefined}>
          <div className="y2s-tools" role="toolbar" aria-label="פעולות">
            <button type="button" className="y2s-tool press" onClick={() => onWhatsApp?.(booking, due || 'confirmation')}><MessageCircle strokeWidth={1.75} />וואטסאפ</button>
            {booking.guest_phone ? <a className="y2s-tool press" href={`tel:${booking.guest_phone}`}><Phone strokeWidth={1.75} />שיחה</a> : null}
            <Link className="y2s-tool press" to="/multicalendar"><CalendarDays strokeWidth={1.75} />ביומן</Link>
            <Link className="y2s-tool press" to={`/booking/${booking.id}`}><ArrowUpLeft strokeWidth={1.75} />הזמנה מלאה</Link>
          </div>
          <div className="y2s-card">
            <div className="y2s-photo">
              {photo ? <img src={photo} alt="" decoding="async" /> : null}
              <span className="y2s-shade" aria-hidden />
              <D.Close className="y2s-close press" aria-label="סגירה"><X strokeWidth={1.75} /></D.Close>
              <span className="y2s-when">{whenOf(booking, model.day)}</span>
              <div className="y2s-id">
                <Face name={booking.guest_name || ''} size={58} ring />
                <div>
                  <D.Title className="y2s-name">{guestLabel(booking)}</D.Title>
                  <p className="y2s-unit">{[property?.name, ch.key === 'direct' ? 'ישיר' : ch.label, guestsOf(booking)].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
            </div>
            <div className="y2s-body">
              <div className="y2s-stay">
                <div><span>שהייה</span><b>{formatRangeHe(booking.check_in_date, checkOutOf(booking))}</b></div>
                <div><span>לילות</span><b dir="ltr">{nights}</b></div>
                <div><span>כניסה</span><b dir="ltr">{property?.check_in_time || '15:00'}</b></div>
                <div><span>יציאה</span><b dir="ltr">{property?.check_out_time || '11:00'}</b></div>
              </div>
              <div className="y2s-money">
                <div><span>סה״כ</span><Num value={bal.total} pre="₪" /></div>
                <div><span>שולם</span><Num value={bal.paid} pre="₪" delay={80} /><StripeBar value={bal.total ? bal.paid / bal.total : 0} delay={250} /></div>
                <div className={cn(bal.balance > 0 && 'due')}><span>יתרה{bal.balance > 0 ? <i className="y2-amber" aria-hidden /> : null}</span><Num value={bal.balance} pre="₪" delay={160} /></div>
              </div>
              <div className="y2s-j" aria-label={`מסע האורח, ${j.done} מתוך 7`}>
                <p><b>מסע האורח</b><span>{j.current >= 0 ? `השלב הבא: ${STEPS[j.current]}` : 'הושלם'}</span></p>
                <ol>{STEPS.map((s, i) => <li key={s} className={cn(j.ok[i] && 'ok', i === j.current && 'cur')}><i style={{ animationDelay: `${i * 70}ms` }} />{s}</li>)}</ol>
              </div>
              <button type="button" className={cn('y2s-go press', isDone && 'is-go')} onClick={act}>
                <span>{isDone ? item.doneText : item ? item.verb : `${templateByKey(due || 'confirmation').label} בוואטסאפ`}{item && !isDone ? <small>{item.title}</small> : null}</span>
                <i>{isDone ? <Check strokeWidth={2.2} /> : <ArrowLeft strokeWidth={2} />}</i>
              </button>
            </div>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
