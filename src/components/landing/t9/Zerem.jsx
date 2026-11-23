/**
 * t9 · zerem (reference: taster.co.il/templates/zerem, "זרם · מוצר אוטומציות").
 * Order kept: floating pill header → sky hero (eyebrow pill, 2-line h1 with one accent phrase, two pill CTAs,
 * product window that un-tilts on scroll with live cursors) → "about" statement that sharpens word by word, with
 * photos and counters → features bento → how it works (3 connected cards) → (voice stage in the cases slot) →
 * connections orbit → pricing → FAQ + side card → final CTA card with rings → footer; bottom dock after the hero.
 * The reference's testimonials section is left out on purpose: atlas has no real customer quotes yet.
 */
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mic, ArrowUp, CalendarDays, MessageCircle, Wallet, Sun } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ, CTA_SIGNUP } from '../v5/content';
import { Pricing8, FACES, Face } from '../v8/shared8';
import VoiceStage from './VoiceStage';
import { H1, SUB, NOTE, NAV, FEATURES, STEPS3, FACTS, CHANNELS, PH, T9, useT9Reveal, useScrub, useScrolled, useAfterHero, Count, Words, Logo, Cta, Ghost, StoreBadges, DeskShot, Credits } from './common';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import '../v8/shared8.css';
import '../v8/faq-m.css';
import './t9-common.css';
import './t9-zerem.css';

const ICONS = { calendar: CalendarDays, messages: MessageCircle, payments: Wallet, today: Sun };

