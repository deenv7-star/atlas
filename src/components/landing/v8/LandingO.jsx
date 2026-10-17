/**
 * Landing v8 O "קולאז׳ חי" (living collage). The first screen is an asymmetric collage that fills
 * the viewport: real hosts and guests (cool-graded Pexels photos) interlocked with REAL ATLAS app
 * v8 cards (monthly revenue, occupancy ring, today's progress, date strip, a stay card, captured at
 * 2x in demo mode) and app-style notifications, at different sizes and slight rotations, with the
 * headline set boldly in the middle. Tiles drift with the pointer and the scroll (transform only).
 * Then a magazine grid of photo + UI + solid indigo statement tiles, a feature list with icon chips,
 * pricing, FAQ and an indigo CTA. All numbers inside the product are example data, labelled.
 */
import React, { useRef } from 'react';
import {
  Check, CalendarDays, MessageCircle, Wallet, Sparkles, FileText, Link2, Users, Smartphone, ArrowLeft,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal } from '../v5/motion';
import { Mark } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL } from '../v5/content';
import { SignupButton, Faq, Footer } from '../v5/LandingV5';
import { V7Header } from '../v7/shared7';
import {
  ph, UiImg, FaceStack, Toast, BookingToast, WaToast, PaidToast, useParallax, Pricing8, Credits,
} from './shared8';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-o.css';

