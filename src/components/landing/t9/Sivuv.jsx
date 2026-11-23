/**
 * t9 · sivuv (reference: taster.co.il/templates/sivuv, a bold car-dealer page).
 * Order kept: fixed glass pill header (+ a bottom tab bar on phones) → full-bleed photo hero with the brand set
 * huge across it and one line under it → category cards overlapping the hero edge → statement with a highlighted
 * phrase → dark "which one fits you" quiz → card carousel with arrows → pinned "all in one place: <word>"
 * cycling words → choose-by-life tall photo cards → glass card over a photo (here: the voice stage) → alternating
 * photo rows with floating chips → gauge facts → bold indigo banner → (pricing, FAQ) → talk-to-us card →
 * magazine (blog) → navy footer card with the logo set huge.
 */
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Home, Mic, LayoutGrid, Tag, HelpCircle, Check, ArrowLeft } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ, WHATSAPP_URL, PHONE_DISPLAY } from '../v5/content';
import { Pricing8 } from '../v8/shared8';
import { PRICING_PLANS } from '@/config/pricing';
import VoiceStage from './VoiceStage';
import { H1, SUB, NOTE, NAV, FEATURES, FACTS, HERO_IMG, PH, UI, useT9Reveal, useScrub, Count, Logo, Cta, StoreBadges, Credits } from './common';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import '../v8/shared8.css';
import '../v8/faq-m.css';
import './t9-common.css';
import './t9-sivuv.css';

