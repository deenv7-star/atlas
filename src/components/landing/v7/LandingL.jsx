/**
 * Landing v7 L "תנסו בעצמכם" (playable product). Giant type, then a live mini-ATLAS on a solid
 * indigo stage that the visitor plays with: tapping "הזמנה חדשה נכנסת" drops a booking into the
 * calendar, sends the guest a WhatsApp message, flips the deposit to "שולם" and updates the week,
 * with spring motion and a small burst of confetti. Real guest portraits float around the stage.
 * Then a host's day told in big colour sections (indigo, sky, lilac, mint) with photos and product UI,
 * pricing, FAQ and a bold indigo CTA.
 *
 * Every booking, name and amount is example data, labelled on the page. No testimonials, logos or
 * customer counts. Photos: free-licence Pexels / Unsplash, cool-graded.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check, CheckCheck, ChevronDown, CalendarDays, Wallet, FileText, Bell, Plus, RotateCcw, RefreshCw,
  LogIn, Sun, Coffee, Moon,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, prefersReducedMotion, fmt } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer, SignupButton } from '../v5/LandingV5';
import { V7Header, PhotoCredits } from './shared7';
import { KL, FACES, Face, KlPricing, KlFinal } from './shared7kl';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './landing-v7kl.css';
import './landing-v7l.css';

const NAV = [['#play', 'נסו בעצמכם'], ['#day', 'יום של מארחת'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- demo data (example) ---------------- */
const DAYS = [['א׳', 18], ['ב׳', 19], ['ג׳', 20], ['ד׳', 21], ['ה׳', 22], ['ו׳', 23], ['ש׳', 24]];
const UNITS = ['האלון', 'הזית', 'התאנה', 'הגפן'];
/** [unit, start, nights, channel, guest] */
const BASE = [
  [0, 0, 2, 'airbnb', 'מיכל ר.'], [0, 4, 3, 'direct', 'אבי כ.'],
  [1, 0, 3, 'booking', 'Jonas M.'],
  [2, 1, 2, 'direct', 'דנה א.'],
  [3, 0, 3, 'booking', 'Marc D.'], [3, 5, 2, 'direct', 'גל פ.'],
];
const BK = [
  { face: 'noa', u: 1, s: 4, n: 2, ch: 'airbnb', total: 1500, dep: 450, depLabel: 'מקדמה 30%', wa: 'היי נועה, ההזמנה שלכם לבקתת הזית אושרה! נתראה ביום ה׳ מ-15:00.' },
  { face: 'tom', u: 2, s: 4, n: 3, ch: 'booking', total: 2100, dep: 2100, depLabel: 'שולם דרך Booking.com', wa: 'היי תום, תודה שהזמנתם את וילה התאנה. כל הפרטים להגעה יגיעו יום לפני.' },
  { face: 'shir', u: 0, s: 2, n: 2, ch: 'direct', total: 1300, dep: 390, depLabel: 'מקדמה 30%', wa: 'היי שירן, איזה כיף! ההזמנה הישירה שלכם לסוויטת האלון אושרה.' },
];
const CH_LABEL = { airbnb: 'Airbnb', booking: 'Booking.com', direct: 'הזמנה ישירה' };
const BASE_NIGHTS = 15;
const CAP = 28;
const BASE_REV = 6400;
const ORBIT = ['noa', 'maya', 'tom', 'ben', 'shir', 'yossi', 'adam', 'eli'];
const CONFETTI = [
  [-70, -60, 'ind'], [-40, -88, 'sky'], [-6, -96, 'mint'], [30, -84, 'lilac'], [64, -58, 'ind'], [86, -24, 'sky'],
  [-92, -20, 'mint'], [-56, -34, 'lilac'], [48, -30, 'mint'], [10, -60, 'ind'], [-24, -54, 'sky'], [76, -78, 'lilac'],
];

