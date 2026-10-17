/**
 * Landing v7 J "מסך אחד" (Apple-style product showcase). A very clean white page with one
 * large light device holding the real ATLAS app. On wide screens the device stays sticky while
 * the page scrolls, and its screen changes per chapter (calendar sync, payments, WhatsApp,
 * accountant report), each with one short big line. Phones and reduced motion get the same four
 * chapters stacked, each with its own screen. Then one photo band of hosts, pricing with a
 * monthly / annual toggle, FAQ and a calm CTA.
 *
 * Screens are real captures of the ATLAS app (app UI v7, local demo data). Nothing on the page is a
 * testimonial, a customer logo or a customer count. Photos: free-licence Unsplash / Pexels, cool-graded.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check, CalendarDays, Wallet, MessageCircle, FileText, ShieldCheck, MapPin, ChevronDown,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { PRICING_PLANS } from '@/config/pricing';
import { useReveal, prefersReducedMotion, fmt } from '../v5/motion';
import { Mark } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL } from '../v5/content';
import { SignupButton, Faq, Footer } from '../v5/LandingV5';
import { IMG, V7Header, PhotoCredits } from './shared7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './landing-v7j.css';

const S = '/landing-v7/screens';
const NAV = [['#show', 'המוצר'], ['#hosts', 'למי זה'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

const CH = [
  {
    k: 'cal', icon: CalendarDays, label: 'לוח שנה',
    line: 'כל ההזמנות. לוח אחד.',
    text: 'Airbnb, Booking.com וההזמנות הישירות מתעדכנים לבד, על אותו לוח. בלי הזמנות כפולות.',
    d: 'd-calendar', m: 'm-calendar', alt: 'לוח השנה של ATLAS עם ההזמנות של כל היחידות',
  },
  {
    k: 'pay', icon: Wallet, label: 'תשלומים',
    line: 'המקדמה נכנסת עם ההזמנה.',
    text: 'רואים מה שולם ומה ממתין, ו-ATLAS שולחת לאורח תזכורת ליתרה בזמן.',
    d: 'd-payments', m: 'm-payments', alt: 'מסך התשלומים: מה התקבל ומה ממתין לגבייה',
  },
  {
    k: 'wa', icon: MessageCircle, label: 'וואטסאפ',
    line: 'האורחים מקבלים הכל. בזמן.',
    text: 'אישור הזמנה, הוראות הגעה וקוד לדלת יוצאים אוטומטית בוואטסאפ, בשמכם.',
    d: 'd-messages', m: 'm-messages', alt: 'מסך ההודעות: שיחת וואטסאפ עם משפחת אורחים',
  },
  {
    k: 'rep', icon: FileText, label: 'דוח לרואה החשבון',
    line: 'סוף החודש? הדוח מוכן.',
    text: 'הכנסות לפי ערוץ, תפוסה ומחיר ממוצע ללילה. PDF או CSV בלחיצה.',
    d: 'd-monthly-report', m: 'm-monthly-report', alt: 'הדוח החודשי: הכנסות לפי ערוץ ולפי יחידה',
  },
];

/* ---------------- devices (light, no dark surfaces) ---------------- */
function Laptop({ children, className = '' }) {
  return (
    <div className={`l7j-mac ${className}`}>
      <div className="l7j-mac-lid"><div className="l7j-mac-scr">{children}</div></div>
      <div className="l7j-mac-base"><i /></div>
    </div>
  );
}

function Phone({ src, alt }) {
  return (
    <div className="l7j-phone">
      <img src={src} alt={alt} width="600" height="1298" loading="lazy" decoding="async" />
    </div>
  );
}

