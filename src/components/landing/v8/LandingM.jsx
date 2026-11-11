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
import { CalendarDays, MessageCircle, Wallet, Sun, RefreshCw, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { PRICING_PLANS, TRIAL_DAYS } from '@/config/pricing';
import { SignupButton } from '../v5/LandingV5';
import { fmt } from '../v5/motion';
import CookieConsent, { readChoice } from '@/components/landing/CookieConsent';
import { useReveal } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ, CTA_SIGNUP, CTA_NOTE } from '../v5/content';
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
import HeroPhoto from './HeroPhoto';
import LazyGrowth from './growth/LazyGrowth';
import { useLandingMotion } from './motion/landingMotion';
import './motion/landing-motion.css';
import './motion/landing-motion-m2.css';
import './mkt-b.css';
import { useLandingMotion3 } from './motion/landingMotion3';
import './motion/landing-motion-v3.css';
import './motion/landing-motion-v3b.css';

const loadGrowth = () => import('./growth/GrowthS');

const NAV = [['#how', 'איך מתחילים'], ['#features', 'המוצר'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

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
    tone: 'canvas', I: Wallet, id: 'payments', k: 'תשלומים', t: 'מי שילם, ומי עוד חייב.',
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
        {/* people photos B (#144): the owner in action with the real Today screen, and the host checking payments */}
        <div className="lm-feat-ppl">
          <div className="lm-feat-today pp-b-today" data-reveal>
            <figure className="pp-b-host"><Pic name="p-hostess" widths={[560, 1000]} ratio={0.8} sizes="(min-width: 1200px) 480px, (min-width: 900px) 40vw, 80vw" alt="בעלת מתחם מגישה מאפים לאורחים במרפסת" /></figure>
            <div className="pp-b-phone" data-sd="lift" role="img" aria-label="מסך ״היום״ של atlas בטלפון: מי מגיע היום, כמה נכנס החודש ותפוסה (נתוני דוגמה)">
              <img src="/landing-hero/ui-m-today-y3.webp" srcSet="/landing-hero/ui-m-today-y3-540.webp 540w, /landing-hero/ui-m-today-y3.webp 780w" sizes="230px" alt="" width="780" height="1688" loading="lazy" decoding="async" />
            </div>
            <div className="lm-chip is-d"><span className="lm-done"><Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />הגפן מוכנה לאורחים</span></div>
          </div>
          <div className="lm-feat-pay" data-reveal>
            <figure className="lm-feat-host"><Pic name="p-host" widths={[480, 840]} ratio={840 / 903} alt="בעל מתחם בודק את התשלומים במחשב, בשולחן עץ בחוץ" sizes="(min-width: 1200px) 400px, (min-width: 900px) 34vw, 70vw" /></figure>
            <img className="lm-feat-paid" data-sd="lift" src={`${UI}/y3-paid.webp`} alt="כרטיס הזמנה באפליקציה של atlas: ‏₪2,440 סה״כ, ‏₪1,200 שולם ו-‏₪1,240 יתרה (נתוני דוגמה)" width="740" height="642" loading="lazy" decoding="async" />
          </div>
          <p className="pp-b-cap lm-feat-cap">תרחיש לדוגמה, להמחשה: האורחים מגיעים, והיום כבר מסודר בטלפון.</p>
        </div>
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

/* ---------------- facts ---------------- */
const FACTS = [
  { n: '3', u: 'ערוצים', t: 'Airbnb, Booking.com וישיר על לוח אחד' },
  { n: '15', u: 'דקות', t: 'בערך כל כמה זמן הלוח מתעדכן מ-Booking ו-Airbnb' },
  { n: '14', u: 'ימים', t: 'ניסיון חינם, בלי כרטיס אשראי' },
  { n: '₪0', u: 'עמלה', t: 'על פניות מדף ההזמנה הישירה שלכם, כלול בכל חבילה' },
];

function Facts() {
  return (
    <section id="facts" className="lm-facts" aria-labelledby="facts-title">
      <div className="l5-wrap">
        <div className="lm-facts-top" data-reveal>
          <h2 id="facts-title" className="v8-h2">מה מקבלים, <span className="is-ind">בלי אותיות קטנות.</span></h2>
          <div className="lm-facts-people">
            <FaceStack keys={['noa', 'tom', 'shir', 'ben', 'yossi']} size={48} />
            <p>כל הערוצים בלוח אחד, והודעות וואטסאפ מוכנות לכל אורח.<small className="pp-b-note">אורחים לדוגמה, להמחשה</small></p>
          </div>
        </div>
        <ul className="lm-facts-row">
          {FACTS.map((f, i) => (
            <li key={f.u} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <b className="num" dir="ltr" data-count={/^\d+$/.test(f.n) ? f.n : undefined}>{f.n}</b>
              <span>{f.u}</span>
              <p>{f.t}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- how it works (marketingskills v1 B, 11.11.2026) ----------------
   Answers "is this easy for me?" for non-technical owners. Every step is true today: register asks for
   email and password only (no card), channels connect by pasting each calendar link once (05-channels),
   and atlas prepares the guest messages the owner picked; the owner sends them in one tap. No time promises. */
const STEPS_B = [
  { t: 'נרשמים', d: 'מייל וסיסמה. בלי כרטיס אשראי.' },
  { t: 'מחברים את Booking ו-Airbnb', d: 'מדביקים את קישור היומן מכל ערוץ, פעם אחת. ההזמנות נכנסות ללוח.' },
  { t: 'בוחרים הודעות לאורחים', d: 'מסמנים אילו הודעות atlas יכין לכל אורח, ומתי. אתם שולחים בלחיצה.' },
];

function Steps() {
  return (
    <section id="how" className="mb-steps" aria-labelledby="how-title">
      <div className="l5-wrap">
        <div className="mb-steps-head" data-reveal>
          <h2 id="how-title" className="v8-h2">ככה מתחילים.</h2>
          <p className="v8-txt">בלי התקנה ובלי כרטיס אשראי. נתקעתם? בן אדם עונה בוואטסאפ.</p>
        </div>
        <ol className="mb-steps-list">
          {STEPS_B.map((s, i) => (
            <li key={s.t} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <span className="mb-step-n num" aria-hidden="true">{i + 1}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mb-steps-cta" data-reveal><SignupButton className="is-lg" /></div>
      </div>
    </section>
  );
}

/* ---------------- founders offer (Deen, 08.11.2026; capture and details on /early) ----------------
   The first 50: personal setup by Deen, the annual monthly price on monthly billing locked while the
   subscription is active, 14 days free. Real cap, no remaining-spots number until a real counter exists. */
function Founders() {
  return (
    <section id="founders" className="mb-fnd" aria-labelledby="fnd-title">
      <div className="l5-wrap">
        <div className="mb-fnd-box" data-reveal>
          <h2 id="fnd-title" className="mb-fnd-top">
            <span className="mb-fnd-50 num">50</span>
            <span className="mb-fnd-h">המצטרפים הראשונים לתוכנית המייסדים מקבלים:</span>
          </h2>
          <ul className="mb-fnd-list">
            <li><Check size={20} strokeWidth={2.6} aria-hidden="true" /><div><h3>הקמה אישית</h3><p>מחברים לכם את Booking ו-Airbnb, מגדירים את היחידות ומכינים את נוסחי ההודעות.</p></div></li>
            <li><Check size={20} strokeWidth={2.6} aria-hidden="true" /><div><h3>מחיר מייסדים, נעול</h3><p>מחיר המסלול השנתי, בתשלום חודשי. נעול כל עוד המנוי פעיל.</p>
              <p className="mb-fnd-prices">{PRICING_PLANS.map((p) => <span key={p.key}>{p.nameHe} <bdi className="num" dir="ltr">₪{fmt(p.priceYearly)}</bdi> <s><bdi className="num" dir="ltr">₪{fmt(p.price)}</bdi></s></span>)}</p></div></li>
            <li><Check size={20} strokeWidth={2.6} aria-hidden="true" /><div><h3>{TRIAL_DAYS} יום חינם</h3><p>הכל פתוח, בלי כרטיס אשראי. לא יורד שקל בסוף הניסיון.</p></div></li>
          </ul>
          <div className="mb-fnd-cta">
            <Link to="/early" className="mb-fnd-btn"><span>שמרו לי מקום</span><ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" /></Link>
            <p className="mb-fnd-note">אחרי 50 המקומות, חוזרים למחיר הרגיל.</p>
          </div>
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
    const ends = [...document.querySelectorAll('#founders, #pricing, .lm-x, .l5-ftr')];
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
      <V7Header links={NAV} ctaShort="14 יום חינם" />
      <main id="main">
        <HeroPhoto />
        {/* marketingskills v1 B: how it works first, the founders offer right before the price, and the
            "בקרוב" growth section after pricing so it never stands between the decision and the price */}
        <Part><Steps /></Part>
        <Part><Features /></Part>
        <Part><Facts /></Part>
        <Part><Founders /></Part>
        <Part><Pricing8 growth founders={false} /></Part>
        <LazyGrowth load={loadGrowth} className="lg-ph-s" />
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
