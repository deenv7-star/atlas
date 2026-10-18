/**
 * Landing hero "כל המתחם. במבט אחד." with the original landing v9 Q motion (commit ea07f10), restored.
 *
 * A full-bleed aerial photo of a pool complex, a huge white headline, and three glass notifications
 * arriving one after another (new booking, WhatsApp confirmation, deposit). On scroll the stage sticks
 * and the photo shrinks, exactly, into the property photo tile of the real ATLAS home screen (app v8 C)
 * that assembles around it: a browser window on desktop, the C mobile view in a phone below 900px.
 * The place becomes the product, then the rest of the landing (channels strip onwards) follows.
 *
 * Motion is a 1:1 port of ea07f10 (same scroll length 230svh / 260svh, same segments, same easing,
 * clip-path + transform). Only the photo source changed: the art-directed AVIF/WebP set on main
 * (portrait crop on phones), so the photo's aspect is read from the loaded image instead of a constant.
 * Reduced motion: the static photo hero, then the home screen as its own section (as in ea07f10).
 * Every name and amount on the notifications and the screen is example data.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Mark } from '../v5/ui';
import { CTA_SIGNUP, CTA_NOTE } from '../v5/content';
import { prefersReducedMotion } from '../v5/motion';
import { FACES } from './shared8';
import './hero-photo.css';

const P = '/landing-hero';
const PORTRAIT = '(max-aspect-ratio: 2/3)';
const set = (ext, list) => list.map(([f, w]) => `${P}/${f}.${ext} ${w}w`).join(', ');
const PORT = [['pool-p480', 480], ['pool-p720', 720]];
const LAND = [['pool-960', 960], ['pool-1280', 1280], ['pool-1920', 1920]];

const NTFS = [
  { ch: 'booking', title: 'הזמנה חדשה מ-Booking.com', sub: 'שירן ג. · הזית · 2 לילות', time: '08:12' },
  { ch: 'whatsapp', title: 'אישור נשלח בוואטסאפ', sub: 'משפחת לוי · עם הוראות הגעה', time: '09:00' },
  { face: 'noa', title: 'נועה ל. שילמה מקדמה', sub: '‏₪1,250 · האלון · נרשם לבד', time: '10:24' },
];

/** The property photo tile inside the real captures, as fractions of the screen image (from ea07f10). */
const TILE = {
  desk: { x: 80 / 2880, y: 202 / 1800, w: 704 / 2880, h: 432 / 1800, r: 28 / 1440 },
  mob: { x: 40 / 780, y: 568 / 1594, w: 338 / 780, h: 460 / 1594, r: 28 / 390 },
};

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

/** 0..1 while a tall section scrolls past its sticky stage (ea07f10 useStickyProgress). */
function useStickyProgress(ref, onProgress, enabled) {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      cb.current(run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [ref, enabled]);
}

function Notif({ ch, face, title, sub, time, i }) {
  return (
    <div className="ph-ntf" style={{ '--i': i }}>
      <span className="ph-ntf-ic" aria-hidden="true">
        {face
          ? <img className="ph-face" src={FACES[face].src} alt="" width="40" height="40" decoding="async" />
          : <span className={`ph-ntf-mk is-${ch}`}><Mark ch={ch} size={ch === 'booking' ? 22 : 20} /></span>}
      </span>
      <span className="ph-ntf-tx"><b>{title}</b><small>{sub}</small></span>
      <span className="ph-ntf-t num" dir="ltr">{time}</span>
    </div>
  );
}

function Photo({ imgRef }) {
  return (
    <picture className="ph-photo">
      <source media={PORTRAIT} type="image/avif" srcSet={set('avif', PORT)} sizes="100vw" />
      <source media={PORTRAIT} type="image/webp" srcSet={set('webp', PORT)} sizes="100vw" />
      <source type="image/avif" srcSet={set('avif', LAND)} sizes="100vw" />
      <img
        ref={imgRef}
        src={`${P}/pool-1280.webp`}
        srcSet={set('webp', LAND)}
        sizes="100vw"
        alt="מתחם אירוח עם בריכה בין עצים, מבט מלמעלה"
        width="1920"
        height="1440"
        fetchPriority="high"
      />
    </picture>
  );
}