/* ---------------- the playable mini-ATLAS ---------------- */
function usePlay() {
  const [n, setN] = useState(0); // bookings that came in
  const [ph, setPh] = useState(5); // phase of the latest one: 1 toast, 2 bar, 3 typing + pending, 4 sent, 5 paid
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const busy = n > 0 && ph < 5;
  const play = useCallback(() => {
    if (busy) return;
    if (n >= BK.length) { setN(0); setPh(5); return; }
    setN(n + 1);
    if (prefersReducedMotion()) { setPh(5); return; }
    setPh(1);
    timers.current = [[2, 650], [3, 1250], [4, 2000], [5, 2700]].map(([p, t]) => setTimeout(() => setPh(p), t));
  }, [busy, n]);
  return { n, ph, busy, play };
}

function Stat({ label, value }) {
  return (
    <span className="ll-stat">
      <small>{label}</small>
      <b className="num" dir="ltr" key={value}>{value}</b>
    </span>
  );
}

function Demo() {
  const { n, ph, busy, play } = usePlay();
  const cur = n > 0 ? BK[n - 1] : null;
  const done = n - (n > 0 && ph < 5 ? 1 : 0);
  const nights = BASE_NIGHTS + BK.slice(0, done).reduce((a, b) => a + b.n, 0);
  const rev = BASE_REV + BK.slice(0, done).reduce((a, b) => a + b.total, 0);
  const bars = [
    ...BASE.map((b) => ({ u: b[0], s: b[1], n: b[2], ch: b[3], g: b[4], key: b[4] })),
    ...BK.slice(0, n).map((b, i) => ({
      u: b.u, s: b.s, n: b.n, ch: b.ch, g: FACES[b.face].n, key: b.face,
      hidden: i === n - 1 && ph < 2, fresh: i === n - 1 && ph < 5,
    })),
  ];
  const pays = BK.slice(0, n).map((b, i) => ({ ...b, paid: i < n - 1 || ph >= 5, show: i < n - 1 || ph >= 3 })).filter((p) => p.show).reverse();
  const waShow = cur && ph >= 3;
  const label = n >= BK.length && !busy ? 'להתחיל מחדש' : 'הזמנה חדשה נכנסת';
  const say = cur && ph >= 5 ? `הזמנה חדשה מ${FACES[cur.face].n} נכנסה ללוח, הודעת וואטסאפ נשלחה, והתשלום סומן כשולם.` : '';

  return (
    <div className={`ll-demo${busy ? ' is-busy' : ''}${n === 0 ? ' is-fresh' : ''}`}>
      <div className="ll-orbit" aria-hidden="true">
        {ORBIT.map((k, i) => {
          const bi = BK.findIndex((b) => b.face === k);
          const on = bi > -1 && (bi < done);
          const now = bi > -1 && bi === n - 1 && ph >= 1;
          return (
            <span key={k} className={`ll-o is-${i + 1}${on ? ' is-on' : ''}${now ? ' is-now' : ''}`} style={{ '--i': i }}>
              <Face f={FACES[k]} size={64} lazy={false} />
              {bi > -1 && <em><Check size={12} strokeWidth={3} />הזמינו</em>}
            </span>
          );
        })}
      </div>

      <div className="ll-ctrl">
        <button type="button" className="ll-play" onClick={play} aria-busy={busy} disabled={busy}>
          <span className="ll-play-ic" aria-hidden="true">{n >= BK.length && !busy ? <RotateCcw size={20} strokeWidth={2.4} /> : <Plus size={22} strokeWidth={2.6} />}</span>
          {label}
        </button>
        <p className="ll-hint">{n === 0 ? 'לחצו ותראו מה קורה כשמגיעה הזמנה' : `הזמנה ${Math.min(n, BK.length)} מתוך ${BK.length} · נתוני דוגמה`}</p>
        <p className="ll-sr" aria-live="polite">{say}</p>
      </div>

      <div className="ll-app" aria-hidden="true">
        <div className="ll-app-top">
          <span className="ll-logo">ATLAS<i /></span>
          <span className="ll-app-title"><CalendarDays size={16} strokeWidth={2} />לוח שנה · השבוע</span>
          <span className="ll-sync"><RefreshCw size={12} strokeWidth={2.4} />מסונכרן</span>
          <span className="ll-stats">
            <Stat label="תפוסה" value={`${Math.round((nights / CAP) * 100)}%`} />
            <Stat label="הכנסות השבוע" value={`₪${fmt(rev)}`} />
          </span>
        </div>

        <div className="ll-app-body">
          <div className="ll-cal">
            <div className="ll-cal-head">
              <span />
              <span className="ll-days">{DAYS.map(([d, dn], i) => <span key={dn} className={i === 1 ? 'is-today' : ''}><small>{d}</small><b className="num">{dn}</b></span>)}</span>
            </div>
            {UNITS.map((u, ui) => (
              <div key={u} className="ll-cal-row">
                <span className="ll-unit">{u}</span>
                <span className="ll-lane">
                  {bars.filter((b) => b.u === ui).map((b) => (
                    <span key={b.key} className={`ll-bar is-${b.ch}${b.hidden ? ' is-hidden' : ''}${b.fresh ? ' is-fresh' : ''}`} style={{ '--s': b.s, '--n': b.n }}>
                      {b.ch !== 'direct' && <Mark ch={b.ch} size={11} />}<b>{b.g}</b>
                    </span>
                  ))}
                </span>
              </div>
            ))}
            <p className="ll-legend">
              <span><i className="is-airbnb" />Airbnb</span>
              <span><i className="is-booking" />Booking.com</span>
              <span><i className="is-direct" />ישיר</span>
              <span className="ll-legend-end">4 יחידות · מסונכרן לפני דקה</span>
            </p>
          </div>

          <div className="ll-side">
            <div className="ll-card ll-wa">
              <p className="ll-card-h"><Mark ch="whatsapp" size={15} />וואטסאפ לאורח</p>
              {waShow ? (
                <div className="ll-wa-body" key={cur.face}>
                  <span className="ll-wa-who"><Face f={FACES[cur.face]} size={28} lazy={false} />{FACES[cur.face].n}</span>
                  {ph === 3 ? (
                    <span className="ll-typing"><i /><i /><i /></span>
                  ) : (
                    <p className="ll-bubble">{cur.wa}<span className={`ll-ticks${ph >= 5 ? ' is-read' : ''}`}><CheckCheck size={14} strokeWidth={2.4} /></span></p>
                  )}
                  <small className="ll-auto">נשלח אוטומטית, בשמכם</small>
                </div>
              ) : (
                <p className="ll-empty">ההודעה לאורח תצא מכאן, לבד.</p>
              )}
            </div>
            <div className="ll-card ll-pay">
              <p className="ll-card-h"><Wallet size={15} strokeWidth={2} />תשלומים</p>
              <ul>
                {pays.map((p) => (
                  <li key={p.face} className={p.paid ? 'is-paid' : ''}>
                    <Face f={FACES[p.face]} size={28} lazy={false} />
                    <span className="ll-pay-t"><b>{FACES[p.face].n}</b><small>{p.depLabel}</small></span>
                    <span className="ll-pay-amt num" dir="ltr">₪{fmt(p.dep)}</span>
                    <span className="ll-flip"><span className="ll-flip-in"><i className="is-wait">ממתין</i><i className="is-ok"><Check size={12} strokeWidth={3} />שולם</i></span></span>
                    {p.paid && p.face === cur?.face && ph >= 5 && (
                      <span className="ll-confetti" key={`c${n}`}>{CONFETTI.map(([x, y, c], i) => <i key={i} className={`is-${c}`} style={{ '--x': `${x}px`, '--y': `${y}px`, '--r': `${i * 47}deg` }} />)}</span>
                    )}
                  </li>
                ))}
                <li className="is-paid is-base">
                  <span className="ll-pay-ic"><Mark ch="booking" size={16} /></span>
                  <span className="ll-pay-t"><b>Jonas M.</b><small>Booking.com</small></span>
                  <span className="ll-pay-amt num" dir="ltr">₪2,140</span>
                  <span className="ll-flip"><span className="ll-flip-in"><i className="is-wait">ממתין</i><i className="is-ok"><Check size={12} strokeWidth={3} />שולם</i></span></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {cur && ph >= 1 && ph <= 3 && (
          <div className="ll-toast" key={`t${n}`}>
            <span className="ll-toast-lead"><Face f={FACES[cur.face]} size={40} lazy={false} /><span className="ll-toast-ch"><Mark ch={cur.ch} size={12} /></span></span>
            <span className="ll-toast-t"><b>הזמנה חדשה · {CH_LABEL[cur.ch]}</b><small>{FACES[cur.face].n} · {cur.n} לילות · {UNITS[cur.u]} · <span className="num" dir="ltr">₪{fmt(cur.total)}</span></small></span>
            <Bell size={18} strokeWidth={2.2} className="ll-toast-bell" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- hero ---------------- */
function Hero() {
  return (
    <section className="ll-hero" aria-labelledby="hero-title">
      <div className="l5-wrap ll-hero-in">
        <h1 id="hero-title" className="ll-h1">
          <span className="l5-h1-line" style={{ '--i': 0 }}>הזמנה נכנסה.</span>
          <span className="l5-h1-line is-ind" style={{ '--i': 1 }}>השאר קורה לבד.</span>
        </h1>
        <p className="ll-lead l5-in" style={{ '--i': 2 }}>לוח, וואטסאפ לאורח ותשלום, בשנייה אחת. אל תאמינו לנו, תלחצו.</p>
        <div className="ll-cta l5-in" style={{ '--i': 3 }}>
          <SignupButton className="is-lg" />
          <a href="#day" className="ll-link">יום של מארחת<ChevronDown size={18} strokeWidth={2} aria-hidden="true" /></a>
        </div>
      </div>
      <div id="play" className="l7-inset ll-stage-wrap l5-in" style={{ '--i': 4 }}>
        <div className="ll-stage">
          <Demo />
        </div>
      </div>
    </section>
  );
}

/* ---------------- a host's day ---------------- */
function NightList() {
  return (
    <ul className="ll-ui ll-ui-list" aria-hidden="true">
      <li><span className="ll-ui-ic"><Mark ch="airbnb" size={15} /></span><span><b>מיכל ר. · 2 לילות</b><small>נכנסה ב-02:14 · האלון</small></span></li>
      <li><span className="ll-ui-ic"><Mark ch="booking" size={15} /></span><span><b>Jonas M. · 3 לילות</b><small>נכנסה ב-05:40 · הזית</small></span></li>
      <li className="is-ok"><span className="ll-ui-ic is-ok"><Check size={15} strokeWidth={3} /></span><span><b>הכל בלוח, בלי כפילויות</b><small>מסונכרן לפני דקה</small></span></li>
    </ul>
  );
}

function PayCard() {
  return (
    <div className="ll-ui ll-ui-pay" aria-hidden="true">
      <p className="ll-ui-k">התקבל היום</p>
      <p className="ll-ui-big num" dir="ltr">₪3,290</p>
      <ul>
        <li><Face f={FACES.noa} size={28} /><span>נועה ל. · מקדמה</span><i className="is-ok">שולם</i></li>
        <li><Face f={FACES.ben} size={28} /><span>בן ר. · יתרה</span><i className="is-ok">שולם</i></li>
        <li><Face f={FACES.eli} size={28} /><span>אלי מ. · תזכורת נשלחה</span><i>ממתין</i></li>
      </ul>
    </div>
  );
}

function WaCard() {
  return (
    <div className="ll-ui ll-ui-wa" aria-hidden="true">
      <p className="ll-ui-who"><Face f={FACES.maya} size={32} /><span><b>מאיה כ.</b><small>סוויטת האלון · מגיעה היום</small></span></p>
      <p className="ll-bubble">היי מאיה, מחכים לכם היום מ-15:00. הקוד לדלת: 4821, והחניה מאחורי הבית.<span className="ll-ticks is-read"><CheckCheck size={14} strokeWidth={2.4} /></span></p>
      <p className="ll-bubble is-in">מושלם, תודה! נהיה שם ב-16:00</p>
    </div>
  );
}

function ReportCard() {
  return (
    <div className="ll-ui ll-ui-rep" aria-hidden="true">
      <p className="ll-ui-k">דוח אוקטובר</p>
      <p className="ll-ui-big num" dir="ltr">₪48,250</p>
      <div className="ll-ui-bars">
        {[['Airbnb', 58, 'airbnb'], ['Booking', 76, 'booking'], ['ישיר', 100, 'direct']].map(([l, h, c]) => (
          <span key={l} className={`is-${c}`} style={{ '--h': `${h}%` }}><i /><small>{l}</small></span>
        ))}
      </div>
      <p className="ll-ui-file"><FileText size={15} strokeWidth={2} />PDF לרואה החשבון · מוכן</p>
    </div>
  );
}

const DAY = [
  { t: '08:00', I: Coffee, tone: 'ind', title: 'בוקר. ההזמנות של הלילה כבר בלוח.', text: 'Airbnb, Booking.com וההזמנות הישירות נכנסו לבד, על אותו לוח. מתחילים את היום עם קפה, לא עם אקסל.', img: 'coffee', pos: '45% 45%', ui: NightList },
  { t: '11:30', I: Sun, tone: 'sky', title: 'צהריים. המקדמות נכנסו לבד.', text: 'רואים מה שולם ומה ממתין, ו-ATLAS שולחת לאורחים תזכורת ליתרה בזמן. בלי לרדוף אחרי אף אחד.', img: 'tablet', pos: '40% 40%', ui: PayCard },
  { t: '15:00', I: LogIn, tone: 'lilac', title: 'צ׳ק-אין. האורחים כבר יודעים הכל.', text: 'אישור, הוראות הגעה וקוד לדלת יצאו בוואטסאפ, בשמכם. אתם רק אומרים שלום.', img: 'welcome', pos: '60% 40%', ui: WaCard },
  { t: '21:00', I: Moon, tone: 'mint', title: 'ערב. הדוח מוכן, ואתם בחוץ.', text: 'הכנסות לפי ערוץ ויחידה, תפוסה ומחיר ממוצע ללילה. PDF או CSV לרואה החשבון, בלחיצה.', img: 'hammock', pos: '50% 45%', ui: ReportCard },
];

function Story() {
  return (
    <section id="day" className="ll-day" aria-labelledby="day-title">
      <div className="l5-wrap">
        <div className="kl-head is-center" data-reveal>
          <h2 id="day-title" className="kl-h2">יום אחד של מארחת. <span className="is-ind">ATLAS עובדת כל היום.</span></h2>
          <p className="kl-txt">ככה נראה יום רגיל במתחם, כשהמערכת עושה את העבודה השחורה.</p>
        </div>
      </div>
      <ol className="ll-chapters">
        {DAY.map((d, i) => {
          const UI = d.ui;
          const I = d.I;
          return (
            <li key={d.t} className={`ll-ch is-${d.tone}${i % 2 ? ' is-flip' : ''}`}>
              <div className="l7-inset">
                <div className="ll-ch-box">
                  <div className="ll-ch-copy" data-reveal>
                    <p className="ll-ch-time"><I size={22} strokeWidth={2} aria-hidden="true" /><span className="num">{d.t}</span></p>
                    <h3 className="ll-ch-h">{d.title}</h3>
                    <p className="ll-ch-txt">{d.text}</p>
                  </div>
                  <div className="ll-ch-media" data-reveal style={{ '--d': '120ms' }}>
                    <img src={`${KL}/${d.img}.webp`} alt="" width="1100" height="733" loading="lazy" decoding="async" style={{ objectPosition: d.pos }} />
                    <div className="ll-ch-ui"><UI /></div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="kl-cap" data-reveal>הנתונים במסכים הם דוגמה.</p>
    </section>
  );
}

export default function LandingL() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 kl ll" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Story />
        <KlPricing />
        <Faq limit={5} />
        <KlFinal title={<>הזמנה הבאה?<br />שתיכנס לבד.</>} />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".ll-hero" />
    </div>
  );
}
