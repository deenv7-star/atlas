/**
 * Landing R1 "editorial photo" (20.10.2026): real photography leads (Pexels, qa/real-photos-v1/assets.md).
 * Deen 20.10 22:55: no extra text sections, no fake UI graphics; 23:06: keep it airy, few strong photos.
 * Previous product-theatre landing: see git history before this commit (HeroPhoto.jsx, GrowthS kept in tree).
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import CookieConsent, { readChoice } from '@/components/landing/CookieConsent';
import { useReveal, prefersReducedMotion } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer } from '../v5/LandingV5';
import { LANDING_FAQ, CTA_SIGNUP, CTA_NOTE } from '../v5/content';
import { V7Header } from '../v7/shared7';
import { Pricing8, CtaLinks } from './shared8';
import { Photo, HeroStill } from './real/Photo';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-v8m.css';
import './faq-m.css';
import './landing-ux-1020.css';
import './hero-photo.css';
import './real/real.css';

const NAV = [['#story', 'איך זה עובד'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

function HeroCopy() {
  return (
    <div className="rp-hero-in">
      <h1 id="hero-title" className="rp-h1">כל המתחם.<br />במבט אחד.</h1>
      <p className="rp-sub">הזמנות מכל הערוצים, הודעות לאורחים ותשלומים. במקום אחד.</p>
      <div className="rp-ctas">
        <Link to="/register" className="rp-btn">{CTA_SIGNUP}<ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" /></Link>
        <span className="rp-note"><Check size={15} strokeWidth={2.6} aria-hidden="true" /> {CTA_NOTE} · הגדרה תוך 10 דקות</span>
      </div>
    </div>
  );
}

function Final({ living = false }) {
  return (
    <section className="rp-final" aria-labelledby="final-title">
      <Photo name="dinner" alt="משפחה וחברים בארוחת ערב בחצר, תחת שרשרת אורות" sizes="(min-width: 1200px) 1200px, 100vw" className={living ? "rp-par" : ""} />
      <div className="rp-final-in">
        <h2 id="final-title" className="rp-final-h" data-reveal>הלוח מסודר.<br />אפשר לארח.</h2>
        <div data-reveal><CtaLinks /></div>
      </div>
    </section>
  );
}
/* ---------------- sticky mobile CTA: after the hero, hidden again at pricing / final CTA / footer ---------------- */
function StickyCta() {
  const [on, setOn] = useState(false);
  const [answered, setAnswered] = useState(false);
  useEffect(() => {
    if (readChoice()) { setAnswered(true); return undefined; }
    const done = () => setAnswered(true);
    window.addEventListener('atlas:cookie-choice', done);
    return () => window.removeEventListener('atlas:cookie-choice', done);
  }, []);
  useEffect(() => {
    const hero = document.querySelector('.rp-hero');
    const ends = [...document.querySelectorAll('#pricing, .rp-final, .l5-ftr')];
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

function Channels() {
  return (
    <div className="rp-channels" data-reveal>
      <p>עובד עם מה שכבר יש לכם</p>
      <ul>
        <li><Mark ch="airbnb" size={20} />Airbnb</li>
        <li><Mark ch="booking" size={20} />Booking.com</li>
        <li><Mark ch="whatsapp" size={20} />WhatsApp</li>
        <li><Mark ch="google" size={20} />Google Calendar</li>
      </ul>
    </div>
  );
}

const Part = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

function Hero() {
  return (
    <section className="rp-hero" aria-labelledby="hero-title">
      <div className="rp-hero-media"><HeroStill alt="צימר עם בריכה ודק עץ בין עצי זית" /></div>
      <HeroCopy />
    </section>
  );
}

function Story() {
  return (
    <section id="story" className="rp-story" aria-labelledby="story-title">
      <div className="l5-wrap">
        <h2 id="story-title" className="rp-lead" data-reveal>אתם מארחים. <span className="is-ind">atlas מסדר.</span></h2>
        <figure className="rp-moment" data-reveal>
          <div className="rp-frame is-wide"><Photo name="arrive" alt="משפחה מגיעה לבקתת עץ ביער" sizes="(min-width: 1200px) 1200px, 100vw" /></div>
          <figcaption className="rp-line"><small>כניסות, יציאות וניקיונות</small>האורחים מגיעים. הצימר כבר מוכן.</figcaption>
        </figure>
        <div className="rp-moment rp-pair">
          <figure data-reveal>
            <div className="rp-frame is-tall"><Photo name="couple" alt="זוג בבריכה של מתחם אירוח, מתחת לפרגולה" sizes="(min-width: 900px) 580px, 100vw" /></div>
            <figcaption className="rp-line"><small>Airbnb, Booking.com וישיר</small>כל הזמנה נכנסת ללוח לבד.</figcaption>
          </figure>
          <figure data-reveal>
            <div className="rp-frame is-wide"><Photo name="breakfast" alt="מגש ארוחת בוקר על שולחן במרפסת מול הרים" sizes="(min-width: 900px) 580px, 100vw" /></div>
            <figcaption className="rp-line"><small>וואטסאפ לאורחים</small>הודעת ההגעה יוצאת בזמן.</figcaption>
          </figure>
        </div>
        <Channels />
      </div>
    </section>
  );
}

export default function LandingM() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l7 v8 lm has-ph rp" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Part><Story /></Part>
        <Part><Pricing8 growth /></Part>
        <Part><Faq items={LANDING_FAQ} openFirst cta /></Part>
        <Part><Final /></Part>
        <p className="v8-credits">צילומים אמיתיים מ-Pexels (רישיון חופשי). האנשים בתמונות אינם לקוחות של atlas.</p>
      </main>
      <Part><Footer /></Part>
      <Part><StickyCta /></Part>
      <CookieConsent revealAfter=".rp-hero" variant="row" />
    </div>
  );
}
