/**
 * Onboarding Y1 · "המערכת נבנית מולכם" (03.11.2026).
 * Desktop: the questions on a white glass column, and beside it the owner's own Y3 Today assembling live from
 * their answers (their place photo on the glass, their units as calendar rows, their check-in time in the guest
 * message). Phone: the same Today as a live card on top, the question as a sheet on a card stack under it.
 * Six short questions, smart defaults from the kind, everything skippable but the kind. Then the real saves
 * (same v2 actions as the live flow) light the dashboard up, and the finish lands on /today.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, MessageCircle, RotateCcw, Loader2, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/app/shell/shared';
import { useKeyboardInset, HELP_WA } from '@/components/onboarding/v2/ui';
import { useAnswers } from '@/components/onboarding/v2/useAnswers';
import { useStepHistory } from '@/components/onboarding/v3/shared';
import { applyKind, kindInfo, clampInt, CHANNELS, unitsLabel } from '@/lib/onboarding/v2/model';
import { Ticks, DotGrid } from '@/ui-direction/y/ui';
import Confetti from '@/components/onboarding/Confetti';
import { YC, greeting } from './copy';
import { STEPS, QUESTIONS, kindPhoto, firstName, placeName, unitNamesOf, badLinks, phoneOkOrEmpty, useBuild } from './model';
import { KindPicker, NameField, UnitsFields, ChannelsFields, TimesFields, PhoneField, BuildList } from './parts';
import './y1.css';

const EASE = [0.23, 1, 0.32, 1];
const UNIT_PHOTOS = ['/demo/units/unit-1.webp', '/demo/units/unit-2.webp', '/demo/units/unit-4.webp', '/demo/units/unit-5.webp', '/demo/units/unit-3.webp', '/demo/units/unit-6.webp'];

export default function WizardY1({ user }) {
  useKeyboardInset();
  const [a, update] = useAnswers(user);
  const first = firstName(user);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState('ask'); // ask → build → done
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

  const build = useBuild(user, a, { active: phase !== 'ask' });
  useEffect(() => { if (build.done && phase === 'build') { const t = setTimeout(() => setPhase('done'), reduce ? 0 : 500); return () => clearTimeout(t); } return undefined; }, [build.done, phase, reduce]);

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
  const skip = () => {
    if (q === 'whatsapp') update({ phone: '' });
    go(i + 1);
  };
  const pickKind = (value) => {
    const firstPick = !a.kind;
    update((cur) => applyKind(cur, value));
    setHint('');
    if (firstPick && !reduce) setTimeout(() => go(i + 1), 420);
  };
  useEffect(() => { if (q === 'name') setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 350); }, [q]);

  const k = kindInfo(a.kind || 'zimmer');
  const S = {
    hello: { eyebrow: YC.hello.eyebrow(first), title: YC.hello.title, sub: YC.hello.sub, body: <Hello /> },
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
    enter: (d) => ({ opacity: 0, x: d > 0 ? -28 : 28, filter: 'blur(4px)' }),
    center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.34, ease: EASE } },
    exit: (d) => ({ opacity: 0, x: d > 0 ? 18 : -18, transition: { duration: 0.14, ease: EASE } }),
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="oy-root oy1" dir="rtl" data-version="y1" data-step={phase === 'ask' ? q : phase}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.target.id === 'oy-name' || e.target.id === 'oy-phone')) { e.preventDefault(); next(); } }}>
        <div className="oy1-bg" aria-hidden />
        <div className="oy1-grid">
          {/* questions */}
          <section className="oy1-ask" aria-label="הקמת החשבון">
            <header className="oy1-head">
              {i > 0 && phase === 'ask' ? (
                <button type="button" className="oy-icon oy-press" onClick={() => go(i - 1)} aria-label={YC.common.back}><ArrowRight strokeWidth={1.75} aria-hidden /></button>
              ) : <span className="oy1-logo"><Wordmark size={22} /></span>}
              <div className="oy1-prog" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS} aria-valuenow={phase === 'ask' ? i : QUESTIONS} aria-label={YC.common.of(phase === 'ask' ? i : QUESTIONS, QUESTIONS)}>
                {Array.from({ length: QUESTIONS }, (_, n) => <span key={n}><i style={{ transform: `scaleX(${phase !== 'ask' || n < i ? 1 : 0})` }} /></span>)}
              </div>
              <a href={HELP_WA} target="_blank" rel="noopener noreferrer" className="oy-icon oy-press" aria-label={YC.common.help}><MessageCircle strokeWidth={1.75} aria-hidden /></a>
            </header>

            {/* phone: the live Today card on top of the stack */}
            <div className="oy1-peek"><LiveCard a={a} i={i} phase={phase} first={first} /></div>

            <div className="oy1-sheet">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                {phase === 'ask' ? (
                  <motion.div key={q} className="oy1-q" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" data-screen={q}>
                    {i > 0 ? <p className="oy1-count">{YC.common.of(i, QUESTIONS)}</p> : <p className="oy1-count">{S.eyebrow}</p>}
                    <h1 className="oy1-h1">{S.title}</h1>
                    <p className="oy1-sub">{S.sub}</p>
                    <div className="oy1-body">{S.body}</div>
                  </motion.div>
                ) : (
                  <motion.div key={phase} className="oy1-q" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } }} data-screen={phase}>
                    {phase === 'build' ? (
                      <>
                        <p className="oy1-count">{YC.build.eyebrow}</p>
                        <h1 className="oy1-h1">{YC.build.title}</h1>
                        <div className="oy1-body"><BuildList steps={build.steps} at={build.at} error={build.error} done={build.done} /></div>
                        {build.error ? (
                          <div className="oy-err" role="alert">{YC.build.error}<br /><button type="button" onClick={build.retry}><RotateCcw strokeWidth={1.75} className="h-4 w-4" aria-hidden />{YC.build.retry}</button></div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Done a={a} first={first} />
                        <div className="oy1-body"><BuildList steps={build.steps} at={build.at} done /></div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="oy1-foot">
              {phase === 'ask' ? (
                <>
                  <div className="flex items-center gap-2">
                    {canSkip ? <button type="button" className="oy-ghost oy-press" onClick={skip}>{YC.common.skip}</button> : null}
                    <button type="button" className="oy-primary oy-press flex-1" onClick={i === 0 ? () => go(1) : next} aria-describedby="oy1-hint">
                      {i === 0 ? YC.hello.cta : last ? YC.whatsapp.cta : YC.common.next}<ArrowLeft strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                  <p id="oy1-hint" className="oy-hint" role="status" aria-live="polite">{hint}</p>
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
          </section>

          {/* desktop: their Today, assembling */}
          <aside className="oy1-stage" aria-label={YC.preview.label}>
            <LiveToday a={a} i={i} phase={phase} first={first} />
            {phase === 'done' ? <Confetti className="oy1-confetti" /> : null}
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}

function Hello() {
  return (
    <ul className="oy1-points">
      {YC.hello.points.map((p, n) => (
        <li key={p} style={{ '--i': n }}><Check strokeWidth={2.25} aria-hidden />{p}</li>
      ))}
    </ul>
  );
}

function Done({ a, first }) {
  const linked = !!(String(a.icalBooking || '').trim() || String(a.icalAirbnb || '').trim());
  return (
    <>
      <p className="oy1-count">{placeName(a) || kindInfo(a.kind || 'zimmer').label}</p>
      <h1 className="oy1-h1 is-done">{YC.done.title(first)}</h1>
      <p className="oy1-sub">{linked ? YC.done.subLinked : YC.done.sub}</p>
    </>
  );
}

/* ───────────────────────── the live dashboard ───────────────────────── */

const at = (step) => STEPS.indexOf(step);
function useLive(a, i, phase) {
  const built = phase !== 'ask';
  const seen = (step) => built || i >= at(step);
  const live = (step) => !built && STEPS[i] === step;
  const k = kindInfo(a.kind || 'zimmer');
  const { names, n } = unitNamesOf(a, 4);
  const src = CHANNELS.filter((c) => (a.channels || []).includes(c.value));
  return { built, seen, live, k, names, n, src, name: placeName(a), gmax: clampInt(a.guestsMax, 1, 60) };
}

/** Desktop: a real-scale Y3 Today (glass window, white tiles, photo card, navy side column) built from the answers. */
function LiveToday({ a, i, phase, first }) {
  const L = useLive(a, i, phase);
  const still = useReducedMotion();
  const ready = phase === 'done';
  const pop = still ? {} : { initial: { opacity: 0, y: 16, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: 'spring', stiffness: 260, damping: 26 } };
  const photo = a.kind ? kindPhoto(a.kind) : null;
  return (
    <div className={cn('oy1-win', ready && 'is-ready', phase === 'build' && 'is-building')}>
      <div className="oy1-main">
        <div className="oy1-hello">
          <div className="min-w-0">
            <p className="oy1-hi">{greeting()}{first ? <>, <b>{first}</b></> : null}</p>
            <p className={cn('oy1-hi-sub', L.live('name') && 'is-live')}>
              {L.seen('name') && L.name ? L.name : <Skel w={140} />}
              {a.kind ? <span> · {L.k.label}</span> : null}
            </p>
          </div>
          <span className={cn('oy1-chip', ready && 'is-ready')}>{ready ? <Check strokeWidth={2.5} aria-hidden /> : <i />}{ready ? 'מוכן' : YC.preview.label}</span>
        </div>

        <div className="oy1-tiles">
          <Tile live={L.live('units')} on={L.seen('units')} k={YC.preview.units}>
            <DotGrid total={Math.max(10, Math.min(20, L.n))} on={L.seen('units') ? Math.min(20, L.n) : 0} cols={10} className="oy1-dots" />
            <span className="y-num oy1-n">{L.seen('units') ? L.n : '–'}</span>
          </Tile>
          <Tile live={L.live('units')} on={L.seen('units')} k={YC.preview.guests}>
            <Ticks values={Array.from({ length: 12 }, (_, x) => (L.seen('units') && x < Math.min(12, Math.ceil(L.gmax / 2)) ? 0.35 + ((x * 37) % 60) / 100 : 0))} hot={L.seen('units') ? Math.min(11, Math.ceil(L.gmax / 2) - 1) : -1} height={40} />
            <span className="y-num oy1-n">{L.seen('units') ? <><small>עד</small>{L.gmax}</> : '–'}</span>
          </Tile>
          <Tile live={L.live('times')} on={L.seen('times')} k={YC.preview.checkIn}>
            <span className="oy1-clock" aria-hidden><Clock t={L.seen('times') ? a.checkIn : null} /></span>
            <span className="y-num oy1-n" dir="ltr">{L.seen('times') ? a.checkIn : '–'}</span>
          </Tile>
          <Tile live={L.live('channels')} on={L.seen('channels') && L.src.length > 0} k={YC.preview.sources}>
            <span className="oy1-srcs">{L.src.length ? L.src.slice(0, 3).map((c) => <em key={c.value}>{c.value === 'booking' ? 'Booking' : c.value === 'phone' ? 'טלפון' : c.value === 'portals' ? 'אתרי צימרים' : c.value === 'website' ? 'האתר' : c.value === 'social' ? 'רשתות' : c.label}</em>) : <Skel w={90} />}</span>
            <span className="y-num oy1-n">{L.src.length || '–'}</span>
          </Tile>
        </div>

        <div className="oy1-mid">
          <div className={cn('oy1-photo', L.live('kind') && 'is-live', !photo && 'is-empty')}>
            <AnimatePresence initial={false}>
              {photo ? <motion.img key={photo} src={photo} alt="" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: EASE }} /> : null}
            </AnimatePresence>
            <span className="oy1-photo-shade" />
            <span className="oy1-photo-t">
              <small>{a.kind ? L.k.label : YC.preview.place}</small>
              <b>{L.name || YC.preview.place}</b>
            </span>
            <span className="oy1-photo-s">
              <span><b>{L.seen('units') ? unitsLabel(a.kind || 'zimmer', L.n) : '–'}</b><small>ביומן</small></span>
              <span><b dir="ltr">{L.seen('times') ? `${a.checkIn}` : '–'}</b><small>כניסה</small></span>
            </span>
          </div>
          <div className={cn('oy1-msg', L.live('times') || L.live('whatsapp') ? 'is-live' : '')}>
            <div className="oy1-msg-h"><b>{YC.preview.message}</b><span className="oy1-badge">{YC.common.example}</span></div>
            <p className="oy1-bubble">{L.seen('times') ? YC.preview.msg(L.name || 'מתחם', a.checkIn, a.timesVary) : <><Skel w={180} /><Skel w={120} /></>}</p>
            <p className="oy1-reply"><MessageCircle strokeWidth={1.75} aria-hidden />{YC.preview.replyTo}<b dir="ltr">{L.seen('whatsapp') && a.phone ? a.phone : '—'}</b></p>
          </div>
        </div>
      </div>

      <div className={cn('oy1-side', (L.live('units') || L.live('channels')) && 'is-live')}>
        <Month />
        <p className="oy1-side-h">{YC.preview.calendar}</p>
        <ul className="oy1-units">
          {(L.seen('units') ? L.names : [null, null, null]).map((nm, r) => (
            <motion.li key={`${nm}-${r}`} {...(nm ? pop : {})} transition={{ ...(pop.transition || {}), delay: r * 0.05 }}>
              {nm ? <img src={L.n === 1 && a.kind ? kindPhoto(a.kind) : UNIT_PHOTOS[r % UNIT_PHOTOS.length]} alt="" /> : <span className="oy1-unit-ph" />}
              <span className="min-w-0 flex-1">
                {nm ? <b>{nm}</b> : <Skel w={70} dark />}
                <small>{L.src.length && L.seen('channels') ? L.src.filter((c) => c.value === 'booking' || c.value === 'airbnb').map((c) => (c.value === 'booking' ? 'Booking' : 'Airbnb')).join(' · ') || 'הזמנות ישירות' : YC.preview.empty}</small>
              </span>
            </motion.li>
          ))}
          {L.seen('units') && L.n > L.names.length ? <li className="oy1-units-more">{YC.preview.more(L.n - L.names.length)}</li> : null}
        </ul>
      </div>
    </div>
  );
}

function Tile({ k, live, on, children }) {
  return (
    <div className={cn('oy1-tile', live && 'is-live', !on && 'is-off')}>
      <p className="oy1-tk">{k}</p>
      <div className="oy1-tile-b">{children}</div>
    </div>
  );
}

function Skel({ w = 100, dark = false }) {
  return <span className={cn('oy1-skel', dark && 'is-dark')} style={{ width: w }} aria-hidden />;
}

/** A small clock face pointing at the check-in hour. */
function Clock({ t }) {
  const h = t ? Number(String(t).split(':')[0]) % 12 : 0;
  const ang = (h / 12) * 360;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(27,38,86,.12)" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, x) => <line key={x} x1="22" y1="5" x2="22" y2={x % 3 ? 7 : 8.5} stroke="rgba(27,38,86,.3)" strokeWidth="1.5" transform={`rotate(${x * 30} 22 22)`} />)}
      <line x1="22" y1="22" x2="22" y2="11" stroke={t ? '#3E2BF1' : 'rgba(27,38,86,.2)'} strokeWidth="2.5" strokeLinecap="round" style={{ transform: `rotate(${ang}deg)`, transformOrigin: '22px 22px', transition: 'transform .8s cubic-bezier(.34,1.56,.64,1)' }} />
      <circle cx="22" cy="22" r="2.5" fill="#1B2656" />
    </svg>
  );
}

/** This month, real dates, today ringed. */
function Month() {
  const d0 = new Date();
  const y = d0.getFullYear(); const m = d0.getMonth();
  const startDow = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(startDow).fill(null), ...Array.from({ length: days }, (_, x) => x + 1)];
  return (
    <div className="oy1-cal">
      <p className="oy1-cal-h"><CalendarDays strokeWidth={1.75} aria-hidden />{d0.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</p>
      <div className="oy1-cal-g">
        {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map((x) => <b key={x}>{x}</b>)}
        {cells.map((c, x) => <span key={x} className={cn(c === d0.getDate() && 'is-today')}>{c || ''}</span>)}
      </div>
    </div>
  );
}

/** Phone: the same Today as one live card (photo, name, three numbers, sources). */
function LiveCard({ a, i, phase, first }) {
  const L = useLive(a, i, phase);
  const photo = a.kind ? kindPhoto(a.kind) : '/demo/shell-bg-m.webp';
  const ready = phase === 'done';
  return (
    <div className={cn('oy1-card', ready && 'is-ready')} aria-hidden>
      <AnimatePresence initial={false}>
        <motion.img key={photo} src={photo} alt="" className="oy1-card-img" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: EASE }} />
      </AnimatePresence>
      <span className="oy1-card-shade" />
      <div className="oy1-card-top">
        <span className="min-w-0">
          <small>{greeting()}{first ? `, ${first}` : ''}</small>
          <b className={cn(L.live('name') && 'is-live')}>{L.name || (a.kind ? L.k.label : YC.preview.place)}</b>
        </span>
        <span className={cn('oy1-chip is-sm', ready && 'is-ready')}>{ready ? <Check strokeWidth={2.5} /> : <i />}{ready ? 'מוכן' : 'תצוגה חיה'}</span>
      </div>
      <div className="oy1-card-stats">
        <span className={cn(L.live('units') && 'is-live')}><b className="y-num">{L.seen('units') ? L.n : '–'}</b><small>{YC.preview.units}</small></span>
        <span className={cn(L.live('units') && 'is-live')}><b className="y-num">{L.seen('units') ? L.gmax : '–'}</b><small>{YC.preview.guests}</small></span>
        <span className={cn(L.live('times') && 'is-live')}><b className="y-num" dir="ltr">{L.seen('times') ? a.checkIn : '–'}</b><small>{YC.preview.checkIn}</small></span>
        <span className={cn(L.live('channels') && 'is-live')}><b className="y-num">{L.seen('channels') ? L.src.length : '–'}</b><small>מקורות</small></span>
      </div>
    </div>
  );
}