function Copy({ copyRef, onShow }) {
  return (
    <div ref={copyRef} className="ph-copy">
      <h1 id="hero-title" className="ph-h1">כל המתחם.<br />במבט אחד.</h1>
      <p className="ph-sub">הזמנות מכל הערוצים, וואטסאפ לאורחים ותשלומים, במסך אחד שעובד בשבילכם.</p>
      <div className="ph-ctas">
        <Link to="/register" className="ph-btn">
          <span>{CTA_SIGNUP}</span>
          <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" className="ph-btn-ar" />
        </Link>
        <a href="#product" className="ph-ghost" onClick={onShow}>איך זה נראה</a>
      </div>
      <p className="ph-note"><Check size={15} strokeWidth={2.6} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
    </div>
  );
}

function Notifs({ ntfRef }) {
  return (
    <div ref={ntfRef} className="ph-ntfs" aria-hidden="true">
      {NTFS.map((n, i) => <Notif key={n.title} {...n} i={i} />)}
    </div>
  );
}

function EndHead() {
  return (
    <>
      <h2 className="ph-end-h">בוקר טוב. <span>הכל כבר כאן.</span></h2>
      <p className="ph-end-sub">ככה נראה מסך הבית של ATLAS כל בוקר. נתוני דוגמה.</p>
    </>
  );
}

/** The real home screen: browser window (desktop capture 2400×1500) or phone (C mobile 780×1594). */
function Device({ desk, shotRef }) {
  if (desk) {
    return (
      <div className="ph-win ph-dev">
        <div className="ph-win-bar" aria-hidden="true"><i /><i /><i /><span dir="ltr">app.atlas-il.com/today</span></div>
        <div className="ph-win-shot">
          <img ref={shotRef} src={`${P}/ui-d-today.webp`} alt="מסך הבית של ATLAS, נתוני דוגמה" width="2400" height="1500" decoding="async" />
        </div>
      </div>
    );
  }
  return (
    <div className="ph-phone ph-dev" role="img" aria-label="מסך הבית של ATLAS בטלפון, נתוני דוגמה">
      <div className="ph-phone-scr">
        <span className="ph-phone-status" aria-hidden="true"><span className="num" dir="ltr">9:41</span><span className="ph-phone-island" /><i className="ph-phone-bat" /></span>
        <img ref={shotRef} src={`${P}/ui-m-today.webp`} alt="" width="780" height="1594" decoding="async" />
      </div>
    </div>
  );
}

