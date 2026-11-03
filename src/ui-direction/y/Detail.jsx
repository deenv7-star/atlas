/**
 * Y1 booking detail: the slate card inside the dark panel (desktop) and the same card as a bottom
 * sheet (phone). Stay dates big and thin, the unit as a real photo, the guest's face, the money as
 * three glass tiles, and one indigo pill for what this stay needs next.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { X, Phone, ArrowUpLeft, ArrowLeft, Check, MessageCircle } from 'lucide-react';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatRangeHe, nightsBetween } from '@/lib/stay/format';
import { checkOutOf, channelOf, isPaid } from '@/lib/stay/bookings';
import { dueTemplateFor, templateByKey, logSubjectFor } from '@/lib/stay/whatsapp';
import { cn } from '@/lib/utils';
import { guestLabel, guestsOf } from './model';
import Face from './Face';
import { Num, StripeBar, whenOf } from './ui';

export function Detail({ booking, model, onWhatsApp, Title = 'p' }) {
  const [done, setDone] = useState(null);
  const property = model.prop(booking.property_id);
  const bal = model.balanceFor(booking);
  const nights = nightsBetween(booking.check_in_date, checkOutOf(booking));
  const ch = channelOf(booking);
  const due = dueTemplateFor(booking, model.sentOf(booking), model.day);
  const item = model.queue.find((q) => q.kind !== 'clean' && q.booking?.id === booking.id) || null;
  const photo = unitPhoto(property);
  const isDone = done && done === item?.id;
  const act = () => {
    if (item) { setDone(item.id); model.doItem(item); setTimeout(() => setDone(null), 1400); } else onWhatsApp?.(booking, due || 'confirmation');
  };
  const label = item ? item.verb : due ? `${templateByKey(due).label} בוואטסאפ` : 'הודעה בוואטסאפ';

  return (
    <div className="y1d" dir="rtl">
      <div className="y1d-h">
        <div className="y1d-c">
          <p className="y1d-k">שהייה</p>
          <p className="y1d-big">{formatRangeHe(booking.check_in_date, checkOutOf(booking))}</p>
          <span className="y1d-chip">{whenOf(booking, model.day)}</span>
        </div>
        <div className="y1d-c">
          <p className="y1d-k">יחידה</p>
          <p className="y1d-unit">{photo ? <img src={photo} alt="" decoding="async" /> : null}<b>{property?.name || ''}</b></p>
        </div>
        <div className="y1d-c">
          <p className="y1d-k">אורח</p>
          <div className="y1d-g">
            <Face name={booking.guest_name || ''} size={44} />
            <span><Title className="y1d-gn">{guestLabel(booking)}</Title><small>{[ch.label, guestsOf(booking)].filter(Boolean).join(' · ')}</small></span>
          </div>
        </div>
      </div>
      <div className="y1d-tiles">
        <div className="y1d-t"><span>סה״כ ההזמנה</span><Num value={bal.total} pre="₪" /><ArrowUpLeft strokeWidth={1.75} className="y1d-t-a" /></div>
        <div className="y1d-t"><span>שולם</span><Num value={bal.paid} pre="₪" delay={80} /><StripeBar value={bal.total ? bal.paid / bal.total : 0} tone="white" delay={300} /></div>
        <div className={cn('y1d-t', bal.balance > 0 && 'is-due')}><span>{bal.balance > 0 ? 'יתרה' : 'יתרה'}</span><Num value={bal.balance} pre="₪" delay={160} />{bal.balance > 0 ? <i className="y1-amber" aria-hidden /> : <Check strokeWidth={2} className="y1d-t-a" />}</div>
        <div className="y1d-photo">{photo ? <img src={photo} alt="" decoding="async" /> : null}<span>{nights} {nights === 1 ? 'לילה' : 'לילות'}</span></div>
      </div>
      <div className="y1d-bar">
        <div><span>{booking.check_in_date === model.day ? 'כניסה היום' : 'כניסה'}</span><b dir="ltr">{property?.check_in_time || '15:00'}</b></div>
        <div><span>יציאה</span><b dir="ltr">{property?.check_out_time || '11:00'}</b></div>
        <div className="y1d-bar-x"><span>לילות</span><b dir="ltr">{nights}</b></div>
        <div className="y1d-bar-act">
          {booking.guest_phone ? <a className="y1-cb y1-cb--d press" href={`tel:${booking.guest_phone}`} aria-label="שיחה לאורח"><Phone strokeWidth={1.75} /></a> : null}
          <button type="button" className="y1-cb y1-cb--d press" aria-label="וואטסאפ" onClick={() => onWhatsApp?.(booking, due || 'confirmation')}><MessageCircle strokeWidth={1.75} /></button>
          <Link className="y1-cb y1-cb--d press" to={`/booking/${booking.id}`} aria-label="ההזמנה המלאה"><ArrowUpLeft strokeWidth={1.75} /></Link>
          <button type="button" className={cn('y1d-go press', isDone && 'is-go')} onClick={act}>
            <span>{isDone ? item.doneText : label}</span>
            <i>{isDone ? <Check strokeWidth={2.2} /> : <ArrowLeft strokeWidth={2} />}</i>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StaySheet({ open, onOpenChange, booking, model, onWhatsApp }) {
  if (!booking) return null;
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="y1s-overlay" />
        <D.Content className="y1s" dir="rtl" aria-describedby={undefined}>
          <span className="y1s-grab" aria-hidden />
          <div className="y1s-top">
            <D.Title className="y1s-t">פרטי ההזמנה</D.Title>
            <D.Close className="y1-cb y1-cb--d press" aria-label="סגירה"><X strokeWidth={1.75} /></D.Close>
          </div>
          <Detail booking={booking} model={model} onWhatsApp={onWhatsApp} />
          <div className="y1s-j"><Journey booking={booking} model={model} /></div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

const STEPS = ['ההזמנה', 'אישור', 'מקדמה', 'הוראות הגעה', 'כניסה', 'יציאה', 'תודה'];
export function journeyOf(booking, sent, payments) {
  const has = (k) => sent.has(logSubjectFor(k));
  const st = String(booking.status || '').toUpperCase();
  const paid = (payments || []).some(isPaid);
  const ok = [true, has('confirmation'), paid, has('arrival_eve'), st === 'CHECKED_IN' || st === 'CHECKED_OUT', st === 'CHECKED_OUT', has('thanks_review')];
  return { ok, done: ok.filter(Boolean).length, current: ok.findIndex((x) => !x) };
}

export function Journey({ booking, model }) {
  const j = journeyOf(booking, model.sentOf(booking), model.paysOf(booking));
  return (
    <div className="y1j" aria-label={`מסע האורח, ${j.done} מתוך 7`}>
      <div className="y1j-h"><p>מסע האורח</p><span>{j.current >= 0 ? `השלב הבא: ${STEPS[j.current]}` : 'הושלם'}</span></div>
      <ol className="y1j-steps">
        {STEPS.map((s, i) => <li key={s} className={cn(j.ok[i] && 'ok', i === j.current && 'cur')}><i style={{ animationDelay: `${i * 70}ms` }} />{s}</li>)}
      </ol>
    </div>
  );
}
