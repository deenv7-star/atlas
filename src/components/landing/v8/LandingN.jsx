/**
 * Landing v8 N "Phone story scroll". Kinetic giant type (the word after "כל" keeps changing: ההזמנות,
 * האורחים, התשלומים, הניקיונות) beside a real smiling host and a real iPhone running ATLAS v8 D.
 * Then an Apple-style story: a sticky iPhone changes screens on scroll (Today, calendar, WhatsApp,
 * payment paid) while the background colour, the photo and the side lines change per step.
 * Then a dense bento of benefits (photos + real UI), pricing, FAQ and an indigo CTA.
 *
 * All screens are real ATLAS screens in demo mode; every name, booking and amount is example data
 * and is labelled as such. No testimonials, logos or customer counts.
 */
import React, { useCallback, useRef, useState } from 'react';
import { Check, CheckCheck, Sun, CalendarDays, MessageCircle, Wallet, Sparkles, FileText, Star, Monitor } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, prefersReducedMotion } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer, SignupButton } from '../v5/LandingV5';
import { V7Header, Chip } from '../v7/shared7';
import { UI, PH, FACES, FaceStack, IPhone, Pricing8, CtaLinks, Credits8, useScrollProgress, useCycle } from './shared8';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-v8n.css';

const NAV = [['#story', 'איך זה עובד'], ['#benefits', 'מה מקבלים'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- hero ---------------- */
const WORDS = ['ההזמנות', 'האורחים', 'התשלומים', 'ההודעות'];

function Hero() {
  const w = useCycle(WORDS.length, 2100);
  const band = useRef(null);
  useScrollProgress(band);
  return (
    <section className="ln-hero" aria-labelledby="hero-title">
      <div className="l5-wrap ln-hero-in">
        <div className="ln-hero-copy">
          <h1 id="hero-title" className="ln-h1">
            <span className="l5-sr">כל ההזמנות, האורחים, התשלומים וההודעות, בטלפון אחד.</span>
            <span className="ln-h1-l" aria-hidden="true">
              <span className="ln-w">כל</span>{' '}
              <span className="ln-rot">
                {WORDS.map((t, i) => <span key={t} className={i === w ? 'is-on' : i === (w + WORDS.length - 1) % WORDS.length ? 'is-out' : ''}>{t}</span>)}
              </span>
            </span>
            <span className="ln-h1-l" aria-hidden="true"><span className="ln-w is-2">בטלפון</span>{' '}<span className="ln-w is-3 ln-mark">אחד.</span></span>
          </h1>
          <p className="ln-sub">לוח, וואטסאפ לאורחים ותשלומים, באפליקציה אחת בעברית. ATLAS עושה את העבודה, ואתם מארחים.</p>
          <div className="ln-cta">
            <SignupButton className="is-lg" />
            <a href="#story" className="l5-btn-ghost is-lg">איך זה עובד</a>
          </div>
          <p className="ln-note"><Check size={14} strokeWidth={2.6} aria-hidden="true" />בלי כרטיס אשראי · הגדרה תוך 10 דקות</p>
        </div>
        <div className="ln-hv" aria-hidden="true">
          <i className="ln-hv-slab" />
          <figure className="ln-hv-photo"><img src={`${PH}/n-host.webp`} alt="" width="1000" height="1058" loading="eager" decoding="async" /></figure>
          <IPhone className="ln-hv-phone" screens={[`${UI}/d-today.webp`]} eager />
          <div className="ln-hv-chip is-a"><Chip av={FACES.noa.src} ch="airbnb" title="הזמנה חדשה מ-Airbnb" sub="נועה ל. · 2 לילות · הזית" /></div>
          <div className="ln-hv-chip is-b">
            <span className="ln-pill"><span className="ln-pill-ic is-mint"><Check size={15} strokeWidth={3} /></span><b><span className="num" dir="ltr">₪1,250</span> מקדמה התקבלה</b></span>
          </div>
          <div className="ln-hv-chip is-c">
            <span className="ln-pill"><span className="ln-pill-ic is-wa"><Mark ch="whatsapp" size={15} /></span><b>הוראות הגעה נשלחו</b><CheckCheck size={15} strokeWidth={2.4} className="ln-ticks" /></span>
          </div>
        </div>
      </div>
      <div ref={band} className="ln-band" aria-hidden="true">
        <p>הזמנות · אורחים · תשלומים · ניקיונות · הודעות · דוחות · הזמנות · אורחים · תשלומים · ניקיונות · הודעות · דוחות ·</p>
      </div>
      <p className="ln-hero-cap">מסכי ATLAS אמיתיים עם נתוני דוגמה.</p>
    </section>
  );
}

/* ---------------- story: sticky phone ---------------- */
const STEPS = [
  { tone: 'indigo', I: Sun, scr: 'd-today', img: 'n-calm', pos: '50% 30%', k: 'בוקר', title: 'היום כבר מסודר.', text: 'כניסות, יציאות וניקיונות לפי שעה. רואים מה מחכה, ומסמנים ״בוצע״ בלחיצה.', chips: ['2 כניסות', '1 יציאה', '1 ניקיון'], tag: { t: 'הכל מוכן להיום', i: Sparkles } },
  { tone: 'sky', I: CalendarDays, scr: 'd-calendar', img: 'n-family', pos: '50% 40%', k: 'לוח שנה', title: 'כל הערוצים. לוח אחד.', text: 'Airbnb, Booking.com והזמנות ישירות נכנסות לבד. תאריך שנתפס נחסם בכל מקום.', chips: ['Airbnb', 'Booking.com', 'ישיר'], tag: { t: 'משפחת לוי · 3 לילות', i: CalendarDays } },
  { tone: 'mint', I: MessageCircle, scr: 'd-thread', img: 'n-lake', pos: '50% 50%', k: 'וואטסאפ', title: 'האורח מקבל הכל. לבד.', text: 'אישור הזמנה, הוראות הגעה וקוד לדלת יוצאים בשמכם, בדיוק בזמן.', chips: ['אישור הזמנה', 'הוראות הגעה', 'תזכורת ליתרה'], tag: { t: 'נקרא ✓✓', i: MessageCircle } },
  { tone: 'lilac', I: Wallet, scr: 'd-paid', img: 'n-selfie', pos: '55% 40%', k: 'תשלומים', title: 'שולם. בלי לרדוף.', text: 'מקדמות ויתרות במקום אחד. רואים מי שילם, ו-ATLAS מזכירה למי שעוד לא.', chips: ['מקדמה 30%', 'יתרה לפני הגעה', '100% שולם'], tag: { t: '‏₪5,200 שולם במלואו', i: Check } },
];

function StepText({ s, i, n }) {
  const I = s.I;
  return (
    <>
      <div className="ln-dots" aria-hidden="true">{Array.from({ length: n }, (_, k) => <i key={k} className={k <= i ? 'is-on' : ''} />)}</div>
      <p className="ln-k"><I size={18} strokeWidth={2.2} aria-hidden="true" />{s.k}</p>
      <h3 className="ln-st-h">{s.title}</h3>
      <p className="ln-st-txt">{s.text}</p>
      <ul className="ln-chips">{s.chips.map((c) => <li key={c}>{c}</li>)}</ul>
    </>
  );
}

function StepMedia({ s }) {
  const T = s.tag.i;
  return (
    <>
      <img src={`${PH}/${s.img}.webp`} alt="" width="1000" height="1050" loading="lazy" decoding="async" style={{ objectPosition: s.pos }} />
      <span className="ln-tag"><T size={15} strokeWidth={2.4} aria-hidden="true" />{s.tag.t}</span>
    </>
  );
}

function Story() {
  const [i, setI] = useState(0);
  const track = useRef(null);
  const onP = useCallback((p, r, vh) => {
    const span = r.height - vh;
    const q = span > 0 ? Math.min(0.9999, Math.max(0, -r.top / span)) : 0;
    setI(Math.floor(q * STEPS.length));
  }, []);
  useScrollProgress(track, { onProgress: onP });
  const s = STEPS[i];
  const reduced = typeof window !== 'undefined' && prefersReducedMotion();
  return (
    <section id="story" className={`ln-story is-${s.tone}`} data-story aria-labelledby="story-title">
      <h2 id="story-title" className="l5-sr">ככה ATLAS עובדת, צעד אחר צעד</h2>
      {!reduced && (
        <div ref={track} className="ln-track" style={{ '--n': STEPS.length }}>
          {STEPS.map((x, k) => <i key={x.k} className="ln-mark-pt" data-story-mark style={{ top: `${k * 100}vh` }} />)}
          <div className="ln-sticky">
            <div className="l5-wrap ln-grid">
              <ol className="ln-texts">
                {STEPS.map((x, k) => (
                  <li key={x.k} className={k === i ? 'is-on' : ''} aria-hidden={k === i ? undefined : 'true'}>
                    <StepText s={x} i={k} n={STEPS.length} />
                  </li>
                ))}
              </ol>
              <div className="ln-ph-wrap">
                <IPhone className="ln-st-phone" screens={STEPS.map((x) => `${UI}/${x.scr}.webp`)} active={i} label={`מסך ATLAS: ${s.k} (נתוני דוגמה)`} />
              </div>
              <div className="ln-media" aria-hidden="true">
                {STEPS.map((x, k) => <figure key={x.k} className={k === i ? 'is-on' : ''}><StepMedia s={x} /></figure>)}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* static version: reduced motion + long screenshots */}
      <ol className={`ln-static${reduced ? ' is-shown' : ''}`}>
        {STEPS.map((x, k) => (
          <li key={x.k} className={`ln-static-row is-${x.tone}`}>
            <div className="l5-wrap ln-grid">
              <div className="ln-static-txt"><StepText s={x} i={k} n={STEPS.length} /></div>
              <div className="ln-ph-wrap"><IPhone className="ln-st-phone" screens={[`${UI}/${x.scr}.webp`]} /></div>
              <figure className="ln-static-media" aria-hidden="true"><StepMedia s={x} /></figure>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------- bento ---------------- */
function Bento() {
  return (
    <section id="benefits" className="ln-bento" aria-labelledby="bento-title">
      <div className="l5-wrap">
        <div className="v8-head" data-reveal>
          <h2 id="bento-title" className="v8-h2">כל מה שהצימר צריך. <span className="is-ind">בלי עוד אפליקציות.</span></h2>
        </div>
        <ul className="ln-grid8">
          <li className="ln-c is-fam is-photo" data-reveal>
            <img src={`${PH}/n-family.webp`} alt="" width="1000" height="1050" loading="lazy" decoding="async" />
            <div className="ln-c-card">
              <span className="ln-c-ic"><Mark ch="direct" size={18} /></span>
              <b>עמוד הזמנה ישירה משלכם</b>
              <small>אורחים מזמינים ומשלמים מקדמה, בלי עמלה לערוץ.</small>
            </div>
          </li>
          <li className="ln-c is-ten is-ind" data-reveal style={{ '--d': '60ms' }}>
            <b className="ln-big num" dir="ltr">10</b>
            <span className="ln-c-u">דקות</span>
            <p>מההרשמה ועד לוח מסונכרן עם Airbnb ו-Booking.com.</p>
          </li>
          <li className="ln-c is-tub is-photo" data-reveal style={{ '--d': '120ms' }}>
            <img src={`${PH}/n-woodtub.webp`} alt="" width="900" height="1080" loading="lazy" decoding="async" />
            <img className="ln-c-ui is-occ" src={`${UI}/c-occ.webp`} alt="כרטיס תפוסה: 37% החודש (נתוני דוגמה)" width="520" height="432" loading="lazy" decoding="async" />
          </li>
          <li className="ln-c is-rep is-mint" data-reveal style={{ '--d': '60ms' }}>
            <p className="ln-c-k"><FileText size={18} strokeWidth={2} aria-hidden="true" />דוח חודשי</p>
            <b className="ln-c-t">PDF לרואה החשבון, בלחיצה.</b>
            <img className="ln-c-ui is-chart" src={`${UI}/c-chart.webp`} alt="" width="1256" height="966" loading="lazy" decoding="async" />
          </li>
          <li className="ln-c is-gst is-lilac" data-reveal>
            <FaceStack keys={['noa', 'tom', 'maya', 'ben', 'shir', 'yossi']} size={52} />
            <b className="ln-c-t">כל אורח, כל הפרטים.</b>
            <p>טלפון, הזמנות קודמות והודעות, בכרטיס אחד. מזהים אורח חוזר בשנייה.</p>
          </li>
          <li className="ln-c is-rev is-photo" data-reveal style={{ '--d': '60ms' }}>
            <img src={`${PH}/n-smile.webp`} alt="" width="1000" height="564" loading="lazy" decoding="async" style={{ objectPosition: '50% 30%' }} />
            <span className="ln-pill is-float"><span className="ln-pill-ic is-sky"><Star size={14} strokeWidth={2.4} /></span><b>בקשת ביקורת נשלחה אחרי היציאה</b></span>
          </li>
          <li className="ln-c is-sup is-sky" data-reveal style={{ '--d': '120ms' }}>
            <span className="ln-c-wa"><Mark ch="whatsapp" size={26} /></span>
            <b className="ln-c-t">תמיכה בעברית, בוואטסאפ.</b>
            <p>שאלה? כותבים, ואדם אמיתי עונה.</p>
          </li>
          <li className="ln-c is-pc" data-reveal>
            <div className="ln-pc-copy">
              <p className="ln-c-k"><Monitor size={18} strokeWidth={2} aria-hidden="true" />גם מהמחשב</p>
              <b className="ln-c-t">כל המתחם, על מסך אחד.</b>
              <p>אותה מערכת בטלפון ובמחשב. מה שמסמנים בדרך, מחכה בבית.</p>
            </div>
            <figure className="ln-pc-photo"><img src={`${PH}/n-work.webp`} alt="" width="1200" height="800" loading="lazy" decoding="async" /></figure>
            <img className="ln-pc-shot" src={`${UI}/c-today.webp`} alt="מסך ״היום״ של ATLAS במחשב (נתוני דוגמה)" width="2400" height="1500" loading="lazy" decoding="async" />
          </li>
        </ul>
        <p className="v8-cap ln-cap" data-reveal>המסכים הם מסכי ATLAS אמיתיים עם נתוני דוגמה.</p>
      </div>
    </section>
  );
}

/* ---------------- final ---------------- */
function Final() {
  return (
    <section className="ln-x" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="ln-x-box">
          <div className="ln-x-copy">
            <h2 id="final-title" className="ln-x-h" data-reveal>האורח הבא בדרך.<br />הטלפון כבר מוכן.</h2>
            <p className="ln-x-sub" data-reveal>14 ימי ניסיון חינם. מחברים ערוצים תוך 10 דקות, ו-ATLAS מתחילה לעבוד.</p>
            <div data-reveal><CtaLinks /></div>
          </div>
          <div className="ln-x-vis" aria-hidden="true">
            <figure className="ln-x-photo"><img src={`${PH}/n-calm.webp`} alt="" width="900" height="1000" loading="lazy" decoding="async" /></figure>
            <IPhone className="ln-x-phone" screens={[`${UI}/d-paylist.webp`]} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingN() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l7 v8 ln" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Story />
        <Bento />
        <Pricing8 tone="is-sky" />
        <Faq limit={5} />
        <Final />
      </main>
      <Credits8 />
      <Footer />
      <CookieConsent revealAfter=".ln-hero" />
    </div>
  );
}
