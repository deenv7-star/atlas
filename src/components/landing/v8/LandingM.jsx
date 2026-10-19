/**
 * Landing v8 M "Product theatre". The real ATLAS v8 dashboard (C, bento) is the star: shown big in
 * 3D perspective on a soft indigo glow floor, with real UI widgets of the same screen lifting out of it
 * in layers (income card, occupancy ring, property tile) plus a WhatsApp bubble, a payment card and
 * guest faces around it. Pointer parallax on desktop; on scroll the screen settles flat and the
 * widgets drop back into it. Then four full-bleed colour blocks (indigo, sky, lilac, mint) that stack
 * on scroll, each one feature = a large real UI crop + one bold line + real people photos.
 * Pricing, FAQ and an indigo CTA.
 *
 * All screens are real ATLAS screens in demo mode; every name, booking and amount is example data
 * and is labelled as such. No testimonials, logos or customer counts.
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CalendarDays, MessageCircle, Wallet, Sun, RefreshCw, Sparkles } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { V7Header, Chip } from '../v7/shared7';
import { UI, PH, FACES, Face, FaceStack, WaBubble, Pricing8, CtaLinks, Credits8, useScrollProgress } from './shared8';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-v8m.css';
import './faq-m.css';
import HeroPhoto from './HeroPhoto';
import TrustB from './TrustB';
import LazyGrowth from './growth/LazyGrowth';

const loadGrowth = () => import('./growth/GrowthD');

const NAV = [['#features', 'המוצר'], ['#facts', 'למה atlas'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- channels strip ---------------- */
function Channels() {
  return (
    <section className="lm-ch" aria-label="עובד עם">
      <div className="l5-wrap lm-ch-in">
        <p>עובד עם מה שכבר יש לכם</p>
        <ul>
          <li><Mark ch="airbnb" size={20} />Airbnb</li>
          <li><Mark ch="booking" size={20} />Booking.com</li>
          <li><Mark ch="whatsapp" size={20} />WhatsApp</li>
          <li><Mark ch="google" size={20} />Google Calendar</li>
        </ul>
      </div>
    </section>
  );
}

/* ---------------- full-bleed feature blocks ---------------- */
function Block({ tone, layout, I, kicker, title, text, points, children, id }) {
  const ref = useRef(null);
  useScrollProgress(ref);
  // stacking cards: a block taller than the screen sticks only once its bottom is in view
  useEffect(() => {
    const el = ref.current;
    if (!el || !('ResizeObserver' in window)) return undefined;
    const set = () => el.style.setProperty('--stick', `${Math.min(0, window.innerHeight - el.offsetHeight)}px`);
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener('resize', set);
    set();
    return () => { ro.disconnect(); window.removeEventListener('resize', set); };
  }, []);
  return (
    <section ref={ref} id={id} className={`lm-blk is-${tone} is-${layout}`} aria-labelledby={`${tone}-title`}>
      <div className="l5-wrap lm-blk-in">
        <div className="lm-blk-copy" data-reveal>
          <p className="lm-kick"><I size={18} strokeWidth={2.2} aria-hidden="true" />{kicker}</p>
          <h2 id={`${tone}-title`} className="lm-blk-h">{title}</h2>
          <p className="lm-blk-txt">{text}</p>
          {points && (
            <ul className="lm-pts">
              {points.map((t) => <li key={t}><Check size={16} strokeWidth={2.8} aria-hidden="true" />{t}</li>)}
            </ul>
          )}
        </div>
        <div className="lm-blk-vis">{children}</div>
      </div>
    </section>
  );
}

