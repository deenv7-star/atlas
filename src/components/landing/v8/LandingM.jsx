/**
 * Landing v8 M "Product theatre". The real ATLAS v8 dashboard (C, bento) is the star: shown big in
 * 3D perspective on a soft indigo glow floor, with real UI widgets of the same screen lifting out of it
 * in layers (income card, occupancy ring, property tile) plus a WhatsApp bubble, a payment card and
 * guest faces around it. Pointer parallax on desktop; on scroll the screen settles flat and the
 * widgets drop back into it. Then four full-bleed colour blocks (indigo, sky, lilac, mint) that stack
 * on scroll, each one feature = a large real UI crop + one bold line + real people photos.
 * Pricing, FAQ and an indigo CTA.
 *
 * 20.10.2026 (UI/UX research, qa/uiux-research/report.md, mock1/mock2): 6 parts only — hero, one features
 * section (3 rows + the channels it works with), growth offer, pricing, 5 questions, final CTA. The four colour
 * blocks, facts and trust sections are no longer rendered (removed from this file; see git history before 20.10.2026; TrustB.jsx is kept).
 * One bottom bar: the dark cookie row first, the sticky sign-up bar only after it is answered.
 *
 * 20.10.2026 visual v2, version A: the same short page, but the 3 plain feature cards are the four colour
 * blocks again, condensed into a bento of four tiles (indigo, canvas, canvas, navy), each with its real UI crop;
 * the facts section (four numbers + the face stack) is back after the features. Photos row, 5 questions and
 * one bottom bar stay as in #162.
 *
 * All screens are real ATLAS screens in demo mode; every name, booking and amount is example data
 * and is labelled as such. No testimonials, logos or customer counts.
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MessageCircle, Wallet, Sun, RefreshCw, Sparkles } from 'lucide-react';
import CookieConsent, { readChoice } from '@/components/landing/CookieConsent';
import { useReveal, prefersReducedMotion } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ, CTA_SIGNUP, CTA_NOTE, STEPS } from '../v5/content';
import { V7Header } from '../v7/shared7';
import { UI, FACES, Face, FaceStack, WaBubble, Pricing8, CtaLinks, Credits8 } from './shared8';
import { Pic } from './people/Pic';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-v8m.css';
import './faq-m.css';
import './landing-ux-1020.css';
import './landing-visual-v2.css';
import './magic/magic.css';
import HeroPhoto from './HeroPhoto';
import LazyGrowth from './growth/LazyGrowth';

const loadGrowth = () => import('./growth/GrowthS');

/* UI/UX polish v1 (20.10.2026, qa/uiux-polish-v1/spells.md): micro-interactions inspired by designspells.com.
   'subtle' = P1 (6 spells), 'magical' = P2 (12). The CSS-only ones ride on the reveal observer (.is-in); the
   pointer ones load as one small chunk on idle after hydration. Reduced motion: nothing loads, final states only. */
const MAGIC = 'subtle';
const castMagic = () => import('./magic/spells').then((m) => m.cast(MAGIC));

