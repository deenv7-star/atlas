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
 * and is labelled as such. 03.11.2026: every capture is the new UI Y3 (glass over a zimmer photo, navy bookings
 * panel: Today, calendar, money cards, booking detail), from a demo build of main 1d7426a. No testimonials, logos or customer counts.
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MessageCircle, Wallet, Sun, RefreshCw, Mic } from 'lucide-react';
import CookieConsent, { readChoice } from '@/components/landing/CookieConsent';
import { useReveal, prefersReducedMotion } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ, CTA_SIGNUP, CTA_NOTE } from '../v5/content';
import { V7Header } from '../v7/shared7';
import { UI, FACES, Face, WaBubble, Pricing8, CtaLinks, Credits8 } from './shared8';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-v8m.css';
import './faq-m.css';
import './landing-ux-1020.css';
import './landing-visual-v2.css';
import HeroPhoto from './HeroPhoto';
import { useLandingMotion } from './motion/landingMotion';
import './motion/landing-motion.css';
import './motion/landing-motion-m2.css';
import './voice-ship.css';
import './voice-stage.css';
import { useLandingMotion3 } from './motion/landingMotion3';
import './motion/landing-motion-v3.css';
import './motion/landing-motion-v3b.css';


const NAV = [['#voice', 'העוזר הקולי'], ['#features', 'המוצר'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];


/* ---------------- the voice stage (landing simplify V2, 12.11.2026) ----------------
   The voice assistant is the story: one phone with the three REAL AssistantScreen stills (video/teaser-voice-v3
   frames 205 / 244 / 296, example data) playing say -> card -> saved while the section is on screen.
   Truth: Hebrew speech (voice-session core.js 'he'); write tools only PROPOSE and the owner's tap saves
   (brain/tools.js, src/assistant/actions.js); propose_booking checks the unit is free. Reduced motion: no autoplay. */
const STAGE = [
  { img: 'say', t: 'אומרים', d: 'במילים שלכם, בעברית. בלי טפסים.', alt: 'העוזר הקולי באפליקציה של atlas: בעל המתחם אמר ״תוסיף לי הזמנה לצימר מיום חמישי לסופ״ש ליוסי ב-3,500 ש״ח״ (נתוני דוגמה)' },
  { img: 'card', t: 'atlas מכין', d: 'בודק שהיחידה פנויה ומכין את ההזמנה.', alt: 'כרטיס הזמנה חדשה שמחכה לאישור: צימר הזית, יום ה׳ 12.11 עד יום ש׳ 14.11, ‏₪3,500 (נתוני דוגמה)' },
  { img: 'saved', t: 'מאשרים', d: 'בלחיצה אחת. רק אז זה נשמר בלוח.', alt: 'אחרי האישור: ההזמנה נשמרה ומופיעה בלוח (נתוני דוגמה)' },
];
const STAGE_MS = 3200;

function VoiceStage() {
  const ref = useRef(null);
  const [cur, setCur] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;
    // a fast scroll can batch several records for this one target: the LAST one is the current state
    const io = new IntersectionObserver((entries) => setAuto(entries[entries.length - 1].isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto) return undefined;
    const t = window.setTimeout(() => setCur((c) => (c + 1) % STAGE.length), STAGE_MS);
    return () => window.clearTimeout(t);
  }, [auto, cur]);
  return (
    <section ref={ref} id="voice" className={`vt${auto ? ' is-auto' : ''}`} aria-labelledby="voice-title">
      <div className="l5-wrap">
        <div className="vt-grid">
          <div className="vt-copy">
            <p className="vt-k"><Mic size={16} strokeWidth={2.2} aria-hidden="true" />העוזר הקולי</p>
            <h2 id="voice-title" className="v8-h2 vt-h">בלי טפסים. <span className="is-ind">בלי להקליד.</span></h2>
            <ol className="vt-steps">
              {STAGE.map((s, i) => (
                <li key={s.img}>
                  <button type="button" className={`vt-step${i === cur ? ' is-on' : ''}`} aria-current={i === cur ? 'step' : undefined} onClick={() => { setCur(i); setAuto(false); }}>
                    <span className="vt-n num" aria-hidden="true">{i + 1}</span>
                    <span className="vt-t">{s.t}</span>
                    <span className="vt-bar" aria-hidden="true"><i key={`${cur}-${auto}`} /></span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="vt-d">{STAGE[cur].d}</p>
          </div>
          <figure className="vt-phone">
            <div className="vt-scr">
              {STAGE.map((s, i) => (
                <img key={s.img} className={i === cur ? 'is-on' : ''} aria-hidden={i === cur ? undefined : 'true'} src={`/landing-voice/vs-${s.img}-600.webp`} srcSet={`/landing-voice/vs-${s.img}-300.webp 300w, /landing-voice/vs-${s.img}-600.webp 600w`} sizes="(min-width: 900px) 300px, 230px" alt={s.alt} width="600" height="1067" loading="lazy" decoding="async" />
              ))}
            </div>
            <figcaption>צילומי מסך מהאפליקציה, נתוני דוגמה</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---------------- features: the four colour blocks as a bento of tiles + photos + channels ---------------- */
const TILES = [
  {
    tone: 'indigo', I: CalendarDays, id: 'calendar', k: 'לוח שנה', t: 'כל הערוצים. לוח אחד.',
    d: 'Booking, Airbnb והזמנות ישירות על לוח אחד. atlas מתריע לפני שרושמים הזמנה על לילה תפוס.',
    vis: (
      <div className="lm-tile-vis is-cal">
        <img src={`${UI}/y3-cal.webp`} alt="לוח השנה של atlas: ארבע יחידות, הזמנות מכל הערוצים על ציר אחד (נתוני דוגמה)" width="2182" height="934" loading="lazy" decoding="async" />
        <span className="lm-sync"><RefreshCw size={16} strokeWidth={2.4} aria-hidden="true" />הלוח מתעדכן בערך כל 15 דקות</span>
      </div>
    ),
  },
  {
    tone: 'canvas', I: MessageCircle, id: 'messages', k: 'הודעות', t: 'וואטסאפ לאורחים. מוכן מראש.',
    d: 'atlas מכין כל הודעה בזמן. אתם שולחים בלחיצה, מהוואטסאפ שלכם.',
    vis: (
      <div className="lm-tile-vis is-msg">
        <img className="lm-next-card" src={`${UI}/y3-next.webp`} alt="כרטיס ״הדבר הבא״ במסך היום של atlas: הודעת ״ברוכים הבאים״ למיכל לוי מוכנה לשליחה (נתוני דוגמה)" width="676" height="304" loading="lazy" decoding="async" />
        <WaBubble who="מיכל לוי" text="שלום מיכל, ברוכים הבאים לזית. מקווים שהגעתם בשלום. אם חסר משהו, כתבו לנו כאן ונדאג לזה." time="15:20" typing split />
      </div>
    ),
  },
  {
    tone: 'canvas', I: Wallet, id: 'payments', k: 'תשלומים', t: 'הכסף בשליטה. רואים הכל.',
    d: 'רושמים כל מקדמה ויתרה בלחיצה, ורואים מה פתוח ומה נכנס החודש.',
    vis: (
      <div className="lm-tile-vis is-chart">
        <img src={`${UI}/y3-money.webp`} alt="כרטיסי הכסף במסך היום של atlas: כמה נכנס החודש וכמה ממתין לתשלום (נתוני דוגמה)" width="676" height="340" loading="lazy" decoding="async" />
      </div>
    ),
  },
  {
    tone: 'navy', I: Sun, id: 'today', k: 'היום', t: 'היום שלכם, מסודר מראש.',
    d: 'כניסות, יציאות וניקיונות ברשימה אחת. מסמנים ״בוצע״ בלחיצה.',
    vis: (
      <div className="lm-tile-vis is-today">
        <img src={`${UI}/y3-today.webp`} alt="מסך היום של atlas: מי מגיע ומי יוצא היום, בכל יחידה (נתוני דוגמה)" width="676" height="1038" loading="lazy" decoding="async" />
      </div>
    ),
  },
];

function Features() {
  return (
    <section id="features" className="lm-feat is-tiles" aria-labelledby="feat-title">
      <div className="l5-wrap">
        <h2 id="feat-title" className="v8-h2 lm-feat-h" data-reveal>מההזמנה <span className="is-ind">ועד הניקיון.</span></h2>
        <ul className="lm-tiles">
          {TILES.map(({ id, tone, I, k, t, d, vis }, i) => (
            <li key={k} id={id} className={`lm-tile is-${tone}`} data-reveal style={{ '--d': `${i * 60}ms` }}>
              <div className="lm-tile-copy">
                <p className="lm-kick" data-ic><I size={20} strokeWidth={2} aria-hidden="true" focusable="false" />{k}</p>
                <h3>{t}</h3>
                <p className="lm-tile-txt">{d}</p>
              </div>
              {React.cloneElement(vis, { 'data-sd': 'settle' })}
            </li>
          ))}
        </ul>
        <div className="lm-feat-ch" data-reveal>
          <p>עובד עם מה שכבר יש לכם</p>
          <ul>
            <li style={{ '--i': 0 }}><Mark ch="airbnb" size={20} />Airbnb</li>
            <li style={{ '--i': 1 }}><Mark ch="booking" size={20} />Booking.com</li>
            <li style={{ '--i': 2 }}><Mark ch="whatsapp" size={20} />WhatsApp</li>
            <li style={{ '--i': 3 }}><Mark ch="google" size={20} />Google Calendar</li>
          </ul>
        </div>
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
          <p className="lm-x-sub" data-reveal>מחברים את Booking ו-Airbnb פעם אחת, ובן אדם עונה לכם בוואטסאפ 24/7, גם בשבת.</p>
          <div data-reveal><CtaLinks /></div>
          <div className="lm-x-shot" data-sd="tilt" aria-hidden="true">
            <img src="/landing-hero/ui-d-today-y3.webp" srcSet="/landing-hero/ui-d-today-y3-1200.webp 1200w, /landing-hero/ui-d-today-y3-1600.webp 1600w, /landing-hero/ui-d-today-y3-2080.webp 2080w, /landing-hero/ui-d-today-y3.webp 2400w" sizes="min(1040px, 90vw)" alt="" width="2400" height="1500" loading="lazy" decoding="async" />
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
  useLandingMotion(root);
  useLandingMotion3(root);
  return (
    <div ref={root} className="l5 l7 v8 lm has-ph" dir="rtl" lang="he">
      <div className="mo-prog" aria-hidden="true"><i /></div>
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <HeroPhoto />
        <Part><VoiceStage /></Part>
        <Part><Features /></Part>
        <Part><Pricing8 /></Part>
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
