/**
 * Landing t9 (23.11.2026): four redesigns of the atlas landing, each one rebuilt in the design language of a
 * reference template Deen sent (taster.co.il: zerem, numa, ofek, sivuv). The structure, type scale, motion and
 * ergonomics follow the reference; content, palette (#3E2BF1 / #1B2656 / #F7F8FB / white) and logo are atlas.
 * Nothing here is copied from the references: no code, no assets. Every screen is a real atlas screen with
 * example data; every photo is a real free-licence photo (public/landing-v8/ph, public/landing-t9/CREDITS.md).
 *
 * Truth rules (same as the live page): the assistant PREPARES and the owner's tap saves; WhatsApp opens ready in
 * the owner's own WhatsApp and the owner sends it; dates from Booking / Airbnb come in about every 15 minutes;
 * no receipts or tax invoices; no customer counts, ratings or testimonials. The iOS app is on TestFlight only and
 * there is no Android app, so the store badges say "בקרוב" and link nowhere.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { prefersReducedMotion } from '../v5/motion';
import { Wordmark } from '../v5/ui';
import { CTA_SIGNUP, CTA_NOTE } from '../v5/content';

export const UI = '/landing-v8/ui';
export const PH = '/landing-v8/ph';
export const HERO_IMG = '/landing-hero';
export const T9 = '/landing-t9';

/* ---------- copy (the live page's approved lines, plus short labels) ---------- */
export const H1 = ['אומרים.', 'atlas מכין.'];
export const SUB = 'מערכת הניהול לצימרים, עם עוזר קולי בעברית. אומרים מה צריך, atlas מכין את ההזמנה או את ההודעה לאורח, ואתם מאשרים בלחיצה.';
export const NOTE = `${CTA_NOTE} · לא יורד שקל בסוף הניסיון`;
export const NAV = [['#voice', 'העוזר הקולי'], ['#features', 'המוצר'], ['#how', 'איך מתחילים'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

export const FEATURES = [
  { id: 'calendar', k: 'לוח שנה', t: 'כל הערוצים. לוח אחד.', d: 'Booking, Airbnb והזמנות ישירות על לוח אחד. atlas מתריע לפני שרושמים הזמנה על לילה תפוס.', img: `${UI}/y3-cal.webp`, w: 2182, h: 934, alt: 'לוח השנה של atlas: ארבע יחידות, הזמנות מכל הערוצים על ציר אחד (נתוני דוגמה)' },
  { id: 'messages', k: 'הודעות', t: 'וואטסאפ לאורחים. מוכן מראש.', d: 'atlas מכין כל הודעה בזמן. אתם שולחים בלחיצה, מהוואטסאפ שלכם.', img: `${UI}/y3-next.webp`, w: 676, h: 304, alt: 'כרטיס ״הדבר הבא״ במסך היום של atlas: הודעת ״ברוכים הבאים״ למיכל לוי מוכנה לשליחה (נתוני דוגמה)' },
  { id: 'payments', k: 'תשלומים', t: 'הכסף בשליטה. רואים הכל.', d: 'רושמים כל מקדמה ויתרה בלחיצה, ורואים מה פתוח ומה נכנס החודש.', img: `${UI}/y3-money.webp`, w: 676, h: 340, alt: 'כרטיסי הכסף במסך היום של atlas: כמה נכנס החודש וכמה ממתין לתשלום (נתוני דוגמה)' },
  { id: 'today', k: 'היום', t: 'היום שלכם, מסודר מראש.', d: 'כניסות, יציאות וניקיונות ברשימה אחת. מסמנים ״בוצע״ בלחיצה.', img: `${UI}/y3-today.webp`, w: 676, h: 1038, alt: 'מסך היום של atlas: מי מגיע ומי יוצא היום, בכל יחידה (נתוני דוגמה)' },
];

/** How it starts: three real steps (onboarding asks one question at a time; channel links pasted once). */
export const STEPS3 = [
  { n: '01', t: 'מחברים את Booking ו-Airbnb', d: 'מדביקים את קישור היומן מכל ערוץ, פעם אחת. התאריכים התפוסים נכנסים ללוח בערך כל 15 דקות.' },
  { n: '02', t: 'מוסיפים את היחידות', d: 'atlas שואל שאלה אחת בכל פעם, בעברית פשוטה. תוך כמה דקות הלוח שלכם מוכן.' },
  { n: '03', t: 'אומרים מה צריך', d: 'הזמנה חדשה, הודעה לאורח, מי עוד חייב. atlas מכין, ואתם מאשרים בלחיצה.' },
];

/** Real facts only (pricing.js, content.js, support hours decided by Deen). No customer counts. */
export const FACTS = [
  { v: 14, suf: '', l: 'ימי ניסיון, הכל פתוח', s: 'בלי כרטיס אשראי' },
  { v: 24, suf: '/7', l: 'בן אדם עונה בוואטסאפ', s: 'גם בשבת ובאמצע הלילה' },
  { v: 15, pre: '~', suf: ' דק׳', l: 'הלוח מתעדכן מהערוצים', s: 'Booking ו-Airbnb' },
];

export const BEFORE = ['הזמנות מ-Booking, מ-Airbnb ומהטלפון, כל אחת במקום אחר', 'מקלידים כל הודעה לאורח מחדש', 'מחפשים בסוף החודש מי עוד חייב', 'זוכרים בראש מי מגיע ומתי מנקים'];
export const AFTER = ['לוח אחד לכל הערוצים, מתעדכן בערך כל 15 דקות', 'אומרים מה צריך, atlas מכין ואתם מאשרים', 'רואים מה שולם ומה עוד פתוח', 'מסך ״היום״: כניסות, יציאות וניקיון ברשימה אחת'];

export const CHANNELS = [['airbnb', 'Airbnb'], ['booking', 'Booking.com'], ['whatsapp', 'WhatsApp'], ['google', 'Google Calendar']];

/* ---------- motion helpers ---------- */
export const rm = () => typeof window === 'undefined' || prefersReducedMotion();

/** Entrance reveal for [data-r] (and the reused parts' [data-reveal]) inside root (fade + rise + de-blur), once. */
export function useT9Reveal(root) {
  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const els = [...el.querySelectorAll('[data-r], [data-reveal]')]; // [data-reveal]: the reused pricing / FAQ
    if (rm() || typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('is-in')); return undefined; }
    el.classList.add('t9-anim');
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [root]);
}

