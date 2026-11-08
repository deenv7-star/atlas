/**
 * /early v3 heroes + story (08.11.2026). Deen rejected UI cards / tiles / gradient SaaS; approved the IG launch feed:
 *  A "עולם אמיתי": real licensed Pexels photography (IDs in public/early/v3/CREDITS.md), huge type, editorial.
 *  B "הקרן": near-black → one indigo light beam (teasers 02/05), real 3D renders from the launch film (real app screens,
 *     sample data).
 * Motion: one rAF scroll reader per stage writes --p (0..1) and a data-step; CSS does transform/opacity/filter only.
 * Reduced motion: every stage is a static, complete composition.
 */
import { useEffect, useRef } from 'react';
import { prefersReduced } from '@/features/early/spells';

const P = '/early/v3/';

/** --p for a tall wrapper with a sticky child; optional discrete steps written as data-step. */
function useStage(wrapRef, stageRef, steps = 0) {
  useEffect(() => {
    const wrap = wrapRef.current; const stage = stageRef.current;
    if (!wrap || !stage) return undefined;
    if (prefersReduced()) { stage.dataset.step = String(steps ? steps - 1 : 0); stage.style.setProperty('--p', '1'); return undefined; }
    let raf = 0; let last = -1;
    const tick = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const span = Math.max(1, wrap.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      const q = Math.round(p * 1000) / 1000;
      if (q === last) return;
      last = q;
      stage.style.setProperty('--p', String(q));
      if (steps) stage.dataset.step = String(Math.min(steps - 1, Math.floor(q * steps * 0.999)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
  }, [wrapRef, stageRef, steps]);
}

const Logo = ({ tone = 'white', w = 76 }) => (
  <img src={`/atlas-logo-${tone}.svg`} alt="atlas" width={w} height={Math.round(w * 0.31)} className="v3-logo" style={{ width: w, height: 'auto' }} />
);

/* =========================== A · עולם אמיתי =========================== */

export function HeroA({ onCta }) {
  const wrap = useRef(null); const stage = useRef(null);
  useStage(wrap, stage);
  return (
    <header className="a-hero" ref={wrap}>
      <div className="a-hero-stage" ref={stage}>
        <picture className="a-hero-ph">
          <img src={`${P}p-39297000.webp`} alt="צימר בקתה עם ג׳קוזי בין העצים, בשעת ערב" width="1200" height="1600" fetchpriority="high" decoding="async" />
        </picture>
        <div className="a-hero-scrim" aria-hidden="true" />
        <div className="a-top">
          <Logo tone="white" w={78} />
          <span className="a-soon">בקרוב</span>
        </div>
        <div className="a-hero-copy">
          <p className="a-kicker">לבעלי צימרים ומתחמי נופש</p>
          <h1 className="a-h1"><span>ארבע</span><span>אפליקציות.</span><span className="a-thin">מקום אחד.</span></h1>
          <div className="a-hero-row">
            <button type="button" className="v3-btn light cx-cta" onClick={onCta}>שמרו לי מקום</button>
            <p className="a-hero-note">50 המקומות הראשונים<br />מקבלים מחיר מייסדים</p>
          </div>
        </div>
      </div>
    </header>
  );
}

const CHAPTERS = [
  { img: 'p-27469712', alt: 'חדר שינה מוצע בצימר', word: 'Booking.', ltr: true, line: 'הזמנה אחת נכנסת כאן.' },
  { img: 'p-29369592', alt: 'נוף ירוק מחלון בקתת עץ', word: 'Airbnb.', ltr: true, line: 'עוד אחת, לאותו סוף שבוע, שם.' },
  { img: 'p-6147057', alt: 'יד מחזיקה ספל קפה מול הרים', word: 'וואטסאפ.', line: 'אורח שואל מתי אפשר להגיע.' },
  { img: 'p-19905185', alt: 'מחברת אדומה ועט על שולחן עץ', word: 'מחברת.', line: 'ומה שנשאר, בכתב יד.' },
];

export function StoryA() {
  const wrap = useRef(null); const stage = useRef(null);
  useStage(wrap, stage, CHAPTERS.length + 1);
  return (
    <section className="a-story" ref={wrap} aria-label="הזמנות מכמה מקומות, במקום אחד">
      <div className="a-story-stage" ref={stage} data-step="0">
        {CHAPTERS.map((c, i) => (
          <figure key={c.img} className="a-ch" style={{ '--i': i }}>
            <img src={`${P}${c.img}.webp`} alt={c.alt} loading="lazy" decoding="async" />
            <figcaption>
              <span className="a-ch-n" aria-hidden="true">0{i + 1}</span>
              <strong className="a-ch-word" dir={c.ltr ? 'ltr' : 'rtl'}>{c.word}</strong>
              <span className="a-ch-line">{c.line}</span>
            </figcaption>
          </figure>
        ))}
        <div className="a-one" aria-hidden="false">
          <ul className="a-one-words" aria-hidden="true">
            {CHAPTERS.map((c, i) => <li key={c.word} style={{ '--i': i }} dir={c.ltr ? 'ltr' : 'rtl'}>{c.word}</li>)}
          </ul>
          <div className="a-one-land">
            <img src="/atlas-logo-indigo.svg" alt="atlas" width="230" height="72" />
            <p>הכל במקום אחד.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HandA() {
  const wrap = useRef(null); const stage = useRef(null);
  useStage(wrap, stage);
  return (
    <section className="a-hand" ref={wrap} aria-labelledby="a-hand-h">
      <div className="a-hand-stage" ref={stage}>
        <div className="a-hand-copy">
          <h2 id="a-hand-h" className="a-h2">בטלפון<br />שכבר בכיס.</h2>
          <ol className="a-lines">
            <li><b>כל ההזמנות.</b> יומן אחד.</li>
            <li><b>הודעה לאורח.</b> בלחיצה אחת.</li>
            <li><b>מי שילם.</b> מה פתוח.</li>
          </ol>
        </div>
        <figure className="a-hand-fig">
          <img src={`${P}r-hand.webp`} alt="יד מחזיקה טלפון עם מסך הודעה לאורח באפליקציה" width="900" height="1119" loading="lazy" decoding="async" />
          <figcaption>מסך אמיתי מהאפליקציה · נתוני דוגמה</figcaption>
        </figure>
      </div>
    </section>
  );
}

const STRIP = [
  { img: 'p-9222070', alt: 'משפחה על מרפסת של בקתת עץ ביער', t: 'שבת מלאה.' },
  { img: 'p-33797731', alt: 'מרפסת עץ מול נוף הרים', t: 'ברוכים הבאים.' },
  { img: 'p-5249680', alt: 'ספל קפה על מעקה מול הרים', t: 'הלוח מסודר.\nאפשר לארח.' },
];

export function StripA() {
  return (
    <section className="a-strip" aria-label="רגעים של אירוח">
      <ul>
        {STRIP.map((s) => (
          <li key={s.img}>
            <img src={`${P}${s.img}.webp`} alt={s.alt} loading="lazy" decoding="async" />
            <p>{s.t}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* =========================== B · הקרן =========================== */

const NAMES = [
  { w: 'Booking', ltr: true, x: -19, y: -13 },
  { w: 'Airbnb', ltr: true, x: 21, y: -6.5 },
  { w: 'וואטסאפ', x: -17, y: 6.5 },
  { w: 'מחברת', x: 20, y: 13 },
];

export function HeroB({ onCta }) {
  const wrap = useRef(null); const stage = useRef(null);
  useStage(wrap, stage);
  return (
    <header className="b-hero" ref={wrap}>
      <div className="b-stage" ref={stage}>
        <div className="b-top">
          <Logo tone="white" w={72} />
          <span className="b-soon">בקרוב</span>
        </div>
        <div className="b-head">
          <p className="b-kicker">לבעלי צימרים ומתחמי נופש</p>
          <h1 className="b-h1"><span>ארבע אפליקציות.</span><span className="b-h1-2">מקום אחד.</span></h1>
        </div>
        <div className="b-field" aria-hidden="true">
          {NAMES.map((n, i) => (
            <span key={n.w} className="b-name" dir={n.ltr ? 'ltr' : 'rtl'} style={{ '--x': n.x, '--y': n.y, '--i': i }}>{n.w}</span>
          ))}
          <i className="b-beam" />
          <i className="b-flare" />
          <img className="b-device" src={`${P}r-duo.webp`} alt="" width="1200" height="855" decoding="async" />
        </div>
        <div className="b-reveal">
          <p className="b-reveal-h">אתם מארחים.<br /><span><span dir="ltr">atlas</span> מסדר.</span></p>
          <p className="b-sample">מסך אמיתי מהאפליקציה · נתוני דוגמה</p>
        </div>
        <div className="b-cta-row">
          <button type="button" className="v3-btn indigo cx-cta" onClick={onCta}>שמרו לי מקום</button>
          <p className="b-note">50 המקומות הראשונים מקבלים מחיר מייסדים</p>
        </div>
      </div>
    </header>
  );
}

const SCENES = [
  { img: 'r-laptop', w: 1400, h: 862, alt: 'מחשב נייד עם יומן ההזמנות של atlas', h2: ['כל ההזמנות.', 'יומן אחד.'], p: 'Booking, Airbnb וההזמנות שלכם על לוח אחד.' },
  { img: 'r-voice', w: 640, h: 1342, alt: 'טלפון עם עוזרת הקול של atlas', h2: ['פשוט', 'תגידו את זה.'], p: '״תכיני הזמנה לשירה, שישי עד ראשון.״', narrow: true },
  { img: 'r-ring', w: 1200, h: 570, alt: 'טלפונים במעגל עם מסכי atlas', h2: ['יומן. כסף.', 'וואטסאפ.'], p: 'הכל בטלפון שכבר בכיס.' },
];

export function ScenesB() {
  return (
    <section className="b-scenes" aria-label="מה יש בפנים">
      {SCENES.map((s) => (
        <article key={s.img} className={`b-scene ${s.narrow ? 'narrow' : ''}`} data-rv>
          <h2 className="b-h2"><span>{s.h2[0]}</span><span className="b-lit">{s.h2[1]}</span></h2>
          <p className="b-p">{s.p}</p>
          <figure className="b-fig">
            <i className="b-beam sm" aria-hidden="true" />
            <img src={`${P}${s.img}.webp`} alt={s.alt} width={s.w} height={s.h} loading="lazy" decoding="async" />
          </figure>
        </article>
      ))}
      <p className="b-sample center">מסכים אמיתיים מהאפליקציה · נתוני דוגמה</p>
    </section>
  );
}