function Header() {
  return (
    <>
      <header className="sv-hdr">
        <Logo />
        <nav className="sv-nav" aria-label="ניווט ראשי">{NAV.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav>
        <div className="sv-hdr-end">
          <Link to="/login" className="sv-login">כניסה</Link>
          <Link to="/register" className="sv-hdr-cta">התחילו חינם</Link>
        </div>
      </header>
      <nav className="sv-tabbar" aria-label="ניווט מהיר">
        <a href="#main"><Home size={20} strokeWidth={2} aria-hidden="true" />בית</a>
        <a href="#voice"><Mic size={20} strokeWidth={2} aria-hidden="true" />העוזר</a>
        <a href="#features"><LayoutGrid size={20} strokeWidth={2} aria-hidden="true" />המוצר</a>
        <a href="#pricing"><Tag size={20} strokeWidth={2} aria-hidden="true" />מחירים</a>
        <a href="#faq"><HelpCircle size={20} strokeWidth={2} aria-hidden="true" />שאלות</a>
      </nav>
    </>
  );
}

function Hero() {
  return (
    <section className="sv-hero t9-hero" aria-labelledby="hero-title" data-scrub="leave">
      <picture className="sv-ph" aria-hidden="true">
        <source media="(max-aspect-ratio: 2/3)" type="image/webp" srcSet={`${HERO_IMG}/pool-p480.webp 480w, ${HERO_IMG}/pool-p720.webp 720w, ${HERO_IMG}/pool-p1080.webp 1080w`} sizes="100vw" />
        <img src={`${HERO_IMG}/pool-1920.webp`} srcSet={`${HERO_IMG}/pool-1280.webp 1280w, ${HERO_IMG}/pool-1920.webp 1920w, ${HERO_IMG}/pool-2560.webp 2560w`} sizes="100vw" alt="" width="1920" height="1440" fetchPriority="high" decoding="async" />
      </picture>
      <h1 id="hero-title" className="sv-h1">
        <span className="sr-only">atlas, מערכת ניהול לצימרים</span>
        <img className="sv-giant" src="/atlas-logo-white.svg" alt="" width="940" height="330" decoding="async" />
      </h1>
      <div className="sv-hero-foot">
        <p className="sv-tag">{H1.join(' ')}</p>
        <Cta className="is-white sv-hero-cta" />
      </div>
    </section>
  );
}

function Cats() {
  return (
    <ul className="sv-cats" aria-label="מה יש ב-atlas">
      {FEATURES.map((f, i) => (
        <li key={f.id} style={{ '--i': i }}>
          <a href={`#f-${f.id}`}>
            <span className="sv-cat-img"><img src={f.img} alt="" width={f.w} height={f.h} loading="lazy" decoding="async" /></span>
            <span className="sv-cat-t">{f.k}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Statement() {
  return (
    <section className="sv-sec sv-state" aria-labelledby="state-title">
      <div className="sv-wrap">
        <p className="sv-chip" data-r>מערכת ניהול לצימרים</p>
        <h2 id="state-title" className="sv-h2 is-big" data-r>הבוקר שלכם מתחיל<br /><span className="is-acc">מסודר.</span> פשוטו כמשמעו.</h2>
        <p className="sv-lead" data-r>{SUB}</p>
      </div>
    </section>
  );
}

const QUIZ = [
  { k: 'starter', l: 'מתחם אחד' },
  { k: 'pro', l: '2 עד 5 מתחמים' },
  { k: 'business', l: 'יותר מ-5 מתחמים' },
];

function Quiz() {
  const [pick, setPick] = useState(null);
  const plan = pick ? PRICING_PLANS.find((p) => p.key === pick) : null;
  return (
    <section className="sv-quiz-sec" aria-labelledby="quiz-title">
      <div className="sv-quiz" data-r>
        <p className="sv-chip is-dark">שאלה אחת</p>
        <h2 id="quiz-title" className="sv-quiz-h">איזו חבילה מתאימה לכם?</h2>
        <p className="sv-quiz-q" id="quiz-q">כמה מתחמים אתם מנהלים?</p>
        <div className="sv-quiz-opts" role="radiogroup" aria-labelledby="quiz-q">
          {QUIZ.map((q) => <button key={q.k} type="button" role="radio" aria-checked={pick === q.k} className={pick === q.k ? 'is-on' : ''} onClick={() => setPick(q.k)}>{q.l}</button>)}
        </div>
        <div className={`sv-quiz-res${plan ? ' is-on' : ''}`} aria-live="polite">
          {plan && (
            <>
              <p><b>{plan.nameHe}</b> · <span className="num" dir="ltr">₪{plan.price}</span> לחודש · {plan.desc}</p>
              <Link to={`/register?plan=${plan.key}`} className="sv-quiz-go">התחילו 14 יום חינם<ArrowLeft size={16} strokeWidth={2.4} aria-hidden="true" /></Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const CAROUSEL = [
  ...FEATURES.map((f) => ({ id: f.id, t: f.t, d: f.d, img: f.img, w: f.w, h: f.h, alt: f.alt })),
  { id: 'voice', t: 'עוזר קולי בעברית', d: 'אומרים מה צריך. atlas מכין, ואתם מאשרים בלחיצה.', img: '/landing-voice/vs-say-600.webp', w: 600, h: 1067, alt: 'העוזר הקולי של atlas (נתוני דוגמה)' },
];

function Carousel() {
  const track = useRef(null);
  const go = (dir) => { const el = track.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: 'smooth' }); };
  return (
    <section id="features" className="sv-sec sv-car-sec" aria-labelledby="car-title">
      <div className="sv-wrap sv-car-head">
        <h2 id="car-title" className="sv-h2" data-r>מה יש בפנים</h2>
        <div className="sv-arrows">
          <button type="button" onClick={() => go(1)} aria-label="הקודם"><ChevronRight size={20} strokeWidth={2.2} /></button>
          <button type="button" onClick={() => go(-1)} aria-label="הבא"><ChevronLeft size={20} strokeWidth={2.2} /></button>
        </div>
      </div>
      <ul ref={track} className="sv-car">
        {CAROUSEL.map((c, i) => (
          <li key={c.id} id={`f-${c.id}`} className={`sv-car-card is-${i % 3}`}>
            <div className="sv-car-vis"><img src={c.img} alt={c.alt} width={c.w} height={c.h} loading="lazy" decoding="async" /></div>
            <h3>{c.t}</h3>
            <p>{c.d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const WORDS = ['כל הערוצים', 'כל היחידות', 'כל האורחים', 'כל התשלומים'];

function AllInOne() {
  return (
    <section className="sv-all" aria-labelledby="all-title" data-scrub="pin" data-steps={WORDS.length}>
      <div className="sv-all-stick">
        <h2 id="all-title" className="sv-all-h">
          <span>הכל במקום אחד:</span>
          <span className="sv-all-words" aria-hidden="true">{WORDS.map((w, i) => <span key={w} style={{ '--k': i }}>{w}</span>)}</span>
          <span className="sr-only">{WORDS.join(', ')}</span>
        </h2>
        <span className="sv-all-dots" aria-hidden="true">{WORDS.map((w, i) => <i key={w} style={{ '--k': i }} />)}</span>
      </div>
    </section>
  );
}

const LIFE = [
  { img: `${PH}/n-woodtub.webp`, k: 'צימר זוגי', t: 'יחידה אחת, הכל בלוח' },
  { img: `${PH}/n-family.webp`, k: 'וילה למשפחות', t: 'מקדמות ויתרות במבט אחד' },
  { img: `${PH}/m-friends.webp`, k: 'מתחם לקבוצות', t: 'לכל יחידה מחיר משלה' },
  { img: `${PH}/n-lake.webp`, k: 'כמה מתחמים', t: 'עד 5, או בלי הגבלה' },
];

function Life() {
  return (
    <section className="sv-sec sv-life" aria-labelledby="life-title">
      <div className="sv-wrap">
        <h2 id="life-title" className="sv-h2" data-r>בוחרים לפי מה שמארחים</h2>
        <ul className="sv-life-row">
          {LIFE.map((l, i) => (
            <li key={l.k} data-r style={{ '--d': `${i * 80}ms` }}>
              <img src={l.img} alt="" width="900" height="1080" loading="lazy" decoding="async" />
              <span className="sv-life-cap"><small>{l.k}</small><b>{l.t}</b></span>
            </li>
          ))}
        </ul>
        <p className="sv-fine">צילומים להמחשה, לא לקוחות.</p>
      </div>
    </section>
  );
}

function Drive() {
  return (
    <div className="sv-drive">
      <img className="sv-drive-ph" src={`${PH}/m-tub.webp`} alt="" width="1400" height="933" loading="lazy" decoding="async" />
      <div className="sv-drive-card"><VoiceStage className="sv-voice" /></div>
    </div>
  );
}

function Rows() {
  return (
    <section className="sv-sec sv-rows" aria-labelledby="rows-title">
      <div className="sv-wrap">
        <h2 id="rows-title" className="sv-h2 is-c" data-r>גם הכסף בלי הפתעות.</h2>
        <div className="sv-row" data-r>
          <div className="sv-row-ph">
            <img src={`${PH}/n-work.webp`} alt="זוג עובר על החשבונות מול מחשב נייד" width="1200" height="800" loading="lazy" decoding="async" />
            <img className="sv-row-chip" src={`${UI}/y3-money.webp`} alt="כרטיסי הכסף של atlas (נתוני דוגמה)" width="676" height="340" loading="lazy" decoding="async" />
            <span className="sv-row-badge"><b>בלי עמלה</b><small>בהזמנה ישירה</small></span>
          </div>
          <div className="sv-row-copy">
            <h3>מקדמות ויתרות, בלחיצה.</h3>
            <p>רושמים כל תשלום, ורואים מה שולם ומה עוד פתוח. בסוף החודש מורידים דוח מסודר לרואה החשבון.</p>
            <ul><li><Check size={16} strokeWidth={2.6} aria-hidden="true" />מעקב מקדמות ויתרות</li><li><Check size={16} strokeWidth={2.6} aria-hidden="true" />דוח חודשי להורדה</li><li><Check size={16} strokeWidth={2.6} aria-hidden="true" />דף הזמנה ישירה משלכם</li></ul>
          </div>
        </div>
        <div className="sv-row is-rev" data-r>
          <div className="sv-row-ph">
            <img src={`${PH}/n-selfie.webp`} alt="אורחים מצטלמים בחופשה" width="1200" height="800" loading="lazy" decoding="async" />
            <img className="sv-row-chip" src={`${UI}/y3-next.webp`} alt="הודעת ברוכים הבאים מוכנה לשליחה (נתוני דוגמה)" width="676" height="304" loading="lazy" decoding="async" />
          </div>
          <div className="sv-row-copy">
            <h3>הודעות לאורחים, מוכנות מראש.</h3>
            <p>אישור הזמנה, הוראות הגעה יום לפני ותודה. לוחצים, הוואטסאפ שלכם נפתח עם ההודעה, ושולחים.</p>
            <ul><li><Mark ch="whatsapp" size={16} />שולחים מהוואטסאפ שלכם</li><li><Check size={16} strokeWidth={2.6} aria-hidden="true" />נוסח מוכן בעברית</li></ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gauges() {
  const pct = [0.47, 1, 0.25];
  return (
    <section className="sv-sec sv-gauges" aria-label="עובדות">
      <ul className="sv-wrap sv-g-row">
        {FACTS.map((f, i) => (
          <li key={f.l} data-r style={{ '--d': `${i * 90}ms`, '--g': pct[i] }}>
            <svg viewBox="0 0 120 70" aria-hidden="true"><path d="M10 64a50 50 0 0 1 100 0" className="sv-g-bg" /><path d="M10 64a50 50 0 0 1 100 0" className="sv-g-fg" pathLength="1" /></svg>
            <b><Count to={f.v} pre={f.pre} suf={f.suf} /></b>
            <span>{f.l}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Banner() {
  return (
    <section className="sv-sec sv-banner-sec" aria-labelledby="ban-title">
      <div className="sv-wrap sv-banner" data-r>
        <div className="sv-banner-copy">
          <h2 id="ban-title" className="sv-h2">בן אדם עונה.<br />24/7, גם בשבת.</h2>
          <p>נתקעתם? כותבים בוואטסאפ, ואדם אמיתי עוזר להעביר את מה שיש לכם היום.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="t9-btn is-white"><span>כתבו לנו בוואטסאפ</span><i className="t9-btn-ar" aria-hidden="true"><Mark ch="whatsapp" size={18} /></i></a>
        </div>
        <img className="sv-banner-ph" src={`${PH}/p-hostess-560.webp`} alt="" width="560" height="700" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}

function Talk() {
  return (
    <section className="sv-sec sv-talk" aria-labelledby="talk-title">
      <div className="sv-wrap sv-talk-grid">
        <div data-r>
          <p className="sv-chip">מתחילים</p>
          <h2 id="talk-title" className="sv-h2">בואו להתחיל.<br />14 יום עלינו.</h2>
          <p className="sv-lead">{NOTE}. רוצים לשאול קודם? וואטסאפ <span dir="ltr" className="num">{PHONE_DISPLAY}</span>.</p>
          <div className="sv-talk-act"><Cta /><StoreBadges /></div>
        </div>
        <figure className="sv-talk-ph" data-r><img src={`${PH}/m-hostess.webp`} alt="מארחת מקבלת אורחים" width="900" height="1000" loading="lazy" decoding="async" /></figure>
      </div>
    </section>
  );
}

const MAG = [
  { to: '/blog/channel-manager-zimmer', img: `${PH}/n-work.webp`, t: 'סנכרון יומנים לצימרים: iCal מול Channel Manager' },
  { to: '/blog/whatsapp-guest-messages', img: `${PH}/n-smile.webp`, t: 'הודעות וואטסאפ לאורחים בצימר: 7 תבניות מוכנות' },
  { to: '/blog/cleaning-turnover-checklist', img: `${PH}/m-clean.webp`, t: 'צ\'קליסט ניקיון והחלפת אורחים בצימר' },
];

function Magazine() {
  return (
    <section className="sv-sec sv-mag" aria-labelledby="mag-title">
      <div className="sv-wrap">
        <div className="sv-car-head"><h2 id="mag-title" className="sv-h2" data-r>המגזין, למארחים שאוהבים לדעת</h2><Link to="/blog" className="sv-more">לכל המאמרים</Link></div>
        <ul className="sv-mag-row">
          {MAG.map((m, i) => (
            <li key={m.to} data-r style={{ '--d': `${i * 80}ms` }}>
              <Link to={m.to}><span className="sv-mag-img"><img src={m.img} alt="" width="1200" height="800" loading="lazy" decoding="async" /></span><b>{m.t}</b></Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Sivuv() {
  const root = useRef(null);
  useT9Reveal(root);
  useScrub(root);
  return (
    <div ref={root} className="l5 l7 v8 lm t9 t9-sivuv" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        <Hero />
        <Cats />
        <Statement />
        <Quiz />
        <Carousel />
        <AllInOne />
        <Life />
        <Drive />
        <Rows />
        <Gauges />
        <Banner />
        <Pricing8 />
        <Faq items={LANDING_FAQ} openFirst cta />
        <Talk />
        <Magazine />
      </main>
      <div className="sv-foot">
        <Footer />
        <img className="sv-foot-giant" src="/atlas-logo-white.svg" alt="" width="940" height="330" loading="lazy" decoding="async" />
        <Credits />
      </div>
      <CookieConsent revealAfter=".t9-hero" variant="row" />
    </div>
  );
}
