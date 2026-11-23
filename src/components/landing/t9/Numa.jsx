/**
 * t9 · numa (reference: taster.co.il/templates/numa, a calm night-time app page).
 * Order kept: fixed header (logo · segmented pill nav with a sliding active pill · one white button) → night hero
 * (2-line white h1, sub, store badges, phone in a glowing arch, glass cards floating at different depths) → light
 * sheet that rises over the hero with a sentence lit word by word (inline icon chips) + a row of tall cards →
 * full-bleed scene that settles on scroll → pinned "a day with atlas" (big times on both sides, phone in the
 * middle, steps list) → lines lit one by one on navy → why it works (before/after + facts) → pricing → FAQ →
 * night footer with a big CTA, store badges and the logo over a glowing horizon.
 * The reference's reviews are left out: atlas has no real customer quotes yet.
 */
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MessageCircle, Wallet, Mic, Check, X } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ } from '../v5/content';
import { Pricing8 } from '../v8/shared8';
import { H1, SUB, NOTE, FEATURES, FACTS, BEFORE, AFTER, HERO_IMG, SCREENS, useT9Reveal, useScrub, useSpy, Count, Words, Logo, Cta, StoreBadges, Phone, Credits } from './common';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import '../v8/shared8.css';
import '../v8/faq-m.css';
import './t9-common.css';
import './t9-numa.css';

const NAV = [['top', 'בית'], ['how', 'איך זה עובד'], ['day', 'יום עם atlas'], ['pricing', 'מחירים'], ['faq', 'שאלות']];

function Header() {
  const cur = useSpy(NAV.map(([i]) => i));
  const idx = Math.max(0, NAV.findIndex(([i]) => i === cur));
  return (
    <header className="nm-hdr">
      <Logo white />
      <nav className="nm-nav" aria-label="ניווט ראשי" style={{ '--i': idx }}>
        <span className="nm-nav-pill" aria-hidden="true" />
        {NAV.map(([id, l], i) => <a key={id} href={`#${id}`} className={i === idx ? 'is-on' : ''} aria-current={i === idx ? 'true' : undefined}>{l}</a>)}
      </nav>
      <Link to="/register" className="nm-hdr-cta">התחילו חינם</Link>
    </header>
  );
}

const FLOATS = [
  { k: 'a', t: 'אמרתם: ״הזמנה ליוסי לסופ״ש״', s: 'atlas בודק שהזית פנוי', ic: <Mic size={16} strokeWidth={2.4} /> },
  { k: 'b', t: 'ההזמנה נשמרה בלוח', s: 'אישרתם בלחיצה', ic: <CalendarDays size={16} strokeWidth={2.4} /> },
  { k: 'c', t: 'אישור ליוסי מוכן', s: 'בוואטסאפ שלכם', ic: <Mark ch="whatsapp" size={16} /> },
  { k: 'd', t: '09:00', s: 'דוגמה', ic: null },
];

function Hero() {
  return (
    <section id="top" className="nm-hero t9-hero" aria-labelledby="hero-title" data-scrub="leave">
      <span className="nm-stars" aria-hidden="true" />
      <div className="nm-hero-in">
        <h1 id="hero-title" className="nm-h1"><span className="nm-l" style={{ '--d': '0ms' }}>{H1[0]}</span><br /><span className="nm-l" style={{ '--d': '140ms' }}>{H1[1]}</span></h1>
        <p className="nm-sub nm-in" style={{ '--d': '300ms' }}>{SUB}</p>
        <div className="nm-hero-cta nm-in" style={{ '--d': '420ms' }}>
          <Cta className="is-white" />
          <StoreBadges dark />
        </div>
        <p className="nm-note nm-in" style={{ '--d': '520ms' }}>האפליקציות בחנויות בקרוב. בינתיים atlas עובד מהדפדפן, בטלפון ובמחשב.</p>
      </div>
      <div className="nm-arch" aria-hidden="true">
        <span className="nm-arch-glow" />
        <Phone screens={[SCREENS.today]} className="nm-hero-phone" eager />
        {FLOATS.map((f) => (
          <span key={f.k} className={`nm-float is-${f.k}`}>
            {f.ic && <i>{f.ic}</i>}
            <span><b>{f.t}</b><small>{f.s}</small></span>
          </span>
        ))}
      </div>
    </section>
  );
}

