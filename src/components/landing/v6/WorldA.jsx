/**
 * Landing v6 A "עולם": a full-bleed Galilee zimmer in cool daylight with the live product floating
 * over it, then a scroll story of one host's day (morning message, booking syncs, payment lands,
 * evening calm), one bold full-bleed indigo section, and the v5 pricing/FAQ.
 * Imagery: generated for ATLAS (public/landing-v6), cool daylight only, checked for warm pixels.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, useTimeline } from '../v5/motion';
import {
  AppWindow, Calendar, WhatsAppCard, Payments, SyncMini, TodayBoard, ReportMini, DirectPageMini, RevenueCard,
} from '../v5/ui';
import { CTA_NOTE } from '../v5/content';
import { SignupButton, Channels, Steps, Pricing, Faq, Footer } from '../v5/LandingV5';
import { V6Header, Toast, PaidToast, EveningCard } from './shared';
import '../v5/landing-v5.css';
import './landing-v6.css';

const IMG = '/landing-v6';

/* ---------------- hero ---------------- */
const HERO_TL = [700, 1700, 2900, 4200];

function Hero() {
  const step = useTimeline(HERO_TL);
  return (
    <section className="l6a-hero" aria-labelledby="hero-title">
      <picture className="l6a-hero-photo" aria-hidden="true">
        <source media="(max-width: 767px)" srcSet={`${IMG}/hero-tall.webp`} />
        <source media="(max-width: 1100px)" srcSet={`${IMG}/hero-wide-960.webp`} />
        <img src={`${IMG}/hero-wide.webp`} alt="" width="1584" height="672" fetchPriority="high" decoding="async" />
      </picture>
      <div className="l6a-hero-scrim" aria-hidden="true" />
      <div className="l5-wrap l6a-hero-in">
        <div className="l6a-hero-copy">
          <p className="l6-eyebrow l5-in" style={{ '--i': 0 }}><span className="l6-live" />מערכת ניהול לצימרים ומתחמי נופש</p>
          <h1 id="hero-title" className="l6a-h1">
            <span className="l5-h1-line" style={{ '--i': 1 }}>אתם מארחים.</span>
            <span className="l5-h1-line" style={{ '--i': 2 }}>ATLAS מנהלת.</span>
          </h1>
          <p className="l6a-lead l5-in" style={{ '--i': 3 }}>
            לוח אחד ל-Airbnb, Booking.com והזמנות ישירות, וואטסאפ לאורחים שמוכן מראש ונשלח בלחיצה, ומעקב מקדמות ויתרות.
          </p>
          <div className="l6a-cta l5-in" style={{ '--i': 4 }}>
            <SignupButton className="is-lg l6-btn-white" />
            <a href="#story" className="l6-btn-glass is-lg">לראות יום עם ATLAS</a>
          </div>
          <p className="l6a-note l5-in" style={{ '--i': 5 }}><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
        </div>
        <div className="l6a-float" aria-hidden="true">
          <div className="l6a-f-cal l5-layer" style={{ '--i': 1 }}>
            <AppWindow bare><Calendar compact showIncoming={step >= 2} /></AppWindow>
          </div>
          <Toast className={`l6a-f-toast${step >= 2 ? ' is-on' : ''}`} ch="booking" title="הזמנה חדשה נכנסה" sub="Elena V. · סטודיו הגפן · 3 לילות" />
          <PaidToast className={`l6a-f-paid${step >= 3 ? ' is-on' : ''}`} />
          <div className="l6a-f-wa l5-layer" style={{ '--i': 2 }}><WhatsAppCard stage={step >= 4 ? 3 : step >= 1 ? 2 : 1} /></div>
        </div>
      </div>
      <a href="#story" className="l6a-scroll" aria-label="גללו לסיפור"><span /></a>
    </section>
  );
}

/* ---------------- story: a host's day ---------------- */
const CHAPTERS = [
  {
    k: 'morning', time: '08:00', img: 'morning.webp', w: 760, h: 943,
    title: 'בוקר. ההודעה כבר יצאה.',
    line: 'נועה מגיעה היום. הוראות ההגעה וקוד הדלת נשלחו אליה אתמול בערב, בשמכם. אתם שותים קפה.',
    ui: <WhatsAppCard stage={3} />,
  },
  {
    k: 'sync', time: '11:20', img: 'pool.webp', w: 760, h: 943,
    title: 'הזמנה נכנסה. הלוח כבר יודע.',
    line: 'הזמנה מ-Booking.com ננעלת תוך דקות גם ב-Airbnb ובעמוד ההזמנה הישירה. אין כפילות ואין טלפון לחוץ.',
    ui: (
      <div className="l6-stack">
        <Toast ch="booking" title="הזמנה חדשה נכנסה" sub="Elena V. · סטודיו הגפן · 3 לילות" className="is-on" />
        <div className="l5-card l6-pad"><SyncMini /></div>
      </div>
    ),
  },
  {
    k: 'pay', time: '14:05', img: 'hero-wide-960.webp', w: 960, h: 407,
    title: 'כל שקל במעקב.',
    line: 'רואים כל מקדמה ויתרה, ותזכורת ליתרה יוצאת בלחיצה. בלי לרדוף ובלי אקסל.',
    ui: (
      <div className="l6-stack">
        <PaidToast className="is-on" />
        <Payments className="l5-card" />
      </div>
    ),
  },
  {
    k: 'evening', time: '21:30', img: 'evening.webp', w: 1312, h: 816,
    title: 'ערב. הכל מוכן למחר.',
    line: 'כניסות, ניקיון ויתרות פתוחות מסודרים לבד. אתם סוגרים את היום בראש שקט.',
    ui: <EveningCard />,
  },
];