/* ---------------- hero ---------------- */
function Hero() {
  return (
    <section className="l7j-hero" aria-labelledby="hero-title">
      <div className="l5-wrap l7j-hero-in">
        <h1 id="hero-title" className="l7j-h1">
          <span className="l5-h1-line" style={{ '--i': 0 }}>כל המתחם.</span>
          {' '}
          <span className="l5-h1-line is-ind" style={{ '--i': 1 }}>מסך אחד.</span>
        </h1>
        <p className="l7j-lead l5-in" style={{ '--i': 2 }}>
          לוח שנה, תשלומים, וואטסאפ ודוחות שמתעדכנים לבד. בעברית.
        </p>
        <div className="l7-cta l7j-cta l5-in" style={{ '--i': 3 }}>
          <SignupButton className="is-lg" />
          <a href="#show" className="l7j-link">איך זה עובד<ChevronDown size={18} strokeWidth={2} aria-hidden="true" /></a>
        </div>
        <p className="l7j-note l5-in" style={{ '--i': 4 }}><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · ביטול בכל עת</p>
      </div>
    </section>
  );
}

/* ---------------- sticky showcase (wide screens, motion allowed) ---------------- */
function useStickyStep(ref, count) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const tick = () => {
      raf = 0;
      if (!el.offsetParent) return; // hidden on this viewport
      const r = el.getBoundingClientRect();
      const range = r.height - window.innerHeight;
      const p = range > 0 ? Math.min(0.9999, Math.max(0, -r.top / range)) : 0;
      setStep(Math.floor(p * count));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
  }, [ref, count]);
  return step;
}

