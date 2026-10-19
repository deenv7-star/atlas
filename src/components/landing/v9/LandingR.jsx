/**
 * Landing v9 R "מילים שעובדות" (words that work).
 *
 * Hero: one giant typographic headline where the words carry live media (a cycling photo of a unit,
 * real guest faces, a payment that just landed). The media pills are buttons: each one opens that part
 * of the product in the demo right below. The demo is the real ATLAS app (v8 C) on an indigo stage:
 * real screens you can click through (top pills or the app's own sidebar), with numbered hotspots that
 * explain what you are looking at. Phones get the real C mobile views in a phone.
 * Then three big outcome lines, pricing, FAQ and a typographic CTA.
 *
 * Real screens in demo mode; every name, booking and amount is example data and labelled so.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Check, Sun, CalendarDays, Inbox, MessageCircle, Wallet, MousePointerClick } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { Mark } from '../v5/ui';
import {
  UI, PH, Header9, SignupBtn, CtaNote, Browser, Phone, Faces, Pricing9, Faq9, Footer9, WaLink, useCycle, useReveal9, reduced,
} from './shared9';
import '../v5/landing-v5.css';
import './shared9.css';
import './landing-v9r.css';

const NAV = [['#demo', 'דמו'], ['#why', 'למה ATLAS'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/**
 * The five screens. `nav` = the app's own sidebar row in the 1440×900 capture (fraction of height),
 * `spots` = hotspots (fractions of the capture, physical x from the left) with what they show.
 */
const SCREENS = [
  {
    k: 'today', I: Sun, label: 'היום', d: 'd-today', m: 'm-today', nav: 0.225,
    line: 'מי מגיע, מי יוצא וכמה נכנס החודש. במבט אחד.',
    spots: [
      { x: 0.6, y: 0.2, t: 'הכנסות החודש מתעדכנות עם כל תשלום' },
      { x: 0.3, y: 0.43, t: 'כניסות, יציאות וניקיון של היום' },
    ],
  },
  {
    k: 'calendar', I: CalendarDays, label: 'לוח שנה', d: 'd-calendar', m: 'm-calendar', nav: 0.284,
    line: 'Booking.com, Airbnb והזמנות ישירות באותו לוח.',
    spots: [
      { x: 0.755, y: 0.43, t: 'כל הזמנה עם פנים, יחידה ומספר לילות' },
      { x: 0.66, y: 0.718, t: 'צבע לכל ערוץ, אף פעם לא כפל הזמנות' },
    ],
  },
  {
    k: 'bookings', I: Inbox, label: 'הזמנות', d: 'd-bookings', m: 'm-bookings', nav: 0.342,
    line: 'כל ההזמנות מכל הערוצים, עם מצב התשלום של כל אחת.',
    spots: [
      { x: 0.14, y: 0.52, t: 'שולם, מקדמה או ממתין. רואים מיד' },
      { x: 0.345, y: 0.605, t: 'מאיזה ערוץ הגיעה ההזמנה' },
    ],
  },
  {
    k: 'messages', I: MessageCircle, label: 'הודעות', d: 'd-messages', m: 'm-thread', nav: 0.515,
    line: 'הודעות וואטסאפ שיוצאות לבד, בזמן, לכל אורח.',
    spots: [
      { x: 0.62, y: 0.31, t: 'אישור הזמנה שנשלח אוטומטית' },
      { x: 0.7, y: 0.44, t: 'כל השיחות עם אורחים במקום אחד' },
    ],
  },
  {
    k: 'payments', I: Wallet, label: 'כספים', d: 'd-payments', m: 'm-payments', nav: 0.457,
    line: 'מקדמות, יתרות ותשלומים שהתקבלו. בלי אקסל.',
    spots: [
      { x: 0.66, y: 0.52, t: 'כמה התקבל וכמה עוד ממתין' },
      { x: 0.135, y: 0.61, t: 'כל תשלום עם סטטוס ברור' },
    ],
  },
];

const PILL_PHOTOS = [`${PH}/u-pool.webp`, `${PH}/u-cabin.webp`, `${PH}/u-tub.webp`];

/* ---------------- hero headline with live media ---------------- */
function MediaPill({ kind, active, onPick, label }) {
  const [ph] = useCycle(PILL_PHOTOS.length, 2600, kind === 'photo');
  return (
    <button type="button" className={`r-pill is-${kind}${active ? ' is-on' : ''}`} onClick={onPick} aria-label={label}>
      {kind === 'photo' && PILL_PHOTOS.map((s, i) => (
        <img key={s} src={s} alt="" width="360" height="270" className={i === ph ? 'is-show' : ''} decoding="async" />
      ))}
      {kind === 'faces' && (
        <>
          <Faces keys={['noa', 'tom', 'maya']} size={56} />
          <span className="r-pill-wa" aria-hidden="true"><Mark ch="whatsapp" size={22} /></span>
        </>
      )}
      {kind === 'pay' && (
        <span className="r-pill-pay" aria-hidden="true"><Check size={22} strokeWidth={3} /><b className="num" dir="ltr">+₪2,350</b></span>
      )}
    </button>
  );
}

