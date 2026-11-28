/**
 * /early waitlist v5 (Deen, 28.11.2026: "WAITLIST page for the atlas app and system. Blend of the Numa and Ofek
 * look. Must look like $10M. Exciting, creates strong FOMO to sign up.")
 *
 * Two versions, ?v=a | ?v=b (default a):
 *   A "לילה"  numa-led: night hero with stars, phone in a glowing arch, glass cards at depths, ofek's glass mic tile
 *             inside the headline and the conic-ring CTA; canvas sheet rises with a word-by-word lit sentence; pinned
 *             voice demo (big word rolls אומרים → atlas מכין → מאשרים while the phone swaps real screens); phone + web
 *             in an ofek landscape frame; the offer on navy with 50 seats; form; night footer with a giant logo on a horizon.
 *   B "אופק"  ofek-led: Galilee landscape in an inset rounded frame, thin oversized headline with the mic tile, the
 *             FORM right in the hero (offer-first), web + phone rise over the frame edge, channel marquee, a numa night
 *             block for the voice demo with karaoke lines, the offer, footer card floating over the landscape.
 *
 * Truth rules (same as the live page and /): the assistant PREPARES and the owner's tap saves; WhatsApp opens ready in
 * the owner's own WhatsApp and the owner sends it in one tap; Booking / Airbnb dates come in about every 15 minutes;
 * no receipts, invoices, push or instant claims; no counts, testimonials or "joined today". The iOS app is waiting
 * for Apple's review: the App Store badge says "בקרוב" and links nowhere. Spots left is shown ONLY when the DB
 * returns it (migration 039 + VITE_WAITLIST_RPC=1, not applied); otherwise the page says "50 מקומות".
 * Every screen is a real atlas screen with example data; photos are real free-licence photos (public/early-v5/CREDITS.md).
 * Signups: src/features/early/submit.js, unchanged (contact_messages, source 'waitlist', subject waitlist:early:v5a|v5b).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, CalendarCheck, MessageCircle, Check, Smartphone, Monitor, Wrench, Lock, Gift } from 'lucide-react';
import { PRICING_PLANS, TRIAL_DAYS } from '@/config/pricing';
import { FOUNDING_SPOTS, joinWaitlist, fetchSpotsLeft } from '@/features/early/submit';
import { prefersReducedMotion } from '@/components/landing/v5/motion';
import './early-v5.css';

const SITE = 'https://atlas-il.com/early';
const IMG = '/early-v5';
const fmt = (n) => `₪${n.toLocaleString('he-IL')}`;
const A = () => <span dir="ltr" className="e5-atlas">atlas</span>;
const rm = () => typeof window === 'undefined' || prefersReducedMotion();

const UNIT_OPTIONS = [
  { v: '1', label: 'יחידה אחת' },
  { v: '2-3', label: '2 עד 3' },
  { v: '4-6', label: '4 עד 6' },
  { v: '7+', label: '7 ומעלה' },
];

/** The three real AssistantScreen stills (example data), same files as the live voice stage. */
const STAGE = [
  { img: 'say', w: 'אומרים', t: 'אומרים מה צריך', d: 'במילים שלכם, בעברית. בלי טפסים ובלי להקליד.', alt: 'העוזר הקולי באפליקציה של atlas: בעל המתחם אמר ״תוסיף לי הזמנה לצימר מיום חמישי לסופ״ש ליוסי ב-3,500 ש״ח״ (נתוני דוגמה)' },
  { img: 'card', w: 'atlas מכין', t: 'atlas מכין', d: 'בודק שהיחידה פנויה ומכין את ההזמנה לאישור.', alt: 'כרטיס הזמנה חדשה שמחכה לאישור: צימר הזית, יום ה׳ 12.11 עד יום ש׳ 14.11, ‏₪3,500 (נתוני דוגמה)' },
  { img: 'saved', w: 'מאשרים', t: 'מאשרים בלחיצה', d: 'רק אחרי האישור שלכם ההזמנה נשמרת בלוח.', alt: 'אחרי האישור: ההזמנה נשמרה ומופיעה בלוח (נתוני דוגמה)' },
];

/* ---------------- hooks ---------------- */

function useMeta() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'atlas · 50 המקומות הראשונים לבעלי צימרים';
    let robots = document.querySelector('meta[name="robots"]');
    const prevRobots = robots?.getAttribute('content');
    if (!robots) { robots = document.createElement('meta'); robots.setAttribute('name', 'robots'); document.head.appendChild(robots); }
    robots.setAttribute('content', 'noindex,follow');
    document.documentElement.classList.add('e5-html');
    return () => {
      document.title = prev;
      if (prevRobots) robots.setAttribute('content', prevRobots);
      document.documentElement.classList.remove('e5-html');
    };
  }, []);
}

/** [data-r] fade + rise + de-blur once on enter. Reduced motion: shown at once. */
function useReveal(root) {
  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const els = [...el.querySelectorAll('[data-r]')];
    if (rm() || typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('is-in')); return undefined; }
    el.classList.add('e5-anim');
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [root]);
}

/**
 * Scroll progress as --p (0..1) on [data-scrub]: "pin" (tall section with a sticky child), "enter" (top at the
 * viewport bottom → 30% from the top), "leave" (hero scrolling away). data-steps="n" also sets data-step.
 * Reduced motion: no scrubbed motion (CSS ignores --p), but pinned steps still follow the scroll.
 */
