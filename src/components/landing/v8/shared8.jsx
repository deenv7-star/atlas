/**
 * Landing v8 shared parts (M "Product theatre", N "Phone story scroll").
 * Product imagery = real ATLAS app v8 screens (C bento dashboard, D mobile), captured at 2x in demo
 * mode and stored as webp in public/landing-v8/ui. Photos = real free-licence Pexels photos, cool
 * graded, in public/landing-v8/ph. Every name, booking and amount is example data, labelled on the page.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Check, MessageCircle, MapPin, ShieldCheck, CheckCheck } from 'lucide-react';
import { PRICING_PLANS } from '@/config/pricing';
import { fmt, prefersReducedMotion } from '../v5/motion';
import { Mark } from '../v5/ui';
import { WHATSAPP_URL, CTA_NOTE } from '../v5/content';
import { SignupButton } from '../v5/LandingV5';

export const UI = '/landing-v8/ui';
export const PH = '/landing-v8/ph';

/** Example guests (names are example data inside example bookings, never testimonials). */
export const FACES = {
  noa: { src: `${PH}/f-noa.webp`, n: 'נועה ל.' },
  maya: { src: `${PH}/f-maya.webp`, n: 'מאיה כ.' },
  tom: { src: `${PH}/f-tom.webp`, n: 'תום ש.' },
  shir: { src: `${PH}/f-shir.webp`, n: 'שירן ג.' },
  ben: { src: `${PH}/f-ben.webp`, n: 'בן ר.' },
  yossi: { src: `${PH}/f-yossi.webp`, n: 'יוסי ב.' },
  adam: { src: `${PH}/f-adam.webp`, n: 'אדם ח.' },
  eli: { src: `${PH}/f-eli.webp`, n: 'אלי מ.' },
};

export function Face({ f, size = 44, className = '', style, lazy = true }) {
  return (
    <img
      className={`v8f ${className}`}
      src={f.src}
      alt=""
      width={size}
      height={size}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      style={{ '--s': `${size}px`, ...style }}
    />
  );
}

export function FaceStack({ keys, size = 34, className = '' }) {
  return (
    <span className={`v8-stack ${className}`} aria-hidden="true">
      {keys.map((k) => <Face key={k} f={FACES[k]} size={size} />)}
    </span>
  );
}

/** WhatsApp bubble card: the real message text the demo app sends (example guest). */
export function WaBubble({ who = 'משפחת לוי', text = 'שלום משפחת לוי, ההזמנה שלכם בצימר הזית מאושרת ל-16-19 באוקטובר. נשמח לראותכם!', time = '09:00', className = '', style }) {
  return (
    <div className={`v8-wa ${className}`} style={style}>
      <p className="v8-wa-top"><span className="v8-wa-ic"><Mark ch="whatsapp" size={15} /></span><b>{who}</b><small>וואטסאפ</small></p>
      <p className="v8-wa-msg">{text}<span className="v8-wa-meta"><span className="num" dir="ltr">{time}</span><CheckCheck size={14} strokeWidth={2.4} aria-hidden="true" /></span></p>
    </div>
  );
}

/**
 * iPhone (15 Pro proportions): titanium edge, black bezel, dynamic island, side buttons.
 * `screens` = list of image srcs; `active` picks the visible one (cross-fade).
 */
export function IPhone({ screens, active = 0, className = '', style, eager = false, label }) {
  return (
    <div className={`v8-ip ${className}`} style={style} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
      <i className="v8-ip-btn is-a" /><i className="v8-ip-btn is-b" /><i className="v8-ip-btn is-c" /><i className="v8-ip-btn is-d" />
      <div className="v8-ip-scr">
        <div className="v8-ip-status"><span className="num" dir="ltr">9:41</span><span className="v8-ip-island" /><span className="v8-ip-bat" /></div>
        <div className="v8-ip-view">
          {screens.map((s, i) => (
            <img key={s} src={s} alt="" width="390" height="844" loading={eager && i === 0 ? 'eager' : 'lazy'} decoding="async" className={i === active ? 'is-on' : ''} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Scroll progress of an element through the viewport, written as CSS vars on it:
 * --p 0..1 while the element travels from entering (top at bottom of viewport) to leaving.
 * One rAF per frame, passive listener; nothing runs under reduced motion.
 */
export function useScrollProgress(ref, { onProgress } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.setProperty('--p', p.toFixed(4));
      if (onProgress) onProgress(p, r, vh);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [ref, onProgress]);
}

/** Pointer parallax on fine pointers: sets --mx / --my (-1..1) on the element. */
export function usePointerTilt(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    let raf = 0; let x = 0; let y = 0;
    const apply = () => { raf = 0; el.style.setProperty('--mx', x.toFixed(3)); el.style.setProperty('--my', y.toFixed(3)); };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 2 - 1;
      y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => { x = 0; y = 0; if (!raf) raf = requestAnimationFrame(apply); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [ref]);
}

/** Cycles through `n` items every `ms` (paused when reduced motion or tab hidden). */
export function useCycle(n, ms = 2200) {
  const [i, setI] = useState(0);
  const t = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    t.current = window.setInterval(() => { if (!document.hidden) setI((v) => (v + 1) % n); }, ms);
    return () => window.clearInterval(t.current);
  }, [n, ms]);
  return i;
}

/* ---------------- pricing ---------------- */
const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנתה בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

export function Pricing8({ title = 'מחיר פשוט. 14 יום עלינו.', tone = '' }) {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className={`v8p ${tone}`} aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <div className="v8-head is-center" data-reveal>
          <h2 id="pricing-title" className="v8-h2">{title}</h2>
          <p className="v8-txt">כל מסלול מתחיל בניסיון חינם עם כל המערכת. בוחרים לפי מספר הנכסים.</p>
        </div>
        <div className="v8p-seg" role="group" aria-label="תקופת חיוב" data-reveal>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי · חוסכים 20%</button>
        </div>
        <ul className="v8p-plans" data-reveal>
          {PRICING_PLANS.map((p) => (
            <li key={p.key} className={`v8p-plan${p.popular ? ' is-pop' : ''}`}>
              <div className="v8p-top">
                <h3>{p.nameHe}</h3>
                {p.popular && <span className="v8p-tag">הכי פופולרי</span>}
              </div>
              <p className="v8p-desc">{p.desc}</p>
              <p className="v8p-price">
                <b className="num" dir="ltr">₪{fmt(yearly ? p.priceYearly : p.price)}</b>
                <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
              </p>
              <SignupButton plan={p.key} className={`is-block${p.popular ? ' is-white' : ' is-quiet'}`} />
              <ul className="v8p-feat">
                {p.features.map((f) => <li key={f}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{f}</li>)}
              </ul>
            </li>
          ))}
        </ul>
        <ul className="v8p-trust" data-reveal>
          {TRUST.map(({ I, t }) => <li key={t}><I size={18} strokeWidth={1.8} aria-hidden="true" />{t}</li>)}
        </ul>
      </div>
    </section>
  );
}

export function CtaLinks() {
  return (
    <>
      <div className="v8x-cta">
        <SignupButton className="is-lg is-white" />
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="v8x-link"><Mark ch="whatsapp" size={18} />שאלה? כתבו לנו</a>
      </div>
      <p className="v8x-note"><Check size={14} strokeWidth={2.6} aria-hidden="true" />{CTA_NOTE} · ביטול בכל עת</p>
    </>
  );
}

export function Credits8() {
  return <p className="v8-credits">צילומים: Pexels (רישיון חופשי). המסכים הם מסכי ATLAS אמיתיים עם נתוני דוגמה.</p>;
}
