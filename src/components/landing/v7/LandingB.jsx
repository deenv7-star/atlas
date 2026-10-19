/**
 * Landing v7 B "האנשים": Deen's references (brand/refs-landing-deen.md) in ATLAS colours.
 * A centred giant headline with a rounded photo inside it, faces floating around it, the live
 * product (laptop + phone) on a soft indigo-sky field, a people bento of photo and tint tiles,
 * a photo + indigo split with three product facts, pricing, FAQ and a light CTA.
 * Photos: Unsplash / Pexels, free licence, cool-graded. Chip text is example product data.
 */
import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, useTimeline } from '../v5/motion';
import { AppWindow, Calendar, WhatsAppCard } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL, PHONE_DISPLAY } from '../v5/content';
import { SignupButton, Channels, Pricing, Faq, Footer } from '../v5/LandingV5';
import {
  IMG, AV, V7Header, BookingChip, PaidChip, FaceChip, Phone, PhotoCredits,
} from './shared7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';

const NAV = [['#product', 'המוצר'], ['#people', 'למי זה'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- hero ---------------- */
function Hero() {
  const step = useTimeline([900, 2200]);
  return (
    <section className="l7b-hero" aria-labelledby="hero-title">
      <div className="l7b-top">
        <div className="l7b-faces" aria-hidden="true">
          <FaceChip className="f1 l7-float" style={{ '--i': 0 }} src={AV.w1} line="ההזמנה אושרה" tone="white" />
          <FaceChip className="f2 l7-float" style={{ '--i': 1 }} src={AV.m5} line="שילם מקדמה ✓" tone="mint" />
          <FaceChip className="f3 l7-float" style={{ '--i': 2 }} src={AV.m3} line="קיבל קוד דלת" tone="indigo" />
          <FaceChip className="f4 l7-float" style={{ '--i': 3 }} src={AV.w2} line="★ 5 בביקורת" tone="white" />
        </div>
        <div className="l7b-faces-m l5-in" style={{ '--i': 0 }} aria-hidden="true">
          <img src={AV.w1} alt="" width="40" height="40" />
          <img src={AV.m5} alt="" width="40" height="40" />
          <img src={AV.w2} alt="" width="40" height="40" />
          <img src={AV.m3} alt="" width="40" height="40" />
          <span>אורחים, מארחים וצוות. כולם בתמונה.</span>
        </div>
        <h1 id="hero-title" className="l7b-h1">
          <span className="l5-h1-line" style={{ '--i': 1 }}>
            האורחים
            <span className="l7b-inl" aria-hidden="true"><img src={`${IMG}/hosts-pill.webp`} alt="" width="480" height="234" fetchPriority="high" /></span>
            מגיעים.
          </span>
          <span className="l5-h1-line is-ind" style={{ '--i': 2 }}>הכל כבר מוכן.</span>
        </h1>
        <p className="l7b-lead l5-in" style={{ '--i': 3 }}>
          atlas מנהלת את ההזמנות מ-Airbnb, Booking.com ומהאתר שלכם על לוח אחד, מכינה לאורחים את מה שהם צריכים ועוקבת אחרי כל מקדמה.
        </p>
        <div className="l7-cta l5-in" style={{ '--i': 4 }}>
          <SignupButton className="is-lg" />
          <a href="#product" className="l5-btn-ghost is-lg">לראות את המערכת</a>
        </div>
        <p className="l7-note l5-in" style={{ '--i': 5 }}><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
      </div>
      <div className="l7-inset">
        <div id="product" className="l7b-field">
          <div className="l7b-stage" aria-hidden="true">
            <div className="l7b-laptop l5-in" style={{ '--i': 4 }}>
              <div className="l7b-laptop-scr"><AppWindow><Calendar compact showIncoming={step >= 1} /></AppWindow></div>
              <div className="l7b-laptop-base" />
            </div>
            <Phone className="l7b-phone"><div className="l7-scr"><b className="l7-scr-h">נועה לוי</b><WhatsAppCard stage={step >= 2 ? 3 : 2} /></div></Phone>
            <BookingChip className="c1 l7-float" style={{ '--i': 2 }} />
            <PaidChip className="c2 l7-float" style={{ '--i': 3 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- people bento ---------------- */
function People() {
  return (
    <section id="people" className="l5-sec l7-bento-sec" aria-labelledby="people-title">
      <div className="l5-wrap">
        <div className="l7-head is-center" data-reveal>
          <p className="l6-kicker">כל מי שבמתחם</p>
          <h2 id="people-title" className="l7-h2">כולם יודעים מה קורה. בלי שתתקשרו לאף אחד.</h2>
        </div>
        <ul className="l7b-bento">
          <li className="l7b-p l7b-tall" data-reveal>
            <img src={`${IMG}/hosts-tall.webp`} alt="זוג מארחים מחייכים" width="900" height="769" loading="lazy" decoding="async" />
            <span className="l7-face-tag is-white">המארחים · לוח אחד לכל הערוצים</span>
          </li>
          <li className="l7b-t is-lilac" data-reveal style={{ '--d': '70ms' }}>
            <b className="l7b-stat num" dir="ltr">3</b>
            <div><h3>ערוצים, לוח אחד</h3><p>Airbnb, Booking.com וישיר מתעדכנים יחד.</p></div>
          </li>
          <li className="l7b-p l7b-tall" data-reveal style={{ '--d': '140ms' }}>
            <img src={`${IMG}/keys.webp`} alt="מסירת מפתח לאורחים" width="800" height="840" loading="lazy" decoding="async" />
            <span className="l7-face-tag is-white">האורחים · קוד דלת בוואטסאפ</span>
          </li>
          <li className="l7b-t is-mint" data-reveal style={{ '--d': '210ms' }}>
            <b className="l7b-stat num" dir="ltr">1</b>
            <div><h3>מקום לכל התשלומים</h3><p>כל מקדמה ויתרה במעקב, ותזכורת ליתרה בלחיצה.</p></div>
          </li>
          <li className="l7b-t is-sky" data-reveal>
            <b className="l7b-stat num" dir="ltr">10</b>
            <div><h3>דקות להגדרה</h3><p>מדביקים קישור יומן, וזהו.</p></div>
          </li>
          <li className="l7b-p" data-reveal style={{ '--d': '70ms' }}>
            <img src={`${IMG}/bed.webp`} alt="הכנת החדר לאורחים הבאים" width="800" height="840" loading="lazy" decoding="async" />
            <span className="l7-face-tag is-mint">צוות הניקיון · יודעים מתי</span>
          </li>
          <li className="l7b-p l7b-wide" data-reveal>
            <img src={`${IMG}/relax.webp`} alt="מארחת נחה עם הטלפון" width="1000" height="562" loading="lazy" decoding="async" />
            <span className="l7-face-tag is-indigo">ואתם · סוף סוף בחופש</span>
          </li>
          <li className="l7b-t is-ind l7b-wide" data-reveal style={{ '--d': '70ms' }}>
            <div><h3>הודעה יוצאת. התשובה מגיעה.</h3><p>אישור הזמנה, הוראות הגעה ותודה אחרי העזיבה. בעברית ובשמכם.</p></div>
            <div className="l7b-wa" aria-hidden="true"><WhatsAppCard stage={3} /></div>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ---------------- split: photo + indigo facts ---------------- */
function Split() {
  return (
    <section className="l5-sec l7b-split-sec" aria-labelledby="split-title">
      <div className="l5-wrap">
        <div className="l7b-split">
          <div className="l7b-split-photo" data-reveal>
            <img src={`${IMG}/hostsdog.webp`} alt="זוג מארחים בדשא עם הכלב" width="1100" height="1041" loading="lazy" decoding="async" />
          </div>
          <div className="l7b-split-info" data-reveal style={{ '--d': '90ms' }}>
            <div>
              <p className="l6-kicker">מהיום הראשון</p>
              <h2 id="split-title" className="l7-h2 is-light">פחות טלפונים. יותר אירוח.</h2>
              <p className="lead">המערכת עושה את העבודה שחוזרת על עצמה, ואתם נשארים עם החלק הטוב: האורחים.</p>
            </div>
            <ul className="l7b-split-facts">
              <li><b className="num" dir="ltr">0</b><span>הזמנות כפולות. הזמנה שנכנסת בערוץ אחד נחסמת בכל השאר.</span></li>
              <li><b className="num" dir="ltr">24/7</b><span>הודעות לאורחים מוכנות מראש, ושקטות בשבת.</span></li>
              <li><b className="num" dir="ltr">1</b><span>קליק לדוח חודשי לרואה החשבון, ב-Excel או PDF.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- final ---------------- */
function FinalCta() {
  return (
    <section className="l7-final" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="l7b-final-box" data-reveal>
          <div className="l7b-final-ph" aria-hidden="true">
            <img src={AV.w1} alt="" width="64" height="64" loading="lazy" />
            <img className="is-big" src={`${IMG}/hosts-pill.webp`} alt="" width="120" height="64" loading="lazy" />
            <img src={AV.m5} alt="" width="64" height="64" loading="lazy" />
          </div>
          <h2 id="final-title" className="l7-h2">המתחם שלכם, בלי העבודה השחורה.</h2>
          <p>14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
          <div className="l7-cta">
            <SignupButton className="is-lg" />
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg">וואטסאפ{'\u00a0'}<span dir="ltr" className="num">{PHONE_DISPLAY}</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingB() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7b" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Channels />
        <People />
        <Split />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".l7b-hero" />
    </div>
  );
}
