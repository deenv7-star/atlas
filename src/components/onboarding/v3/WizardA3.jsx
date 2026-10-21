/**
 * Onboarding v3, version A: "Apple setup assistant". One question per screen, large type, instant
 * feedback, 5 questions (was 8) + one review screen. The price question moved to the setup journey's
 * units step (it differs per unit anyway); the plan choice sits on the review screen, trial preselected.
 *
 * - Tapping a kind moves on by itself (first time only); the button is never a pale disabled pill:
 *   pressing it without an answer says what is missing.
 * - Every step is a browser history entry (phone back gesture = previous question).
 * - Answers autosave on this device after every change ("נשמר ✓" in the header).
 * - Desktop: the owner's atlas builds itself on the side: photo, name, summary and a calendar whose
 *   rows are their real units, with sample bookings labelled "דוגמה". Mobile: a one-line peek.
 */
import React, { useCallback, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/app/shell/shared';
import { Primary, Ghost } from '@/components/onboarding/kit';
import {
  KINDS, MORE_KINDS, kindInfo, applyKind, CHECKIN_TIMES, CHECKOUT_TIMES, CHANNELS,
  guestsLabel, timesLabel, clampInt, UNITS_LIMIT, unitsLabel,
} from '@/lib/onboarding/v2/model';
import { useKeyboardInset, HelpLink, Count, GuestRange, SwitchRow, TimeChips } from '@/components/onboarding/v2/ui';
import PlanPick from '@/components/onboarding/v2/PlanPick';
import { useAnswers } from '@/components/onboarding/v2/useAnswers';
import BuildMoment from '@/components/onboarding/v2/BuildMoment';
import { COPY } from './copy';
import { useStepHistory, SavedTick, CalendarPreview, kindPhoto, summaryLine } from './shared';

const EASE = [0.23, 1, 0.32, 1];
export const STEPS_A = ['kind', 'name', 'units', 'times', 'channels', 'start'];
const QUESTION_COUNT = STEPS_A.length - 1;

export default function WizardA3({ user, again = false }) {
  useKeyboardInset();
  const [a, update] = useAnswers(user);
  const [dir, setDir] = useState(1);
  const [building, setBuilding] = useState(false);
  const [more, setMore] = useState(() => MORE_KINDS.some((m) => m.value === a.kind));
  const [hint, setHint] = useState('');
  const [nudge, setNudge] = useState(0);
  const groupRef = useRef(null);
  const i = Math.max(0, Math.min(STEPS_A.length - 1, Number(a.step) || 0));
  const q = STEPS_A[i];
  const k = kindInfo(a.kind || 'complex');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const C = COPY;

  const setStep = useCallback((to, fromPop = false) => {
    setHint('');
    setDir((cur) => (fromPop ? -1 : cur));
    update({ step: Math.max(0, Math.min(STEPS_A.length - 1, to)) });
    window.scrollTo({ top: 0 });
  }, [update]);
  useStepHistory(i, setStep);

  const go = (to) => {
    if (to >= STEPS_A.length) { setBuilding(true); window.scrollTo({ top: 0 }); return; }
    setDir(to > i ? 1 : -1);
    setStep(to);
  };
  const next = () => {
    if (q === 'kind' && !a.kind) {
      setHint(C.kind.hint); setNudge((x) => x + 1);
      groupRef.current?.querySelector('[role=radio]')?.focus();
      return;
    }
    go(i + 1);
  };
  const pickKind = (value) => {
    const firstTime = !a.kind;
    update((cur) => applyKind(cur, value));
    setHint('');
    if (firstTime && q === 'kind') setTimeout(() => go(1), 320);
  };
  const skip = () => {
    update((cur) => ({ skipped: Array.from(new Set([...(cur.skipped || []), q])) }));
    go(i + 1);
  };

  if (building) {
    return <BuildMoment user={user} answers={{ ...a, kind: a.kind || 'zimmer' }} tone="a"
      onSetup={() => window.location.replace('/setup')} onApp={() => window.location.replace('/today')} />;
  }

  const optional = q === 'times' || q === 'channels';
  const screens = {
    kind: {
      title: C.kind.title,
      sub: C.kind.sub,
      body: (
        <div className="flex flex-col gap-3">
          <div ref={groupRef} key={nudge} role="radiogroup" aria-label={C.kind.group} aria-describedby={hint ? 'ob3-hint' : undefined}
            className={cn('flex flex-col gap-3', nudge && 'ob3-nudge')}>
            {KINDS.map((t) => {
              const on = a.kind === t.value;
              return (
                <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => pickKind(t.value)} className="ob3-kind ob-press">
                  <span className="relative block h-[84px] w-[96px] shrink-0 overflow-hidden rounded-[16px] bg-[#E9ECF4] max-[359px]:h-[72px] max-[359px]:w-[80px]">
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
          <p className="mt-1 flex items-center gap-2 text-[15px] text-ink-600"><Clock className="h-4 w-4 text-brand-600" aria-hidden />{C.kind.time} · {C.common.autosave}</p>
        </div>
      ),
    },
    name: {
      title: C.name.title(a.kind),
      sub: C.name.sub,
      body: (
        <div className="flex flex-col gap-2">
          <label htmlFor="ob3-name" className="sr-only">{C.name.label}</label>
          <input id="ob3-name" className="ob-input !min-h-[64px] !text-[22px] !font-bold" value={a.name} maxLength={50} autoComplete="organization" enterKeyHint="next"
            placeholder={C.name.placeholder(a.kind)} onChange={(e) => update({ name: e.target.value })} />
          <p className="text-[15px] text-ink-400">{C.name.empty}</p>
        </div>
      ),
    },
    units: {
      title: C.units.title(k),
      sub: C.units.sub,
      body: (
        <div className="flex flex-col gap-4">
          <div className="ob2-card flex flex-col items-center gap-5 px-4 py-6">
            <Count value={n} min={1} max={UNITS_LIMIT} onChange={(v) => update({ unitCount: v })} label={C.units.count(k)} />
            <div role="radiogroup" aria-label={C.units.quick} className="grid w-full grid-cols-6 gap-2 max-[379px]:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((v) => <button key={v} type="button" role="radio" aria-checked={n === v} onClick={() => update({ unitCount: v })} className="ob2-chip ob-press !min-h-[48px] !px-0 !text-[18px]">{v}</button>)}
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-[20px] font-extrabold text-navy-900">{C.units.guestsTitle(k, n)}</h2>
            <p className="mt-1 text-[15px] text-ink-600">{C.units.guestsLine}</p>
          </div>
          <GuestRange min={clampInt(a.guestsMin, 1, 60)} max={clampInt(a.guestsMax, 1, 60)} disabled={a.guestsVary} onChange={([lo, hi]) => update({ guestsMin: lo, guestsMax: hi })} />
          <div role="radiogroup" aria-label={C.units.ranges} className="grid grid-cols-4 gap-2">
            {[[2, 4], [2, 6], [10, 20], [10, 30]].map(([lo, hi]) => {
              const on = !a.guestsVary && a.guestsMin === lo && a.guestsMax === hi;
              return <button key={`${lo}-${hi}`} type="button" role="radio" aria-checked={on} onClick={() => update({ guestsMin: lo, guestsMax: hi, guestsVary: false })} className="ob2-chip ob-press !min-h-[48px] !px-0 !text-[17px]" dir="ltr">{lo}–{hi}</button>;
            })}
          </div>
          <SwitchRow checked={!!a.guestsVary} onChange={(v) => update({ guestsVary: v })} label={C.units.vary(n)} line={C.units.varyLine} />
        </div>
      ),
    },
    times: {
      title: C.times.title,
      sub: C.times.sub,
      body: (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2"><p className="text-[17px] font-bold text-navy-900">{C.times.in}</p><TimeChips label={C.times.inGroup} options={CHECKIN_TIMES} value={a.checkIn} onChange={(v) => update({ checkIn: v })} /></div>
          <div className="flex flex-col gap-2"><p className="text-[17px] font-bold text-navy-900">{C.times.out}</p><TimeChips label={C.times.outGroup} options={CHECKOUT_TIMES} value={a.checkOut} onChange={(v) => update({ checkOut: v })} /></div>
          <SwitchRow checked={!!a.timesVary} onChange={(v) => update({ timesVary: v })} label={C.times.vary} line={C.times.varyLine} />
        </div>
      ),
    },
    channels: {
      title: C.channels.title,
      sub: C.channels.sub,
      body: (
        <div className="flex flex-col gap-5">
          <div role="group" aria-label={C.channels.group} className="flex flex-wrap gap-2.5">
            {CHANNELS.map((c) => {
              const on = (a.channels || []).includes(c.value);
              return (
                <button key={c.value} type="button" role="checkbox" aria-checked={on} onClick={() => update((cur) => ({ channels: on ? cur.channels.filter((v) => v !== c.value) : [...(cur.channels || []), c.value] }))}
                  className="ob2-option ob-press !min-h-[56px] !w-auto !gap-3 !rounded-full !py-2.5 !pe-5 !ps-3">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border-2 transition-colors', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#CBD0E0]')} aria-hidden>{on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}</span>
                  <span className="whitespace-nowrap text-[17px] font-bold text-navy-900">{c.label}</span>
                </button>
              );
            })}
          </div>
          <div className="ob2-card overflow-hidden lg:hidden"><CalendarPreview a={a} compact rows={3} /></div>
        </div>
      ),
    },
    start: {
      title: C.start.title,
      sub: C.start.sub,
      body: <Review a={a} onJump={go} onPlan={(v) => update({ plan: v })} />,
    },
  };
  const S = screens[q];
  const last = q === 'start';
  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? -24 : 24 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
    exit: (d) => ({ opacity: 0, x: d > 0 ? 16 : -16, transition: { duration: 0.14, ease: EASE } }),
  };
  const progressLabel = last ? C.start.summary : C.common.progress(i + 1, QUESTION_COUNT);

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob2 ob3 flex lg:flex-row" dir="rtl" data-version="a3"
        onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); next(); } }}>
        <div className="relative flex min-h-[100dvh] w-full flex-col lg:w-[600px] lg:shrink-0">
          <header className="ob2-head is-col flex items-center gap-3 px-4 pb-3 md:px-8">
            {i > 0 ? <Ghost onClick={() => go(i - 1)} aria-label={C.common.back} className="!h-12 !w-12 !px-0"><ArrowRight className="h-6 w-6" aria-hidden /></Ghost>
              : <span className="flex h-12 items-center ps-1"><Wordmark size={20} /></span>}
            <div className="ob3-steps" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTION_COUNT} aria-valuenow={Math.min(i + 1, QUESTION_COUNT)} aria-label={progressLabel}>
              {Array.from({ length: QUESTION_COUNT }, (_, s) => <span key={s} className={cn(s <= i && 'is-on')} />)}
            </div>
            <SavedTick stamp={JSON.stringify([a.kind, a.name, a.unitCount, a.guestsMin, a.guestsMax, a.guestsVary, a.checkIn, a.checkOut, a.timesVary, a.channels, a.plan])} />
            <HelpLink compact />
          </header>
          <div className="ob2-head-space" aria-hidden />

          <main className="flex-1 overflow-x-clip px-5 pb-[calc(150px+env(safe-area-inset-bottom))] pt-2 md:px-8 lg:pt-10">
            {i > 0 && !last ? <Peek a={a} /> : null}
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
              {optional ? <Ghost onClick={skip} className="shrink-0">{C.common.skip}</Ghost> : null}
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
            <PreviewCard a={a} at={i} />
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}

