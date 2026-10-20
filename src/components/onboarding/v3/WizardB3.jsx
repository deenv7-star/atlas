/**
 * Onboarding v3, version B: three screens, then the building moment.
 *   1. the place: kind + name on one screen ("מה סוג המתחם שלכם?").
 *   2. where bookings come from; ticking Booking.com or Airbnb opens a field for its calendar (iCal) link,
 *      checked the moment it is pasted, with "איפה מוצאים את הקישור?" (the same steps as the setup journey).
 *   3. "זה נראה נכון?": everything we filled for them (units, guests, times from the kind's defaults),
 *      each editable in place, plus trial / plan. Then build.
 * Units / guests / times are not separate questions: the kind gives sensible defaults and the review lets
 * the owner fix them in one tap. Links go to the first unit; the rest are added in the setup journey.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/app/shell/shared';
import { Primary, Ghost } from '@/components/onboarding/kit';
import {
  KINDS, MORE_KINDS, kindInfo, applyKind, CHECKIN_TIMES, CHECKOUT_TIMES, CHANNELS,
  guestsLabel, clampInt, UNITS_LIMIT, unitsLabel, checkIcalLink,
} from '@/lib/onboarding/v2/model';
import { useKeyboardInset, HelpLink, Count, GuestRange, SwitchRow, TimeChips } from '@/components/onboarding/v2/ui';
import PlanPick from '@/components/onboarding/v2/PlanPick';
import { useAnswers } from '@/components/onboarding/v2/useAnswers';
import BuildMoment from '@/components/onboarding/v2/BuildMoment';
import { LinkField } from '@/components/onboarding/v2/setup/SetupJourney';
import { GUIDES, GuidePic } from '@/components/onboarding/v2/setup/guides';
import { COPY } from './copy';
import { useStepHistory, SavedTick, kindPhoto } from './shared';
import { PreviewCard } from './WizardA3';
import { linksFromAnswers } from './linksB';

const EASE = [0.23, 1, 0.32, 1];
export const STEPS_B = ['place', 'channels', 'review'];
const LINKABLE = { booking: 'BOOKING_COM', airbnb: 'AIRBNB' };

export default function WizardB3({ user, again = false }) {
  useKeyboardInset();
  const [a, update] = useAnswers(user);
  const [dir, setDir] = useState(1);
  const [building, setBuilding] = useState(false);
  const [more, setMore] = useState(() => MORE_KINDS.some((m) => m.value === a.kind));
  const [hint, setHint] = useState('');
  const [nudge, setNudge] = useState(0);
  const groupRef = useRef(null);
  const nameRef = useRef(null);
  const reduce = useReducedMotion();
  const i = Math.max(0, Math.min(STEPS_B.length - 1, Number(a.step) || 0));
  const q = STEPS_B[i];
  const C = COPY;
  const B = COPY.b;

  const setStep = useCallback((to, fromPop = false) => {
    setHint('');
    if (fromPop) setDir(-1);
    update({ step: Math.max(0, Math.min(STEPS_B.length - 1, to)) });
    window.scrollTo({ top: 0 });
  }, [update]);
  useStepHistory(i, setStep);

  const go = (to) => {
    if (to >= STEPS_B.length) { setBuilding(true); window.scrollTo({ top: 0 }); return; }
    setDir(to > i ? 1 : -1);
    setStep(to);
  };

  const bad = (q === 'channels' ? ['booking', 'airbnb'] : []).filter((c) => {
    const v = c === 'booking' ? a.icalBooking : a.icalAirbnb;
    return (a.channels || []).includes(c) && String(v || '').trim() && !checkIcalLink(LINKABLE[c], v).ok;
  });

  const next = () => {
    if (q === 'place' && !a.kind) {
      setHint(B.place.nameHint); setNudge((x) => x + 1);
      groupRef.current?.querySelector('[role=radio]')?.focus();
      return;
    }
    if (bad.length) {
      setHint(B.channels.badLink(bad[0] === 'booking' ? 'Booking.com' : 'Airbnb'));
      document.getElementById(`ob3-link-${bad[0]}`)?.focus();
      return;
    }
    go(i + 1);
  };

  const pickKind = (value) => {
    const first = !a.kind;
    update((cur) => applyKind(cur, value));
    setHint('');
    if (first) setTimeout(() => nameRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), 80);
  };

  if (building) {
    const answers = { ...a, kind: a.kind || 'zimmer', links: linksFromAnswers(a) };
    return <BuildMoment user={user} answers={answers} tone="a"
      onSetup={() => window.location.replace('/setup')} onApp={() => window.location.replace('/today')} />;
  }

  const k = kindInfo(a.kind || 'zimmer');
  const screens = {
    place: {
      title: B.place.title,
      sub: B.place.sub,
      body: (
        <div className="flex flex-col gap-3">
          <div ref={groupRef} key={nudge} role="radiogroup" aria-label={C.kind.group} aria-describedby={hint ? 'ob3-hint' : undefined}
            className={cn('flex flex-col gap-3', nudge && 'ob3-nudge')}>
            {KINDS.map((t) => {
              const on = a.kind === t.value;
              return (
                <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => pickKind(t.value)} className="ob3-kind is-compact ob-press">
                  <span className="relative block h-[64px] w-[76px] shrink-0 overflow-hidden rounded-[14px] bg-[#E9ECF4]">
                    <img src={kindPhoto(t.value)} alt="" className="h-full w-full object-cover" draggable={false} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="ob3-kind-label">{t.label}</span>
                    <span className="ob3-kind-line">{t.line}</span>
                  </span>
                  <span className={cn('ob2-radio', on && 'is-on')} aria-hidden>{on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}</span>
                </button>
              );
            })}
          </div>
          <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="ob-press flex min-h-[48px] items-center gap-2 self-start rounded-full px-3 text-[17px] font-bold text-brand-700">
            {C.kind.more}<ChevronDown className={cn('h-4 w-4 transition-transform duration-200', more && 'rotate-180')} aria-hidden />
          </button>
          {more ? (
            <div role="radiogroup" aria-label={C.kind.moreGroup} className="ob3-fade grid grid-cols-2 gap-2">
              {MORE_KINDS.map((t) => (
                <button key={t.value} type="button" role="radio" aria-checked={a.kind === t.value} onClick={() => pickKind(t.value)} className="ob2-chip ob-press !text-[17px]">{t.label}</button>
              ))}
            </div>
          ) : null}
          {a.kind ? (
            <div ref={nameRef} className="ob3-fade mt-3 flex flex-col gap-2">
              <label htmlFor="ob3-name" className="text-[20px] font-extrabold text-navy-900">{C.name.title(a.kind)}</label>
              <input id="ob3-name" className="ob-input !min-h-[60px] !text-[20px] !font-bold" value={a.name} maxLength={50} autoComplete="organization" enterKeyHint="next"
                placeholder={C.name.placeholder(a.kind)} onChange={(e) => update({ name: e.target.value })} aria-describedby="ob3-name-line" />
              <p id="ob3-name-line" className="text-[15px] text-ink-400">{C.name.empty}</p>
            </div>
          ) : null}
        </div>
      ),
    },
    channels: {
      title: B.channels.title,
      sub: B.channels.sub,
      body: (
        <div className="flex flex-col gap-4">
          <div role="group" aria-label={C.channels.group} className="flex flex-wrap gap-2.5">
            {CHANNELS.map((c) => {
              const on = (a.channels || []).includes(c.value);
              return (
                <button key={c.value} type="button" role="checkbox" aria-checked={on} onClick={() => { setHint(''); update((cur) => ({ channels: on ? cur.channels.filter((v) => v !== c.value) : [...(cur.channels || []), c.value] })); }}
                  className="ob2-option ob-press !min-h-[56px] !w-auto !gap-3 !rounded-full !py-2.5 !pe-5 !ps-3">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border-2 transition-colors', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#CBD0E0]')} aria-hidden>{on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}</span>
                  <span className="whitespace-nowrap text-[17px] font-bold text-navy-900">{c.label}</span>
                </button>
              );
            })}
          </div>
          {['booking', 'airbnb'].filter((c) => (a.channels || []).includes(c)).map((c) => (
            <LinkCard key={c} channel={c} a={a} k={k} update={update} onEdit={() => setHint('')} />
          ))}
        </div>
      ),
    },
    review: {
      title: B.review.title,
      sub: B.review.sub,
      body: <Review a={a} update={update} onJump={go} />,
    },
  };
  const S = screens[q];
  const last = q === 'review';
  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? -24 : 24 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
    exit: (d) => ({ opacity: 0, x: d > 0 ? 16 : -16, transition: { duration: 0.14, ease: EASE } }),
  };
  const progressLabel = C.common.progress(i + 1, STEPS_B.length);

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob2 ob3 flex lg:flex-row" dir="rtl" data-version="b3"
        onKeyDown={(e) => { if (e.key === 'Enter' && e.target.id === 'ob3-name') { e.preventDefault(); next(); } }}>
        <div className="relative flex min-h-[100dvh] w-full flex-col lg:w-[600px] lg:shrink-0">
          <header className="ob2-head is-col flex items-center gap-3 px-4 pb-3 md:px-8">
            {i > 0 ? <Ghost onClick={() => go(i - 1)} aria-label={C.common.back} className="!h-12 !w-12 !px-0"><ArrowRight className="h-6 w-6" aria-hidden /></Ghost>
              : <span className="flex h-12 items-center ps-1"><Wordmark size={20} /></span>}
            <div className="ob3-steps" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS_B.length} aria-valuenow={i + 1} aria-label={progressLabel}>
              {STEPS_B.map((s, n) => <span key={s} className={cn(n <= i && 'is-on')} />)}
            </div>
            <SavedTick stamp={JSON.stringify([a.kind, a.name, a.unitCount, a.guestsMin, a.guestsMax, a.guestsVary, a.checkIn, a.checkOut, a.timesVary, a.channels, a.icalBooking, a.icalAirbnb, a.plan])} />
            <HelpLink compact />
          </header>
          <div className="ob2-head-space" aria-hidden />

          <main className="flex-1 overflow-x-clip px-5 pb-[calc(150px+env(safe-area-inset-bottom))] pt-2 md:px-8 lg:pt-10">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.section key={q} data-screen={q} custom={dir} variants={variants} initial="enter" animate="center" exit="exit">
                <p className="text-[15px] font-bold text-brand-600">{progressLabel}</p>
                <h1 className="mt-1 text-[32px] font-extrabold leading-[1.12] tracking-[-0.02em] text-navy-900 md:text-[40px]">{S.title}</h1>
                <p className="mb-6 mt-2 text-[18px] leading-relaxed text-ink-600">{S.sub}</p>
                {S.body}
              </motion.section>
            </AnimatePresence>
          </main>

          <footer className="ob2-bar is-col">
            <div className="flex items-center gap-2">
              {q === 'channels' ? <Ghost onClick={() => go(i + 1)} className="shrink-0">{C.common.skip}</Ghost> : null}
              <Primary className="flex-1" onClick={next} aria-describedby={hint ? 'ob3-hint' : undefined}>
                {last ? C.start.cta : C.common.next}<ArrowLeft className="h-5 w-5" aria-hidden />
              </Primary>
            </div>
            <p id="ob3-hint" className="ob3-hint mt-1.5" role="status" aria-live="polite">{hint}</p>
          </footer>
        </div>

        <aside className="ob2-aside hidden p-5 lg:block" aria-label={C.preview.label}>
          <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[32px] bg-[#E4E1FD]/55 p-10">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,43,241,0.14),rgba(62,43,241,0))]" aria-hidden />
            <p className="relative mb-4 text-[14px] font-bold text-brand-700">{C.preview.label}</p>
            <PreviewCard a={a} at={a.kind ? 3 : 0} />
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}

/** Booking.com / Airbnb: the calendar link field (checked on paste) and the "where is it" guide. */
function LinkCard({ channel, a, k, update, onEdit }) {
  const provider = LINKABLE[channel];
  const G = GUIDES[provider];
  const B = COPY.b.channels;
  const key = channel === 'booking' ? 'icalBooking' : 'icalAirbnb';
  const value = a[key] || '';
  const [open, setOpen] = useState(false);
  const check = useMemo(() => checkIcalLink(provider, value), [provider, value]);
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  return (
    <section className="ob3-fade ob2-card flex flex-col gap-3 p-4" aria-labelledby={`ob3-link-${channel}-h`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`ob3-link-${channel}-h`} className="text-[18px] font-extrabold text-navy-900">{G.name}</h2>
        <span className="text-[14px] font-semibold text-ink-400">{B.optional}</span>
      </div>
      <p className="-mt-2 text-[15px] leading-snug text-ink-600">{n > 1 ? B.firstUnit(k.unit) : B.linkLine}</p>
      <LinkField id={`ob3-link-${channel}`} label={B.linkLabel(G.short)} value={value} check={check} connected={false}
        onChange={(v) => { onEdit(); update({ [key]: v }); }} />
      <button type="button" aria-expanded={open} aria-controls={`ob3-guide-${channel}`} onClick={() => setOpen((o) => !o)}
        className="ob-press -mt-1 flex min-h-[48px] items-center gap-2 self-start rounded-full px-1 text-[16px] font-bold text-brand-700">
        {B.where}<ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div id={`ob3-guide-${channel}`} className="ob3-fade flex flex-col gap-5">
          <a href={G.open.href} target="_blank" rel="noopener noreferrer" className="ob-press flex min-h-[56px] items-center justify-between gap-3 rounded-[16px] bg-navy-900 px-5 text-[16px] font-bold text-white">
            {G.open.label}<ExternalLink className="h-5 w-5" aria-hidden />
          </a>
          <p className="-mt-3 text-[14px] text-ink-400">{B.guideNote}</p>
          <ol className="flex flex-col gap-5" aria-label={`${B.where} ${G.name}`}>
            {G.steps.map((s, i) => (
              <li key={s.pic} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[16px] font-extrabold text-white" aria-hidden>{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-[17px] font-extrabold leading-snug text-navy-900">{s.title}</p>
                    <p className="mt-0.5 text-[13px] font-medium text-ink-400" dir="ltr" style={{ textAlign: 'right' }}>{s.en}</p>
                    <p className="mt-1 text-[16px] leading-relaxed text-ink-600">{s.text}</p>
                  </div>
                </div>
                <GuidePic pic={s.pic} n={i + 1} />
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

/** "זה נראה נכון?": what we filled, each row editable in place. */
function Review({ a, update, onJump }) {
  const R = COPY.b.review;
  const k = kindInfo(a.kind || 'zimmer');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const [edit, setEdit] = useState('');
  const toggle = (id) => setEdit((e) => (e === id ? '' : id));
  const ch = CHANNELS.filter((c) => (a.channels || []).includes(c.value)).map((c) => c.label).join(', ');
  const linked = linksFromAnswers(a).map((l) => (l.provider === 'AIRBNB' ? 'Airbnb' : 'Booking'));
  const timesValue = COPY.review.timesValue(a);
  return (
    <div className="flex flex-col gap-6">
      <section aria-label={R.title} className="ob2-card overflow-hidden">
        <ReviewRow open={edit} onToggle={toggle} id="place" label={R.place} value={a.name.trim() ? `${a.name.trim()} · ${k.label}` : k.label} onEdit={() => onJump(0)} />
        <ReviewRow open={edit} onToggle={toggle} id="units" label={R.units} value={unitsLabel(a.kind || 'zimmer', n)}>
          <Count value={n} min={1} max={UNITS_LIMIT} onChange={(v) => update({ unitCount: v })} label={COPY.units.count(k)} />
        </ReviewRow>
        <ReviewRow open={edit} onToggle={toggle} id="guests" label={R.guests} value={guestsLabel(a)}>
          <div className="flex flex-col gap-3">
            <GuestRange min={clampInt(a.guestsMin, 1, 60)} max={clampInt(a.guestsMax, 1, 60)} disabled={a.guestsVary} onChange={([lo, hi]) => update({ guestsMin: lo, guestsMax: hi })} />
            <SwitchRow checked={!!a.guestsVary} onChange={(v) => update({ guestsVary: v })} label={COPY.units.vary(n)} line={COPY.units.varyLine} />
          </div>
        </ReviewRow>
        <ReviewRow open={edit} onToggle={toggle} id="times" label={R.times} value={timesValue}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><p className="text-[16px] font-bold text-navy-900">{COPY.times.in}</p><TimeChips label={COPY.times.inGroup} options={CHECKIN_TIMES} value={a.checkIn} onChange={(v) => update({ checkIn: v })} /></div>
            <div className="flex flex-col gap-2"><p className="text-[16px] font-bold text-navy-900">{COPY.times.out}</p><TimeChips label={COPY.times.outGroup} options={CHECKOUT_TIMES} value={a.checkOut} onChange={(v) => update({ checkOut: v })} /></div>
            <SwitchRow checked={!!a.timesVary} onChange={(v) => update({ timesVary: v })} label={COPY.times.vary} line={COPY.times.varyLine} />
          </div>
        </ReviewRow>
        <ReviewRow open={edit} onToggle={toggle} id="channels" label={R.channels} value={ch || COPY.review.noChannels}
          line={linked.length ? R.linked(linked, n) : ''} onEdit={() => onJump(1)} />
      </section>
      <PlanPick value={a.plan} onChange={(v) => update({ plan: v })} />
    </div>
  );
}

/** One review row. Module-level (not inside Review) so an open editor keeps focus while values change. */
function ReviewRow({ id, label, value, line, onEdit, open, onToggle, children }) {
  const R = COPY.b.review;
  const isOpen = open === id;
  return (
    <div className="ob3-row-wrap">
      <div className="ob3-row">
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-ink-400">{label}</span>
          <span className="block text-[17px] font-bold leading-snug text-navy-900">{value}</span>
          {line ? <span className="mt-0.5 flex items-center gap-1 text-[14px] font-semibold text-brand-700"><Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />{line}</span> : null}
        </span>
        <button type="button" onClick={onEdit || (() => onToggle(id))} aria-expanded={onEdit ? undefined : isOpen}
          className="ob-press -me-2 min-h-[44px] min-w-[44px] shrink-0 rounded-full px-3 text-[15px] font-bold text-brand-700" aria-label={`${isOpen ? R.done : R.edit}: ${label}`}>
          {isOpen ? R.done : R.edit}
        </button>
      </div>
      {isOpen && children ? <div className="ob3-fade px-4 pb-4">{children}</div> : null}
    </div>
  );
}
