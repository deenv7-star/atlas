import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, Plus } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { PRICING_PLANS } from '@/config/pricing';
import { Laptop, IPhone, Wordmark } from './Devices';
import {
  HERO_LAPTOP, HERO_PHONE, BENEFITS, STEPS, SHOTS, FAQ,
  WHATSAPP_URL, PHONE_DISPLAY, CTA_SIGNUP,
} from './content';
import './landing-v3.css';

const IC = { size: 20, strokeWidth: 1.75, 'aria-hidden': true };

function SignupButton() {
  return (
    <Link to="/register" className="l3-btn">
      {CTA_SIGNUP}
      <ArrowLeft {...IC} className="l3-btn-arrow" />
    </Link>
  );
}

function WhatsAppLink({ children = 'דברו איתנו בוואטסאפ' }) {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l3-link">
      {children}
      <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
    </a>
  );
}

function Header() {
  return (
    <header className="l3-hdr">
      <div className="l3-wrap l3-hdr-in">
        <Link to="/" className="l3-logo" aria-label="ATLAS, לדף הבית"><Wordmark /></Link>
        <nav className="l3-nav" aria-label="ניווט ראשי">
          <a href="#how">איך זה עובד</a>
          <a href="#pricing">מחירים</a>
          <a href="#faq">שאלות</a>
        </nav>
        <Link to="/login" className="l3-login">כניסה</Link>
      </div>
    </header>
  );
}

const HERO_TITLE = 'כל המתחם שלכם. במקום אחד.';
const HERO_SUB = 'הזמנות, לוח שנה, תשלומים והודעות לאורחים. בעברית, מכל מכשיר.';

function HeroCopy() {
  return (
    <>
      <h1 id="hero-title" className="l3-h1">{HERO_TITLE}</h1>
      <p className="l3-lead">{HERO_SUB}</p>
      <div className="l3-cta">
        <SignupButton />
        <WhatsAppLink />
      </div>
    </>
  );
}

function HeroCentered() {
  return (
    <section className="l3-hero l3-hero-c" aria-labelledby="hero-title">
      <div className="l3-wrap l3-hero-c-copy">
        <HeroCopy />
      </div>
      <div className="l3-wrap l3-hero-c-stage">
        <Laptop shot={HERO_LAPTOP} />
      </div>
    </section>
  );
}

function HeroSplit() {
  return (
    <section className="l3-hero l3-hero-s" aria-labelledby="hero-title">
      <div className="l3-wrap l3-hero-s-grid">
        <div className="l3-hero-s-copy"><HeroCopy /></div>
        <div className="l3-hero-s-stage"><IPhone shot={HERO_PHONE} /></div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="l3-sec l3-benefits" aria-labelledby="ben-title">
      <div className="l3-wrap">
        <h2 id="ben-title" className="l3-h2">פחות בלגן. יותר אירוח.</h2>
        <ul className="l3-ben">
          {BENEFITS.map((b) => (
            <li key={b.title}>
              <span className="l3-ic"><b.icon size={22} strokeWidth={1.75} aria-hidden="true" /></span>
              <h3>{b.title}</h3>
              <p>{b.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="how" className="l3-sec l3-how" aria-labelledby="how-title">
      <div className="l3-wrap">
        <h2 id="how-title" className="l3-h2">איך זה עובד</h2>
        <ol className="l3-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="l3-step-n num" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.line}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Shots() {
  return (
    <section className="l3-sec l3-shots" aria-labelledby="shots-title">
      <div className="l3-wrap">
        <h2 id="shots-title" className="l3-h2">ככה זה נראה.</h2>
        <ul className="l3-shot-row">
          {SHOTS.map((s) => (
            <li key={s.key} className="l3-shot">
              <figure>
                <div className="l3-shot-img">
                  <img src={s.src} width={s.w} height={s.h} alt={s.alt} loading="lazy" decoding="async" draggable={false} />
                </div>
                <figcaption>{s.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="l3-sec l3-pricing" aria-labelledby="pricing-title">
      <div className="l3-wrap">
        <h2 id="pricing-title" className="l3-h2">מחיר לפי גודל המתחם.</h2>
        <p className="l3-sub">כל מסלול מתחיל ב-14 ימי ניסיון חינם.</p>
        <ul className="l3-plans">
          {PRICING_PLANS.map((p) => (
            <li key={p.key} className={`l3-plan${p.popular ? ' is-pop' : ''}`}>
              <div className="l3-plan-head">
                <h3>{p.nameHe}</h3>
                {p.popular && <span className="l3-plan-tag">מומלץ</span>}
              </div>
              <p className="l3-plan-desc">{p.desc}</p>
              <p className="l3-plan-price"><b className="num">₪{p.price}</b><span>לחודש</span></p>
              <p className="l3-plan-year">או <span className="num">₪{p.priceYearly}</span> לחודש בחיוב שנתי</p>
            </li>
          ))}
        </ul>
        <div className="l3-center-cta"><SignupButton /></div>
      </div>
    </section>
  );
}

function FaqAndCta() {
  return (
    <section id="faq" className="l3-sec l3-faq-sec" aria-labelledby="faq-title">
      <div className="l3-wrap l3-narrow">
        <h2 id="faq-title" className="l3-h2">שאלות נפוצות</h2>
        <div className="l3-faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>
                <span>{f.q}</span>
                <Plus size={20} strokeWidth={2} aria-hidden="true" className="l3-plus" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <div className="l3-wrap">
        <div className="l3-final">
          <h2 className="l3-h2">מתחילים היום.</h2>
          <p className="l3-sub">בלי כרטיס אשראי. בלי התחייבות.</p>
          <div className="l3-cta l3-cta-center">
            <SignupButton />
            <WhatsAppLink>
              שאלות? <span dir="ltr" className="num">{PHONE_DISPLAY}</span>
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="l3-ftr">
      <div className="l3-wrap l3-ftr-in">
        <Wordmark />
        <nav aria-label="קישורים משפטיים" className="l3-ftr-links">
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאי שימוש</Link>
          <Link to="/accessibility">נגישות</Link>
          <Link to="/data-security">אבטחת מידע</Link>
        </nav>
        <p className="l3-ftr-copy">© {new Date().getFullYear()} ATLAS</p>
      </div>
    </footer>
  );
}

/** variant "a": white, centered hero with one laptop. variant "b": split hero with one iPhone, canvas sections. */
export default function LandingV3({ variant = 'a' }) {
  useEffect(() => {
    document.title = 'ATLAS | מערכת ניהול לצימרים ומתחמי נופש';
  }, []);
  return (
    <div className={`l3 l3-${variant}`} dir="rtl" lang="he">
      <a href="#main" className="l3-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        {variant === 'b' ? <HeroSplit /> : <HeroCentered />}
        <Benefits />
        <How />
        <Shots />
        <Pricing />
        <FaqAndCta />
      </main>
      <Footer />
      <CookieConsent revealAfter=".l3-hero" />
    </div>
  );
}
