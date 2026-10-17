/**
 * Landing v9 shared parts (Q "מהמתחם למסך", R "מילים שעובדות", S "יום במתחם").
 *
 * Product imagery = real ATLAS app screens (v8 C, the bento command center that ships), captured at 2x
 * in local demo mode: desktop 1440×900 and the C mobile views at 390×844 (public/landing-v9/ui).
 * Photos = free-licence Pexels / Unsplash photos, cool daylight (public/landing-v9/ph, CREDITS.md).
 * Every name, booking and amount on the page is example data from the demo workspace and is labelled
 * as such. No testimonials, logos of customers, customer counts or star ratings.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CheckCheck, MessageCircle, MapPin, ShieldCheck, Plus, ChevronLeft } from 'lucide-react';
import { PRICING_PLANS } from '@/config/pricing';
import { prefersReducedMotion, fmt } from '../v5/motion';
import { Mark, Wordmark } from '../v5/ui';
import { FAQ, WHATSAPP_URL, PHONE_DISPLAY, CTA_SIGNUP, CTA_NOTE } from '../v5/content';

export const UI = '/landing-v9/ui';
export const PH = '/landing-v9/ph';

/** Example guests (names belong to example bookings in the demo workspace, never testimonials). */
export const FACES = {
  noa: `${PH}/f-noa.webp`,
  maya: `${PH}/f-maya.webp`,
  tom: `${PH}/f-tom.webp`,
  shir: `${PH}/f-shir.webp`,
  ben: `${PH}/f-ben.webp`,
  yossi: `${PH}/f-yossi.webp`,
  adam: `${PH}/f-adam.webp`,
  eli: `${PH}/f-eli.webp`,
};

export function Face({ k, size = 40, className = '', eager = false }) {
  return (
    <img
      className={`n9-face ${className}`}
      src={FACES[k]}
      alt=""
      width={size}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{ '--s': `${size}px` }}
    />
  );
}

export function Faces({ keys, size = 32, className = '' }) {
  return (
    <span className={`n9-faces ${className}`} aria-hidden="true">
      {keys.map((k) => <Face key={k} k={k} size={size} />)}
    </span>
  );
}

/* ---------------- buttons ---------------- */
export function SignupBtn({ plan, className = '', children = CTA_SIGNUP }) {
  return (
    <Link to={plan ? `/register?plan=${plan}` : '/register'} className={`n9-btn ${className}`}>
      <span>{children}</span>
      <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" className="n9-btn-ar" />
    </Link>
  );
}

export function CtaNote({ className = '' }) {
  return (
    <p className={`n9-note ${className}`}>
      <Check size={15} strokeWidth={2.6} aria-hidden="true" />
      {CTA_NOTE} · הגדרה תוך 10 דקות
    </p>
  );
}

/* ---------------- header ---------------- */
/**
 * tone: 'light' (white page) or 'glass' (over a photo: white glass pill that turns solid once scrolled).
 */
export function Header9({ nav, tone = 'light' }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`n9-hdr is-${tone}${scrolled ? ' is-scrolled' : ''}`}>
      <div className="n9-hdr-in">
        <Link to="/" className="n9-logo" aria-label="ATLAS, לדף הבית"><Wordmark /></Link>
        <nav className="n9-nav" aria-label="ניווט ראשי">
          {nav.map(([h, t]) => <a key={h} href={h}>{t}</a>)}
        </nav>
        <div className="n9-hdr-end">
          <Link to="/login" className="n9-login">כניסה</Link>
          <Link to="/register" className="n9-btn is-sm">להתחיל חינם</Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- device frames (real screens inside) ---------------- */
/** Light browser window around a real desktop capture (2400×1500 webp of a 1440×900 screen). */
export function Browser({ src, url = 'app.atlas-il.com', className = '', eager = false, children, imgRef, alt = '' }) {
  return (
    <div className={`n9-win ${className}`}>
      <div className="n9-win-bar" aria-hidden="true">
        <i /><i /><i />
        <span dir="ltr">{url}</span>
      </div>
      <div className="n9-win-shot">
        <img ref={imgRef} src={src} alt={alt} width="2400" height="1500" loading={eager ? 'eager' : 'lazy'} decoding="async" />
        {children}
      </div>
    </div>
  );
}

