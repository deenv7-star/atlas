/**
 * "היום" · live window B (Deen picked it 02.11.2026, qa/ui-concepts-v3 + qa/live-window-b/PROGRESS.md).
 * Phones with a complex photo: the photo is the screen's background, blurred under the content with a
 * light navy layer; content floats on calm frosted cards. No photo (or desktop): fallback A, a navy
 * hero panel and white cards on the canvas.
 *   greeting → "N מגיעים היום" → ONE indigo card for the next thing (WhatsApp message ready, or a
 *   cleaning to close) → WhatsApp sheet → "הכל מוכן להיום". היום / מחר switch, a card per guest with
 *   their journey dots. New owner: 0/3 first steps.
 * All data is real (useStayData / buildDayBoard); nothing invented. iCal bookings have no guest names,
 * so they read "הזמנה מ-Booking.com". No guest photos, no weather, no bell, no payment link.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LifeBuoy } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { useMessageQueue } from '@/hooks/useMessageQueue';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { buildDayBoard } from '@/lib/stay/today';
import { todayISO, addDays, formatDayHe, firstName, nightsBetween } from '@/lib/stay/format';
import { isActiveBooking, checkOutOf, balanceOf, channelOf, isPaid } from '@/lib/stay/bookings';
import { templateByKey, logSubjectFor } from '@/lib/stay/whatsapp';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { UserMenu } from '@/components/app/shell/shared';
import { dayPart } from '@/components/app/atoms';
import { uploadedPhoto } from '@/lib/stay/unitPhoto';
import { DEMO_PEOPLE } from '@/lib/demoPeople';
import { readOrgSettings } from '@/lib/onboarding/orgSettings';
import { monthlyRevenue } from '@/components/today/RevenueChart';
import { heCount } from '@/lib/hebrewCount';
import { cn } from '@/lib/utils';
import LiveIcon, { useReplay } from '@/components/icons/live/LiveIcon';
import { checkInTime, checkOutTime } from '@/components/today/TodayBoard';
import './live-b.css';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/** The 7 real steps of a stay, each read from the account (messages sent, payments, status). */
function journeyOf(booking, sent, payments) {
  const has = (k) => sent.has(logSubjectFor(k));
  const st = String(booking.status || '').toUpperCase();
  const paid = (payments || []).some(isPaid);
  const steps = [
    true, // booked
    has('confirmation'),
    paid,
    has('arrival_eve'),
    st === 'CHECKED_IN' || st === 'CHECKED_OUT',
    st === 'CHECKED_OUT',
    has('thanks_review'),
  ];
  const done = steps.filter(Boolean).length;
  const current = steps.findIndex((x) => !x);
  return { steps, done, current };
}

function Dots({ journey }) {
  return (
    <span className="lwb-dots" role="img" aria-label={`מסע האורח: ${journey.done} מתוך 7`}>
      {journey.steps.map((ok, i) => <i key={i} className={cn(ok && 'd', i === journey.current && 'c')} />)}
    </span>
  );
}

function guestLabel(b) {
  if (b.guest_name) return b.guest_name;
  const ch = channelOf(b);
  if (ch.key === 'booking') return 'הזמנה מ\u2011Booking';
  if (ch.key === 'airbnb') return 'הזמנה מ\u2011Airbnb';
  return 'אורח';
}
function guestsOf(b) {
  const n = (Number(b.adults) || 0) + (Number(b.children) || 0) || Number(b.guests) || Number(b.guest_count) || 0;
  return n ? heCount(n, 'guest') : '';
}

/** A tile with the icon that tells the card's story; tapping the card replays it. */
function IconTile({ name, playKey, tone = 'soft' }) {
  return (
    <span className={cn('lwb-itile', tone === 'onIndigo' && 'lwb-itile--ind')} aria-hidden>
      <LiveIcon name={name} size={44} playKey={playKey} />
    </span>
  );
}

function StayCard({ i, icon, title, sub, time, status, journey, to, action }) {
  const [k, replay] = useReplay();
  const body = (
    <>
      <div className="lwb-row">
        <IconTile name={icon} playKey={k} />
        <div className="lwb-grow">
          <p className="lwb-t17 lwb-trunc">{title}</p>
          {sub ? <p className="lwb-t15 lwb-mute lwb-trunc">{sub}</p> : null}
        </div>
        {time ? <span className="lwb-time" dir="ltr">{time}</span> : null}
      </div>
      <div className="lwb-row lwb-foot">
        <p className="lwb-t15 lwb-grow lwb-trunc">{status}</p>
        {journey ? <><Dots journey={journey} /><span className="lwb-t13 lwb-mute" aria-hidden>{journey.done}/7</span></> : null}
        {action}
      </div>
    </>
  );
  const cls = 'lwb-card lwb-stay lwb-rise';
  return to
    ? <Link to={to} className={cn(cls, 'press')} style={{ '--i': i }} onPointerDown={replay}>{body}</Link>
    : <article className={cls} style={{ '--i': i }} onPointerDown={replay}>{body}</article>;
}