/** Mobile one-line peek of what is being built (photo + name + summary). */
function Peek({ a }) {
  return (
    <div className="ob3-peek ob3-fade mb-5 lg:hidden" aria-hidden>
      <img src={kindPhoto(a.kind)} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-extrabold text-navy-900">{a.name.trim() || COPY.preview.placeholderName}</span>
        <span className="block truncate text-[13px] text-ink-600">{summaryLine(a)}</span>
      </span>
    </div>
  );
}

/** Desktop preview: the owner's answers, each appearing the moment it is given. */
export function PreviewCard({ a, at }) {
  const k = kindInfo(a.kind || 'complex');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const chips = [
    at >= 2 ? unitsLabel(a.kind || 'complex', n) : null,
    at >= 2 ? guestsLabel(a) : null,
    at >= 3 ? timesLabel(a).replace('בדרך כלל ', '') : null,
  ].filter(Boolean);
  return (
    <div className="ob3-preview relative">
      <div className="relative aspect-[16/7] overflow-hidden bg-[#E9ECF4]">
        <motion.img key={a.kind || 'none'} src={kindPhoto(a.kind)} alt="" className="h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />
        {!a.kind ? <span className="ob3-badge absolute end-3 top-3">{COPY.common.example}</span> : null}
      </div>
      <div className="px-6 pb-4 pt-4">
        <p className="text-[13px] font-bold text-brand-600">{a.kind ? k.label : COPY.kind.group}</p>
        <p className={cn('truncate text-[26px] font-extrabold', a.name.trim() ? 'text-navy-900' : 'text-navy-900/60')}>{a.name.trim() || COPY.preview.placeholderName}</p>
        {chips.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c) => <span key={c} className="ob3-fade rounded-full bg-[#F7F8FB] px-3 py-1.5 text-[13px] font-semibold text-navy-900">{c}</span>)}
          </div>
        ) : null}
      </div>
      <CalendarPreview a={a} />
    </div>
  );
}

