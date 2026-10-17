/**
 * Landing v7 A "המארחים": Deen's references (brand/refs-landing-deen.md) in ATLAS colours.
 * A big rounded hero container with a real photo of hosts, floating product chips around it,
 * the channel strip, a photo + tint bento, product facts, how-it-works on phones, pricing, FAQ,
 * and a rounded indigo CTA with a host photo. Photos: Unsplash / Pexels, free licence, cool-graded.
 */
import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal } from '../v5/motion';
import { AppWindow, Calendar, Payments, WhatsAppCard, SyncMini } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL, PHONE_DISPLAY, STEPS } from '../v5/content';
import { SignupButton, Channels, Pricing, Faq, Footer } from '../v5/LandingV5';
import {
  IMG, V7Header, BookingChip, PaidChip, WaChip, ReviewChip, Chip, Phone, FactsRow, PhotoCredits,
} from './shared7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';

/* ---------------- hero: rounded container, hosts photo, floating chips ---------------- */
function Hero() {
  return (
    <section className="l7a-hero" aria-labelledby="hero-title">
      <div className="l7-inset">
        <div className="l7a-box">
          <div className="l7a-copy">
            <p className="l7-pill l5-in" style={{ '--i': 0 }}><span className="l7-dot" />מערכת ניהול לצימרים ומתחמי נופש</p>
            <h1 id="hero-title" className="l7-h1">
              <span className="l5-h1-line" style={{ '--i': 1 }}>אתם מארחים.</span>
              <span className="l5-h1-line is-ind" style={{ '--i': 2 }}>ATLAS מנהלת.</span>
            </h1>
            <p className="l7-lead l5-in" style={{ '--i': 3 }}>
              הזמנות מ-Airbnb, Booking.com ומהאתר שלכם על לוח אחד. הודעות לאורחים יוצאות לבד, והמקדמה נגבית בזמן.
            </p>
            <div className="l7-cta l5-in" style={{ '--i': 4 }}>
              <SignupButton className="is-lg" />
              <a href="#product" className="l5-btn-ghost is-lg">לראות איך זה עובד</a>
            </div>
            <p className="l7-note l5-in" style={{ '--i': 5 }}><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
          </div>
          <div className="l7a-media">
            <picture className="l7a-photo">
              <source media="(max-width: 767px)" srcSet={`${IMG}/hosts-tall.webp`} />
              <source media="(max-width: 1100px)" srcSet={`${IMG}/hosts-900.webp`} />
              <img src={`${IMG}/hosts.webp`} alt="זוג מארחים מחייכים בגינה של המתחם" width="1600" height="1067" fetchPriority="high" decoding="async" />
            </picture>
            <div className="l7a-chips" aria-hidden="true">
              <BookingChip className="l7-float is-c1" style={{ '--i': 0 }} />
              <PaidChip className="l7-float is-c2" style={{ '--i': 1 }} />
              <WaChip className="l7-float is-c3" style={{ '--i': 2 }} />
              <ReviewChip className="l7-float is-c4" style={{ '--i': 3 }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- bento: photo tiles + tint tiles ---------------- */
function Bento() {
  return (
    <section id="product" className="l5-sec l7-bento-sec" aria-labelledby="bento-title">
      <div className="l5-wrap">
        <div className="l7-head" data-reveal>
          <p className="l6-kicker">יום רגיל במתחם</p>
          <h2 id="bento-title" className="l7-h2">האורחים מגיעים. העבודה כבר נעשתה.</h2>
        </div>
        <ul className="l7a-bento">
          <li className="l7-tile is-photo is-arrive" data-reveal>
            <img src={`${IMG}/keys.webp`} alt="מסירת מפתח לאורחים" width="800" height="840" loading="lazy" decoding="async" />
            <Chip className="l7-tile-chip" ch="airbnb" title="קוד הדלת נשלח" sub="נכנסים היום ב-15:00" />
            <div className="l7-tile-cap"><h3>אורחים מגיעים</h3><p>הוראות הגעה וקוד דלת יוצאים אליהם לבד, יום לפני.</p></div>
          </li>
          <li className="l7-tile is-ind is-cal" data-reveal style={{ '--d': '80ms' }}>
            <div className="l7-tile-txt"><h3>לוח אחד לכל הערוצים</h3><p>הזמנה שנכנסת באחד, נחסמת בכל השאר.</p></div>
            <div className="l7-tile-ui" aria-hidden="true"><AppWindow bare><Calendar compact /></AppWindow></div>
          </li>
          <li className="l7-tile is-photo is-relax" data-reveal style={{ '--d': '160ms' }}>
            <img src={`${IMG}/relax.webp`} alt="מארחת נחה על הספה עם הטלפון" width="1000" height="562" loading="lazy" decoding="async" />
            <PaidChip className="l7-tile-chip" amount="₪1,250" sub="יתרה נגבתה · סוויטת הגפן" />
            <div className="l7-tile-cap"><h3>אתם נחים</h3><p>תזכורת ליתרה יוצאת בזמן, והתשלום נרשם לבד.</p></div>
          </li>
          <li className="l7-tile is-mint is-pay" data-reveal>
            <div className="l7-tile-txt"><h3>כסף בזמן</h3><p>מקדמה עם כל הזמנה, יתרות פתוחות במבט אחד.</p></div>
            <div className="l7-tile-ui" aria-hidden="true"><Payments className="l5-card" total={false} /></div>
          </li>
          <li className="l7-tile is-photo is-clean" data-reveal style={{ '--d': '80ms' }}>
            <img src={`${IMG}/bed.webp`} alt="הכנת החדר לאורחים הבאים" width="800" height="840" loading="lazy" decoding="async" />
            <Chip className="l7-tile-chip" icon={<span className="l7-ic is-mint"><Check size={16} strokeWidth={3} /></span>} title="ניקיון הושלם" sub="סוויטת האלון · 12:40" />
            <div className="l7-tile-cap"><h3>החדר מוכן</h3><p>הניקיון משובץ לפי היציאות, ואתם רואים מתי סיימו.</p></div>
          </li>
          <li className="l7-tile is-sky is-wa" data-reveal style={{ '--d': '160ms' }}>
            <div className="l7-tile-txt"><h3>וואטסאפ שעונה בשבילכם</h3><p>אישור, הגעה, תודה. בעברית ובשמכם.</p></div>
            <div className="l7-tile-ui" aria-hidden="true"><WhatsAppCard stage={3} /></div>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ---------------- facts ---------------- */
function Facts() {
  return (
    <section className="l7-facts-sec" aria-label="ATLAS במספרים">
      <div className="l5-wrap"><FactsRow /></div>
    </section>
  );
}

/* ---------------- how it works on phones ---------------- */
function SignupScreen() {
  return (
    <div className="l7-scr">
      <b className="l7-scr-h">פותחים חשבון</b>
      <span className="l7-field"><small>שם המתחם</small>צימרים בגליל</span>
      <span className="l7-field"><small>טלפון</small><span dir="ltr" className="num">054-000-0000</span></span>
      <span className="l7-field"><small>יחידות</small><span className="num">4</span></span>
      <span className="l7-scr-btn">ממשיכים</span>
    </div>
  );
}

const SCREENS = [
  <SignupScreen key="s" />,
  <div key="c" className="l7-scr"><b className="l7-scr-h">חיבור ערוצים</b><div className="l5-card l6-pad"><SyncMini /></div></div>,
  <div key="w" className="l7-scr"><b className="l7-scr-h">הודעות לאורחים</b><WhatsAppCard stage={3} /></div>,
];

function How() {
  return (
    <section id="how" className="l5-sec l7-how" aria-labelledby="how-title">
      <div className="l5-wrap">
        <div className="l7-head is-center" data-reveal>
          <p className="l6-kicker">איך מתחילים</p>
          <h2 id="how-title" className="l7-h2">שלושה צעדים. עשר דקות.</h2>
          <p className="l7-sub">בלי התקנה, בלי טכנאי ובלי להעביר נתונים ידנית.</p>
        </div>
        <ol className="l7-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={{ '--d': `${i * 90}ms` }}>
              <div className={`l7-step-stage is-t${i}`}><Phone>{SCREENS[i]}</Phone></div>
              <div className="l7-step-txt">
                <span className="l7-step-n num" aria-hidden="true">{i + 1}</span>
                <h3>{s.title}<span className="l7-step-time">{s.time}</span></h3>
                <p>{s.line}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- final CTA: rounded indigo container with photo ---------------- */
function FinalCta() {
  return (
    <section className="l7-final" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="l7-final-box" data-reveal>
          <div className="l7-final-copy">
            <h2 id="final-title" className="l7-h2 is-light">המתחם שלכם, בלי העבודה השחורה.</h2>
            <p>14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
            <div className="l7-cta">
              <SignupButton className="is-lg l6-btn-white" />
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l6-btn-glass is-lg">וואטסאפ{'\u00a0'}<span dir="ltr" className="num">{PHONE_DISPLAY}</span></a>
            </div>
          </div>
          <div className="l7-final-media">
            <img src={`${IMG}/hostsdog.webp`} alt="זוג מארחים בדשא עם הכלב" width="1100" height="1041" loading="lazy" decoding="async" />
            <PaidChip className="l7-final-chip" amount="₪3,890" sub="נכנס היום · כל הערוצים" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingA() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7a" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header />
      <main id="main">
        <Hero />
        <Channels />
        <Bento />
        <Facts />
        <How />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".l7a-hero" />
    </div>
  );
}