function Header() {
  const s = useScrolled(12);
  return (
    <div className="zr-hdr-wrap">
      <header className={`zr-hdr${s ? ' is-s' : ''}`}>
        <Logo />
        <nav className="zr-nav" aria-label="ניווט ראשי">{NAV.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav>
        <div className="zr-hdr-end">
          <Link to="/login" className="zr-login">כניסה</Link>
          <Link to="/register" className="zr-hdr-cta">התחילו חינם</Link>
        </div>
      </header>
    </div>
  );
}

function Hero() {
  return (
    <section className="zr-hero t9-hero" aria-labelledby="hero-title">
      <picture className="zr-sky" aria-hidden="true">
        <source media="(max-aspect-ratio: 3/4)" srcSet={`${T9}/sky-p540.webp 540w, ${T9}/sky-p900.webp 900w`} sizes="100vw" />
        <img src={`${T9}/sky-1920.webp`} srcSet={`${T9}/sky-1280.webp 1280w, ${T9}/sky-1920.webp 1920w, ${T9}/sky-2560.webp 2560w`} sizes="100vw" alt="" width="1920" height="1440" fetchPriority="high" decoding="async" />
      </picture>
      <div className="zr-hero-in">
        <p className="zr-eyebrow zr-in" style={{ '--d': '0ms' }}>
          <span className="zr-eyebrow-faces" aria-hidden="true">{['noa', 'tom', 'maya'].map((k) => <Face key={k} f={FACES[k]} size={24} lazy={false} />)}</span>
          מערכת ניהול לצימרים, עם עוזר קולי בעברית
        </p>
        <h1 id="hero-title" className="zr-h1">
          <span className="zr-line"><span style={{ '--d': '80ms' }}>{H1[0]}</span></span>
          <span className="zr-line"><span className="is-acc" style={{ '--d': '180ms' }}>{H1[1]}</span></span>
        </h1>
        <p className="zr-sub zr-in" style={{ '--d': '320ms' }}>{SUB}</p>
        <div className="zr-ctas zr-in" style={{ '--d': '420ms' }}>
          <Cta className="is-dark" />
          <Ghost href="#voice">איך זה עובד</Ghost>
        </div>
        <p className="zr-note zr-in" style={{ '--d': '480ms' }}>{NOTE}</p>
      </div>
      <div className="zr-stage" data-scrub="enter">
        <div className="zr-tilt">
          <DeskShot eager />
          <span className="zr-cur is-a" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 1l11 6-5 1.4L6 14z" /></svg><b>נועה · מאשרת הזמנה</b></span>
          <span className="zr-cur is-b" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 1l11 6-5 1.4L6 14z" /></svg><b>atlas · מכין הודעה</b></span>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="zr-sec zr-about" aria-labelledby="about-title">
      <div className="zr-wrap zr-about-grid">
        <figure className="zr-about-ph is-a" data-r><img src={`${PH}/n-host.webp`} alt="מארח מחייך עם טלפון ביד" width="1000" height="1058" loading="lazy" decoding="async" /></figure>
        <div className="zr-about-mid" data-scrub="view">
          <p className="zr-pill" data-r><Mic size={14} strokeWidth={2.4} aria-hidden="true" />נבנה בישראל, בעברית</p>
          <h2 id="about-title" className="zr-h2 zr-about-h"><Words text="בלי טפסים ובלי להקליד. אומרים מה צריך, ו-atlas מכין." /></h2>
          <ul className="zr-facts">
            {FACTS.map((f) => (
              <li key={f.l} data-r><b><Count to={f.v} pre={f.pre} suf={f.suf} /></b><span>{f.l}</span></li>
            ))}
          </ul>
        </div>
        <div className="zr-about-side">
          <p data-r>צימרים, וילות ומתחמי אירוח. כל מי שמבזבז ערב בשבוע על לוחות, הודעות ותשלומים, שמחשב יכול להכין לבד.</p>
          <Ghost href="#how" className="is-dark-ar">איך מתחילים</Ghost>
          <figure className="zr-about-ph is-b" data-r><img src={`${PH}/n-work.webp`} alt="זוג עובד יחד מול מחשב נייד" width="1200" height="800" loading="lazy" decoding="async" /></figure>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="zr-sec zr-feat" aria-labelledby="feat-title">
      <div className="zr-wrap">
        <header className="zr-head" data-r>
          <p className="zr-pill">מה בפנים</p>
          <h2 id="feat-title" className="zr-h2">כל מה שמתחם צריך, במקום אחד</h2>
          <p className="zr-lead">מההזמנה ועד הניקיון. בלי מחברת, בלי אקסל.</p>
        </header>
        <ul className="zr-bento">
          {FEATURES.map((f, i) => {
            const I = ICONS[f.id];
            return (
              <li key={f.id} id={f.id} className={`zr-card is-${f.id}`} data-r style={{ '--d': `${i * 70}ms` }}>
                <div className="zr-card-copy">
                  <h3><I size={18} strokeWidth={2.2} aria-hidden="true" />{f.t}</h3>
                  <p>{f.d}</p>
                </div>
                <div className="zr-card-vis"><img src={f.img} alt={f.alt} width={f.w} height={f.h} loading="lazy" decoding="async" /></div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="how" className="zr-sec zr-how" aria-labelledby="how-title">
      <div className="zr-wrap">
        <header className="zr-head" data-r>
          <p className="zr-pill">איך מתחילים</p>
          <h2 id="how-title" className="zr-h2">מהחיבור הראשון ללוח מסודר</h2>
        </header>
        <ol className="zr-steps">
          {STEPS3.map((s, i) => (
            <li key={s.n} className="zr-step" data-r style={{ '--d': `${i * 120}ms` }}>
              <div className="zr-step-vis" aria-hidden="true">
                {i === 0 && <ul className="zr-mini">{CHANNELS.slice(0, 3).map(([c, l]) => <li key={c}><Mark ch={c} size={18} />{l}<i className="zr-tog" /></li>)}</ul>}
                {i === 1 && <ul className="zr-mini">{['צימר הזית', 'צימר האלון', 'סוויטת הגפן'].map((u) => <li key={u}><span className="zr-dot" />{u}<small>דוגמה</small></li>)}</ul>}
                {i === 2 && <div className="zr-say"><Mic size={16} strokeWidth={2.4} /><span>״הזמנה ליוסי לסופ״ש״</span></div>}
              </div>
              <span className="zr-step-n num">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Connect() {
  return (
    <section className="zr-sec zr-connect" aria-labelledby="con-title">
      <div className="zr-wrap zr-orbit" data-r>
        {CHANNELS.map(([c, l], i) => <span key={c} className={`zr-orb is-${i}`} title={l}><Mark ch={c} size={26} /></span>)}
        <p className="zr-pill">חיבורים</p>
        <h2 id="con-title" className="zr-h2">עובד עם מה שכבר יש לכם.</h2>
        <p className="zr-lead">Booking, Airbnb, וואטסאפ ו-Google Calendar. מחברים פעם אחת, וכל השאר קורה בלוח.</p>
      </div>
    </section>
  );
}

function Final() {
  return (
    <section className="zr-sec zr-final" aria-labelledby="final-title">
      <div className="zr-wrap">
        <div className="zr-final-card" data-r>
          <span className="zr-rings" aria-hidden="true"><i /><i /><i /><i /></span>
          <p className="zr-pill">מתחילים</p>
          <h2 id="final-title" className="zr-h2">הלוח הראשון מוכן תוך כמה דקות.</h2>
          <p className="zr-lead">מחברים את Booking ו-Airbnb פעם אחת, ובן אדם עונה לכם בוואטסאפ 24/7, גם בשבת.</p>
          <div className="zr-ctas"><Cta className="is-dark" /></div>
          <p className="zr-note">{NOTE}</p>
          <StoreBadges className="zr-stores" />
        </div>
      </div>
    </section>
  );
}

function Dock() {
  const on = useAfterHero('.t9-hero', '.zr-final, .l5-ftr');
  return (
    <aside className={`zr-dock${on ? ' is-on' : ''}`} aria-hidden={on ? undefined : 'true'}>
      <Link to="/register" className="zr-dock-bar" tabIndex={on ? 0 : -1} aria-label={`${CTA_SIGNUP}: נסו את העוזר הקולי`}>
        <span className="zr-dock-mic" aria-hidden="true"><Mic size={16} strokeWidth={2.4} /></span>
        <span className="zr-dock-txt">״תוסיף הזמנה ליוסי לסופ״ש״. ככה מדברים עם atlas</span>
        <span className="zr-dock-go" aria-hidden="true"><ArrowUp size={18} strokeWidth={2.4} /></span>
      </Link>
    </aside>
  );
}

export default function Zerem() {
  const root = useRef(null);
  useT9Reveal(root);
  useScrub(root);
  return (
    <div ref={root} className="l5 l7 v8 lm t9 t9-zerem" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Features />
        <How />
        <VoiceStage className="zr-voice" />
        <Connect />
        <Pricing8 />
        <Faq items={LANDING_FAQ} openFirst cta />
        <Final />
        <Credits />
      </main>
      <Footer />
      <Dock />
      <CookieConsent revealAfter=".t9-hero" variant="row" />
    </div>
  );
}
