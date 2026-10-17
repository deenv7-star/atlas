/**
 * Landing v8 P "מרכז שליטה" (interactive command hero). Split hero: a bold headline and CTA on one
 * side, and on the other a large interactive product card with pill tabs (היום / לוח שנה / וואטסאפ /
 * תשלומים) that auto-cycle and are clickable. Each tab shows the REAL ATLAS app v8 screen (desktop C
 * bento on wide screens, the D mobile app on phones, captured at 2x in demo mode) with an animated
 * transition and a live notification. Guest faces and channel chips sit around the card.
 * Below: a snap carousel of big feature cards (photo + real UI + one line), "before vs with ATLAS",
 * product numbers in indigo / sky / mint / lilac tiles, pricing with a toggle, FAQ and an indigo CTA.
 * Every number inside the product is example data, labelled. No testimonials, logos or customer counts.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check, X, ChevronLeft, ChevronRight, Sun, CalendarDays, MessageCircle, Wallet, RefreshCw,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, prefersReducedMotion } from '../v5/motion';
import { Mark } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL, BEFORE_AFTER } from '../v5/content';
import { SignupButton, Faq, Footer } from '../v5/LandingV5';
import { V7Header } from '../v7/shared7';
import {
  ph, scr, UiImg, FaceStack, Toast, WaToast, PaidToast, useCount, Pricing8, Credits,
} from './shared8';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-p.css';

const NAV = [['#product', 'המוצר'], ['#features', 'יכולות'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];
const CYCLE = 5200;

const TABS = [
  {
    id: 'today', label: 'היום', I: Sun, s: 'today',
    toast: <Toast face="ben" title="כניסה היום ב-15:00" sub="רוני פרץ · האלון · 2 לילות" />,
  },
  {
    id: 'cal', label: 'לוח שנה', I: CalendarDays, s: 'calendar',
    toast: <Toast tone="sky" icon={<RefreshCw size={17} strokeWidth={2.2} />} title="כל הערוצים סונכרנו" sub="לפני דקה · בלי כפילויות" />,
  },
  { id: 'wa', label: 'וואטסאפ', I: MessageCircle, s: 'messages', toast: <WaToast /> },
  { id: 'pay', label: 'תשלומים', I: Wallet, s: 'payments', toast: <PaidToast amount="₪2,950" sub="יתרה · ליאור ושני" /> },
];

/* ---------------- the interactive product card ---------------- */
function Command() {
  const [act, setAct] = useState(0);
  const [run, setRun] = useState(0); // restarts the progress bar
  const [paused, setPaused] = useState(false);
  const [auto, setAuto] = useState(true);
  const tabsRef = useRef([]);

  useEffect(() => { if (prefersReducedMotion()) setAuto(false); }, []);
  useEffect(() => {
    if (!auto || paused) return undefined;
    const t = setTimeout(() => { setAct((a) => (a + 1) % TABS.length); setRun((r) => r + 1); }, CYCLE);
    return () => clearTimeout(t);
  }, [act, auto, paused, run]);
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const pick = useCallback((i) => { setAct(i); setRun((r) => r + 1); }, []);
  const onKey = (e) => {
    const dir = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; // RTL: left = next
    if (!dir) return;
    e.preventDefault();
    const n = (act + dir + TABS.length) % TABS.length;
    pick(n);
    tabsRef.current[n]?.focus();
  };

  return (
    <div
      className="p-cmd"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="p-slab" aria-hidden="true" />
      <div className="p-card">
        <div className="p-tabs" role="tablist" aria-label="מסכים מתוך ATLAS" onKeyDown={onKey}>
          {TABS.map((t, i) => {
            const I = t.I;
            return (
              <button
                key={t.id}
                ref={(el) => { tabsRef.current[i] = el; }}
                type="button"
                role="tab"
                id={`ptab-${t.id}`}
                aria-selected={act === i}
                aria-controls="p-panel"
                tabIndex={act === i ? 0 : -1}
                className={`p-tab${act === i ? ' is-on' : ''}`}
                onClick={() => pick(i)}
              >
                <I size={17} strokeWidth={2} aria-hidden="true" />
                <span>{t.label}</span>
                {act === i && auto && <i key={run} className={`p-tab-bar${paused ? ' is-paused' : ''}`} style={{ '--t': `${CYCLE}ms` }} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <div className="p-screen" id="p-panel" role="tabpanel" aria-labelledby={`ptab-${TABS[act].id}`}>
          {TABS.map((t, i) => (
            <picture key={t.id} className={`p-shot${act === i ? ' is-on' : ''}`}>
              <source media="(max-width: 699px)" srcSet={scr(`d-${t.s}`)} width="780" height="1688" />
              <img src={scr(`c-${t.s}`)} alt={act === i ? `מסך ${t.label} ב-ATLAS, עם נתוני דוגמה` : ''} width="1500" height="1212" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            </picture>
          ))}
          {TABS.map((t, i) => (
            <div key={t.id} className={`p-pop${act === i ? ' is-on' : ''}`} aria-hidden={act !== i}>{t.toast}</div>
          ))}
        </div>
      </div>
      <div className="p-orbit is-faces" aria-hidden="true">
        <FaceStack faces={['noa', 'tom', 'maya', 'shir']} size={34} lazy={false} />
        <b><span className="num">4</span> אורחים מגיעים היום</b>
      </div>
      <ul className="p-orbit is-ch" aria-label="ערוצים שמתחברים ל-ATLAS">
        <li><Mark ch="booking" size={15} />Booking.com</li>
        <li><Mark ch="airbnb" size={15} />Airbnb</li>
        <li><Mark ch="direct" size={15} />הזמנה ישירה</li>
      </ul>
    </div>
  );
}

function Hero() {
  return (
    <section id="product" className="p-hero" aria-labelledby="hero-title">
      <div className="p-hero-in">
        <div className="p-copy">
          <p className="p-pill"><span className="p-live" aria-hidden="true" />לוח הבקרה של הצימר</p>
          <h1 id="hero-title" className="p-h1">
            <span className="p-h1-l">כל המתחם.</span>
            <span className="p-h1-l"><mark>במסך אחד.</mark></span>
          </h1>
          <p className="p-lead">הזמנות מכל הערוצים, וואטסאפ לאורחים ותשלומים. לחצו על הלשוניות, ככה זה נראה מבפנים.</p>
          <div className="p-cta">
            <SignupButton className="is-lg" />
            <a href="#features" className="v8-ghost">מה יש בפנים</a>
          </div>
          <p className="p-note"><Check size={14} strokeWidth={2.6} aria-hidden="true" />{CTA_NOTE} · הגדרה ב-10 דקות</p>
        </div>
        <Command />
      </div>
      <p className="p-hero-cap">המסכים מתוך ATLAS, עם נתוני דוגמה</p>
    </section>
  );
}

/* ---------------- feature carousel ---------------- */
const CARDS = [
  { t: 'לוח אחד לכל הערוצים', p: 'Airbnb, Booking.com וישיר על אותו לוח. הזמנה בערוץ אחד חוסמת את השאר.', img: 'aframe-blue', ui: 'd-strip', tone: 'ind', pos: '50% 40%' },
  { t: 'וואטסאפ שיוצא לבד', p: 'אישור, הוראות הגעה ובקשה לביקורת, בזמן ועם השם של האורח.', img: 'friends-pool', toast: 'wa', tone: 'mint', pos: '50% 40%' },
  { t: 'מקדמה עם ההזמנה', p: 'הכסף נגבה בזמן, והיתרה מקבלת תזכורת בלי שתרדפו אחריה.', img: 'villa-pool', ui: 'paykpi', tone: 'sky', pos: '50% 60%' },
  { t: 'תפוסה במבט אחד', p: 'כמה לילות מוזמנים, כמה פנויים, ואיפה כדאי להוריד מחיר.', img: 'aframe-sky', ui: 'occ', tone: 'lilac', pos: '50% 35%' },
  { t: 'מה קורה היום', p: 'כניסות, יציאות וניקיונות לפי סדר, עם כפתור אחד לכל משימה.', img: 'host-laptop', ui: 'today', tone: 'ind', pos: '40% 40%' },
  { t: 'דוח לרואה החשבון', p: 'כל תשלום נרשם. Excel או PDF בסוף החודש, בלחיצה.', img: 'deck-couple', ui: 'revenue', tone: 'sky', pos: '50% 50%' },
];

function Carousel() {
  const track = useRef(null);
  const [prog, setProg] = useState(0);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = track.current;
    if (!el || !('IntersectionObserver' in window)) { setNear(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const onScroll = () => {
    const el = track.current; if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProg(max > 0 ? Math.min(1, Math.abs(el.scrollLeft) / max) : 0);
  };
  const go = (dir) => {
    const el = track.current; if (!el) return;
    const card = el.querySelector('li');
    const w = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: -dir * w, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); // RTL: next = towards the left
  };
  return (
    <section id="features" className="p-car" aria-labelledby="car-title">
      <div className="l5-wrap p-car-head" data-reveal>
        <div>
          <h2 id="car-title" className="v8-h2">מה ATLAS <span className="is-ind">עושה בשבילכם.</span></h2>
          <p className="v8-txt">שש עבודות שהמערכת לוקחת מכם, כל יום.</p>
        </div>
        <div className="p-car-nav">
          <button type="button" onClick={() => go(-1)} aria-label="הכרטיס הקודם"><ChevronRight size={22} strokeWidth={2} aria-hidden="true" /></button>
          <button type="button" onClick={() => go(1)} aria-label="הכרטיס הבא"><ChevronLeft size={22} strokeWidth={2} aria-hidden="true" /></button>
        </div>
      </div>
      <ul className="p-track" ref={track} onScroll={onScroll} tabIndex={0} aria-label="יכולות ATLAS">
        {CARDS.map((c, i) => (
          <li key={c.t} className={`p-fc is-${c.tone}`} data-reveal style={{ '--d': `${Math.min(i, 3) * 80}ms` }}>
            <div className="p-fc-media">
              <img src={ph(c.img)} alt="" loading={near ? 'eager' : 'lazy'} decoding="async" width="900" height="1000" style={{ objectPosition: c.pos }} />
              <div className={`p-fc-ui is-${c.ui || 'toast'}`}>
                {c.ui ? <UiImg n={c.ui} lazy={!near} /> : <WaToast />}
              </div>
            </div>
            <div className="p-fc-copy">
              <h3>{c.t}</h3>
              <p>{c.p}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="l5-wrap"><div className="p-car-prog" aria-hidden="true"><i style={{ transform: `scaleX(${0.18 + prog * 0.82})` }} /></div></div>
    </section>
  );
}

/* ---------------- before vs with ---------------- */
function BeforeWith() {
  return (
    <section className="p-bw" aria-labelledby="bw-title">
      <div className="l7-inset"><div className="p-bw-box">
        <div className="v8-head is-center" data-reveal>
          <h2 id="bw-title" className="v8-h2">אותו מתחם. <span className="is-ind">יום אחר לגמרי.</span></h2>
        </div>
        <ol className="p-bw-row">
          {BEFORE_AFTER.before.map((b, i) => (
            <li key={b} className="p-bw-pair" data-reveal style={{ '--d': `${i * 80}ms` }}>
              <p className="p-bw-b"><span className="p-bw-ic is-x"><X size={15} strokeWidth={2.6} aria-hidden="true" /></span><span><small>לפני</small>{b}</span></p>
              <p className="p-bw-a"><span className="p-bw-ic is-v"><Check size={15} strokeWidth={2.8} aria-hidden="true" /></span><span><small>עם ATLAS</small>{BEFORE_AFTER.after[i]}</span></p>
            </li>
          ))}
        </ol>
        <img className="p-bw-ph" src={ph('glass-cabin')} alt="" loading="lazy" decoding="async" width="1200" height="800" />
      </div></div>
    </section>
  );
}

/* ---------------- numbers ---------------- */
function Num({ to, pre = '', className = '' }) {
  const ref = useRef(null);
  const v = useCount(to, ref);
  return <b ref={ref} className={`num ${className}`} dir="ltr">{pre}{v}</b>;
}

function Numbers() {
  return (
    <section className="p-num" aria-labelledby="num-title">
      <div className="l7-inset">
        <h2 id="num-title" className="v8-h2 p-num-h" data-reveal>המוצר, <span className="is-ind">במספרים.</span></h2>
        <div className="p-num-grid">
          <div className="p-nt is-ind is-big" data-reveal>
            <Num to={3} />
            <span className="p-nt-u">ערוצים על לוח אחד</span>
            <ul className="p-nt-ch" aria-label="ערוצים">
              <li><Mark ch="airbnb" size={15} />Airbnb</li><li><Mark ch="booking" size={15} />Booking.com</li><li><Mark ch="direct" size={15} />ישיר</li>
            </ul>
            <div className="p-nt-ui"><UiImg n="sources" /></div>
          </div>
          <div className="p-nt is-sky" data-reveal style={{ '--d': '80ms' }}><Num to={10} /><span className="p-nt-u">דקות מההרשמה ועד לוח מסונכרן</span></div>
          <div className="p-nt is-photo" data-reveal style={{ '--d': '160ms' }}>
            <img src={ph('mom-son')} alt="" loading="lazy" decoding="async" width="900" height="1000" />
          </div>
          <div className="p-nt is-mint" data-reveal style={{ '--d': '80ms' }}><Num to={14} /><span className="p-nt-u">ימי ניסיון, בלי כרטיס אשראי</span></div>
          <div className="p-nt is-lilac" data-reveal style={{ '--d': '160ms' }}><Num to={0} pre="₪" /><span className="p-nt-u">עמלה על הזמנה ישירה</span></div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- final CTA ---------------- */
function Final() {
  return (
    <section className="p-final" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="p-final-box" data-reveal>
          <div className="p-final-copy">
            <h2 id="final-title" className="p-final-h">המתחם שלכם, תחת שליטה.</h2>
            <p className="p-final-sub">14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
            <div className="p-final-cta">
              <SignupButton className="is-lg v8-btn-white" />
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="p-final-link"><Mark ch="whatsapp" size={18} />שאלה? כתבו לנו</a>
            </div>
          </div>
          <div className="p-final-media" aria-hidden="true">
            <div className="p-final-phone"><img src={scr('d-today')} alt="" loading="lazy" decoding="async" width="780" height="1688" /></div>
            <PaidToast className="p-final-t1" />
            <Toast face="noa" ch="airbnb" title="הזמנה חדשה נכנסה" sub="נועה ל. · 2 לילות · הזית" className="p-final-t2" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingP() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 v8 lp8" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Carousel />
        <BeforeWith />
        <Numbers />
        <Pricing8 />
        <Faq limit={5} />
        <Final />
      </main>
      <Credits />
      <Footer />
      <CookieConsent revealAfter=".p-hero" />
    </div>
  );
}
