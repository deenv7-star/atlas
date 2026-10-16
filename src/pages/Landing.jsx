import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, MessageCircle, Phone as PhoneIcon, Mail, Plus, Smartphone } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { PRICING_PLANS } from '@/config/pricing';
import { Laptop, Phone, PhoneStatic, Wordmark, useRotator } from '@/components/landing/v2/Devices';
import SyncDiagram from '@/components/landing/v2/SyncDiagram';
import ContactForm from '@/components/landing/v2/ContactForm';
import {
  SCREENS, CROPS, CROPS_MOBILE, MODULES, FEATURES, TRUST, FAQ, MOBILE_CLEANING, planFeature,
  WHATSAPP_URL, PHONE_DISPLAY, PHONE_TEL, SUPPORT_EMAIL, CTA_SIGNUP, CTA_CONTACT,
} from '@/components/landing/v2/content';
import '@/components/landing/v2/landing-v2.css';
import '@/components/landing/v2/landing-a.css';

const IC = { size: 20, strokeWidth: 1.75, 'aria-hidden': true };

function SignupButton({ className = '', label = CTA_SIGNUP }) {
  return (
    <Link to="/register" className={`btn btn-primary ${className}`}>
      {label}
      <ArrowLeft {...IC} className="btn-arrow" />
    </Link>
  );
}

function WhatsAppButton({ className = 'btn-ghost' }) {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`btn ${className}`}>
      <MessageCircle {...IC} />
      {CTA_CONTACT}
    </a>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="hdr-sentinel" />
      <header className="hdr" data-scrolled={scrolled}>
        <div className="wrap hdr-in">
          <Link to="/" className="hdr-logo" aria-label="ATLAS, לדף הבית">
            <Wordmark />
          </Link>
          <nav className="hdr-nav" aria-label="ניווט ראשי">
            <a href="#modules">מה יש בפנים</a>
            <a href="#pricing">מחירים</a>
            <a href="#faq">שאלות</a>
            <a href="#contact">צור קשר</a>
          </nav>
          <div className="hdr-actions">
            <a className="icon-btn" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="דברו איתנו בוואטסאפ">
              <MessageCircle {...IC} />
            </a>
            <Link to="/login" className="text-link">כניסה</Link>
            <Link to="/register" className="btn btn-primary btn-sm">{CTA_SIGNUP}</Link>
          </div>
        </div>
      </header>
    </>
  );
}

