/**
 * Landing v7 I "מסביב לאורחים" (avatar orbit). From Deen's references: mindset health (calm
 * centred headline with real faces floating around it) and quso.ai (real product screenshots
 * floating on a soft grid). In ATLAS colours only: indigo accent, navy text, white / #F7F8FB,
 * cool tints. No warm surfaces, no dark sections.
 *
 * Screens are real captures of the ATLAS app (app UI v7, local demo data, nothing invented
 * about customers). Chip text is example product data (a booking, a payment, a message), never
 * a testimonial. Photos: free-licence Unsplash / Pexels, cool-graded.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Check, CheckCheck, Star, ShieldCheck, MessageCircle, MapPin, CalendarDays, Wallet, FileText, Sparkles,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { PRICING_PLANS } from '@/config/pricing';
import { useReveal, prefersReducedMotion, fmt } from '../v5/motion';
import { Mark } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL } from '../v5/content';
import { SignupButton, Faq, Footer } from '../v5/LandingV5';
import { AV, V7Header, PhotoCredits } from './shared7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './landing-v7i.css';

const S = '/landing-v7/screens';
const NAV = [['#product', 'המערכת'], ['#does', 'מה היא עושה'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- small pieces ---------------- */
function Face({ src, size = 40 }) {
  return <img className="l7i-face-img" src={src} alt="" width={size} height={size} decoding="async" style={{ '--s': `${size}px` }} />;
}

/** A notification card that drifts slowly. All positioning lives in CSS (.is-<slot>). */
function Orb({ slot, i, children, className = '' }) {
  return <div className={`l7i-orb is-${slot} ${className}`} style={{ '--i': i }}>{children}</div>;
}

function Note({ lead, title, sub }) {
  return (
    <div className="l7i-note">
      <span className="l7i-note-lead">{lead}</span>
      <span className="l7i-note-txt"><b>{title}</b>{sub && <small>{sub}</small>}</span>
    </div>
  );
}

const withBadge = (src, ch) => (
  <>
    <Face src={src} />
    <span className="l7i-badge"><Mark ch={ch} size={12} /></span>
  </>
);

/* ---------------- hero ---------------- */
function Orbits() {
  const [still, setStill] = useState(true);
  useEffect(() => { setStill(prefersReducedMotion()); }, []);
  const rings = [
    { id: 'l7i-r1', rx: 470, ry: 230, dur: 46 },
    { id: 'l7i-r2', rx: 640, ry: 318, dur: 64 },
  ];
  return (
    <svg className="l7i-rings" viewBox="-720 -360 1440 720" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {rings.map((r) => (
        <g key={r.id}>
          <path id={r.id} d={`M ${-r.rx} 0 A ${r.rx} ${r.ry} 0 1 0 ${r.rx} 0 A ${r.rx} ${r.ry} 0 1 0 ${-r.rx} 0`} className="l7i-ring" />
          {[0, 0.5].map((off, k) => (
            still
              ? <circle key={k} r="3.5" cx={k ? r.rx : -r.rx} cy="0" className={`l7i-ring-dot${k && r.id === 'l7i-r1' ? ' is-amber' : ''}`} />
              : (
                <circle key={k} r="3.5" className={`l7i-ring-dot${k && r.id === 'l7i-r1' ? ' is-amber' : ''}`}>
                  <animateMotion dur={`${r.dur}s`} begin={`${-off * r.dur}s`} repeatCount="indefinite" rotate="0">
                    <mpath href={`#${r.id}`} />
                  </animateMotion>
                </circle>
              )
          ))}
        </g>
      ))}
    </svg>
  );
}

function Hero() {
  return (
    <section className="l7i-hero" aria-labelledby="hero-title">
      <div className="l7i-grid" aria-hidden="true" />
      <Orbits />

      <div className="l5-wrap l7i-top">
        <h1 id="hero-title" className="l7i-h1">
          <span className="l5-h1-line" style={{ '--i': 0 }}>המתחם מנהל את עצמו.</span>
          <span className="l5-h1-line is-ind" style={{ '--i': 1 }}>אתם מארחים.</span>
        </h1>
        <p className="l7i-lead l5-in" style={{ '--i': 2 }}>
          הזמנות מכל הערוצים, וואטסאפ לאורחים ותשלומים.<br className="l7i-br" /> הכל במקום אחד, בעברית.
        </p>
        <div className="l7-cta l7i-cta l5-in" style={{ '--i': 3 }}>
          <SignupButton className="is-lg" />
          <a href="#product" className="l5-btn-ghost is-lg">לראות את המערכת</a>
        </div>
        <p className="l7i-trust l5-in" style={{ '--i': 4 }}>
          <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          {CTA_NOTE} · ביטול בכל עת
        </p>
      </div>

      {/* the people around the headline (decorative; desktop gets six, phones get two) */}
      <div className="l7i-orbs" aria-hidden="true">
        <Orb slot="a" i={0}><Note lead={withBadge(AV.w2, 'booking')} title="מאיה הזמינה 3 לילות" sub="Booking.com · סוויטת האלון" /></Orb>
        <Orb slot="b" i={1} className="is-face"><Face src={AV.m1} size={60} /><span className="l7i-tag is-mint"><i />נכנס ב-15:00</span></Orb>
        <Orb slot="c" i={2}><Note lead={<span className="l7i-ic is-wa"><Mark ch="whatsapp" size={16} /></span>} title={<>הקוד לדלת נשלח <CheckCheck size={15} strokeWidth={2.25} className="l7-ticks" /></>} sub="וואטסאפ לנועה · 18:00" /></Orb>
        <Orb slot="d" i={3}><Note lead={<Face src={AV.m5} />} title={<><span className="num" dir="ltr">₪1,250</span> יתרה התקבלה</>} sub="אבי כ. · בקתת הזית" /></Orb>
        <Orb slot="e" i={4} className="is-face"><Face src={AV.w1} size={60} /><span className="l7i-tag">ביקורת חדשה<Star size={12} strokeWidth={0} fill="currentColor" /><span className="num" dir="ltr">5.0</span></span></Orb>
        <Orb slot="f" i={5}><Note lead={<Face src={AV.m3} />} title="הניקיון בסטודיו הסתיים" sub="דני · מוכן לאורחים הבאים" /></Orb>
      </div>
    </section>
  );
}

