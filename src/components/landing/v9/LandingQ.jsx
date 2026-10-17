/**
 * Landing v9 Q "מהמתחם למסך" (from your place to your screen).
 *
 * Hero: a full-bleed aerial photo of a pool complex in the green, white headline, live notifications
 * arriving on the glass (new booking, WhatsApp sent, deposit paid). On scroll the photo shrinks, exactly,
 * into the property photo tile of the real ATLAS home screen (app v8 C) that assembles around it:
 * the place becomes the product. Desktop lands in a browser window, phones land in the C mobile view.
 * Then a photo + real-UI bento, the C mobile views in hand, pricing, FAQ and a closing CTA.
 *
 * Real screens in demo mode; every name, booking and amount is example data and labelled so.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, MessageCircle, Wallet, Check } from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { Mark } from '../v5/ui';
import {
  UI, PH, Header9, SignupBtn, CtaNote, Browser, Phone, Notif, WaBubble, Faces, Pricing9, Faq9, Footer9, WaLink,
  useStickyProgress, useReveal9, reduced,
} from './shared9';
import '../v5/landing-v5.css';
import './shared9.css';
import './landing-v9q.css';

const NAV = [['#product', 'המוצר'], ['#features', 'מה זה עושה'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/** The property photo tile inside the real captures, as fractions of the screen image. */
const TILE = {
  desk: { x: 80 / 2880, y: 202 / 1800, w: 704 / 2880, h: 432 / 1800, r: 28 / 1440 },
  mob: { x: 40 / 780, y: 568 / 1594, w: 338 / 780, h: 460 / 1594, r: 28 / 390 },
};
const PHOTO = { w: 2600, h: 1950 };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