function Showcase() {
  const sec = useRef(null);
  const step = useStickyStep(sec, CH.length);
  const go = useCallback((i) => {
    const el = sec.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (range * (i + 0.5)) / CH.length, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);
  return (
    <section ref={sec} className="l7j-show" data-step={step} aria-label="המוצר, פרק אחרי פרק">
      <div className="l7j-sticky">
        <div className="l5-wrap l7j-grid">
          <div className="l7j-copy">
            {CH.map((c, i) => {
              const I = c.icon;
              return (
                <div key={c.k} className={`l7j-ch${i === step ? ' is-on' : ''}`} aria-hidden={i !== step}>
                  <p className="l7j-kick"><I size={18} strokeWidth={2} aria-hidden="true" />{c.label}</p>
                  <h2 className="l7j-h2">{c.line}</h2>
                  <p className="l7j-txt">{c.text}</p>
                </div>
              );
            })}
            <div className="l7j-tabs" role="group" aria-label="פרקים">
              {CH.map((c, i) => (
                <button key={c.k} type="button" className={i === step ? 'is-on' : ''} aria-pressed={i === step} onClick={() => go(i)}>
                  <span className="l7j-tab-bar" aria-hidden="true"><i /></span>
                  <span className="l7j-tab-t">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="l7j-stage">
            <div className="l7j-glow" aria-hidden="true" />
            <Laptop>
              {CH.map((c, i) => (
                <img
                  key={c.k}
                  className={i === step ? 'is-on' : ''}
                  src={`${S}/${c.d}.webp`}
                  alt={i === step ? c.alt : ''}
                  aria-hidden={i !== step}
                  width="1600"
                  height="1000"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ))}
            </Laptop>
            <p className="l7j-cap">מסכים אמיתיים מתוך ATLAS. הנתונים לדוגמה.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- stacked chapters (phones, tablets, reduced motion) ---------------- */
function Stacked() {
  return (
    <section className="l7j-stack" aria-label="המוצר, פרק אחרי פרק">
      <div className="l5-wrap">
        <ol className="l7j-list">
          {CH.map((c) => {
            const I = c.icon;
            return (
              <li key={c.k} className={`l7j-item is-${c.k}`}>
                <div className="l7j-item-copy" data-reveal>
                  <p className="l7j-kick"><I size={18} strokeWidth={2} aria-hidden="true" />{c.label}</p>
                  <h2 className="l7j-h2">{c.line}</h2>
                  <p className="l7j-txt">{c.text}</p>
                </div>
                <div className="l7j-item-dev" data-reveal style={{ '--d': '80ms' }}>
                  <div className="l7j-glow" aria-hidden="true" />
                  <Phone src={`${S}/${c.m}.webp`} alt={c.alt} />
                  <Laptop className="is-tab">
                    <img className="is-on" src={`${S}/${c.d}.webp`} alt={c.alt} width="1600" height="1000" loading="lazy" decoding="async" />
                  </Laptop>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="l7j-cap is-stack">מסכים אמיתיים מתוך ATLAS. הנתונים לדוגמה.</p>
      </div>
    </section>
  );
}

/* ---------------- one photo band ---------------- */
const PHOTOS = [
  { src: `${IMG}/hosts-900.webp`, w: 900, h: 600, pos: '50% 35%' },
  { src: `${IMG}/relax.webp`, w: 1000, h: 562, pos: '55% 50%' },
  { src: `${IMG}/keys.webp`, w: 800, h: 840, pos: '50% 50%' },
  { src: `${IMG}/hostsdog.webp`, w: 1100, h: 1041, pos: '50% 40%' },
];

function Hosts() {
  return (
    <section id="hosts" className="l5-sec l7j-hosts" aria-labelledby="hosts-title">
      <div className="l5-wrap">
        <div className="l7j-hosts-head" data-reveal>
          <h2 id="hosts-title" className="l7j-h2 is-center">בשביל מי שמארח.</h2>
          <p className="l7j-txt is-center">מצימר אחד ועד מתחם שלם. הכל בעברית, ומאחורי המערכת יש בן אדם שעונה בוואטסאפ.</p>
        </div>
      </div>
      <div className="l7-inset">
        <ul className="l7j-band" data-reveal>
          {PHOTOS.map((p) => (
            <li key={p.src}><img src={p.src} alt="" width={p.w} height={p.h} loading="lazy" decoding="async" style={{ objectPosition: p.pos }} /></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- pricing ---------------- */
const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנתה בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="l5-sec l7j-price" aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <div className="l7j-hosts-head" data-reveal>
          <h2 id="pricing-title" className="l7j-h2 is-center">מחיר פשוט. 14 יום עלינו.</h2>
          <p className="l7j-txt is-center">כל מסלול מתחיל בניסיון חינם עם כל המערכת. בוחרים לפי מספר הנכסים.</p>
        </div>
        <div className="l7j-seg" role="group" aria-label="תקופת חיוב" data-reveal>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי · חוסכים 20%</button>
        </div>
        <ul className="l7j-plans" data-reveal>
          {PRICING_PLANS.map((p) => (
            <li key={p.key} className={`l7j-plan${p.popular ? ' is-pop' : ''}`}>
              {p.popular && <span className="l7j-plan-tag">הכי פופולרי</span>}
              <h3>{p.nameHe}</h3>
              <p className="l7j-plan-desc">{p.desc}</p>
              <p className="l7j-plan-price">
                <b className="num" dir="ltr">₪{fmt(yearly ? p.priceYearly : p.price)}</b>
                <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
              </p>
              <SignupButton plan={p.key} className={`is-block${p.popular ? '' : ' is-quiet'}`} />
              <ul className="l7j-plan-feat">
                {p.features.map((f) => <li key={f}><Check size={16} strokeWidth={2.4} aria-hidden="true" />{f}</li>)}
              </ul>
            </li>
          ))}
        </ul>
        <ul className="l7j-trust" data-reveal>
          {TRUST.map(({ I, t }) => <li key={t}><I size={18} strokeWidth={1.8} aria-hidden="true" />{t}</li>)}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- final ---------------- */
function FinalCta() {
  return (
    <section className="l7j-final" aria-labelledby="final-title">
      <div className="l7j-glow is-final" aria-hidden="true" />
      <div className="l5-wrap l7j-final-in" data-reveal>
        <h2 id="final-title" className="l7j-h1 is-final">נסו את ATLAS.</h2>
        <p className="l7j-lead">14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
        <div className="l7-cta l7j-cta">
          <SignupButton className="is-lg" />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l7j-link"><Mark ch="whatsapp" size={18} />שאלה? כתבו לנו</a>
        </div>
      </div>
    </section>
  );
}

export default function LandingJ() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7j" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <div id="show" className="l7j-anchor" />
        <Showcase />
        <Stacked />
        <Hosts />
        <Pricing />
        <Faq limit={5} />
        <FinalCta />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".l7j-hero" />
    </div>
  );
}
