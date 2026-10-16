import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, Plus, Check, X, ShieldCheck, DatabaseBackup, MessageCircle, CircleOff,
  CalendarCheck, CalendarDays, Wallet, Sun,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { PRICING_PLANS } from '@/config/pricing';
import { useReveal, useInView, useCountUp, useTimeline, prefersReducedMotion, fmt } from '@/components/landing/v4/motion';
import {
  Mark, Wordmark, AppWindow, Calendar, RevenueCard, WhatsAppCard, TodayBoard, Payments,
  SyncMini, ReportMini, DirectPageMini, FinanceView,
} from './ui';
import {
  HERO, STEPS, BEFORE_AFTER, TRUST, FAQ, WHATSAPP_URL, PHONE_DISPLAY, CTA_SIGNUP, CTA_NOTE,
} from './content';
import './landing-v5.css';

/* ---------------- shared bits ---------------- */
function SignupButton({ plan, className = '', children = CTA_SIGNUP }) {
  return (
    <Link to={plan ? `/register?plan=${plan}` : '/register'} className={`l5-btn ${className}`}>
      <span>{children}</span>
      <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" className="l5-btn-arrow" />
    </Link>
  );
}

function HeroCta({ center = false }) {
  return (
    <div className={`l5-cta${center ? ' is-center' : ''}`}>
      <div className="l5-cta-main">
        <SignupButton className="is-lg" />
        <a href="#how" className="l5-btn-ghost is-lg">לראות איך זה עובד</a>
      </div>
      <p className="l5-cta-note"><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
    </div>
  );
}

function Header() {
  return (
    <header className="l5-hdr">
      <div className="l5-wrap l5-hdr-in">
        <Link to="/" className="l5-logo" aria-label="ATLAS, לדף הבית"><Wordmark /></Link>
        <nav className="l5-nav" aria-label="ניווט ראשי">
          <a href="#product">המוצר</a>
          <a href="#how">איך מתחילים</a>
          <a href="#pricing">מחירים</a>
          <a href="#faq">שאלות</a>
        </nav>
        <div className="l5-hdr-end">
          <Link to="/login" className="l5-login">כניסה</Link>
          <Link to="/register" className="l5-btn is-sm">להתחיל חינם</Link>
        </div>
      </div>
    </header>
  );
}

function SectionHead({ id, title, sub, center = true }) {
  return (
    <div className={`l5-head${center ? ' is-center' : ''}`} data-reveal>
      <h2 id={id} className="l5-h2">{title}</h2>
      {sub && <p className="l5-sub">{sub}</p>}
    </div>
  );
}

