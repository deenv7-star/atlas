/**
 * Landing v9 S "יום במתחם" (a day at the complex).
 *
 * Hero: scroll is the clock. A sticky stage shows one day at a vacation complex, from 08:12 to 19:40:
 * a big ticking time, the moment's photo (a host, guests, the cleaning team, a family arriving, the
 * evening tub), the real ATLAS phone screen of that moment (app v8 C mobile: Today, the WhatsApp
 * thread, the cleaning list, the booking, payments) and the notification that came with it. The sky
 * colour of the stage moves through the day (cool tints only). A timeline rail at the bottom shows
 * where you are and jumps to any moment. Then the same day on the desktop, pricing, FAQ and a CTA.
 *
 * Reduced motion: no scroll-driving; the rail becomes plain buttons.
 * Real screens in demo mode; every name, booking and amount is example data and labelled so.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, MessageCircle, Wallet, Link2, Home, Sparkles } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import {
  UI, PH, Header9, SignupBtn, CtaNote, Browser, Phone, Notif, Pricing9, Faq9, Footer9, WaLink, useStickyProgress, useReveal9, reduced,
} from './shared9';
import '../v5/landing-v5.css';
import './shared9.css';
import './landing-v9s.css';

const NAV = [['#day', 'יום במתחם'], ['#desk', 'המערכת'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

const MOMENTS = [
  {
    t: 8 * 60 + 12, label: 'בוקר', photo: 'n-host', alt: 'מארחת מחייכת מול הטלפון', screen: 'm-today8', bg: '#e6f0ff',
    title: 'הזמנה חדשה נכנסה.', line: 'היא כבר בלוח, והתאריכים נחסמו גם ב-Airbnb.',
    n: { ch: 'booking', title: 'הזמנה חדשה מ-Booking.com', sub: 'שירן ג. · הזית · 2 לילות' },
  },
  {
    t: 9 * 60, label: 'אישור', photo: 'n-selfie', alt: 'אורחת מצטלמת בחופשה', screen: 'm-thread', bg: '#e5f4fb',
    title: 'האורחים קיבלו אישור בוואטסאפ.', line: 'עם הוראות הגעה. אף אחד לא הקליד כלום.',
    n: { ch: 'whatsapp', title: 'אישור נשלח בוואטסאפ', sub: 'משפחת לוי · הזית · 16-19 באוק׳' },
  },
  {
    t: 11 * 60, label: 'ניקיון', photo: 'm-clean', alt: 'צוות מחליף מצעים בחדר מואר', screen: 'm-today2', bg: '#e6f6ef',
    title: 'הצוות יודע מה לנקות.', line: 'רשימת הניקיון של היום מוכנה לפי הכניסות והיציאות.',
    n: { ch: 'direct', title: 'ניקיון לפני כניסה', sub: 'הגפן · מוכן עד 14:00' },
  },
  {
    t: 15 * 60, label: 'כניסה', photo: 'n-family', alt: 'משפחה עם ילדים מגיעה לחופשה', screen: 'm-detail', bg: '#ecefff',
    title: 'האורחים נכנסים.', line: 'כל פרטי ההזמנה בלחיצה: לילות, מחיר ויתרה לתשלום.',
    n: { face: 'tom', title: 'רוני פרץ הגיע', sub: 'האלון · 2 לילות · כניסה 15:00' },
  },
  {
    t: 19 * 60 + 40, label: 'ערב', photo: 'n-woodtub', alt: 'אורחים בג׳קוזי עץ בערב', screen: 'm-payments', bg: '#efebff',
    title: 'היתרה שולמה.', line: 'התשלום נרשם לבד, וההכנסות של החודש התעדכנו.',
    n: { face: 'noa', title: 'התקבל תשלום ‏₪2,350', sub: 'האלון · יתרה · נרשם אוטומטית' },
  },
];
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`;

/* ---------------- the day ---------------- */
function Moment({ M, i, clockRef, className }) {
  return (
    <div className={`s-moment ${className}`} aria-live="polite">
      {clockRef && <p className="s-clock num" dir="ltr" aria-hidden="true" ref={clockRef} />}
      <div className="s-moment-tx" key={i}>
        <h2 className="s-mt"><span className="n9-sr">{hhmm(M.t)}. </span>{M.title}</h2>
        <p className="s-ml">{M.line}</p>
      </div>
      {clockRef && <p className="s-demo-note">מסכים אמיתיים של ATLAS, עם נתוני דוגמה.</p>}
    </div>
  );
}

