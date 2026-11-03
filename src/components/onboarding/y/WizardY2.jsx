/**
 * Onboarding Y2 · "קולנוע" (03.11.2026). One question per screen over a full-bleed zimmer photo that changes
 * with every step (slow push-in, crossfade), on one frosted glass card with big thin type. Their place name is
 * written large across the photo as they type it, and what they answered collects as glass chips on the photo.
 * Phone: the photo on top, the glass card as a sheet. Same six questions, smart defaults and real saves as Y1;
 * the finish shows their setup as Y3 tiles and lands on /today.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MessageCircle, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/app/shell/shared';
import { useKeyboardInset, HELP_WA } from '@/components/onboarding/v2/ui';
import { useAnswers } from '@/components/onboarding/v2/useAnswers';
import { useStepHistory } from '@/components/onboarding/v3/shared';
import { applyKind, kindInfo, clampInt, UNITS_LIMIT, CHANNELS, unitsLabel } from '@/lib/onboarding/v2/model';
import { DotGrid, Ticks } from '@/ui-direction/y/ui';
import Confetti from '@/components/onboarding/Confetti';
import { YC } from './copy';
import { STEPS, QUESTIONS, kindPhoto, firstName, placeName, badLinks, phoneOkOrEmpty, useBuild } from './model';
import { KindPicker, NameField, UnitsFields, ChannelsFields, TimesFields, PhoneField, BuildList } from './parts';
import './y2.css';

const EASE = [0.23, 1, 0.32, 1];
const PHOTOS = { hello: '/demo/welcome.webp', kind: '/demo/complex-pool.webp', units: '/demo/units/unit-1.webp', channels: '/demo/units/unit-5.webp', times: '/demo/units/unit-2.webp', whatsapp: '/demo/units/unit-4.webp' };
const SRC_SHORT = { phone: 'טלפון', booking: 'Booking', airbnb: 'Airbnb', portals: 'אתרי צימרים', website: 'האתר', social: 'רשתות' };

export default function WizardY2({ user }) {
  useKeyboardInset();
  const [a, update] = useAnswers(user);
  const first = firstName(user);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState('ask');
  const [dir, setDir] = useState(1);
  const [hint, setHint] = useState('');
  const [nudge, setNudge] = useState(0);
  const [more, setMore] = useState(false);
  const groupRef = useRef(null);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const i = Math.max(0, Math.min(STEPS.length - 1, Number(a.ystep) || 0));
  const q = STEPS[i];

  const setStep = useCallback((to, fromPop = false) => {
    setHint('');
    if (fromPop) setDir(-1);
    update({ ystep: Math.max(0, Math.min(STEPS.length - 1, to)) });
    window.scrollTo({ top: 0 });
  }, [update]);
  useStepHistory(i, setStep);

  const build = useBuild(user, a, { active: phase !== 'ask', stepMs: 1000 });
  useEffect(() => { if (build.done && phase === 'build') { const t = setTimeout(() => setPhase('done'), reduce ? 0 : 600); return () => clearTimeout(t); } return undefined; }, [build.done, phase, reduce]);

  const go = (to) => {
    if (to >= STEPS.length) { setPhase('build'); window.scrollTo({ top: 0 }); return; }
    setDir(to > i ? 1 : -1);
    setStep(to);
  };
  const next = () => {
    if (q === 'kind' && !a.kind) { setHint(YC.kind.hint); setNudge((x) => x + 1); groupRef.current?.querySelector('[role=radio]')?.focus(); return; }
    if (q === 'channels') {
      const bad = badLinks(a);
      if (bad.length) { setHint(YC.channels.badLink(bad[0] === 'booking' ? 'Booking.com' : 'Airbnb')); document.getElementById(`oy-link-${bad[0]}`)?.focus(); return; }
    }
    if (q === 'whatsapp' && !phoneOkOrEmpty(a.phone)) { setHint(YC.whatsapp.bad); phoneRef.current?.focus(); return; }
    go(i + 1);
  };
  const skip = () => { if (q === 'whatsapp') update({ phone: '' }); go(i + 1); };
  const pickKind = (value) => {
    const firstPick = !a.kind;
    update((cur) => applyKind(cur, value));
    setHint('');
    if (firstPick && !reduce) setTimeout(() => go(i + 1), 520);
  };
  useEffect(() => { if (q === 'name') setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 400); }, [q]);

  const k = kindInfo(a.kind || 'zimmer');
  const photo = phase !== 'ask' || q === 'name' ? kindPhoto(a.kind || 'zimmer') : PHOTOS[q];
  const S = {
    hello: { eyebrow: YC.hello.eyebrow(first), title: YC.hello.title, sub: YC.hello.sub, body: null },
    kind: { title: YC.kind.title, sub: YC.kind.sub, body: <KindPicker a={a} onPick={pickKind} more={more} setMore={setMore} groupRef={groupRef} nudge={nudge} layout="list" /> },
    name: { title: YC.name.title(a.kind), sub: YC.name.sub, body: <NameField a={a} update={update} inputRef={nameRef} big /> },
    units: { title: YC.units.title(k), sub: YC.units.sub, body: <UnitsFields a={a} update={update} /> },
    channels: { title: YC.channels.title, sub: YC.channels.sub, body: <ChannelsFields a={a} update={update} onEdit={() => setHint('')} /> },
    times: { title: YC.times.title, sub: YC.times.sub, body: <TimesFields a={a} update={update} /> },
    whatsapp: { title: YC.whatsapp.title, sub: YC.whatsapp.sub, body: <PhoneField a={a} update={(p) => { setHint(''); update(p); }} inputRef={phoneRef} /> },
  }[q];
  const last = i === STEPS.length - 1;
  const canSkip = ['name', 'channels', 'times', 'whatsapp'].includes(q);
  const variants = {
    enter: (d) => ({ opacity: 0, y: d > 0 ? 26 : -18, filter: 'blur(6px)' }),
    center: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.46, ease: EASE } },
    exit: (d) => ({ opacity: 0, y: d > 0 ? -14 : 14, filter: 'blur(4px)', transition: { duration: 0.18, ease: EASE } }),
  };
  const shown = phase === 'ask' ? i : QUESTIONS;

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn('oy-root oy-glass oy2', i === 0 && phase === 'ask' && 'is-hello', phase !== 'ask' && `is-${phase}`)} dir="rtl" data-version="y2" data-step={phase === 'ask' ? q : phase}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.target.id === 'oy-name' || e.target.id === 'oy-phone')) { e.preventDefault(); next(); } }}>
        {/* the photo */}
        <div className="oy2-photo" aria-hidden>
          <AnimatePresence initial={false}>
            <motion.img key={photo} src={photo} alt="" initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1.02, transition: { opacity: { duration: 0.9, ease: EASE }, scale: { duration: 9, ease: 'linear' } } }} exit={{ opacity: 0, transition: { duration: 0.9 } }} />
          </AnimatePresence>
          <span className="oy2-shade" />
        </div>

        {/* across the photo: their name, big, and what they answered */}
        <div className="oy2-over" aria-hidden>
          <OverTitle a={a} q={q} phase={phase}><Chips a={a} i={i} phase={phase} /></OverTitle>
        </div>

        <header className="oy2-head">
          {i > 0 && phase === 'ask' ? (
            <button type="button" className="oy2-gb oy-press" onClick={() => go(i - 1)} aria-label={YC.common.back}><ArrowRight strokeWidth={1.75} aria-hidden /></button>
          ) : <span className="oy2-logo"><Wordmark size={22} inverted /></span>}
          <div className="oy2-line" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS} aria-valuenow={shown} aria-label={YC.common.of(shown, QUESTIONS)}>
            <i style={{ transform: `scaleX(${shown / QUESTIONS})` }} />
          </div>
          <a href={HELP_WA} target="_blank" rel="noopener noreferrer" className="oy2-gb oy-press" aria-label={YC.common.help}><MessageCircle strokeWidth={1.75} aria-hidden /></a>
        </header>

        <section className="oy2-card" aria-label="הקמת החשבון">
          <div className="oy2-scroll">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              {phase === 'ask' ? (
                <motion.div key={q} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" data-screen={q}>
                  <p className="oy2-step">
                    {i > 0 ? <><b className="y-num">{String(i).padStart(2, '0')}</b><span>/ {String(QUESTIONS).padStart(2, '0')}</span></> : <span className="oy2-eyebrow">{S.eyebrow}</span>}
                  </p>
                  <h1 className="oy2-h1">{S.title}</h1>
                  <p className="oy2-sub">{S.sub}</p>
                  {S.body ? <div className="oy2-body">{S.body}</div> : <HelloPoints />}
                </motion.div>
              ) : phase === 'build' ? (
                <motion.div key="build" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }} data-screen="build">
                  <BuildRing at={build.at} total={build.steps.length} />
                  <h1 className="oy2-h1 is-c">{YC.build.title}</h1>
                  <div className="oy2-body"><BuildList steps={build.steps} at={build.at} error={build.error} done={build.done} tone="glass" /></div>
                  {build.error ? <div className="oy-err" role="alert">{YC.build.error}<br /><button type="button" onClick={build.retry}><RotateCcw strokeWidth={1.75} className="h-4 w-4" aria-hidden />{YC.build.retry}</button></div> : null}
                </motion.div>
              ) : (
                <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }} data-screen="done">
                  <p className="oy2-step"><span className="oy2-eyebrow">{placeName(a) || k.label}</span></p>
                  <h1 className="oy2-h1">{YC.done.title(first)}</h1>
                  <p className="oy2-sub">{String(a.icalBooking || a.icalAirbnb || '').trim() ? YC.done.subLinked : YC.done.sub}</p>
                  <DoneTiles a={a} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="oy2-foot">
            {phase === 'ask' ? (
              <>
                <div className="flex items-center gap-2">
                  {canSkip ? <button type="button" className="oy-ghost oy-press" onClick={skip}>{YC.common.skip}</button> : null}
                  <button type="button" className="oy-primary oy-press flex-1" onClick={i === 0 ? () => go(1) : next} aria-describedby="oy2-hint">
                    {i === 0 ? YC.hello.cta : last ? YC.whatsapp.cta : YC.common.next}<ArrowLeft strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
                <p id="oy2-hint" className="oy-hint" role="status" aria-live="polite">{hint}</p>
              </>
            ) : phase === 'build' ? (
              <button type="button" className="oy-primary w-full" disabled aria-disabled><Loader2 strokeWidth={1.75} className="oy-rot" aria-hidden />בונים…</button>
            ) : (
              <div className="flex flex-col gap-2 lg:flex-row">
                <button type="button" className="oy-primary oy-press flex-1" onClick={() => window.location.replace('/today')}>{YC.done.cta}<ArrowLeft strokeWidth={1.75} aria-hidden /></button>
                <button type="button" className="oy-ghost oy-press" onClick={() => window.location.replace('/setup')}>{YC.done.setup}</button>
              </div>
            )}
          </footer>
          {phase === 'done' ? <Confetti className="oy2-confetti" /> : null}
        </section>
      </div>
    </MotionConfig>
  );
}