function Channels({ quiet = false }) {
  const items = [['airbnb', 'Airbnb'], ['booking', 'Booking.com'], ['whatsapp', 'WhatsApp'], ['gcal', 'Google Calendar']];
  return (
    <section className={`l5-channels${quiet ? ' is-quiet' : ''}`} aria-labelledby="ch-title">
      <div className="l5-wrap l5-channels-in" data-reveal>
        <p id="ch-title" className="l5-channels-t">מתחברת למה שאתם כבר עובדים איתו</p>
        <ul className="l5-logos">
          {items.map(([k, n]) => (
            <li key={k} className={`l5-logo-${k}`}><Mark ch={k} size={22} /><span>{n}</span></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- A: hero ---------------- */
const HERO_TL = [150, 1300, 2500, 3300, 4300, 5600];

function HeroA() {
  const h = HERO.a;
  const step = useTimeline(HERO_TL, { active: true });
  const rev = useCountUp(48250, step >= 1, 1800);
  const waStage = step >= 6 ? 3 : step >= 4 ? 2 : step >= 1 ? 1 : 0;
  return (
    <section className="l5-hero l5-hero-a" aria-labelledby="hero-title">
      <div className="l5-hero-light" aria-hidden="true" />
      <div className="l5-wrap l5-hero-a-grid">
        <div className="l5-hero-copy">
          <h1 id="hero-title" className="l5-h1">
            {h.title.map((t, i) => <span key={t} className="l5-h1-line" style={{ '--i': i }}>{t}</span>)}
          </h1>
          <p className="l5-lead l5-in" style={{ '--i': 3 }}>{h.sub}</p>
          <div className="l5-in" style={{ '--i': 4 }}><HeroCta /></div>
        </div>
        <div className="l5-stage" aria-hidden="true">
          {/* desktop composition */}
          <div className="l5-stage-d">
            <div className="l5-layer l5-layer-cal" style={{ '--i': 0 }}>
              <AppWindow><Calendar compact showIncoming={step >= 3} /></AppWindow>
            </div>
            <div className={`l5-toast${step >= 3 ? ' is-on' : ''}`}>
              <Mark ch="booking" size={18} />
              <span><b>הזמנה חדשה נכנסה</b><small>Elena V. · סטודיו הגפן · 3 לילות</small></span>
            </div>
            <div className="l5-layer l5-layer-rev" style={{ '--i': 1 }}>
              <RevenueCard value={rev} className={step >= 2 ? '' : 'is-pending'} />
            </div>
            <div className="l5-layer l5-layer-wa" style={{ '--i': 2 }}>
              <WhatsAppCard stage={waStage} />
            </div>
          </div>
          {/* phone composition */}
          <div className="l5-stage-m">
            <div className={`l5-m-toast${waStage >= 2 ? ' is-on' : ''}`}>
              <Mark ch="whatsapp" size={20} />
              <span><b>נשלח לנועה בוואטסאפ</b><small>הוראות הגעה · נשלח אוטומטית</small></span>
            </div>
            <div className="l5-layer l5-m-today" style={{ '--i': 0 }}>
              <div className="l5-card l5-m-card"><TodayBoard /></div>
            </div>
            <div className="l5-layer l5-m-rev" style={{ '--i': 1 }}>
              <RevenueCard value={rev} className={`is-mini${step >= 2 ? '' : ' is-pending'}`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- A: bento ---------------- */
const BENTO = [
  { k: 'sync', span: 'w7', title: 'לוח אחד לכל הערוצים', line: 'Airbnb, Booking.com והזמנות ישירות נכנסים ללוח אחד ומתעדכנים לבד.', ui: <SyncMini /> },
  { k: 'wa', span: 'w5', title: 'וואטסאפ שיוצא לבד', line: 'אישור, הוראות הגעה ובקשה לביקורת. בזמן, בשם שלכם.', ui: <WhatsAppCard stage={3} className="is-flat" /> },
  { k: 'today', span: 'w5', title: 'היום, במבט אחד', line: 'מי נכנס, מי יוצא ומה צריך לנקות. בלי לחפש.', ui: <div className="l5-card is-flat"><TodayBoard rows={undefined} title={false} /></div> },
  { k: 'pay', span: 'w7', title: 'מקדמות ויתרות בזמן', line: 'מקדמה נגבית עם ההזמנה, ותזכורת ליתרה יוצאת לבד.', ui: <Payments className="l5-card is-flat" /> },
  { k: 'report', span: 'w6', title: 'דוח לרואה החשבון', line: 'כל ההכנסות של החודש, מסודרות. שולחים בלחיצה.', ui: <ReportMini /> },
  { k: 'direct', span: 'w6', title: 'עמוד הזמנה ישירה', line: 'עמוד משלכם להזמנות בלי עמלות, עם תשלום מקדמה.', ui: <DirectPageMini /> },
];

function Bento() {
  return (
    <section id="product" className="l5-sec l5-bento-sec" aria-labelledby="bento-title">
      <div className="l5-wrap">
        <SectionHead id="bento-title" title="כל העסק. מערכת אחת." sub="מה שהיה מפוזר בין יומנים, וואטסאפ ואקסל, עובד עכשיו במקום אחד." />
        <ul className="l5-bento">
          {BENTO.map((t, i) => (
            <li key={t.k} className={`l5-tile l5-tile-${t.k} is-${t.span}`} data-reveal style={{ '--d': `${(i % 2) * 80}ms` }}>
              <div className="l5-tile-ui" aria-hidden="true">{t.ui}</div>
              <div className="l5-tile-txt">
                <h3>{t.title}</h3>
                <p>{t.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section id="how" className="l5-sec l5-steps-sec" aria-labelledby="how-title">
      <div className="l5-wrap">
        <SectionHead id="how-title" title="מתחילים תוך 10 דקות." sub="בלי התקנה, בלי טכנאי ובלי להעביר נתונים ידנית." />
        <ol className="l5-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={{ '--d': `${i * 90}ms` }}>
              <div className="l5-step-top">
                <span className="l5-step-n num" aria-hidden="true">{i + 1}</span>
                <span className="l5-step-time">{s.time}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.line}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Value() {
  return (
    <section className="l5-sec l5-value-sec" aria-labelledby="value-title">
      <div className="l5-wrap">
        <SectionHead id="value-title" title="השבוע שלכם, בלי העבודה השחורה." sub="אותו עסק, אותן הזמנות. רק בלי השעות שהולכות על ניהול." />
        <div className="l5-ba" data-reveal>
          <div className="l5-ba-col is-before">
            <h3>בלי ATLAS</h3>
            <ul>{BEFORE_AFTER.before.map((t) => <li key={t}><X size={16} strokeWidth={2} aria-hidden="true" />{t}</li>)}</ul>
          </div>
          <div className="l5-ba-col is-after">
            <h3><Wordmark small /> עושה את זה בשבילכם</h3>
            <ul>{BEFORE_AFTER.after.map((t) => <li key={t}><Check size={16} strokeWidth={2.5} aria-hidden="true" />{t}</li>)}</ul>
          </div>
        </div>
        <ul className="l5-caps" data-reveal>
          <li><CircleOff size={20} strokeWidth={1.75} aria-hidden="true" /><b>אפס הזמנות כפולות</b><span>כל הערוצים על אותו לוח</span></li>
          <li><MessageCircle size={20} strokeWidth={1.75} aria-hidden="true" /><b>שעות שחוזרות אליכם</b><span>ההודעות יוצאות לבד</span></li>
          <li><Wallet size={20} strokeWidth={1.75} aria-hidden="true" /><b>כסף בזמן</b><span>מקדמה עם כל הזמנה</span></li>
        </ul>
      </div>
    </section>
  );
}

/* ---------------- pricing / faq / cta (both) ---------------- */
function PlanPrice({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' });
  const v = useCountUp(value, inView, 700);
  return <b ref={ref} className="num">₪{fmt(inView ? v : value)}</b>;
}

function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="l5-sec l5-pricing" aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <SectionHead id="pricing-title" title="מחיר לפי גודל המתחם." sub="כל מסלול מתחיל ב-14 ימי ניסיון חינם, עם כל המערכת." />
        <div className="l5-toggle" role="group" aria-label="תקופת חיוב" data-reveal>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי <span className="l5-save">חוסכים 20%</span></button>
        </div>
        <ul className="l5-plans">
          {PRICING_PLANS.map((p, i) => (
            <li key={p.key} className={`l5-plan${p.popular ? ' is-pop' : ''}`} data-reveal style={{ '--d': `${i * 70}ms` }}>
              <div className="l5-plan-head">
                <h3>{p.nameHe}</h3>
                {p.popular && <span className="l5-plan-tag">הכי פופולרי</span>}
              </div>
              <p className="l5-plan-desc">{p.desc}</p>
              <p className="l5-plan-price">
                <PlanPrice key={yearly ? 'y' : 'm'} value={yearly ? p.priceYearly : p.price} />
                <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
              </p>
              <SignupButton plan={p.key} className={p.popular ? 'is-block' : 'is-block is-quiet'} />
              <ul className="l5-plan-feat">
                {p.features.map((f) => <li key={f}><Check size={16} strokeWidth={2.25} aria-hidden="true" />{f}</li>)}
              </ul>
            </li>
          ))}
        </ul>
        <ul className="l5-trust" data-reveal>
          {TRUST.map((t, i) => {
            const I = [ShieldCheck, DatabaseBackup, MessageCircle, CalendarCheck][i];
            return <li key={t.key}><I size={16} strokeWidth={1.75} aria-hidden="true" />{t.text}</li>;
          })}
        </ul>
      </div>
    </section>
  );
}

function Faq({ limit = FAQ.length }) {
  return (
    <section id="faq" className="l5-sec l5-faq-sec" aria-labelledby="faq-title">
      <div className="l5-wrap l5-faq-grid">
        <div className="l5-faq-side" data-reveal>
          <h2 id="faq-title" className="l5-h2">שאלות נפוצות</h2>
          <p className="l5-sub">לא מצאתם תשובה? כותבים לנו, ואדם עונה.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-link">
            <Mark ch="whatsapp" size={16} />
            וואטסאפ <span dir="ltr" className="num">{PHONE_DISPLAY}</span>
            <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          </a>
        </div>
        <div className="l5-faq" data-reveal>
          {FAQ.slice(0, limit).map((f) => (
            <details key={f.q}>
              <summary>
                <span>{f.q}</span>
                <span className="l5-plus" aria-hidden="true"><Plus size={18} strokeWidth={2} /></span>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ title }) {
  return (
    <section className="l5-final-sec" aria-labelledby="final-title">
      <div className="l5-wrap">
        <div className="l5-final" data-reveal>
          <div className="l5-final-light" aria-hidden="true" />
          <h2 id="final-title" className="l5-h2 l5-final-h">{title}</h2>
          <p className="l5-sub">14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
          <HeroCta center />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="l5-ftr">
      <div className="l5-wrap l5-ftr-in">
        <Wordmark small />
        <nav aria-label="קישורים משפטיים" className="l5-ftr-links">
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאי שימוש</Link>
          <Link to="/accessibility">נגישות</Link>
          <Link to="/data-security">אבטחת מידע</Link>
        </nav>
        <p className="l5-ftr-copy">© {new Date().getFullYear()} ATLAS · נבנתה בישראל</p>
      </div>
    </footer>
  );
}

/* ---------------- B: hero with tabbed product window ---------------- */
const TABS = [
  { key: 'cal', label: 'לוח שנה', icon: CalendarDays },
  { key: 'today', label: 'היום', icon: Sun },
  { key: 'money', label: 'כספים', icon: Wallet },
];
const TAB_MS = 5000;

function ProductTabs() {
  const [tab, setTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const [auto, setAuto] = useState(true);
  const tabRefs = useRef([]);
  useEffect(() => {
    if (!auto || paused || prefersReducedMotion()) return undefined;
    const t = setTimeout(() => setTab((x) => (x + 1) % TABS.length), TAB_MS);
    return () => clearTimeout(t);
  }, [tab, paused, auto]);
  const pick = (i) => { setAuto(false); setTab(i); };
  const onKey = (e) => {
    const dir = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; // RTL
    if (!dir) return;
    e.preventDefault();
    const n = (tab + dir + TABS.length) % TABS.length;
    pick(n);
    tabRefs.current[n]?.focus();
  };
  return (
    <div
      className={`l5-pt${auto && !paused ? ' is-auto' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="l5-pt-tabs" role="tablist" aria-label="תצוגות במערכת" onKeyDown={onKey}>
        {TABS.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => { tabRefs.current[i] = el; }}
            type="button"
            role="tab"
            id={`pt-tab-${t.key}`}
            aria-selected={tab === i}
            aria-controls={`pt-panel-${t.key}`}
            tabIndex={tab === i ? 0 : -1}
            className={tab === i ? 'is-on' : ''}
            onClick={() => pick(i)}
          >
            <t.icon size={16} strokeWidth={1.75} aria-hidden="true" />
            {t.label}
            {tab === i && <i className="l5-pt-prog" key={`p${tab}`} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="l5-pt-frame">
        {TABS.map((t, i) => (
          <div
            key={t.key}
            id={`pt-panel-${t.key}`}
            role="tabpanel"
            aria-labelledby={`pt-tab-${t.key}`}
            className={`l5-pt-panel${tab === i ? ' is-on' : ''}`}
            hidden={tab !== i}
          >
            <div aria-hidden="true">
              <AppWindow active={[1, 0, 4][i]}>
                {t.key === 'cal' && <Calendar showIncoming />}
                {t.key === 'today' && (
                  <div className="l5-pt-today">
                    <TodayBoard />
                    <div className="l5-pt-aside">
                      <WhatsAppCard stage={3} className="is-flat" />
                    </div>
                  </div>
                )}
                {t.key === 'money' && <FinanceView />}
              </AppWindow>
            </div>
            <span className="l5-sr">
              {t.key === 'cal' && 'לוח שנה עם הזמנות מ-Airbnb, Booking.com והזמנות ישירות לארבע יחידות.'}
              {t.key === 'today' && 'מסך היום: שתי כניסות, יציאה אחת וניקיון אחד, והודעת וואטסאפ שנשלחה לאורחת.'}
              {t.key === 'money' && 'מסך כספים: הכנסות החודש, גרף הכנסות שנתי ותשלומים אחרונים.'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroB() {
  const h = HERO.b;
  return (
    <section className="l5-hero l5-hero-b" aria-labelledby="hero-title">
      <div className="l5-hero-light" aria-hidden="true" />
      <div className="l5-wrap l5-hero-b-copy">
        <h1 id="hero-title" className="l5-h1 l5-h1-xl">
          {h.title.map((t, i) => <span key={t} className="l5-h1-line" style={{ '--i': i }}>{t}</span>)}
        </h1>
        <p className="l5-lead l5-in" style={{ '--i': 2 }}>{h.sub}</p>
        <div className="l5-in" style={{ '--i': 3 }}><HeroCta center /></div>
      </div>
      <div className="l5-wrap-wide l5-in l5-in-stage" style={{ '--i': 4 }}>
        <ProductTabs />
      </div>
    </section>
  );
}

const ROWS = [
  { k: 'sync', title: 'כל הערוצים. לוח אחד.', line: 'Airbnb, Booking.com וההזמנות הישירות נכנסים לאותו לוח ומתעדכנים לבד, כדי שתאריך לא יימכר פעמיים.', points: ['חיבור בקישור אחד מכל ערוץ', 'הזמנה ישירה חוסמת את התאריכים בערוצים'], ui: <SyncMini /> },
  { k: 'wa', title: 'האורחים מקבלים תשובה. אתם לא צריכים לכתוב אותה.', line: 'אישור הזמנה, הוראות הגעה, תזכורת תשלום ובקשה לביקורת יוצאים בוואטסאפ, בזמן ובשם שלכם.', points: ['תבניות בעברית, מוכנות לשימוש', 'הפרטים של כל אורח ממולאים לבד'], ui: <WhatsAppCard stage={3} className="is-flat" /> },
  { k: 'money', title: 'יודעים בדיוק מי שילם.', line: 'מקדמה נגבית עם ההזמנה, תזכורת ליתרה יוצאת לבד, ובסוף החודש יש דוח מוכן לרואה החשבון.', points: ['מקדמות ויתרות לכל הזמנה', 'דוח הכנסות ב-Excel או PDF'], ui: <Payments className="l5-card is-flat" /> },
];

function FeatureRows() {
  return (
    <section id="product" className="l5-sec l5-rows-sec" aria-labelledby="rows-title">
      <div className="l5-wrap">
        <SectionHead id="rows-title" title="פחות ניהול. יותר אירוח." sub="שלושה דברים ש-ATLAS עושה בשבילכם, כל יום." />
        <div className="l5-rows">
          {ROWS.map((r, i) => (
            <article key={r.k} className={`l5-row${i % 2 ? ' is-flip' : ''}`} data-reveal>
              <div className="l5-row-txt">
                <span className="l5-row-n num">0{i + 1}</span>
                <h3>{r.title}</h3>
                <p>{r.line}</p>
                <ul>{r.points.map((p) => <li key={p}><Check size={16} strokeWidth={2.25} aria-hidden="true" />{p}</li>)}</ul>
              </div>
              <div className={`l5-row-ui l5-row-ui-${r.k}`} aria-hidden="true">{r.ui}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepsInline() {
  return (
    <section id="how" className="l5-sec l5-steps-sec is-inline" aria-labelledby="how-title">
      <div className="l5-wrap">
        <SectionHead id="how-title" title="מתחילים תוך 10 דקות." />
        <ol className="l5-steps is-inline">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={{ '--d': `${i * 90}ms` }}>
              <span className="l5-step-n num" aria-hidden="true">{i + 1}</span>
              <div><h3>{s.title}</h3><p>{s.line}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * Landing v5 (brand/direction-v5.md). Cool, light, indigo-only accent.
 * variant "a": Stripe-grade layered product hero + bento. variant "b": Linear-grade centered window with tabs.
 */
export default function LandingV5({ variant = 'a' }) {
  const root = useRef(null);
  const [settled, setSettled] = useState(false);
  useReveal(root);
  useEffect(() => {
    // Entrance animations are one-shot; once done, drop them so nothing can ever replay them.
    const t = setTimeout(() => setSettled(true), 2600);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    document.title = 'ATLAS | מערכת ניהול לצימרים ומתחמי נופש';
  }, []);
  return (
    <div ref={root} className={`l5 l5-${variant}${settled ? ' is-settled' : ''}`} dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        {variant === 'b' ? (
          <>
            <HeroB />
            <Channels quiet />
            <FeatureRows />
            <StepsInline />
            <Pricing />
            <Faq limit={5} />
            <FinalCta title="הצימר שלכם, על טייס אוטומטי." />
          </>
        ) : (
          <>
            <HeroA />
            <Channels />
            <Bento />
            <Steps />
            <Value />
            <Pricing />
            <Faq />
            <FinalCta title="פחות ניהול. יותר הזמנות." />
          </>
        )}
      </main>
      <Footer />
      <CookieConsent revealAfter=".l5-hero" />
    </div>
  );
}