function Hero({ tab, pick }) {
  const go = (i) => { pick(i); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <section className="r-hero" aria-labelledby="r-h1">
      <div className="n9-wrap r-hero-in">
        <h1 id="r-h1" className="r-h1">
          <span className="r-w">הזמנות</span>{' '}
          <MediaPill kind="photo" active={tab === 1} onPick={() => go(1)} label="הזמנות: לפתוח את לוח השנה בדמו" />{' '}
          <span className="r-w">אורחים</span>{' '}
          <MediaPill kind="faces" active={tab === 3} onPick={() => go(3)} label="אורחים: לפתוח את ההודעות בדמו" />{' '}
          <span className="r-br" />
          <span className="r-w">ותשלומים</span>{' '}
          <MediaPill kind="pay" active={tab === 4} onPick={() => go(4)} label="תשלומים: לפתוח את הכספים בדמו" />
          <span className="r-br" />
          <span className="r-w n9-hl">במקום אחד.</span>
        </h1>
        <p className="r-sub">ATLAS מנהלת את המתחם בשבילכם. נסו את המערכת האמיתית כאן למטה, בלי להירשם.</p>
        <div className="r-ctas">
          <SignupBtn className="is-lg" />
          <a href="#demo" className="r-ghost"><MousePointerClick size={18} strokeWidth={2} aria-hidden="true" />לנסות את הדמו</a>
        </div>
        <CtaNote />
      </div>
    </section>
  );
}

