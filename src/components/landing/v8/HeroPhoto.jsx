/**
 * Landing hero "כל המתחם. במבט אחד." with the landing v9 Q scroll motion (ea07f10), tuned (V2).
 *
 * A full-bleed aerial photo of a pool complex, a huge white headline, three glass notifications arriving
 * in a tight stagger. On scroll the stage sticks and the photo shrinks into the property photo tile of
 * the real ATLAS home screen (app v8 C) that assembles around it: browser window on desktop, the C
 * mobile view in a phone below 900px. Then the rest of the landing follows.
 *
 * Compared with ea07f10:
 * - Transform and opacity only. The crop is an overflow-clipped frame scaled non-uniformly with the
 *   photo counter-scaled inside it (net uniform scale), instead of animating clip-path per frame; the
 *   corner radius is baked into the frame so it lands exactly on the tile's radius. No inherited CSS
 *   variable is animated (the scrim's opacity is set directly).
 * - Off the main thread where the browser can: the whole sequence is sampled once into Web Animations
 *   keyframes on a ViewTimeline of the section (Chrome/Edge, Safari 26). Elsewhere a rAF loop applies
 *   the same frames, writing only values that changed.
 * - About 18% shorter scroll (190svh phones / 210svh desktop, was 230 / 260), slightly earlier segments.
 * - Phones: the stage uses the large viewport so the URL bar never reveals a strip under the photo, the
 *   copy stays above the bar, progress ignores URL-bar resizes, notifications skip backdrop blur.
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

/** Scroll segments (progress 0..1 through the sticky run). */
const SEG = { shrink: [0.04, 0.68], copy: [0, 0.16], ntfs: [0.02, 0.18], dev: [0.18, 0.54], end: [0.54, 0.74], out: [0.72, 0.84], scrim: [0, 0.26] };
const SAMPLES = 48;

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

/** Progress 0..1 of the sticky run, measured against the stage (not innerHeight, which jumps with the URL bar). */
function progressOf(sec, stage) {
  const r = sec.getBoundingClientRect();
  const run = r.height - stage.offsetHeight;
  return run > 0 ? clamp(-r.top / run) : 0;
}

const whenIdle = (fn) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(fn, { timeout: 600 }) : window.setTimeout(fn, 200));
const cancelIdle = (id) => { if (!id) return; if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id); else window.clearTimeout(id); };

