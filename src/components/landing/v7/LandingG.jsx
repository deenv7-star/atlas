/**
 * Landing v7 G "שלושה טלפונים": Deen's travelwise reference in ATLAS colours.
 * A giant centred headline with small rounded photos and icons set between the words, then three
 * fanned phones showing real ATLAS app screens (Today, calendar, a WhatsApp chat ATLAS sent by
 * itself) with photo cards of hosts and guests on a soft disc. Then "כמה זה שווה לכם": a units
 * slider that turns into hours and shekels saved (a clearly labelled estimate with its
 * assumptions), three things ATLAS does, pricing, FAQ and a light CTA.
 * Photos: Unsplash / Pexels, free licence, cool-graded. App data and chips are example data.
 */
import React, { useId, useRef, useState } from 'react';
import {
  Check, CalendarDays, Wallet, ShieldCheck, MessageCircle, MapPin, Info,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { PRICING_PLANS } from '@/config/pricing';
import { useReveal, fmt } from '../v5/motion';
import { Mark } from '../v5/ui';
import { CTA_NOTE, WHATSAPP_URL, PHONE_DISPLAY } from '../v5/content';
import { SignupButton, Channels, Pricing, Faq, Footer } from '../v5/LandingV5';
import {
  IMG, AV, V7Header, BookingChip, PaidChip, WaChip, PhotoCredits,
} from './shared7';
import {
  Device, ScrToday, ScrCalendar, ScrWhatsApp,
} from './screens7';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './screens7.css';
import './landing-v7g.css';

const NAV = [['#product', 'המוצר'], ['#roi', 'כמה זה שווה'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- hero ---------------- */
function Inline({ kind }) {
  if (kind === 'photo') {
    return (
      <span className="l7g-inl is-photo" aria-hidden="true">
        <img src={`${IMG}/cabins.webp`} alt="" width="1000" height="667" fetchPriority="high" decoding="async" />
      </span>
    );
  }
  if (kind === 'wa') {
    return <span className="l7g-inl is-ic" aria-hidden="true"><Mark ch="whatsapp" size={30} /></span>;
  }
  return (
    <span className="l7g-inl is-faces" aria-hidden="true">
      {[AV.w2, AV.m1, AV.w1].map((s) => <img key={s} src={s} alt="" width="80" height="80" decoding="async" />)}
    </span>
  );
}

// Photo cards only show from 1100px; below that the <source> does not match and a 1px
// placeholder loads instead, so phones never download them.
const PX = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
function WidePhoto({ className, src, w, h }) {
  return (
    <figure className={`l7g-photo ${className}`} aria-hidden="true">
      <picture>
        <source media="(min-width: 1100px)" srcSet={src} width={w} height={h} />
        <img src={PX} alt="" width={w} height={h} decoding="async" />
      </picture>
    </figure>
  );
}

function Hero() {
  return (
    <section className="l7g-hero" aria-labelledby="hero-title">
      <div className="l5-wrap l7g-top">
        <h1 id="hero-title" className="l7g-h1">
          <span className="l5-h1-line" style={{ '--i': 0 }}>כל ההזמנות <Inline kind="photo" /></span>
          <span className="l5-h1-line" style={{ '--i': 1 }}><Inline kind="wa" /> <span className="is-ind">במקום</span> <Inline kind="faces" /> <span className="is-ind">אחד.</span></span>
        </h1>
        <p className="l7g-lead l5-in" style={{ '--i': 2 }}>
          Airbnb, Booking.com והזמנות ישירות על לוח אחד. הודעות לאורחים ומקדמות יוצאות לבד, בעברית.
        </p>
        <div className="l7g-cta l5-in" style={{ '--i': 3 }}>
          <SignupButton className="is-lg" />
          <a href="#roi" className="l5-btn-ghost is-lg">כמה זה שווה לכם?</a>
        </div>
        <p className="l7-note l5-in" style={{ '--i': 4 }}><Check size={14} strokeWidth={2.5} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
      </div>

      <div id="product" className="l7g-stage">
        <div className="l7g-disc" aria-hidden="true"><i className="l7g-orbit" /><i className="l7g-orbit-dot" /></div>
        <WidePhoto className="is-p1" src={`${IMG}/hosts-tall.webp`} w={900} h={1074} />
        <WidePhoto className="is-p2" src={`${IMG}/hostsdog.webp`} w={1100} h={1155} />
        <div className="l7g-fan">
          <Device className="l7g-ph is-side is-cal"><ScrCalendar /></Device>
          <Device className="l7g-ph is-side is-wa"><ScrWhatsApp /></Device>
          <Device className="l7g-ph is-mid"><ScrToday /></Device>
        </div>
        <div className="l7g-chips" aria-hidden="true">
          <BookingChip className="l7g-c1 l7-float" style={{ '--i': 3 }} />
          <PaidChip className="l7g-c2 l7-float" style={{ '--i': 4 }} />
        </div>
        <p className="l7g-stage-note">המסכים מתוך האפליקציה, עם נתוני דוגמה</p>
      </div>
    </section>
  );
}

/* ---------------- ROI ---------------- */
// Assumptions (shown under the result): bookings a unit gets in a month, the manual minutes a
// booking costs that ATLAS takes over, and what an hour of the owner's time is worth.
const BOOKINGS_PER_UNIT = 6;
const MIN_PER_BOOKING = 35;
const HOUR_VALUE = 70;
const PARTS = [
  ['הודעות ותשובות לאורחים', 15],
  ['עדכון יומנים בכל ערוץ', 10],
  ['גבייה ותזכורות תשלום', 10],
];

function planFor(units) {
  return PRICING_PLANS.find((p) => p.properties == null || units <= p.properties) || PRICING_PLANS.at(-1);
}

function Roi() {
  const [units, setUnits] = useState(4);
  const id = useId();
  const bookings = units * BOOKINGS_PER_UNIT;
  const parts = PARTS.map(([t, m]) => [t, m, Math.round((bookings * m) / 60)]);
  const hours = parts.reduce((a, p) => a + p[2], 0);
  const value = hours * HOUR_VALUE;
  const plan = planFor(units);
  const pct = ((units - 1) / 19) * 100;
  return (
    <section id="roi" className="l5-sec l7g-roi-sec" aria-labelledby="roi-title">
      <div className="l5-wrap">
        <div className="l7g-roi" data-reveal>
          <div className="l7g-roi-copy">
            <p className="l6-kicker">כמה זה שווה לכם</p>
            <h2 id="roi-title" className="l7-h2">כמה שעות בחודש חוזרות אליכם?</h2>
            <p className="l7-sub">הזיזו את הסמן לפי מספר היחידות במתחם. החישוב משוער, לפי ההנחות שכתובות למטה.</p>
            <div className="l7g-range">
              <label htmlFor={id}>
                מספר יחידות
                <output htmlFor={id} className="num" aria-live="polite">{units}</output>
              </label>
              <input
                id={id}
                type="range"
                min="1"
                max="20"
                step="1"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                style={{ '--p': `${pct}%` }}
                aria-valuetext={`${units} יחידות`}
              />
              <div className="l7g-range-scale" aria-hidden="true"><span className="num">1</span><span className="num">10</span><span className="num">20</span></div>
            </div>
          </div>

          <div className="l7g-roi-out" aria-live="polite">
            <div className="l7g-roi-big">
              <div>
                <small>שעות שחוזרות אליכם בחודש</small>
                <b className="num">{hours}</b>
              </div>
              <div className="is-ind">
                <small>שווי הזמן הזה בחודש</small>
                <b className="num" dir="ltr">₪{fmt(value)}</b>
              </div>
            </div>
            <ul className="l7g-roi-parts">
              {parts.map(([t, m, h]) => (
                <li key={t}>
                  <span>{t}</span>
                  <i style={{ '--w': `${(m / 15) * 100}%` }} aria-hidden="true" />
                  <b className="num">{h} ש׳</b>
                </li>
              ))}
            </ul>
            <p className="l7g-roi-plan">
              המסלול שמתאים ל-<span className="num">{units}</span> {units === 1 ? 'יחידה' : 'יחידות'}: <b>{plan.nameHe}</b>, <b className="num" dir="ltr">₪{fmt(plan.price)}</b> לחודש. 14 הימים הראשונים חינם.
            </p>
            <p className="l7g-roi-note">
              <Info size={14} strokeWidth={2} aria-hidden="true" />
              <span>
              הערכה בלבד. הנחנו <span className="num">{BOOKINGS_PER_UNIT}</span> הזמנות ליחידה בחודש, <span className="num">{MIN_PER_BOOKING}</span> דקות עבודה ידנית שנחסכות בכל הזמנה ושעת עבודה ב-<span className="num" dir="ltr">₪{HOUR_VALUE}</span>. לא כולל הזמנות כפולות שנמנעות. אצלכם המספרים יכולים להיות שונים.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- what it does ---------------- */
const DOES = [
  { n: '01', icon: CalendarDays, title: 'לוח אחד לכל הערוצים', line: 'הזמנה שנכנסה ב-Booking.com נחסמת מיד ב-Airbnb ובעמוד ההזמנה שלכם. בלי כפילויות.', chip: <BookingChip /> },
  { n: '02', icon: MessageCircle, title: 'האורחים מקבלים הכל לבד', line: 'אישור, הוראות הגעה, קוד לדלת ובקשה לביקורת יוצאים בוואטסאפ, בשמכם ובזמן.', chip: <WaChip /> },
  { n: '03', icon: Wallet, title: 'הכסף נכנס בזמן', line: 'מקדמה עם ההזמנה, תזכורת ליתרה לפני ההגעה, ודוח חודשי מסודר לרואה החשבון.', chip: <PaidChip /> },
];

function Does() {
  return (
    <section className="l5-sec l7g-does-sec" aria-labelledby="does-title">
      <div className="l5-wrap">
        <div className="l7-head is-center" data-reveal>
          <p className="l6-kicker">מה ATLAS עושה</p>
          <h2 id="does-title" className="l7-h2">שלושה דברים שאתם עושים היום ביד.</h2>
        </div>
        <ol className="l7g-does">
          {DOES.map((d, i) => {
            const I = d.icon;
            return (
              <li key={d.n} data-reveal style={{ '--d': `${i * 80}ms` }}>
                <div className="l7g-does-top">
                  <span className="l7g-does-ic" aria-hidden="true"><I size={20} strokeWidth={1.75} /></span>
                  <span className="l7g-does-n num" aria-hidden="true">{d.n}</span>
                </div>
                <h3>{d.title}</h3>
                <p>{d.line}</p>
                <div className="l7g-does-chip" aria-hidden="true">{d.chip}</div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- final ---------------- */
const TRUST_G = [
  [MessageCircle, 'תמיכה בעברית, בוואטסאפ'],
  [ShieldCheck, 'מידע מוצפן ומגובה'],
  [MapPin, 'נבנתה בישראל, לצימרים בישראל'],
];

function FinalCta() {
  return (
    <section className="l7-final" aria-labelledby="final-title">
      <div className="l5-wrap">
        <div className="l7g-final" data-reveal>
          <span className="l7g-final-faces" aria-hidden="true">
            {[AV.w1, AV.m3, AV.w2, AV.m5].map((s) => <img key={s} src={s} alt="" width="48" height="48" loading="lazy" decoding="async" />)}
          </span>
          <h2 id="final-title" className="l7-h2">העונה הבאה מתחילה עכשיו.</h2>
          <p>14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות, ואם נתקעים, בן אדם עונה בוואטסאפ.</p>
          <div className="l7g-cta">
            <SignupButton className="is-lg" />
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="l5-btn-ghost is-lg">וואטסאפ{'\u00a0'}<span dir="ltr" className="num">{PHONE_DISPLAY}</span></a>
          </div>
          <ul className="l7g-trust">
            {TRUST_G.map(([I, t]) => <li key={t}><I size={16} strokeWidth={1.75} aria-hidden="true" />{t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function LandingG() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 l7g" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Channels />
        <Roi />
        <Does />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".l7g-hero" />
    </div>
  );
}

