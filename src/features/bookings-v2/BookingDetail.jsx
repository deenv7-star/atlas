/**
 * Bookings v2: one booking, light and calm. Sections in the order an owner thinks:
 * who and when → money → what to do. Destructive actions sit apart at the bottom.
 * Used inline (variant B desktop pane) and inside BookingDrawer (desktop side drawer / phone bottom sheet).
 */
import React from 'react';
import { Phone, MessageCircle, Pencil, Wallet, Check, Ban, Trash2, RotateCcw, Info, Moon, Users, BedDouble } from 'lucide-react';
import { formatDayHe } from '@/lib/stay/format';
import { checkOutOf } from '@/lib/stay/bookings';
import { guestLabel } from '@/ui-direction/y/model';
import Face from '@/ui-direction/y/Face';
import { cn } from '@/lib/utils';
import { statusOf, payOf, sourceOf, nightsOf, nightsLabel, isCancelled, isPending, isImported, nextStepOf } from './model';

const ils = (n) => `₪${Math.round(Number(n) || 0).toLocaleString('he-IL')}`;

function guestsLine(b) {
  const a = Number(b.adults) || 0;
  const c = Number(b.children) || 0;
  if (!a && !c) return '';
  const parts = [a === 1 ? 'מבוגר אחד' : a ? `${a} מבוגרים` : '', c === 1 ? 'ילד אחד' : c ? `${c} ילדים` : ''].filter(Boolean);
  return parts.join(' ו');
}

export function Chip({ kind, children, className }) {
  return <span className={cn('bk2-chip', `bk2-chip--${kind}`, className)}>{children}</span>;
}

