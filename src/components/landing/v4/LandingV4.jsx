import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, Plus, Check } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { PRICING_PLANS } from '@/config/pricing';
import { Wordmark } from '@/components/landing/v3/Devices';
import { HeroCard, LiveDemo, DemoTiles } from './Demos';
import { useReveal, useInView, useCountUp, fmt } from './motion';
import {
  HERO, PHOTOS, BENEFITS, STEPS, PLACES, FAQ,
  WHATSAPP_URL, PHONE_DISPLAY, CTA_SIGNUP,
} from './content';
import './landing-v4.css';

function SignupButton({ className = '' }) {
  return (
    <Link to="/register" className={`l4-btn ${className}`}>
      <span>{CTA_SIGNUP}</span>
      <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" className="l4-btn-arrow" />
    </Link>
  );
}

function WhatsAppLink({ children = 'דברו איתנו בוואטסאפ' }) {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l4-link">
      {children}
      <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
    </a>
  );
}

function Photo({ p, className = '', eager = false, sizes = '(min-width: 820px) 33vw, 90vw' }) {
  return (
    <img
      src={p.src} width={p.w} height={p.h} alt={p.alt} sizes={sizes}
      loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} className={className}
    />
  );
}

function Header() {
  return (
    <header className="l4-hdr">
      <div className="l4-wrap l4-hdr-in">
        <Link to="/" className="l4-logo" aria-label="ATLAS, לדף הבית"><Wordmark /></Link>
        <nav className="l4-nav" aria-label="ניווט ראשי">
          <a href="#how">איך זה עובד</a>
          <a href="#pricing">מחירים</a>
          <a href="#faq">שאלות</a>
        </nav>
        <Link to="/login" className="l4-login">כניסה</Link>
      </div>
    </header>
  );
}

function HeroCta() {
  return (
    <div className="l4-cta">
      <SignupButton />
      <WhatsAppLink />
    </div>
  );
}

/* A: photo-led. Big real photo, floating live card, copy on a white panel. */
function HeroPhoto() {
  const h = HERO.a;
  return (
    <section className="l4-hero l4-hero-a" aria-labelledby="hero-title">
      <div className="l4-wrap-wide">
        <div className="l4-hero-frame">
          <div className="l4-hero-media">
          <picture className="l4-hero-pic">
            <source media="(min-width: 768px)" srcSet={PHOTOS.heroWide.src} width={PHOTOS.heroWide.w} height={PHOTOS.heroWide.h} />
            <img
              src={PHOTOS.heroNarrow.src} width={PHOTOS.heroNarrow.w} height={PHOTOS.heroNarrow.h}
              alt={PHOTOS.heroAlt} fetchPriority="high" decoding="async" draggable={false}
            />
          </picture>
          <div className="l4-hero-float"><HeroCard /></div>
          </div>
          <div className="l4-hero-panel">
            <h1 id="hero-title" className="l4-h1">{h.title}</h1>
            <p className="l4-lead">{h.sub}</p>
            <HeroCta />
          </div>
        </div>
      </div>
    </section>
  );
}

/* B: bold & playful. Huge type, live product demo on an amber block. */
function HeroBold() {
  const h = HERO.b;
  return (
    <section className="l4-hero l4-hero-b" aria-labelledby="hero-title">
      <div className="l4-wrap l4-hero-b-grid">
        <div className="l4-hero-b-copy">
          <h1 id="hero-title" className="l4-h1 l4-h1-xl">
            <span className="l4-l1">{h.title[0]}</span>{' '}
            <span className="l4-l2"><span className="l4-mark">{h.title[1]}</span></span>
          </h1>
          <p className="l4-lead">{h.sub}</p>
          <HeroCta />
        </div>
        <div className="l4-hero-b-stage">
          <div className="l4-block l4-block-amber"><LiveDemo /></div>
        </div>
      </div>
    </section>
  );
}