const NAV = [['#features', 'המוצר'], ['#facts', 'למה atlas'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- features: the four colour blocks as a bento of tiles + photos + channels ---------------- */
const TILES = [
  {
    tone: 'indigo', I: CalendarDays, k: 'לוח שנה', t: 'כל הערוצים. לוח אחד.',
    d: 'Airbnb, Booking.com והזמנות ישירות נכנסות לבד ללוח. בלי כפל הזמנות.',
    vis: (
      <div className="lm-tile-vis is-cal">
        <img src={`${UI}/c-cal.webp`} alt="לוח השנה של atlas: ארבע יחידות, הזמנות מכל הערוצים על ציר אחד (נתוני דוגמה)" width="2000" height="719" loading="lazy" decoding="async" />
        <span className="lm-sync"><RefreshCw size={16} strokeWidth={2.4} aria-hidden="true" />התאריכים נחסמו ב-Booking.com</span>
      </div>
    ),
  },
  {
    tone: 'canvas', I: MessageCircle, k: 'הודעות', t: 'וואטסאפ לאורחים. מוכן מראש.',
    d: 'atlas מכין כל הודעה בזמן. אתם שולחים בלחיצה, מהוואטסאפ שלכם.',
    vis: (
      <div className="lm-tile-vis is-msg">
        <span className="mg-typing" aria-hidden="true"><i /><i /><i /></span>
        <WaBubble who="נועה ל." text="היי נועה, מחר מ-15:00 הצימר מחכה לכם. קוד לדלת: 2419. נסיעה טובה" time="18:00" />
      </div>
    ),
  },
  {
    tone: 'canvas', I: Wallet, k: 'תשלומים', t: 'הכסף נכנס. אתם רואים הכל.',
    d: 'כל מקדמה ויתרה נרשמות, ורואים כמה נכנס החודש.',
    vis: (
      <div className="lm-tile-vis is-chart">
        <img src={`${UI}/c-chart.webp`} alt="גרף הכנסות לפי חודש (נתוני דוגמה)" width="1256" height="966" loading="lazy" decoding="async" />
      </div>
    ),
  },
  {
    tone: 'navy', I: Sun, k: 'היום', t: 'היום שלכם, מסודר מראש.',
    d: 'כניסות, יציאות וניקיונות ברשימה אחת. מסמנים ״בוצע״ בלחיצה.',
    vis: (
      <div className="lm-tile-vis is-today">
        <img src={`${UI}/c-todaylist.webp`} alt="רשימת ״היום במתחם״: כניסה, יציאה וניקיון (נתוני דוגמה)" width="888" height="966" loading="lazy" decoding="async" />
      </div>
    ),
  },
];

function Features() {
  return (
    <section id="features" className="lm-feat is-tiles" aria-labelledby="feat-title">
      <div className="l5-wrap">
        <h2 id="feat-title" className="v8-h2 lm-feat-h" data-reveal>מההזמנה <span className="is-ind">ועד הניקיון.</span></h2>
        <p className="lm-feat-sub" data-reveal>ארבעה דברים ש-atlas עושה בשבילכם, כל יום.</p>
        <ul className="lm-tiles">
          {TILES.map(({ tone, I, k, t, d, vis }, i) => (
            <li key={k} className={`lm-tile is-${tone}`} data-reveal style={{ '--d': `${i * 60}ms` }}>
              <div className="lm-tile-copy">
                <p className="lm-kick"><I size={18} strokeWidth={2.2} aria-hidden="true" />{k}</p>
                <h3>{t}</h3>
                <p className="lm-tile-txt">{d}</p>
              </div>
              {vis}
            </li>
          ))}
        </ul>
        {/* people photos B (#144): the owner in action with the real Today screen, and the host checking payments */}
        <div className="lm-feat-ppl">
          <div className="lm-feat-today pp-b-today" data-reveal>
            <figure className="pp-b-host"><Pic name="p-hostess" widths={[560, 1000]} ratio={0.8} sizes="(min-width: 1200px) 480px, (min-width: 900px) 40vw, 80vw" alt="בעלת מתחם מגישה מאפים לאורחים במרפסת" /></figure>
            <div className="pp-b-phone" role="img" aria-label="מסך ״היום״ של atlas בטלפון: כניסות, יציאות וניקיונות (נתוני דוגמה)">
              <img src="/landing-hero/ui-m-today.webp" alt="" width="780" height="1594" loading="lazy" decoding="async" />
            </div>
            <div className="lm-chip is-d"><span className="lm-done"><Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />הגפן מוכנה לאורחים</span></div>
          </div>
          <div className="lm-feat-pay" data-reveal>
            <figure className="lm-feat-host"><Pic name="p-host" widths={[480, 840]} ratio={840 / 903} alt="בעל מתחם בודק את התשלומים במחשב, בשולחן עץ בחוץ" sizes="(min-width: 1200px) 400px, (min-width: 900px) 34vw, 70vw" /></figure>
            <img className="lm-feat-paid" src={`${UI}/c-paid.webp`} alt="כרטיס תשלום בהזמנה: ‏₪5,200 שולם במלואו (נתוני דוגמה)" width="848" height="576" loading="lazy" decoding="async" />
          </div>
          <p className="pp-b-cap lm-feat-cap">להמחשה: האורחים מגיעים, והיום כבר מסודר בטלפון.</p>
        </div>
        <div className="lm-feat-ch">
          <p>עובד עם מה שכבר יש לכם</p>
          <ul>
            <li><Mark ch="airbnb" size={20} />Airbnb</li>
            <li><Mark ch="booking" size={20} />Booking.com</li>
            <li><Mark ch="whatsapp" size={20} />WhatsApp</li>
            <li><Mark ch="google" size={20} />Google Calendar</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- facts ---------------- */
const FACTS = [
  { n: '3', u: 'ערוצים', t: 'Airbnb, Booking.com וישיר על לוח אחד' },
  { n: '10', u: 'דקות', t: 'מההרשמה עד לוח מעודכן' },
  { n: '14', u: 'ימים', t: 'ניסיון חינם, בלי כרטיס אשראי' },
  { n: '₪0', u: 'עמלה', t: 'על הזמנות מעמוד ההזמנה הישירה' },
];

/** Facts number that rolls like a counter (spell 6). The text is real (sr-only + an invisible ghost that keeps the
 *  width); the rolling 0-9 strips are aria-hidden and end on the same digits, so no fake value ever shows. */
const STRIP = Array.from({ length: 20 }, (_, i) => String(i % 10));
function Odo({ text }) {
  return (
    <b className="num mg-odo" dir="ltr">
      <span className="sr-only">{text}</span>
      <span className="mg-odo-ghost" aria-hidden="true">{text}</span>
      <span className="mg-odo-roll" aria-hidden="true">
        {text.split('').map((c, i) => (/\d/.test(c)
          ? <span key={i} className="mg-odo-col" style={{ '--n': c, '--i': i }}><span className="mg-odo-strip">{STRIP.map((d, k) => <span key={k}>{d}</span>)}</span></span>
          : <span key={i} className="mg-odo-ch">{c}</span>))}
      </span>
    </b>
  );
}

function Facts() {
  return (
    <section id="facts" className="lm-facts" aria-labelledby="facts-title">
      <div className="l5-wrap">
        <div className="lm-facts-top" data-reveal>
          <h2 id="facts-title" className="v8-h2">אתם מארחים. <span className="is-ind">atlas מסדר.</span></h2>
          <div className="lm-facts-people">
            <FaceStack keys={['noa', 'tom', 'shir', 'ben', 'yossi']} size={48} />
            <p>כל הערוצים בלוח אחד, והודעות וואטסאפ מוכנות לכל אורח.<small className="pp-b-note">אורחים לדוגמה, להמחשה</small></p>
          </div>
        </div>
        <ul className="lm-facts-row">
          {FACTS.map((f, i) => (
            <li key={f.u} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <Odo text={f.n} />
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
          <p className="lm-x-sub" data-reveal>14 ימי ניסיון חינם. שלושה צעדים, <span className="nw">10 דקות</span>, והלוח שלכם מוכן.</p>
          <ol className="mg-steps" data-reveal aria-label="איך מתחילים">
            {STEPS.map((s, i) => (
              <li key={s.title} style={{ '--i': i }}>
                <span className="mg-step-dot" aria-hidden="true"><span className="num">{i + 1}</span></span>
                <b>{s.title}</b>
                <small className="num">{s.time}</small>
              </li>
            ))}
          </ol>
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
  // One bottom bar: while the cookie row is waiting for an answer, this bar stays away.
  const [answered, setAnswered] = useState(false);
  useEffect(() => {
    if (readChoice()) { setAnswered(true); return undefined; }
    const done = () => setAnswered(true);
    window.addEventListener('atlas:cookie-choice', done);
    return () => window.removeEventListener('atlas:cookie-choice', done);
  }, []);
  useEffect(() => {
    const hero = document.querySelector('.ph-hero');
    const ends = [...document.querySelectorAll('#pricing, .lm-x, .l5-ftr')];
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
  const show = on && answered;
  return (
    <aside className={`lm-sticky${show ? ' is-on' : ''}`} aria-label="התחלת ניסיון חינם" aria-hidden={show ? undefined : 'true'}>
      <Link to="/register" tabIndex={show ? 0 : -1}>{CTA_SIGNUP}</Link>
      <span className="lm-sticky-note">{CTA_NOTE}</span>
    </aside>
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
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const idle = window.requestIdleCallback ? window.requestIdleCallback(castMagic, { timeout: 2500 }) : window.setTimeout(castMagic, 1200);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle));
  }, []);
  return (
    <div ref={root} className="l5 l7 v8 lm has-ph" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <HeroPhoto />
        <Part><Features /></Part>
        <Part><Facts /></Part>
        <LazyGrowth load={loadGrowth} className="lg-ph-s" />
        <Part><Pricing8 growth /></Part>
        <Part><Faq items={LANDING_FAQ} openFirst cta /></Part>
        <Part><Final /></Part>
        <Part><Credits8 /></Part>
      </main>
      <Part><Footer /></Part>
      <Part><StickyCta /></Part>
      <CookieConsent revealAfter=".ph-hero" variant="row" />
    </div>
  );
}