function How() {
  const chip = (I) => <span className="nm-chip" aria-hidden="true"><I size={18} strokeWidth={2.2} /></span>;
  return (
    <section id="how" className="nm-how" aria-labelledby="how-title">
      <div className="nm-sheet">
        <div className="nm-wrap" data-scrub="enter">
          <h2 id="how-title" className="nm-say">
            <Words text="atlas מכין לכם את היום. הוא מסדר" total={22} />{' '}{chip(CalendarDays)}{' '}<Words text="את הלוח, מכין" start={7} total={22} />{' '}{chip(MessageCircle)}{' '}<Words text="את ההודעות לאורחים ושומר" start={10} total={22} />{' '}{chip(Wallet)}{' '}<Words text="על הכסף. אתם רק מאשרים." start={14} total={22} />
          </h2>
          <a href="#day" className="nm-link">לראות יום שלם</a>
        </div>
        <ul className="nm-cards nm-wrap">
          {FEATURES.map((f, i) => (
            <li key={f.id} id={f.id} className={`nm-card is-${f.id}`} data-r style={{ '--d': `${i * 90}ms` }}>
              <h3>{f.k}</h3>
              <div className="nm-card-vis"><img src={f.img} alt={f.alt} width={f.w} height={f.h} loading="lazy" decoding="async" /></div>
              <p><b>{f.t}</b> {f.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Scene() {
  return (
    <section className="nm-scene" aria-labelledby="scene-title" data-scrub="view">
      <div className="nm-scene-ph" aria-hidden="true">
        <img src={`${HERO_IMG}/pool-1920.webp`} srcSet={`${HERO_IMG}/pool-1280.webp 1280w, ${HERO_IMG}/pool-1920.webp 1920w, ${HERO_IMG}/pool-2560.webp 2560w`} sizes="100vw" alt="" width="1920" height="1440" loading="lazy" decoding="async" />
      </div>
      <h2 id="scene-title" className="nm-scene-h">הלוח מסודר.<br />אפשר לארח.</h2>
    </section>
  );
}

const DAY = [
  { a: '08', b: '30', t: 'בוקר טוב', d: 'מסך ״היום״ מראה מי מגיע, מי יוצא ומה צריך לנקות.', s: SCREENS.today },
  { a: '09', b: '00', t: 'אומרים מה צריך', d: '״תוסיף הזמנה ליוסי לסופ״ש״. בלי טפסים, בלי להקליד.', s: SCREENS.say },
  { a: '09', b: '01', t: 'atlas מכין', d: 'בודק שהיחידה פנויה ומכין את ההזמנה לאישור.', s: SCREENS.card },
  { a: '09', b: '02', t: 'מאשרים בלחיצה', d: 'רק אז ההזמנה נשמרת בלוח. האישור ליוסי נפתח בוואטסאפ שלכם.', s: SCREENS.saved },
];

function Day() {
  return (
    <section id="day" className="nm-day" aria-labelledby="day-title" data-scrub="pin" data-steps={DAY.length}>
      <div className="nm-day-stick">
        <div className="nm-day-grid">
          <div className="nm-clock is-a" aria-hidden="true">{DAY.map((x, i) => <span key={i} className="num" style={{ '--k': i }}>{x.a}</span>)}</div>
          <div className="nm-day-phone">
            <Phone screens={DAY.map((x) => x.s)} className="nm-phone-day" label="מסכי atlas אמיתיים לאורך בוקר אחד, נתוני דוגמה" />
          </div>
          <div className="nm-clock is-b" aria-hidden="true">{DAY.map((x, i) => <span key={i} className="num" style={{ '--k': i }}>{x.b}</span>)}</div>
          <div className="nm-day-copy">
            <h2 id="day-title" className="nm-h2">בוקר אחד<br />עם atlas</h2>
            <ol className="nm-day-list">
              {DAY.map((x, i) => (
                <li key={x.t} style={{ '--k': i }}>
                  <span className="num" dir="ltr">{x.a}:{x.b}</span>
                  <b>{x.t}</b>
                  <p>{x.d}</p>
                </li>
              ))}
            </ol>
            <p className="nm-day-note">צילומי מסך מהאפליקציה, נתוני דוגמה</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const LINES = ['ההזמנה מ-Booking שנכנסה בלילה', 'האורח ששואל איך מגיעים', 'המקדמה שעוד לא הגיעה', 'הניקיון בין אורח לאורח', 'atlas זוכר את כל זה בשבילכם.'];

function Lines() {
  return (
    <section className="nm-lines" aria-label="מה atlas זוכר בשבילכם" data-scrub="pin" data-steps={LINES.length}>
      <div className="nm-lines-stick">
        <ul>{LINES.map((l, i) => <li key={l} style={{ '--k': i }} className={i === LINES.length - 1 ? 'is-end' : ''}>{l}</li>)}</ul>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section className="nm-why" aria-labelledby="why-title">
      <div className="nm-wrap">
        <h2 id="why-title" className="nm-h2 is-dark" data-r>מה משתנה<br />כשהכל בלוח אחד?</h2>
        <div className="nm-ba">
          <div className="nm-ba-card is-before" data-r>
            <h3>בלי atlas</h3>
            <ul>{BEFORE.map((b) => <li key={b}><X size={16} strokeWidth={2.4} aria-hidden="true" />{b}</li>)}</ul>
          </div>
          <div className="nm-ba-card is-after" data-r style={{ '--d': '120ms' }}>
            <h3>עם atlas</h3>
            <ul>{AFTER.map((b) => <li key={b}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{b}</li>)}</ul>
          </div>
        </div>
        <ul className="nm-facts">
          {FACTS.map((f, i) => <li key={f.l} data-r style={{ '--d': `${i * 90}ms` }}><b><Count to={f.v} pre={f.pre} suf={f.suf} /></b><span>{f.l}</span><small>{f.s}</small></li>)}
        </ul>
      </div>
    </section>
  );
}

function Night() {
  return (
    <section className="nm-end" aria-labelledby="end-title">
      <div className="nm-wrap nm-end-in">
        <h2 id="end-title" className="nm-h2" data-r>אפשר להתחיל<br />כבר היום.</h2>
        <p className="nm-sub" data-r>14 יום חינם, הכל פתוח. ובן אדם עונה לכם בוואטסאפ 24/7, גם בשבת.</p>
        <div className="nm-hero-cta" data-r><Cta className="is-white" /><StoreBadges dark /></div>
        <p className="nm-note" data-r>{NOTE}</p>
      </div>
      <div className="nm-horizon" aria-hidden="true">
        <img className="nm-bigmark" src="/atlas-logo-white.svg" alt="" width="940" height="330" loading="lazy" decoding="async" />
        <span className="nm-glow" />
      </div>
    </section>
  );
}

export default function Numa() {
  const root = useRef(null);
  useT9Reveal(root);
  useScrub(root);
  return (
    <div ref={root} className="l5 l7 v8 lm t9 t9-numa" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        <Hero />
        <How />
        <Scene />
        <Day />
        <Lines />
        <Why />
        <Pricing8 />
        <Faq items={LANDING_FAQ} openFirst cta />
        <Night />
      </main>
      <Footer />
      <Credits />
      <CookieConsent revealAfter=".t9-hero" variant="row" />
    </div>
  );
}