function HelloPoints() {
  return (
    <ol className="oy2-points">
      {YC.hello.points.map((p, n) => <li key={p} style={{ '--i': n }}><b className="y-num">{n + 1}</b>{p}</li>)}
    </ol>
  );
}

/** The big line across the photo: the place name as it is typed, otherwise the moment. */
function OverTitle({ a, q, phase, children }) {
  const name = placeName(a);
  const k = kindInfo(a.kind || 'zimmer');
  let small = ''; let big = '';
  if (phase !== 'ask') { small = phase === 'done' ? 'מוכן' : 'נבנה עכשיו'; big = name || k.label; }
  else if (q === 'hello') { small = 'atlas'; big = 'כל ההזמנות. יומן אחד.'; }
  else if (q === 'kind') { small = 'המתחם שלכם'; big = a.kind ? k.label : 'צימר, וילה או מתחם'; }
  else { small = a.kind ? k.label : 'המתחם שלכם'; big = name || (q === 'name' ? YC.name.placeholder(a.kind).replace('למשל: ', '') : k.label); }
  const ghost = q === 'name' && !name && phase === 'ask';
  return (
    <div className="oy2-title">
      {children}
      <small>{small}</small>
      <b className={cn(ghost && 'is-ghost')} dir="auto">{big}</b>
    </div>
  );
}