function Day() {
  const [rm] = useState(reduced);
  const sec = useRef(null);
  const fill = useRef(null);
  const clock = useRef(null);
  const clockM = useRef(null);
  const [i, setI] = useState(0);

  const onP = useCallback((p) => {
    const k = Math.min(MOMENTS.length - 1, Math.floor(p * MOMENTS.length * 0.9999));
    setI(k);
    // the clock ticks continuously between the moments; each moment holds its own time for a beat
    const local = p * MOMENTS.length - k;
    const a = MOMENTS[k].t;
    const b = k < MOMENTS.length - 1 ? MOMENTS[k + 1].t : a;
    const hold = 0.68;
    const m = local < hold ? a : a + (b - a) * ((local - hold) / (1 - hold));
    const txt = hhmm(m);
    if (clock.current) clock.current.textContent = txt;
    if (clockM.current) clockM.current.textContent = txt;
    const f = (k + (local < hold ? 0 : (local - hold) / (1 - hold))) / (MOMENTS.length - 1);
    if (fill.current) fill.current.style.transform = `scaleX(${Math.min(1, f).toFixed(4)})`;
  }, []);
  useStickyProgress(sec, onP, !rm);
  useEffect(() => {
    if (!rm) return;
    [clock, clockM].forEach((r) => { if (r.current) r.current.textContent = hhmm(MOMENTS[i].t); });
  }, [rm, i]);

  const jump = (k) => {
    if (rm || !sec.current) { setI(k); return; }
    const r = sec.current.getBoundingClientRect();
    const run = r.height - window.innerHeight;
    const y = window.scrollY + r.top + run * ((k + 0.25) / MOMENTS.length);
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const M = MOMENTS[i];
  return (
    <section ref={sec} id="day" className={`s-day${rm ? ' is-static' : ''}`} aria-labelledby="s-h1">
      <div className="s-stage" style={{ '--bg': M.bg }}>
        <div className="n9-wrap s-grid">
          <div className="s-copy">
            <h1 id="s-h1" className="s-h1">יום שלם במתחם.<br /><span className="n9-hl">ATLAS כבר דאגה.</span></h1>
            <p className="s-sub">מההזמנה של הבוקר ועד התשלום של הערב, הכל קורה לבד.</p>
            <div className="s-ctas">
              <SignupBtn className="is-lg" />
            </div>
            <CtaNote className="s-note" />
            <Moment M={M} i={i} clockRef={clock} className="is-d" />
          </div>

          <div className="s-scene" aria-hidden="true">
            <div className="s-photos">
              {MOMENTS.map((m, k) => (
                <img key={m.photo} src={`${PH}/${m.photo}.webp`} alt="" loading={k === 0 ? 'eager' : 'lazy'} decoding="async" className={k === i ? 'is-on' : ''} />
              ))}
            </div>
            <div className="s-ntf-slot">
              <Notif key={i} {...M.n} time={hhmm(M.t)} className="s-ntf" />
            </div>
            <Phone screens={MOMENTS.map((m) => `${UI}/${m.screen}.webp`)} active={i} className="s-phone" eager="all" />
            <p className="s-clock-m num" dir="ltr" ref={clockM} />
          </div>
          <Moment M={M} i={i} className="is-m" />
        </div>

        <div className="n9-wrap s-rail-wrap">
          <div className="s-rail">
            <div className="s-track" aria-hidden="true"><i ref={fill} className="s-fill" style={rm ? { transform: `scaleX(${i / (MOMENTS.length - 1)})` } : undefined} /></div>
            <ol className="s-stops" aria-label="רגעים ביום">
              {MOMENTS.map((m, k) => (
                <li key={m.t} style={{ '--x': k / (MOMENTS.length - 1) }}>
                  <button type="button" className={k === i ? 'is-on' : ''} aria-current={k === i ? 'step' : undefined} onClick={() => jump(k)}>
                    <i aria-hidden="true" />
                    <b className="num" dir="ltr">{hhmm(m.t)}</b>
                    <span>{m.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- the same day on the desktop ---------------- */
const PILLARS = [
  { I: CalendarDays, t: 'לוח אחד לכל הערוצים', p: 'Booking.com, Airbnb וישיר, מסונכרנים.' },
  { I: MessageCircle, t: 'וואטסאפ שיוצא לבד', p: 'אישור, הגעה ותזכורת, בזמן.' },
  { I: Wallet, t: 'כל שקל במקום אחד', p: 'מקדמות, יתרות ודוח לרואה החשבון.' },
];
const STEPS = [
  { I: Link2, t: 'מחברים את הערוצים', p: 'מדביקים קישור יומן מ-Booking.com ו-Airbnb.' },
  { I: Home, t: 'מוסיפים יחידות', p: 'שם, תמונה ומחיר. זהו.' },
  { I: Sparkles, t: 'ATLAS עובדת', p: 'ההזמנות נכנסות, ההודעות יוצאות.' },
];

function Desk() {
  return (
    <section id="desk" className="n9-sec s-desk-sec" aria-labelledby="desk-title">
      <div className="n9-wrap">
        <div className="n9-head is-center" data-reveal>
          <h2 id="desk-title" className="n9-h2">ובמחשב, <span className="n9-hl">כל היום על מסך אחד.</span></h2>
          <p className="n9-lead">מסך הבית של ATLAS ב-08:12 בבוקר. כל מה שראיתם למעלה, במבט אחד. מסכים אמיתיים, נתוני דוגמה.</p>
        </div>
        <div className="s-desk" data-reveal>
          <Browser src={`${UI}/d-today8.webp`} url="app.atlas-il.com/today" alt="מסך הבית של ATLAS במחשב, נתוני דוגמה" />
        </div>
        <ul className="s-pillars">
          {PILLARS.map(({ I, t, p }, k) => (
            <li key={t} data-reveal style={{ '--d': `${k * 70}ms` }}>
              <span className="s-pi" aria-hidden="true"><I size={20} strokeWidth={1.9} /></span>
              <h3>{t}</h3>
              <p>{p}</p>
            </li>
          ))}
        </ul>
        <div className="s-steps" data-reveal>
          <h3 className="s-steps-h">מתחילים בשלושה צעדים, תוך 10 דקות</h3>
          <ol>
            {STEPS.map(({ I, t, p }, k) => (
              <li key={t}>
                <span className="s-sn num" aria-hidden="true">{k + 1}</span>
                <div><b><I size={17} strokeWidth={2} aria-hidden="true" />{t}</b><p>{p}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="s-cta-sec" aria-labelledby="cta-title">
      <div className="n9-wrap">
        <div className="s-cta" data-reveal>
          <p className="s-cta-clock num" dir="ltr" aria-hidden="true">08:00</p>
          <h2 id="cta-title" className="n9-h2">מחר בבוקר, הכל כבר מסודר.</h2>
          <p className="s-cta-sub">14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות, ואם נתקעים, אדם עונה בוואטסאפ.</p>
          <div className="s-cta-row">
            <SignupBtn className="is-lg" />
            <WaLink />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingS() {
  const root = useRef(null);
  useReveal9(root);
  return (
    <div ref={root} className="n9 ls" dir="rtl">
      <a href="#main" className="n9-sr">דילוג לתוכן</a>
      <Header9 nav={NAV} tone="light" />
      <main id="main">
        <Day />
        <Desk />
        <Pricing9 className="s-pr" />
        <Faq9 />
        <Closing />
      </main>
      <Footer9 />
      <CookieConsent revealAfter=".s-day" />
    </div>
  );
}
