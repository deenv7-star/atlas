/**
 * Onboarding v2, version A: a calm guided wizard. One question per screen, a pre-filled answer on
 * every screen, "דלג" everywhere, and nothing that pretends a value is fixed when it isn't
 * (guests as a range, price "משתנה", times "משתנה לפי יום ועונה"). Desktop adds the business
 * profile building itself beside the question; each line there jumps back to its question.
 * After the last answer: the building moment, then the guided setup (/setup).
 */
import React, { useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/app/shell/shared';
import { Primary, Ghost } from '@/components/onboarding/kit';
import { getPlanByKey, TRIAL_DAYS } from '@/config/pricing';
import {
  KINDS, MORE_KINDS, kindInfo, applyKind, PRICE_MODES, CHECKIN_TIMES, CHECKOUT_TIMES, CHANNELS,
  guestsLabel, priceLabel, timesLabel, clampInt, UNITS_LIMIT, unitsLabel, placeWord,
} from '@/lib/onboarding/v2/model';
import { useKeyboardInset, HelpLink, Count, GuestRange, Options, SwitchRow, MoneyInput, TimeChips, Progress } from './ui';
import PlanPick from './PlanPick';
import { useAnswers } from './useAnswers';
import BuildMoment from './BuildMoment';

const EASE = [0.23, 1, 0.32, 1];
export const QUESTIONS = ['kind', 'name', 'count', 'guests', 'price', 'times', 'channels', 'plan'];

export default function WizardA({ user, again = false }) {
  useKeyboardInset();
  const [a, update] = useAnswers(user);
  const [dir, setDir] = useState(1);
  const [building, setBuilding] = useState(false);
  const [more, setMore] = useState(() => MORE_KINDS.some((m) => m.value === a.kind));
  const i = Math.max(0, Math.min(QUESTIONS.length - 1, Number(a.step) || 0));
  const q = QUESTIONS[i];
  const k = kindInfo(a.kind);
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);

  const go = (to) => {
    if (to >= QUESTIONS.length) { setBuilding(true); window.scrollTo({ top: 0 }); return; }
    setDir(to > i ? 1 : -1);
    update({ step: Math.max(0, to) });
    window.scrollTo({ top: 0 });
  };
  const skip = () => {
    update((cur) => ({ skipped: Array.from(new Set([...(cur.skipped || []), q])), ...(q === 'kind' && !cur.kind ? applyKind(cur, 'zimmer') : {}) }));
    go(i + 1);
  };

  if (building) {
    return <BuildMoment user={user} answers={{ ...a, kind: a.kind || 'zimmer' }} tone="a"
      onSetup={() => window.location.replace('/setup')} onApp={() => window.location.replace('/today')} />;
  }

  const canNext = q === 'kind' ? !!a.kind : q === 'price' && a.priceMode === 'fixed' ? Number(a.price) > 0 : true;
  const unitWord = n === 1 ? `ב${k.unit}` : 'בכל יחידה';

  const screens = {
    kind: {
      title: again ? 'נעדכן את פרטי המקום' : 'איזה מקום יש לך?',
      sub: 'נתאים את המערכת לסוג האירוח.',
      body: (
        <div className="flex flex-col gap-3">
          <div role="radiogroup" aria-label="סוג המקום" className="flex flex-col gap-2.5 sm:grid sm:grid-cols-3">
            {KINDS.map((t) => {
              const on = a.kind === t.value;
              return (
                <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => update((cur) => applyKind(cur, t.value))}
                  className="ob-choice ob-press flex-row items-center !rounded-[22px] sm:flex-col sm:items-stretch">
                  <span className="relative block h-[84px] w-[104px] shrink-0 overflow-hidden bg-[#E9ECF4] sm:h-auto sm:w-full sm:aspect-[16/10]">
                    <img src={t.photo} alt="" className="h-full w-full object-cover" draggable={false} />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1 text-start">
                      <span className="block text-[19px] font-extrabold leading-tight text-navy-900">{t.label}</span>
                      <span className="mt-0.5 block text-[15px] leading-snug text-ink-600">{t.line}</span>
                    </span>
                    <span className={cn('ob2-radio', on && 'is-on')} aria-hidden>{on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="ob-press flex min-h-[52px] items-center gap-2 self-start rounded-full px-3 text-[16px] font-bold text-brand-700">
            משהו אחר<ChevronDown className={cn('h-4 w-4 transition-transform duration-200', more && 'rotate-180')} aria-hidden />
          </button>
          {more ? (
            <div role="radiogroup" aria-label="סוגים נוספים" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MORE_KINDS.map((t) => (
                <button key={t.value} type="button" role="radio" aria-checked={a.kind === t.value} onClick={() => update((cur) => applyKind(cur, t.value))} className="ob2-chip ob-press !text-[17px]">{t.label}</button>
              ))}
            </div>
          ) : null}
        </div>
      ),
    },
    name: {
      title: `איך קוראים ל${placeWord(a.kind)}?`,
      sub: 'השם שהאורחים מכירים. אפשר לשנות אחר כך.',
      body: (
        <div className="flex flex-col gap-2">
          <label htmlFor="ob2-name" className="sr-only">שם המקום</label>
          <input id="ob2-name" className="ob-input" value={a.name} maxLength={50} autoComplete="organization" placeholder={k.value === 'villa' ? 'למשל: וילה בכרם' : k.value === 'complex' ? 'למשל: מתחם הגליל' : 'למשל: צימרי הגליל'}
            onChange={(e) => update({ name: e.target.value })} />
        </div>
      ),
    },
    count: {
      title: `כמה ${k.units} יש לך?`,
      sub: 'כל אחת מקבלת שורה משלה בלוח ההזמנות.',
      body: (
        <div className="flex flex-col items-center gap-6">
          <div className="ob2-card w-full py-7"><Count value={n} min={1} max={UNITS_LIMIT} onChange={(v) => update({ unitCount: v })} label={`מספר ${k.units}`} /></div>
          <div role="radiogroup" aria-label="בחירה מהירה" className="grid w-full grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((v) => <button key={v} type="button" role="radio" aria-checked={n === v} onClick={() => update({ unitCount: v })} className="ob2-chip ob-press !px-0">{v}</button>)}
          </div>
        </div>
      ),
    },
    guests: {
      title: 'כמה אורחים?',
      sub: `מינימום ומקסימום ${unitWord}. לקבוצות ומשפחות אפשר גם 10 ומעלה.`,
      body: (
        <div className="flex flex-col gap-3">
          <GuestRange min={clampInt(a.guestsMin, 1, 60)} max={clampInt(a.guestsMax, 1, 60)} disabled={a.guestsVary} onChange={([lo, hi]) => update({ guestsMin: lo, guestsMax: hi })} />
          <div role="radiogroup" aria-label="טווחים נפוצים" className="grid grid-cols-4 gap-2">
            {[[2, 4], [4, 8], [10, 20], [10, 30]].map(([lo, hi]) => {
              const on = !a.guestsVary && a.guestsMin === lo && a.guestsMax === hi;
              return <button key={`${lo}-${hi}`} type="button" role="radio" aria-checked={on} onClick={() => update({ guestsMin: lo, guestsMax: hi, guestsVary: false })} className="ob2-chip ob-press !px-0 !text-[17px]" dir="ltr">{lo}–{hi}</button>;
            })}
          </div>
          <SwitchRow checked={!!a.guestsVary} onChange={(v) => update({ guestsVary: v })} label={n > 1 ? 'משתנה בין היחידות' : 'משתנה מהזמנה להזמנה'} line="אגדיר לכל יחידה אחר כך" />
        </div>
      ),
    },
    price: {
      title: 'ומה המחיר ללילה?',
      sub: 'אם הוא משתנה לפי ההרכב או העונה, זו תשובה מצוינת.',
      body: (
        <div className="flex flex-col gap-4">
          <Options label="מחיר ללילה" options={PRICE_MODES} value={a.priceMode} onChange={(v) => update({ priceMode: v })} />
          {a.priceMode === 'fixed' ? <MoneyInput label="כמה ללילה?" value={a.price} onChange={(v) => update({ price: v })} /> : null}
          {a.priceMode === 'varies' ? <MoneyInput label="החל מ- (לא חובה)" value={a.priceFrom} onChange={(v) => update({ priceFrom: v })} /> : null}
        </div>
      ),
    },
    times: {
      title: 'מתי נכנסים ויוצאים?',
      sub: 'השעות הרגילות. הן נכנסות להודעות לאורחים.',
      body: (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2"><p className="text-[16px] font-semibold text-navy-900">כניסה מ-</p><TimeChips label="שעת כניסה" options={CHECKIN_TIMES} value={a.checkIn} onChange={(v) => update({ checkIn: v })} /></div>
          <div className="flex flex-col gap-2"><p className="text-[16px] font-semibold text-navy-900">יציאה עד</p><TimeChips label="שעת יציאה" options={CHECKOUT_TIMES} value={a.checkOut} onChange={(v) => update({ checkOut: v })} /></div>
          <SwitchRow checked={!!a.timesVary} onChange={(v) => update({ timesVary: v })} label="משתנה לפי יום או עונה" line="השעות למעלה הן ברירת המחדל. משנים בכל הזמנה." />
        </div>
      ),
    },
    channels: {
      title: 'מאיפה מגיעות ההזמנות?',
      sub: 'נחבר אותן ללוח אחד בשלב הבא. אפשר לבחור כמה.',
      body: (
        <div role="group" aria-label="מקורות הזמנות" className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
          {CHANNELS.map((c) => {
            const on = (a.channels || []).includes(c.value);
            return (
              <button key={c.value} type="button" role="checkbox" aria-checked={on} onClick={() => update((cur) => ({ channels: on ? cur.channels.filter((v) => v !== c.value) : [...(cur.channels || []), c.value] }))}
                className="ob2-option ob-press" style={{ borderColor: on ? '#3E2BF1' : undefined }}>
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border-2', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#CBD0E0]')} aria-hidden>{on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}</span>
                <span className="text-[17px] font-bold text-navy-900">{c.label}</span>
              </button>
            );
          })}
        </div>
      ),
    },
    plan: {
      title: 'איך מתחילים?',
      sub: 'הניסיון חינם ובלי כרטיס. אפשר גם לבחור מסלול כבר עכשיו.',
      body: <PlanPick value={a.plan} onChange={(v) => update({ plan: v })} />,
    },
  };
  const S = screens[q];
  const last = i === QUESTIONS.length - 1;

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? -28 : 28 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
    exit: (d) => ({ opacity: 0, x: d > 0 ? 18 : -18, transition: { duration: 0.14, ease: EASE } }),
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob2 flex lg:flex-row" dir="rtl"
        onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && canNext) { e.preventDefault(); go(i + 1); } }}>
        <div className="relative flex min-h-[100dvh] w-full flex-col lg:w-[600px] lg:shrink-0">
          <header className="ob2-head is-col flex items-center gap-3 px-4 pb-3 md:px-8">
            {i > 0 ? <Ghost onClick={() => go(i - 1)} aria-label="חזרה" className="!h-12 !w-12 !px-0"><ArrowRight className="h-6 w-6" aria-hidden /></Ghost>
              : <span className="flex h-12 items-center ps-1"><Wordmark size={20} /></span>}
            <Progress value={i + 1} total={QUESTIONS.length} label={`שאלה ${i + 1} מתוך ${QUESTIONS.length}`} />
            <HelpLink compact />
          </header>
          <div className="ob2-head-space" aria-hidden />

          <main className="flex-1 overflow-x-clip px-5 pb-[calc(170px+env(safe-area-inset-bottom))] pt-2 md:px-8 lg:pt-10">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.section key={q} data-screen={q} custom={dir} variants={variants} initial="enter" animate="center" exit="exit">
                <p className="text-[15px] font-bold text-brand-600">{`שאלה ${i + 1} מתוך ${QUESTIONS.length}`}</p>
                <h1 className="mt-1 text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] text-navy-900 md:text-[36px]">{S.title}</h1>
                <p className="mb-6 mt-2 text-[17px] leading-relaxed text-ink-600">{S.sub}</p>
                {S.body}
              </motion.section>
            </AnimatePresence>
            <p className="mt-6 text-[14px] text-ink-400">הכל נשמר לבד. אפשר לשנות הכל אחר כך.</p>
          </main>

          <footer className="ob2-bar is-col">
            <div className="flex items-center gap-2">
              <Ghost onClick={skip} className="shrink-0">דלג</Ghost>
              <Primary className="flex-1" onClick={() => go(i + 1)} disabled={!canNext}>
                {last ? <>בונים לי את המערכת<ArrowLeft className="h-5 w-5" aria-hidden /></> : <>המשך<ArrowLeft className="h-5 w-5" aria-hidden /></>}
              </Primary>
            </div>
            <div className="mt-1 flex justify-center"><HelpLink className="!min-h-[44px] !bg-transparent !shadow-none !text-[14px]" /></div>
          </footer>
        </div>

        <aside className="ob2-aside hidden p-5 lg:block" aria-label="הפרופיל של העסק">
          <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[32px] bg-[#E4E1FD]/60 p-10">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,43,241,0.14),rgba(62,43,241,0))]" aria-hidden />
            <ProfileCard a={a} at={i} onJump={(to) => go(to)} />
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}