/** The review screen: every answer in one card, each with "שינוי", then trial / plan. */
function Review({ a, onJump, onPlan }) {
  const k = kindInfo(a.kind || 'zimmer');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const ch = CHANNELS.filter((c) => (a.channels || []).includes(c.value)).map((c) => c.label).join(', ');
  const R = COPY.review;
  const rows = [
    { to: 0, label: R.kind, value: k.label },
    { to: 1, label: R.name, value: a.name.trim() || R.noName },
    { to: 2, label: R.units, value: `${unitsLabel(a.kind || 'zimmer', n)} · ${guestsLabel(a)}` },
    { to: 3, label: R.times, value: R.timesValue(a) },
    { to: 4, label: R.channels, value: ch || R.noChannels },
  ];
  return (
    <div className="flex flex-col gap-6">
      <section aria-label={COPY.start.summary} className="ob2-card overflow-hidden">
        {rows.map((r) => (
          <div key={r.to} className="ob3-row">
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ink-400">{r.label}</span>
              <span className="block text-[17px] font-bold leading-snug text-navy-900">{r.value}</span>
            </span>
            <button type="button" onClick={() => onJump(r.to)} className="ob-press -me-2 min-h-[44px] min-w-[44px] shrink-0 rounded-full px-3 text-[15px] font-bold text-brand-700" aria-label={`${COPY.start.edit}: ${r.label}`}>{COPY.start.edit}</button>
          </div>
        ))}
      </section>
      <PlanPick value={a.plan} onChange={onPlan} />
    </div>
  );
}
