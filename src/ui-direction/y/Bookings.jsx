/**
 * Y3 bookings (Y1's list + detail, re-cut for the Y2 glass world). A navy glass panel inside the window:
 * a glass segmented control (הכל / היום / יתרות), the bookings as rows, and the chosen booking open beside
 * them on desktop (dates, unit photo, guest, money, next action, guest journey). On the phone a row opens
 * the same detail as a navy glass sheet.
 */
import React, { forwardRef, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as D from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowUpLeft, ArrowLeft, Check, MessageCircle, ChevronLeft, CalendarRange } from 'lucide-react';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatRangeHe, nightsBetween } from '@/lib/stay/format';
import { checkOutOf, channelOf, isPaid } from '@/lib/stay/bookings';
import { dueTemplateFor, templateByKey, logSubjectFor } from '@/lib/stay/whatsapp';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { guestLabel, guestsOf } from './model';
import Face from './Face';
import './y3.css';
import { Num, StripeBar, whenOf } from './ui';

const EASE = [0.23, 1, 0.32, 1];
const STEPS = ['ההזמנה', 'אישור', 'מקדמה', 'הוראות הגעה', 'כניסה', 'יציאה', 'תודה'];
export const isPhone = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

function journeyOf(booking, sent, payments) {
  const has = (k) => sent.has(logSubjectFor(k));
  const st = String(booking.status || '').toUpperCase();
  const paid = (payments || []).some(isPaid);
  const ok = [true, has('confirmation'), paid, has('arrival_eve'), st === 'CHECKED_IN' || st === 'CHECKED_OUT', st === 'CHECKED_OUT', has('thanks_review')];
  return { ok, done: ok.filter(Boolean).length, current: ok.findIndex((x) => !x) };
}

function Journey({ booking, model }) {
  const j = journeyOf(booking, model.sentOf(booking), model.paysOf(booking));
  return (
    <div className="y3j" aria-label={`מסע האורח, ${j.done} מתוך 7`}>
      <div className="y3j-h"><p>מסע האורח</p><span>{j.current >= 0 ? `השלב הבא: ${STEPS[j.current]}` : 'הושלם'}</span></div>
      <ol className="y3j-steps">
        {STEPS.map((s, i) => <li key={s} className={cn(j.ok[i] && 'ok', i === j.current && 'cur')}><i style={{ animationDelay: `${i * 70}ms` }} />{s}</li>)}
      </ol>
    </div>
  );
}

function Detail({ booking, model, onWhatsApp, Title = 'p' }) {
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
    <div className="y3d" dir="rtl">
      <div className={cn('y3d-photo', !photo && 'y3d-photo--none')}>
        {photo ? <img src={photo} alt="" decoding="async" /> : null}
        <span className="y3d-shade" aria-hidden />
        <span className="y3d-when">{whenOf(booking, model.day)}</span>
        <div className="y3d-id">
          <Face name={booking.guest_name || ''} size={50} ring />
          <span><Title className="y3d-gn" dir="auto">{guestLabel(booking)}</Title><small>{[property?.name, ch.key === 'direct' ? 'ישיר' : ch.label, guestsOf(booking)].filter(Boolean).join(' · ')}</small></span>
        </div>
      </div>
      <div className="y3d-stay">
        <div className="y3d-range"><span>שהייה</span><b>{formatRangeHe(booking.check_in_date, checkOutOf(booking))}</b></div>
        <div><span>{booking.check_in_date === model.day ? 'כניסה היום' : 'כניסה'}</span><b dir="ltr">{property?.check_in_time || '15:00'}</b></div>
        <div><span>יציאה</span><b dir="ltr">{property?.check_out_time || '11:00'}</b></div>
        <div><span>לילות</span><b dir="ltr">{nights}</b></div>
      </div>
      <div className="y3d-tiles">
        <div className="y3d-t"><span>סה״כ ההזמנה</span><Num value={bal.total} pre="₪" /></div>
        <div className="y3d-t"><span>שולם</span><Num value={bal.paid} pre="₪" delay={80} /><StripeBar value={bal.total ? bal.paid / bal.total : 0} tone="white" delay={300} /></div>
        <div className={cn('y3d-t', bal.balance > 0 && 'is-due')}><span>יתרה{bal.balance > 0 ? <i className="y2-amber" aria-hidden /> : <Check strokeWidth={2} />}</span><Num value={bal.balance} pre="₪" delay={160} /></div>
      </div>
      <div className="y3d-act">
        <button type="button" className={cn('y3d-go press', isDone && 'is-go')} onClick={act}>
          <span>{isDone ? item.doneText : label}{item && !isDone ? <small>{item.title}</small> : null}</span>
          <i>{isDone ? <Check strokeWidth={2.2} /> : <ArrowLeft strokeWidth={2} />}</i>
        </button>
        {booking.guest_phone ? <a className="y3-cb press" href={`tel:${booking.guest_phone}`} aria-label="שיחה לאורח"><Phone strokeWidth={1.75} /></a> : null}
        <button type="button" className="y3-cb press" aria-label="וואטסאפ לאורח" onClick={() => onWhatsApp?.(booking, due || 'confirmation')}><MessageCircle strokeWidth={1.75} /></button>
        <Link className="y3-cb press" to={`/booking/${booking.id}`} aria-label="ההזמנה המלאה"><ArrowUpLeft strokeWidth={1.75} /></Link>
      </div>
    </div>
  );
}

