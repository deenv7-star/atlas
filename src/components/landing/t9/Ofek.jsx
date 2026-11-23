/**
 * t9 · ofek (reference: taster.co.il/templates/ofek, a calm fintech page over a landscape photo).
 * Order kept: sticky glass pill header with an underline that follows the section → landscape hero in a rounded
 * inset frame (eyebrow pill, thin oversized h1 with a glass tile inside the line, one glowing CTA, three points)
 * → the product rises over the hero on scroll → partner strip (here: the channels, as a marquee) → "less noise"
 * heading that de-blurs + a dial that switches before / with atlas → capability bento → three steps in rows →
 * who it is for (photo cards) → connections arc over the landscape → six-feature grid → (pricing in the
 * testimonials slot) → FAQ + side card → footer card floating over the landscape.
 */
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, CalendarDays, MessageCircle, Wallet, Sun, ShieldCheck, Download, Users, Sparkles, ArrowLeft, Check } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { Mark, Wordmark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ } from '../v5/content';
import { Pricing8 } from '../v8/shared8';
import VoiceStage from './VoiceStage';
import { H1, SUB, NOTE, FEATURES, STEPS3, BEFORE, AFTER, CHANNELS, PH, T9, UI, SCREENS, useT9Reveal, useScrub, useSpy, Cta, StoreBadges, DeskShot, Phone, Credits } from './common';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import '../v8/shared8.css';
import '../v8/faq-m.css';
import './t9-common.css';
import './t9-ofek.css';

const NAV = [['features', 'המוצר'], ['story', 'לפני ואחרי'], ['voice', 'העוזר הקולי'], ['pricing', 'מחירים']];

function Header() {
  const cur = useSpy(NAV.map(([i]) => i));
  const idx = NAV.findIndex(([i]) => i === cur);
  return (
    <div className="of-hdr-wrap">
      <header className="of-hdr">
        <Link to="/" className="t9-logo" aria-label="atlas, לדף הבית"><Wordmark /></Link>
        <nav className="of-nav" aria-label="ניווט ראשי" style={{ '--i': idx, '--on': idx < 0 ? 0 : 1 }}>
          {NAV.map(([id, l], i) => <a key={id} href={`#${id}`} className={i === idx ? 'is-on' : ''}>{l}</a>)}
          <span className="of-nav-line" aria-hidden="true" />
        </nav>
        <Link to="/register" className="of-hdr-cta"><i aria-hidden="true"><ArrowLeft size={15} strokeWidth={2.4} /></i>התחילו חינם</Link>
      </header>
    </div>
  );
}

function Hero() {
  return (
    <section className="of-hero t9-hero" aria-labelledby="hero-title" data-scrub="leave">
      <div className="of-frame">
        <picture className="of-ph" aria-hidden="true">
          <source media="(max-aspect-ratio: 3/4)" srcSet={`${T9}/galil-p540.webp 540w, ${T9}/galil-p900.webp 900w`} sizes="100vw" />
          <img src={`${T9}/galil-1920.webp`} srcSet={`${T9}/galil-1280.webp 1280w, ${T9}/galil-1920.webp 1920w, ${T9}/galil-2560.webp 2560w`} sizes="100vw" alt="" width="1920" height="1079" fetchPriority="high" decoding="async" />
        </picture>
        <div className="of-hero-in">
          <a href="#story" className="of-eyebrow of-in" style={{ '--d': '0ms' }}><i aria-hidden="true" />כל המתחם במקום אחד<ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" /></a>
          <h1 id="hero-title" className="of-h1 of-in" style={{ '--d': '100ms' }}>
            {H1[0]} <span className="of-tile" aria-hidden="true"><Mic size={44} strokeWidth={2} /></span> {H1[1]}
          </h1>
          <p className="of-sub of-in" style={{ '--d': '220ms' }}>{SUB}</p>
          <div className="of-cta of-in" style={{ '--d': '320ms' }}><Cta className="of-glow" /></div>
          <p className="of-note of-in" style={{ '--d': '380ms' }}>{NOTE}</p>
          <ul className="of-points of-in" style={{ '--d': '460ms' }}>
            <li><i><CalendarDays size={14} strokeWidth={2.4} /></i>לוח אחד לכל הערוצים</li>
            <li><i><Mic size={14} strokeWidth={2.4} /></i>עוזר קולי בעברית</li>
            <li><i><MessageCircle size={14} strokeWidth={2.4} /></i>וואטסאפ מוכן לאורחים</li>
          </ul>
        </div>
      </div>
      <div className="of-rise"><DeskShot /></div>
    </section>
  );
}