/** iPhone-proportioned frame; `screens` cross-fade by `active`. Screens are 780×1594 captures (390×797 @2x: an 844pt phone minus its 47pt status bar). */
export function Phone({ screens, active = 0, className = '', eager = false, label, children, imgRef }) {
  return (
    <div className={`n9-ph ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
      <div className="n9-ph-scr">
        <span className="n9-ph-status"><span className="num" dir="ltr">9:41</span><span className="n9-ph-island" /><i className="n9-ph-bat" /></span>
        {screens.map((s, i) => (
          <img
            key={s}
            ref={i === 0 ? imgRef : undefined}
            src={s}
            alt=""
            width="780"
            height="1594"
            loading={eager === 'all' || (eager && i === 0) ? 'eager' : 'lazy'}
            decoding="async"
            className={i === active ? 'is-on' : ''}
          />
        ))}
        {children}
      </div>
    </div>
  );
}

/* ---------------- notification card ---------------- */
/** iOS-like notification: icon (channel mark or face), title, one line, time. Example data. */
export function Notif({ ch, face, title, sub, time, className = '', style }) {
  return (
    <div className={`n9-ntf ${className}`} style={style}>
      <span className="n9-ntf-ic" aria-hidden="true">
        {face ? <Face k={face} size={40} eager /> : <span className={`n9-ntf-mk is-${ch}`}><Mark ch={ch} size={ch === 'booking' || ch === 'direct' ? 22 : 20} /></span>}
      </span>
      <span className="n9-ntf-tx">
        <b>{title}</b>
        <small>{sub}</small>
      </span>
      {time && <span className="n9-ntf-t num" dir="ltr">{time}</span>}
    </div>
  );
}

/** WhatsApp bubble with the real text the demo app sends (example guest). */
export function WaBubble({ who = 'משפחת לוי', text = 'שלום משפחת לוי, ההזמנה שלכם בצימר הזית מאושרת ל-16-19 באוקטובר. נשמח לראותכם!', time = '09:00', className = '' }) {
  return (
    <div className={`n9-wa ${className}`}>
      <p className="n9-wa-top"><span className="n9-wa-ic"><Mark ch="whatsapp" size={15} /></span><b>{who}</b><small>וואטסאפ</small></p>
      <p className="n9-wa-msg">{text}<span className="n9-wa-meta"><span className="num" dir="ltr">{time}</span><CheckCheck size={14} strokeWidth={2.4} aria-hidden="true" /></span></p>
    </div>
  );
}

/* ---------------- hooks ---------------- */
/**
 * Progress (0..1) of a tall sticky section: 0 when its top reaches the top of the viewport, 1 when its
 * bottom reaches the bottom. Calls onProgress(p) once per animation frame. Off under reduced motion.
 */
export function useStickyProgress(ref, onProgress, enabled = true) {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || prefersReducedMotion()) return undefined;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
      cb.current(p);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [ref, enabled]);
}

/** Cycles 0..n-1 every `ms` while `active` (paused for reduced motion, hidden tab, or once the user took over). */
export function useCycle(n, ms = 3200, active = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active || prefersReducedMotion()) return undefined;
    const t = window.setInterval(() => { if (!document.hidden) setI((v) => (v + 1) % n); }, ms);
    return () => window.clearInterval(t);
  }, [n, ms, active]);
  return [i, setI];
}

/** Adds .is-in to [data-reveal] children once visible (fade-up). Everything visible under reduced motion. */
export function useReveal9(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const els = [...root.querySelectorAll('[data-reveal]')];
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return undefined;
    root.classList.add('n9-rv-on');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

export const reduced = prefersReducedMotion;

/* ---------------- pricing ---------------- */
const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנתה בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

export function Pricing9({ title = 'מחיר פשוט. 14 יום עלינו.', className = '' }) {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className={`n9-sec n9-pr ${className}`} aria-labelledby="pricing-title">
      <div className="n9-wrap">
        <div className="n9-head is-center" data-reveal>
          <h2 id="pricing-title" className="n9-h2">{title}</h2>
          <p className="n9-lead">כל מסלול מתחיל בניסיון חינם עם כל המערכת. בוחרים לפי מספר הנכסים.</p>
        </div>
        <div className="n9-seg" role="group" aria-label="תקופת חיוב" data-reveal>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי · חוסכים 20%</button>
        </div>
        <ul className="n9-plans" data-reveal>
          {PRICING_PLANS.map((p) => (
            <li key={p.key} className={`n9-plan${p.popular ? ' is-pop' : ''}`}>
              <div className="n9-plan-top">
                <h3>{p.nameHe}</h3>
                {p.popular && <span className="n9-tag">הכי פופולרי</span>}
              </div>
              <p className="n9-plan-desc">{p.desc}</p>
              <p className="n9-plan-price">
                <b className="num" dir="ltr">₪{fmt(yearly ? p.priceYearly : p.price)}</b>
                <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
              </p>
              <SignupBtn plan={p.key} className={`is-block${p.popular ? ' is-white' : ' is-soft'}`} />
              <ul className="n9-plan-feat">
                {p.features.map((f) => <li key={f}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{f}</li>)}
              </ul>
            </li>
          ))}
        </ul>
        <ul className="n9-trust" data-reveal>
          {TRUST.map(({ I, t }) => <li key={t}><I size={18} strokeWidth={1.8} aria-hidden="true" />{t}</li>)}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
export function Faq9({ limit = 5, className = '' }) {
  return (
    <section id="faq" className={`n9-sec n9-faq ${className}`} aria-labelledby="faq-title">
      <div className="n9-wrap n9-faq-grid">
        <div className="n9-faq-side" data-reveal>
          <h2 id="faq-title" className="n9-h2">שאלות נפוצות</h2>
          <p className="n9-lead">לא מצאתם תשובה? כותבים לנו, ואדם עונה.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="n9-wa-link">
            <Mark ch="whatsapp" size={18} />
            וואטסאפ <span dir="ltr" className="num">{PHONE_DISPLAY}</span>
            <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          </a>
        </div>
        <div className="n9-faq-list" data-reveal>
          {FAQ.slice(0, limit).map((f) => (
            <details key={f.q}>
              <summary>
                <span>{f.q}</span>
                <span className="n9-plus" aria-hidden="true"><Plus size={18} strokeWidth={2.2} /></span>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */
export function Footer9() {
  return (
    <footer className="n9-ftr">
      <div className="n9-wrap n9-ftr-in">
        <Wordmark small />
        <nav aria-label="קישורים משפטיים" className="n9-ftr-links">
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאי שימוש</Link>
          <Link to="/accessibility">נגישות</Link>
          <Link to="/data-security">אבטחת מידע</Link>
          <Link to="/login">כניסה</Link>
        </nav>
        <p className="n9-ftr-copy">© {new Date().getFullYear()} ATLAS · נבנתה בישראל</p>
      </div>
      <p className="n9-credits">צילומים: Pexels, Unsplash (רישיון חופשי). המסכים הם מסכי ATLAS אמיתיים עם נתוני דוגמה.</p>
    </footer>
  );
}

export function WaLink({ className = '' }) {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`n9-txtlink ${className}`}>
      <Mark ch="whatsapp" size={18} />שאלה? כתבו לנו
    </a>
  );
}
