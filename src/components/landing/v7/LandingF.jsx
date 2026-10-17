/**
 * Landing v7 F "תמונה + ווידג׳ט": Deen's references (Travel "Pick the place", Finovate rounded
 * photo hero, cycling-club photo + coloured info split) in ATLAS colours.
 * A big rounded daylight photo with the headline in the bottom corner over a soft scrim, and a
 * white widget bar overlapping its bottom edge (like a booking search bar) with live example
 * numbers: bookings today, revenue this month, messages sent. Then a photo + indigo split with
 * three product facts, "a day with ATLAS" photo cards, pricing, FAQ and a light CTA.
 * Photos: Unsplash / Pexels, free licence, cool-graded. Numbers in the widget are example data.
 */
import React, { useRef } from 'react';
import {
  Check, CalendarCheck, MessageCircle, TrendingUp, Clock, SprayCan, KeyRound, Wallet,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, useCountUp, useInView, fmt } from '../v5/motion';
import { Mark, RevenueChart } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL, PHONE_DISPLAY } from '../v5/content';
import { SignupButton, Channels, Pricing, Faq, Footer } from '../v5/LandingV5';
import {
  IMG, AV, V7Header, Chip, BookingChip, PaidChip, PhotoCredits,
} from './shared7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './landing-v7f.css';

