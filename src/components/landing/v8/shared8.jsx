/**
 * Landing v8 shared parts (O "קולאז׳ חי", P "מרכז שליטה").
 * Product imagery is the REAL ATLAS app v8 (C bento / D mobile), captured at 2x in demo mode
 * (example data) and cropped into public/landing-v8/ui + /scr. Photos: free-licence Pexels,
 * cool-graded webp in public/landing-v8/p. Faces: Pexels portraits (public/landing-v8/f).
 * Names next to faces are example guests inside example bookings, never testimonials.
 */
import React, { useEffect, useState } from 'react';
import { Check, CheckCheck, MessageCircle, MapPin, ShieldCheck } from 'lucide-react';
import { PRICING_PLANS } from '@/config/pricing';
import { fmt, prefersReducedMotion } from '../v5/motion';
import { Mark } from '../v5/ui';
import { SignupButton } from '../v5/LandingV5';

export const V8 = '/landing-v8';
export const ph = (n) => `${V8}/p/${n}.webp`;
export const ui = (n) => `${V8}/ui/${n}.webp`;
export const scr = (n) => `${V8}/scr/${n}.webp`;

/** Real app crops (2x) with their pixel size, so every <img> reserves its box. */
export const UI = {
  revenue: [754, 432], occ: [440, 432], unit: [598, 432], chart: [1070, 966], today: [754, 966],
  cal: [1856, 780], chat: [1856, 1158], paykpi: [1856, 218], paylist: [1856, 840], bookings: [1856, 860],
  bkpi: [1856, 256], sources: [754, 530], 'd-progress': [700, 392], 'd-strip': [780, 220], 'd-stay': [564, 244], 'd-stay2': [564, 244],
};

export function UiImg({ n, className = '', alt = '', lazy = true, style }) {
  const [w, h] = UI[n];
  return <img className={`v8-ui ${className}`} src={ui(n)} alt={alt} width={w} height={h} loading={lazy ? 'lazy' : 'eager'} decoding="async" style={style} />;
}

export const FACES = {
  noa: { src: `${V8}/f/f-noa.webp`, n: 'נועה ל.' },
  maya: { src: `${V8}/f/f-maya.webp`, n: 'מאיה כ.' },
  tom: { src: `${V8}/f/f-tom.webp`, n: 'תום ש.' },
  shir: { src: `${V8}/f/f-shir.webp`, n: 'שירן ג.' },
  ben: { src: `${V8}/f/f-ben.webp`, n: 'בן ר.' },
  yossi: { src: `${V8}/f/f-yossi.webp`, n: 'יוסי ב.' },
  adam: { src: `${V8}/f/f-adam.webp`, n: 'אדם ח.' },
  eli: { src: `${V8}/f/f-eli.webp`, n: 'אלי מ.' },
};

export function Face({ f, size = 40, className = '', lazy = true }) {
  return <img className={`v8-face ${className}`} src={FACES[f].src} alt="" width={size} height={size} loading={lazy ? 'lazy' : 'eager'} decoding="async" style={{ '--s': `${size}px` }} />;
}

export function FaceStack({ faces, size = 32, className = '', lazy = true }) {
  return (
    <span className={`v8-stack ${className}`} aria-hidden="true">
      {faces.map((f) => <Face key={f} f={f} size={size} lazy={lazy} />)}
    </span>
  );
}

/**
 * Notification card in the app's own toast style (white, 20px radius, avatar or tinted icon).
 * Content is example product data.
 */
export function Toast({ face, ch, tone, icon, title, sub, className = '', style }) {
  return (
    <div className={`v8-toast ${className}`} style={style}>
      <span className="v8-toast-lead">
        {face && <Face f={face} size={38} lazy={false} />}
        {icon && <span className={`v8-ic is-${tone}`}>{icon}</span>}
        {ch && <span className="v8-toast-ch"><Mark ch={ch} size={12} /></span>}
      </span>
      <span className="v8-toast-txt"><b>{title}</b>{sub && <small>{sub}</small>}</span>
    </div>
  );
}

