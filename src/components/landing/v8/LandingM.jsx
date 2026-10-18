/**
 * Landing v8 M "Product theatre". The real ATLAS v8 dashboard (C, bento) is the star: shown big in
 * 3D perspective on a soft indigo glow floor, with real UI widgets of the same screen lifting out of it
 * in layers (income card, occupancy ring, property tile) plus a WhatsApp bubble, a payment card and
 * guest faces around it. Pointer parallax on desktop; on scroll the screen settles flat and the
 * widgets drop back into it. Then four full-bleed colour blocks (indigo, sky, lilac, mint) that stack
 * on scroll, each one feature = a large real UI crop + one bold line + real people photos.
 * Pricing, FAQ and an indigo CTA.
 *
 * All screens are real ATLAS screens in demo mode; every name, booking and amount is example data
 * and is labelled as such. No testimonials, logos or customer counts.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CalendarDays, MessageCircle, Wallet, Sun, RefreshCw, Sparkles } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer, SignupButton } from '../v5/LandingV5';
import { V7Header, Chip } from '../v7/shared7';
import { UI, PH, FACES, Face, FaceStack, WaBubble, Pricing8, CtaLinks, Credits8, useScrollProgress, usePointerTilt } from './shared8';
import '../v5/landing-v5.css';
import '../v7/landing-v7.css';
import './shared8.css';
import './landing-v8m.css';

const NAV = [['#features', 'המוצר'], ['#facts', 'למה ATLAS'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- hero: the dashboard on stage ---------------- */
/** Widget rectangles inside the 1440×900 dashboard capture (fractions), so lifted layers line up exactly. */
const POPS = [
  { k: 'income', x: 0.475, y: 0.1122, w: 0.3083, h: 0.24, z: 120, d: 0 },
  { k: 'occ', x: 0.2833, y: 0.1122, w: 0.1806, h: 0.24, z: 80, d: 1 },
  { k: 'photo', x: 0.0278, y: 0.1122, w: 0.2444, h: 0.24, z: 56, d: 2 },
];