/**
 * Scroll progress written as --p (0..1) on every [data-scrub] element under root.
 * data-scrub="view": from the element's top at the viewport bottom to its bottom at the viewport top.
 * data-scrub="pin":  through a tall section whose child is sticky (top at viewport top → bottom at viewport bottom).
 * data-scrub="enter": from top at viewport bottom to top at 25% of the viewport (entrance scrubs).
 * data-scrub="leave": 0 while the element's top sits at the viewport top, 1 after 60% of it scrolled away (heroes).
 * Optional onStep(el, p) via data-steps="n": also sets data-step on the element. Reduced motion: --p = 1.
 */
export function useScrub(root) {
  useEffect(() => {
    const host = root.current;
    if (!host) return undefined;
    const els = [...host.querySelectorAll('[data-scrub]')];
    if (rm()) { els.forEach((e) => { e.style.setProperty('--p', '1'); if (e.dataset.steps) e.dataset.step = String(Number(e.dataset.steps) - 1); }); return undefined; }
    let raf = 0;
    const last = new Map();
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const e of els) {
        const r = e.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const mode = e.dataset.scrub;
        let p;
        if (mode === 'pin') p = (-r.top) / Math.max(1, r.height - vh);
        else if (mode === 'enter') p = (vh - r.top) / (vh * 0.75);
        else if (mode === 'leave') p = (-r.top) / (r.height * 0.6);
        else p = (vh - r.top) / (vh + r.height);
        p = Math.min(1, Math.max(0, p));
        const v = p.toFixed(4);
        if (last.get(e) === v) continue;
        last.set(e, v);
        e.style.setProperty('--p', v);
        if (e.dataset.steps) {
          const n = Number(e.dataset.steps);
          const s = String(Math.min(n - 1, Math.floor(p * n * 0.999)));
          if (e.dataset.step !== s) e.dataset.step = s;
        }
      }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [root]);
}

/** True after the page scrolled past `y` px (header shadow, dock). */
export function useScrolled(y = 24) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > y);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [y]);
  return s;
}

/** Scroll-spy: the id of the NAV section currently in view. */
export function useSpy(ids) {
  const [cur, setCur] = useState('');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const els = ids.map((i) => document.getElementById(i)).filter(Boolean);
    const io = new IntersectionObserver((en) => { en.forEach((e) => { if (e.isIntersecting) setCur(e.target.id); }); }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return cur;
}

/** Number that counts up once when it scrolls into view (renders the final value on the server). */
export function Count({ to, pre = '', suf = '', ms = 1200 }) {
  const ref = useRef(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || rm() || typeof IntersectionObserver === 'undefined') return undefined;
    setV(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      // count when it comes into view; if a fast scroll already carried it past, just show the value
      if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
      io.disconnect();
      if (!e.isIntersecting) { setV(to); return; }
      const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / ms); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.15 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, ms]);
  return <span ref={ref} className="num" dir="ltr">{pre}{v}{suf}</span>;
}