function ScreenTabs({ index, select, label }) {
  return (
    <div className="scr-tabs" role="group" aria-label={label}>
      {SCREENS.map((s, i) => (
        <button
          key={s.key}
          type="button"
          aria-pressed={i === index}
          className="scr-tab"
          onClick={() => select(i)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function Hero() {
  const { index, select, bind } = useRotator(SCREENS.length, 3800);
  return (
    <section className="hero-a" aria-labelledby="hero-title">
      <div className="wrap hero-a-grid">
        <div className="hero-a-copy">
          <p className="hero-q">בעלי צימרים? מתחמי נופש? וילות?</p>
          <h1 id="hero-title" className="h1">
            <span className="h1-line">אתם מארחים.</span>{' '}
            <span className="h1-line"><span className="hl">ATLAS</span> מנהלת את כל השאר.</span>
          </h1>
          <p className="lead">לוח שנה, הזמנות, תשלומים והודעות לאורחים. במקום אחד, בעברית.</p>
          <div className="cta-row">
            <SignupButton />
            <WhatsAppButton />
          </div>
        </div>
        <div className="hero-a-stage" {...bind}>
          <div className="hero-a-devices">
            <Laptop shots={SCREENS} index={index} priority />
            <Phone shots={SCREENS} index={index} priority className="hero-a-phone" />
          </div>
          <ScreenTabs index={index} select={select} label="מסכים מתוך ATLAS" />
        </div>
      </div>
    </section>
  );
}

function Sync() {
  return (
    <section className="sec sec-sync" aria-labelledby="sync-title">
      <div className="wrap">
        <h2 id="sync-title" className="h2 center">שלושה ערוצים. לוח שנה אחד.</h2>
        <p className="sub center">כל הזמנה מכל ערוץ נכנסת ללוח השנה ומתעדכנת לבד.</p>
        <SyncDiagram />
      </div>
    </section>
  );
}

function ModuleCard({ m, big = false, tall = false }) {
  const cropKey = m.crop || m.key;
  const crop = CROPS[cropKey];
  const small = CROPS_MOBILE[cropKey];
  return (
    <article className={`mod mod-${m.key}${big ? ' mod-big' : ''}${tall ? ' mod-tall' : ''}`}>
      <div className="mod-head">
        <span className={`mod-ic tone-${m.tone}`}><m.icon {...IC} /></span>
        <div>
          <h3>{m.title}</h3>
          <p>{m.line}</p>
        </div>
      </div>
      <div className="mod-shot">
        {tall ? (
          <PhoneStatic src={MOBILE_CLEANING} alt={crop.alt} className="mod-phone" />
        ) : (
          <picture>
            {small && <source media="(max-width: 759px)" srcSet={small.src} width={small.w} height={small.h} />}
            <img src={crop.src} width={crop.w} height={crop.h} alt={crop.alt} loading="lazy" decoding="async" />
          </picture>
        )}
      </div>
    </article>
  );
}

function Modules() {
  const by = Object.fromEntries(MODULES.map((m) => [m.key, m]));
  return (
    <section id="modules" className="sec" aria-labelledby="modules-title">
      <div className="wrap">
        <h2 id="modules-title" className="h2">כל מה שהמתחם צריך, במערכת אחת.</h2>
        <div className="bento">
          <ModuleCard m={by.calendar} big />
          <ModuleCard m={by.cleaning} tall />
          <ModuleCard m={by.messages} />
          <ModuleCard m={by.payments} />
          <ModuleCard m={by.leads} big />
          <ModuleCard m={by.bookings} />
        </div>
      </div>
    </section>
  );
}

const MOBILE_SET = SCREENS.filter((s) => ['dashboard', 'calendar', 'messages', 'payments'].includes(s.key));

function Anywhere() {
  const { index, select, bind } = useRotator(MOBILE_SET.length, 3200);
  return (
    <section className="sec sec-anywhere" aria-labelledby="any-title">
      <div className="wrap any-grid">
        <div className="any-copy">
          <h2 id="any-title" className="h2">המתחם בכיס.</h2>
          <p className="sub">כל מסך עובד גם בטלפון. הזמנה חדשה, הודעה לאורח או תשלום, מכל מקום.</p>
          <span className="pill-note"><Smartphone {...IC} />עובד מהנייד, בלי להתקין</span>
          <div className="any-tabs" role="group" aria-label="מסכים בנייד">
            {MOBILE_SET.map((s, i) => (
              <button key={s.key} type="button" aria-pressed={i === index} className="scr-tab" onClick={() => select(i)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="any-stage" {...bind}>
          <Phone shots={MOBILE_SET} index={index} className="any-phone" />
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="sec sec-trust" aria-labelledby="trust-title">
      <div className="wrap">
        <h2 id="trust-title" className="h2 center">המידע שלכם נשאר שלכם.</h2>
        <ul className="trust">
          {TRUST.map((t) => (
            <li key={t.title} className="trust-item">
              <span className="trust-ic"><t.icon size={26} strokeWidth={1.75} aria-hidden="true" /></span>
              <h3>{t.title}</h3>
              <p>{t.line}</p>
            </li>
          ))}
        </ul>
        <p className="trust-more">
          <Link to="/data-security" className="text-link">איך אנחנו שומרים על המידע</Link>
        </p>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="sec" aria-labelledby="feat-title">
      <div className="wrap">
        <h2 id="feat-title" className="h2">ועוד הרבה בפנים.</h2>
        <ul className="feat">
          {FEATURES.map((f) => (
            <li key={f.title} className="feat-item">
              <span className="feat-ic"><f.icon {...IC} /></span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="sec sec-pricing" aria-labelledby="pricing-title">
      <div className="wrap">
        <h2 id="pricing-title" className="h2 center">מחיר לפי גודל המתחם.</h2>
        <div className="bill-toggle" role="group" aria-label="תדירות חיוב">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי <em>חוסכים 20%</em></button>
        </div>
        <div className="plans">
          {PRICING_PLANS.map((p) => {
            const price = yearly ? p.priceYearly : p.price;
            return (
              <article key={p.key} className={`plan${p.popular ? ' is-pop' : ''}`}>
                {p.popular && <span className="plan-badge">הכי נבחר</span>}
                <h3>{p.nameHe}</h3>
                <p className="plan-desc">{p.desc}</p>
                <p className="plan-price"><b className="num">₪{price}</b><span>{yearly ? 'לחודש, בחיוב שנתי' : 'לחודש'}</span></p>
                <ul className="checks">
                  {p.features.map(planFeature).map((f) => (
                    <li key={f}><Check size={18} strokeWidth={2} aria-hidden="true" />{f}</li>
                  ))}
                </ul>
                {p.key === 'business' ? (
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">{CTA_CONTACT}</a>
                ) : (
                  <Link to="/register" className={`btn ${p.popular ? 'btn-primary' : 'btn-ghost'}`}>{CTA_SIGNUP}</Link>
                )}
              </article>
            );
          })}
        </div>
        <div className="trial-band">
          <p>14 ימי ניסיון בחינם וללא התחייבות</p>
          <SignupButton className="btn-light" label="מתחילים עכשיו" />
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="sec" aria-labelledby="faq-title">
      <div className="wrap faq-wrap">
        <h2 id="faq-title" className="h2">שאלות נפוצות</h2>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                <span>{f.q}</span>
                <Plus size={22} strokeWidth={2} aria-hidden="true" className="faq-plus" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="sec sec-contact" aria-labelledby="contact-title">
      <div className="wrap contact-grid">
        <div className="contact-copy">
          <h2 id="contact-title" className="h2">רוצים לראות את זה על המתחם שלכם?</h2>
          <p className="sub">השאירו פרטים, או דברו איתנו ישר.</p>
          <ul className="contact-links">
            <li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><MessageCircle {...IC} />וואטסאפ</a></li>
            <li><a href={PHONE_TEL} dir="ltr"><PhoneIcon {...IC} />{PHONE_DISPLAY}</a></li>
            <li><a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr"><Mail {...IC} />{SUPPORT_EMAIL}</a></li>
          </ul>
        </div>
        <div className="contact-card">
          <ContactForm idPrefix="a-lead" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <Wordmark />
        <nav aria-label="קישורים משפטיים" className="ftr-links">
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאי שימוש</Link>
          <Link to="/accessibility">נגישות</Link>
          <Link to="/data-security">אבטחת מידע</Link>
          <Link to="/login">כניסה</Link>
        </nav>
        <p className="ftr-copy">© {new Date().getFullYear()} ATLAS</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  useEffect(() => {
    document.title = 'ATLAS | מערכת ניהול לצימרים ומתחמי נופש';
  }, []);
  return (
    <div className="lv2 lv2-a" dir="rtl" lang="he">
      <a href="#main" className="skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        <Hero />
        <Sync />
        <Modules />
        <Anywhere />
        <Trust />
        <Features />
        <Pricing />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
