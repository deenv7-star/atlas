/**
 * /early heroes v2: chaos → order. One idea: the many places a host juggles get pulled into atlas.
 *  A "מגנט"  : platform tiles float around a dim phone; scrolling magnetizes them into it, the screen lights up.
 *  B "סערה"  : a storm of notifications piles up; scrolling collapses each into a booking on one calendar.
 * Scroll writes --p (0..1) on the sticky stage (spells.js); CSS maps it to transform/opacity only.
 * Reduced motion: no sticky scrub; a static half-way composition (tiles orbiting a lit phone / calendar with chips).
 */
import { useEffect, useRef } from 'react';
import { PLATFORMS, Glyph, PlatformName } from './platforms';
import { useScrollProgress, useGlow, useMagnet } from './spells';

const UI = '/landing-v8/ui/';

/* tile scatter for A: x/y in half-field units from the field centre, r = deg, z = depth scale */
const SCATTER = [
  [-0.5, -0.8, -7, 1], [0.5, -0.64, 6, 0.94], [-0.36, -0.36, 4, 1], [0.6, -0.08, -9, 0.9],
  [-0.66, 0.1, 8, 0.96], [0.34, 0.3, -5, 1], [-0.44, 0.54, -4, 0.92], [0.58, 0.64, 7, 1],
  [-0.6, 0.88, 5, 0.88], [0.1, 0.9, -6, 0.96], [0.12, -0.7, 3, 0.86], [-0.02, 0.06, 10, 1],
];

function Logo() {
  return (
    <span className="cx-logo">
      <img src="/atlas-logo-white.svg" alt="atlas" width="88" height="28" />
      <span className="cx-sweep" aria-hidden="true" />
    </span>
  );
}

function Cta({ onClick }) {
  const ref = useRef(null);
  useMagnet(ref);
  return <button ref={ref} type="button" className="ew-cta cx-cta" onClick={onClick}><span>שמרו לי מקום</span></button>;
}

function Ordered() {
  return (
    <div className="cx-l2">
      <p className="cx-tag">אתם מארחים. <bdi dir="ltr">atlas</bdi> מסדר.</p>
      <p className="cx-tag-sub"><span>Booking ו-Airbnb נכנסים ליומן לבד.</span> <span>כל השאר, בלחיצה.</span></p>
    </div>
  );
}

function Stage({ variant, wrapRef, stageRef, children, copy, onCta, pill }) {
  useScrollProgress(wrapRef, stageRef);
  useGlow(stageRef);
  return (
    <header className={`cx cx-${variant}`} ref={wrapRef}>
      <div className="cx-stage" ref={stageRef}>
        <div className="cx-glow" aria-hidden="true" />
        <nav className="ew-top cx-top">
          <Logo />
          <span className="ew-soon">בקרוב</span>
        </nav>
        <div className="cx-copy">
          <div className="cx-swap">
            <div className="cx-l1">{copy}</div>
            <Ordered />
          </div>
          <Cta onClick={onCta} />
          {pill}
        </div>
        <div className="cx-field" aria-hidden="true">{children}</div>
        <span className="cx-hint" aria-hidden="true"><i /></span>
      </div>
    </header>
  );
}

export function HeroMagnet({ onCta, pill }) {
  const wrapRef = useRef(null); const stageRef = useRef(null);
  return (
    <Stage
      variant="a" wrapRef={wrapRef} stageRef={stageRef} onCta={onCta} pill={pill}
      copy={(
        <>
          <p className="ew-eyebrow cx-eyebrow">לבעלי צימרים ומתחמי נופש</p>
          <h1 className="cx-h1"><span>כל ההזמנות.</span> <span>מכל מקום.</span> <em>במקום אחד.</em></h1>
        </>
      )}
    >
      <div className="cx-ring" />
      <div className="cx-phone">
        <div className="cx-phone-body">
          <img className="cx-screen" src={`${UI}d-today.webp`} alt="" width="780" height="1688" decoding="async" fetchPriority="high" />
          <img className="cx-core" src="/atlas-mark-white.svg" alt="" width="94" height="46" />
        </div>
      </div>
      {PLATFORMS.map((pl, i) => {
        const [x, y, r, z] = SCATTER[i];
        const st = { '--i': i, '--x': x, '--y': y, '--r': r, '--z': z };
        return (
          <div key={pl.k} className="cx-tile" style={st}>
            <div className="cx-tile-in">
              <span className="cx-g"><Glyph g={pl.g} /></span>
              <span className="cx-t"><b><PlatformName p={pl} /></b><small>{pl.meta}</small></span>
            </div>
          </div>
        );
      })}
      {PLATFORMS.map((pl, i) => {
        const [x, y] = SCATTER[i];
        return [0.05, 0.1].map((lag) => <span key={`${pl.k}${lag}`} className="cx-spark" style={{ '--i': i, '--x': x, '--y': y, '--lag': lag }} />);
      })}
      <p className="cx-sample">מסך אמיתי · נתוני דוגמה</p>
    </Stage>
  );
}