/** A line of words that light up one by one with --p of the nearest [data-scrub] ancestor. */
export function Words({ text, className = '', start = 0, total }) {
  const words = text.split(' ');
  const n = total || words.length;
  return (
    <span className={`t9-words ${className}`}>
      {words.map((w, i) => <React.Fragment key={i}>{i > 0 && ' '}<span className="t9-w" style={{ '--i': start + i, '--n': n }}>{w}</span></React.Fragment>)}
    </span>
  );
}

/* ---------- shared pieces ---------- */
export function Logo({ white = false }) {
  return <Link to="/" className={`t9-logo${white ? ' is-white' : ''}`} aria-label="atlas, לדף הבית"><Wordmark /></Link>;
}

export function Cta({ className = '', children = CTA_SIGNUP, to = '/register' }) {
  return (
    <Link to={to} className={`t9-btn ${className}`}>
      <span>{children}</span>
      <i className="t9-btn-ar" aria-hidden="true"><ArrowLeft size={18} strokeWidth={2.2} /></i>
    </Link>
  );
}

export function Ghost({ href = '#voice', children = 'איך זה עובד', className = '' }) {
  return (
    <a href={href} className={`t9-ghost ${className}`}>
      <span>{children}</span>
      <i className="t9-btn-ar" aria-hidden="true"><ArrowLeft size={18} strokeWidth={2.2} /></i>
    </a>
  );
}

/**
 * The official App Store and Google Play badges (Hebrew), unmodified artwork. The iOS app is on TestFlight only
 * and there is no Android app yet, so each badge carries a "בקרוב" tag and is NOT a link.
 */
export function StoreBadges({ dark = false, className = '' }) {
  return (
    <div className={`t9-stores ${className}`} role="group" aria-label="האפליקציה בחנויות: בקרוב">
      <span className="t9-store">
        <img src={`${T9}/app-store-he-${dark ? 'white' : 'black'}.svg`} alt="App Store" width="122" height="42" loading="lazy" decoding="async" />
        <em>בקרוב</em>
      </span>
      <span className="t9-store">
        <img src={`${T9}/google-play-he.png`} alt="Google Play" width="141" height="42" loading="lazy" decoding="async" />
        <em>בקרוב</em>
      </span>
    </div>
  );
}

/** Desktop browser frame with the real home screen (Y3, example data). */
export function DeskShot({ className = '', eager = false }) {
  return (
    <div className={`t9-win ${className}`}>
      <div className="t9-win-bar" aria-hidden="true"><i /><i /><i /><span dir="ltr">atlas-il.com/today</span></div>
      <img src={`${HERO_IMG}/ui-d-today-y3-1600.webp`} srcSet={`${HERO_IMG}/ui-d-today-y3-1200.webp 1200w, ${HERO_IMG}/ui-d-today-y3-1600.webp 1600w, ${HERO_IMG}/ui-d-today-y3-2080.webp 2080w`} sizes="min(1180px, 94vw)" alt="מסך הבית של atlas, נתוני דוגמה" width="2400" height="1500" loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </div>
  );
}

/** Phone frame with one or more real screens (cross-fade by `active`). */
export function Phone({ screens, active = 0, className = '', label, eager = false }) {
  return (
    <div className={`t9-phone ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
      <div className="t9-phone-scr">
        <span className="t9-phone-isl" />
        {screens.map((s, i) => <img key={s} src={s} alt="" width="390" height="844" loading={eager && i === 0 ? 'eager' : 'lazy'} decoding="async" className={i === active ? 'is-on' : ''} />)}
      </div>
    </div>
  );
}

export const SCREENS = {
  today: `${HERO_IMG}/ui-m-today-y3.webp`,
  say: '/landing-voice/vs-say-600.webp',
  card: '/landing-voice/vs-card-600.webp',
  saved: '/landing-voice/vs-saved-600.webp',
};

/** Sticky sign-up bar on phones: after the hero, hidden at pricing / final CTA / footer. */
export function useAfterHero(heroSel, endSel) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const hero = document.querySelector(heroSel);
    const ends = [...document.querySelectorAll(endSel)];
    if (!hero || typeof IntersectionObserver === 'undefined') return undefined;
    let heroIn = true; const endIn = new Set();
    const io = new IntersectionObserver((en) => {
      for (const e of en) { if (e.target === hero) heroIn = e.isIntersecting; else if (e.isIntersecting) endIn.add(e.target); else endIn.delete(e.target); }
      setOn(!heroIn && endIn.size === 0);
    });
    io.observe(hero); ends.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [heroSel, endSel]);
  return on;
}

export function Credits() {
  return <p className="t9-credits">צילומים אמיתיים: Pexels (רישיון חופשי). השמות וההזמנות במסכים הם דוגמה להמחשה, לא לקוחות. המסכים הם מסכי atlas אמיתיים עם נתוני דוגמה.</p>;
}