function Blocks() {
  return (
    <div className="lm-blocks" id="features">
      <Block
        tone="indigo"
        layout="stage"
        I={CalendarDays}
        kicker="לוח שנה"
        title={<>כל הערוצים. לוח אחד.</>}
        text="Airbnb, Booking.com והזמנות ישירות נכנסות לבד ללוח, ומתעדכנות כל 15 דקות. תאריך תפוס נשאר תפוס. בלי כפל הזמנות, בלי אקסל."
      >
        <div className="lm-v lm-v-cal">
          <img className="lm-ui is-cal" src={`${UI}/c-cal.webp`} alt="לוח השנה של atlas: ארבע יחידות, הזמנות מכל הערוצים על ציר אחד (נתוני דוגמה)" width="2000" height="719" loading="lazy" decoding="async" />
          <figure className="lm-ph is-friends"><img src={`${PH}/m-friends.webp`} alt="" width="1400" height="933" loading="lazy" decoding="async" /></figure>
          <div className="lm-chip is-a"><Chip av={FACES.maya.src} ch="airbnb" title="הזמנה מ-Airbnb נכנסה ללוח" sub="מאיה כ. · 3 לילות · התאנה" /></div>
          <div className="lm-chip is-b"><span className="lm-sync"><RefreshCw size={16} strokeWidth={2.4} aria-hidden="true" />התאריכים נחסמו ב-Booking.com</span></div>
        </div>
      </Block>

      <Block
        tone="sky"
        layout="split"
        I={MessageCircle}
        kicker="הודעות"
        title={<>וואטסאפ לאורחים. מוכן מראש.</>}
        text="אנחנו מכינים כל הודעה בזמן הנכון, עם השם, התאריכים והניווט, ושומרים על שקט בשבת. אתם שולחים בלחיצה אחת, מהוואטסאפ שלכם."
        points={['אישור מיד אחרי ההזמנה', 'הוראות הגעה יום לפני', 'תזכורת ליתרה, בלי מבוכה']}
      >
        <div className="lm-v lm-v-msg">
          <img className="lm-ui is-msg" src={`${UI}/c-messages.webp`} alt="מסך ההודעות של atlas: שיחת וואטסאפ עם אורחים (נתוני דוגמה)" width="1800" height="1125" loading="lazy" decoding="async" />
          <figure className="lm-ph is-tub"><img src={`${PH}/m-tub.webp`} alt="" width="1400" height="933" loading="lazy" decoding="async" /></figure>
          <div className="lm-chip is-c">
            <WaBubble who="נועה ל." text="היי נועה, מחר מ-15:00 הצימר שלכם. קוד לדלת: 2419. נסיעה טובה!" time="18:00" />
          </div>
        </div>
      </Block>

      <Block
        tone="lilac"
        layout="collage"
        I={Wallet}
        kicker="תשלומים"
        title={<>הכסף נכנס. אתם רואים הכל.</>}
        text="כל מקדמה ויתרה במעקב, תזכורת ליתרה בוואטסאפ בלחיצה, ותמונה אחת של מה נכנס החודש. הכסף נכנס כמו תמיד, וכל מקדמה ויתרה נשמרות."
      >
        <div className="lm-v lm-v-pay">
          <img className="lm-ui is-paid" src={`${UI}/c-paid.webp`} alt="כרטיס תשלום בהזמנה: ‏₪5,200 שולם במלואו (נתוני דוגמה)" width="848" height="576" loading="lazy" decoding="async" />
          <figure className="lm-ph is-host"><img src={`${PH}/m-host.webp`} alt="" width="900" height="968" loading="lazy" decoding="async" /></figure>
          <img className="lm-ui is-chart" src={`${UI}/c-chart.webp`} alt="גרף הכנסות לפי חודש (נתוני דוגמה)" width="1256" height="966" loading="lazy" decoding="async" />
          <img className="lm-ui is-rec" src={`${UI}/c-received.webp`} alt="" width="704" height="220" loading="lazy" decoding="async" />
        </div>
      </Block>

      <Block
        tone="mint"
        layout="split is-flip"
        I={Sun}
        kicker="היום"
        title={<>היום שלכם, מסודר מראש.</>}
        text="כניסות, יציאות וניקיונות בציר אחד. מסמנים ״בוצע״ בלחיצה, וכולם יודעים מה הלאה."
        points={['כל בוקר: מה מחכה היום', 'ניקיון בין אורח לאורח', 'הכל מוכן? רואים במבט']}
      >
        <div className="lm-v lm-v-today">
          <img className="lm-ui is-today" src={`${UI}/c-todaylist.webp`} alt="רשימת ״היום במתחם״: כניסה, יציאה וניקיון (נתוני דוגמה)" width="888" height="966" loading="lazy" decoding="async" />
          <img className="lm-ui is-prog" src={`${UI}/c-progress.webp`} alt="" width="848" height="566" loading="lazy" decoding="async" />
          <figure className="lm-ph is-clean"><img src={`${PH}/m-clean.webp`} alt="" width="1300" height="866" loading="lazy" decoding="async" /></figure>
          <div className="lm-chip is-d"><span className="lm-done"><Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />הגפן מוכנה לאורחים</span></div>
        </div>
      </Block>
    </div>
  );
}