function Strip() {
  const row = [...CHANNELS, ...CHANNELS, ...CHANNELS];
  return (
    <section className="of-strip" aria-label="עובד עם מה שכבר יש לכם">
      <p className="of-pill">עובד עם מה שכבר יש לכם</p>
      <div className="of-marq" aria-hidden="true"><div className="of-marq-in">{[...row, ...row].map(([c, l], i) => <span key={i}><Mark ch={c} size={22} />{l}</span>)}</div></div>
      <ul className="sr-only">{CHANNELS.map(([c, l]) => <li key={c}>{l}</li>)}</ul>
    </section>
  );
}

function Story() {
  const [on, setOn] = useState(false);
  return (
    <section id="story" className="of-sec of-story" aria-labelledby="story-title">
      <div className="of-wrap">
        <h2 id="story-title" className="of-h2 is-c" data-r>פחות בלגן. יותר זמן לאורחים.</h2>
        <div className={`of-dialbox${on ? ' is-after' : ''}`} data-r>
          <button type="button" className="of-dial" aria-pressed={on} aria-label={on ? 'הציגו את המצב בלי atlas' : 'הציגו את המצב עם atlas'} onClick={() => setOn((v) => !v)}>
            <span className="of-dial-knob"><i /></span>
          </button>
          <div className="of-dial-tabs" aria-hidden="true"><span className={on ? '' : 'is-on'}><em className="num">01</em>בלי atlas</span><span className={on ? 'is-on' : ''}><em className="num">02</em>עם atlas</span></div>
          <div className="of-panel is-before" aria-hidden={on ? 'true' : undefined}>
            <h3>ככה זה נראה היום</h3>
            <ul>{BEFORE.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
          <div className="of-panel is-after" aria-hidden={on ? undefined : 'true'}>
            <h3>ככה זה נראה עם atlas</h3>
            <ul>{AFTER.map((b) => <li key={b}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{b}</li>)}</ul>
          </div>
          <p className="of-dial-hint">סובבו את הכפתור</p>
        </div>
      </div>
    </section>
  );
}

function Bento() {
  return (
    <section id="features" className="of-sec of-bento-sec" aria-labelledby="bento-title">
      <div className="of-wrap">
        <header className="of-head" data-r>
          <p className="of-pill">יכולות</p>
          <h2 id="bento-title" className="of-h2">כל מה שצריך כדי לארח בראש שקט</h2>
        </header>
        <div className="of-bento">
          <article className="of-b is-dark" data-r>
            <h3>אומרים, וזה מוכן</h3>
            <p>הזמנה, הודעה לאורח או מי עוד חייב. atlas מכין, אתם מאשרים.</p>
            <Phone screens={[SCREENS.card]} className="of-b-phone" />
            <a href="#voice" className="of-b-link">לעוזר הקולי<ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" /></a>
          </article>
          <article className="of-b is-photo" data-r style={{ '--d': '90ms' }}>
            <img src={`${PH}/n-family.webp`} alt="משפחה מגיעה לחופשה" width="1000" height="1050" loading="lazy" decoding="async" />
            <span className="of-b-chip"><Sun size={16} strokeWidth={2.4} aria-hidden="true" /><span><b>מגיעים היום</b><small>מסך ״היום״ · דוגמה</small></span></span>
            <h3>היום שלכם, מסודר מראש</h3>
          </article>
          <article className="of-b is-white" data-r style={{ '--d': '180ms' }}>
            <h3>{FEATURES[0].t}</h3>
            <p>{FEATURES[0].d}</p>
            <img src={FEATURES[0].img} alt={FEATURES[0].alt} width={FEATURES[0].w} height={FEATURES[0].h} loading="lazy" decoding="async" />
          </article>
          <article className="of-b is-white" data-r style={{ '--d': '240ms' }}>
            <h3>{FEATURES[2].t}</h3>
            <p>{FEATURES[2].d}</p>
            <img src={FEATURES[2].img} alt={FEATURES[2].alt} width={FEATURES[2].w} height={FEATURES[2].h} loading="lazy" decoding="async" />
          </article>
        </div>
      </div>
    </section>
  );
}

const STEP_IMG = [`${UI}/y3-cal.webp`, `${UI}/y3-today.webp`, '/landing-voice/vs-card-600.webp'];

function Steps() {
  return (
    <section id="how" className="of-sec of-steps" aria-labelledby="steps-title">
      <div className="of-wrap">
        <header className="of-head" data-r>
          <p className="of-pill">איך מתחילים</p>
          <h2 id="steps-title" className="of-h2">מתחילים לעבוד בתוך כמה דקות</h2>
        </header>
        <ol className="of-rows">
          {STEPS3.map((s, i) => (
            <li key={s.n} className="of-row" data-r>
              <div className="of-row-copy">
                <span className="of-pill is-sm num">שלב {i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
              <div className={`of-row-vis is-${i}`}><img src={STEP_IMG[i]} alt="" width="676" height="1038" loading="lazy" decoding="async" /></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const WHO = [
  { img: `${PH}/n-host.webp`, t: 'צימר אחד', d: 'כל ההזמנות בלוח אחד, וכל הודעה מוכנה בזמן.' },
  { img: `${PH}/p-hostess-560.webp`, t: 'וילה לאירוח', d: 'מקדמות ויתרות במבט אחד.' },
  { img: `${PH}/m-host.webp`, t: 'מתחם עם כמה יחידות', d: 'לכל יחידה שורה ומחיר משלה.' },
  { img: `${PH}/n-calm.webp`, t: 'כמה מתחמים', d: 'עד 5 מתחמים, או בלי הגבלה.' },
];

function Who() {
  return (
    <section className="of-sec of-who" aria-labelledby="who-title">
      <div className="of-wrap">
        <header className="of-head" data-r>
          <p className="of-pill">למי זה מתאים</p>
          <h2 id="who-title" className="of-h2">בנוי למי שמארח, לא למי שיושב מול מחשב</h2>
        </header>
        <ul className="of-who-row">
          {WHO.map((w, i) => (
            <li key={w.t} data-r style={{ '--d': `${i * 80}ms` }}>
              <img src={w.img} alt="" width="560" height="700" loading="lazy" decoding="async" />
              <span className="of-who-cap"><b>{w.t}</b><small>{w.d}</small></span>
            </li>
          ))}
        </ul>
        <p className="of-fine">צילומים להמחשה, לא לקוחות.</p>
      </div>
    </section>
  );
}

function Connect() {
  return (
    <section className="of-sec of-connect" aria-labelledby="con-title">
      <div className="of-connect-card" data-r>
        <div className="of-connect-copy">
          <p className="of-pill">חיבורים</p>
          <h2 id="con-title" className="of-h2">מתחבר למה שכבר יש לכם</h2>
          <Cta className="is-dark">חברו את Booking</Cta>
        </div>
        <div className="of-arc" aria-hidden="true">
          {CHANNELS.map(([c], i) => <span key={c} className={`of-arc-i is-${i}`}><Mark ch={c} size={22} /></span>)}
          <span className="of-arc-c"><img src="/atlas-mark-white.svg" alt="" width="40" height="20" /></span>
        </div>
        <img className="of-connect-ph" src={`${T9}/galil-1280.webp`} alt="" width="1280" height="719" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}

const GRID = [
  { I: CalendarDays, t: 'התראה על הזמנות חופפות', d: 'atlas מתריע לפני שרושמים הזמנה על לילה תפוס.' },
  { I: Sparkles, t: 'דף הזמנה ישירה משלכם', d: 'אורחים מזמינים ישירות, בלי עמלה.' },
  { I: Sun, t: 'משימות ניקיון', d: 'מי מנקה, איפה ומתי, ברשימה אחת.' },
  { I: Download, t: 'דוח חודשי לרואה החשבון', d: 'להורדה ולהדפסה, בלחיצה.' },
  { I: ShieldCheck, t: 'גיבוי יומי מוצפן', d: 'הנתונים שלכם, ואפשר להוריד אותם לאקסל בכל רגע.' },
  { I: Users, t: 'תמיכה אנושית 24/7', d: 'בן אדם עונה בוואטסאפ, גם בשבת.' },
];

function Grid() {
  return (
    <section className="of-sec of-grid-sec" aria-labelledby="grid-title">
      <div className="of-wrap">
        <header className="of-head" data-r>
          <h2 id="grid-title" className="of-h2">כל מה שצריך, בלי מה שלא</h2>
        </header>
        <ul className="of-grid">
          {GRID.map(({ I, t, d }, i) => (
            <li key={t} data-r style={{ '--d': `${(i % 3) * 80}ms` }}>
              <i aria-hidden="true"><I size={20} strokeWidth={2} /></i>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FooterCard() {
  return (
    <section className="of-end" aria-labelledby="end-title">
      <img className="of-end-ph" src={`${T9}/galil-1920.webp`} alt="" width="1920" height="1079" loading="lazy" decoding="async" />
      <div className="of-end-card" data-r>
        <div>
          <h2 id="end-title" className="of-h2">אפשר להתחיל היום.</h2>
          <p>14 יום חינם, הכל פתוח. {NOTE}.</p>
        </div>
        <div className="of-end-act"><Cta className="is-dark" /><StoreBadges /></div>
      </div>
    </section>
  );
}

export default function Ofek() {
  const root = useRef(null);
  useT9Reveal(root);
  useScrub(root);
  return (
    <div ref={root} className="l5 l7 v8 lm t9 t9-ofek" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        <Hero />
        <Strip />
        <Story />
        <Bento />
        <VoiceStage className="of-voice" />
        <Steps />
        <Who />
        <Connect />
        <Grid />
        <Pricing8 />
        <Faq items={LANDING_FAQ} openFirst cta />
        <FooterCard />
        <Credits />
      </main>
      <Footer />
      <CookieConsent revealAfter=".t9-hero" variant="row" />
    </div>
  );
}