export function BookingDetailBody({ booking: b, model: m, actions, TitleTag = 'h2', titleId }) {
  const day = m.day;
  const unit = m.prop(b.property_id);
  const bal = m.balanceFor(b);
  const st = statusOf(b, day);
  const pay = payOf(bal);
  const src = sourceOf(b);
  const n = nightsOf(b);
  const out = checkOutOf(b);
  const cancelled = isCancelled(b);
  const pending = isPending(b);
  const imported = isImported(b);
  const step = nextStepOf(b, bal, day);
  const guests = guestsLine(b);
  const canPay = !cancelled && !bal.unknown && bal.total > 0 && bal.balance > 0;
  const hasPhone = !!b.guest_phone;

  return (
    <div className="bk2-d" dir="rtl">
      <header className="bk2-d-h">
        <Face name={b.guest_name || ''} size={52} />
        <div className="bk2-d-hn">
          <TitleTag id={titleId} className="bk2-d-name" dir="auto">{guestLabel(b)}</TitleTag>
          <div className="bk2-d-chips">
            <Chip kind={st.key}>{st.label}</Chip>
            <Chip kind="src">{src.key === 'direct' ? 'הזמנה ישירה' : `דרך ${src.label}`}</Chip>
          </div>
        </div>
      </header>

      {step && !cancelled ? (
        <p className={cn('bk2-d-step', step.key === 'approve' && 'is-ind')}>
          {step.key === 'approve' ? <i className="bk2-dot bk2-dot--ind" aria-hidden /> : <i className="bk2-dot bk2-dot--amber" aria-hidden />}
          {step.text}
        </p>
      ) : null}

      <section className="bk2-d-sec" aria-label="השהייה">
        <h3 className="bk2-d-st">השהייה</h3>
        <div className="bk2-d-dates">
          <div><span>כניסה</span><b>{formatDayHe(b.check_in_date)}</b><small dir="ltr">{unit?.check_in_time || '15:00'}</small></div>
          <i aria-hidden className="bk2-d-arrow" />
          <div><span>יציאה</span><b>{formatDayHe(out)}</b><small dir="ltr">{unit?.check_out_time || '11:00'}</small></div>
        </div>
        <ul className="bk2-d-facts">
          {unit?.name ? <li><BedDouble aria-hidden strokeWidth={1.75} /><bdi>{unit.name}</bdi></li> : null}
          <li><Moon aria-hidden strokeWidth={1.75} />{nightsLabel(n)}</li>
          {guests ? <li><Users aria-hidden strokeWidth={1.75} />{guests}</li> : null}
        </ul>
      </section>

      <section className="bk2-d-sec" aria-label="תשלום">
        <div className="bk2-d-sth"><h3 className="bk2-d-st">תשלום</h3>{pay.label ? <Chip kind={pay.key}>{pay.label}</Chip> : null}</div>
        {bal.unknown ? (
          <p className="bk2-d-muted">התשלומים לא נטענו כרגע. נסו לרענן בעוד רגע.</p>
        ) : !bal.total ? (
          <p className="bk2-d-muted">{imported ? 'המחיר לא מגיע מהסנכרון. אפשר להוסיף אותו בעריכה.' : 'עוד לא הוזן מחיר להזמנה הזאת.'}</p>
        ) : (
          <>
            <dl className="bk2-d-money">
              <div><dt>מחיר</dt><dd dir="ltr">{ils(bal.total)}</dd></div>
              <div><dt>שולם</dt><dd dir="ltr">{ils(bal.paid)}</dd></div>
              <div className={cn(bal.balance > 0 && 'is-due')}><dt>נשאר לגבות</dt><dd dir="ltr">{ils(bal.balance)}</dd></div>
            </dl>
            <div className="bk2-d-bar" aria-hidden><i style={{ width: `${Math.min(100, Math.round((bal.paid / bal.total) * 100))}%` }} /></div>
          </>
        )}
      </section>

      {b.notes && !/^נוסף אוטומטית מסנכרון/.test(b.notes) ? (
        <section className="bk2-d-sec" aria-label="הערות">
          <h3 className="bk2-d-st">הערות</h3>
          <p className="bk2-d-notes" dir="auto">{b.notes}</p>
        </section>
      ) : null}

      <section className="bk2-d-acts" aria-label="פעולות">
        {pending && !cancelled ? (
          <button type="button" className="bk2-btn bk2-btn--pri press" onClick={() => actions.approve(b)}><Check aria-hidden strokeWidth={2} />אישור ההזמנה</button>
        ) : null}
        {cancelled ? (
          <button type="button" className="bk2-btn bk2-btn--pri press" onClick={() => actions.restore(b)}><RotateCcw aria-hidden strokeWidth={2} />החזרת ההזמנה</button>
        ) : null}
        {!cancelled && hasPhone && !pending ? (
          <button type="button" className="bk2-btn bk2-btn--pri press" onClick={() => actions.whatsapp(b)}><MessageCircle aria-hidden strokeWidth={2} />הודעה בוואטסאפ</button>
        ) : null}
        <div className="bk2-d-grid">
          {!cancelled && hasPhone && pending ? (
            <button type="button" className="bk2-btn press" onClick={() => actions.whatsapp(b)}><MessageCircle aria-hidden strokeWidth={1.75} />וואטסאפ</button>
          ) : null}
          {canPay ? <button type="button" className="bk2-btn press" onClick={() => actions.pay(b, bal)}><Wallet aria-hidden strokeWidth={1.75} />רישום תשלום</button> : null}
          <button type="button" className="bk2-btn press" onClick={() => actions.edit(b)}><Pencil aria-hidden strokeWidth={1.75} />עריכה</button>
          {hasPhone ? <a className="bk2-btn press" href={`tel:${b.guest_phone}`}><Phone aria-hidden strokeWidth={1.75} />שיחה</a> : null}
        </div>
      </section>

      <section className="bk2-d-danger" aria-label="ביטול ומחיקה">
        {imported ? (
          <p className="bk2-d-imp">
            <Info aria-hidden strokeWidth={1.75} />
            <span>ההזמנה הגיעה מ-{src.label}. כדי לבטל או למחוק אותה, בטלו אותה ב-{src.label}, והיא תרד מכאן לבד בסנכרון הבא.</span>
          </p>
        ) : (
          <div className="bk2-d-dbtns">
            {!cancelled ? <button type="button" className="bk2-btn bk2-btn--quiet press" onClick={() => actions.cancel(b)}><Ban aria-hidden strokeWidth={1.75} />ביטול הזמנה</button> : null}
            <button type="button" className="bk2-btn bk2-btn--quiet press" onClick={() => actions.remove(b)}><Trash2 aria-hidden strokeWidth={1.75} />מחיקה</button>
          </div>
        )}
      </section>
    </div>
  );
}