/* ---------------- facts ---------------- */
const FACTS = [
  { n: '3', u: 'ערוצים', t: 'Airbnb, Booking.com וישיר על לוח אחד' },
  { n: '10', u: 'דקות', t: 'מההרשמה ועד לוח מסונכרן' },
  { n: '14', u: 'ימים', t: 'ניסיון חינם, בלי כרטיס אשראי' },
  { n: '₪0', u: 'עמלה', t: 'על הזמנות מעמוד ההזמנה הישירה' },
];

function Facts() {
  return (
    <section id="facts" className="lm-facts" aria-labelledby="facts-title">
      <div className="l5-wrap">
        <div className="lm-facts-top" data-reveal>
          <h2 id="facts-title" className="v8-h2">הזמנות, תשלומים ואורחים. <span className="is-ind">במקום אחד.</span></h2>
          <div className="lm-facts-people">
            <FaceStack keys={['noa', 'tom', 'shir', 'ben', 'yossi']} size={48} />
            <p>כל הערוצים בלוח אחד, והודעות וואטסאפ מוכנות לכל אורח.</p>
          </div>
        </div>
        <ul className="lm-facts-row">
          {FACTS.map((f, i) => (
            <li key={f.u} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <b className="num" dir="ltr">{f.n}</b>
              <span>{f.u}</span>
              <p>{f.t}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- final CTA ---------------- */
function Final() {
  return (
    <section className="lm-x" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="lm-x-box">
          <div className="lm-x-faces" aria-hidden="true">
            {['noa', 'tom', 'maya', 'yossi'].map((k, i) => <Face key={k} f={FACES[k]} size={64} className={`lm-x-face is-${i + 1}`} />)}
          </div>
          <h2 id="final-title" className="lm-x-h" data-reveal>הלוח מסודר.<br />אפשר לארח.</h2>
          <p className="lm-x-sub" data-reveal>14 ימי ניסיון חינם. מחברים את Booking ו-Airbnb ב-10 דקות, והלוח מתחיל להתמלא.</p>
          <div data-reveal><CtaLinks /></div>
          <div className="lm-x-shot" aria-hidden="true">
            <img src={`${UI}/c-today.webp`} alt="" width="2400" height="1500" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- sticky mobile CTA: after the hero, hidden again at the final CTA / footer ---------------- */
function StickyCta() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const hero = document.querySelector('.ph-hero');
    const ends = [...document.querySelectorAll('.lm-x, .l5-ftr')];
    if (!hero || typeof IntersectionObserver === 'undefined') return undefined;
    let heroVisible = true;
    const endVisible = new Set();
    const update = () => setOn(!heroVisible && endVisible.size === 0);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting;
        else if (e.isIntersecting) endVisible.add(e.target);
        else endVisible.delete(e.target);
      }
      update();
    });
    io.observe(hero);
    ends.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className={`lm-sticky${on ? ' is-on' : ''}`} aria-hidden={on ? undefined : 'true'}>
      <Link to="/register" tabIndex={on ? 0 : -1}>התחילו 14 יום חינם</Link>
    </div>
  );
}

/**
 * Performance (qa/landing-perf/report.md): the page is prerendered and hydrated. Each part below the hero is
 * its own Suspense boundary (nothing in it suspends; the markup is the same), so React hydrates the header
 * and the hero first and the rest in small slices in the background, instead of one long main-thread task.
 */
const Part = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

export default function LandingM() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l7 v8 lm has-ph" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <HeroPhoto />
        <Part><Channels /></Part>
        <Part><Blocks /></Part>
        <Part><Facts /></Part>
        <Part><TrustB /></Part>
        <LazyGrowth load={loadGrowth} className="lg-ph-d" />
        <Part><Pricing8 /></Part>
        <Part><Faq openFirst cta /></Part>
        <Part><Final /></Part>
        <Part><Credits8 /></Part>
      </main>
      <Part><Footer /></Part>
      <Part><StickyCta /></Part>
      <CookieConsent revealAfter=".ph-hero" />
    </div>
  );
}
