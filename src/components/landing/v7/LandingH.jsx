/**
 * Landing v7 H "בכף היד": Deen's ADA health (hand holding a phone) and AI-conversion (phone with
 * floating stat chips) references, in ATLAS colours.
 * A split hero: copy on the start side, a real photo of a hand holding a phone whose screen is the
 * live ATLAS Today screen (perspective-mapped onto the photographed screen with matrix3d), with
 * floating stat and notification chips. Then before / after as two clean cards, three tinted
 * feature cards with small live product UI, pricing with a monthly / annual toggle, FAQ, CTA.
 * Photo: Unsplash, free licence, cool-graded. Every number in the UI and chips is example data.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Check, X, ShieldCheck, MessageCircle, CircleOff, Sparkles,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, useInView, useTimeline, prefersReducedMotion, fmt } from '../v5/motion';
import { Mark, WhatsAppCard } from '../v5/ui';
import { BEFORE_AFTER, CTA_NOTE, WHATSAPP_URL, PHONE_DISPLAY } from '../v5/content';
import { SignupButton, Channels, Pricing, Faq, Footer } from '../v5/LandingV5';
import { IMG, V7Header, Chip, PaidChip, PhotoCredits } from './shared7';
import { Device, ScrToday, ScrWhatsApp } from './screens7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './screens7.css';
import './landing-v7h.css';

const NAV = [['#before', 'לפני ואחרי'], ['#features', 'המוצר'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- perspective-mapped screen ---------------- */
// Screen corners in the photo (fractions of h-hand.webp, 1200×1500): TL, TR, BR, BL.
const QUAD = [[0.2632, 0.1915], [0.6068, 0.1864], [0.6023, 0.8277], [0.2081, 0.7927]];
const SW = 300;
const SH = 694;

function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c += 1) {
    let p = c;
    for (let r = c + 1; r < n; r += 1) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r += 1) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k += 1) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** CSS matrix3d that maps the SW×SH rect onto four destination points (px). */
function quadMatrix(dst) {
  const src = [[0, 0], [SW, 0], [SW, SH], [0, SH]];
  const A = [];
  const b = [];
  src.forEach(([x, y], i) => {
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]); b.push(v);
  });
  const [a, bb, c, d, e, f, g, h] = solve(A, b);
  return `matrix3d(${[a, d, 0, g, bb, e, 0, h, 0, 0, 1, 0, c, f, 0, 1].map((n) => +n.toFixed(8)).join(',')})`;
}

function HandPhoto() {
  const box = useRef(null);
  const [m, setM] = useState(null);
  const [notify, setNotify] = useState(false);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const fit = () => {
      const W = el.offsetWidth;
      const H = el.offsetHeight;
      if (W && H) setM(quadMatrix(QUAD.map(([x, y]) => [x * W, y * H])));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setNotify(true), prefersReducedMotion() ? 0 : 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={box} className="l7h-photo">
      <picture>
        <source media="(min-width: 700px)" srcSet={`${IMG}/h-hand.webp`} width="1200" height="1500" />
        <img src={`${IMG}/h-hand-800.webp`} alt="יד מחזיקה טלפון עם מסך ״היום״ של ATLAS" width="800" height="1000" fetchPriority="high" decoding="async" />
      </picture>
      <div className={`l7h-scr${m ? ' is-on' : ''}${notify ? ' is-notify' : ''}`} style={m ? { transform: m } : undefined} aria-hidden="true">
        <ScrToday notify />
        <i className="l7h-glare" />
      </div>
    </div>
  );
}

/* ---------------- hero ---------------- */
function Ring({ pct = 82 }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg className="l7h-ring" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--indigo-100)" strokeWidth="5" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--indigo)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} transform="rotate(-90 20 20)" />
    </svg>
  );
}

function StatChip({ lead, value, label, className = '', style }) {
  return (
    <div className={`l7h-stat ${className}`} style={style}>
      {lead}
      <span><b className="num" dir="ltr">{value}</b><small>{label}</small></span>
    </div>
  );
}

const TRUST_H = [
  [ShieldCheck, 'מידע מוצפן ומגובה'],
  [MessageCircle, 'תמיכה בעברית, בוואטסאפ'],
  [CircleOff, 'ביטול בכל עת'],
];