/* ---------- B: notification storm → one calendar ---------- */
const DAYS = 30; const LEAD = 0; // Nov 2026 starts on Sunday
const TARGET_DAYS = [5, 6, 7, 12, 13, 14, 19, 20, 21, 26, 27, 28];
const STORM = [
  [-0.1, 0.02, -6], [0.12, 0.1, 7], [-0.14, 0.19, -3], [0.09, 0.27, 9], [-0.12, 0.36, -8], [0.14, 0.44, 4],
  [-0.06, 0.52, -5], [0.11, 0.6, 8], [-0.13, 0.68, -7], [0.07, 0.76, 3], [-0.09, 0.84, -9], [0.12, 0.93, 5],
];

function useStormTargets(stageRef) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const measure = () => {
      stage.classList.add('cx-measure');
      const cards = stage.querySelectorAll('.cx-note');
      cards.forEach((c) => {
        const day = Number(c.dataset.day);
        const cell = stage.querySelector(`.cx-day[data-d="${day}"] .cx-slot`);
        if (!cell) return;
        const a = c.getBoundingClientRect(); const b = cell.getBoundingClientRect();
        c.style.setProperty('--dx', `${(b.left + b.width / 2 - (a.left + a.width / 2)).toFixed(1)}px`);
        c.style.setProperty('--dy', `${(b.top + b.height / 2 - (a.top + a.height / 2)).toFixed(1)}px`);
        c.style.setProperty('--kx', (b.width / a.width).toFixed(4));
        c.style.setProperty('--ky', (b.height / a.height).toFixed(4));
      });
      stage.classList.remove('cx-measure');
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(stage);
    document.fonts?.ready?.then(measure);
    return () => ro?.disconnect();
  }, [stageRef]);
}

export function HeroStorm({ onCta, pill }) {
  const wrapRef = useRef(null); const stageRef = useRef(null);
  useStormTargets(stageRef);
  const cells = [];
  for (let i = 0; i < LEAD; i += 1) cells.push(<span key={`b${i}`} className="cx-day blank" />);
  for (let d = 1; d <= DAYS; d += 1) {
    cells.push(<span key={d} className={`cx-day ${TARGET_DAYS.includes(d) ? 'has' : ''}`} data-d={d}><i>{d}</i><span className="cx-slot" /></span>);
  }
  return (
    <Stage
      variant="b" wrapRef={wrapRef} stageRef={stageRef} onCta={onCta} pill={pill}
      copy={(
        <>
          <p className="ew-eyebrow cx-eyebrow">לבעלי צימרים ומתחמי נופש</p>
          <h1 className="cx-h1 cx-list">
            <span className="cx-li"><bdi dir="ltr">Booking.</bdi> <bdi dir="ltr">Airbnb.</bdi> וואטסאפ.</span>{' '}
            <span className="cx-li">מחברת. אקסל.</span>{' '}
            <em>הכל במקום אחד.</em>
          </h1>
        </>
      )}
    >
      <div className="cx-cal">
        <div className="cx-cal-head"><b>נובמבר</b><span>כל היחידות · יומן אחד</span></div>
        <div className="cx-cal-wd">{['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((w) => <span key={w}>{w}</span>)}</div>
        <div className="cx-cal-grid">{cells}</div>
      </div>
      {PLATFORMS.map((pl, i) => {
        const [x, y, r] = STORM[i];
        return (
          <div key={pl.k} className="cx-note" data-day={TARGET_DAYS[i]} style={{ '--i': i, '--x': x, '--y': y, '--r': r }}>
            <div className="cx-note-in">
              <span className="cx-note-bg" />
              <span className="cx-note-chip" />
              <span className="cx-note-txt">
                <span className="cx-g"><Glyph g={pl.g} /></span>
                <span className="cx-t"><b><PlatformName p={pl} /></b><small>{pl.meta}</small></span>
                <time>{['23:40', '23:41', '23:44', '23:52', '00:03', '00:07', '00:15', '06:58', '07:12', '07:30', '08:05', '08:09'][i]}</time>
              </span>
            </div>
          </div>
        );
      })}
      <p className="cx-sample">איור · נתוני דוגמה</p>
    </Stage>
  );
}