function Story() {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.i)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <section id="story" className="l5-sec l6a-story" aria-labelledby="story-title">
      <div className="l5-wrap">
        <div className="l6a-story-head" data-reveal>
          <p className="l6-kicker">יום אחד במתחם</p>
          <h2 id="story-title" className="l6-h2">מהקפה של הבוקר ועד השקט של הערב.</h2>
        </div>
        <div className="l6a-story-grid">
          <div className="l6a-stage" aria-hidden="true">
            <div className="l6a-stage-frame">
              {CHAPTERS.map((c, i) => (
                <img key={c.k} src={`${IMG}/${c.img}`} alt="" loading="lazy" decoding="async" width={c.w} height={c.h} className={`l6a-stage-img${i === active ? ' is-on' : ''}`} />
              ))}
              <span className="l6a-stage-time num" key={active}>{CHAPTERS[active].time}</span>
            </div>
            {CHAPTERS.map((c, i) => (
              <div key={c.k} className={`l6a-stage-ui is-${c.k}${i === active ? ' is-on' : ''}`}>{c.ui}</div>
            ))}
          </div>
          <ol className="l6a-chapters">
            {CHAPTERS.map((c, i) => (
              <li key={c.k} ref={(el) => { refs.current[i] = el; }} data-i={i} className={`l6a-ch${i === active ? ' is-on' : ''}`}>
                <div className="l6a-ch-media" aria-hidden="true">
                  <img src={`${IMG}/${c.img}`} alt="" loading="lazy" decoding="async" width={c.w} height={c.h} />
                  <div className={`l6a-ch-ui is-${c.k}`}>{c.ui}</div>
                </div>
                <span className="l6a-ch-time num">{c.time}</span>
                <h3>{c.title}</h3>
                <p>{c.line}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------------- bold indigo: everything in one system ---------------- */
const TILES = [
  { k: 'cal', span: 'w7', title: 'לוח אחד לכל הערוצים', line: 'Airbnb, Booking.com וישיר על אותו לוח, מתעדכן לבד.', ui: <AppWindow bare><Calendar compact /></AppWindow> },
  { k: 'today', span: 'w5', title: 'היום, במבט אחד', line: 'מי נכנס, מי יוצא ומה לנקות.', ui: <div className="l5-card"><TodayBoard title={false} /></div> },
  { k: 'rev', span: 'w4', title: 'הכנסות שרואים', line: 'כל החודש, לפי ערוץ ויחידה.', ui: <RevenueCard className="is-mini" /> },
  { k: 'report', span: 'w4', title: 'דוח לרואה החשבון', line: 'Excel או PDF, בלחיצה.', ui: <ReportMini /> },
  { k: 'direct', span: 'w4', title: 'הזמנה ישירה בלי עמלות', line: 'עמוד משלכם לבקשות הזמנה.', ui: <DirectPageMini /> },
];

function IndigoBlock() {
  return (
    <section id="product" className="l6-indigo l6a-indigo" aria-labelledby="ind-title">
      <div className="l6-indigo-grid" aria-hidden="true" />
      <div className="l5-wrap">
        <div className="l6-indigo-head" data-reveal>
          <p className="l6-kicker is-light">מערכת אחת</p>
          <h2 id="ind-title" className="l6-h2 is-xl">כל העסק.<br />במקום אחד.</h2>
          <p className="l6-indigo-sub">מה שהיה מפוזר בין יומנים, וואטסאפ ואקסל, עובד עכשיו יחד.</p>
        </div>
        <ul className="l6-bento-ind">
          {TILES.map((t, i) => (
            <li key={t.k} className={`l6-tile-ind is-${t.span} is-${t.k}`} data-reveal style={{ '--d': `${(i % 3) * 80}ms` }}>
              <div className="l6-tile-ui" aria-hidden="true">{t.ui}</div>
              <h3>{t.title}</h3>
              <p>{t.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- final CTA over the world ---------------- */
function FinalWorld() {
  return (
    <section className="l6a-final" aria-labelledby="final-title">
      <img className="l6a-final-photo" src={`${IMG}/hero-wide.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" width="1584" height="672" />
      <div className="l5-wrap">
        <div className="l6a-final-card" data-reveal>
          <h2 id="final-title" className="l6-h2">המתחם שלכם, בלי העבודה השחורה.</h2>
          <p className="l5-sub">14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
          <div className="l6a-final-cta">
            <SignupButton className="is-lg" />
            <a href="https://wa.me/972545380085" target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg">וואטסאפ{' '}<span dir="ltr" className="num">054-538-0085</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WorldA() {
  const root = useRef(null);
  const [settled, setSettled] = useState(false);
  useReveal(root);
  useEffect(() => { const t = setTimeout(() => setSettled(true), 2600); return () => clearTimeout(t); }, []);
  return (
    <div ref={root} className={`l5 l6 l6a${settled ? ' is-settled' : ''}`} dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V6Header />
      <main id="main">
        <Hero />
        <Channels />
        <Story />
        <IndigoBlock />
        <Steps />
        <Pricing />
        <Faq />
        <FinalWorld />
      </main>
      <Footer />
      <CookieConsent revealAfter=".l6a-hero" />
    </div>
  );
}