function Benefits({ variant }) {
  return (
    <section className="l4-sec l4-benefits" aria-labelledby="ben-title">
      <div className="l4-wrap">
        <h2 id="ben-title" className="l4-h2" data-reveal>פחות בלגן. יותר אירוח.</h2>
        <ul className={`l4-ben l4-ben-${variant}`}>
          {BENEFITS.map((b, i) => (
            <li key={b.key} className={`l4-ben-card l4-ben-${b.key}`} data-reveal style={{ '--d': `${i * 80}ms` }}>
              {variant === 'a' ? (
                <div className="l4-ben-photo">
                  <Photo p={PHOTOS[b.photo]} />
                  <span className="l4-ben-chip"><Check size={14} strokeWidth={3} aria-hidden="true" />{b.chip}</span>
                </div>
              ) : (
                <span className="l4-ben-ic"><b.icon size={26} strokeWidth={1.9} aria-hidden="true" /></span>
              )}
              <div className="l4-ben-txt">
                <h3>{variant === 'a' && <b.icon size={20} strokeWidth={2} aria-hidden="true" className="l4-ben-h-ic" />}{b.title}</h3>
                <p>{b.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="how" className="l4-sec l4-how" aria-labelledby="how-title">
      <div className="l4-wrap">
        <h2 id="how-title" className="l4-h2" data-reveal>שלושה צעדים, ומתחילים.</h2>
        <ol className="l4-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={{ '--d': `${i * 90}ms` }}>
              <span className="l4-step-n num" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.line}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProductTiles() {
  return (
    <section className="l4-sec l4-product" aria-labelledby="prod-title">
      <div className="l4-wrap">
        <h2 id="prod-title" className="l4-h2" data-reveal>ככה זה נראה.</h2>
        <DemoTiles captions={['כל היחידות על לוח אחד', 'האורח מקבל תשובה, גם כשאתם עסוקים', 'רואים מה שולם ומה עוד ממתין']} />
      </div>
    </section>
  );
}

function Places() {
  return (
    <section className="l4-sec l4-places" aria-labelledby="places-title">
      <div className="l4-wrap">
        <h2 id="places-title" className="l4-h2" data-reveal>בנויה בשביל המקומות האלה.</h2>
        <p className="l4-sub" data-reveal>מיחידה אחת ועד מתחם שלם.</p>
      </div>
      <ul className="l4-strip" data-reveal>
        {PLACES.map((pl) => (
          <li key={pl.label} className="l4-strip-item">
            <figure>
              <Photo p={PHOTOS[pl.photo]} sizes="(min-width: 820px) 25vw, 72vw" />
              <figcaption>{pl.label}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlanPrice({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' });
  const v = useCountUp(value, inView, 900);
  return <b ref={ref} className="num">₪{fmt(inView ? v : value)}</b>;
}

function Pricing() {
  return (
    <section id="pricing" className="l4-sec l4-pricing" aria-labelledby="pricing-title">
      <div className="l4-wrap">
        <h2 id="pricing-title" className="l4-h2" data-reveal>מחיר לפי גודל המתחם.</h2>
        <p className="l4-sub" data-reveal>כל מסלול מתחיל ב-14 ימי ניסיון חינם.</p>
        <ul className="l4-plans">
          {PRICING_PLANS.map((p, i) => (
            <li key={p.key} className={`l4-plan${p.popular ? ' is-pop' : ''}`} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <div className="l4-plan-head">
                <h3>{p.nameHe}</h3>
                {p.popular && <span className="l4-plan-tag">מומלץ</span>}
              </div>
              <p className="l4-plan-desc">{p.desc}</p>
              <p className="l4-plan-price"><PlanPrice value={p.price} /><span>לחודש</span></p>
              <p className="l4-plan-year">או <span className="num">₪{p.priceYearly}</span> לחודש בחיוב שנתי</p>
            </li>
          ))}
        </ul>
        <div className="l4-center-cta" data-reveal><SignupButton /></div>
      </div>
    </section>
  );
}

function FaqAndCta({ variant }) {
  return (
    <section id="faq" className="l4-sec l4-faq-sec" aria-labelledby="faq-title">
      <div className="l4-wrap l4-narrow">
        <h2 id="faq-title" className="l4-h2" data-reveal>שאלות נפוצות</h2>
        <div className="l4-faq" data-reveal>
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>
                <span>{f.q}</span>
                <span className="l4-plus" aria-hidden="true"><Plus size={18} strokeWidth={2.25} /></span>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <div className={variant === 'a' ? 'l4-wrap-wide' : 'l4-wrap'}>
        <div className={`l4-final l4-final-${variant}`} data-reveal>
          {variant === 'a' && <Photo p={PHOTOS.villa} className="l4-final-photo" sizes="100vw" />}
          <div className="l4-final-panel">
            <h2 className="l4-h2">מתחילים היום.</h2>
            <p className="l4-sub">בלי כרטיס אשראי. בלי התחייבות.</p>
            <div className="l4-cta l4-cta-center">
              <SignupButton />
              <WhatsAppLink>
                שאלות? <span dir="ltr" className="num">{PHONE_DISPLAY}</span>
              </WhatsAppLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="l4-ftr">
      <div className="l4-wrap l4-ftr-in">
        <Wordmark />
        <nav aria-label="קישורים משפטיים" className="l4-ftr-links">
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאי שימוש</Link>
          <Link to="/accessibility">נגישות</Link>
          <Link to="/data-security">אבטחת מידע</Link>
        </nav>
        <p className="l4-ftr-copy">© {new Date().getFullYear()} ATLAS</p>
      </div>
    </footer>
  );
}

/**
 * Landing v4 (brand/direction-v4.md): warm, alive, still six sections.
 * variant "a": photo-led hero with a floating live card. variant "b": bold type + live HTML demo.
 */
export default function LandingV4({ variant = 'a' }) {
  const root = useRef(null);
  useReveal(root);
  useEffect(() => {
    document.title = 'ATLAS | מערכת ניהול לצימרים ומתחמי נופש';
  }, []);
  return (
    <div ref={root} className={`l4 l4-${variant}`} dir="rtl" lang="he">
      <a href="#main" className="l4-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        {variant === 'b' ? <HeroBold /> : <HeroPhoto />}
        <Benefits variant={variant} />
        <How />
        {variant === 'b' ? <Places /> : <ProductTiles />}
        <Pricing />
        <FaqAndCta variant={variant} />
      </main>
      <Footer />
      <CookieConsent revealAfter=".l4-hero" />
    </div>
  );
}