function useScrub(root) {
  useEffect(() => {
    const host = root.current;
    if (!host) return undefined;
    const els = [...host.querySelectorAll('[data-scrub]')];
    let raf = 0;
    const last = new Map();
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const e of els) {
        const r = e.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const m = e.dataset.scrub;
        let p;
        if (m === 'pin') p = (-r.top) / Math.max(1, r.height - vh);
        else if (m === 'enter') p = (vh - r.top) / (vh * 0.7);
        else if (m === 'leave') p = (-r.top) / Math.max(1, r.height * 0.7);
        else p = (vh - r.top) / (vh + r.height);
        p = Math.min(1, Math.max(0, p));
        const v = p.toFixed(3);
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

function useScrolled(y = 24) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > y);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [y]);
  return s;
}

function useSpy(ids) {
  const [cur, setCur] = useState(ids[0]);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const els = ids.map((i) => document.getElementById(i)).filter(Boolean);
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) setCur(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return cur;
}

/** Cycles 0..n-1 every ms while the element is on screen (reduced motion: stays on the last frame). */
function useCycle(ref, n, ms = 2600) {
  const [i, setI] = useState(rm() ? n - 1 : 0);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || rm() || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((en) => setOn(en[en.length - 1].isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  useEffect(() => {
    if (!on) return undefined;
    const t = window.setTimeout(() => setI((c) => (c + 1) % n), ms);
    return () => window.clearTimeout(t);
  }, [on, i, n, ms]);
  return i;
}

function goJoin() {
  const el = document.getElementById('join');
  if (!el) return;
  const reduce = rm();
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('e5-name')?.focus({ preventScroll: true }), reduce ? 0 : 700);
}

/* ---------------- small parts ---------------- */

function Logo({ tone = 'white', w = 84, cls = '' }) {
  return <img src={`/atlas-logo-${tone}.svg`} alt="atlas" width={w} height={Math.round(w * 0.31)} className={`e5-logo ${cls}`} style={{ width: w, height: 'auto' }} />;
}

function MicTile() {
  return <span className="e5-tile" aria-hidden="true"><Mic strokeWidth={2.2} /></span>;
}

function H1({ cls = '' }) {
  return (
    <h1 className={`e5-h1 ${cls}`}>
      <span className="e5-h1-l">אומרים.<MicTile /></span>
      <span className="e5-h1-l"><A /> מכין.</span>
    </h1>
  );
}

const SUB = 'מערכת הניהול לצימרים, עם עוזר קולי בעברית. אומרים מה צריך, atlas מכין את ההזמנה או את ההודעה לאורח, ואתם מאשרים בלחיצה.';
function Sub({ cls = '' }) {
  const [a, b] = SUB.split('atlas');
  return <p className={`e5-sub ${cls}`}>{a}<A />{b}</p>;
}

function Eyebrow({ spotsLeft, light }) {
  return (
    <p className={`e5-eyebrow ${light ? 'is-light' : ''}`}>
      <span className="e5-live" aria-hidden="true" />
      רשימת ההמתנה פתוחה
      <span className="e5-sep" aria-hidden="true" />
      {typeof spotsLeft === 'number' ? `נשארו ${spotsLeft} מקומות מייסדים` : `${FOUNDING_SPOTS} מקומות מייסדים`}
    </p>
  );
}

function GlowCta({ children = 'שמרו לי מקום', onClick, light, cls = '' }) {
  return (
    <button type="button" className={`e5-glow ${light ? 'is-light' : ''} ${cls}`} onClick={onClick}>
      <span className="e5-glow-in">
        <span>{children}</span>
        <span className="e5-glow-chip" aria-hidden="true"><ArrowLeft size={18} strokeWidth={2.4} /></span>
      </span>
    </button>
  );
}

function Platforms({ light }) {
  return (
    <div className={`e5-plat ${light ? 'is-light' : ''}`}>
      <span className="e5-badge">
        <img src={`${IMG}/app-store-he-${light ? 'black' : 'white'}.svg`} alt="הורדה ב-App Store" width="120" height="40" />
        <em>בקרוב</em>
      </span>
      <span className="e5-web"><Monitor size={18} strokeWidth={2} aria-hidden="true" />וגם מכל מחשב, בדפדפן</span>
    </div>
  );
}

/** CSS phone with real screens. frames: array of {src, srcSet, alt}; cur: index shown. */
function Phone({ frames, cur = 0, cls = '', sizes = '300px', eager }) {
  return (
    <div className={`e5-phone ${cls}`}>
      <i className="e5-island" aria-hidden="true" />
      <div className="e5-scr">
        {frames.map((f, i) => (
          <img key={f.src} className={i === cur ? 'is-on' : ''} aria-hidden={i === cur ? undefined : 'true'} src={f.src} srcSet={f.srcSet} sizes={sizes} alt={f.alt} width={f.w || 600} height={f.h || 1067} loading={eager && i === 0 ? 'eager' : 'lazy'} decoding="async" fetchpriority={eager && i === 0 ? 'high' : undefined} />
        ))}
      </div>
    </div>
  );
}

const VOICE_FRAMES = STAGE.map((s) => ({ src: `/landing-voice/vs-${s.img}-600.webp`, srcSet: `/landing-voice/vs-${s.img}-300.webp 300w, /landing-voice/vs-${s.img}-600.webp 600w`, alt: s.alt }));
const TODAY_FRAME = [{ src: '/landing-hero/ui-m-today-y3-540.webp', srcSet: '/landing-hero/ui-m-today-y3-540.webp 540w, /landing-hero/ui-m-today-y3.webp 780w', w: 540, h: 1169, alt: 'מסך ״היום״ באפליקציה של atlas: בוקר טוב, מי מגיע היום, כמה נכנס החודש ומה ממתין לתשלום (נתוני דוגמה)' }];

/** Glass cards around the hero phone: the real voice flow, example data. */
const FLOATS = [
  { k: 'אמרתם', t: '״הזמנה ליוסי לסופ״ש, 3,500״', I: Mic, cls: 'f1' },
  { k: 'atlas בדק', t: 'צימר הזית פנוי ביום ה׳ עד ש׳', I: CalendarCheck, cls: 'f2' },
  { k: 'מוכן לשליחה בלחיצה', t: 'הודעת אישור ליוסי בוואטסאפ', I: MessageCircle, cls: 'f3' },
  { k: 'אחרי האישור שלכם', t: 'ההזמנה נשמרה בלוח', I: Check, cls: 'f4' },
];
function Floats() {
  return (
    <div className="e5-floats" aria-hidden="true">
      {FLOATS.map(({ k, t, I, cls }) => (
        <span key={cls} className={`e5-float ${cls}`}>
          <span className="e5-float-i"><I size={16} strokeWidth={2.4} /></span>
          <span className="e5-float-t"><small>{k.includes('atlas') ? <><A />{k.replace('atlas', '')}</> : k}</small><b>{t}</b></span>
        </span>
      ))}
    </div>
  );
}

/* ---------------- headers ---------------- */

const NAV = [['voice', 'העוזר הקולי'], ['where', 'אייפון ומחשב'], ['offer', 'ההצעה'], ['faq', 'שאלות']];

function HeaderA({ onCta }) {
  const scrolled = useScrolled(40);
  const cur = useSpy(NAV.map((n) => n[0]));
  const idx = Math.max(0, NAV.findIndex((n) => n[0] === cur));
  return (
    <header className={`e5-hdr e5-hdr-a ${scrolled ? 'is-scrolled' : ''}`}>
      <a href="#top" className="e5-hdr-logo" aria-label="atlas, לראש העמוד"><Logo w={78} /></a>
      <nav className="e5-seg" aria-label="ניווט בעמוד" style={{ '--i': idx }}>
        <span className="e5-seg-pill" aria-hidden="true" />
        {NAV.map(([id, l]) => <a key={id} href={`#${id}`} aria-current={cur === id ? 'true' : undefined}>{l}</a>)}
      </nav>
      <button type="button" className="e5-hdr-cta" onClick={onCta}>שמרו לי מקום</button>
    </header>
  );
}

function HeaderB({ onCta }) {
  const scrolled = useScrolled(40);
  const cur = useSpy(NAV.map((n) => n[0]));
  const idx = NAV.findIndex((n) => n[0] === cur);
  return (
    <header className={`e5-hdr e5-hdr-b ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="e5-hdr-b-in">
        <a href="#top" className="e5-hdr-logo" aria-label="atlas, לראש העמוד"><Logo tone="navy" w={78} /></a>
        <nav className="e5-ul" aria-label="ניווט בעמוד" style={{ '--i': Math.max(0, idx), '--on': idx >= 0 ? 1 : 0 }}>
          {NAV.map(([id, l]) => <a key={id} href={`#${id}`} aria-current={cur === id ? 'true' : undefined}>{l}</a>)}
          <span className="e5-ul-line" aria-hidden="true" />
        </nav>
        <button type="button" className="e5-hdr-cta dark" onClick={onCta}>
          <span>שמרו לי מקום</span>
          <span className="e5-hdr-chip" aria-hidden="true"><ArrowLeft size={16} strokeWidth={2.4} /></span>
        </button>
      </div>
    </header>
  );
}

/* ---------------- sections ---------------- */

function HeroA({ onCta, spotsLeft }) {
  const ref = useRef(null);
  const cur = useCycle(ref, 3, 2800);
  return (
    <section className="e5-hero-a" id="top" ref={ref} data-scrub="leave" aria-labelledby="e5-h1">
      <div className="e5-stars" aria-hidden="true" />
      <div className="e5-stars s2" aria-hidden="true" />
      <div className="e5-hero-a-copy">
        <div className="e5-in" style={{ '--d': 0 }}><Eyebrow spotsLeft={spotsLeft} /></div>
        <div className="e5-in" style={{ '--d': 1 }} id="e5-h1"><H1 /></div>
        <div className="e5-in" style={{ '--d': 2 }}><Sub /></div>
        <div className="e5-in e5-hero-cta" style={{ '--d': 3 }}>
          <GlowCta onClick={onCta} light />
          <p className="e5-note">בלי תשלום עכשיו · 30 שניות</p>
        </div>
        <div className="e5-in" style={{ '--d': 4 }}><Platforms /></div>
      </div>
      <div className="e5-arch e5-in" style={{ '--d': 3 }}>
        <span className="e5-arch-glow" aria-hidden="true" />
        <Phone frames={VOICE_FRAMES} cur={cur} cls="e5-arch-phone" sizes="(min-width: 900px) 300px, 220px" eager />
        <Floats />
      </div>
      <p className="e5-sample on-dark">מסכים אמיתיים מהאפליקציה · נתוני דוגמה</p>
    </section>
  );
}

const LIT = 'אתם אומרים מה צריך. atlas בודק שהיחידה פנויה, מכין את ההזמנה ואת ההודעה לאורח. אתם מאשרים, ורק אז זה נשמר.';
const LIT_ICON = { 'פנויה,': CalendarCheck, 'לאורח.': MessageCircle, 'מאשרים,': Check };
function LitSentence({ dark }) {
  const words = LIT.split(' ');
  return (
    <p className={`e5-lit ${dark ? 'is-dark' : ''}`} data-scrub="enter" style={{ '--n': words.length }}>
      {words.map((w, i) => {
        const I = LIT_ICON[w];
        return (
          <span key={`${w}-${i}`} className="e5-w" style={{ '--i': i }}>
            {w === 'atlas' ? <A /> : w}
            {I && <span className="e5-chip" aria-hidden="true"><I size={18} strokeWidth={2.4} /></span>}
            {' '}
          </span>
        );
      })}
    </p>
  );
}

function SheetA() {
  return (
    <section className="e5-sheet" aria-label="מה atlas עושה">
      <div className="e5-wrap"><LitSentence /></div>
    </section>
  );
}

/** Pinned: the phone swaps real screens per step, the big word rolls (numa's clock digits). */
function VoicePin({ dark }) {
  return (
    <section className={`e5-pin ${dark ? 'is-dark' : ''}`} id="voice" data-scrub="pin" data-steps="3" data-step="0" aria-labelledby="e5-voice-h">
      <div className="e5-pin-stick">
        <div className="e5-pin-grid">
          <div className="e5-pin-copy">
            <p className="e5-k"><Mic size={16} strokeWidth={2.4} aria-hidden="true" />העוזר הקולי</p>
            <h2 id="e5-voice-h" className="e5-h2">בלי טפסים. <span className="is-ind">בלי להקליד.</span></h2>
            <ol className="e5-steps">
              {STAGE.map((s, i) => (
                <li key={s.img} className={`e5-step st${i}`}>
                  <span className="e5-step-n" aria-hidden="true">0{i + 1}</span>
                  <span className="e5-step-b">
                    <b>{s.t.includes('atlas') ? <><A />{s.t.replace('atlas', '')}</> : s.t}</b>
                    <span>{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="e5-pin-stage">
            <div className="e5-roll" aria-hidden="true">
              <div className="e5-roll-in">
                {STAGE.map((s) => <span key={s.img}>{s.w.includes('atlas') ? <><A />{s.w.replace('atlas', '')}</> : s.w}</span>)}
              </div>
            </div>
            <div className="e5-pin-phone">
              {STAGE.map((s, i) => (
                <img key={s.img} className={`ph${i}`} src={`/landing-voice/vs-${s.img}-600.webp`} srcSet={`/landing-voice/vs-${s.img}-300.webp 300w, /landing-voice/vs-${s.img}-600.webp 600w`} sizes="(min-width: 900px) 320px, 230px" alt={s.alt} width="600" height="1067" loading="lazy" decoding="async" />
              ))}
              <i className="e5-island" aria-hidden="true" />
            </div>
            <p className="e5-sample">צילומי מסך מהאפליקציה · נתוני דוגמה</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Phone + web: the iOS app (waiting for Apple's review) and the full web system. */
function Where({ variant }) {
  return (
    <section className={`e5-where e5-where-${variant}`} id="where" aria-labelledby="e5-where-h">
      <div className="e5-wrap">
        <p className="e5-k" data-r><Smartphone size={16} strokeWidth={2.4} aria-hidden="true" />אפליקציה ומערכת</p>
        <h2 id="e5-where-h" className="e5-h2" data-r>בטלפון. במחשב. <span className="is-ind">אותו לוח.</span></h2>
        <p className="e5-lead" data-r>מה שאומרים לעוזר באייפון מופיע גם במחשב, ומה שמסדרים במחשב מחכה בטלפון.</p>
        <div className="e5-frame" data-r>
          <picture className="e5-frame-ph" aria-hidden="true">
            <source media="(max-width: 700px)" srcSet={`${IMG}/galil-p540.webp 540w, ${IMG}/galil-p900.webp 900w`} sizes="100vw" />
            <img src={`${IMG}/galil-1280.webp`} srcSet={`${IMG}/galil-1280.webp 1280w, ${IMG}/galil-1920.webp 1920w`} sizes="(min-width: 1200px) 1200px, 100vw" alt="" width="1280" height="720" loading="lazy" decoding="async" />
          </picture>
          <div className="e5-duo" data-scrub="view">
            <div className="e5-browser">
              <div className="e5-browser-bar" aria-hidden="true"><i /><i /><i /><span dir="ltr">atlas-il.com/today</span></div>
              <img src="/landing-hero/ui-d-today-y3-1600.webp" srcSet="/landing-hero/ui-d-today-y3-1200.webp 1200w, /landing-hero/ui-d-today-y3-1600.webp 1600w, /landing-hero/ui-d-today-y3-2080.webp 2080w" sizes="(min-width: 1200px) 860px, 88vw" alt="מערכת הניהול של atlas במחשב: מסך היום עם לוח שנה, הכנסות, מי מגיע היום והדבר הבא (נתוני דוגמה)" width="1600" height="1000" loading="lazy" decoding="async" />
            </div>
            <Phone frames={TODAY_FRAME} cls="e5-duo-phone" sizes="(min-width: 900px) 220px, 120px" />
          </div>
        </div>
        <div className="e5-where-cards">
          <article className="e5-wc" data-r>
            <span className="e5-wc-i" aria-hidden="true"><Smartphone size={22} strokeWidth={2} /></span>
            <h3>האפליקציה לאייפון</h3>
            <p>העוזר הקולי תמיד בכיס. האפליקציה כבר בבדיקה של Apple.</p>
            <span className="e5-badge sm"><img src={`${IMG}/app-store-he-black.svg`} alt="הורדה ב-App Store" width="108" height="36" /><em>בקרוב</em></span>
          </article>
          <article className="e5-wc" data-r>
            <span className="e5-wc-i" aria-hidden="true"><Monitor size={22} strokeWidth={2} /></span>
            <h3>המערכת המלאה, בדפדפן</h3>
            <p>לוח לכל היחידות, הזמנות, כסף והודעות. מכל מחשב, בלי להתקין.</p>
            <span className="e5-url" dir="ltr">atlas-il.com</span>
          </article>
        </div>
        <p className="e5-sample" data-r>מסכים אמיתיים · נתוני דוגמה · צילום נוף: הכנרת מהגליל</p>
      </div>
    </section>
  );
}

/** 50 seats. Filled seats ONLY when the DB returns a real number (migration 039); otherwise all 50 are just seats. */
function Seats({ spotsLeft }) {
  const taken = typeof spotsLeft === 'number' ? Math.max(0, FOUNDING_SPOTS - spotsLeft) : 0;
  return (
    <div className="e5-seats" aria-hidden="true">
      {Array.from({ length: FOUNDING_SPOTS }, (_, i) => <i key={i} className={i < taken ? 'is-taken' : ''} style={{ '--i': i }} />)}
    </div>
  );
}

function PriceRows() {
  return (
    <table className="e5-prices">
      <caption className="e5-vh">מחיר מייסדים לחודש לעומת המחיר הרגיל</caption>
      <thead className="e5-vh"><tr><th scope="col">מסלול</th><th scope="col">מחיר מייסדים לחודש</th><th scope="col">המחיר הרגיל</th></tr></thead>
      <tbody>
        {PRICING_PLANS.map((p) => (
          <tr key={p.key}>
            <th scope="row">{p.nameHe}<small>{p.limit}</small></th>
            <td className="now"><b>{fmt(p.priceYearly)}</b><small>לחודש</small></td>
            <td className="was"><s>{fmt(p.price)}</s></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Offer({ onCta, spotsLeft, light }) {
  return (
    <section className={`e5-offer ${light ? 'is-light' : ''}`} id="offer" aria-labelledby="e5-offer-h">
      <div className="e5-wrap">
        <div className="e5-offer-top">
          <div className="e5-offer-num" data-r aria-hidden="true">{typeof spotsLeft === 'number' ? spotsLeft : FOUNDING_SPOTS}</div>
          <div className="e5-offer-h">
            <p className="e5-k" data-r><span className="e5-live" aria-hidden="true" />לפני ההשקה</p>
            <h2 id="e5-offer-h" className="e5-h2" data-r>
              {typeof spotsLeft === 'number' ? `נשארו ${spotsLeft} מקומות מייסדים.` : `${FOUNDING_SPOTS} מקומות מייסדים.`}
              <span className="is-soft"> מי שבפנים, מקבל:</span>
            </h2>
            <Seats spotsLeft={spotsLeft} />
          </div>
        </div>
        <ol className="e5-gifts">
          <li data-r>
            <span className="e5-gift-i" aria-hidden="true"><Wrench size={22} strokeWidth={2} /></span>
            <h3>הקמה אישית</h3>
            <p>מחברים לכם את היומנים של Booking ו-Airbnb, מגדירים את היחידות ומכינים את נוסחי ההודעות. אתם רק מאשרים.</p>
          </li>
          <li data-r className="is-main">
            <span className="e5-gift-i" aria-hidden="true"><Lock size={22} strokeWidth={2} /></span>
            <h3>מחיר מייסדים, נעול</h3>
            <p>מחיר המסלול השנתי, בתשלום חודשי. נעול כל עוד המנוי פעיל.</p>
            <PriceRows />
          </li>
          <li data-r>
            <span className="e5-gift-i" aria-hidden="true"><Gift size={22} strokeWidth={2} /></span>
            <h3>{TRIAL_DAYS} יום חינם</h3>
            <p>הכל פתוח, בלי כרטיס אשראי. לא מתאים? פשוט לא ממשיכים.</p>
          </li>
        </ol>
        <div className="e5-offer-end" data-r>
          <p className="e5-never">אחרי {FOUNDING_SPOTS} המקומות, חוזרים למחיר הרגיל.</p>
          <GlowCta onClick={onCta} light={!light} />
        </div>
      </div>
    </section>
  );
}

function ShareBlock({ refCode }) {
  const [copied, setCopied] = useState(false);
  const link = `${SITE}?ref=${refCode}`;
  const text = `מצאתי משהו לבעלי צימרים: atlas. 50 המקומות הראשונים מקבלים הקמה אישית ומחיר מייסדים נעול. שווה לשמור מקום לפני שנגמר:\n${link}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  };
  return (
    <div className="e5-share">
      <h3>מכירים עוד מארח?</h3>
      <p>שתפו אותו לפני שהמקומות נגמרים.</p>
      <div className="e5-share-btns">
        <a className="e5-btn wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} strokeWidth={2.2} aria-hidden="true" />שיתוף בוואטסאפ</a>
        <button type="button" className="e5-btn ghost" onClick={copy}>{copied ? 'הקישור הועתק' : 'העתקת הקישור'}</button>
      </div>
      <p className="e5-hint">נפתח בוואטסאפ שלכם. אתם בוחרים למי, ושולחים בלחיצה.</p>
      <p className="e5-vh" aria-live="polite">{copied ? 'הקישור הועתק' : ''}</p>
    </div>
  );
}

function JoinForm({ variant, done, onDone, compact }) {
  const [f, setF] = useState({ name: '', phone: '', units: '', complex: '', consent: false, website: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    const r = await joinWaitlist({ ...f, variant }).catch(() => ({ ok: false, error: 'לא הצלחנו לשמור. בדקו את החיבור ונסו שוב.' }));
    setBusy(false);
    if (r.ok) onDone(r); else setErr(r.error || 'לא הצלחנו לשמור. נסו שוב בעוד רגע.');
  };

  if (done) {
    return (
      <div className="e5-done" role="status" tabIndex={-1} id="e5-done">
        <span className="e5-done-check" aria-hidden="true"><Check size={30} strokeWidth={2.6} /></span>
        <h2 className="e5-h3">המקום שלכם שמור.</h2>
        <p>נחזור אליכם בוואטסאפ לפני ההשקה, כדי לקבוע את ההקמה האישית.</p>
        {done.demo && <p className="e5-demo">מצב הדגמה: שום דבר לא נשמר.</p>}
        <ShareBlock refCode={done.refCode} />
      </div>
    );
  }

  return (
    <form className={`e5-form ${compact ? 'is-compact' : ''}`} onSubmit={submit} noValidate>
      <h2 className="e5-h3" id="e5-form-h">שמרו לי מקום</h2>
      <p className="e5-form-sub">30 שניות. בלי תשלום עכשיו.</p>
      <div className="e5-row2">
        <div className="e5-field">
          <label htmlFor="e5-name">שם</label>
          <input id="e5-name" name="name" autoComplete="name" value={f.name} onChange={set('name')} required maxLength={120} />
        </div>
        <div className="e5-field">
          <label htmlFor="e5-phone">טלפון נייד</label>
          <input id="e5-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="050-1234567" value={f.phone} onChange={set('phone')} required maxLength={20} />
        </div>
      </div>
      <fieldset className="e5-field e5-units">
        <legend>כמה יחידות יש לכם?</legend>
        <div className="e5-chips">
          {UNIT_OPTIONS.map((o) => (
            <label key={o.v} className={`e5-chip-o ${f.units === o.v ? 'on' : ''}`}>
              <input type="radio" name="units" value={o.v} checked={f.units === o.v} onChange={set('units')} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="e5-field">
        <label htmlFor="e5-complex">שם המתחם ואזור <small>(לא חובה)</small></label>
        <input id="e5-complex" name="complex" autoComplete="organization" placeholder="למשל: צימרי הגפן, גליל עליון" value={f.complex} onChange={set('complex')} maxLength={200} />
      </div>
      <div className="e5-hp" aria-hidden="true">
        <label htmlFor="e5-website">אתר</label>
        <input id="e5-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
      </div>
      <label className="e5-consent">
        <input type="checkbox" checked={f.consent} onChange={set('consent')} required />
        <span>מאשרים לחזור אלינו בטלפון ובוואטסאפ לגבי <A />. <a href="/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</a></span>
      </label>
      {err && <p className="e5-err" role="alert">{err}</p>}
      <button type="submit" className="e5-submit" disabled={busy} aria-busy={busy}>
        <span>{busy ? 'שומרים…' : 'שמרו לי מקום'}</span>
        {!busy && <span className="e5-glow-chip" aria-hidden="true"><ArrowLeft size={18} strokeWidth={2.4} /></span>}
      </button>
      <p className="e5-hint">{FOUNDING_SPOTS} מקומות בלבד. אחרי זה, המחיר הרגיל.</p>
    </form>
  );
}

function Faq() {
  const qs = [
    { q: 'מתי ההשקה?', a: 'בקרוב. מי שברשימה שומע ראשון, ואנחנו חוזרים אליו אישית.' },
    { q: 'האפליקציה לאייפון כבר זמינה?', a: 'עוד רגע. היא בבדיקה של Apple. בינתיים המערכת עובדת מהדפדפן, במחשב ובטלפון.' },
    { q: 'צריך להבין במחשבים?', a: 'לא. בהקמה האישית אנחנו מגדירים הכל, ואתם רק מאשרים.' },
    { q: 'אני כבר ב-Booking וב-Airbnb. מה משתנה?', a: 'שום דבר אצלם. התאריכים התפוסים משם נכנסים ללוח אחד, בערך כל 15 דקות.' },
    { q: 'מה אם זה לא מתאים לי?', a: `${TRIAL_DAYS} יום חינם, בלי כרטיס אשראי. לא מתאים? לא ממשיכים.` },
  ];
  return (
    <section className="e5-faq" id="faq" aria-labelledby="e5-faq-h">
      <div className="e5-wrap narrow">
        <h2 id="e5-faq-h" className="e5-h2" data-r>שאלות קצרות</h2>
        {qs.map((x) => (
          <details key={x.q} className="e5-q" data-r>
            <summary>{x.q}<span className="e5-q-plus" aria-hidden="true" /></summary>
            <p>{x.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FootLinks({ light }) {
  return (
    <nav className={`e5-foot-links ${light ? 'is-light' : ''}`} aria-label="קישורים">
      <a href="/">לאתר</a><a href="/privacy">פרטיות</a><a href="/terms">תנאי שימוש</a><a href="/accessibility">נגישות</a>
    </nav>
  );
}

function FooterA({ onCta }) {
  return (
    <footer className="e5-foot-a">
      <div className="e5-stars" aria-hidden="true" />
      <div className="e5-wrap">
        <h2 className="e5-h2 e5-foot-h" data-r>הלוח שלכם. <span className="is-soft">בלי להקליד.</span></h2>
        <div data-r><GlowCta onClick={onCta} light /></div>
        <div data-r><Platforms /></div>
      </div>
      <div className="e5-horizon" aria-hidden="true">
        <img src="/atlas-logo-white.svg" alt="" width="1200" height="372" loading="lazy" decoding="async" />
        <span className="e5-horizon-glow" />
      </div>
      <div className="e5-foot-bar">
        <p>אתם מארחים. <A /> מסדר.</p>
        <FootLinks />
      </div>
    </footer>
  );
}

function Sticky({ show, spotsLeft }) {
  return (
    <div className={`e5-sticky ${show ? 'show' : ''}`} aria-hidden={!show}>
      <span className="e5-sticky-t"><span className="e5-live" aria-hidden="true" />{typeof spotsLeft === 'number' ? `נשארו ${spotsLeft} מקומות` : `${FOUNDING_SPOTS} מקומות מייסדים`}</span>
      <button type="button" className="e5-sticky-b" onClick={goJoin} tabIndex={show ? 0 : -1}>שמרו לי מקום</button>
    </div>
  );
}

/* ---------------- version B parts ---------------- */

function HeroB({ variant, done, onDone, spotsLeft }) {
  return (
    <section className="e5-hero-b" id="top" aria-labelledby="e5-h1">
      <div className="e5-hero-b-frame" data-scrub="leave">
        <picture className="e5-hero-b-ph" aria-hidden="true">
          <source media="(max-width: 700px)" srcSet={`${IMG}/galil-p540.webp 540w, ${IMG}/galil-p900.webp 900w`} sizes="100vw" />
          <img src={`${IMG}/galil-1920.webp`} srcSet={`${IMG}/galil-1280.webp 1280w, ${IMG}/galil-1920.webp 1920w`} sizes="100vw" alt="" width="1920" height="1079" fetchpriority="high" decoding="async" />
        </picture>
        <span className="e5-hero-b-veil" aria-hidden="true" />
        <div className="e5-hero-b-grid">
          <div className="e5-hero-b-copy">
            <div className="e5-in" style={{ '--d': 0 }}><Eyebrow spotsLeft={spotsLeft} light /></div>
            <div className="e5-in" style={{ '--d': 1 }} id="e5-h1"><H1 cls="is-thin" /></div>
            <div className="e5-in" style={{ '--d': 2 }}><Sub /></div>
            <ul className="e5-points e5-in" style={{ '--d': 3 }}>
              <li><span aria-hidden="true"><Wrench size={15} strokeWidth={2.4} /></span>הקמה אישית</li>
              <li><span aria-hidden="true"><Lock size={15} strokeWidth={2.4} /></span>מחיר מייסדים נעול</li>
              <li><span aria-hidden="true"><Gift size={15} strokeWidth={2.4} /></span>{TRIAL_DAYS} יום חינם</li>
            </ul>
            <div className="e5-in" style={{ '--d': 4 }}><Platforms light /></div>
          </div>
          <div className="e5-hero-b-form e5-in" id="join" style={{ '--d': 2 }} aria-labelledby="e5-form-h">
            <JoinForm variant={variant} done={done} onDone={onDone} compact />
          </div>
        </div>
      </div>
    </section>
  );
}

function RiseB() {
  return (
    <section className="e5-rise" id="where" aria-label="atlas באייפון ובמחשב">
      <div className="e5-duo is-rise" data-scrub="enter">
        <div className="e5-browser">
          <div className="e5-browser-bar" aria-hidden="true"><i /><i /><i /><span dir="ltr">atlas-il.com/today</span></div>
          <img src="/landing-hero/ui-d-today-y3-1600.webp" srcSet="/landing-hero/ui-d-today-y3-1200.webp 1200w, /landing-hero/ui-d-today-y3-1600.webp 1600w, /landing-hero/ui-d-today-y3-2080.webp 2080w" sizes="(min-width: 1200px) 1040px, 92vw" alt="מערכת הניהול של atlas במחשב: מסך היום עם לוח שנה, הכנסות, מי מגיע היום והדבר הבא (נתוני דוגמה)" width="1600" height="1000" loading="lazy" decoding="async" />
        </div>
        <Phone frames={TODAY_FRAME} cls="e5-duo-phone" sizes="(min-width: 900px) 240px, 120px" />
      </div>
      <p className="e5-sample">מסכים אמיתיים · נתוני דוגמה</p>
      <div className="e5-marq" aria-label="עובד עם מה שכבר יש לכם">
        <p className="e5-marq-k">עובד עם מה שכבר יש לכם</p>
        <div className="e5-marq-track" aria-hidden="true">
          <div className="e5-marq-in">
            {[0, 1, 2].map((r) => ['Booking.com', 'Airbnb', 'WhatsApp', 'Google Calendar'].map((n) => <span key={`${r}-${n}`} dir="ltr">{n}</span>))}
          </div>
        </div>
        <p className="e5-vh">Booking.com, Airbnb, WhatsApp, Google Calendar</p>
      </div>
    </section>
  );
}

const LINES = ['הזמנה חדשה מהטלפון, בזמן שאתם בדרך.', 'הודעת אישור לאורח, בנוסח שלכם.', 'תזכורת למי שעוד חייב יתרה.', 'מי מגיע היום ומתי מנקים.'];
function NightB() {
  return (
    <section className="e5-night" aria-labelledby="e5-night-h">
      <div className="e5-stars" aria-hidden="true" />
      <div className="e5-wrap">
        <p className="e5-k on-dark" data-r>במקום להקליד</p>
        <h2 id="e5-night-h" className="e5-h2 on-dark" data-r>כל מה שהייתם מקלידים,<br /><span className="is-soft">פשוט אומרים.</span></h2>
        <ul className="e5-karaoke" data-scrub="view" style={{ '--n': LINES.length + 1 }}>
          {LINES.map((l, i) => <li key={l} style={{ '--i': i }}>{l}</li>)}
          <li className="is-end" style={{ '--i': LINES.length }}><A /> מכין. אתם מאשרים.</li>
        </ul>
      </div>
    </section>
  );
}

function FooterB({ onCta }) {
  return (
    <footer className="e5-foot-b">
      <picture className="e5-foot-b-ph" aria-hidden="true">
        <source media="(max-width: 700px)" srcSet={`${IMG}/sky-p900.webp`} />
        <img src={`${IMG}/sky-1280.webp`} srcSet={`${IMG}/sky-1280.webp 1280w, ${IMG}/sky-1920.webp 1920w`} sizes="100vw" alt="" width="1280" height="960" loading="lazy" decoding="async" />
      </picture>
      <div className="e5-foot-card" data-r>
        <Logo tone="navy" w={120} />
        <h2 className="e5-h2">הלוח שלכם. <span className="is-ind">בלי להקליד.</span></h2>
        <GlowCta onClick={onCta} />
        <Platforms light />
        <div className="e5-foot-bar light">
          <p>אתם מארחים. <A /> מסדר.</p>
          <FootLinks light />
        </div>
      </div>
    </footer>
  );
}

/* ---------------- page ---------------- */

export default function EarlyV5() {
  const variant = (() => {
    try { return new URLSearchParams(window.location.search).get('v') === 'b' ? 'b' : 'a'; } catch { return 'a'; }
  })();
  const rootRef = useRef(null);
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [done, setDone] = useState(null);
  const [show, setShow] = useState(false);
  useMeta();
  useReveal(rootRef);
  useScrub(rootRef);

  useEffect(() => { fetchSpotsLeft().then((n) => { if (typeof n === 'number') setSpotsLeft(n); }); }, []);
  useEffect(() => { if (done) setTimeout(() => document.getElementById('e5-done')?.focus(), 50); }, [done]);

  // Sticky bar: only when no CTA is on screen (hero CTA / form / offer CTA / footer CTA).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const targets = [...root.querySelectorAll('.e5-hero-cta, #join, .e5-offer, .e5-foot-a, .e5-foot-b, .e5-hero-b-form')];
    const vis = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)));
      setShow(vis.size === 0 && window.scrollY > 200);
    }, { threshold: 0 });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [variant]);

  const go = useCallback(() => goJoin(), []);
  const v = `v5${variant}`;

  return (
    <div className={`e5 e5-${variant}`} ref={rootRef} dir="rtl" lang="he">
      <a href="#join" className="e5-skip">דלגו לטופס</a>
      {variant === 'a' ? (
        <>
          <HeaderA onCta={go} />
          <HeroA onCta={go} spotsLeft={spotsLeft} />
          <main>
            <SheetA />
            <VoicePin />
            <Where variant="a" />
            <Offer onCta={go} spotsLeft={spotsLeft} />
            <section className="e5-join" id="join" aria-labelledby="e5-form-h">
              <div className="e5-join-card" data-r><JoinForm variant={v} done={done} onDone={setDone} /></div>
            </section>
            <Faq />
          </main>
          <FooterA onCta={go} />
        </>
      ) : (
        <>
          <HeaderB onCta={go} />
          <HeroB variant={v} done={done} onDone={setDone} spotsLeft={spotsLeft} />
          <main>
            <RiseB />
            <section className="e5-sheet is-b" aria-label="מה atlas עושה"><div className="e5-wrap"><LitSentence /></div></section>
            <VoicePin dark />
            <NightB />
            <Offer onCta={go} spotsLeft={spotsLeft} light />
            <Faq />
          </main>
          <FooterB onCta={go} />
        </>
      )}
      <Sticky show={show && !done} spotsLeft={spotsLeft} />
    </div>
  );
}
