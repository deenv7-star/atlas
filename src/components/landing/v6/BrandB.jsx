/**
 * Landing v6 B "מותג": brand energy. A vivid indigo hero with a clay-3D zimmer world the product
 * sits inside, product facts that count, booking that fill one calendar once it is in view,
 * and a colorful indigo/sky bento. Toned down per Deen 17.10 11:15: calm, alive, elegant > flashy. Same pricing/FAQ/steps as v5.
 * Imagery: generated for ATLAS (public/landing-v6), indigo/sky/white/green only.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, useInView, useCountUp, useTimeline, prefersReducedMotion } from '../v5/motion';
import { Mark, WhatsAppCard, Payments, TodayBoard, ReportMini } from '../v5/ui';
import { CTA_NOTE } from '../v5/content';
import { SignupButton, Steps, Pricing, Faq, Footer } from '../v5/LandingV5';
import { V6Header, Toast, PaidToast } from './shared';
import '../v5/landing-v5.css';
import './landing-v6.css';

const IMG = '/landing-v6';

/* ---------------- hero ---------------- */
const HERO_TL = [1100, 2300];

function Hero() {
  const step = useTimeline(HERO_TL);
  return (
    <section className="l6b-hero" aria-labelledby="hero-title">
      <div className="l5-wrap l6b-hero-grid">
        <div className="l6b-hero-copy">
          <p className="l6-eyebrow is-soft l5-in" style={{ '--i': 0 }}><span className="l6-live" />מערכת ניהול לצימרים ומתחמי נופש</p>
          <h1 id="hero-title" className="l6b-h1">
            <span className="l5-h1-line" style={{ '--i': 1 }}>המתחם שלכם,</span>
            <span className="l5-h1-line is-ind" style={{ '--i': 2 }}>על טייס אוטומטי.</span>
          </h1>
          <p className="l6b-lead l5-in" style={{ '--i': 3 }}>
            הזמנות מכל הערוצים בלוח אחד, וואטסאפ לאורחים שמוכן מראש ונשלח בלחיצה, ומעקב מקדמות ויתרות. בעברית.
          </p>
          <div className="l6b-cta l5-in" style={{ '--i': 4 }}>
            <SignupButton className="is-lg" />
            <a href="#fly" className="l5-btn-ghost is-lg">לראות איך זה עובד</a>
          </div>
          <p className="l5-cta-note l6b-note l5-in" style={{ '--i': 5 }}><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
        </div>
        <div className="l6b-world l5-layer" style={{ '--i': 1 }} aria-hidden="true">
          <div className="l6-indigo-grid" />
          <picture>
            <source media="(max-width: 767px)" srcSet={`${IMG}/world-760.webp`} />
            <img src={`${IMG}/world.webp`} alt="" width="1376" height="768" fetchPriority="high" decoding="async" />
          </picture>
          <Toast className={`l6b-f-toast${step >= 1 ? ' is-on' : ''}`} ch="airbnb" title="הזמנה חדשה נכנסה" sub="שירן ג. · בקתת הזית · 2 לילות" />
          <PaidToast className={`l6b-f-paid${step >= 2 ? ' is-on' : ''}`} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- facts that count ---------------- */
const FACTS = [
  { to: 3, from: 0, label: 'ערוצים על לוח אחד', unit: '' },
  { to: 10, from: 0, label: 'דקות להגדרה', unit: '' },
  { to: 14, from: 0, label: 'ימי ניסיון חינם', unit: '' },
  { to: 0, from: 9, label: 'הזמנות כפולות', unit: '' },
];

function Fact({ f, on }) {
  const up = useCountUp(Math.abs(f.to - f.from), on, 1100);
  const v = f.from > f.to ? f.from - up : f.from + up;
  return (
    <li>
      <b className="num">{on ? v : f.to}</b>
      <span>{f.label}</span>
    </li>
  );
}

function Facts() {
  const ref = useRef(null);
  const on = useInView(ref, { margin: '0px 0px -15% 0px' });
  return (
    <section className="l6b-facts" aria-label="במספרים">
      <ul ref={ref} className="l5-wrap l6b-facts-in">
        {FACTS.map((f) => <Fact key={f.label} f={f} on={on} />)}
      </ul>
    </section>
  );
}

/* ---------------- bookings fly into one calendar ---------------- */
const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const UNITS = ['האלון', 'הזית', 'התאנה', 'הגפן'];
const SOURCES = ['airbnb', 'booking', 'direct'];
const SRC_LABEL = { airbnb: 'Airbnb', booking: 'Booking.com', direct: 'ישיר' };
/** [unit, startDay, nights, channel, guest] */
const FLY = [
  [0, 0, 2, 'airbnb', 'מיכל ר.'], [1, 1, 3, 'booking', 'Jonas M.'], [2, 0, 3, 'direct', 'דנה א.'],
  [3, 2, 2, 'booking', 'Marc D.'], [0, 3, 3, 'direct', 'אבי כ.'], [2, 4, 3, 'airbnb', 'יוסי ב.'],
  [1, 5, 2, 'direct', 'נועה ל.'], [3, 5, 2, 'airbnb', 'שירן ג.'],
];
function FlyCalendar() {
  const ref = useRef(null);
  const on = useInView(ref, { margin: '0px 0px -20% 0px' });
  const [landed, setLanded] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    if (prefersReducedMotion()) { setLanded(FLY.length); return undefined; }
    const ts = FLY.map((_, i) => setTimeout(() => setLanded(i + 1), 300 + i * 140));
    return () => ts.forEach(clearTimeout);
  }, [on]);
  return (
    <section id="fly" className="l5-sec l6b-fly" aria-labelledby="fly-title">
      <div className="l5-wrap l6b-fly-in">
        <div className="l6b-fly-copy" data-reveal>
          <p className="l6-kicker">סנכרון ערוצים</p>
          <h2 id="fly-title" className="l6-h2">כל ההזמנות על לוח אחד.</h2>
          <p className="l5-sub">Airbnb, Booking.com והזמנות ישירות נכנסות לבד, והתאריכים ננעלים בכל הערוצים. בלי להעתיק ובלי כפילויות.</p>
          <p className="l6b-fly-count"><span className="num">{landed}</span>/<span className="num">{FLY.length}</span> הזמנות בלוח · <b>0 כפילויות</b></p>
        </div>
        <div ref={ref} className="l6b-fly-board" aria-hidden="true">
          <div className="l6b-srcs">
            {SOURCES.map((s) => <span key={s} className={`l6b-src is-${s}`}><Mark ch={s} size={16} />{SRC_LABEL[s]}</span>)}
          </div>
          <div className="l6b-cal">
            <div className="l6b-cal-head">
              <span />
              {DAYS.map((d, i) => <span key={d} className={i === 1 ? 'is-today' : ''}>{d}<b className="num">{18 + i}</b></span>)}
            </div>
            {UNITS.map((u, r) => (
              <div key={u} className="l6b-cal-row">
                <span className="l6b-cal-unit">{u}</span>
                <div className="l6b-cal-lane">
                  {DAYS.map((d) => <i key={d} />)}
                  {FLY.map((b, i) => (b[0] !== r ? null : (
                    <span
                      key={i}
                      className={`l6b-bk is-${b[3]}${i < landed ? ' is-landed' : ''}`}
                      style={{ insetInlineStart: `calc(${b[1]} / 7 * 100% + 2px)`, width: `calc(${b[2]} / 7 * 100% - 4px)` }}
                    >
                      {b[3] !== 'direct' && <Mark ch={b[3]} size={12} />}
                      <b dir="auto">{b[4]}</b>
                    </span>
                  )))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- colorful bento ---------------- */
function Bento() {
  return (
    <section id="story" className="l5-sec l6b-bento-sec" aria-labelledby="bento-title">
      <div className="l5-wrap">
        <div className="l6b-head" data-reveal>
          <p className="l6-kicker">מה יש בפנים</p>
          <h2 id="bento-title" className="l6-h2">כל מה שמתחם צריך. בלי העבודה השחורה.</h2>
        </div>
        <ul className="l6b-bento">
          <li className="l6b-tile is-indigo is-w7" data-reveal>
            <div className="l6b-tile-txt"><h3>וואטסאפ מוכן מראש</h3><p>אישור, הוראות הגעה ובקשה לביקורת. מוכן בזמן, נשלח בלחיצה.</p></div>
            <div className="l6b-tile-ui" aria-hidden="true"><WhatsAppCard stage={3} /></div>
          </li>
          <li className="l6b-tile is-sky is-w5" data-reveal style={{ '--d': '80ms' }}>
            <div className="l6b-tile-txt"><h3>מקדמות ויתרות במעקב</h3><p>מה שולם, מה פתוח, ותזכורת ליתרה בלחיצה.</p></div>
            <div className="l6b-tile-ui" aria-hidden="true"><Payments className="l5-card" /></div>
          </li>
          <li className="l6b-tile is-white is-w4" data-reveal>
            <div className="l6b-tile-txt"><h3>היום, במבט אחד</h3><p>מי נכנס, מי יוצא ומה לנקות.</p></div>
            <div className="l6b-tile-ui" aria-hidden="true"><div className="l5-card"><TodayBoard title={false} /></div></div>
          </li>
          <li className="l6b-tile is-lilac is-w4" data-reveal style={{ '--d': '80ms' }}>
            <div className="l6b-tile-txt"><h3>דוח לרואה החשבון</h3><p>כל ההכנסות של החודש, בלחיצה.</p></div>
            <div className="l6b-tile-ui" aria-hidden="true"><ReportMini /></div>
          </li>
          <li className="l6b-tile is-cabin is-w4" data-reveal style={{ '--d': '160ms' }}>
            <div className="l6b-tile-txt"><h3>עמוד הזמנה משלכם</h3><p>בקשות הזמנה ישירות, בלי עמלות.</p></div>
            <img src={`${IMG}/cabin.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" width="640" height="440" className="l6b-cabin" />
          </li>
        </ul>
      </div>
    </section>
  );
}

function FinalB() {
  return (
    <section className="l6-indigo l6b-final" aria-labelledby="final-title">
      <div className="l6-indigo-grid" aria-hidden="true" />
      <div className="l5-wrap l6b-final-in">
        <img src={`${IMG}/cabin.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" width="640" height="440" className="l6b-final-cabin" data-reveal />
        <div data-reveal>
          <h2 id="final-title" className="l6-h2 is-xl">פחות ניהול.<br />יותר אירוח.</h2>
          <p className="l6-indigo-sub">14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
          <div className="l6b-cta is-start">
            <SignupButton className="is-lg l6-btn-white" />
            <a href="https://wa.me/972545380085" target="_blank" rel="noopener noreferrer" className="l6-btn-glass is-lg">וואטסאפ{' '}<span dir="ltr" className="num">054-538-0085</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BrandB() {
  const root = useRef(null);
  const [settled, setSettled] = useState(false);
  useReveal(root);
  useEffect(() => { const t = setTimeout(() => setSettled(true), 2600); return () => clearTimeout(t); }, []);
  return (
    <div ref={root} className={`l5 l6 l6b${settled ? ' is-settled' : ''}`} dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V6Header tone="light" />
      <main id="main">
        <Hero />
        <Facts />
        <FlyCalendar />
        <Bento />
        <Steps />
        <Pricing />
        <Faq />
        <FinalB />
      </main>
      <Footer />
      <CookieConsent revealAfter=".l6b-hero" />
    </div>
  );
}