/** What they answered so far, as glass chips on the photo (desktop). */
function Chips({ a, i, phase }) {
  const all = phase !== 'ask';
  const seen = (s) => all || i > STEPS.indexOf(s);
  const k = kindInfo(a.kind || 'zimmer');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const src = CHANNELS.filter((c) => (a.channels || []).includes(c.value)).map((c) => SRC_SHORT[c.value]);
  const items = [
    seen('kind') && a.kind ? { id: 'kind', k: 'סוג', v: k.label } : null,
    seen('units') ? { id: 'units', k: 'יחידות', v: unitsLabel(a.kind || 'zimmer', n) } : null,
    seen('units') ? { id: 'guests', k: 'אורחים', v: `עד ${clampInt(a.guestsMax, 1, 60)}` } : null,
    seen('channels') && src.length ? { id: 'src', k: 'הזמנות מ-', v: src.join(' · ') } : null,
    seen('times') ? { id: 'times', k: 'כניסה · יציאה', v: `${a.checkIn} · ${a.checkOut}` } : null,
    seen('whatsapp') && a.phone ? { id: 'wa', k: 'וואטסאפ', v: a.phone } : null,
  ].filter(Boolean);
  return (
    <ul className="oy2-chips">
      <AnimatePresence initial={false}>
        {items.map((x) => (
          <motion.li key={x.id} layout initial={{ opacity: 0, y: 16, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
            <small>{x.k}</small><b dir="auto">{x.v}</b>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function BuildRing({ at, total }) {
  const p = total ? Math.min(1, at / total) : 0;
  const r = 34; const c = 2 * Math.PI * r;
  return (
    <div className="oy2-ring" aria-hidden>
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(27,38,86,.1)" strokeWidth="5" />
        <circle cx="42" cy="42" r={r} fill="none" stroke="#3E2BF1" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 42 42)" style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.23,1,.32,1)' }} />
      </svg>
      <b className="y-num">{Math.round(p * 100)}<small>%</small></b>
    </div>
  );
}

/** The finish: their setup as Y3 tiles, the same faces they will see on Today. */
function DoneTiles({ a }) {
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const g = clampInt(a.guestsMax, 1, 60);
  const src = CHANNELS.filter((c) => (a.channels || []).includes(c.value));
  return (
    <div className="oy2-tiles">
      <div className="oy2-tile"><p>{YC.preview.units}</p><DotGrid total={10} on={Math.min(10, n)} cols={10} /><b className="y-num">{n}</b></div>
      <div className="oy2-tile"><p>{YC.preview.guests}</p><Ticks values={Array.from({ length: 10 }, (_, x) => (x < Math.min(10, Math.ceil(g / 3)) ? 0.4 + ((x * 29) % 55) / 100 : 0))} hot={Math.min(9, Math.ceil(g / 3) - 1)} height={30} /><b className="y-num"><small>עד</small>{g}</b></div>
      <div className="oy2-tile"><p>{YC.preview.checkIn}</p><span className="oy2-tile-l">יציאה {a.checkOut}</span><b className="y-num" dir="ltr">{a.checkIn}</b></div>
      <div className="oy2-tile"><p>מקורות</p><span className="oy2-tile-l">{src.slice(0, 2).map((c) => SRC_SHORT[c.value]).join(' · ') || 'נחבר בהמשך'}</span><b className="y-num">{src.length}</b></div>
    </div>
  );
}
