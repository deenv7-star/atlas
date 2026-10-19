/**
 * Onboarding v2, version B: a conversation. The ATLAS assistant asks one short question at a time;
 * the owner answers with big taps in the answer dock at the bottom (or types where a name or a price
 * is needed). Every answer appears as their own bubble with "שינוי" to go back to it, every question
 * has "דלג", and nothing pretends a value is fixed when it isn't (guests as a range, price "משתנה",
 * times "משתנה לפי יום ועונה"). Then the building moment, then the guided setup (/setup).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUp, Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/app/shell/shared';
import { Primary, Ghost } from '@/components/onboarding/kit';
import { getPlanByKey, TRIAL_DAYS } from '@/config/pricing';
import {
  KINDS, MORE_KINDS, kindInfo, applyKind, PRICE_MODES, CHECKIN_TIMES, CHECKOUT_TIMES, CHANNELS,
  guestsLabel, priceLabel, timesLabel, clampInt, UNITS_LIMIT, unitsLabel, placeWord,
} from '@/lib/onboarding/v2/model';
import { useKeyboardInset, HelpLink, GuestRange, MoneyInput, TimeChips, Progress } from './ui';
import { useAnswers } from './useAnswers';
import PlanPick from './PlanPick';
import BuildMoment from './BuildMoment';

const EASE = [0.23, 1, 0.32, 1];
export const QUESTIONS = ['kind', 'name', 'count', 'guests', 'price', 'times', 'channels', 'plan'];

function lines(q, a, again) {
  const k = kindInfo(a.kind);
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  switch (q) {
    case 'kind': return again
      ? ['נעדכן יחד את פרטי המקום.', 'איזה מקום יש לך?']
      : ['היי, כאן ATLAS.', 'אשאל כמה שאלות קצרות ואבנה לך את המערכת. על כל שאלה אפשר לדלג.', 'איזה מקום יש לך?'];
    case 'name': return [`${k.label}, מעולה.`, `איך קוראים ל${placeWord(a.kind)}?`];
    case 'count': return [`כמה ${k.units} יש?`];
    case 'guests': return [n > 1 ? 'כמה אורחים נכנסים לכל יחידה, מינימום ומקסימום?' : 'כמה אורחים נכנסים, מינימום ומקסימום?', 'לקבוצות ומשפחות זה יכול להיות גם 10 ומעלה.'];
    case 'price': return ['ומה לגבי המחיר ללילה?', 'אם הוא משתנה לפי ההרכב או העונה, זו תשובה מצוינת.'];
    case 'times': return [`בדרך כלל כניסה ב-${a.checkIn} ויציאה ב-${a.checkOut}. מתאים לך?`];
    case 'channels': return ['מאיפה מגיעות ההזמנות היום?', 'נחבר אותן ללוח אחד מיד אחרי זה. אפשר לבחור כמה.'];
    case 'plan': return ['כמעט סיימנו. איך מתחילים?', `${TRIAL_DAYS} יום חינם, בלי כרטיס אשראי. אפשר גם לבחור מסלול כבר עכשיו.`];
    default: return [];
  }
}

function answerText(q, a) {
  if ((a.skipped || []).includes(q)) return 'דילגתי';
  switch (q) {
    case 'kind': return kindInfo(a.kind).label;
    case 'name': return a.name.trim() || 'אגדיר אחר כך';
    case 'count': return unitsLabel(a.kind, clampInt(a.unitCount, 1, UNITS_LIMIT));
    case 'guests': return guestsLabel(a);
    case 'price': return priceLabel(a);
    case 'times': return timesLabel(a);
    case 'channels': return (a.channels || []).length ? CHANNELS.filter((c) => a.channels.includes(c.value)).map((c) => c.label).join(', ') : 'עוד לא בטוח/ה';
    case 'plan': return a.plan && a.plan !== 'trial' ? `מסלול ${getPlanByKey(a.plan).nameHe}` : `${TRIAL_DAYS} יום ניסיון חינם`;
    default: return '';
  }
}

function Avatar() {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[16px] font-extrabold text-white" aria-hidden>a</span>;
}

function BotLines({ texts, animate, onShown }) {
  const still = useReducedMotion();
  const [shown, setShown] = useState(animate && !still ? 0 : texts.length);
  const [typing, setTyping] = useState(animate && !still);
  useEffect(() => {
    if (!animate || still) { onShown?.(); return undefined; }
    let k = 0;
    let t;
    const next = () => {
      setTyping(true);
      t = setTimeout(() => {
        k += 1; setShown(k); setTyping(false);
        if (k < texts.length) t = setTimeout(next, 180); else onShown?.();
      }, Math.min(900, 380 + texts[k].length * 9));
    };
    next();
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-col gap-1.5">
      {texts.slice(0, shown).map((t, i) => (
        <div key={i} className={cn('flex items-end gap-2.5', animate && 'ob2-in')}>
          {i === shown - 1 && !typing ? <Avatar /> : <span className="w-9 shrink-0" aria-hidden />}
          <p className="ob2-bubble is-bot">{t}</p>
        </div>
      ))}
      {typing ? (
        <div className="flex items-end gap-2.5" aria-hidden>
          <Avatar />
          <span className="ob2-bubble is-bot ob2-typing !py-4"><span /><span /><span /></span>
        </div>
      ) : null}
    </div>
  );
}

export default function ChatB({ user, again = false }) {
  useKeyboardInset();
  const [a, update] = useAnswers(user);
  const [building, setBuilding] = useState(false);
  const [ready, setReady] = useState(false); // current question finished "typing"
  const [more, setMore] = useState(false);
  const [custom, setCustom] = useState(false);
  const [dockH, setDockH] = useState(200);
  const dock = useRef(null);
  const dockInner = useRef(null);
  const still = useReducedMotion();
  const i = Math.max(0, Math.min(QUESTIONS.length - 1, Number(a.step) || 0));
  const q = QUESTIONS[i];
  const k = kindInfo(a.kind);
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);

  useLayoutEffect(() => {
    if (!dock.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setDockH(Math.ceil(e.target.getBoundingClientRect().height)));
    ro.observe(dock.current);
    return () => ro.disconnect();
  }, [building]);
  useEffect(() => { setMore(false); setCustom(false); }, [q]);
  // the dock can't be reached (tap or keyboard) while the question is still being "typed"
  useEffect(() => { if (dockInner.current) dockInner.current.inert = !ready; }, [ready, q]);
  useEffect(() => {
    // keep the newest line just above the answer dock
    const t = setTimeout(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: still ? 'auto' : 'smooth' }), 60);
    return () => clearTimeout(t);
  }, [i, ready, dockH, custom, more]);

  const answer = (patch = {}, { skip = false } = {}) => {
    update((cur) => {
      const skipped = new Set(cur.skipped || []);
      if (skip) skipped.add(q); else skipped.delete(q);
      return { ...patch, skipped: [...skipped], step: i + 1 >= QUESTIONS.length ? i : i + 1 };
    });
    if (i + 1 >= QUESTIONS.length) { setBuilding(true); window.scrollTo({ top: 0 }); return; }
    setReady(false);
  };
  const editAt = (j) => { update({ step: j }); setReady(false); };

  if (building) {
    return <BuildMoment user={user} answers={{ ...a, kind: a.kind || 'zimmer' }} tone="b"
      onSetup={() => window.location.replace('/setup')} onApp={() => window.location.replace('/today')} />;
  }

  const skipBtn = <Ghost onClick={() => answer(q === 'kind' && !a.kind ? applyKind(a, 'zimmer') : {}, { skip: true })} className="shrink-0">דלג</Ghost>;

  // the answer dock for the current question
  const docks = {
    kind: (
      <div className="flex flex-col gap-2">
        <div role="radiogroup" aria-label="סוג המקום" className="grid grid-cols-3 gap-2">
          {KINDS.map((t) => (
            <button key={t.value} type="button" role="radio" aria-checked={a.kind === t.value} onClick={() => answer(applyKind(a, t.value))}
              className="ob-choice ob-press flex-col !rounded-[18px]">
              <span className="block aspect-[4/3] w-full overflow-hidden bg-[#E9ECF4]"><img src={t.photo} alt="" className="h-full w-full object-cover" draggable={false} /></span>
              <span className="block px-2 py-2 text-center text-[16px] font-extrabold leading-tight text-navy-900">{t.label}</span>
            </button>
          ))}
        </div>
        {more ? (
          <div role="radiogroup" aria-label="סוגים נוספים" className="grid grid-cols-3 gap-2">
            {MORE_KINDS.map((t) => <button key={t.value} type="button" role="radio" aria-checked={a.kind === t.value} onClick={() => answer(applyKind(a, t.value))} className="ob2-chip ob-press !min-h-[52px] !text-[15px]">{t.label}</button>)}
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          {!more ? <Ghost onClick={() => setMore(true)}>משהו אחר</Ghost> : <span />}
          {skipBtn}
        </div>
      </div>
    ),
    name: (
      <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); answer({ name: a.name.trim() }); }}>
        <label htmlFor="ob2-name" className="sr-only">שם המקום</label>
        <input id="ob2-name" className="ob-input !min-h-[56px] !rounded-full !text-[18px]" value={a.name} maxLength={50} autoComplete="organization"
          placeholder={k.value === 'villa' ? 'למשל: וילה בכרם' : k.value === 'complex' ? 'למשל: מתחם הגליל' : 'למשל: צימרי הגליל'} onChange={(e) => update({ name: e.target.value })} />
        <button type="submit" disabled={a.name.trim().length < 2} aria-label="שליחה" className="ob-primary ob-press !h-14 !min-h-0 !w-14 shrink-0 !rounded-full !p-0"><ArrowUp className="h-6 w-6" aria-hidden /></button>
        {skipBtn}
      </form>
    ),
    count: (
      <div className="flex flex-col gap-2">
        <div role="radiogroup" aria-label={`כמה ${k.units}`} className="grid grid-cols-6 gap-2 max-[359px]:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((v) => <button key={v} type="button" role="radio" aria-checked={!custom && n === v} onClick={() => answer({ unitCount: v })} className="ob2-chip ob-press !px-0 !text-[20px]">{v}</button>)}
        </div>
        {custom ? (
          <div className="flex items-center gap-2">
            <label htmlFor="ob2-count" className="sr-only">מספר</label>
            <input id="ob2-count" className="ob-input !min-h-[56px] !rounded-full tabular-nums" inputMode="numeric" dir="ltr" autoFocus value={String(a.unitCount || '')}
              onChange={(e) => update({ unitCount: clampInt(e.target.value, 1, UNITS_LIMIT) })} />
            <button type="button" onClick={() => answer({})} aria-label="שליחה" className="ob-primary ob-press !h-14 !min-h-0 !w-14 shrink-0 !rounded-full !p-0"><ArrowUp className="h-6 w-6" aria-hidden /></button>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          {!custom ? <Ghost onClick={() => { setCustom(true); update({ unitCount: Math.max(7, n) }); }}>יותר מ-6</Ghost> : <span />}
          {skipBtn}
        </div>
      </div>
    ),
    guests: (
      <div className="flex flex-col gap-2">
        <div role="radiogroup" aria-label="טווחים נפוצים" className="grid grid-cols-4 gap-2">
          {[[2, 4], [4, 8], [10, 20], [10, 30]].map(([lo, hi]) => (
            <button key={`${lo}-${hi}`} type="button" role="radio" aria-checked={!custom && !a.guestsVary && a.guestsMin === lo && a.guestsMax === hi} dir="ltr"
              onClick={() => answer({ guestsMin: lo, guestsMax: hi, guestsVary: false })} className="ob2-chip ob-press !px-0 !text-[17px]">{lo}–{hi}</button>
          ))}
        </div>
        {custom ? (
          <>
            <GuestRange min={clampInt(a.guestsMin, 1, 60)} max={clampInt(a.guestsMax, 1, 60)} onChange={([lo, hi]) => update({ guestsMin: lo, guestsMax: hi, guestsVary: false })} />
            <Primary className="w-full" onClick={() => answer({ guestsVary: false })}>{`${guestsLabel({ ...a, guestsVary: false })}, המשך`}<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="ob2-chip ob-press !text-[16px]" onClick={() => setCustom(true)}>מספר אחר</button>
            <button type="button" className="ob2-chip ob-press !text-[16px]" onClick={() => answer({ guestsVary: true })}>{n > 1 ? 'משתנה בין היחידות' : 'משתנה, אגדיר אחר כך'}</button>
          </div>
        )}
        <div className="flex justify-end">{skipBtn}</div>
      </div>
    ),
    price: (
      <div className="flex flex-col gap-2">
        {custom === 'fixed' || custom === 'varies' ? (
          <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); answer({ priceMode: custom }); }}>
            <MoneyInput autoFocus label={custom === 'fixed' ? 'כמה ללילה?' : 'החל מ- (לא חובה)'} value={custom === 'fixed' ? a.price : a.priceFrom}
              onChange={(v) => update(custom === 'fixed' ? { price: v } : { priceFrom: v })} />
            <Primary type="submit" className="w-full" disabled={custom === 'fixed' && !(Number(a.price) > 0)}>{custom === 'varies' && !(Number(a.priceFrom) > 0) ? 'בלי מחיר התחלתי, המשך' : 'המשך'}<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
          </form>
        ) : (
          <div role="radiogroup" aria-label="מחיר ללילה" className="flex flex-col gap-2">
            {PRICE_MODES.map((m) => (
              <button key={m.value} type="button" role="radio" aria-checked={a.priceMode === m.value}
                onClick={() => { if (m.value === 'later') answer({ priceMode: 'later' }); else { update({ priceMode: m.value }); setCustom(m.value); } }}
                className="ob2-chip ob-press !justify-start !px-5 !text-[17px]">{m.label}</button>
            ))}
          </div>
        )}
        <div className="flex justify-end">{skipBtn}</div>
      </div>
    ),
    times: (
      <div className="flex flex-col gap-2">
        {custom ? (
          <>
            <p className="text-[15px] font-semibold text-navy-900">כניסה מ-</p>
            <TimeChips label="שעת כניסה" options={CHECKIN_TIMES} value={a.checkIn} onChange={(v) => update({ checkIn: v })} />
            <p className="text-[15px] font-semibold text-navy-900">יציאה עד</p>
            <TimeChips label="שעת יציאה" options={CHECKOUT_TIMES} value={a.checkOut} onChange={(v) => update({ checkOut: v })} />
            <Primary className="w-full" onClick={() => answer({ timesVary: false })}>שמירה<Check className="h-5 w-5" strokeWidth={3} aria-hidden /></Primary>
          </>
        ) : (
          <>
            <button type="button" className="ob2-chip ob-press !text-[17px]" aria-pressed="true" onClick={() => answer({ timesVary: false })}>כן, מתאים</button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="ob2-chip ob-press !text-[16px]" onClick={() => answer({ timesVary: true })}>משתנה לפי יום ועונה</button>
              <button type="button" className="ob2-chip ob-press !text-[16px]" onClick={() => setCustom(true)}>שעות אחרות</button>
            </div>
          </>
        )}
        <div className="flex justify-end">{skipBtn}</div>
      </div>
    ),
    channels: (
      <div className="flex flex-col gap-2">
        <div role="group" aria-label="מקורות הזמנות" className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => {
            const on = (a.channels || []).includes(c.value);
            return (
              <button key={c.value} type="button" role="checkbox" aria-checked={on} onClick={() => update((cur) => ({ channels: on ? cur.channels.filter((v) => v !== c.value) : [...(cur.channels || []), c.value] }))}
                className={cn('ob-press inline-flex min-h-[52px] items-center gap-2 rounded-full border-2 px-4 text-[16px] font-bold transition-colors', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#E1E4EE] bg-white text-navy-900')}>
                {on ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : null}{c.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {skipBtn}
          <Primary className="flex-1" onClick={() => answer({})} disabled={!(a.channels || []).length}>המשך<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
        </div>
      </div>
    ),
    plan: (
      <div className="flex items-center gap-2">
        {skipBtn}
        <Primary className="flex-1" onClick={() => answer({})}>יאללה, בונים<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
      </div>
    ),
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob2 flex flex-col" dir="rtl">
        <header className="ob2-head">
          <div className="mx-auto flex w-full max-w-[680px] items-center gap-3 px-4 pb-3 md:px-6">
            <span className="flex h-12 items-center ps-1"><Wordmark size={20} /></span>
            <Progress value={i} total={QUESTIONS.length} label={`שאלה ${i + 1} מתוך ${QUESTIONS.length}`} />
            <HelpLink compact />
          </div>
        </header>
        <div className="ob2-head-space" aria-hidden />

        <main className="mx-auto w-full max-w-[680px] flex-1 px-4 pt-2 md:px-6" style={{ paddingBottom: dockH + 24 }} aria-live="polite">
          <h1 className="sr-only">{again ? 'עדכון פרטי המקום' : 'הקמת המערכת'}</h1>
          <ol className="flex flex-col gap-5" aria-label="השיחה">
            {QUESTIONS.slice(0, i).map((qq, j) => (
              <li key={qq} className="flex flex-col gap-2">
                <BotLines texts={lines(qq, { ...a, kind: a.kind }, again)} animate={false} />
                <div className="flex items-end justify-end gap-1.5">
                  <button type="button" onClick={() => editAt(j)} className="ob-press flex h-11 w-11 items-center justify-center rounded-full text-ink-400 hover:bg-white hover:text-navy-900" aria-label={`שינוי: ${answerText(qq, a)}`}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <p className="ob2-bubble is-me !ms-0">{answerText(qq, a)}</p>
                </div>
              </li>
            ))}
            <li key={`${q}-now`} className="flex flex-col gap-2" data-screen={q}>
              <BotLines key={q} texts={lines(q, a, again)} animate onShown={() => setReady(true)} />
              {q === 'plan' && ready ? (
                <motion.div className="ms-[46px]" initial={still ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                  <PlanPick value={a.plan} onChange={(v) => update({ plan: v })} compact />
                </motion.div>
              ) : null}
            </li>
          </ol>
        </main>

        <footer ref={dock} className="ob2-bar !pt-3" aria-label="התשובה שלך">
          <motion.div className="mx-auto w-full max-w-[680px] md:px-2" key={q} initial={still ? false : { opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }} transition={{ duration: 0.26, ease: EASE }}
            ref={dockInner} style={{ pointerEvents: ready ? 'auto' : 'none' }}>
            <div className="rounded-[26px] bg-white p-3 shadow-[0_-1px_2px_rgba(27,38,86,0.04),0_-16px_40px_-24px_rgba(27,38,86,0.35)]">{docks[q]}</div>
          </motion.div>
        </footer>
      </div>
    </MotionConfig>
  );
}