function Stage() {
  return (
    <div className="lm-stage" aria-hidden="true">
      <div className="lm-floor"><i className="lm-glow" /><i className="lm-grid" /></div>
      <div className="lm-rise">
        <div className="lm-rig">
          <div className="lm-screen">
            <div className="lm-chrome"><i /><i /><i /><span>app.atlas-il.com/today</span></div>
            <div className="lm-shot">
              <img src={`${UI}/c-today.webp`} alt="" width="2400" height="1500" loading="eager" decoding="async" />
              {POPS.map((p) => (
                <i key={`s-${p.k}`} className="lm-slot" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.w * 100}%`, height: `${p.h * 100}%` }} />
              ))}
              {POPS.map((p) => (
                <div key={p.k} className={`lm-pop is-${p.k}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.w * 100}%`, height: `${p.h * 100}%`, '--z': p.z, '--i': p.d }}>
                  <img src={`${UI}/c-${p.k}.webp`} alt="" decoding="async" />
                </div>
              ))}
            </div>
          </div>
          <div className="lm-out is-wa" style={{ '--i': 3 }}><WaBubble /></div>
          <div className="lm-out is-paid" style={{ '--i': 4 }}><img src={`${UI}/c-received.webp`} alt="" width="352" height="110" decoding="async" /></div>
          <div className="lm-out is-faces" style={{ '--i': 5 }}>
            <div className="lm-faces-card">
              <FaceStack keys={['noa', 'tom', 'maya', 'adam']} size={40} />
              <span><b>3 כניסות היום</b><small>האלון · הזית · הגפן</small></span>
            </div>
          </div>
          <div className="lm-out is-bk" style={{ '--i': 6 }}>
            <Chip av={FACES.shir.src} ch="booking" title="הזמנה חדשה מ-Booking.com" sub="שירן ג. · 2 לילות · הזית" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const ref = useRef(null);
  usePointerTilt(ref);
  const onP = useCallback((p, r, vh) => {
    const s = Math.min(1, Math.max(0, -r.top / (vh * 0.75)));
    ref.current?.style.setProperty('--s', s.toFixed(4));
  }, []);
  useScrollProgress(ref, { onProgress: onP });
  return (
    <section ref={ref} className="lm-hero" aria-labelledby="hero-title">
      <div className="l5-wrap lm-hero-copy">
        <h1 id="hero-title" className="lm-h1">
          <span className="lm-h1-l">פחות ניהול.</span>
          <span className="lm-h1-l is-ind">יותר אירוח.</span>
        </h1>
        <p className="lm-sub">הזמנות מ-Airbnb, Booking.com וישיר, וואטסאפ לאורחים ותשלומים. ATLAS מנהלת את הצימר, ואתם מארחים.</p>
        <div className="lm-cta">
          <SignupButton className="is-lg" />
          <a href="#features" className="l5-btn-ghost is-lg">לראות את המערכת</a>
        </div>
        <p className="lm-note"><Check size={14} strokeWidth={2.6} aria-hidden="true" />בלי כרטיס אשראי · הגדרה תוך 10 דקות</p>
      </div>
      <Stage />
      <p className="lm-hero-cap">מסך ״היום״ האמיתי של ATLAS, עם נתוני דוגמה.</p>
    </section>
  );
}

/* ---------------- channels strip ---------------- */
function Channels() {
  return (
    <section className="lm-ch" aria-label="עובדת עם">
      <div className="l5-wrap lm-ch-in">
        <p>מתחברת למה שכבר עובד אצלכם</p>
        <ul>
          <li><Mark ch="airbnb" size={20} />Airbnb</li>
          <li><Mark ch="booking" size={20} />Booking.com</li>
          <li><Mark ch="whatsapp" size={20} />WhatsApp</li>
          <li><Mark ch="google" size={20} />Google Calendar</li>
        </ul>
      </div>
    </section>
  );
}

/* ---------------- full-bleed feature blocks ---------------- */
function Block({ tone, layout, I, kicker, title, text, points, children, id }) {
  const ref = useRef(null);
  useScrollProgress(ref);
  // stacking cards: a block taller than the screen sticks only once its bottom is in view
  useEffect(() => {
    const el = ref.current;
    if (!el || !('ResizeObserver' in window)) return undefined;
    const set = () => el.style.setProperty('--stick', `${Math.min(0, window.innerHeight - el.offsetHeight)}px`);
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener('resize', set);
    set();
    return () => { ro.disconnect(); window.removeEventListener('resize', set); };
  }, []);
  return (
    <section ref={ref} id={id} className={`lm-blk is-${tone} is-${layout}`} aria-labelledby={`${tone}-title`}>
      <div className="l5-wrap lm-blk-in">
        <div className="lm-blk-copy" data-reveal>
          <p className="lm-kick"><I size={18} strokeWidth={2.2} aria-hidden="true" />{kicker}</p>
          <h2 id={`${tone}-title`} className="lm-blk-h">{title}</h2>
          <p className="lm-blk-txt">{text}</p>
          {points && (
            <ul className="lm-pts">
              {points.map((t) => <li key={t}><Check size={16} strokeWidth={2.8} aria-hidden="true" />{t}</li>)}
            </ul>
          )}
        </div>
        <div className="lm-blk-vis">{children}</div>
      </div>
    </section>
  );
}

function Blocks() {
  return (
    <div className="lm-blocks" id="features">
      <Block
        tone="indigo"
        layout="stage"
        I={CalendarDays}
        kicker="לוח שנה"
        title={<>כל הערוצים. לוח אחד.</>}
        text="Airbnb, Booking.com והזמנות ישירות נכנסות לבד ללוח. תאריך שנתפס נחסם בכל מקום, בלי כפל הזמנות ובלי אקסל."
      >
        <div className="lm-v lm-v-cal">
          <img className="lm-ui is-cal" src={`${UI}/c-cal.webp`} alt="לוח השנה של ATLAS: ארבע יחידות, הזמנות מכל הערוצים על ציר אחד (נתוני דוגמה)" width="2000" height="719" loading="lazy" decoding="async" />
          <figure className="lm-ph is-friends"><img src={`${PH}/m-friends.webp`} alt="" width="1400" height="933" loading="lazy" decoding="async" /></figure>
          <div className="lm-chip is-a"><Chip av={FACES.maya.src} ch="airbnb" title="הזמנה מ-Airbnb נכנסה ללוח" sub="מאיה כ. · 3 לילות · התאנה" /></div>
          <div className="lm-chip is-b"><span className="lm-sync"><RefreshCw size={16} strokeWidth={2.4} aria-hidden="true" />התאריכים נחסמו ב-Booking.com</span></div>
        </div>
      </Block>

      <Block
        tone="sky"
        layout="split"
        I={MessageCircle}
        kicker="הודעות"
        title={<>וואטסאפ לאורחים. יוצא לבד.</>}
        text="אישור הזמנה, הוראות הגעה וקוד לדלת יוצאים בשמכם, בדיוק בזמן. כל השיחות עם כל האורחים, במקום אחד."
        points={['אישור מיד אחרי ההזמנה', 'הוראות הגעה יום לפני', 'תזכורת ליתרה, בלי מבוכה']}
      >
        <div className="lm-v lm-v-msg">
          <img className="lm-ui is-msg" src={`${UI}/c-messages.webp`} alt="מסך ההודעות של ATLAS: שיחת וואטסאפ עם אורחים (נתוני דוגמה)" width="1800" height="1125" loading="lazy" decoding="async" />
          <figure className="lm-ph is-tub"><img src={`${PH}/m-tub.webp`} alt="" width="1400" height="933" loading="lazy" decoding="async" /></figure>
          <div className="lm-chip is-c">
            <WaBubble who="נועה ל." text="היי נועה, מחר מ-15:00 הצימר שלכם. קוד לדלת: 2419. נסיעה טובה!" time="18:00" />
          </div>
        </div>
      </Block>

      <Block
        tone="lilac"
        layout="collage"
        I={Wallet}
        kicker="תשלומים"
        title={<>הכסף נכנס. אתם רואים הכל.</>}
        text="מקדמה עם ההזמנה, תזכורת ליתרה, ותמונה אחת של מה נכנס החודש. בלי לרדוף אחרי אף אחד."
      >
        <div className="lm-v lm-v-pay">
          <img className="lm-ui is-paid" src={`${UI}/c-paid.webp`} alt="כרטיס תשלום בהזמנה: ‏₪5,200 שולם במלואו (נתוני דוגמה)" width="848" height="576" loading="lazy" decoding="async" />
          <figure className="lm-ph is-host"><img src={`${PH}/m-host.webp`} alt="" width="900" height="968" loading="lazy" decoding="async" /></figure>
          <img className="lm-ui is-chart" src={`${UI}/c-chart.webp`} alt="גרף הכנסות לפי חודש (נתוני דוגמה)" width="1256" height="966" loading="lazy" decoding="async" />
          <img className="lm-ui is-rec" src={`${UI}/c-received.webp`} alt="" width="704" height="220" loading="lazy" decoding="async" />
        </div>
      </Block>

      <Block
        tone="mint"
        layout="split is-flip"
        I={Sun}
        kicker="היום"
        title={<>היום שלכם, מסודר מראש.</>}
        text="כניסות, יציאות וניקיונות בציר אחד. מסמנים ״בוצע״ בלחיצה, וכולם יודעים מה הלאה."
        points={['כל בוקר: מה מחכה היום', 'ניקיון בין אורח לאורח', 'הכל מוכן? רואים במבט']}
      >
        <div className="lm-v lm-v-today">
          <img className="lm-ui is-today" src={`${UI}/c-todaylist.webp`} alt="רשימת ״היום במתחם״: כניסה, יציאה וניקיון (נתוני דוגמה)" width="888" height="966" loading="lazy" decoding="async" />
          <img className="lm-ui is-prog" src={`${UI}/c-progress.webp`} alt="" width="848" height="566" loading="lazy" decoding="async" />
          <figure className="lm-ph is-clean"><img src={`${PH}/m-clean.webp`} alt="" width="1300" height="866" loading="lazy" decoding="async" /></figure>
          <div className="lm-chip is-d"><span className="lm-done"><Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />הגפן מוכנה לאורחים</span></div>
        </div>
      </Block>
    </div>
  );
}

/* ---------------- facts ---------------- */
const FACTS = [
  { n: '3', u: 'ערוצים', t: 'Airbnb, Booking.com וישיר על לוח אחד' },
  { n: '10', u: 'דקות', t: 'מההרשמה ועד לוח מסונכרן' },
  { n: '14', u: 'ימים', t: 'ניסיון חינם, בלי כרטיס אשראי' },
  { n: '₪0', u: 'עמלה', t: 'על הזמנות מעמוד ההזמנה הישירה' },
];

function Facts() {
  return (
    <section id="facts" className="lm-facts" aria-labelledby="facts-title">
      <div className="l5-wrap">
        <div className="lm-facts-top" data-reveal>
          <h2 id="facts-title" className="v8-h2">נבנתה לצימרים. <span className="is-ind">לא למלונות.</span></h2>
          <div className="lm-facts-people">
            <FaceStack keys={['noa', 'tom', 'shir', 'ben', 'yossi']} size={48} />
            <p>בעברית, מימין לשמאל, עם תמיכה אנושית בוואטסאפ.</p>
          </div>
        </div>
        <ul className="lm-facts-row">
          {FACTS.map((f, i) => (
            <li key={f.u} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <b className="num" dir="ltr">{f.n}</b>
              <span>{f.u}</span>
              <p>{f.t}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- final CTA ---------------- */
function Final() {
  return (
    <section className="lm-x" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="lm-x-box">
          <div className="lm-x-faces" aria-hidden="true">
            {['noa', 'tom', 'maya', 'yossi'].map((k, i) => <Face key={k} f={FACES[k]} size={64} className={`lm-x-face is-${i + 1}`} />)}
          </div>
          <h2 id="final-title" className="lm-x-h" data-reveal>הבמה מוכנה.<br />האורחים בדרך.</h2>
          <p className="lm-x-sub" data-reveal>14 ימי ניסיון חינם. מחברים ערוצים תוך 10 דקות, ו-ATLAS מתחילה לעבוד.</p>
          <div data-reveal><CtaLinks /></div>
          <div className="lm-x-shot" aria-hidden="true">
            <img src={`${UI}/c-today.webp`} alt="" width="2400" height="1500" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- sticky mobile CTA: after the hero, hidden again at the final CTA / footer ---------------- */
function StickyCta() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const hero = document.querySelector('.lm-hero');
    const ends = [...document.querySelectorAll('.lm-x, .l5-ftr')];
    if (!hero || typeof IntersectionObserver === 'undefined') return undefined;
    let heroVisible = true;
    const endVisible = new Set();
    const update = () => setOn(!heroVisible && endVisible.size === 0);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting;
        else if (e.isIntersecting) endVisible.add(e.target);
        else endVisible.delete(e.target);
      }
      update();
    });
    io.observe(hero);
    ends.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className={`lm-sticky${on ? ' is-on' : ''}`} aria-hidden={on ? undefined : 'true'}>
      <Link to="/register" tabIndex={on ? 0 : -1}>התחילו 14 יום חינם</Link>
    </div>
  );
}

export default function LandingM() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l7 v8 lm" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Channels />
        <Blocks />
        <Facts />
        <Pricing8 />
        <Faq limit={5} />
        <Final />
      </main>
      <Credits8 />
      <Footer />
      <StickyCta />
      <CookieConsent revealAfter=".lm-hero" />
    </div>
  );
}