/* ---------------- real screens on a soft grid, slight parallax ---------------- */
function useParallax(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 when the stage enters from below, 0 centred, +1 when it leaves at the top
      const p = Math.max(-1, Math.min(1, ((vh / 2) - (r.top + r.height / 2)) / (vh / 2 + r.height / 2)));
      el.style.setProperty('--p', p.toFixed(4));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
  }, [ref]);
}

function Shot({ src, w, h, k, cls, label, eager = false }) {
  return (
    <figure className={`l7i-shot ${cls}`} style={{ '--k': k }}>
      <img src={src} alt={label} width={w} height={h} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </figure>
  );
}

function Screens() {
  const stage = useRef(null);
  useParallax(stage);
  return (
    <section id="product" className="l7i-shots-sec" aria-labelledby="product-title">
      <div className="l5-wrap">
        <div className="l7-head is-center l7i-head" data-reveal>
          <h2 id="product-title" className="l7-h2">זאת המערכת. לא מצגת.</h2>
          <p className="l7-sub">מסכים אמיתיים מתוך ATLAS. הנתונים בהם לדוגמה.</p>
        </div>
      </div>
      <div className="l7-inset">
        <div className="l7i-field">
          <div className="l7i-grid is-field" aria-hidden="true" />
          <div ref={stage} className="l7i-stage" data-reveal>
            <Shot cls="is-cal" src={`${S}/c-cal.webp`} w={1400} h={593} k={0} label="לוח השנה של ATLAS: ארבע יחידות, הזמנות מכל הערוצים על אותו לוח" />
            <Shot cls="is-pay" src={`${S}/c-pay.webp`} w={900} h={163} k={-46} label="כספים: מה התקבל ומה ממתין לגבייה" />
            <Shot cls="is-msg" src={`${S}/c-msg.webp`} w={900} h={467} k={38} label="הודעות: שיחת וואטסאפ עם אורחת" />
            <Shot cls="is-rep" src={`${S}/c-rep.webp`} w={700} h={362} k={-30} label="דוח חודשי: הכנסות לפי ערוץ" />
            <figure className="l7i-shot is-phone" style={{ '--k': 64 }}>
              <span className="l7i-phone">
                <img src={`${S}/m-dashboard.webp`} alt="מסך היום באפליקציה בטלפון" width="600" height="1298" loading="lazy" decoding="async" />
              </span>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- what ATLAS does, 3 rows ---------------- */
const DOES = [
  {
    k: 'cal', tone: 'sky', icon: CalendarDays,
    title: 'כל הערוצים על לוח אחד.',
    line: 'הזמנה מ-Airbnb חוסמת את התאריכים ב-Booking.com ובהזמנות הישירות. לבד.',
    side: (
      <>
        <span className="l7i-chs">
          <span><Mark ch="airbnb" size={16} />Airbnb</span>
          <span><Mark ch="booking" size={16} />Booking.com</span>
          <span><i className="l7i-dot-ind" />ישיר</span>
        </span>
        <Note lead={withBadge(AV.w2, 'airbnb')} title="הזמנה חדשה מ-Airbnb" sub="נחסם גם ב-Booking.com" />
      </>
    ),
  },
  {
    k: 'wa', tone: 'mint', icon: MessageCircle,
    title: 'האורחים מקבלים הכל בוואטסאפ.',
    line: 'אישור, הוראות הגעה וקוד לדלת יוצאים בזמן, גם כשאתם ישנים.',
    side: (
      <>
        <Note lead={<span className="l7i-ic is-wa"><Mark ch="whatsapp" size={16} /></span>} title={<>הוראות הגעה נשלחו <CheckCheck size={15} strokeWidth={2.25} className="l7-ticks" /></>} sub="אוטומטית · יום לפני ההגעה" />
        <Note lead={<Face src={AV.w1} />} title="תודה! נגיע בסביבות 16:00" sub="נועה · בקתת הזית" />
      </>
    ),
  },
  {
    k: 'pay', tone: 'lilac', icon: Wallet,
    title: 'הכסף מגיע בזמן. הדוח מוכן.',
    line: 'מקדמה עם ההזמנה, תזכורת ליתרה, ודוח חודשי לרואה החשבון בלחיצה.',
    side: (
      <>
        <Note lead={<span className="l7i-ic is-mint"><Check size={16} strokeWidth={3} /></span>} title={<><span className="num" dir="ltr">₪750</span> מקדמה התקבלה</>} sub="נועה לוי · 30% מההזמנה" />
        <Note lead={<span className="l7i-ic is-ind"><FileText size={16} strokeWidth={2} /></span>} title="דוח אוקטובר מוכן" sub="PDF ו-Excel לרואה החשבון" />
      </>
    ),
  },
];

function Does() {
  return (
    <section id="does" className="l5-sec l7i-does-sec" aria-labelledby="does-title">
      <div className="l5-wrap">
        <div className="l7-head is-center" data-reveal>
          <h2 id="does-title" className="l7-h2">מה ATLAS עושה בשבילכם</h2>
          <p className="l7-sub">שלושה דברים שחוזרים כל יום. מעכשיו הם קורים לבד.</p>
        </div>
        <ol className="l7i-does">
          {DOES.map((d, i) => {
            const I = d.icon;
            return (
              <li key={d.k} className={`l7i-do is-${d.tone}`} data-reveal style={{ '--d': `${i * 80}ms` }}>
                <div className="l7i-do-txt">
                  <span className="l7i-do-ic" aria-hidden="true"><I size={20} strokeWidth={1.9} /></span>
                  <h3>{d.title}</h3>
                  <p>{d.line}</p>
                </div>
                <div className="l7i-do-side" aria-hidden="true">{d.side}</div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- pricing ---------------- */
const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנתה בישראל, למארחים בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="l5-sec l7i-price-sec" aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <div className="l7-head is-center" data-reveal>
          <h2 id="pricing-title" className="l7-h2">מחיר לפי גודל המתחם.</h2>
          <p className="l7-sub">כל מסלול מתחיל ב-14 ימי ניסיון חינם, עם כל המערכת.</p>
        </div>
        <div className="l7i-toggle" role="group" aria-label="תקופת חיוב" data-reveal>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי<span className="l7i-save">חוסכים 20%</span></button>
        </div>
        <ul className="l7i-plans">
          {PRICING_PLANS.map((p, i) => (
            <li key={p.key} className={`l7i-plan${p.popular ? ' is-pop' : ''}`} data-reveal style={{ '--d': `${i * 70}ms` }}>
              <div className="l7i-plan-top">
                <h3>{p.nameHe}</h3>
                {p.popular && <span className="l7i-plan-tag"><Sparkles size={13} strokeWidth={2} aria-hidden="true" />הכי פופולרי</span>}
              </div>
              <p className="l7i-plan-desc">{p.desc}</p>
              <p className="l7i-plan-price">
                <b className="num" dir="ltr">₪{fmt(yearly ? p.priceYearly : p.price)}</b>
                <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
              </p>
              <SignupButton plan={p.key} className={`is-block${p.popular ? ' is-onind' : ' is-quiet'}`} />
              <ul className="l7i-plan-feat">
                {p.features.map((f) => <li key={f}><Check size={16} strokeWidth={2.4} aria-hidden="true" />{f}</li>)}
              </ul>
              <p className="l7i-plan-line">{p.features.join(' · ')}</p>
            </li>
          ))}
        </ul>
        <ul className="l7i-trust-row" data-reveal>
          {TRUST.map(({ I, t }) => <li key={t}><span aria-hidden="true"><I size={18} strokeWidth={1.8} /></span>{t}</li>)}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- final CTA ---------------- */
function FinalCta() {
  return (
    <section className="l7-final l7i-final-sec" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="l7i-final" data-reveal>
          <div className="l7i-grid is-final" aria-hidden="true" />
          <div className="l7i-final-faces" aria-hidden="true">
            <img className="is-f1" src={AV.w2} alt="" width="52" height="52" loading="lazy" />
            <img className="is-f2" src={AV.m1} alt="" width="44" height="44" loading="lazy" />
            <img className="is-f3" src={AV.w1} alt="" width="48" height="48" loading="lazy" />
            <img className="is-f4" src={AV.m5} alt="" width="40" height="40" loading="lazy" />
          </div>
          <h2 id="final-title" className="l7-h2">מתחילים היום. בחינם.</h2>
          <p>14 ימי ניסיון, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
          <div className="l7-cta l7i-cta">
            <SignupButton className="is-lg" />
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg">
              <Mark ch="whatsapp" size={18} />
              <span>שאלה? וואטסאפ</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingI() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7i" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Screens />
        <Does />
        <Pricing />
        <Faq limit={5} />
        <FinalCta />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".l7i-hero" />
    </div>
  );
}
