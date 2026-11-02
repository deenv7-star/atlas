/**
 * Booking detail sheet opened from a Today row. One structure for every UI direction; each
 * direction styles it through its own `.ws-*` rules (w.css). `chat` adds the WhatsApp thread view.
 * Data is the booking's own: messages sent, payments, status. No invented fields.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { X, MessageCircle, Phone, CalendarDays, ArrowUpLeft, Check } from 'lucide-react';
import { GuestAvatar, UnitPhoto } from '@/components/app/atoms';
import { formatRangeHe, nightsBetween } from '@/lib/stay/format';
import { checkOutOf, channelOf, isPaid } from '@/lib/stay/bookings';
import { logSubjectFor, templateByKey, renderTemplate, dueTemplateFor } from '@/lib/stay/whatsapp';
import { cn } from '@/lib/utils';
import { guestLabel, guestsOf, money } from './model';

export function journeyOf(booking, sent, payments) {
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

export default function StaySheet({ open, onOpenChange, booking, model, onWhatsApp, chat = false, side = 'bottom' }) {
  if (!booking) return null;
  const property = model.prop(booking.property_id);
  const sent = model.sentOf(booking);
  const pays = model.paysOf(booking);
  const bal = model.balanceFor(booking);
  const j = journeyOf(booking, sent, pays);
  const due = dueTemplateFor(booking, sent, model.day);
  const nights = nightsBetween(booking.check_in_date, checkOutOf(booking));
  const ch = channelOf(booking);
  const pct = bal.total > 0 ? Math.round((bal.paid / bal.total) * 100) : 0;
  const sentList = [...sent].filter((s) => /^וואטסאפ · /.test(s)).map((s) => s.replace(/^וואטסאפ · /, ''));
  let draft = '';
  if (chat && due) { try { draft = renderTemplate(due, { booking, property, balance: bal }).split('\n').filter(Boolean).slice(0, 3).join('\n'); } catch { draft = ''; } }

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="ws-overlay" />
        <D.Content className={cn('ws-sheet', side === 'right' && 'ws-sheet--side')} dir="rtl" aria-describedby={undefined}>
          <div className="ws-head">
            <UnitPhoto property={property} className="ws-photo" rounded="" eager />
            <div className="ws-id">
              <GuestAvatar name={booking.guest_name || ''} size={56} ring className="ws-av" />
              <div className="ws-grow">
                <D.Title className="ws-name">{guestLabel(booking)}</D.Title>
                <p className="ws-sub">{[property?.name || booking.property_name, guestsOf(booking)].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <D.Close className="ws-close" aria-label="סגירה"><X strokeWidth={2} /></D.Close>
          </div>

          <div className="ws-body">
            <div className="ws-facts">
              <div><span className="ws-k">תאריכים</span><span className="ws-v">{formatRangeHe(booking.check_in_date, checkOutOf(booking))}</span></div>
              <div><span className="ws-k">לילות</span><span className="ws-v">{nights}</span></div>
              <div><span className="ws-k">ערוץ</span><span className="ws-v">{ch.label || 'ישיר'}</span></div>
            </div>

            <div className="ws-actions">
              <button type="button" className="ws-act ws-act--main press" onClick={() => onWhatsApp?.(booking, due || 'confirmation')}>
                <MessageCircle strokeWidth={1.9} /><span>וואטסאפ</span>
              </button>
              {booking.guest_phone ? (
                <a className="ws-act press" href={`tel:${booking.guest_phone}`}><Phone strokeWidth={1.9} /><span>שיחה</span></a>
              ) : null}
              <Link className="ws-act press" to="/multicalendar"><CalendarDays strokeWidth={1.9} /><span>ביומן</span></Link>
              <Link className="ws-act press" to={`/booking/${booking.id}`}><ArrowUpLeft strokeWidth={1.9} /><span>הזמנה מלאה</span></Link>
            </div>

            <section className="ws-card ws-money" aria-label="תשלום">
              <div className="ws-row">
                <div><span className="ws-k">שולם</span><span className="ws-num">{money(bal.paid)}</span></div>
                <div className="ws-end"><span className="ws-k">{bal.balance > 0 ? 'יתרה' : 'סה״כ'}</span><span className={cn('ws-num', bal.balance > 0 && 'ws-due')}>{money(bal.balance > 0 ? bal.balance : bal.total)}</span></div>
              </div>
              <span className="ws-bar" aria-hidden><i style={{ width: `${pct}%` }} /></span>
            </section>

            {chat ? (
              <section className="ws-card ws-chat" aria-label="שיחה בוואטסאפ">
                <p className="ws-ct">שיחה בוואטסאפ</p>
                <div className="ws-thread">
                  {sentList.length ? sentList.map((s) => (
                    <div key={s} className="ws-bub"><span>{s}</span><Check className="ws-tick" strokeWidth={2.2} /></div>
                  )) : <p className="ws-k">עוד לא נשלחו הודעות.</p>}
                  {draft ? <div className="ws-bub ws-bub--draft"><span>{draft}</span></div> : null}
                </div>
                {due ? (
                  <button type="button" className="ws-send press" onClick={() => onWhatsApp?.(booking, due)}>
                    שליחת {templateByKey(due).label}
                  </button>
                ) : null}
              </section>
            ) : null}

            <section className="ws-card ws-journey" aria-label="מסע האורח">
              <p className="ws-ct">מסע האורח <span className="ws-k">{j.done}/7</span></p>
              <ol className="ws-steps">
                {j.steps.map((s, i) => (
                  <li key={s.l} className={cn(s.ok && 'ok', i === j.current && 'cur')}>
                    <i aria-hidden>{s.ok ? <Check strokeWidth={2.5} /> : null}</i>
                    <span>{s.l}</span>
                    {i === j.current && due && !chat ? (
                      <button type="button" className="ws-mini press" onClick={() => onWhatsApp?.(booking, due)}>שליחה</button>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
