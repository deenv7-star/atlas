/**
 * Landing R2 "living" (20.10.2026): real photography leads (Pexels, qa/real-photos-v1/assets.md).
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

/** Muted autoplay loop over its poster photo. Reduced motion / save-data: never loads, the photo stays. */
function useLoop(ref) {
  useEffect(() => {
    const v = ref.current;
    if (!v) return undefined;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (prefersReducedMotion() || saveData) return undefined;
    const start = () => {
      if (!v.dataset.src) return;
      // VP9 WebM where supported (Chrome, Firefox, Edge, Android), H.264 MP4 elsewhere (Safari)
      const webm = v.canPlayType('video/webm; codecs="vp9"') ? v.dataset.src.replace(/\.mp4$/, '.webm') : v.dataset.src;
      v.src = webm; v.removeAttribute('data-src');
      v.addEventListener('playing', () => v.classList.add('is-on'), { once: true });
      v.play().catch(() => {});
    };
    if (typeof IntersectionObserver === 'undefined') { start(); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { start(); if (v.paused && v.src) v.play().catch(() => {}); } else if (!v.paused) v.pause();
    }, { rootMargin: '200px 0px' });
    io.observe(v);
    return () => io.disconnect();
  }, [ref]);
}

function Hero() {
  const vid = useRef(null);
  const [src, setSrc] = useState(null);
  useEffect(() => { setSrc(window.matchMedia('(max-aspect-ratio: 1/1)').matches ? '/landing-real/hero-p.mp4' : '/landing-real/hero-l.mp4'); }, []);
  useEffect(() => { if (src && vid.current) vid.current.dataset.src = src; }, [src]);
  useLoop(src ? vid : { current: null });
  return (
    <section className="rp-hero" aria-labelledby="hero-title">
      <div className="rp-hero-media">
        <HeroStill alt="צימר עם בריכה ודק עץ בין עצי זית" />
        <video ref={vid} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
      </div>
      <HeroCopy />
    </section>
  );
}

function CoffeeLoop() {
  const vid = useRef(null);
  useLoop(vid);
  return (
    <div className="rp-loop" data-reveal>
      <picture className="rp-pic">
        <source type="image/avif" srcSet="/landing-real/coffee-poster-540.avif" />
        <img src="/landing-real/coffee-poster-540.webp" alt="קפה נמזג לארוחת בוקר במרפסת" width="540" height="960" loading="lazy" decoding="async" />
      </picture>
      <video ref={vid} data-src="/landing-real/coffee.mp4" muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
    </div>
  );
}

function Story() {
  return (
    <section id="story" className="rp-story" aria-labelledby="story-title">
      <div className="l5-wrap">
        <h2 id="story-title" className="rp-lead" data-reveal>אתם מארחים. <span className="is-ind">atlas מסדר.</span></h2>
        <figure className="rp-moment" data-reveal>
          <div className="rp-frame is-wide rp-kb"><Photo name="arrive" alt="משפחה מגיעה לבקתת עץ ביער" sizes="(min-width: 1200px) 1200px, 100vw" /></div>
          <figcaption className="rp-line"><small>כניסות, יציאות וניקיונות</small>האורחים מגיעים. הצימר כבר מוכן.</figcaption>
        </figure>
        <div className="rp-moment rp-split">
          <CoffeeLoop />
          <p className="rp-line" data-reveal><small>וואטסאפ לאורחים</small>הודעת ההגעה יוצאת בזמן.</p>
        </div>
        <div className="rp-moment rp-split">
          <figure data-reveal>
            <div className="rp-frame is-tall rp-par"><Photo name="couple" alt="זוג בבריכה של מתחם אירוח, מתחת לפרגולה" sizes="(min-width: 900px) 580px, 100vw" /></div>
            <figcaption className="rp-line"><small>Airbnb, Booking.com וישיר</small>כל הזמנה נכנסת ללוח לבד.</figcaption>
          </figure>
          <figure data-reveal>
            <div className="rp-shot"><img src="/landing-hero/ui-m-today.webp" alt="מסך ״היום״ של atlas בטלפון: כניסות, יציאות וניקיונות (נתוני דוגמה)" width="780" height="1594" loading="lazy" decoding="async" /></div>
            <figcaption className="rp-cap">מסך ״היום״ של atlas. נתוני דוגמה.</figcaption>
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
    <div ref={root} className="l5 l7 v8 lm has-ph rp is-living" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Part><Story /></Part>
        <Part><Pricing8 growth /></Part>
        <Part><Faq items={LANDING_FAQ} openFirst cta /></Part>
        <Part><Final living /></Part>
        <p className="v8-credits">צילומים וסרטונים אמיתיים מ-Pexels (רישיון חופשי). האנשים בתמונות אינם לקוחות של atlas. המסך הוא מסך atlas אמיתי עם נתוני דוגמה.</p>
      </main>
      <Part><Footer /></Part>
      <Part><StickyCta /></Part>
      <CookieConsent revealAfter=".rp-hero" variant="row" />
    </div>
  );
}
