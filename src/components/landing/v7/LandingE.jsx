/**
 * Landing v7 E "המוצר המחובר": Deen's references (CRM laptop under a centred headline, quso.ai
 * floating cards on a soft grid, AI-conversion stat chips) in ATLAS colours.
 * A centred headline, then the live calendar in a browser window on a soft indigo-sky field,
 * with the channels around it (Airbnb, Booking.com, WhatsApp, Google Calendar, payments)
 * wired in by thin dotted lines: data flows INTO ATLAS. Then three feature rows, steps,
 * pricing, FAQ and a light CTA. Card text is example product data, never a testimonial.
 */
import React, { useRef } from 'react';
import { Check, CreditCard, Lock } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, useTimeline } from '../v5/motion';
import {
  Mark, Wordmark, AppWindow, Calendar, WhatsAppCard, Payments, SyncMini,
} from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL, PHONE_DISPLAY } from '../v5/content';
import { SignupButton, Steps, Pricing, Faq, Footer } from '../v5/LandingV5';
import {
  AV, V7Header, Chip, BookingChip, PaidChip, WaChip, PhotoCredits,
} from './shared7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './landing-v7e.css';

const NAV = [['#product', 'המוצר'], ['#features', 'מה בפנים'], ['#how', 'איך מתחילים'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* Stage geometry (design box 1160 x 620, same numbers in the SVG viewBox and the % positions). */
const W = 1160;
const H = 540;
const WIN = { x0: 250, x1: 910 };
const NODES = [
  { k: 'airbnb', label: 'Airbnb', x: 92, y: 96, to: [WIN.x0, 150] },
  { k: 'booking', label: 'Booking.com', x: 56, y: 270, to: [WIN.x0, 270] },
  { k: 'pay', label: 'תשלומים', x: 104, y: 440, to: [WIN.x0, 400] },
  { k: 'whatsapp', label: 'WhatsApp', x: 1068, y: 120, to: [WIN.x1, 180] },
  { k: 'gcal', label: 'Google Calendar', x: 1100, y: 350, to: [WIN.x1, 340] },
];
const pct = (v, of) => `${(v / of) * 100}%`;
const wire = ({ x, y, to: [tx, ty] }) => {
  const mx = (x + tx) / 2;
  return `M${x} ${y} C${mx} ${y} ${mx} ${ty} ${tx} ${ty}`;
};

function NodeIcon({ k, size = 26 }) {
  if (k === 'pay') return <CreditCard size={size} strokeWidth={1.75} className="l7e-ic-pay" />;
  return <Mark ch={k} size={size} />;
}

/* ---------------- hero ---------------- */
function Hero() {
  const step = useTimeline([1100, 2400]);
  return (
    <section className="l7e-hero" aria-labelledby="hero-title">
      <div className="l7e-top">
        <p className="l7-pill l5-in" style={{ '--i': 0 }}><span className="l7-dot" aria-hidden="true" />לוח שנה, הודעות ותשלומים. מחוברים.</p>
        <h1 id="hero-title" className="l7e-h1">
          <span className="l5-h1-line" style={{ '--i': 1 }}>כל הערוצים נכנסים</span>
          <span className="l5-h1-line is-ind" style={{ '--i': 2 }}>למקום אחד.</span>
        </h1>
        <p className="l7e-lead l5-in" style={{ '--i': 3 }}>
          הזמנות מ-Airbnb ומ-Booking.com, הודעות לאורחים בוואטסאפ ותשלומי מקדמה מתעדכנים לבד על לוח אחד. בלי לקפוץ בין חמש אפליקציות.
        </p>
        <div className="l7-cta l5-in" style={{ '--i': 4 }}>
          <SignupButton className="is-lg" />
          <a href="#features" className="l5-btn-ghost is-lg">לראות מה בפנים</a>
        </div>
        <div className="l7e-trust l5-in" style={{ '--i': 5 }}>
          <span className="l7e-avs" aria-hidden="true">
            <img src={AV.w1} alt="" width="32" height="32" />
            <img src={AV.m5} alt="" width="32" height="32" />
            <img src={AV.w2} alt="" width="32" height="32" />
          </span>
          <span><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</span>
        </div>
      </div>

      <div className="l7-inset">
        <div id="product" className="l7e-field">
          <div className="l7e-grid" aria-hidden="true" />
          {/* desktop: wired stage */}
          <div className="l7e-stage" aria-hidden="true">
            <svg className="l7e-wires" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {NODES.map((n, i) => (
                <g key={n.k}>
                  <path id={`l7e-w${i}`} d={wire(n)} className="l7e-wire" />
                  <circle r="4" className="l7e-pulse">
                    <animateMotion dur={`${3.2 + i * 0.35}s`} begin={`${1 + i * 0.5}s`} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                      <mpath href={`#l7e-w${i}`} />
                    </animateMotion>
                  </circle>
                  <circle cx={n.to[0]} cy={n.to[1]} r="5" className="l7e-port" />
                </g>
              ))}
            </svg>
            <div className="l7e-win l5-in" style={{ left: pct(WIN.x0, W), width: pct(WIN.x1 - WIN.x0, W), '--i': 3 }}>
              <div className="l7e-bar">
                <i /><i /><i />
                <span className="l7e-url"><Lock size={11} strokeWidth={2.25} /><span dir="ltr">app.atlas-il.com/calendar</span></span>
              </div>
              <AppWindow><Calendar compact showIncoming={step >= 1} /></AppWindow>
            </div>
            {NODES.map((n, i) => (
              <div key={n.k} className={`l7e-node is-${n.k} l7-float`} style={{ left: pct(n.x, W), top: pct(n.y, H), '--i': i }}>
                <span className="l7e-node-ic"><NodeIcon k={n.k} /></span>
                <small>{n.label}</small>
              </div>
            ))}
            <BookingChip className="l7e-c1 l7-float" style={{ '--i': 2 }} />
            <WaChip className="l7e-c2 l7-float" style={{ '--i': 3 }} />
            <PaidChip className="l7e-c3 l7-float" style={{ '--i': 4 }} />
            <div className="l7e-face l7-float" style={{ '--i': 5 }}>
              <img src={AV.m3} alt="" width="40" height="40" />
              <span><b>דני מהניקיון</b><small>יודע שיש יציאה ב-11:00</small></span>
            </div>
          </div>
          {/* mobile: icons on top, wired straight down into the window */}
          <div className="l7e-stage-m" aria-hidden="true">
            <ul className="l7e-row">
              {NODES.map((n) => <li key={n.k} className={`is-${n.k}`}><NodeIcon k={n.k} size={20} /></li>)}
            </ul>
            <svg className="l7e-drops" viewBox="0 0 320 44" preserveAspectRatio="none">
              {[32, 96, 160, 224, 288].map((x) => <path key={x} d={`M${x} 0 C${x} 22 160 22 160 44`} className="l7e-wire" />)}
            </svg>
            <div className="l7e-win-m">
              <div className="l7e-bar"><i /><i /><i /><span className="l7e-url"><Lock size={11} strokeWidth={2.25} /><span dir="ltr">app.atlas-il.com</span></span></div>
              <div className="l7e-win-m-in"><AppWindow><Calendar compact showIncoming={step >= 1} /></AppWindow></div>
            </div>
            <BookingChip className="l7e-m1 l7-float" style={{ '--i': 2 }} />
            <PaidChip className="l7e-m2 l7-float" style={{ '--i': 3 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- feature rows ---------------- */
const ROWS = [
  {
    k: 'sync', tone: 'sky', kicker: 'לוח שנה',
    title: 'הזמנה נכנסת בערוץ אחד. נחסמת בכל השאר.',
    line: 'Airbnb, Booking.com וההזמנות הישירות שלכם על לוח אחד. בלי לעדכן יומנים ביד, ובלי הזמנות כפולות.',
    pts: ['סנכרון iCal עם כל ערוץ', 'כל היחידות בתצוגה אחת', 'מדביקים קישור פעם אחת'],
    ui: <div className="l5-card l7e-ui-card"><SyncMini /></div>,
    chip: <Chip av={AV.w2} ch="airbnb" title="הזמנה חדשה מ-Airbnb" sub="נחסם גם ב-Booking.com" />,
  },
  {
    k: 'wa', tone: 'mint', kicker: 'הודעות',
    title: 'האורחים מקבלים הכל בוואטסאפ. בזמן, ובשמכם.',
    line: 'אישור הזמנה, הוראות הגעה, קוד לדלת ובקשה לביקורת. אתם בוחרים מתי, ATLAS ממלאת את הפרטים ושולחת.',
    pts: ['תבניות בעברית', 'נשלח גם בשבת בלילה', 'רואים כל הודעה שיצאה'],
    ui: <WhatsAppCard stage={3} />,
    chip: <Chip av={AV.w1} title="נועה קראה את ההודעה" sub="הוראות הגעה · 18:02" />,
  },
  {
    k: 'pay', tone: 'lilac', kicker: 'תשלומים',
    title: 'מקדמה עם ההזמנה. תזכורת ליתרה, לבד.',
    line: 'רואים מה שולם ומה ממתין, ושולחים לרואה החשבון דוח חודשי מסודר בלחיצה.',
    pts: ['קישור תשלום לכל הזמנה', 'תזכורות אוטומטיות', 'דוח ב-Excel או PDF'],
    ui: <Payments className="l5-card l7e-ui-card" />,
    chip: <Chip av={AV.m5} icon={null} title={<><span className="num" dir="ltr">₪1,250</span> יתרה התקבלה</>} sub="אבי כ. · סוויטת האלון" />,
  },
];

function Features() {
  return (
    <section id="features" className="l5-sec l7e-feat-sec" aria-labelledby="feat-title">
      <div className="l5-wrap">
        <div className="l7-head is-center" data-reveal>
          <p className="l6-kicker">מה בפנים</p>
          <h2 id="feat-title" className="l7-h2">שלושה דברים שחוזרים כל יום. ATLAS עושה אותם בשבילכם.</h2>
        </div>
        <ol className="l7e-rows">
          {ROWS.map((r, i) => (
            <li key={r.k} className={`l7e-rowi${i % 2 ? ' is-flip' : ''}`}>
              <div className="l7e-row-txt" data-reveal>
                <p className="l6-kicker">{r.kicker}</p>
                <h3>{r.title}</h3>
                <p className="l7e-row-line">{r.line}</p>
                <ul className="l7e-pts">
                  {r.pts.map((p) => <li key={p}><Check size={16} strokeWidth={2.5} aria-hidden="true" />{p}</li>)}
                </ul>
              </div>
              <div className={`l7e-row-ui is-${r.tone}`} data-reveal style={{ '--d': '90ms' }} aria-hidden="true">
                <div className="l7e-row-dots" />
                <div className="l7e-row-frame">{r.ui}</div>
                <div className="l7e-row-chip">{r.chip}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- final ---------------- */
function FinalCta() {
  return (
    <section className="l7-final" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="l7e-final" data-reveal>
          <div className="l7e-final-hub" aria-hidden="true">
            {['airbnb', 'booking'].map((k) => <span key={k} className="l7e-final-n"><NodeIcon k={k} size={20} /></span>)}
            <span className="l7e-final-line" />
            <span className="l7e-final-core"><Wordmark small /></span>
            <span className="l7e-final-line" />
            {['whatsapp', 'pay'].map((k) => <span key={k} className="l7e-final-n"><NodeIcon k={k} size={20} /></span>)}
          </div>
          <h2 id="final-title" className="l7-h2">מחברים פעם אחת. וזה עובד כל יום.</h2>
          <p>14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
          <div className="l7-cta">
            <SignupButton className="is-lg" />
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg">וואטסאפ{'\u00a0'}<span dir="ltr" className="num">{PHONE_DISPLAY}</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingE() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7e" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Features />
        <Steps />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".l7e-hero" />
    </div>
  );
}
