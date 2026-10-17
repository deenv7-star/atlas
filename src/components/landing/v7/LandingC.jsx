/**
 * Landing v7 C "שקט." (editorial / giant type). Deen's references PLAY STRONG, Travel, URBAN CHIC
 * (brand/refs-landing-deen.md) in ATLAS colours: a rounded inset hero with a full-bleed daylight
 * zimmer photo and one giant word over it, a floating product card, then editorial chapters with
 * big product numbers and alternating large photos, pricing, FAQ and an indigo closing block.
 * Photos: Pexels / Unsplash, free licence, cool-graded webp. Card data is example product data.
 */
import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal } from '../v5/motion';
import { Mark, WhatsAppCard, Payments, SyncMini } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL, PHONE_DISPLAY } from '../v5/content';
import { SignupButton, Channels, Steps, Pricing, Faq, Footer } from '../v5/LandingV5';
import { IMG, AV, V7Header, BookingChip, PaidChip, FACTS } from './shared7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './landing-v7c.css';

const NAV = [['#product', 'המוצר'], ['#how', 'איך מתחילים'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

const WEEK = [
  ['א׳', 'direct'], ['ב׳', 'direct'], ['ג׳', 'airbnb'], ['ד׳', 'airbnb'], ['ה׳', 'booking'], ['ו׳', 'booking'], ['ש׳', 'booking'],
];
const CH_NAME = { direct: 'ישיר', airbnb: 'Airbnb', booking: 'Booking.com' };

function WeekCard({ className = '', style }) {
  return (
    <div className={`l7c-card ${className}`} style={style}>
      <div className="l7c-card-h">
        <span><b>בקתת הזית</b><small>השבוע · 7 לילות</small></span>
        <span className="l7c-full"><Check size={13} strokeWidth={3} aria-hidden="true" />מלא</span>
      </div>
      <ul className="l7c-week">
        {WEEK.map(([d, ch], i) => (
          <li key={d + i} className={`is-${ch}`} title={CH_NAME[ch]}><small>{d}</small><i /></li>
        ))}
      </ul>
      <div className="l7c-card-legend">
        <span><i className="is-direct" />ישיר</span>
        <span><i className="is-airbnb" />Airbnb</span>
        <span><i className="is-booking" />Booking.com</span>
      </div>
      <div className="l7c-card-f">
        <span>שולם השבוע</span>
        <b className="num" dir="ltr">₪6,840</b>
      </div>
    </div>
  );
}

/* ---------------- hero ---------------- */
function Hero() {
  return (
    <section className="l7c-hero" aria-labelledby="hero-title">
      <div className="l7-inset">
        <div className="l7c-box">
          <picture className="l7c-photo">
            <source media="(max-width: 767px)" srcSet={`${IMG}/c-hero-m.webp`} />
            <source media="(max-width: 1279px)" srcSet={`${IMG}/c-hero-1000.webp 1000w, ${IMG}/c-hero.webp 2000w`} sizes="100vw" />
            <img src={`${IMG}/c-hero.webp`} alt="צימר עם בריכה, דק עץ וערסל בין עצים ירוקים ביום בהיר" width="2000" height="1333" fetchPriority="high" decoding="async" />
          </picture>
          <div className="l7c-shade" aria-hidden="true" />
          <div className="l7c-top">
            <p className="l7c-tag l5-in" style={{ '--i': 0 }}><span className="l7-dot" />לצימרים, וילות ומתחמי אירוח</p>
            <h1 id="hero-title" className="l7c-h1">
              <span className="l7c-giant l5-in" style={{ '--i': 1 }}>שקט.</span>
              <span className="l7c-h1-sub l5-in" style={{ '--i': 2 }}>הצימר מלא.<br />ATLAS עושה את השאר.</span>
            </h1>
          </div>
          <div className="l7c-float" aria-hidden="true">
            <BookingChip className="l7c-chip1 l7-float" style={{ '--i': 2 }} />
            <WeekCard className="l7-float" style={{ '--i': 3 }} />
          </div>
          <div className="l7c-panel l5-in" style={{ '--i': 3 }}>
            <p className="l7c-lead">הזמנות מ-Airbnb, Booking.com והאתר שלכם על לוח אחד. מקדמות נגבות בזמן, והודעות לאורחים יוצאות לבד בוואטסאפ.</p>
            <div className="l7-cta">
              <SignupButton className="is-lg" />
              <a href="#product" className="l5-btn-ghost is-lg">איך זה עובד</a>
            </div>
            <p className="l7-note"><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- big numbers (product facts only) ---------------- */
function Index() {
  return (
    <section id="product" className="l5-sec l7c-index-sec" aria-labelledby="index-title">
      <div className="l5-wrap">
        <div className="l7c-index-head" data-reveal>
          <p className="l6-kicker">המוצר, במספרים</p>
          <h2 id="index-title" className="l7c-h2">פחות עבודה.<br /><span className="is-ind">אותו צימר.</span></h2>
        </div>
        <ol className="l7c-nums">
          {FACTS.map((f, i) => (
            <li key={f.u} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <b className="num" dir="ltr">{f.n.startsWith('₪') ? <><span className="l7c-cur">₪</span>{f.n.slice(1)}</> : f.n}</b>
              <div><h3>{f.u}</h3><p>{f.t}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- editorial chapters ---------------- */
const CHAPTERS = [
  {
    n: '01', img: 'c-deck.webp', w: 1400, h: 934, pos: '70% 40%',
    alt: 'אורחים יושבים על מרפסת עץ מעל בריכה טבעית וגינה ירוקה',
    kicker: 'לוח שנה', title: 'לוח אחד. אפס כפילויות.',
    text: 'כל הזמנה מ-Airbnb, מ-Booking.com או ישירות מכם נכנסת לאותו לוח, והתאריכים נחסמים בכל שאר הערוצים.',
    points: ['סנכרון iCal בהדבקת קישור', 'כל היחידות במבט אחד'],
    ui: <SyncMini />, uiClass: 'is-sync',
  },
  {
    n: '02', img: 'c-aerial.webp', w: 1100, h: 1031, pos: '50% 50%',
    alt: 'מבט מלמעלה על בריכה בתוך גינה ירוקה',
    kicker: 'תשלומים', title: 'המקדמה נכנסת. בלי לרדוף.',
    text: 'מקדמה נגבית עם ההזמנה, ותזכורת ליתרה יוצאת לבד. כל תשלום נרשם, ובסוף החודש יש דוח מסודר לרואה החשבון.',
    points: ['מקדמה ויתרה לכל הזמנה', 'דוח חודשי ב-Excel או PDF'],
    ui: <Payments total={false} />, uiClass: 'is-pay',
  },
  {
    n: '03', img: 'c-white.webp', w: 1100, h: 805, pos: '60% 50%',
    alt: 'בריכה כחולה בחצר לבנה עם צמחייה',
    kicker: 'הודעות', title: 'האורחים יודעים הכל. לפני שהם שואלים.',
    text: 'אישור הזמנה, הוראות הגעה וקוד לדלת, ותודה אחרי העזיבה. בעברית, בשמכם, בוואטסאפ ובזמן הנכון.',
    points: ['תבניות מוכנות בעברית', 'אתם בוחרים מה יוצא ומתי'],
    ui: <WhatsAppCard stage={3} />, uiClass: 'is-wa',
  },
];

function Chapters() {
  return (
    <section className="l7c-ch-sec" aria-label="מה ATLAS עושה">
      <div className="l5-wrap">
        {CHAPTERS.map((c, i) => (
          <article key={c.n} className={`l7c-ch${i % 2 ? ' is-flip' : ''}`} aria-labelledby={`ch-${c.n}`}>
            <figure className="l7c-ch-ph" data-reveal>
              <img src={`${IMG}/${c.img}`} alt={c.alt} width={c.w} height={c.h} loading="lazy" decoding="async" style={{ objectPosition: c.pos }} />
              <div className={`l7c-ch-ui ${c.uiClass}`} aria-hidden="true">{c.ui}</div>
            </figure>
            <div className="l7c-ch-txt" data-reveal style={{ '--d': '90ms' }}>
              <span className="l7c-ch-n num" aria-hidden="true">{c.n}</span>
              <p className="l6-kicker">{c.kicker}</p>
              <h2 id={`ch-${c.n}`} className="l7c-h3">{c.title}</h2>
              <p className="l7c-ch-p">{c.text}</p>
              <ul className="l7c-ch-pts">
                {c.points.map((p) => <li key={p}><Check size={16} strokeWidth={2.5} aria-hidden="true" />{p}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- giant type band ---------------- */
function Band() {
  return (
    <section className="l7c-band" aria-labelledby="band-title">
      <div className="l5-wrap">
        <h2 id="band-title" className="l7c-band-t" data-reveal>
          <span>פחות טלפונים.</span>
          <span className="is-ind">יותר אירוח.</span>
        </h2>
        <figure className="l7c-band-ph" data-reveal style={{ '--d': '90ms' }}>
          <img src={`${IMG}/hosts.webp`} alt="זוג מארחים מחייכים מחוץ לבית" width="1600" height="1067" loading="lazy" decoding="async" />
          <div className="l7c-band-chips" aria-hidden="true">
            <PaidChip />
            <span className="l7c-band-av">
              <img src={AV.w1} alt="" width="40" height="40" loading="lazy" />
              <img src={AV.m5} alt="" width="40" height="40" loading="lazy" />
              <img src={AV.w2} alt="" width="40" height="40" loading="lazy" />
            </span>
          </div>
        </figure>
        <p className="l7c-band-p" data-reveal>המערכת עושה את מה שחוזר על עצמו. אתם נשארים עם האורחים.</p>
      </div>
    </section>
  );
}

/* ---------------- final ---------------- */
function FinalCta() {
  return (
    <section className="l7c-final-sec" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="l7c-final" data-reveal>
          <h2 id="final-title" className="l7c-final-t">שקט.<span>מהיום.</span></h2>
          <p>14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
          <div className="l7-cta">
            <SignupButton className="is-lg" />
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg"><Mark ch="whatsapp" size={16} />{'\u00a0'}וואטסאפ{'\u00a0'}<span dir="ltr" className="num">{PHONE_DISPLAY}</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Credits() {
  return (
    <p className="l7-credits">
      צילומים: Pexels ו-Unsplash (רישיון חופשי). הנתונים בכרטיסים הם דוגמה.
    </p>
  );
}

export default function LandingC() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7c" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Channels />
        <Index />
        <Chapters />
        <Band />
        <Steps />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Credits />
      <Footer />
      <CookieConsent revealAfter=".l7c-hero" />
    </div>
  );
}