function Hero() {
  return (
    <section className="l7h-hero" aria-labelledby="hero-title">
      <div className="l5-wrap l7h-grid">
        <div className="l7h-copy">
          <p className="l7-pill l5-in" style={{ '--i': 0 }}><span className="l7-dot" aria-hidden="true" />לצימרים ולמתחמי נופש בישראל</p>
          <h1 id="hero-title" className="l7h-h1">
            <span className="l5-h1-line" style={{ '--i': 1 }}>המתחם שלכם,</span>
            <span className="l5-h1-line is-ind" style={{ '--i': 2 }}>בכף היד.</span>
          </h1>
          <p className="l7h-lead l5-in" style={{ '--i': 3 }}>
            הזמנות מכל הערוצים, הודעות לאורחים ותשלומים באפליקציה אחת בעברית. בלי אקסלים, ובלי לרדוף אחרי אף אחד.
          </p>
          <div className="l7h-cta l5-in" style={{ '--i': 4 }}>
            <SignupButton className="is-lg" />
            <a href="#pricing" className="l5-btn-ghost is-lg">לראות מחירים</a>
          </div>
          <p className="l7-note l5-in" style={{ '--i': 5 }}><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
          <ul className="l7h-trust l5-in" style={{ '--i': 6 }}>
            {TRUST_H.map(([I, t]) => <li key={t}><I size={16} strokeWidth={1.75} aria-hidden="true" />{t}</li>)}
          </ul>
        </div>

        <div className="l7h-media l5-in" style={{ '--i': 2 }}>
          <div className="l7h-field">
            <HandPhoto />
          </div>
          <div className="l7h-chips" aria-hidden="true">
            <StatChip className="l7h-s1 l7-float" style={{ '--i': 2 }} lead={<Ring />} value="82%" label="תפוסה החודש" />
            <PaidChip className="l7h-s2 l7-float" style={{ '--i': 3 }} sub="מקדמה · מאיה כהן" />
            <StatChip
              className="l7h-s3 l7-float"
              style={{ '--i': 4 }}
              lead={<span className="l7-ic is-wa"><Mark ch="whatsapp" size={18} /></span>}
              value="37"
              label="הודעות יצאו לבד השבוע"
            />
          </div>
          <p className="l7h-media-note">המסך והנתונים הם דוגמה מתוך האפליקציה</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- before / after ---------------- */
const BEFORE_META = ['בכל הזמנה', 'בכל יום', 'בכל חודש', 'בסוף כל חודש'];

function BeforeAfter() {
  return (
    <section id="before" className="l5-sec l7h-ba-sec" aria-labelledby="ba-title">
      <div className="l5-wrap">
        <div className="l7-head is-center" data-reveal>
          <p className="l6-kicker">לפני ואחרי</p>
          <h2 id="ba-title" className="l7-h2">אותו מתחם. ערב אחר לגמרי.</h2>
        </div>
        <div className="l7h-ba">
          <article className="l7h-ba-card is-before" data-reveal>
            <span className="l7h-ba-tag">בלי ATLAS</span>
            <h3>הטלפון לא מפסיק לצלצל.</h3>
            <ul>
              {BEFORE_AFTER.before.map((t, i) => (
                <li key={t}><span className="l7h-ba-ic" aria-hidden="true"><X size={14} strokeWidth={2.4} /></span><span>{t}<small>{BEFORE_META[i]}</small></span></li>
              ))}
            </ul>
          </article>
          <article className="l7h-ba-card is-after" data-reveal style={{ '--d': '90ms' }}>
            <span className="l7h-ba-tag">עם ATLAS</span>
            <h3>המערכת עושה את העבודה.</h3>
            <ul>
              {BEFORE_AFTER.after.map((t) => (
                <li key={t}><span className="l7h-ba-ic" aria-hidden="true"><Check size={14} strokeWidth={2.6} /></span><span>{t}</span></li>
              ))}
            </ul>
            <div className="l7h-ba-done" aria-hidden="true">
              <span className="l7-ic is-mint"><Check size={16} strokeWidth={3} /></span>
              <span><b>הכל מוכן להיום</b><small>2 כניסות · 1 יציאה · ניקיון שובץ</small></span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ---------------- features with live mini UI ---------------- */
const TL = [700, 1700, 2700];

function useLoop(ref) {
  const inView = useInView(ref, { margin: '0px 0px -15% 0px' });
  return useTimeline(TL, { loop: 7200, active: inView });
}

function MiniSync() {
  const ref = useRef(null);
  const step = useLoop(ref);
  const rows = [
    ['סוויטת האלון', [[0, 2, 'airbnb'], [3, 3, 'direct']]],
    ['בקתת הזית', [[1, 2, 'direct']]],
    ['וילה התאנה', [[0, 1, 'booking'], [5, 2, 'airbnb']]],
  ];
  return (
    <div ref={ref} className="l7h-mini l7h-sync" aria-hidden="true">
      <div className="l7h-sync-days">{['ש׳', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'].map((d) => <small key={d}>{d}</small>)}</div>
      {rows.map(([u, bars], ri) => (
        <div key={u} className="l7h-sync-row">
          <small>{u}</small>
          <div className="l7h-sync-lane">
            {bars.map(([s, n, ch]) => <i key={s} className={`is-${ch}`} style={{ '--s': s, '--n': n }} />)}
            {ri === 1 && <i className={`is-booking is-new${step >= 1 ? ' is-in' : ''}`} style={{ '--s': 4, '--n': 3 }}><Mark ch="booking" size={11} /><b>מאיה כ.</b></i>}
          </div>
        </div>
      ))}
      <div className="l7h-sync-chips">
        <span className={step >= 2 ? 'is-in' : ''}><Check size={12} strokeWidth={2.6} />נחסם ב-Airbnb</span>
        <span className={step >= 3 ? 'is-in' : ''}><Check size={12} strokeWidth={2.6} />נחסם בעמוד ההזמנה</span>
      </div>
    </div>
  );
}

function MiniWa() {
  const ref = useRef(null);
  const step = useLoop(ref);
  return (
    <div ref={ref} className="l7h-mini l7h-wa" aria-hidden="true">
      <WhatsAppCard stage={Math.max(1, step)} />
    </div>
  );
}

function MiniPay() {
  const ref = useRef(null);
  const step = useLoop(ref);
  const paid = step >= 2;
  const total = paid ? 3290 : 2390;
  return (
    <div ref={ref} className="l7h-mini l7h-pay" aria-hidden="true">
      <div className="l7h-pay-top">
        <small>שולם השבוע</small>
        <b className="num" dir="ltr">₪{fmt(total)}</b>
        <span className="l7h-pay-bar"><i style={{ width: paid ? '100%' : '72%' }} /></span>
      </div>
      <ul>
        <li><span><b>נועה לוי</b><small>מקדמה 30%</small></span><em className="num" dir="ltr">₪750</em><span className="l7h-pill is-ok">שולם</span></li>
        <li><span><b>Jonas M.</b><small>Booking.com</small></span><em className="num" dir="ltr">₪1,640</em><span className="l7h-pill is-ok">שולם</span></li>
        <li className={paid ? 'is-flip' : ''}><span><b>אבי כהן</b><small>יתרה</small></span><em className="num" dir="ltr">₪900</em><span className={`l7h-pill${paid ? ' is-ok' : ''}`}>{paid ? 'שולם' : step >= 1 ? 'תזכורת נשלחה' : 'ממתין'}</span></li>
      </ul>
    </div>
  );
}

const FEATURES = [
  { tone: 'sky', title: 'לוח אחד, בלי כפילויות', line: 'הזמנה שנכנסה בערוץ אחד נחסמת מיד בכל השאר.', ui: <MiniSync /> },
  { tone: 'lilac', title: 'וואטסאפ שיוצא לבד', line: 'אישור, הוראות הגעה וקוד לדלת, בשמכם ובזמן.', ui: <MiniWa /> },
  { tone: 'mint', title: 'הכסף נכנס בזמן', line: 'מקדמה עם ההזמנה ותזכורת ליתרה, בלי לבקש.', ui: <MiniPay /> },
];

function Features() {
  return (
    <section id="features" className="l5-sec l7h-feat-sec" aria-labelledby="feat-title">
      <div className="l5-wrap">
        <div className="l7-head" data-reveal>
          <p className="l6-kicker">המוצר</p>
          <h2 id="feat-title" className="l7-h2">שלושה דברים שעובדים בשבילכם, כל יום.</h2>
        </div>
        <ul className="l7h-feat">
          {FEATURES.map((f, i) => (
            <li key={f.title} className={`l7h-fc is-${f.tone}`} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <div className="l7h-fc-txt">
                <h3>{f.title}</h3>
                <p>{f.line}</p>
              </div>
              <div className="l7h-fc-ui">{f.ui}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- final ---------------- */
function FinalCta() {
  return (
    <section className="l7-final" aria-labelledby="final-title">
      <div className="l5-wrap">
        <div className="l7h-final" data-reveal>
          <div className="l7h-final-copy">
            <p className="l6-kicker"><Sparkles size={14} strokeWidth={2} aria-hidden="true" />14 ימים חינם</p>
            <h2 id="final-title" className="l7-h2">נסו את ATLAS על המתחם שלכם.</h2>
            <p>בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות, ואם נתקעים, בן אדם עונה בוואטסאפ.</p>
            <div className="l7h-cta">
              <SignupButton className="is-lg" />
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg">וואטסאפ{'\u00a0'}<span dir="ltr" className="num">{PHONE_DISPLAY}</span></a>
            </div>
          </div>
          <div className="l7h-final-ph">
            <Device className="l7h-final-dev"><ScrWhatsApp /></Device>
            <Chip
              className="l7h-final-chip"
              icon={<span className="l7-ic is-mint"><Check size={16} strokeWidth={3} /></span>}
              title="הוראות הגעה נשלחו"
              sub="לנועה, יום לפני ההגעה"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingH() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7h" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Channels />
        <BeforeAfter />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".l7h-hero" />
    </div>
  );
}
