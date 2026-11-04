/**
 * fix/today-tiles (04.11.2026, Deen on build 15): every Today tile opens a small native-feeling sheet with the
 * detail behind its number and one clear next step. Light sheet (white on the canvas), grabber, title, 44px close,
 * rows ≥ 52px, one indigo primary action at the bottom. Phone: bottom sheet; desktop: centred card.
 * Everything is read from the same model as the tile, nothing invented; empty states say what will appear.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { X, ChevronLeft, MessageCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { formatDayHe } from '@/lib/stay/format';
import { unitOccupancy } from '@/lib/stay/occupancy';
import { isActiveBooking } from '@/lib/stay/bookings';
import { heCount } from '@/lib/hebrewCount';
import { checkInTime, checkOutTime } from '@/components/today/TodayBoard';
import { money, guestLabel, MONTHS } from './model';
import Face from './Face';
import './y-sheets.css';

function Sheet({ open, onOpenChange, title, sub, children, action }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="yt-overlay" />
        <D.Content className="yt-sheet" dir="rtl" aria-describedby={sub ? 'yt-sheet-sub' : undefined}>
          <span className="yt-grab" aria-hidden />
          <div className="yt-top">
            <div className="yt-top-t">
              <D.Title className="yt-title">{title}</D.Title>
              {sub ? <p id="yt-sheet-sub" className="yt-sub">{sub}</p> : null}
            </div>
            <D.Close className="yt-x press" aria-label="סגירה"><X strokeWidth={1.75} /></D.Close>
          </div>
          <div className="yt-body">{children}</div>
          {action ? <div className="yt-foot">{action}</div> : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

const Go = ({ to, children, onClick }) => (
  <Link to={to} onClick={onClick} className="yt-go press">{children}<ChevronLeft strokeWidth={2} aria-hidden /></Link>
);

function Empty({ title, line }) {
  return <div className="yt-empty" role="status"><b>{title}</b>{line ? <span>{line}</span> : null}</div>;
}

function Stat({ label, value, strong }) {
  return <div className={cn('yt-stat', strong && 'is-strong')}><span>{label}</span><b dir="ltr">{value}</b></div>;
}

/** A booking row: face, guest, unit + when, time on the left. Tap opens the booking. */
function BookingRow({ b, model, kick, time, onOpen, trailing }) {
  const p = model.prop(b.property_id);
  return (
    <li className="yt-row">
      <button type="button" className="yt-row-b press" onClick={() => onOpen(b)}>
        <span className="yt-row-face"><Face name={b.guest_name || ''} size={40} /></span>
        <span className="yt-row-t">
          {kick ? <em>{kick}</em> : null}
          <b dir="auto">{guestLabel(b)}</b>
          <small><bdi>{p?.name || b.property_name || 'יחידה'}</bdi></small>
        </span>
        {time ? <span className="yt-row-time" dir="ltr">{time}</span> : null}
        <ChevronLeft className="yt-row-chev" strokeWidth={1.75} aria-hidden />
      </button>
      {trailing}
    </li>
  );
}