const viewTimelineOK = () => typeof window !== 'undefined' && 'ViewTimeline' in window && typeof Element.prototype.animate === 'function';

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
  const scrim = useRef(null);
  const shot = useRef(null);
  const copy = useRef(null);
  const ntfs = useRef(null);
  const end = useRef(null);
  const geo = useRef(null);

  /* Geometry: stage, the tile inside the real screen, and an overscanned frame whose baked-in corner
     radius lands exactly on the tile's radius at the end (the overscan hides the corners at the start). */
  const measure = useCallback(() => {
    const st = stage.current; const s = shot.current; const im = img.current; const fr = clip.current;
    if (!st || !s || !im || !fr) return false;
    const W = st.offsetWidth; const H = st.offsetHeight;
    const sr = st.getBoundingClientRect();
    const r = s.getBoundingClientRect();
    const T = desk ? TILE.desk : TILE.mob;
    const tx = r.left - sr.left + T.x * r.width; const ty = r.top - sr.top + T.y * r.height;
    const tw = T.w * r.width; const th = T.h * r.height; const tr = T.r * r.width;
    let m = 24; let rx = 0; let ry = 0;
    for (let k = 0; k < 4; k += 1) {
      rx = (tr * (W + 2 * m)) / tw; ry = (tr * (H + 2 * m)) / th;
      m = Math.max(24, Math.ceil(0.32 * Math.max(rx, ry)));
    }
    const FW = W + 2 * m; const FH = H + 2 * m;
    const portrait = window.matchMedia(PORTRAIT).matches;
    const pw = im.naturalWidth || (portrait ? 720 : 1920);
    const ph = im.naturalHeight || 1440;
    const cover = Math.max(FW / pw, FH / ph);
    const iw = pw * cover; const ih = ph * cover;
    Object.assign(fr.style, { left: `${-m}px`, top: `${-m}px`, width: `${FW}px`, height: `${FH}px`, borderRadius: `${rx}px / ${ry}px` });
    Object.assign(im.style, { width: `${iw}px`, height: `${ih}px`, left: `${(FW - iw) / 2}px`, top: `${(FH - ih) / 2}px` });
    geo.current = { W, H, m, FW, FH, pw, ph, cover, tx, ty, tw, th };
    return true;
  }, [desk]);

  /** Every animated value at progress p: transforms and opacities only. */
  const frame = useCallback((p) => {
    const g = geo.current;
    const t = easeIO(seg(p, ...SEG.shrink));
    const X = lerp(-g.m, g.tx, t); const Y = lerp(-g.m, g.ty, t);
    const OW = lerp(g.FW, g.tw, t); const OH = lerp(g.FH, g.th, t);
    const sx = OW / g.FW; const sy = OH / g.FH;
    const S = Math.max(OW / g.pw, OH / g.ph) / g.cover;
    const c = seg(p, ...SEG.copy); const n = seg(p, ...SEG.ntfs); const hd = seg(p, ...SEG.end);
    const f = (v) => +v.toFixed(4);
    return {
      clip: { transform: `translate3d(${f(X + g.m)}px, ${f(Y + g.m)}px, 0) scale(${f(sx)}, ${f(sy)})`, opacity: f(1 - seg(p, ...SEG.out)) },
      img: { transform: `scale(${f(S / sx)}, ${f(S / sy)})` },
      scrim: { opacity: f(1 - seg(p, ...SEG.scrim)) },
      copy: { transform: `translate3d(0, ${f(-32 * c)}px, 0)`, opacity: f(1 - c) },
      ntfs: { transform: `translate3d(0, ${f(-48 * n)}px, 0)`, opacity: f(1 - n) },
      dev: { opacity: f(seg(p, ...SEG.dev)) },
      end: { transform: `translate3d(0, ${f(14 * (1 - hd))}px, 0)`, opacity: f(hd) },
    };
  }, []);

  useLayoutEffect(() => {
    if (rm) return undefined;
    const els = () => ({ clip: clip.current, img: img.current, scrim: scrim.current, copy: copy.current, ntfs: ntfs.current, dev: shot.current?.closest('.ph-dev'), end: end.current });
    let anims = [];
    let raf = 0;
    let size = '';
    let gone = null;
    let idle = 0;
    const written = new Map();
    const write = (p) => {
      const fr = frame(p); const E = els();
      Object.keys(fr).forEach((k) => {
        const el = E[k]; if (!el) return;
        Object.entries(fr[k]).forEach(([prop, v]) => {
          const key = `${k}.${prop}`;
          if (written.get(key) !== v) { written.set(key, v); el.style[prop] = String(v); }
        });
      });
    };
    const build = () => {
      cancelIdle(idle);
      anims.forEach((a) => a.cancel()); anims = []; written.clear();
      if (!measure()) return;
      const p0 = progressOf(sec.current, stage.current);
      write(p0); // correct first paint, and the fallback path
      if (!viewTimelineOK()) return;
      // hand the sequence to the compositor after the first paint, so it never delays the headline (LCP)
      cancelIdle(idle);
      idle = whenIdle(() => {
        if (!sec.current) return;
        try {
          const timeline = new window.ViewTimeline({ subject: sec.current, axis: 'block' });
          const frames = Array.from({ length: SAMPLES + 1 }, (_, i) => frame(i / SAMPLES));
          const E = els();
          anims = Object.keys(frames[0]).filter((k) => E[k]).map((k) => E[k].animate(
            frames.map((fr, i) => ({ ...fr[k], offset: i / SAMPLES })),
            { timeline, rangeStart: 'contain 0%', rangeEnd: 'contain 100%', fill: 'both', easing: 'linear' },
          ));
        } catch {
          anims.forEach((a) => a.cancel()); anims = []; // fall back to the rAF path
        }
      });
    };
    const tick = () => {
      raf = 0;
      const p = progressOf(sec.current, stage.current);
      if (!anims.length) write(p);
      const g = p >= SEG.copy[1];
      if (g !== gone) { gone = g; copy.current?.classList.toggle('is-gone', g); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => {
      const st = stage.current; if (!st) return;
      const k = `${st.offsetWidth}x${st.offsetHeight}`;
      if (k !== size) { size = k; build(); }
      onScroll();
    };
    onResize(); tick();
    const waits = [shot.current, img.current].filter((el) => el && !el.complete);
    const onLoad = () => { size = ''; onResize(); };
    waits.forEach((el) => el.addEventListener('load', onLoad, { once: true }));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf); cancelIdle(idle); anims.forEach((a) => a.cancel());
      waits.forEach((el) => el.removeEventListener('load', onLoad));
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize);
    };
  }, [rm, measure, frame, desk]);

  /* "איך זה נראה": land on the finished home screen, not on the top of the sticky stage */
  const onShow = useCallback((e) => {
    const el = sec.current;
    if (rm || !el || !stage.current) return;
    e.preventDefault();
    const run = el.offsetHeight - stage.current.offsetHeight;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + run * 0.88, behavior: 'smooth' });
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
          <i ref={scrim} className="ph-scrim" aria-hidden="true" />
        </div>
        <div className="ph-in">
          <Copy copyRef={copy} onShow={onShow} />
          <Notifs ntfRef={ntfs} />
        </div>
      </div>
    </section>
  );
}