/** the navy glass panel: tabs, rows, the chosen booking beside them (desktop) */
export const BookingsPanel = forwardRef(function BookingsPanel({
  model: m, list, selId, setSelId, onOpen, onWhatsApp, delay = 0,
  // page mode (/bookings): the page owns the tabs + filtering and passes the already-filtered page of rows
  tabs: tabsIn = null, tab: tabIn, onTab, limit = 6, title = 'ההזמנות', headingLevel = 'h2', toolbar = null, footer = null, empty = null, loading = false, className = '', ...rest
}, ref) {
  const [tabOwn, setTabOwn] = useState('all');
  const controlled = Array.isArray(tabsIn);
  const tab = controlled ? tabIn : tabOwn;
  const setTab = controlled ? (k) => onTab?.(k) : setTabOwn;
  const H = headingLevel;
  const todayOf = (b) => b.check_in_date === m.day || checkOutOf(b) === m.day;
  const shown = useMemo(() => {
    if (controlled) return list;
    if (tab === 'today') return list.filter(todayOf);
    if (tab === 'due') return list.filter((b) => m.balanceFor(b).balance > 0);
    return list;
  }, [tab, list, m, controlled]);
  const sel = shown.find((b) => b.id === selId) || shown.find((b) => b.check_in_date === m.day) || shown[0] || null;
  const tabs = controlled ? tabsIn.map((t) => [t.key, t.label, t.count]) : [['all', 'הכל', list.length], ['today', 'היום', list.filter(todayOf).length], ['due', 'יתרות', list.filter((b) => m.balanceFor(b).balance > 0).length]];

  return (
    <motion.section ref={ref} className={cn('y3-panel', className)} aria-label={title} {...rest} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay }}>
      <div className="y3-panel-h">
        <H className="y3-panel-t">{title}</H>
        <div className="y3-seg" role="tablist" aria-label="סינון הזמנות">
          {tabs.map(([k, l, n]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={cn('y3-st press', tab === k && 'on')} onClick={() => { setTab(k); setSelId(null); }}>
              {tab === k ? <motion.i layoutId="y3-st-on" className="y3-st-on" transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }} /> : null}
              <span>{l}</span><em dir="ltr">{n}</em>
            </button>
          ))}
        </div>
        <Link to={createPageUrl('MultiCalendar')} className="y2-gb y2-gb--d press y3-hide-m" aria-label="ליומן"><CalendarRange strokeWidth={1.75} /></Link>
      </div>
      {toolbar}
      <div className="y3-split">
        <div className="y3-split-l">
        <ul className="y3-list">
          {loading ? [0, 1, 2, 3].map((i) => <li key={`sk${i}`} className="y3-row y3-row--sk" aria-hidden />) : null}
          {!loading && shown.slice(0, limit).map((b, i) => {
            const bal = m.balanceFor(b);
            const on = sel?.id === b.id;
            const p = m.prop(b.property_id);
            const photo = unitPhoto(p);
            return (
              <motion.li key={b.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE, delay: delay + 0.15 + Math.min(i, 8) * 0.05 }}>
                <button type="button" className={cn('y3-row press', on && 'on')} aria-pressed={on} onClick={() => { setSelId(b.id); if (isPhone()) onOpen(b); }}>
                  {photo ? (
                    <span className="y3-row-img"><img src={photo} alt="" loading="lazy" decoding="async" /><Face name={b.guest_name || ''} size={26} ring /></span>
                  ) : <span className="y3-row-img y3-row-img--face"><Face name={b.guest_name || ''} size={46} /></span>}
                  <span className="y3-row-n"><b dir="auto">{guestLabel(b)}</b><small>{p?.name ? <><bdi>{p.name}</bdi> · </> : null}{whenOf(b, m.day)}</small></span>
                  <span className={cn('y3-pay', bal.balance > 0 ? 'due' : 'ok')}>{bal.total === 0 ? 'בלי מחיר' : bal.balance > 0 ? (bal.paid > 0 ? 'מקדמה' : 'לא שולם') : 'שולם'}</span>
                  <span className="y3-row-a" dir="ltr"><small>₪</small>{Math.round(Number(b.total_price) || 0).toLocaleString('he-IL')}</span>
                </button>
              </motion.li>
            );
          })}
          {!loading && !shown.length ? (empty ? <li className="y3-empty">{empty}</li> : <li className="y3-empty">{tab === 'due' ? 'אין יתרות פתוחות' : tab === 'today' ? 'אין כניסות או יציאות היום' : 'עדיין אין הזמנות. הזמנות חדשות יופיעו כאן.'}</li>) : null}
          {shown.length > limit ? <li><Link to={createPageUrl('Bookings')} className="y3-more press">עוד {shown.length - limit} הזמנות<ChevronLeft strokeWidth={1.75} /></Link></li> : null}
        </ul>
        {footer}
        </div>
        <div className="y3-split-d">
          <AnimatePresence mode="wait">
            {sel ? (
              <motion.div key={sel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EASE }}>
                <Detail booking={sel} model={m} onWhatsApp={onWhatsApp} />
                <Journey booking={sel} model={m} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
});

/** phone: the same detail as a navy glass sheet */
export function BookingSheet({ open, onOpenChange, booking, model, onWhatsApp }) {
  if (!booking) return null;
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="y3s-overlay" />
        <D.Content className="y3s" dir="rtl" aria-describedby={undefined}>
          <span className="y3s-grab" aria-hidden />
          <div className="y3s-top">
            <D.Title className="y3s-t">פרטי ההזמנה</D.Title>
            <D.Close className="y3-cb press" aria-label="סגירה"><X strokeWidth={1.75} /></D.Close>
          </div>
          <Detail booking={booking} model={model} onWhatsApp={onWhatsApp} />
          <Journey booking={booking} model={model} />
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