/* ---------------- interactive demo ---------------- */
function Demo({ tab, pick, touched }) {
  const [spot, setSpot] = useState(-1);
  // while the demo plays by itself, each screen explains itself: hotspot 1, then hotspot 2
  useEffect(() => {
    setSpot(-1);
    if (touched || reduced()) return undefined;
    const a = window.setTimeout(() => setSpot(0), 900);
    const b = window.setTimeout(() => setSpot(1), 3000);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [tab, touched]);
  const S = SCREENS[tab];
  return (
    <section id="demo" className="r-demo-sec" aria-labelledby="demo-title">
      <div className="r-demo-wrap">
        <div className="r-stage">
          <div className="r-stage-head">
            <h2 id="demo-title" className="r-stage-h">זה ATLAS. <span>לחצו ותסתכלו.</span></h2>
            <div className="r-tabs" role="tablist" aria-label="מסכים במערכת">
              {SCREENS.map((s, i) => (
                <button
                  key={s.k}
                  type="button"
                  role="tab"
                  id={`r-tab-${s.k}`}
                  aria-selected={tab === i}
                  aria-controls="r-panel"
                  className={`r-tab${tab === i ? ' is-on' : ''}${tab === i && !touched ? ' is-auto' : ''}`}
                  onClick={() => pick(i)}
                >
                  <s.I size={17} strokeWidth={2} aria-hidden="true" />{s.label}
                  <i className="r-tab-bar" aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="r-line" aria-live="polite">{S.line}</p>
            <p className="r-hint"><MousePointerClick size={15} strokeWidth={2} aria-hidden="true" />אפשר ללחוץ גם על התפריט של המערכת</p>
          </div>

          <div id="r-panel" role="tabpanel" aria-labelledby={`r-tab-${S.k}`} className="r-panel">
            <div className="r-desk">
              <Browser src={`${UI}/${SCREENS[0].d}.webp`} url={`app.atlas-il.com/${S.k}`} className="r-win" eager alt="">
                {SCREENS.map((s, i) => (
                  <img key={s.k} src={`${UI}/${s.d}.webp`} alt={i === tab ? `מסך ${s.label} של ATLAS, נתוני דוגמה` : ''} aria-hidden={i === tab ? undefined : 'true'} width="2400" height="1500" decoding="async" className={`r-scr${i === tab ? ' is-on' : ''}`} />
                ))}
                {SCREENS.map((s, i) => (
                  <button
                    key={`n-${s.k}`}
                    type="button"
                    className={`r-nav${i === tab ? ' is-on' : ''}`}
                    style={{ top: `calc(${s.nav * 100}% - 22px)` }}
                    onClick={() => pick(i)}
                    aria-label={`לעבור למסך ${s.label}`}
                    tabIndex={-1}
                  />
                ))}
                {S.spots.map((p, j) => (
                  <div key={`${S.k}-${j}`} className={`r-spot${spot === j ? ' is-open' : ''}${p.x < 0.4 ? ' is-r' : ''}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, '--j': j }}>
                    <button type="button" aria-expanded={spot === j} onClick={() => setSpot(spot === j ? -1 : j)} onMouseEnter={() => setSpot(j)} aria-label={`הסבר ${j + 1}: ${p.t}`}>
                      <span>{j + 1}</span>
                    </button>
                    <p className="r-tip" aria-hidden={spot !== j}>{p.t}</p>
                  </div>
                ))}
              </Browser>
            </div>
            <div className="r-mob">
              <Phone screens={SCREENS.map((s) => `${UI}/${s.m}.webp`)} active={tab} className="r-phone" eager="all" label={`מסך ${S.label} של ATLAS בטלפון, נתוני דוגמה`} />
              <ol className="r-mob-spots">
                {S.spots.map((p, j) => <li key={`${S.k}-m-${j}`}><span>{j + 1}</span>{p.t}</li>)}
              </ol>
            </div>
          </div>
          <p className="r-demo-note">מסכים אמיתיים של ATLAS, עם נתוני דוגמה.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- big outcome lines ---------------- */
const LINES = [
  { n: '1', w: 'מסך', t: 'לכל המתחם', p: 'הזמנות, אורחים, ניקיון ותשלומים. לא עוד שלוש אפליקציות ומחברת.', img: 'c-occ', ar: '520 / 432' },
  { n: '0', w: 'הודעות', t: 'שצריך לכתוב ידנית', p: 'אישור, הוראות הגעה ותזכורת יוצאים בוואטסאפ לבד, עם הפרטים של כל אורח.', wa: true },
  { n: '10', w: 'דקות', t: 'וזה עובד', p: 'מחברים את Booking.com ו-Airbnb, מוסיפים יחידות, וההזמנות נכנסות לבד.', chans: true },
];

function Lines() {
  return (
    <section id="why" className="n9-sec r-lines-sec" aria-labelledby="why-title">
      <div className="n9-wrap">
        <h2 id="why-title" className="n9-h2 r-lines-h" data-reveal>שלושה מספרים שמשנים את היום.</h2>
        <ol className="r-lines">
          {LINES.map((l, i) => (
            <li key={l.n} className="r-ln" data-reveal style={{ '--d': `${i * 60}ms` }}>
              <p className="r-ln-big"><b className="num">{l.n}</b><span>{l.w}</span></p>
              <div className="r-ln-txt">
                <h3 className="n9-h3">{l.w} {l.t}</h3>
                <p>{l.p}</p>
              </div>
              <div className="r-ln-vis" aria-hidden="true">
                {l.img && <img src={`${UI}/${l.img}.webp`} alt="" width="520" height="432" loading="lazy" decoding="async" style={{ aspectRatio: l.ar }} />}
                {l.wa && (
                  <div className="r-ln-wa">
                    <img className="r-ln-face" src={`${PH}/f-maya.webp`} alt="" width="56" height="56" loading="lazy" decoding="async" />
                    <span><Mark ch="whatsapp" size={18} /></span>
                    <p>שלום משפחת לוי, ההזמנה שלכם בצימר הזית מאושרת. נשמח לראותכם!</p>
                  </div>
                )}
                {l.chans && (
                  <div className="r-ln-ch">
                    <span><Mark ch="booking" size={26} /></span>
                    <span><Mark ch="airbnb" size={26} /></span>
                    <span><Mark ch="direct" size={26} /></span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- typographic CTA ---------------- */
function Closing() {
  return (
    <section className="r-cta-sec" aria-labelledby="cta-title">
      <div className="n9-wrap">
        <div className="r-cta" data-reveal>
          <h2 id="cta-title" className="r-cta-h">
            14 יום{' '}
            <span className="r-cta-pill" aria-hidden="true"><Faces keys={['shir', 'adam', 'noa']} size={52} /></span>{' '}
            על חשבוננו.
          </h2>
          <p className="r-cta-sub">בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות, ואם נתקעים, אדם עונה בוואטסאפ.</p>
          <div className="r-cta-row">
            <SignupBtn className="is-lg is-white" />
            <WaLink className="r-cta-wa" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingR() {
  const root = useRef(null);
  useReveal9(root);
  const [touched, setTouched] = useState(false);
  const [tab, setTab] = useCycle(SCREENS.length, 5200, !touched);
  const pick = (i) => { setTouched(true); setTab(i); };
  return (
    <div ref={root} className="n9 lr" dir="rtl">
      <a href="#main" className="n9-sr">דילוג לתוכן</a>
      <Header9 nav={NAV} tone="light" />
      <main id="main">
        <Hero tab={tab} pick={pick} />
        <Demo tab={tab} pick={pick} touched={touched} />
        <Lines />
        <Pricing9 className="r-pr" />
        <Faq9 />
        <Closing />
      </main>
      <Footer9 />
      <CookieConsent revealAfter=".r-demo-sec" />
    </div>
  );
}