const NAV = [['#product', 'המוצר'], ['#features', 'מה יש בפנים'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/** A collage tile: outer = parallax (depth --z), inner = entry + float. */
function T({ k, z = 0.5, r = 0, i = 0, children, className = '', float = false }) {
  return (
    <div className={`o-t o-${k} ${className}`} style={{ '--z': z, '--r': `${r}deg`, '--i': i }} aria-hidden="true">
      <div className={`o-t-in${float ? ' is-float' : ''}`}>{children}</div>
    </div>
  );
}

function Pic({ n, pos = '50% 50%', eager = false }) {
  return <img className="o-pic" src={ph(n)} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" style={{ objectPosition: pos }} width="900" height="1000" />;
}

/* ---------------- hero: the living collage ---------------- */
function Hero() {
  const stage = useRef(null);
  useParallax(stage, { scroll: 0.16 });
  return (
    <section className="o-hero" aria-labelledby="hero-title">
      <div className="o-stage" ref={stage}>
        {/* people */}
        <T k="p1" z={0.9} r={-2.5} i={0}><Pic n="familypool" pos="50% 40%" eager /></T>
        <T k="p2" z={0.7} r={2} i={1}><Pic n="balcony" pos="50% 55%" eager /></T>
        <T k="p3" z={1.1} r={2.5} i={4}><Pic n="aframe-pool" pos="50% 60%" eager /></T>
        <T k="p4" z={0.8} r={-2} i={5}><Pic n="host-laptop" pos="40% 40%" eager /></T>
        <T k="p5" z={0.55} r={1.5} i={8}><Pic n="villa-pool" pos="50% 60%" eager /></T>
        <T k="p6" z={1.2} r={-3} i={9}><Pic n="mom-son" pos="50% 45%" /></T>
        {/* real app cards */}
        <T k="u1" z={1.3} r={-3} i={2} float><UiImg n="revenue" lazy={false} /></T>
        <T k="u2" z={0.6} r={3} i={3} float><UiImg n="occ" lazy={false} /></T>
        <T k="u3" z={1} r={-1.5} i={6}><UiImg n="unit" lazy={false} /></T>
        <T k="u4" z={0.75} r={1.5} i={10}><UiImg n="d-strip" lazy={false} /></T>
        <T k="u5" z={1.15} r={-2} i={11} float><UiImg n="d-stay" lazy={false} /></T>
        {/* live notifications (example data) */}
        <T k="c1" z={1.4} r={-1} i={7} float><BookingToast /></T>
        <T k="c2" z={1.25} r={1.5} i={12} float><WaToast /></T>
        <T k="c3" z={1.35} r={-2} i={13} float><PaidToast /></T>
        <T k="c4" z={0.9} r={2} i={14} float>
          <div className="o-arrivals"><FaceStack faces={['noa', 'tom', 'shir', 'ben']} size={30} lazy={false} /><b><span className="num">4</span> הגעות היום</b></div>
        </T>

        <div className="o-copy">
          <p className="o-pill"><span className="o-live" aria-hidden="true" />מערכת ניהול לצימרים ולמתחמי אירוח</p>
          <h1 id="hero-title" className="o-h1">
            <span className="o-h1-l">האורחים מגיעים.</span>
            <span className="o-h1-l is-ind">הכל כבר מוכן.</span>
          </h1>
          <p className="o-lead">הזמנות מכל הערוצים, וואטסאפ לאורחים ותשלומים, בלוח אחד ובעברית.</p>
          <div className="o-cta">
            <SignupButton className="is-lg" />
            <a href="#product" className="v8-ghost">לראות את המוצר</a>
          </div>
          <p className="o-note"><Check size={14} strokeWidth={2.6} aria-hidden="true" />{CTA_NOTE} · הגדרה ב-10 דקות</p>
        </div>
      </div>
      <p className="o-hero-cap">המסכים מתוך ATLAS, עם נתוני דוגמה</p>
    </section>
  );
}

/* ---------------- channels band ---------------- */
function Channels() {
  return (
    <div className="o-ch" data-reveal>
      <span className="o-ch-l">מתחבר למה שכבר עובד אצלכם</span>
      <ul>
        <li><Mark ch="airbnb" size={18} />Airbnb</li>
        <li><Mark ch="booking" size={18} />Booking.com</li>
        <li><Mark ch="gcal" size={18} />Google Calendar</li>
        <li><Mark ch="whatsapp" size={18} />WhatsApp</li>
        <li><Mark ch="direct" size={18} />הזמנה ישירה</li>
      </ul>
    </div>
  );
}

/* ---------------- magazine grid ---------------- */
function Magazine() {
  return (
    <section id="product" className="o-mag" aria-labelledby="mag-title">
      <div className="l7-inset">
        <div className="o-mag-head" data-reveal>
          <h2 id="mag-title" className="v8-h2">יום רגיל במתחם. <span className="is-ind">בלי הבלגן.</span></h2>
          <p className="v8-txt">כל מה שקורה בצימר, מההזמנה ועד הביקורת, מסודר במסך אחד. ככה זה נראה מבפנים.</p>
        </div>
        <div className="o-grid">
          <article className="o-g o-g1" data-reveal>
            <img className="o-g-bg" src={ph('aframe-family')} alt="" loading="lazy" decoding="async" width="1200" height="800" />
            <div className="o-g1-ui"><UiImg n="cal" /></div>
            <div className="o-g-tag"><CalendarDays size={16} strokeWidth={2} aria-hidden="true" />לוח אחד לכל הערוצים</div>
          </article>
          <article className="o-g o-g2 is-ind" data-reveal style={{ '--d': '80ms' }}>
            <p className="o-g-kick">סנכרון דו-כיווני</p>
            <h3 className="o-g-big">הזמנה נכנסה ב-Airbnb? היא כבר בלוח. וחסומה ב-Booking.com.</h3>
            <div className="o-g2-ch"><span><Mark ch="airbnb" size={16} />Airbnb</span><ArrowLeft size={18} aria-hidden="true" /><span className="is-w">ATLAS</span><ArrowLeft size={18} aria-hidden="true" /><span><Mark ch="booking" size={16} />Booking.com</span></div>
          </article>
          <article className="o-g o-g3 is-mint" data-reveal>
            <div className="o-g-ic"><Wallet size={20} strokeWidth={1.9} aria-hidden="true" /></div>
            <h3 className="o-g-h">כסף בזמן</h3>
            <p className="o-g-p">מקדמה נגבית עם ההזמנה, והיתרה מקבלת תזכורת לבד.</p>
            <div className="o-g3-ui"><UiImg n="paylist" /></div>
            <PaidToast amount="₪2,950" sub="יתרה · ליאור ושני" className="o-g3-toast" />
          </article>
          <article className="o-g o-g4" data-reveal style={{ '--d': '80ms' }}>
            <img className="o-g-bg" src={ph('kids-jump')} alt="" loading="lazy" decoding="async" width="1200" height="801" />
            <Toast tone="ind" icon={<Sparkles size={17} strokeWidth={2} />} title="מחר: 3 כניסות, 2 ניקיונות" sub="נשלח לצוות הניקיון · 20:00" className="o-g4-toast" />
          </article>
          <article className="o-g o-g5 is-lilac" data-reveal style={{ '--d': '160ms' }}>
            <div className="o-g-ic"><MessageCircle size={20} strokeWidth={1.9} aria-hidden="true" /></div>
            <h3 className="o-g-h">הודעות שיוצאות לבד</h3>
            <p className="o-g-p">אישור, הוראות הגעה, תזכורת ובקשה לביקורת. בזמן, עם השם של האורח.</p>
            <div className="o-g5-ui"><UiImg n="chat" /></div>
          </article>
          <article className="o-g o-g6" data-reveal>
            <img className="o-g-bg" src={ph('glass-cabin')} alt="" loading="lazy" decoding="async" width="1200" height="800" />
            <div className="o-g6-stat"><b className="num">10</b><span>דקות מההרשמה ועד לוח מסונכרן</span></div>
          </article>
          <article className="o-g o-g7 is-white" data-reveal style={{ '--d': '80ms' }}>
            <div className="o-g7-copy">
              <div className="o-g-ic is-ind"><FileText size={20} strokeWidth={1.9} aria-hidden="true" /></div>
              <h3 className="o-g-h">דוח הכנסות בלחיצה</h3>
              <p className="o-g-p">כל תשלום נרשם. בסוף החודש מורידים Excel או PDF לרואה החשבון.</p>
            </div>
            <div className="o-g7-ui"><UiImg n="chart" /></div>
          </article>
          <article className="o-g o-g8 is-sky" data-reveal style={{ '--d': '160ms' }}>
            <p className="o-g8-t"><b>מה קורה היום</b> כניסות, יציאות וניקיונות, ברגע שפותחים את האפליקציה.</p>
            <div className="o-g8-row">
              <img className="o-g8-ph" src={ph('host-sofa')} alt="" loading="lazy" decoding="async" width="1000" height="633" />
              <div className="o-g8-ui"><UiImg n="today" /></div>
            </div>
          </article>
        </div>
        <div className="o-band" data-reveal>
          <p className="o-band-t">
            פחות טלפונים
            <img src={ph('deck-couple')} alt="" loading="lazy" decoding="async" width="900" height="1000" />
            יותר זמן
            <img src={ph('friends-pool')} alt="" loading="lazy" decoding="async" width="1100" height="733" />
            לאורחים.
          </p>
        </div>
        <p className="v8-cap">המסכים מתוך ATLAS, עם נתוני דוגמה.</p>
      </div>
    </section>
  );
}

/* ---------------- features ---------------- */
const FEAT = [
  { I: CalendarDays, t: 'לוח שנה מסונכרן', p: 'Airbnb, Booking.com וישיר על לוח אחד, בלי כפילויות.', tone: 'ind' },
  { I: MessageCircle, t: 'וואטסאפ אוטומטי', p: 'תבניות בעברית שיוצאות לבד, בזמן שבחרתם.', tone: 'mint' },
  { I: Wallet, t: 'מקדמות ויתרות', p: 'גבייה עם ההזמנה, תזכורת ליתרה ומעקב בכל רגע.', tone: 'sky' },
  { I: Link2, t: 'עמוד הזמנה ישירה', p: 'קישור משלכם להזמנות, בלי עמלה לאף אחד.', tone: 'lilac' },
  { I: Sparkles, t: 'ניקיון ותפעול', p: 'משימות יומיות לצוות, לפי הכניסות והיציאות.', tone: 'ind' },
  { I: Users, t: 'לידים ופניות', p: 'כל פנייה נשמרת עם תאריכים, מחיר וסטטוס.', tone: 'sky' },
  { I: FileText, t: 'דוחות לרואה החשבון', p: 'הכנסות, הוצאות ותפוסה. Excel או PDF.', tone: 'mint' },
  { I: Smartphone, t: 'מהטלפון, בעברית', p: 'אפליקציה שנבנתה לנייד, עם תמיכה אנושית.', tone: 'lilac' },
];

function Features() {
  return (
    <section id="features" className="o-feat" aria-labelledby="feat-title">
      <div className="l5-wrap">
        <div className="o-feat-box">
          <div className="o-feat-side" data-reveal>
            <h2 id="feat-title" className="v8-h2">מה יש <span className="is-ind">בפנים.</span></h2>
            <p className="v8-txt">כל הכלים של המתחם, בלי לקפוץ בין חמש אפליקציות.</p>
            <div className="o-feat-ph">
              <img src={ph('cabin-pool')} alt="" loading="lazy" decoding="async" width="900" height="1000" />
              <WaToast className="o-feat-toast" />
            </div>
          </div>
          <ul className="o-feat-list">
            {FEAT.map(({ I, t, p, tone }, i) => (
              <li key={t} data-reveal style={{ '--d': `${(i % 2) * 70}ms` }}>
                <span className={`o-chip is-${tone}`}><I size={22} strokeWidth={1.9} aria-hidden="true" /></span>
                <div><h3>{t}</h3><p>{p}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- final CTA ---------------- */
function Final() {
  return (
    <section className="o-final" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="o-final-box" data-reveal>
          <div className="o-final-pics" aria-hidden="true">
            <img className="is-1" src={ph('aframe-blue')} alt="" loading="lazy" decoding="async" width="900" height="1100" />
            <img className="is-2" src={ph('familypool')} alt="" loading="lazy" decoding="async" width="1200" height="865" />
            <img className="is-3" src={ph('balcony')} alt="" loading="lazy" decoding="async" width="900" height="1000" />
            <div className="is-4"><UiImg n="d-stay2" /></div>
          </div>
          <div className="o-final-copy">
            <h2 id="final-title" className="o-final-h">העונה הבאה מתחילה מסודרת.</h2>
            <p className="o-final-sub">14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.</p>
            <div className="o-cta">
              <SignupButton className="is-lg v8-btn-white" />
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="o-final-link"><Mark ch="whatsapp" size={18} />שאלה? כתבו לנו</a>
            </div>
          </div>
          <div className="o-final-faces" aria-hidden="true"><FaceStack faces={['maya', 'yossi', 'adam', 'eli', 'noa']} size={44} /></div>
        </div>
      </div>
    </section>
  );
}

export default function LandingO() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 v8 lo" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Channels />
        <Magazine />
        <Features />
        <Pricing8 />
        <Faq limit={5} />
        <Final />
      </main>
      <Credits />
      <Footer />
      <CookieConsent revealAfter=".o-hero" />
    </div>
  );
}