export default function HeroPhoto() {
  const desk = useDesktop();
  const [rm] = useState(prefersReducedMotion);
  const sec = useRef(null);
  const stage = useRef(null);
  const clip = useRef(null);
  const img = useRef(null);
  const shot = useRef(null);
  const copy = useRef(null);
  const ntfs = useRef(null);
  const end = useRef(null);
  const geo = useRef(null);
  const last = useRef(0);

  const measure = useCallback(() => {
    const st = stage.current; const s = shot.current; const im = img.current;
    if (!st || !s || !im) return;
    const sr = st.getBoundingClientRect();
    const r = s.getBoundingClientRect();
    const T = desk ? TILE.desk : TILE.mob;
    const portrait = window.matchMedia(PORTRAIT).matches;
    const pw = im.naturalWidth || (portrait ? 720 : 1920);
    const ph = im.naturalHeight || 1440;
    const cover = Math.max(sr.width / pw, sr.height / ph);
    const iw = pw * cover; const ih = ph * cover;
    Object.assign(im.style, { width: `${iw}px`, height: `${ih}px`, left: `${(sr.width - iw) / 2}px`, top: `${(sr.height - ih) / 2}px` });
    geo.current = {
      W: sr.width, H: sr.height, pw, ph, cover,
      tx: r.left - sr.left + T.x * r.width, ty: r.top - sr.top + T.y * r.height, tw: T.w * r.width, th: T.h * r.height, tr: T.r * r.width,
    };
  }, [desk]);

  const paint = useCallback((p) => {
    const g = geo.current;
    if (!g) return;
    const t = easeIO(seg(p, 0.06, 0.72));
    const x = lerp(0, g.tx, t); const y = lerp(0, g.ty, t);
    const w = lerp(g.W, g.tw, t); const h = lerp(g.H, g.th, t);
    const rad = lerp(0, g.tr, t);
    clip.current.style.clipPath = `inset(${y}px ${g.W - x - w}px ${g.H - y - h}px ${x}px round ${rad}px)`;
    const s = Math.max(w / g.pw, h / g.ph) / g.cover;
    img.current.style.transform = `translate3d(${x + w / 2 - g.W / 2}px, ${y + h / 2 - g.H / 2}px, 0) scale(${s})`;
    const op = 1 - seg(p, 0.74, 0.86);
    clip.current.style.opacity = String(op);
    clip.current.style.visibility = op <= 0 ? 'hidden' : ''; // faded out: take it out of paint and layout-shift tracking
    clip.current.style.setProperty('--scrim', String(1 - seg(p, 0, 0.3)));
    const c = seg(p, 0, 0.2);
    copy.current.style.opacity = String(1 - c);
    copy.current.style.transform = `translate3d(0, ${-40 * c}px, 0)`;
    copy.current.classList.toggle('is-gone', c >= 1);
    ntfs.current.style.opacity = String(1 - seg(p, 0.04, 0.22));
    ntfs.current.style.transform = `translate3d(0, ${-60 * seg(p, 0.04, 0.22)}px, 0)`;
    shot.current.closest('.ph-dev').style.opacity = String(seg(p, 0.22, 0.62));
    const hd = seg(p, 0.6, 0.8);
    end.current.style.opacity = String(hd);
    end.current.style.transform = `translate3d(0, ${16 * (1 - hd)}px, 0)`;
  }, []);

  useStickyProgress(sec, (p) => { last.current = p; paint(p); }, !rm);

  // layout effect: the photo gets its cover size before the first paint, so nothing shifts (CLS 0)
  useLayoutEffect(() => {
    if (rm) return undefined;
    const on = () => { measure(); paint(last.current); };
    on();
    const waits = [shot.current, img.current].filter((el) => el && !el.complete);
    waits.forEach((el) => el.addEventListener('load', on, { once: true }));
    window.addEventListener('resize', on);
    return () => { waits.forEach((el) => el.removeEventListener('load', on)); window.removeEventListener('resize', on); };
  }, [rm, measure, paint, desk]);

  /* "איך זה נראה": land on the finished home screen, not on the top of the sticky stage */
  const onShow = useCallback((e) => {
    const el = sec.current;
    if (rm || !el) return;
    e.preventDefault();
    const run = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + run * 0.9, behavior: 'smooth' });
  }, [rm]);

  if (rm) {
    return (
      <>
        <section className="ph-hero" aria-labelledby="hero-title">
          <Photo />
          <i className="ph-scrim" aria-hidden="true" />
          <div className="ph-in">
            <Copy />
            <Notifs />
          </div>
        </section>
        <section id="product" className="ph-static-end" aria-label="מסך הבית של ATLAS">
          <EndHead />
          <div className="ph-static-dev"><Device desk={desk} /></div>
        </section>
      </>
    );
  }

  return (
    <section ref={sec} className="ph-hero is-scroll" aria-labelledby="hero-title">
      <div ref={stage} className="ph-stage">
        <div className="ph-end">
          <div ref={end} className="ph-end-head" id="product"><EndHead /></div>
          <div className="ph-end-dev"><Device desk={desk} shotRef={shot} /></div>
        </div>
        <div ref={clip} className="ph-clip">
          <Photo imgRef={img} />
          <i className="ph-scrim" aria-hidden="true" />
        </div>
        <div className="ph-in">
          <Copy copyRef={copy} onShow={onShow} />
          <Notifs ntfRef={ntfs} />
        </div>
      </div>
    </section>
  );
}