const NAV = [['#widget', 'המוצר'], ['#day', 'יום עם ATLAS'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- hero ---------------- */
function Widget() {
  const ref = useRef(null);
  const on = useInView(ref);
  const rev = useCountUp(48250, on, 1600);
  const msgs = useCountUp(37, on, 1400);
  const book = useCountUp(4, on, 900);
  return (
    <div id="widget" ref={ref} className="l7f-widget l5-in" style={{ '--i': 4 }}>
      <p className="l7f-w-live"><span className="l7f-live-dot" aria-hidden="true" />ככה נראה יום רגיל ב-ATLAS <small>(נתוני דוגמה)</small></p>
      <dl className="l7f-w-stats">
        <div className="l7f-w-cell">
          <dt><span className="l7f-w-ic is-ind" aria-hidden="true"><CalendarCheck size={18} strokeWidth={1.9} /></span>הזמנות היום</dt>
          <dd><b className="num">{book}</b><small>2 כניסות · 2 יציאות</small></dd>
        </div>
        <div className="l7f-w-cell is-rev">
          <dt><span className="l7f-w-ic is-sky" aria-hidden="true"><TrendingUp size={18} strokeWidth={1.9} /></span>הכנסה החודש</dt>
          <dd>
            <b className="num" dir="ltr">₪{fmt(rev)}</b>
            <small className="is-up"><span dir="ltr" className="num">+18%</span> מהחודש שעבר</small>
          </dd>
          <div className="l7f-w-spark" aria-hidden="true"><RevenueChart w={160} h={44} id="f-spark" /></div>
        </div>
        <div className="l7f-w-cell">
          <dt><span className="l7f-w-ic is-mint" aria-hidden="true"><MessageCircle size={18} strokeWidth={1.9} /></span>הודעות שנשלחו</dt>
          <dd><b className="num">{msgs}</b><small>לבד, בוואטסאפ</small></dd>
        </div>
      </dl>
      <div className="l7f-w-cta">
        <SignupButton className="is-lg" />
        <small><Check size={13} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE}</small>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="l7f-hero" aria-labelledby="hero-title">
      <div className="l7-inset">
        <div className="l7f-photo">
          <picture>
            <source media="(min-width: 768px)" srcSet={`${IMG}/f-hero.webp`} width="1800" height="1103" />
            <img src={`${IMG}/f-hero-m.webp`} alt="זוג אורחים משחקים עם הכלב בדשא ליד הצימר" width="840" height="933" fetchPriority="high" decoding="async" />
          </picture>
          <div className="l7f-scrim" aria-hidden="true" />
          <div className="l7f-chips" aria-hidden="true">
            <Chip className="l7f-ch1 l7-float" style={{ '--i': 1 }} av={AV.w2} title="מאיה ודני הגיעו" sub="קוד הדלת נשלח בוואטסאפ · 15:04" />
            <PaidChip className="l7f-ch2 l7-float" style={{ '--i': 2 }} sub="מקדמה · מאיה כהן" />
          </div>
          <div className="l7f-copy">
            <p className="l7f-tag l5-in" style={{ '--i': 0 }}><span className="l7-dot" aria-hidden="true" />לצימרים ולבקתות בישראל</p>
            <h1 id="hero-title" className="l7f-h1">
              <span className="l5-h1-line" style={{ '--i': 1 }}>האורחים נהנים.</span>
              <span className="l5-h1-line" style={{ '--i': 2 }}>אתם רגועים.</span>
            </h1>
            <p className="l7f-lead l5-in" style={{ '--i': 3 }}>
              הזמנות מכל הערוצים על לוח אחד, וואטסאפ לאורחים שיוצא לבד ומקדמות שנגבות בזמן.
            </p>
          </div>
        </div>
        <Widget />
      </div>
    </section>
  );
}

/* ---------------- split: indigo facts + photo ---------------- */
function Split() {
  return (
    <section className="l5-sec l7f-split-sec" aria-labelledby="split-title">
      <div className="l5-wrap">
        <div className="l7f-split">
          <div className="l7f-split-info" data-reveal>
            <div>
              <p className="l6-kicker is-light">למה ATLAS</p>
              <h2 id="split-title" className="l7-h2 is-light">כל המתחם על מסך אחד. מהיום הראשון.</h2>
            </div>
            <ul className="l7f-facts">
              <li><b className="num" dir="ltr">3</b><span><strong>ערוצים, לוח אחד.</strong> Airbnb, Booking.com וההזמנות הישירות מתעדכנים יחד, בלי כפילויות.</span></li>
              <li><b className="num" dir="ltr">10</b><span><strong>דקות להגדרה.</strong> מדביקים קישור יומן מכל ערוץ, וזהו.</span></li>
              <li><b className="num" dir="ltr">₪0</b><span><strong>עמלה על הזמנה ישירה.</strong> עמוד הזמנה משלכם, עם תשלום מקדמה.</span></li>
            </ul>
          </div>
          <div className="l7f-split-photo" data-reveal style={{ '--d': '90ms' }}>
            <img src={`${IMG}/cabins.webp`} alt="בקתות עץ על דשא ירוק ביום בהיר" width="1000" height="667" loading="lazy" decoding="async" />
            <BookingChip className="l7f-split-chip" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- a day with ATLAS ---------------- */
const DAY = [
  { t: '08:00', img: 'hosts-900.webp', w: 900, h: 600, alt: 'זוג מארחים מחייכים בבוקר', icon: <Mark ch="booking" size={16} />, title: 'בוקר. הזמנה נכנסה בלילה.', line: 'ATLAS קלטה אותה מ-Booking.com, חסמה את התאריכים בכל הערוצים ושלחה לאורח אישור.', status: 'נחסם ב-Airbnb ובאתר' },
  { t: '11:00', img: 'bed.webp', w: 800, h: 840, alt: 'הכנת המיטה לאורחים הבאים', icon: <SprayCan size={16} strokeWidth={1.9} />, title: 'יציאה וניקיון.', line: 'הצוות יודע מה מתפנה היום ומה צריך להיות מוכן עד הכניסה.', status: 'צוות הניקיון עודכן' },
  { t: '15:00', img: 'keys.webp', w: 800, h: 840, alt: 'מסירת מפתח לאורחים', icon: <KeyRound size={16} strokeWidth={1.9} />, title: 'כניסה בלי לחכות בשער.', line: 'האורחים קיבלו הוראות הגעה וקוד לדלת בוואטסאפ, בשמכם.', status: 'הוראות הגעה נשלחו' },
  { t: '20:00', img: 'relax.webp', w: 1000, h: 562, alt: 'מארחת נחה על הספה עם הטלפון', icon: <Wallet size={16} strokeWidth={1.9} />, title: 'ערב. הכסף כבר אצלכם.', line: 'המקדמה נגבתה עם ההזמנה, ותזכורת ליתרה יצאה לבד.', status: 'יתרה של ₪1,250 שולמה' },
];

function Day() {
  return (
    <section id="day" className="l5-sec l7f-day-sec" aria-labelledby="day-title">
      <div className="l5-wrap">
        <div className="l7f-day-head" data-reveal>
          <div>
            <p className="l6-kicker">יום עם ATLAS</p>
            <h2 id="day-title" className="l7-h2">מהבוקר עד הערב, העבודה השחורה כבר נעשתה.</h2>
          </div>
          <p className="l7-sub">ככה נראה יום רגיל במתחם, כשהמערכת עושה את מה שחוזר על עצמו.</p>
        </div>
      </div>
      <div className="l7f-day-wrap">
        <ol className="l7f-day" tabIndex={0} aria-label="יום עם ATLAS, לפי שעות">
          {DAY.map((d, i) => (
            <li key={d.t} className="l7f-card" data-reveal style={{ '--d': `${i * 80}ms` }}>
              <div className="l7f-card-ph">
                <img src={`${IMG}/${d.img}`} alt={d.alt} width={d.w} height={d.h} loading="lazy" decoding="async" />
                <span className="l7f-time"><Clock size={14} strokeWidth={2.1} aria-hidden="true" /><span className="num" dir="ltr">{d.t}</span></span>
              </div>
              <div className="l7f-card-txt">
                <h3>{d.title}</h3>
                <p>{d.line}</p>
                <span className="l7f-status"><span className="l7f-status-ic" aria-hidden="true">{d.icon}</span>{d.status}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- final ---------------- */
function FinalCta() {
  return (
    <section className="l7-final" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="l7f-final" data-reveal>
          <div className="l7f-final-copy">
            <h2 id="final-title" className="l7-h2">העונה הבאה מתחילה עכשיו.</h2>
            <p>14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות, ואנחנו בוואטסאפ אם צריך.</p>
            <div className="l7-cta">
              <SignupButton className="is-lg" />
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg">וואטסאפ{'\u00a0'}<span dir="ltr" className="num">{PHONE_DISPLAY}</span></a>
            </div>
          </div>
          <div className="l7f-final-ph">
            <img src={`${IMG}/hosts.webp`} alt="זוג מארחים צוחקים יחד" width="1600" height="1067" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingF() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7f" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Channels />
        <Split />
        <Day />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".l7f-hero" />
    </div>
  );
}
