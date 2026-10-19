/**
 * "בונים לך את המערכת": the moment after the last answer. Each line is a real save that runs while it
 * is shown (profile → calendar → guest messages → trial / plan), so the check appears because the
 * write finished, not because a timer did. Their own answers assemble on the right: the place card,
 * one calendar row per unit, the first guest message. No invented numbers.
 * Reduced motion: the same steps, no movement, no burst.
 */
import React, { useEffect, useRef, useState } from 'react';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { Check, ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlanByKey, TRIAL_DAYS } from '@/config/pricing';
import { kindInfo, clampInt, UNITS_LIMIT, guestsLabel } from '@/lib/onboarding/v2/model';
import { commitProfile, commitUnits, commitTimes, commitStart } from '@/lib/onboarding/v2/actions';
import { Primary, Ghost } from '@/components/onboarding/kit';

const EASE = [0.23, 1, 0.32, 1];
const STEP_MS = 1150;

export function buildSteps(a) {
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const k = kindInfo(a.kind);
  return [
    { id: 'profile', title: 'בונים את הפרופיל המנצח לעסק שלך', detail: a.name.trim() || 'העסק שלך', run: commitProfile },
    { id: 'calendar', title: 'מכינים את לוח ההזמנות', detail: n === 1 ? `ה${k.unit} שלך בלוח` : `${n} ${k.units} בלוח`, run: commitUnits },
    { id: 'messages', title: 'מכינים את ההודעות לאורחים', detail: a.timesVary ? 'שעות שמשתנות, בנוסח מוכן' : `כניסה ${a.checkIn} · יציאה ${a.checkOut}`, run: commitTimes },
    { id: 'start', title: 'מתחילים לחסוך לך זמן וכסף', detail: a.plan && a.plan !== 'trial' ? `מסלול ${getPlanByKey(a.plan).nameHe} · ${TRIAL_DAYS} הימים הראשונים חינם` : `${TRIAL_DAYS} יום ניסיון חינם התחילו`, run: commitStart },
  ];
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function BuildMoment({ user, answers: a, onSetup, onApp, tone = 'a' }) {
  const still = useReducedMotion();
  const steps = buildSteps(a);
  const [at, setAt] = useState(0); // index of the step running now; steps.length = all done
  const [error, setError] = useState('');
  const running = useRef(false);

  const run = async (from) => {
    if (running.current) return;
    running.current = true;
    setError('');
    for (let i = from; i < steps.length; i += 1) {
      setAt(i);
      const t0 = Date.now();
      try {
        await steps[i].run(user, a);
      } catch (e) {
        running.current = false;
        setError(e?.message && e.message.length < 120 ? `לא הצלחנו לשמור: ${e.message}` : 'לא הצלחנו לשמור. בדקו את החיבור לאינטרנט.');
        return;
      }
      const left = (still ? 250 : STEP_MS) - (Date.now() - t0);
      if (left > 0) await wait(left);
    }
    setAt(steps.length);
    running.current = false;
  };
  useEffect(() => { run(0); }, []);

  const done = at >= steps.length;
  const k = kindInfo(a.kind);
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const name = a.name.trim() || 'העסק שלך';

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob2 ob2-build flex flex-col" dir="rtl" data-screen={done ? 'built' : 'building'}>
        <div className="ob2-build-glow" aria-hidden />
        <main className="relative mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-6 px-5 pb-[calc(150px+env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] md:px-10 lg:flex-row lg:items-center lg:gap-16 lg:pb-16">
          {/* the owner's system assembling (their answers) */}
          <div className="order-1 flex justify-center lg:order-2 lg:flex-1" aria-hidden>
            <Assembly a={a} k={k} n={n} name={name} at={at} still={still} />
          </div>

          <div className="order-2 flex flex-col lg:order-1 lg:w-[460px] lg:shrink-0">
            <p className="text-[15px] font-bold text-brand-600" aria-live="polite">{done ? 'הכל מוכן' : tone === 'b' ? 'רגע, בונה לך…' : 'בונים לך את המערכת'}</p>
            <h1 className="mt-1 text-[28px] font-extrabold leading-[1.12] tracking-[-0.02em] text-navy-900 md:text-[40px]">
              {done ? <>{name}<br />מוכן להתחלה</> : 'משהו טוב מתחיל כאן'}
            </h1>
            <ol className="mt-4 flex flex-col gap-2 md:mt-6 md:gap-2.5" aria-label="מה נבנה עכשיו">
              {steps.map((s, i) => {
                const state = i < at ? 'done' : i === at && !done ? (error ? 'error' : 'run') : 'wait';
                return (
                  <motion.li key={s.id} initial={still ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: still ? 0 : i * 0.06 }}
                    className={cn('flex min-h-[58px] items-center gap-3.5 rounded-[18px] px-4 py-2 md:min-h-[64px] md:py-3', state === 'wait' ? 'bg-transparent' : 'bg-[#F7F8FB]')}>
                    <StepIcon state={state} />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-[17px] font-bold leading-snug', state === 'wait' ? 'text-ink-400' : 'text-navy-900')}>{s.title}</span>
                      <span className="block truncate text-[15px] text-ink-600">{state === 'wait' ? '\u00a0' : s.detail}</span>
                    </span>
                    <span className="sr-only">{state === 'done' ? 'בוצע' : state === 'run' ? 'בתהליך' : state === 'error' ? 'נכשל' : 'ממתין'}</span>
                  </motion.li>
                );
              })}
            </ol>
            {error ? (
              <div className="mt-4 rounded-[16px] bg-[var(--st-red-bg,#FDEEEE)] px-4 py-3 text-[15px] font-medium text-[var(--st-red-fg,#B4303A)]" role="alert">
                {error}
                <button type="button" onClick={() => run(at)} className="ob-press mt-2 flex min-h-[48px] items-center gap-2 font-bold text-navy-900"><RotateCcw className="h-4 w-4" aria-hidden />לנסות שוב</button>
              </div>
            ) : null}
            {done ? (
              <motion.p initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }} className="mt-5 text-[17px] leading-relaxed text-ink-600">
                {tone === 'b' ? 'עכשיו נחבר יחד את ההזמנות שלך. אני אראה בדיוק איפה ללחוץ.' : 'עכשיו נחבר את ההזמנות, צעד אחר צעד. נראה לך בדיוק איפה ללחוץ.'}
              </motion.p>
            ) : null}
          </div>
        </main>

        <footer className="ob2-bar is-flow lg:pb-12">
          <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-2 md:px-5 lg:flex-row lg:justify-start lg:px-10">
            <Primary className="w-full lg:w-auto" onClick={onSetup} disabled={!done} aria-disabled={!done}>
              {done ? <>מתחילים בהגדרה<ArrowLeft className="h-5 w-5" aria-hidden /></> : <><Loader2 className="h-5 w-5 ob2-spin" aria-hidden />בונים…</>}
            </Primary>
            {done ? <Ghost className="w-full lg:w-auto" onClick={onApp}>קודם להציץ במערכת</Ghost> : null}
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