/** The business profile, filling in as they answer. Each row jumps back to its question. */
export function ProfileCard({ a, at, onJump }) {
  const k = kindInfo(a.kind);
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const plan = a.plan && a.plan !== 'trial' ? getPlanByKey(a.plan) : null;
  const rows = useMemo(() => [
    { q: 2, label: 'יחידות', value: unitsLabel(a.kind, n) },
    { q: 3, label: 'אורחים', value: guestsLabel(a) },
    { q: 4, label: 'מחיר', value: priceLabel(a) },
    { q: 5, label: 'שעות', value: timesLabel(a) },
    { q: 6, label: 'הזמנות מ-', value: (a.channels || []).length ? CHANNELS.filter((c) => a.channels.includes(c.value)).map((c) => c.label).join(', ') : 'נחבר בשלב הבא' },
    { q: 7, label: 'התחלה', value: plan ? `מסלול ${plan.nameHe}` : `${TRIAL_DAYS} יום חינם` },
  ], [a, n, k, plan]);
  return (
    <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white shadow-[0_2px_4px_rgba(27,38,86,0.06),0_30px_60px_-30px_rgba(27,38,86,0.45)]">
      <div className="relative aspect-[16/8] bg-[#E9ECF4]">
        {a.kind ? <motion.img key={k.value} src={k.photo || '/demo/complex-pool.webp'} alt="" className="h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} /> : null}
      </div>
      <div className="px-6 pb-6 pt-4">
        <p className="text-[13px] font-bold text-brand-600">{a.kind ? k.label : 'סוג המקום'}</p>
        <p className="truncate text-[24px] font-extrabold text-navy-900">{a.name.trim() || 'השם של המקום'}</p>
        <ul className="mt-4 flex flex-col">
          {rows.map((r) => {
            const reached = at > r.q || (at === r.q);
            return (
              <li key={r.q}>
                <button type="button" onClick={() => onJump(r.q)} disabled={!reached}
                  className={cn('ob-press flex min-h-[48px] w-full items-center gap-3 border-t border-[#EEF0F5] text-start transition-opacity', !reached && 'opacity-40')}>
                  <span className="w-[72px] shrink-0 text-[14px] font-semibold text-ink-400">{r.label}</span>
                  <span className={cn('min-w-0 flex-1 truncate text-[15px] font-semibold', reached ? 'text-navy-900' : 'text-ink-400')}>{reached ? r.value : '…'}</span>
                  {at > r.q ? <Check className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={3} aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
