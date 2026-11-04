/**
 * Y3 · "השילוב" = Y2 "זכוכית" (after the visionOS glass board). One frosted window over a real zimmer photo.
 * Four white metric tiles, each with its own tiny live viz; the month's income as a glowing wave next to
 * a real photo card of who arrives next; "הדבר הבא" as three cards, the first one indigo. A darker glass
 * column on the side: the month calendar with colored days and who comes and goes today, with photos.
 * Y3: below them Y1's bookings panel in navy glass (list + the chosen booking beside it); on the phone a row
 * opens the same detail as a navy glass sheet.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, MoreHorizontal, Sparkles } from 'lucide-react';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { formatDayHe, firstName, parseDay } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, channelOf } from '@/lib/stay/bookings';
import { dayPart, GuestAvatar } from '@/components/app/atoms';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { useTodayModel, money, moneyNum, guestLabel, MONTHS } from './model';
import Face from './Face';
import { Num, Ticks, Wave, DotGrid, Ring, FaceStack, useBookingList, whenOf } from './ui';
import { BookingsPanel, BookingSheet, isPhone } from './Bookings';
import './y3.css';

const EASE = [0.23, 1, 0.32, 1];
const rise = (i = 0) => ({ initial: { opacity: 0, y: 16, scale: 0.985 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.7, ease: EASE, delay: 0.05 + i * 0.07 } });
const KICK = { message: 'הודעה מוכנה', clean: 'ניקיון', lead: 'פנייה חדשה', balance: 'תשלום' };
const BTN = { message: 'שליחה', clean: 'סימון', lead: 'מענה', balance: 'תזכורת' };
const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function MonthCal({ model }) {
  const now = parseDay(model.day);
  const y = now.getFullYear(); const mth = now.getMonth();
  const first = new Date(y, mth, 1).getDay(); const days = new Date(y, mth + 1, 0).getDate();
  const iso = (d) => `${y}-${String(mth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const act = (model.data.bookings || []).filter(isActiveBooking);
  const units = Math.max(1, (model.data.properties || []).length);
  const cells = [];
  for (let i = 0; i < first; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) {
    const k = iso(d);
    const arr = act.some((b) => b.check_in_date === k);
    const occ = act.filter((b) => b.check_in_date <= k && checkOutOf(b) > k).length;
    cells.push({ d, k, arr, occ: occ / units, today: k === model.day });
  }
  return (
    <div className="y2-cal">
      <div className="y2-cal-h">
        <p>{MONTHS[mth]} {y}</p>
        <span><Link to={createPageUrl('MultiCalendar')} className="y2-cal-nav press" aria-label="החודש הקודם ביומן"><ChevronRight strokeWidth={1.75} /></Link><Link to={createPageUrl('MultiCalendar')} className="y2-cal-nav press" aria-label="החודש הבא ביומן"><ChevronLeft strokeWidth={1.75} /></Link></span>
      </div>
      <div className="y2-cal-g">
        {DAYS.map((d) => <b key={d}>{d}</b>)}
        {cells.map((c, i) => (c ? (
          <span key={c.k} className={cn('y2-cd', c.arr && 'arr', !c.arr && c.occ > 0 && 'occ', c.today && 'today')} style={{ animationDelay: `${300 + i * 12}ms` }}>{c.d}</span>
        ) : <span key={`e${i}`} />))}
      </div>
      <div className="y2-cal-k"><span><i className="arr" />הגעות</span><span><i className="occ" />תפוס</span><span><i className="today" />היום</span></div>
    </div>
  );
}

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  const list = useBookingList(m);
  const [sheet, setSheet] = useState(null);
  const [selId, setSelId] = useState(null);
  const panelRef = useRef(null);
  // phone: the navy sheet; desktop: pick it in the bookings panel and bring the panel into view
  const openBooking = (b) => {
    if (isPhone()) { setSheet(b); return; }
    setSelId(b.id);
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [composer, setComposer] = useState(null);
  const [going, setGoing] = useState(null);
  const name = firstName(user?.full_name || '');

  const arrivals = m.board.arrivals; const departures = m.board.departures;
  const months = m.money.months || [];
  const mx = Math.max(1, ...months.map((x) => (x.value || 0) + (x.expected || 0)));
  const wave = months.map((x) => ((x.value || 0) + (x.expected || 0)) / mx);
  const bestI = wave.indexOf(Math.max(...wave));
  // no revenue at all: an empty state instead of "₪0K" three times; small totals stay in shekels, not "₪0K/₪1K"
  const hasRevenue = months.some((x) => (x.value || 0) + (x.expected || 0) > 0);
  const tick = (v) => (v === 0 ? '₪0' : mx >= 10000 ? `₪${moneyNum(v / 1000)}K` : mx >= 1000 ? `₪${(Math.round(v / 100) / 10).toLocaleString('he-IL')}K` : `₪${moneyNum(v)}`);

  // the day as hour ticks 8..20: arrivals hot, departures on
  const hours = useMemo(() => Array.from({ length: 13 }, (_, i) => {
    const h = 8 + i;
    const inH = arrivals.some((a) => String(m.prop(a.booking.property_id)?.check_in_time || '15:00').startsWith(String(h).padStart(2, '0')));
    const outH = departures.some((a) => String(m.prop(a.booking.property_id)?.check_out_time || '11:00').startsWith(String(h).padStart(2, '0')));
    return inH ? 1 : outH ? 0.72 : 0.22 + ((i * 37) % 5) / 30;
  }), [arrivals, departures, m]);
  const hotHour = hours.indexOf(1);

  const hero = arrivals[0]?.booking || list[0] || null;
  const heroUnit = hero ? m.prop(hero.property_id) : null;
  const heroBal = hero ? m.balanceFor(hero) : null;
  const q3 = m.queue.slice(0, 3);
  const dueCount = m.pending.length;
  const totalBookings = list.length;

  const go = (a) => { setGoing(a.id); m.doItem(a); setTimeout(() => setGoing(null), 900); };
  const today = [...departures.map((x) => ({ ...x, dir: 'out' })), ...arrivals.map((x) => ({ ...x, dir: 'in' }))];
  const upcoming = list.filter((b) => b.check_in_date > m.day).slice(0, 3);

  return (
    <div className="y2" dir="rtl">
      <motion.div className="y2-win" {...rise(0)}>
        <div className="y2-main">
          <div className="y2-hello">
            <div>
              <h1 className="y2-h1">{dayPart().greeting}{name ? <>, <b>{name}</b></> : null}</h1>
              <p className="y2-sub">{formatDayHe(m.day)} · {arrivals.length} מגיעים, {departures.length} יוצאים</p>
            </div>
            <Link to="/messages" className="y2-hello-chip press"><i aria-hidden />{m.queue.length ? (m.queue.length === 1 ? 'דבר אחד מחכה לכם' : `${m.queue.length} דברים מחכים לכם`) : 'הכל בוצע להיום'}</Link>
          </div>

          <section className="y2-tiles" aria-label="היום במספרים">
            <motion.div className="y2-tile" {...rise(1)}>
              <p className="y2-tk">מגיעים היום<FaceStack names={arrivals.map((a) => a.booking.guest_name || '')} size={26} max={3} /></p>
              <Ticks values={hours} hot={hotHour} height={50} className="y2-tile-viz" />
              <p className="y2-tn"><Num value={arrivals.length} /><span>אורחים · {departures.length} יוצאים</span></p>
            </motion.div>
            <motion.div className="y2-tile" {...rise(2)}>
              <p className="y2-tk">נכנס ב{m.money.month}</p>
              <div className="y2-tile-viz"><Wave values={[...wave].reverse()} h={50} /></div>
              <p className="y2-tn"><Num value={m.money.received} pre="₪" delay={80} /></p>
            </motion.div>
            <motion.div className="y2-tile y2-tile--ring" {...rise(3)}>
              <p className="y2-tk">תפוסה ב{m.money.month}</p>
              <Ring value={m.money.occupancy / 100} size={86} stroke={9} className="y2-tile-viz">
                <Num value={m.money.occupancy} post="%" delay={160} className="y2-ring-n" />
              </Ring>
              <p className="y2-tn y2-tn--s"><span>{(m.data.properties || []).length} יחידות</span></p>
            </motion.div>
            <motion.div className="y2-tile" {...rise(4)}>
              <p className="y2-tk">ממתינים לתשלום<i className="y2-amber" aria-hidden /></p>
              <DotGrid total={20} on={Math.min(20, Math.round((m.money.received / Math.max(1, m.money.expected)) * 20))} cols={10} className="y2-tile-viz y2-dots" />
              <p className="y2-tn"><Num value={m.pendingTotal} pre="₪" delay={240} /><span>{dueCount} {dueCount === 1 ? 'הזמנה' : 'הזמנות'}</span></p>
            </motion.div>
          </section>

          <div className="y2-mid">
            <motion.section className="y2-card y2-chart" aria-label="הכנסות" {...rise(5)}>
              <div className="y2-card-h"><h2>הכנסות</h2><span className="y2-seg">6 חודשים</span></div>
              {!hasRevenue ? (
                <div className="y2-chart-empty">
                  <b>עוד אין הכנסות להצגה</b>
                  <span>הגרף יתמלא מההזמנה הראשונה</span>
                </div>
              ) : (
              <div className="y2-chart-b">
                <div className="y2-chart-y" aria-hidden>{[1, 0.66, 0.33, 0].map((t) => <span key={t}>{tick(mx * t)}</span>)}</div>
                <div className="y2-chart-p">
                  <Wave values={[...wave].reverse()} w={520} h={190} />
                  {bestI >= 0 ? (
                    <span className="y2-tip" style={{ right: `${(bestI / Math.max(1, wave.length - 1)) * 100}%`, bottom: `${wave[bestI] * 78 + 8}%` }}>
                      {money((months[bestI]?.value || 0) + (months[bestI]?.expected || 0))}
                    </span>
                  ) : null}
                </div>
              </div>
              )}
              <div className="y2-chart-x" aria-hidden>{months.map((x, i) => <span key={i}>{x.label || ''}</span>)}</div>
            </motion.section>

            {hero ? (
              <motion.button type="button" className={cn('y2-photo press', !unitPhoto(heroUnit) && 'y2-photo--none')} onClick={() => openBooking(hero)}
                initial={{ y: 16, scale: 0.985 }} animate={{ y: 0, scale: 1 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}>
                {unitPhoto(heroUnit) ? <img src={unitPhoto(heroUnit)} alt="" fetchPriority="high" /> : null}
                <span className="y2-photo-shade" aria-hidden />
                <span className="y2-photo-t">
                  <small>{whenOf(hero, m.day)}</small>
                  <b dir="auto">{guestLabel(hero)}</b>
                  <em><bdi>{heroUnit?.name}</bdi></em>
                </span>
                <span className="y2-photo-face"><Face name={hero.guest_name || ''} size={46} ring /></span>
                <span className="y2-photo-s">
                  <span><b dir="ltr">{heroUnit?.check_in_time || '15:00'}</b><small>כניסה</small></span>
                  <span><b dir="ltr">{heroBal ? `₪${moneyNum(heroBal.total)}` : ''}</b><small>{heroBal?.balance > 0 ? `יתרה ₪${moneyNum(heroBal.balance)}` : 'שולם'}</small></span>
                </span>
              </motion.button>
            ) : null}
          </div>

          <section className="y2-next" aria-label="הדבר הבא">
            <div className="y2-sec-h"><h2>הדבר הבא</h2><Link to="/messages" className="y2-link">כל המשימות</Link></div>
            <ul className="y2-next-row">
              <AnimatePresence initial={false} mode="popLayout">
                {q3.map((a, i) => {
                  const photo = a.kind === 'lead' ? null : unitPhoto(m.prop(a.booking?.property_id || a.c?.departure?.property_id));
                  return (
                    <motion.li key={a.id} layout className={cn('y2-nc', i === 0 && 'is-hot')}
                      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -12 }} transition={{ duration: 0.5, ease: EASE }}>
                      <div className="y2-nc-t">
                        <p className="y2-nc-k">{KICK[a.kind]}</p>
                        <p className="y2-nc-h">{a.title}</p>
                        <p className="y2-nc-s">{a.sub}</p>
                        <button type="button" className={cn('y2-go press', going === a.id && 'is-go')} onClick={() => go(a)}>
                          {going === a.id ? <><Check strokeWidth={2.2} />{a.doneText}</> : <>{BTN[a.kind]}<ArrowLeft strokeWidth={2} /></>}
                        </button>
                      </div>
                      <span className="y2-nc-img">
                        {photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : null}
                        {a.kind === 'clean' ? <Sparkles strokeWidth={1.75} className="y2-nc-ic" /> : <span className="y2-nc-face"><Face name={a.kind === 'lead' ? a.lead.full_name : (a.booking?.guest_name || '')} size={34} ring /></span>}
                      </span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
              {!q3.length ? <li className="y2-nc y2-nc--clear"><Check strokeWidth={2} />הכל בוצע להיום</li> : null}
            </ul>
          </section>
        </div>

        <aside className="y2-side" aria-label="החודש ומי מגיע">
          <div className="y2-me">
            <GuestAvatar name={user?.full_name || ''} src={user?.avatar_url} owner size={46} />
            <span className="y2-me-t"><b>{user?.organization_name || 'המתחם שלי'}</b><small>{user?.full_name || ''}</small></span>
            <Link to="/settings" className="y2-gb y2-gb--d press" aria-label="הגדרות המתחם"><MoreHorizontal strokeWidth={1.75} /></Link>
          </div>
          <div className="y2-stats">
            <div><b dir="ltr">{(m.data.properties || []).length}</b><span>יחידות</span></div>
            <div><b dir="ltr">{totalBookings}</b><span>הזמנות פעילות</span></div>
            <div><b dir="ltr">{m.leads.length}</b><span>פניות חדשות</span></div>
          </div>
          <MonthCal model={m} />
          <div className="y2-sec-h y2-sec-h--d"><h2>היום</h2><Link to="/bookings" className="y2-link">כל ההזמנות</Link></div>
          <ul className="y2-arr">
            {[...today.map((x) => ({ b: x.booking, dir: x.dir })), ...upcoming.map((b) => ({ b, dir: 'soon' }))].slice(0, 5).map(({ b, dir }, i) => {
              const p = m.prop(b.property_id); const ch = channelOf(b);
              return (
                <motion.li key={`${dir}-${b.id}`} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.4 + i * 0.06 }}>
                  <button type="button" className="y2-arr-row press" onClick={() => openBooking(b)}>
                    {unitPhoto(p) ? <span className="y2-arr-img"><img src={unitPhoto(p)} alt="" loading="lazy" decoding="async" /><Face name={b.guest_name || ''} size={26} ring /></span> : <span className="y2-arr-img y3-row-img--face"><Face name={b.guest_name || ''} size={46} /></span>}
                    <span className="y2-arr-t">
                      <em className={cn('y2-src', `y2-src--${ch.key}`)}>{dir === 'in' ? 'הגעה' : dir === 'out' ? 'יציאה' : 'בקרוב'} · {ch.key === 'direct' ? 'ישיר' : ch.label.replace('.com', '')}</em>
                      <b dir="auto">{guestLabel(b)}</b>
                      <small><bdi>{p?.name}</bdi>{dir === 'soon' ? ` · ${whenOf(b, m.day)}` : ''}</small>
                    </span>
                    <span className="y2-arr-time" dir="ltr">{dir === 'out' ? (p?.check_out_time || '11:00') : dir === 'in' ? (p?.check_in_time || '15:00') : formatDayHe(b.check_in_date, { weekday: false })}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </aside>

        <BookingsPanel ref={panelRef} model={m} list={list} selId={selId} setSelId={setSelId} onOpen={setSheet} delay={0.45}
          onWhatsApp={(b, t) => setComposer({ booking: b, template: t })} />
      </motion.div>

      <BookingSheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} booking={sheet} model={m}
        onWhatsApp={(b, t) => { setSheet(null); setComposer({ booking: b, template: t }); }} />
      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => { if (!o) setComposer(null); }}
        booking={composer?.booking}
        property={composer ? m.prop(composer.booking.property_id) : null}
        balance={composer ? m.balanceFor(composer.booking) : undefined}
        initialTemplate={composer?.template}
        orgId={orgId}
        orgName={user?.organization_name || ''}
        onSent={(key) => { if (composer) { m.markSent(composer.booking.id, composer.template); m.markSent(composer.booking.id, key); } }}
      />
    </div>
  );
}