function useDesktop() {
  const q = '(min-width: 900px)';
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setD(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return d;
}

function HeroCopy({ id }) {
  return (
    <div className="q-copy-in">
      <h1 id={id} className="q-h1">כל המתחם.<br />במבט אחד.</h1>
      <p className="q-sub">הזמנות מכל הערוצים, וואטסאפ לאורחים ותשלומים, במסך אחד שעובד בשבילכם.</p>
      <div className="q-ctas">
        <SignupBtn className="is-lg" />
        <a href="#product" className="q-ghost">איך זה נראה</a>
      </div>
      <CtaNote className="q-note" />
    </div>
  );
}

const NTFS = [
  { ch: 'booking', title: 'הזמנה חדשה מ-Booking.com', sub: 'שירן ג. · הזית · 2 לילות', time: '08:12' },
  { ch: 'whatsapp', title: 'אישור נשלח בוואטסאפ', sub: 'משפחת לוי · עם הוראות הגעה', time: '09:00' },
  { face: 'noa', title: 'נועה ל. שילמה מקדמה', sub: '‏₪1,250 · האלון · נרשם לבד', time: '10:24' },
];

function Notifs({ className = '' }) {
  return (
    <div className={`q-ntfs ${className}`} aria-hidden="true">
      {NTFS.map((n, i) => <Notif key={n.title} {...n} className="q-ntf" style={{ '--i': i }} />)}
    </div>
  );
}

function Device({ desk, imgRef }) {
  return desk ? (
    <Browser src={`${UI}/d-today8.webp`} url="app.atlas-il.com/today" className="q-dev" eager imgRef={imgRef} alt="מסך הבית של ATLAS, נתוני דוגמה" />
  ) : (
    <Phone screens={[`${UI}/m-today8.webp`]} className="q-dev" eager imgRef={imgRef} label="מסך הבית של ATLAS בטלפון, נתוני דוגמה" />
  );
}

/* ---------------- hero: the photo becomes the tile ---------------- */
function Hero() {
  const desk = useDesktop();
  const [rm] = useState(reduced);
  const sec = useRef(null);
  const stage = useRef(null);
  const clip = useRef(null);
  const img = useRef(null);
  const shot = useRef(null);
  const copy = useRef(null);
  const ntfs = useRef(null);
  const end = useRef(null);
  const geo = useRef(null);

  const measure = useCallback(() => {
    const st = stage.current; const s = shot.current;
    if (!st || !s) return;
    const sr = st.getBoundingClientRect();
    const r = s.getBoundingClientRect();
    const T = desk ? TILE.desk : TILE.mob;
    geo.current = {
      W: sr.width, H: sr.height,
      tx: r.left - sr.left + T.x * r.width, ty: r.top - sr.top + T.y * r.height, tw: T.w * r.width, th: T.h * r.height, tr: T.r * r.width,
    };
    const cover = Math.max(sr.width / PHOTO.w, sr.height / PHOTO.h);
    const iw = PHOTO.w * cover; const ih = PHOTO.h * cover;
    Object.assign(img.current.style, { width: `${iw}px`, height: `${ih}px`, left: `${(sr.width - iw) / 2}px`, top: `${(sr.height - ih) / 2}px` });
    geo.current.cover = cover;
  }, [desk]);

  const paint = useCallback((p) => {
    const g = geo.current;
    if (!g) return;
    const t = easeIO(seg(p, 0.06, 0.72));
    const x = lerp(0, g.tx, t); const y = lerp(0, g.ty, t);
    const w = lerp(g.W, g.tw, t); const h = lerp(g.H, g.th, t);
    const rad = lerp(0, g.tr, t);
    clip.current.style.clipPath = `inset(${y}px ${g.W - x - w}px ${g.H - y - h}px ${x}px round ${rad}px)`;
    const s = Math.max(w / PHOTO.w, h / PHOTO.h) / g.cover;
    img.current.style.transform = `translate3d(${x + w / 2 - g.W / 2}px, ${y + h / 2 - g.H / 2}px, 0) scale(${s})`;
    clip.current.style.opacity = String(1 - seg(p, 0.74, 0.86));
    clip.current.style.setProperty('--scrim', String(1 - seg(p, 0, 0.3)));
    const c = seg(p, 0, 0.2);
    copy.current.style.opacity = String(1 - c);
    copy.current.style.transform = `translate3d(0, ${-40 * c}px, 0)`;
    copy.current.classList.toggle('is-gone', c >= 1);
    ntfs.current.style.opacity = String(1 - seg(p, 0.04, 0.22));
    ntfs.current.style.transform = `translate3d(0, ${-60 * seg(p, 0.04, 0.22)}px, 0)`;
    const e = seg(p, 0.22, 0.62);
    shot.current.closest('.q-dev').style.opacity = String(e);
    const hd = seg(p, 0.6, 0.8);
    end.current.style.opacity = String(hd);
    end.current.style.transform = `translate3d(0, ${16 * (1 - hd)}px, 0)`;
  }, []);

  const last = useRef(0);
  useStickyProgress(sec, (p) => { last.current = p; paint(p); }, !rm);

  useEffect(() => {
    if (rm) return undefined;
    const on = () => { measure(); paint(last.current); };
    on();
    const im = shot.current;
    if (im && !im.complete) im.addEventListener('load', on, { once: true });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [rm, measure, paint, desk]);

  if (rm) {
    return (
      <>
        <section className="q-hero is-static" aria-labelledby="hero-title">
          <div className="q-static-photo">
            <img src={`${PH}/pool-xl.webp`} srcSet={`${PH}/pool-m.webp 1000w, ${PH}/pool-xl.webp 1920w`} sizes="100vw" alt="מתחם אירוח עם בריכה בין עצים, מבט מלמעלה" width="1920" height="1440" />
            <i className="q-scrim" />
            <div className="q-copy"><HeroCopy id="hero-title" /></div>
            <Notifs className="is-static" />
          </div>
        </section>
        <section id="product" className="q-static-end" aria-label="מסך הבית של ATLAS">
          <EndHead />
          <div className="q-static-dev"><Device desk={desk} /></div>
        </section>
      </>
    );
  }

  return (
    <section ref={sec} className="q-hero" aria-labelledby="hero-h1">
      <div ref={stage} className="q-stage">
        <div className="q-end">
          <div ref={end} className="q-end-head" id="product"><EndHead /></div>
          <div className="q-end-dev"><Device desk={desk} imgRef={shot} /></div>
        </div>
        <div ref={clip} className="q-clip">
          <img
            ref={img}
            className="q-photo"
            src={`${PH}/pool-xl.webp`}
            srcSet={`${PH}/pool-m.webp 1000w, ${PH}/pool-xl.webp 1920w`}
            sizes="100vw"
            alt="מתחם אירוח עם בריכה בין עצים, מבט מלמעלה"
            width="1920"
            height="1440"
          />
          <i className="q-scrim" />
        </div>
        <div ref={copy} className="q-copy"><HeroCopy id="hero-h1" /></div>
        <div ref={ntfs} className="q-ntfs-wrap"><Notifs /></div>
      </div>
    </section>
  );
}

function EndHead() {
  return (
    <>
      <h2 className="q-end-h">בוקר טוב. <span className="n9-hl">הכל כבר כאן.</span></h2>
      <p className="q-end-sub">ככה נראה מסך הבית של ATLAS כל בוקר. נתוני דוגמה.</p>
    </>
  );
}

/* ---------------- bento ---------------- */
function Bento() {
  return (
    <section id="features" className="n9-sec q-bento-sec" aria-labelledby="feat-title">
      <div className="n9-wrap">
        <div className="n9-head" data-reveal>
          <h2 id="feat-title" className="n9-h2">ארבעה דברים שכבר <span className="n9-hl">לא עליכם.</span></h2>
          <p className="n9-lead">ATLAS עושה את העבודה הקטנה של כל יום. אתם נשארים עם האורחים.</p>
        </div>
        <div className="q-bento">
          <article className="q-tile is-photo is-wa" data-reveal>
            <img src={`${PH}/m-tub.webp`} alt="זוג אורחים בג׳קוזי מול אגם" width="1400" height="933" loading="lazy" decoding="async" />
            <div className="q-tile-ui"><WaBubble /></div>
            <div className="q-tile-cap">
              <h3 className="n9-h3">כל אורח מקבל וואטסאפ בזמן.</h3>
              <p>אישור, הוראות הגעה ותזכורת. ממולא ונשלח לבד.</p>
            </div>
          </article>
          <article className="q-tile is-indigo" data-reveal style={{ '--d': '80ms' }}>
            <div className="q-tile-txt">
              <span className="q-ic" aria-hidden="true"><CalendarDays size={20} strokeWidth={1.8} /></span>
              <h3 className="n9-h3">שלושה ערוצים. לוח אחד.</h3>
              <p>Booking.com, Airbnb והזמנות ישירות נכנסים לאותו לוח. בלי כפל הזמנות.</p>
              <ul className="q-chans" aria-label="ערוצים">
                <li><Mark ch="booking" size={18} />Booking.com</li>
                <li><Mark ch="airbnb" size={18} />Airbnb</li>
                <li><Mark ch="direct" size={18} />ישיר</li>
              </ul>
            </div>
            <div className="q-crop is-cal" aria-hidden="true"><img src={`${UI}/d-calendar.webp`} alt="" width="2400" height="1500" loading="lazy" decoding="async" /></div>
          </article>
          <article className="q-tile is-mint" data-reveal>
            <div className="q-tile-txt">
              <span className="q-ic" aria-hidden="true"><Wallet size={20} strokeWidth={1.8} /></span>
              <h3 className="n9-h3">רואים כל שקל שנכנס.</h3>
              <p>מקדמות ויתרות נרשמות לבד, והכנסות החודש תמיד מול העיניים.</p>
            </div>
            <div className="q-crop is-inc" aria-hidden="true"><img src={`${UI}/c-income.webp`} alt="" width="888" height="432" loading="lazy" decoding="async" /></div>
          </article>
          <article className="q-tile is-photo is-host" data-reveal style={{ '--d': '80ms' }}>
            <img src={`${PH}/m-host.webp`} alt="מארח מחייך עם הטלפון ביד" width="900" height="968" loading="lazy" decoding="async" />
            <div className="q-tile-ui"><Notif ch="booking" title="הזמנה חדשה מ-Booking.com" sub="שירן ג. · הזית · 2 לילות" time="08:12" /></div>
            <div className="q-tile-cap">
              <h3 className="n9-h3">הזמנה נכנסת? היא כבר בלוח.</h3>
              <p>בלי להעתיק, בלי לבדוק שלוש אפליקציות.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ---------------- mobile ---------------- */
const MOB = [
  { I: CalendarDays, t: 'היום במתחם: מי נכנס, מי יוצא, מה לנקות.' },
  { I: MessageCircle, t: 'כל ההודעות לאורחים בשרשור אחד.' },
  { I: Wallet, t: 'רישום תשלום בלחיצה, מכל מקום.' },
];

function Mobile() {
  return (
    <section className="q-mob-sec" aria-labelledby="mob-title">
      <div className="n9-wrap">
        <div className="q-mob">
          <div className="q-mob-txt" data-reveal>
            <h2 id="mob-title" className="n9-h2">וגם בטלפון.<br /><span className="n9-hl">כל המתחם בכיס.</span></h2>
            <ul className="q-mob-list">
              {MOB.map(({ I, t }) => <li key={t}><span aria-hidden="true"><I size={18} strokeWidth={1.9} /></span>{t}</li>)}
            </ul>
            <div className="q-mob-faces"><Faces keys={['maya', 'tom', 'shir', 'adam']} size={36} /><span>3 כניסות היום, הכל מוכן</span></div>
          </div>
          <div className="q-fan" data-reveal style={{ '--d': '100ms' }} aria-label="מסכי ATLAS בטלפון: היום, לוח שנה והודעות" role="img">
            <Phone screens={[`${UI}/m-calendar.webp`]} className="q-fan-ph is-a" />
            <Phone screens={[`${UI}/m-thread.webp`]} className="q-fan-ph is-c" />
            <Phone screens={[`${UI}/m-today2.webp`]} className="q-fan-ph is-b" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- closing CTA ---------------- */
function Closing() {
  return (
    <section className="q-cta-sec" aria-labelledby="cta-title">
      <div className="n9-wrap">
        <div className="q-cta" data-reveal>
          <div className="q-cta-txt">
            <h2 id="cta-title" className="n9-h2">הבוקר הבא שלכם יכול להיראות ככה.</h2>
            <p className="q-cta-sub">14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות, ואם נתקעים, אדם עונה בוואטסאפ.</p>
            <div className="q-cta-row">
              <SignupBtn className="is-lg is-white" />
              <WaLink className="q-cta-wa" />
            </div>
            <p className="q-cta-note"><Check size={15} strokeWidth={2.6} aria-hidden="true" />ביטול בכל עת</p>
          </div>
          <div className="q-cta-pic" aria-hidden="true">
            <img src={`${UI}/c-photo.webp`} alt="" width="704" height="432" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingQ() {
  const root = useRef(null);
  useReveal9(root);
  return (
    <div ref={root} className="n9 lq" dir="rtl">
      <a href="#main" className="n9-sr">דילוג לתוכן</a>
      <Header9 nav={NAV} tone="glass" />
      <main id="main">
        <Hero />
        <Bento />
        <Mobile />
        <Pricing9 className="q-pr" />
        <Faq9 />
        <Closing />
      </main>
      <Footer9 />
      <CookieConsent revealAfter=".q-hero" />
    </div>
  );
}
