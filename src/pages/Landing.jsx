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
import '@/components/landing/v2/landing-b.css';

const IC = { size: 20, strokeWidth: 1.75, 'aria-hidden': true };

function SignupButton({ className = '', label = CTA_SIGNUP }) {
  return (
    <Link to="/register" className={`btn btn-primary ${className}`}>
      {label}
      <ArrowLeft {...IC} className="btn-arrow" />
    </Link>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { rootMargin: '-68px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="hdr-sentinel hdr-sentinel-b" />
      <header className="hdr hdr-b" data-scrolled={scrolled}>
        <div className="wrap hdr-in">
          <Link to="/" className="hdr-logo" aria-label="ATLAS, לדף הבית">
            <Wordmark tone={scrolled ? 'dark' : 'light'} />
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

function Segmented({ items, index, select, label, className = '' }) {
  return (
    <div className={`seg ${className}`} role="group" aria-label={label}>
      {items.map((s, i) => (
        <button key={s.key} type="button" aria-pressed={i === index} className="seg-btn" onClick={() => select(i)}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

function Hero() {
  const { index, select, bind } = useRotator(SCREENS.length, 3800);
  return (
    <section className="hero-b" aria-labelledby="hero-title">
      <div className="wrap hero-b-copy">
        <p className="hero-q">בעלי צימרים? מתחמי נופש? וילות?</p>
        <h1 id="hero-title" className="h1">
          <span className="h1-line">אתם מארחים.</span>{' '}
          <span className="h1-line"><span className="hl">ATLAS</span> מנהלת את כל השאר.</span>
        </h1>
        <p className="lead">לוח שנה, הזמנות, תשלומים והודעות לאורחים. במקום אחד, בעברית.</p>
        <div className="cta-row">
          <SignupButton />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
            <MessageCircle {...IC} />
            {CTA_CONTACT}
          </a>
        </div>
      </div>
      <div className="wrap hero-b-stage" {...bind}>
        <Segmented items={SCREENS} index={index} select={select} label="מסכים מתוך ATLAS" className="seg-dark" />
        <div className="hero-b-devices">
          <Laptop shots={SCREENS} index={index} priority />
          <Phone shots={SCREENS} index={index} priority className="hero-b-phone" />
        </div>
      </div>
    </section>
  );
}

function Sync() {
  return (
    <section className="sec sec-sync-b" aria-labelledby="sync-title">
      <div className="wrap sync-b-grid">
        <div>
          <h2 id="sync-title" className="h2">שלושה ערוצים.<br />לוח שנה אחד.</h2>
          <p className="sub">כל הזמנה מכל ערוץ נכנסת ללוח השנה ומתעדכנת לבד.</p>
        </div>
        <SyncDiagram className="sync-b" />
      </div>
    </section>
  );
}

function ModuleVisual({ m }) {
  if (m.key === 'cleaning') {
    return <PhoneStatic src={MOBILE_CLEANING} alt={CROPS.cleaning.alt} className="mx-phone" />;
  }
  const key = m.crop || m.key;
  const crop = CROPS[key];
  const small = CROPS_MOBILE[key];
  return (
    <picture className="mx-shot">
      {small && <source media="(max-width: 759px)" srcSet={small.src} width={small.w} height={small.h} />}
      <img src={crop.src} width={crop.w} height={crop.h} alt={crop.alt} loading="lazy" decoding="async" />
    </picture>
  );
}

function Modules() {
  const { index, select, bind } = useRotator(MODULES.length, 5200);
  const active = MODULES[index];
  return (
    <section id="modules" className="sec sec-modules-b" aria-labelledby="modules-title">
      <div className="wrap">
        <h2 id="modules-title" className="h2 center">כל מה שהמתחם צריך, במערכת אחת.</h2>
        <div className="mx" {...bind}>
          <ul className="mx-list" role="group" aria-label="מודולים">
            {MODULES.map((m, i) => (
              <li key={m.key}>
                <button type="button" className="mx-item" aria-pressed={i === index} onClick={() => select(i)}>
                  <span className="mx-ic"><m.icon {...IC} /></span>
                  <span className="mx-txt">
                    <b>{m.title}</b>
                    <span>{m.line}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className={`mx-stage mx-stage-${active.key}`} aria-live="polite">
            <div key={active.key} className="mx-fade">
              <ModuleVisual m={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PHONE_ROW = ['messages', 'dashboard', 'calendar'].map((k) => SCREENS.find((s) => s.key === k));

function Anywhere() {
  return (
    <section className="sec sec-anywhere-b" aria-labelledby="any-title">
      <div className="wrap">
        <h2 id="any-title" className="h2 center">המתחם בכיס.</h2>
        <p className="sub center">כל מסך עובד גם בטלפון, מכל מקום.</p>
        <p className="center any-pill"><span className="pill-note"><Smartphone {...IC} />עובד מהנייד, בלי להתקין</span></p>
        <div className="phones-row">
          {PHONE_ROW.map((s, i) => (
            <Phone key={s.key} shots={[s]} index={0} className={`row-phone row-phone-${i}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="sec sec-trust-b" aria-labelledby="trust-title">
      <div className="wrap">
        <h2 id="trust-title" className="h2">המידע שלכם נשאר שלכם.</h2>
        <ul className="trust-b">
          {TRUST.map((t) => (
            <li key={t.title}>
              <t.icon size={28} strokeWidth={1.75} aria-hidden="true" className="trust-b-ic" />
              <h3>{t.title}</h3>
              <p>{t.line}</p>
            </li>
          ))}
        </ul>
        <p><Link to="/data-security" className="text-link">איך אנחנו שומרים על המידע</Link></p>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="sec sec-feat-b" aria-labelledby="feat-title">
      <div className="wrap">
        <h2 id="feat-title" className="h2 center">ועוד הרבה בפנים.</h2>
        <ul className="feat-b">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <f.icon size={24} strokeWidth={1.75} aria-hidden="true" />
              <h3>{f.title}</h3>
              <p>{f.line}</p>
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
    <section id="pricing" className="sec sec-pricing-b" aria-labelledby="pricing-title">
      <div className="wrap">
        <div className="trial-b">
          <p className="trial-b-big">14 ימי ניסיון בחינם וללא התחייבות</p>
          <SignupButton className="btn-light" />
        </div>
        <h2 id="pricing-title" className="h2 center">מחיר לפי גודל המתחם.</h2>
        <div className="center-row">
          <div className="bill-toggle" role="group" aria-label="תדירות חיוב">
            <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
            <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי <em>חוסכים 20%</em></button>
          </div>
        </div>
        <div className="plans-b">
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
                  <Link to="/register" className={`btn ${p.popular ? 'btn-light' : 'btn-ghost'}`}>{CTA_SIGNUP}</Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="sec" aria-labelledby="faq-title">
      <div className="wrap">
        <h2 id="faq-title" className="h2 center">שאלות נפוצות</h2>
        <div className="faq faq-b">
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
    <section id="contact" className="sec sec-contact-b" aria-labelledby="contact-title">
      <div className="wrap">
        <div className="contact-b">
          <div className="contact-b-side">
            <h2 id="contact-title" className="h2">רוצים לראות את זה על המתחם שלכם?</h2>
            <p className="sub">השאירו פרטים, או דברו איתנו ישר.</p>
            <ul className="contact-links">
              <li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><MessageCircle {...IC} />וואטסאפ</a></li>
              <li><a href={PHONE_TEL} dir="ltr"><PhoneIcon {...IC} />{PHONE_DISPLAY}</a></li>
              <li><a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr"><Mail {...IC} />{SUPPORT_EMAIL}</a></li>
            </ul>
          </div>
          <div className="contact-b-form">
            <ContactForm idPrefix="b-lead" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="ftr ftr-b">
      <div className="wrap ftr-in">
        <Wordmark tone="light" />
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
    <div className="lv2 lv2-b" dir="rtl" lang="he">
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