export function ArrivalsSheet({ open, onOpenChange, model, onOpenBooking }) {
  const { arrivals, departures } = model.board;
  const nextUp = (model.data.bookings || []).filter(isActiveBooking).filter((b) => b.check_in_date > model.day)
    .sort((a, z) => a.check_in_date.localeCompare(z.check_in_date))[0];
  const none = !arrivals.length && !departures.length;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="מגיעים ויוצאים היום" sub={formatDayHe(model.day)}
      action={<Go to={createPageUrl('MultiCalendar')} onClick={() => onOpenChange(false)}>פתיחת היומן</Go>}>
      {none ? (
        <Empty title="היום אין הגעות ויציאות" line={nextUp ? `ההגעה הבאה: ${guestLabel(nextUp)}, ${formatDayHe(nextUp.check_in_date, { weekday: false })}` : 'הזמנות חדשות יופיעו כאן ביום ההגעה'} />
      ) : (
        <>
          {arrivals.length ? <p className="yt-h">{arrivals.length === 1 ? 'הגעה אחת' : `${arrivals.length} הגעות`}</p> : null}
          <ul className="yt-list">
            {arrivals.map(({ booking: b }) => (
              <BookingRow key={`in-${b.id}`} b={b} model={model} kick="הגעה" time={checkInTime(b, model.prop(b.property_id))} onOpen={onOpenBooking} />
            ))}
          </ul>
          {departures.length ? <p className="yt-h">{departures.length === 1 ? 'יציאה אחת' : `${departures.length} יציאות`}</p> : null}
          <ul className="yt-list">
            {departures.map(({ booking: b }) => (
              <BookingRow key={`out-${b.id}`} b={b} model={model} kick="יציאה" time={checkOutTime(b, model.prop(b.property_id))} onOpen={onOpenBooking} />
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}

export function IncomeSheet({ open, onOpenChange, model }) {
  const known = model.moneyKnown;
  const rec = model.money.received || 0; const exp = model.money.expected || 0;
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const inMonth = (model.data.bookings || []).filter(isActiveBooking).filter((b) => String(b.check_in_date).slice(0, 7) === ym)
    .sort((a, z) => (Number(z.total_price) || 0) - (Number(a.total_price) || 0)).slice(0, 5);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`הכסף של ${model.money.month}`} sub="לפי הזמנות שנכנסות החודש"
      action={<Go to={createPageUrl('Payments')} onClick={() => onOpenChange(false)}>למסך כסף</Go>}>
      {!known ? <Empty title="לא הצלחנו לקרוא את התשלומים כרגע" line="נסו שוב בעוד רגע" /> : (
        <>
          <div className="yt-stats">
            <Stat label="נכנס" value={money(rec)} strong />
            <Stat label="עוד צפוי" value={money(Math.max(0, exp - rec))} />
            <Stat label={`סה״כ ${model.money.month}`} value={money(exp)} />
          </div>
          {inMonth.length ? (
            <>
              <p className="yt-h">הזמנות החודש</p>
              <ul className="yt-list yt-list--plain">
                {inMonth.map((b) => (
                  <li key={b.id} className="yt-line"><span dir="auto">{guestLabel(b)}</span><small><bdi>{model.prop(b.property_id)?.name || ''}</bdi></small><b dir="ltr">{money(b.total_price)}</b></li>
                ))}
              </ul>
            </>
          ) : <Empty title={`עוד אין הזמנות ב${model.money.month}`} line="כל הזמנה שתיכנס תופיע כאן עם הסכום שלה" />}
        </>
      )}
    </Sheet>
  );
}

export function OccupancySheet({ open, onOpenChange, model }) {
  const rows = unitOccupancy({ bookings: model.data.bookings || [], properties: model.data.properties || [] });
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`תפוסה ב${model.money.month}`}
      sub={model.money.occupancy == null ? null : `${model.money.occupancy}% מהלילות תפוסים`}
      action={<Go to={createPageUrl('MultiCalendar')} onClick={() => onOpenChange(false)}>פתיחת היומן</Go>}>
      {!rows.length ? <Empty title="עוד אין יחידות" line="הוסיפו יחידה כדי לראות כאן תפוסה" /> : (
        <ul className="yt-list yt-list--plain">
          {rows.map((r) => (
            <li key={r.id} className="yt-occ">
              <div className="yt-occ-h"><b><bdi>{r.name}</bdi></b><span>{r.nights ? `${heCount(r.nights, 'night')} מתוך ${r.days}` : 'עוד אין לילות תפוסים'}</span></div>
              <div className="yt-occ-bar" role="img" aria-label={`${r.pct}% תפוסה`}><i style={{ width: `${Math.max(r.pct, r.nights ? 3 : 0)}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

export function PendingSheet({ open, onOpenChange, model, onOpenBooking, onRemind }) {
  const known = model.moneyKnown;
  const list = model.pending || [];
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="ממתינים לתשלום"
      sub={known && list.length ? `${money(model.pendingTotal)} פתוחים · ${list.length === 1 ? 'הזמנה אחת' : `${list.length} הזמנות`}` : null}
      action={<Go to={createPageUrl('Payments')} onClick={() => onOpenChange(false)}>למסך כסף</Go>}>
      {!known ? <Empty title="לא הצלחנו לקרוא את התשלומים כרגע" line="נסו שוב בעוד רגע" />
        : !list.length ? <Empty title="אין יתרות פתוחות" line="יתרה של אורח שמגיע בימים הקרובים תופיע כאן" /> : (
          <ul className="yt-list">
            {list.map(({ booking: b, balance }) => (
              <BookingRow key={b.id} b={b} model={model} onOpen={onOpenBooking}
                kick={balance.overdue ? 'באיחור' : `מגיעים ${formatDayHe(b.check_in_date, { weekday: false })}`}
                time={money(balance.balance)}
                trailing={(
                  <button type="button" className="yt-wa press" onClick={() => onRemind(b)}>
                    <MessageCircle strokeWidth={1.75} aria-hidden />תזכורת תשלום בוואטסאפ
                  </button>
                )} />
            ))}
          </ul>
        )}
    </Sheet>
  );
}

export function RevenueSheet({ open, onOpenChange, model }) {
  const months = model.money.months || [];
  const max = Math.max(1, ...months.map((x) => (x.value || 0) + (x.expected || 0)));
  const any = months.some((x) => (x.value || 0) + (x.expected || 0) > 0);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="הכנסות לפי חודש" sub="6 החודשים האחרונים"
      action={<Go to={createPageUrl('Payments')} onClick={() => onOpenChange(false)}>למסך כסף</Go>}>
      {!model.moneyKnown ? <Empty title="לא הצלחנו לקרוא את ההכנסות כרגע" line="נסו שוב בעוד רגע" />
        : !any ? <Empty title="עוד אין הכנסות להצגה" line="הגרף יתמלא מההזמנה הראשונה" /> : (
          <ul className="yt-list yt-list--plain">
            {[...months].reverse().map((x) => {
              const tot = (x.value || 0) + (x.expected || 0);
              return (
                <li key={x.key} className="yt-occ">
                  <div className="yt-occ-h"><b>{x.long || x.label}</b><span dir="ltr">{money(tot)}</span></div>
                  <div className="yt-occ-bar yt-occ-bar--rev" role="img" aria-label={`נכנס ${money(x.value)}, צפוי ${money(x.expected)}`}>
                    <i style={{ width: `${(x.value / max) * 100}%` }} />
                    {x.expected ? <i className="is-exp" style={{ width: `${(x.expected / max) * 100}%` }} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      {model.moneyKnown && any ? <p className="yt-key"><span><i />נכנס</span><span><i className="is-exp" />צפוי</span></p> : null}
    </Sheet>
  );
}

const KIND = { message: 'הודעה', clean: 'ניקיון', lead: 'פנייה', balance: 'תשלום' };

export function DaySheet({ open, onOpenChange, model, onDo }) {
  const q = model.queue;
  const t = model.boardT;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={q.length ? 'מה מחכה לכם היום' : 'הכל בוצע להיום'}
      sub={q.length ? (q.length === 1 ? 'דבר אחד' : `${q.length} דברים`) : `מחר: ${t.arrivals.length === 1 ? 'הגעה אחת' : `${t.arrivals.length} הגעות`}, ${t.departures.length === 1 ? 'יציאה אחת' : `${t.departures.length} יציאות`}`}
      action={<Go to="/messages" onClick={() => onOpenChange(false)}>כל המשימות</Go>}>
      {!q.length ? <Empty title="אין משימות פתוחות" line="הודעות לאורחים, ניקיונות ויתרות יופיעו כאן כשיגיע הזמן" /> : (
        <ul className="yt-list">
          {q.slice(0, 6).map((a) => (
            <li key={a.id} className="yt-row">
              <div className="yt-row-b yt-row-b--static">
                <span className="yt-row-t"><em>{KIND[a.kind]}</em><b>{a.title}</b>{a.sub ? <small>{a.sub}</small> : null}</span>
                <button type="button" className="yt-do press" onClick={() => onDo(a)}>{a.short}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

/** Empty account (units, no bookings): one honest card instead of a board of zeros that looks broken. */
export function NoBookingsCard({ onAdd }) {
  return (
    <section className="yt-nobook" aria-labelledby="yt-nobook-h">
      <div>
        <h2 id="yt-nobook-h">עוד אין כאן הזמנות</h2>
        <p>הוסיפו הזמנה או חברו את Booking ו-Airbnb, והמספרים יתמלאו.</p>
      </div>
      <div className="yt-nobook-a">
        <button type="button" className="yt-go press" onClick={onAdd}><Plus strokeWidth={2} aria-hidden />הוספת הזמנה</button>
        <Link to={createPageUrl('Integrations')} className="yt-ghost press">חיבור ערוצים</Link>
      </div>
    </section>
  );
}