function Segmented({ value, onChange }) {
  const opts = [{ v: 'today', l: 'היום' }, { v: 'tomorrow', l: 'מחר' }];
  return (
    <div className="lwb-seg" role="tablist" aria-label="איזה יום">
      {opts.map((o) => (
        <button key={o.v} type="button" role="tab" aria-selected={value === o.v} className={cn(value === o.v && 'on')} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

function Ring({ value }) {
  const r = 21; const c = 2 * Math.PI * r; const v = Math.max(0, Math.min(100, value || 0));
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="lwb-ring" aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="#E6E8F2" strokeWidth="5" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="#3E2BF1" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} />
    </svg>
  );
}

export default function LiveWindowB({ user, orgId }) {
  const day = todayISO();
  const tomorrow = addDays(day, 1);
  const data = useStayData({ withExpenses: false });
  const { updateCleaning, createCleaning } = useStayMutations();
  const queue = useMessageQueue({ orgId });
  const { logout } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('today');
  const [composer, setComposer] = useState(null);
  const [sentNow, setSentNow] = useState(() => new Set());
  const [heroKey, replayHero] = useReplay();
  // phones: the floating help button would sit on the last card above the tab bar, so this screen hides it
  // (CSS on html[data-lwb-today]) and offers help in the page flow instead (lwb-help).
  useEffect(() => {
    const h = document.documentElement; h.setAttribute('data-lwb-today', '');
    return () => h.removeAttribute('data-lwb-today');
  }, []);

  const settings = readOrgSettings();
  const firstProp = (data.properties || [])[0];
  const ownPhoto = settings.cover_photo || uploadedPhoto(firstProp) || null;
  const photo = ownPhoto || (DEMO_PEOPLE ? '/demo/complex-pool.webp' : null);

  const boardOf = (d) => buildDayBoard({
    day: d, bookings: data.bookings, paymentsByBooking: data.paymentsByBooking, sentByBooking: data.sentByBooking,
    cleaningTasks: data.cleaningTasks, propertyById: data.propertyById,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const board = useMemo(() => boardOf(day), [day, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const boardT = useMemo(() => boardOf(tomorrow), [tomorrow, data.bookings, data.paymentsByBooking, data.sentByBooking, data.cleaningTasks, data.propertyById]);

  const prop = (id) => data.propertyById.get(id) || null;
  const sentOf = (b) => data.sentByBooking.get(b.id) || new Set();
  const paysOf = (b) => data.paymentsByBooking.get(b.id) || [];

  const messages = board.messages.filter((m) => !sentNow.has(`${m.booking.id}:${m.template}`));
  const openCleanings = board.cleanings.filter((c) => !c.done);
  const next = messages[0] ? { kind: 'message', ...messages[0] } : openCleanings[0] ? { kind: 'cleaning', c: openCleanings[0] } : null;
  const allReady = !next;
  const arrivals = board.arrivals.length;

  const kpi = useMemo(() => {
    const now = new Date();
    const months = monthlyRevenue(data.bookings, 2, now, data.paymentsByBooking);
    const y = now.getFullYear(); const m = now.getMonth();
    const first = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const nextM = `${m === 11 ? y + 1 : y}-${String(m === 11 ? 1 : m + 2).padStart(2, '0')}-01`;
    const days = new Date(y, m + 1, 0).getDate();
    const units = Math.max(1, (data.properties || []).length);
    let nights = 0;
    for (const b of data.bookings || []) {
      if (!isActiveBooking(b)) continue;
      const s = b.check_in_date > first ? b.check_in_date : first;
      const e = checkOutOf(b) < nextM ? checkOutOf(b) : nextM;
      if (e > s) nights += nightsBetween(s, e);
    }
    return { revenue: months[months.length - 1]?.value || 0, occupancy: Math.min(100, Math.round((nights / (units * days)) * 100)), month: MONTHS[m] };
  }, [data.bookings, data.properties, data.paymentsByBooking]);

  const activeCount = (data.bookings || []).filter(isActiveBooking).length;
  const steps = [
    { id: 'booking', icon: 'calendar', title: 'חברו את Booking או Airbnb', line: 'ההזמנות ייכנסו ליומן לבד', mins: '2 דקות', to: '/setup?step=booking', done: (queue.syncs || []).length > 0 },
    { id: 'units', icon: 'key', title: 'הוסיפו את היחידות', line: 'שם ומספר אורחים לכל יחידה', mins: 'דקה', to: '/setup?step=units', done: (data.properties || []).length > 0 },
    { id: 'photo', icon: 'home', title: 'תמונה של המתחם', line: 'היא תהיה הרקע של המסך הזה', mins: 'דקה', to: '/setup?step=units', done: !!ownPhoto },
  ];
  const stepsDone = steps.filter((s) => s.done).length;
  const newOwner = !data.isLoading && !data.isError && activeCount === 0 && stepsDone < 3;

  const name = firstName(user?.full_name || '') || '';
  const greeting = newOwner ? `ברוכים הבאים${name ? `, ${name}` : ''}` : `${dayPart().greeting}${name ? `, ${name}` : ''}`;
  const glass = !!photo && !newOwner;

  const onLogout = async () => { qc.clear(); await logout(false); window.location.href = '/login'; };

  const openMessage = (m) => setComposer({ booking: m.booking, template: m.template, balance: m.balance });
  const markCleaned = async (c) => {
    try {
      if (c.task) await updateCleaning.mutateAsync({ id: c.task.id, data: { status: 'DONE' } });
      else {
        await createCleaning.mutateAsync({
          ...(orgId ? { org_id: orgId } : {}), title: `ניקיון ${c.unit}`, property_id: c.departure.property_id || null,
          booking_id: c.departure.id, scheduled_date: day, status: 'DONE', created_at: new Date().toISOString(),
        });
      }
      replayHero();
      atlasToastApi.success(`${c.unit} מוכנה לאורחים הבאים`);
    } catch { atlasToastApi.error('לא הצלחנו לעדכן את הניקיון'); }
  };

  /* ── cards for the chosen day ── */
  const cardsFor = (b, d) => {
    const out = [];
    for (const { booking, unit } of b.arrivals) {
      const st = String(booking.status || '').toUpperCase();
      out.push({
        key: `in-${booking.id}`, icon: 'key', title: guestLabel(booking), sub: [unit, guestsOf(booking)].filter(Boolean).join(' · '),
        time: checkInTime(booking, prop(booking.property_id)),
        status: st === 'CHECKED_IN' ? 'נכנסו' : d === day ? 'מגיעים היום' : 'מגיעים מחר',
        journey: journeyOf(booking, sentOf(booking), paysOf(booking)), to: `/booking/${booking.id}`,
      });
    }
    for (const { booking, unit } of b.departures) {
      const st = String(booking.status || '').toUpperCase();
      out.push({
        key: `out-${booking.id}`, icon: 'door', title: guestLabel(booking), sub: [unit, guestsOf(booking)].filter(Boolean).join(' · '),
        time: checkOutTime(booking, prop(booking.property_id)),
        status: st === 'CHECKED_OUT' ? 'יצאו' : d === day ? 'יוצאים היום' : 'יוצאים מחר',
        journey: journeyOf(booking, sentOf(booking), paysOf(booking)), to: `/booking/${booking.id}`,
      });
    }
    for (const c of b.cleanings) {
      out.push({
        key: `cl-${c.key}`, icon: c.done ? 'check' : 'broom', title: `ניקיון ${c.unit}`,
        sub: c.sameDayTurnover ? `לפני הכניסה של ${checkInTime(c.nextArrival, prop(c.departure.property_id))}` : 'אחרי היציאה',
        time: '', status: c.done ? 'הניקיון בוצע' : d === day ? 'מחכה לסימון' : 'נקבע למחר', to: '/cleaning',
      });
    }
    return out;
  };
  const cards = cardsFor(tab === 'today' ? board : boardT, tab === 'today' ? day : tomorrow);

  /* ── top + hero ── */
  const top = (
    <header className="lwb-top">
      <UserMenu user={user} onLogout={onLogout} align="start">
        <button type="button" className="lwb-me press" aria-label="החשבון שלי">{(name || user?.email || 'א').trim().charAt(0)}</button>
      </UserMenu>
      <div className="lwb-grow">
        <p className="lwb-hello">{greeting}</p>
        <p className="lwb-date">{formatDayHe(day)}</p>
      </div>
    </header>
  );

  const arrivalTimes = board.arrivals.map(({ booking }) => checkInTime(booking, prop(booking.property_id)));
  const uniqTimes = [...new Set(arrivalTimes)].sort().slice(0, 3);
  const hero = allReady ? (
    <section className="lwb-hero lwb-done" aria-live="polite">
      <span className="lwb-donec"><LiveIcon name="check" size={56} playKey={heroKey} /></span>
      <h1 className="lwb-h30">הכל מוכן להיום</h1>
      <p className="lwb-t17 lwb-soft">{arrivals === 1 ? 'הזמנה אחת מגיעה היום. אתם פנויים.' : arrivals > 1 ? `${arrivals} הזמנות מגיעות היום. אתם פנויים.` : 'אין היום כניסות או יציאות.'}</p>
    </section>
  ) : (
    <section className="lwb-hero">
      <h1 className="sr-only">היום</h1>
      <div className="lwb-arrive">
        <span className="lwb-big" dir="ltr">{arrivals}</span>
        <span className="lwb-arrive-t">
          <span className="lwb-h22">מגיעים היום</span>
          <span className="lwb-t15 lwb-soft" dir="ltr">{uniqTimes.length ? uniqTimes.join(' · ') : '\u00A0'}</span>
        </span>
      </div>
    </section>
  );

  const nextCard = next ? (
    next.kind === 'message' ? (
      <article className="lwb-card lwb-next lwb-rise" style={{ '--i': 1 }}>
        <div className="lwb-row">
          <IconTile name="whatsapp" tone="onIndigo" />
          <div className="lwb-grow">
            <p className="lwb-t13 lwb-on70">הבא בתור</p>
            <p className="lwb-t17">{templateByKey(next.template).label}</p>
          </div>
        </div>
        <p className="lwb-t15 lwb-on85 lwb-mt8">{guestLabel(next.booking)} · {next.unit}. ההודעה מוכנה, נשאר לשלוח.</p>
        <button type="button" className="lwb-btn lwb-btn-w press" onClick={() => openMessage(next)}>פתחו את ההודעה</button>
        {messages.length > 1 ? <p className="lwb-t13 lwb-on70 lwb-mt8 lwb-center">ועוד {messages.length - 1} {messages.length - 1 === 1 ? 'הודעה' : 'הודעות'} אחריה</p> : null}
      </article>
    ) : (
      <article className="lwb-card lwb-next lwb-rise" style={{ '--i': 1 }}>
        <div className="lwb-row">
          <IconTile name="broom" tone="onIndigo" />
          <div className="lwb-grow">
            <p className="lwb-t13 lwb-on70">הבא בתור</p>
            <p className="lwb-t17">ניקיון {next.c.unit}</p>
          </div>
        </div>
        <p className="lwb-t15 lwb-on85 lwb-mt8">{next.c.sameDayTurnover ? `אורחים חדשים נכנסים ב-${checkInTime(next.c.nextArrival, prop(next.c.departure.property_id))}.` : 'אחרי היציאה של היום.'}</p>
        <button type="button" className="lwb-btn lwb-btn-w press" onClick={() => markCleaned(next.c)}>סמנו שהניקיון בוצע</button>
      </article>
    )
  ) : null;

  const helpRow = (
    <button type="button" className="lwb-help press" onClick={() => window.dispatchEvent(new CustomEvent('atlas:open-support'))}>
      <LifeBuoy size={18} strokeWidth={1.75} aria-hidden />צריכים עזרה?
    </button>
  );

  /* ── new owner ── */
  if (newOwner) {
    const firstOpen = steps.find((s) => !s.done);
    return (
      <div className="lwb" data-glass="0" dir="rtl">
        <div className="lwb-in">
          <div className="lwb-head">
          {top}
          <section className="lwb-hero">
            <h1 className="lwb-h30">כאן תראו את היום שלכם</h1>
            <p className="lwb-t17 lwb-soft lwb-mt8">מי מגיע, מה מוכן ומה נשאר.</p>
            <div className="lwb-row lwb-mt16">
              <span className="lwb-count" dir="ltr">{stepsDone}<small>/3</small></span>
              <span className="lwb-t15 lwb-soft">צעדים · כ-5 דקות בסך הכל</span>
            </div>
          </section>
          </div>
          <div className="lwb-sheet lwb-sheet--start">
            <div className="lwb-shh"><h2 className="lwb-h22">מתחילים</h2><span className="lwb-t13 lwb-mute">תמיד אפשר לשנות</span></div>
            <div className="lwb-stack">
              {steps.map((s, idx) => (s === firstOpen ? (
                <article key={s.id} className="lwb-card lwb-next lwb-rise" style={{ '--i': idx }}>
                  <div className="lwb-row">
                    <IconTile name={s.icon} tone="onIndigo" />
                    <div className="lwb-grow"><p className="lwb-t13 lwb-on70">צעד {idx + 1} · {s.mins}</p><p className="lwb-t17">{s.title}</p></div>
                  </div>
                  <p className="lwb-t15 lwb-on85 lwb-mt8">{s.line}</p>
                  <Link to={s.to} className="lwb-btn lwb-btn-w press">{s.id === 'booking' ? 'חברו יומן' : s.id === 'units' ? 'הוסיפו יחידות' : 'העלו תמונה'}</Link>
                </article>
              ) : (
                <Link key={s.id} to={s.to} className="lwb-card lwb-step lwb-rise press" style={{ '--i': idx }}>
                  <IconTile name={s.done ? 'check' : s.icon} />
                  <span className="lwb-grow"><span className="lwb-t17 lwb-blk">{s.title}</span><span className="lwb-t15 lwb-mute lwb-blk">{s.done ? 'בוצע' : s.line}</span></span>
                  <ChevronLeft className="h-5 w-5 shrink-0 text-[#8A90AB]" strokeWidth={1.75} aria-hidden />
                </Link>
              )))}
            </div>
            {helpRow}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lwb" data-glass={glass ? '1' : '0'} dir="rtl" style={glass ? { '--lwb-photo': `url(${photo})` } : undefined}>
      {glass ? (
        <div className="lwb-bg" aria-hidden>
          <img className="lwb-ph" src={photo} alt="" decoding="async" draggable={false} />
          <div className="lwb-blur" />
          <div className="lwb-navy" />
        </div>
      ) : null}
      <div className="lwb-in">
        <div className="lwb-head">
        {top}
        {data.isLoading ? (
          <section className="lwb-hero" role="status" aria-busy="true" aria-label="טוען"><span className="lwb-skel" /></section>
        ) : data.isError ? (
          <section className="lwb-hero">
            <h1 className="lwb-h22">לא הצלחנו לטעון את היום</h1>
            <p className="lwb-t15 lwb-soft lwb-mt8">בדקו את החיבור ונסו שוב.</p>
            <button type="button" className="lwb-btn lwb-btn-w press lwb-w-auto" onClick={() => data.refetch?.()}>טענו שוב</button>
          </section>
        ) : hero}
        </div>

        {!data.isLoading && !data.isError ? (
          <div className="lwb-sheet">
            <div className="lwb-shh">
              <h2 className="lwb-h22">{tab === 'today' ? 'היום במתחם' : 'מחר במתחם'}</h2>
              <Segmented value={tab} onChange={setTab} />
            </div>
            <div className="lwb-cols">
              <div className="lwb-stack">
                {tab === 'today' ? nextCard : null}
                {cards.length ? cards.map((c, idx) => <StayCard key={c.key} i={idx + 2} {...c} />) : (
                  <div className="lwb-card lwb-empty lwb-rise" style={{ '--i': 2 }}>
                    <p className="lwb-t17">{tab === 'today' ? 'אין היום כניסות או יציאות' : 'אין מחר כניסות או יציאות'}</p>
                    <Link to="/calendar" className="lwb-link press">ליומן<ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden /></Link>
                  </div>
                )}
              </div>
              <div className="lwb-stats">
                <Link to="/payments" className="lwb-card lwb-stat press" aria-label={`תפוסה ${kpi.occupancy}% החודש, למסך הכסף`}>
                  <span><span className="lwb-t13 lwb-mute lwb-blk">תפוסה</span><span className="lwb-num" dir="ltr">{kpi.occupancy}<small>%</small></span></span>
                  <Ring value={kpi.occupancy} />
                </Link>
                <Link to="/payments" className="lwb-card lwb-stat press" aria-label={`נכנס ב${kpi.month}: ${Math.round(kpi.revenue)} שקלים, למסך הכסף`}>
                  <span><span className="lwb-t13 lwb-mute lwb-blk">נכנס ב{kpi.month}</span><span className="lwb-num" dir="ltr"><small>₪</small>{Math.round(kpi.revenue).toLocaleString('en-US')}</span></span>
                  <LiveIcon name="coin" size={40} />
                </Link>
              </div>
            </div>
            {helpRow}
          </div>
        ) : null}
      </div>

      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => { if (!o) setComposer(null); }}
        booking={composer?.booking}
        property={composer ? prop(composer.booking.property_id) : null}
        balance={composer?.balance || (composer ? balanceOf(composer.booking, paysOf(composer.booking), day) : undefined)}
        initialTemplate={composer?.template}
        orgId={orgId}
        orgName={user?.organization_name || ''}
        onSent={(key) => {
          if (!composer) return;
          setSentNow((s) => new Set(s).add(`${composer.booking.id}:${composer.template}`).add(`${composer.booking.id}:${key}`));
          replayHero();
        }}
      />
    </div>
  );
}
