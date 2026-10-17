/**
 * Landing v7 D "בנטו". Deen's references AION, Horizon Courts and Teamway (brand/refs-landing-deen.md)
 * in ATLAS colours: the hero itself is a bento grid (headline + CTA, a large host photo, an indigo
 * calendar, a mint payment, a WhatsApp tile, a rating tile with faces, a place photo), followed by
 * a features bento of photo and tint tiles with live mini-UI, steps, pricing, FAQ and a bento CTA.
 * Photos: Unsplash / Pexels, free licence, cool-graded webp. Tile data is example product data.
 */
import React, { useRef } from 'react';
import { Check, CheckCheck, Star, CalendarDays, Wallet } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal } from '../v5/motion';
import { Mark, TodayBoard, SyncMini, ReportMini } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL, PHONE_DISPLAY } from '../v5/content';
import { SignupButton, Channels, Steps, Pricing, Faq, Footer } from '../v5/LandingV5';
import { IMG, AV, V7Header } from './shared7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './landing-v7d.css';

const NAV = [['#features', 'המוצר'], ['#how', 'איך מתחילים'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* October 2026 starts on a Thursday: 4 leading blanks (Sun..Wed). [from, to, channel] */
const BOOKED = [[2, 4, 'booking'], [6, 8, 'direct'], [9, 11, 'airbnb'], [14, 15, 'direct'], [16, 18, 'booking'], [21, 24, 'airbnb'], [28, 31, 'direct']];
const TODAY = 17;
function dayCh(n) { const b = BOOKED.find(([f, t]) => n >= f && n <= t); return b ? b[2] : null; }

function MonthMini() {
  const cells = [...Array(4).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];
  return (
    <div className="l7d-month">
      <div className="l7d-month-dow">{['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="l7d-month-grid">
        {cells.map((n, i) => {
          const ch = n && dayCh(n);
          return (
            <span key={i} className={`${n ? '' : 'is-blank'}${ch ? ` is-b is-${ch}` : ''}${n === TODAY ? ' is-today' : ''}`} data-row={Math.floor(i / 7)}>
              {n || ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- hero bento ---------------- */
function Hero() {
  return (
    <section className="l7d-hero" aria-labelledby="hero-title">
      <div className="l7-inset">
        <div className="l7d-grid">
          <div className="l7d-t l7d-head">
            <p className="l7-pill l5-in" style={{ '--i': 0 }}><span className="l7-dot" />לצימרים, וילות ומתחמי אירוח</p>
            <h1 id="hero-title" className="l7d-h1">
              <span className="l5-h1-line" style={{ '--i': 1 }}>המתחם מתנהל לבד.</span>
              <span className="l5-h1-line is-ind" style={{ '--i': 2 }}>אתם מארחים.</span>
            </h1>
            <p className="l7d-lead l5-in" style={{ '--i': 3 }}>הזמנות מכל הערוצים, מקדמות, הודעות לאורחים וניקיון. הכל על מסך אחד, בעברית.</p>
            <div className="l7-cta l5-in" style={{ '--i': 4 }}>
              <SignupButton className="is-lg" />
              <a href="#features" className="l5-btn-ghost is-lg">לראות את המערכת</a>
            </div>
            <p className="l7-note l5-in" style={{ '--i': 5 }}><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
          </div>

          <div className="l7d-t l7d-photo l7d-host l5-in" style={{ '--i': 2 }}>
            <img src={`${IMG}/hosts-tall.webp`} alt="זוג מארחים מחייכים" width="900" height="769" fetchPriority="high" decoding="async" />
            <div className="l7d-host-chip" aria-hidden="true">
              <img src={AV.w2} alt="" width="36" height="36" />
              <span><b>מאיה אישרה הגעה</b><small>סוויטת האלון · מחר 15:00</small></span>
              <span className="l7d-ok"><Check size={14} strokeWidth={3} /></span>
            </div>
          </div>

          <div className="l7d-t l7d-cal l5-in" style={{ '--i': 3 }} aria-label="דוגמה: לוח שנה עם הזמנות מכל הערוצים" role="img">
            <div className="l7d-t-top">
              <span className="l7d-ic is-light"><CalendarDays size={18} strokeWidth={1.75} aria-hidden="true" /></span>
              <span><b>אוקטובר</b><small>3 ערוצים · לוח אחד</small></span>
            </div>
            <MonthMini />
          </div>

          <div className="l7d-t l7d-pay l5-in" style={{ '--i': 4 }}>
            <div className="l7d-t-top">
              <span className="l7d-ic is-mint"><Wallet size={18} strokeWidth={1.75} aria-hidden="true" /></span>
              <span><b>מקדמה התקבלה</b><small>דנה א. · וילה התאנה</small></span>
            </div>
            <p className="l7d-amt"><b className="num" dir="ltr">₪1,250</b><span className="l7d-paid"><Check size={13} strokeWidth={3} aria-hidden="true" />שולם</span></p>
            <div className="l7d-bar" aria-hidden="true"><i style={{ width: '78%' }} /></div>
            <p className="l7d-t-meta">78% מהכנסות החודש כבר נגבו</p>
          </div>

          <div className="l7d-t l7d-wa l5-in" style={{ '--i': 5 }}>
            <div className="l7d-t-top">
              <span className="l7d-ic is-wa"><Mark ch="whatsapp" size={18} /></span>
              <span><b>הוראות הגעה יצאו לבד</b><small>וואטסאפ · יום לפני ההגעה</small></span>
            </div>
            <div className="l7d-bubs">
            <p className="l7d-bub">היי נועה, מחכים לכם מחר מ-15:00. הקוד לדלת: 4821.<span className="num">09:00<CheckCheck size={14} strokeWidth={2.25} aria-hidden="true" /></span></p>
            <p className="l7d-bub is-in">תודה! נגיע בסביבות 16:00</p>
            </div>
          </div>

          <div className="l7d-t l7d-rate l5-in" style={{ '--i': 6 }}>
            <p className="l7d-stars" aria-label="דירוג 4.9 מתוך 5">
              <b className="num" dir="ltr">4.9</b>
              <span aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={18} strokeWidth={0} fill="currentColor" />)}</span>
            </p>
            <p className="l7d-t-txt">בקשה לביקורת נשלחת אחרי כל עזיבה, בזמן הנכון.</p>
            <div className="l7d-faces" aria-hidden="true">
              {[AV.w1, AV.m5, AV.w2, AV.m3, AV.m1].map((s) => <img key={s} src={s} alt="" width="40" height="40" />)}
            </div>
          </div>

          <div className="l7d-t l7d-photo l7d-place l5-in" style={{ '--i': 7 }}>
            <img src={`${IMG}/d-forest.webp`} alt="מבט מלמעלה על בית עם בריכה בתוך יער ירוק" width="900" height="792" decoding="async" />
            <span className="l7-face-tag is-white">כל היחידות במבט אחד</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- features bento ---------------- */
function Features() {
  return (
    <section id="features" className="l5-sec l7d-feat-sec" aria-labelledby="feat-title">
      <div className="l5-wrap">
        <div className="l7-head is-center" data-reveal>
          <p className="l6-kicker">המערכת</p>
          <h2 id="feat-title" className="l7-h2">כל מה שהמתחם צריך. בלי עוד אפליקציות.</h2>
        </div>
        <ul className="l7d-feat">
          <li className="l7d-f is-sky is-wide" data-reveal>
            <div className="l7d-f-txt"><h3>סנכרון עם כל הערוצים</h3><p>מדביקים קישור יומן מ-Airbnb ומ-Booking.com פעם אחת. הזמנה שנכנסת בערוץ אחד נחסמת בכל השאר.</p></div>
            <div className="l7d-f-ui is-sync" aria-hidden="true"><SyncMini /></div>
          </li>
          <li className="l7d-f is-photo" data-reveal style={{ '--d': '70ms' }}>
            <img src={`${IMG}/bed.webp`} alt="חדר מוכן לאורחים הבאים" width="800" height="840" loading="lazy" decoding="async" />
            <div className="l7d-f-cap"><h3>ניקיון בזמן</h3><p>הצוות מקבל משימה אחרי כל יציאה.</p></div>
          </li>
          <li className="l7d-f is-photo" data-reveal>
            <img src={`${IMG}/d-oasis.webp`} alt="בריכה בין עצים ירוקים" width="1000" height="669" loading="lazy" decoding="async" />
            <div className="l7d-f-cap"><h3><span className="num" dir="ltr">₪0</span> עמלה</h3><p>עמוד הזמנה ישירה משלכם.</p></div>
          </li>
          <li className="l7d-f is-lilac is-wide" data-reveal style={{ '--d': '70ms' }}>
            <div className="l7d-f-txt"><h3>היום במתחם, במבט אחד</h3><p>מי נכנס, מי יוצא, מה שולם ומה ממתין. בבוקר אתם יודעים בדיוק מה מחכה לכם.</p></div>
            <div className="l7d-f-ui is-today" aria-hidden="true"><TodayBoard /></div>
          </li>
          <li className="l7d-f is-mint" data-reveal>
            <div className="l7d-f-txt"><h3>דוח לרואה החשבון</h3><p>כל תשלום נרשם. בסוף החודש מורידים Excel או PDF.</p></div>
            <div className="l7d-f-ui is-report" aria-hidden="true"><ReportMini /></div>
          </li>
          <li className="l7d-f is-ind" data-reveal style={{ '--d': '70ms' }}>
            <b className="l7d-f-big num" dir="ltr">24/7</b>
            <div className="l7d-f-txt"><h3>הודעות שיוצאות לבד</h3><p>אישור הזמנה, הוראות הגעה ותודה אחרי העזיבה. גם בשבת בלילה.</p></div>
          </li>
          <li className="l7d-f is-photo" data-reveal style={{ '--d': '140ms' }}>
            <img src={`${IMG}/keys.webp`} alt="מסירת מפתח לאורחים" width="800" height="840" loading="lazy" decoding="async" />
            <div className="l7d-f-cap"><h3>קוד דלת בוואטסאפ</h3><p>האורחים נכנסים בלי לחכות לכם.</p></div>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ---------------- final bento ---------------- */
function FinalCta() {
  return (
    <section className="l7d-final-sec" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="l7d-final">
          <div className="l7d-final-main" data-reveal>
            <h2 id="final-title" className="l7-h2 is-light">המתחם שלכם, על טייס אוטומטי.</h2>
            <p>14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
            <div className="l7-cta">
              <SignupButton className="is-lg" />
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg"><Mark ch="whatsapp" size={16} />{'\u00a0'}וואטסאפ{'\u00a0'}<span dir="ltr" className="num">{PHONE_DISPLAY}</span></a>
            </div>
          </div>
          <div className="l7d-final-ph" data-reveal style={{ '--d': '90ms' }}>
            <img src={`${IMG}/relax.webp`} alt="מארחת נחה עם הטלפון" width="1000" height="562" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Credits() {
  return <p className="l7-credits">צילומים: Unsplash ו-Pexels (רישיון חופשי). הנתונים בכרטיסים הם דוגמה.</p>;
}

export default function LandingD() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7d" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Channels />
        <Features />
        <Steps />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Credits />
      <Footer />
      <CookieConsent revealAfter=".l7d-hero" />
    </div>
  );
}