export const BookingToast = (p) => <Toast face="maya" ch="booking" title="הזמנה חדשה נכנסה" sub="מאיה כ. · 3 לילות · האלון" {...p} />;
export const WaToast = (p) => (
  <Toast
    tone="wa"
    icon={<Mark ch="whatsapp" size={18} />}
    title={<>הוראות הגעה נשלחו <CheckCheck size={15} strokeWidth={2.4} className="v8-ticks" aria-hidden="true" /></>}
    sub="וואטסאפ לנועה ל. · 18:00"
    {...p}
  />
);
export const PaidToast = ({ amount = '₪750', sub = 'מקדמה · תום ש.', ...p }) => (
  <Toast tone="mint" icon={<Check size={17} strokeWidth={3} />} title={<><span className="num" dir="ltr">{amount}</span> התקבל</>} sub={sub} {...p} />
);

/** Pointer + scroll parallax for a stage. Writes --mx / --my / --sy on the element (transform-only CSS reads them). */
export function useParallax(ref, { scroll = 0.14 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    let raf = 0; let tx = 0; let ty = 0; let cx = 0; let cy = 0; let sy = 0;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const tick = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      el.style.setProperty('--mx', `${cx.toFixed(2)}px`);
      el.style.setProperty('--my', `${cy.toFixed(2)}px`);
      el.style.setProperty('--sy', `${sy.toFixed(1)}px`);
      raf = Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * -28;
      ty = ((e.clientY - r.top) / r.height - 0.5) * -20;
      kick();
    };
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0) return;
      sy = Math.min(window.scrollY, r.height) * -scroll;
      kick();
    };
    if (fine) el.addEventListener('pointermove', onMove);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [ref, scroll]);
}

/** Count up once in view. */
export function useCount(to, ref, dur = 1100) {
  const [v, setV] = useState(prefersReducedMotion() ? to : 0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) { setV(to); return undefined; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        setV(Math.round(to * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, ref, dur]);
  return v;
}

/* ---------------- pricing (toggle; the popular plan is a solid indigo card) ---------------- */
const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנתה בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

export function Pricing8({ title = 'מחיר פשוט. 14 יום עלינו.', className = '' }) {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className={`v8-pricing ${className}`} aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <div className="v8-head is-center" data-reveal>
          <h2 id="pricing-title" className="v8-h2">{title}</h2>
          <p className="v8-txt">כל מסלול מתחיל בניסיון חינם עם כל המערכת. בוחרים לפי מספר הנכסים.</p>
        </div>
        <div className="v8-seg" role="group" aria-label="תקופת חיוב" data-reveal>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי · חוסכים 20%</button>
          <i className={`v8-seg-thumb${yearly ? ' is-2' : ''}`} aria-hidden="true" />
        </div>
        <ul className="v8-plans" data-reveal>
          {PRICING_PLANS.map((p) => (
            <li key={p.key} className={`v8-plan${p.popular ? ' is-pop' : ''}`}>
              <div className="v8-plan-top">
                <h3>{p.nameHe}</h3>
                {p.popular && <span className="v8-plan-tag">הכי פופולרי</span>}
              </div>
              <p className="v8-plan-desc">{p.desc}</p>
              <p className="v8-plan-price">
                <b className="num" dir="ltr">₪{fmt(yearly ? p.priceYearly : p.price)}</b>
                <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
              </p>
              <SignupButton plan={p.key} className={`is-block${p.popular ? ' v8-btn-white' : ' is-quiet'}`} />
              <ul className="v8-plan-feat">
                {p.features.map((f) => <li key={f}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{f}</li>)}
              </ul>
            </li>
          ))}
        </ul>
        <ul className="v8-trust" data-reveal>
          {TRUST.map(({ I, t }) => <li key={t}><I size={18} strokeWidth={1.8} aria-hidden="true" />{t}</li>)}
        </ul>
      </div>
    </section>
  );
}

export function Credits() {
  return <p className="v8-credits">צילומים: Pexels (רישיון חופשי). המסכים הם מתוך ATLAS, עם נתוני דוגמה.</p>;
}