function StepIcon({ state }) {
  if (state === 'done') {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
        <motion.svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: EASE }} />
        </motion.svg>
      </span>
    );
  }
  if (state === 'run') {
    return (
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36" className="ob2-spin" aria-hidden>
          <circle cx="18" cy="18" r="15" fill="none" stroke="#E4E1FD" strokeWidth="3.5" />
          <path d="M18 3a15 15 0 0 1 15 15" fill="none" stroke="#3E2BF1" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (state === 'error') return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDEEEE] text-[18px] font-extrabold text-[#B4303A]" aria-hidden>!</span>;
  return <span className="h-9 w-9 shrink-0 rounded-full border-2 border-dashed border-[#CBD0E0]" aria-hidden />;
}

/** Their place card, their calendar rows, their first message: each lands when its save finishes. */
function Assembly({ a, k, n, name, at, still }) {
  const rows = Math.min(n, 5);
  const show = (i) => at > i;
  const card = (i) => (still ? {} : {
    initial: { opacity: 0, y: 26, scale: 0.94 },
    animate: show(i) ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 26, scale: 0.94 },
    transition: { type: 'spring', stiffness: 260, damping: 26 },
  });
  const allDone = at >= 4;
  return (
    <div className="relative h-[250px] w-full max-w-[380px] sm:h-[360px] lg:h-[440px] lg:max-w-[460px]">
      {/* calm base: the space the cards land in, so nothing jumps when they arrive */}
      <div className="absolute inset-x-6 inset-y-4 rounded-[32px] bg-[#E4E1FD]/45" />

      {/* 1. place */}
      <motion.div {...card(0)} style={still && !show(0) ? { opacity: 0 } : undefined}
        className="absolute end-0 top-0 w-[60%] overflow-hidden rounded-[20px] bg-white shadow-[0_2px_4px_rgba(27,38,86,0.06),0_24px_48px_-20px_rgba(27,38,86,0.35)] lg:w-[66%]">
        <div className="aspect-[16/7] overflow-hidden bg-[#E9ECF4] lg:aspect-[16/8]"><img src={k.photo || '/demo/complex-pool.webp'} alt="" className="h-full w-full object-cover" /></div>
        <div className="px-3.5 py-2.5 lg:px-4 lg:py-3">
          <p className="truncate text-[16px] font-extrabold text-navy-900 lg:text-[17px]">{name}</p>
          <p className="truncate text-[13px] text-ink-600">{k.label} · {guestsLabel(a)}</p>
        </div>
      </motion.div>

      {/* 2. calendar: one row per unit (the bars fill as it lands) */}
      <motion.div {...card(1)} style={still && !show(1) ? { opacity: 0 } : undefined}
        className="absolute start-0 top-[20%] w-[56%] rounded-[20px] bg-white p-3 shadow-[0_2px_4px_rgba(27,38,86,0.06),0_24px_48px_-20px_rgba(27,38,86,0.35)] lg:top-[30%] lg:w-[64%] lg:p-4">
        <p className="mb-2.5 text-[13px] font-bold text-navy-900">לוח ההזמנות</p>
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex items-center gap-2">
              <span className="w-[46px] truncate text-[11px] font-semibold text-ink-600">{n === 1 ? k.unit : `${k.unit} ${r + 1}`}</span>
              <span className="grid flex-1 grid-cols-7 gap-1">
                {Array.from({ length: 7 }, (_, c) => <span key={c} className={cn('h-3.5 rounded-[5px] lg:h-4', c === 0 ? 'bg-[#E4E1FD]' : 'bg-[#F1F2F7]')} />)}
              </span>
            </div>
          ))}
          {n > rows ? <p className="text-[11px] text-ink-400">ועוד {n - rows}</p> : null}
        </div>
      </motion.div>

      {/* 3. first guest message */}
      <motion.div {...card(2)} style={still && !show(2) ? { opacity: 0 } : undefined}
        className="absolute bottom-0 end-[2%] w-[56%] rounded-[20px] bg-white p-3 shadow-[0_2px_4px_rgba(27,38,86,0.06),0_24px_48px_-20px_rgba(27,38,86,0.35)] lg:w-[62%] lg:p-3.5">
        <p className="mb-1.5 text-[12px] font-bold text-ink-600">הודעה לאורח</p>
        <p className="rounded-[14px] rounded-se-[4px] bg-[#E4E1FD] px-3 py-2 text-[13px] leading-snug text-navy-900">
          שלום! מחכים לכם ב{name}. {a.timesVary ? 'נשלח שעת כניסה מדויקת לפני ההגעה.' : `הכניסה מ-${a.checkIn}.`}
        </p>
      </motion.div>

      {/* 4. ready: one quiet ring, once */}
      {allDone ? (
        <span className="absolute bottom-[8%] start-[8%] flex h-14 w-14 items-center justify-center">
          {!still ? <span className="ob2-ring-pulse absolute inset-0 rounded-full bg-brand-600/30" style={{ animationIterationCount: 2 }} /> : null}
          <motion.span initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_12px_28px_-10px_rgba(62,43,241,0.8)]">
            <Check className="h-7 w-7" strokeWidth={3} />
          </motion.span>
        </span>
      ) : null}
    </div>
  );
}
