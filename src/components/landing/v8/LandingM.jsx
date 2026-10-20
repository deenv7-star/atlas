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
 * All screens are real ATLAS screens in demo mode; every name, booking and amount is example data
 * and is labelled as such. No testimonials, logos or customer counts.
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MessageCircle, Wallet } from 'lucide-react';
import CookieConsent, { readChoice } from '@/components/landing/CookieConsent';
import { useReveal } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ, CTA_SIGNUP, CTA_NOTE } from '../v5/content';
import { V7Header } from '../v7/shared7';
import { UI, FACES, Face, Pricing8, CtaLinks, Credits8 } from './shared8';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-v8m.css';
import './faq-m.css';
import './landing-ux-1020.css';
import HeroPhoto from './HeroPhoto';
import LazyGrowth from './growth/LazyGrowth';

const loadGrowth = () => import('./growth/GrowthD');

const NAV = [['#features', 'המוצר'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- features: 3 rows + channels (replaces the 4 colour blocks, facts and trust) ---------------- */
const FEATS = [
  { I: CalendarDays, t: 'כל הערוצים. לוח אחד.', d: 'Airbnb, Booking.com והזמנות ישירות נכנסות לבד ללוח. בלי כפל הזמנות.' },
  { I: MessageCircle, t: 'וואטסאפ לאורחים. מוכן מראש.', d: 'atlas מכין כל הודעה בזמן. אתם שולחים בלחיצה, מהוואטסאפ שלכם.' },
  { I: Wallet, t: 'הכסף נכנס. אתם רואים הכל.', d: 'כל מקדמה ויתרה נרשמות, ורואים כמה נכנס החודש.' },
];

function Features() {
  return (
    <section id="features" className="lm-feat" aria-labelledby="feat-title">
      <div className="l5-wrap">
        <h2 id="feat-title" className="v8-h2 lm-feat-h" data-reveal>אתם מארחים. <span className="is-ind">atlas מסדר.</span></h2>
        <ul className="lm-feat-list">
          {FEATS.map(({ I, t, d }, i) => (
            <li key={t} data-reveal style={{ '--d': `${i * 40}ms` }}>
              <span className="lm-feat-ic" aria-hidden="true"><I size={22} strokeWidth={2.2} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ul>
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
  return (
    <div ref={root} className="l5 l7 v8 lm has-ph" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <HeroPhoto />
        <Part><Features /></Part>
        <LazyGrowth load={loadGrowth} className="lg-ph-d" />
        <Part><Pricing8 /></Part>
        <Part><Faq items={LANDING_FAQ} openFirst cta /></Part>
        <Part><Final /></Part>
      </main>
      <Part><Credits8 /></Part>
      <Part><Footer /></Part>
      <Part><StickyCta /></Part>
      <CookieConsent revealAfter=".ph-hero" variant="row" />
    </div>
  );
}
