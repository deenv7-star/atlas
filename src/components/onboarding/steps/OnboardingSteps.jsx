/**
 * Onboarding, version A ("4 steps"): four short screens with a segmented progress bar (ref: Revolut),
 * each with the live result of that step beside it (desktop) or above it (phones), then a celebratory
 * "המערכת שלך מוכנה" with the owner's whole system, landing on /today.
 *
 * Same writes as before (lib/onboarding/store): organizations + orgSettings after step 1,
 * properties after step 2, orgSettings.channels_today + calendar_syncs after step 3,
 * profiles + hosting settings after step 4, then finishOnboarding (trial, flag, tour).
 */
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Loader2, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import HelpHint from '@/components/help/HelpHint';
import { useOnboardingDraft } from '@/lib/onboarding/useOnboarding';
import {
  BUSINESS_TYPES, OTHER_TYPE, typeInfo, newUnit, PROVIDERS, isIcalUrl, phoneOk,
  saveOwner, saveBusiness, saveUnits, saveHosting, saveChannels, saveStep, finishOnboarding,
} from '@/lib/onboarding/store';
import { Primary, Ghost, BigInput, Chips, IcalHowTo, LinkPaste, CHECKIN_TIMES, CHECKOUT_TIMES, SettlementInput } from '@/components/onboarding/kit';
import { PreviewFull, PreviewCompact } from '@/components/onboarding/a/Preview';
import { Wordmark } from '@/components/app/shell/shared';
import Confetti from '@/components/onboarding/Confetti';
import { readPendingBusiness, clearPendingBusiness } from '@/lib/auth/useRegister';
import { PREVIEWS, SOURCES } from './StepPreviews';

const EASE = [0.23, 1, 0.32, 1];
const STEPS = [
  { id: 'place', label: 'המקום', title: 'ספרו לנו על המקום', sub: 'בוחרים סוג, נותנים שם. רואים אותו נבנה מיד.' },
  { id: 'units', label: 'יחידות', title: 'כמה יחידות להשכרה?', sub: 'כל יחידה תקבל שורה משלה בלוח השנה.' },
  { id: 'sources', label: 'הזמנות', title: 'מאיפה מגיעות הזמנות?', sub: 'נאסוף הכל ללוח אחד. אפשר לדלג ולחבר אחר כך.' },
  { id: 'guests', label: 'אורחים', title: 'עוד רגע מוכן', sub: 'איך קוראים לכם, ומתי האורחים נכנסים ויוצאים.' },
];
const PREVIEW_TITLES = ['ככה האורחים יראו את המקום', 'לוח השנה שלכם', 'כל ההזמנות במקום אחד', 'ההודעה שהאורח יקבל'];

function Segments({ step }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5" role="group" aria-label={`שלב ${step + 1} מתוך ${STEPS.length}: ${STEPS[step].label}`}>
      <div className="flex gap-1.5" aria-hidden>
        {STEPS.map((s, k) => (
          <span key={s.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E1E4EE]">
            <span className="block h-full origin-right rounded-full bg-brand-600 transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${k <= step ? 1 : 0})` }} />
          </span>
        ))}
      </div>
      <div className="flex justify-between text-[11px] font-semibold max-[359px]:hidden sm:text-[12px]" aria-hidden>
        {STEPS.map((s, k) => <span key={s.id} className={cn('flex-1 text-center transition-colors', k === step ? 'text-brand-700' : k < step ? 'text-navy-900' : 'text-ink-400')}>{s.label}</span>)}
      </div>
    </div>
  );
}

function SectionLabel({ children, id }) {
  return <p id={id} className="text-[15px] font-bold text-navy-900">{children}</p>;
}

export default function OnboardingSteps({ user, again = false }) {
  const { draft: d, update, ready } = useOnboardingDraft(user);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const T = typeInfo(d.type);
  const step = Math.max(0, Math.min(4, Number(d.stepA) || 0));
  const done = step === 4;

  // start from the name typed on the register screen
  useEffect(() => {
    if (!ready || d.businessName) return;
    const pending = readPendingBusiness() || (user?.organization_name && user.organization_name !== 'My Organization' ? user.organization_name : '');
    if (pending) update({ businessName: pending });
  }, [ready]);
  // first time on units: the most common answer (1 for a single place, else 2)
  useEffect(() => {
    if (step === 1 && d.units.length === 0) setCount(T.single ? 1 : 2);
  }, [step]);
  useEffect(() => { setError(''); }, [step]);

  const otaChosen = (d.channelsToday || []).some((v) => v === 'booking' || v === 'airbnb');
  const can = [
    () => !!d.type && d.businessName.trim().length >= 2,
    () => d.units.length >= 1 && d.units.every((u) => u.name.trim()),
    () => true,
    () => d.ownerName.trim().length >= 2 && (!d.ownerPhone || phoneOk(d.ownerPhone)),
  ];
  const leave = [
    () => saveBusiness(user, d),
    async () => { const res = await saveUnits(d); update(res); },
    async () => { await saveBusiness(user, d); if (otaChosen) { const sv = await saveChannels(d); update({ savedSyncs: sv }); } },
    async () => { await saveOwner(d); await saveHosting(user, d); },
  ];

  const go = async (to) => {
    if (busy) return;
    const forward = to > step;
    setError('');
    if (forward) {
      setBusy(true);
      try { await leave[step](); } catch (e) {
        setBusy(false);
        setError(e?.message && e.message.length < 140 ? `לא הצלחנו לשמור: ${e.message}` : 'לא הצלחנו לשמור. בדקו את החיבור ונסו שוב.');
        return;
      }
      setBusy(false);
      if (to < 4) saveStep(to + 1);
    }
    setDir(forward ? 1 : -1);
    update({ stepA: to });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  // reaching the end marks the account as set up (the button only navigates)
  const finishing = useRef(null);
  useEffect(() => {
    if (done && !finishing.current) {
      finishing.current = finishOnboarding(user).then(() => clearPendingBusiness());
    }
  }, [done, user]);
  const enter = async () => {
    setBusy(true);
    try { await (finishing.current || finishOnboarding(user)); } finally { window.location.replace('/today'); }
  };

  function setCount(n) {
    update((cur) => {
      const units = [...cur.units];
      while (units.length < n) units.push(newUnit(cur.type, units.length));
      while (units.length > n && !units[units.length - 1].existing) units.pop();
      if (units.length === 1 && !units[0].existing && /^\S+ 1$/.test(units[0].name) && cur.businessName.trim() && typeInfo(cur.type).single) {
        units[0] = { ...units[0], name: cur.businessName.trim().slice(0, 40) };
      }
      return { units };
    });
  }
  const setUnit = (k, patch) => update((cur) => ({ units: cur.units.map((u) => (u.key === k ? { ...u, ...patch } : u)) }));
  const pickType = (value) => update((cur) => {
    const info = typeInfo(value);
    let units = cur.units.map((u, n) => (u.existing || !/^\S+ \d+$/.test(u.name) ? u : { ...u, name: `${info.unit} ${n + 1}` }));
    if (info.single && units.length > 1) units = units.filter((u, n) => u.existing || n === 0);
    return { type: value, units };
  });

  if (!ready) {
    return <div className="ob flex items-center justify-center" role="status" aria-label="טוען"><Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden /></div>;
  }

  const canNext = done ? true : can[step]();
  const Preview = PREVIEWS[Math.min(step, 3)];

  const body = (() => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <SectionLabel id="type-label">איזה מקום?</SectionLabel>
              <div role="radiogroup" aria-labelledby="type-label" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[...BUSINESS_TYPES, OTHER_TYPE].map((t, k) => {
                  const on = d.type === t.value;
                  return (
                    <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => pickType(t.value)}
                      className="ob-choice ob-press ob-pop relative flex-col !rounded-[18px]" style={{ animationDelay: `${k * 30}ms` }}>
                      <span className="relative block aspect-[2/1] w-full overflow-hidden bg-[#E9ECF4] sm:aspect-[16/10]">
                        <img src={t.photo} alt="" className="h-full w-full object-cover" draggable={false} />
                        <span className={cn('absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow transition-[opacity,transform] duration-200', on ? 'scale-100 opacity-100' : 'scale-75 opacity-0')} aria-hidden><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                      </span>
                      <span className="block px-2.5 py-1.5 text-start text-[15px] font-bold leading-tight text-navy-900 sm:py-2">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <BigInput label="שם המקום" value={d.businessName} onChange={(e) => update({ businessName: e.target.value })}
              placeholder={{ hotel: 'למשל: מלון הגליל', boutique: 'למשל: בית הכרמל', villa: 'למשל: וילה בכרם', apartments: 'למשל: דירות הים', guesthouse: 'למשל: בית הארחה נוף' }[d.type] || 'למשל: צימרי הגליל'} maxLength={50} autoComplete="organization" />
            <SettlementInput value={d.settlement} onChange={(v) => update({ settlement: v })} />
          </div>
        );
      case 1: {
        const n = Math.max(1, d.units.length);
        const minN = Math.max(1, d.units.filter((u) => u.existing).length);
        return (
          <div className="flex flex-col gap-6">
            {!T.single ? (
              <div className="flex flex-col gap-3">
                <SectionLabel id="count-label">{`כמה ${T.units}?`}</SectionLabel>
                <div role="radiogroup" aria-labelledby="count-label" className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((k) => (
                    <button key={k} type="button" role="radio" aria-checked={n === k} onClick={() => setCount(Math.max(minN, k))}
                      className={cn('ob-press flex h-14 items-center justify-center rounded-[16px] border-2 text-[20px] font-extrabold tabular-nums transition-colors duration-150',
                        n === k ? 'border-brand-600 bg-brand-600 text-white shadow-[0_10px_24px_-12px_rgba(62,43,241,0.8)]' : 'border-[#E1E4EE] bg-white text-navy-900 hover:border-brand-300')}>
                      {k}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-[16px] bg-white px-4 py-2 shadow-[0_1px_2px_rgba(27,38,86,0.05)]">
                  <span className="text-[15px] text-ink-600">יותר מ-6?</span>
                  <div className="flex items-center gap-2" role="group" aria-label="מספר יחידות">
                    <button type="button" className="ob-round ob-press !h-11 !w-11" onClick={() => setCount(Math.max(minN, n - 1))} disabled={n <= minN} aria-label="פחות יחידות"><Minus className="h-4 w-4" aria-hidden /></button>
                    <span className="min-w-[2.5ch] text-center text-[20px] font-extrabold tabular-nums text-navy-900" aria-live="polite">{n}</span>
                    <button type="button" className="ob-round ob-press !h-11 !w-11" onClick={() => setCount(Math.min(30, n + 1))} disabled={n >= 30} aria-label="עוד יחידות"><Plus className="h-4 w-4" aria-hidden /></button>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-2.5">
              <SectionLabel>שם, אורחים ומחיר ללילה</SectionLabel>
              <ul className="flex flex-col gap-2.5">
                {d.units.map((u, k) => (
                  <li key={u.key} className="ob-pop grid grid-cols-[1fr_auto] items-end gap-2 rounded-[18px] bg-white p-3 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_8px_22px_-14px_rgba(27,38,86,0.2)] sm:grid-cols-[1.4fr_0.8fr_0.9fr_auto]" style={{ animationDelay: `${k * 30}ms` }}>
                    <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                      <span className="text-[12px] font-semibold text-ink-400">שם</span>
                      <input className="ob-input !min-h-[48px] !text-[16px]" value={u.name} maxLength={40} onChange={(e) => setUnit(u.key, { name: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] font-semibold text-ink-400">אורחים</span>
                      <input className="ob-input !min-h-[48px] !text-[16px] tabular-nums" inputMode="numeric" dir="ltr" value={String(u.guests)} onChange={(e) => setUnit(u.key, { guests: Math.min(40, Number(e.target.value.replace(/[^\d]/g, '')) || 1) })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] font-semibold text-ink-400">₪ ללילה</span>
                      <input className="ob-input !min-h-[48px] !text-[16px] tabular-nums" inputMode="numeric" dir="ltr" value={String(u.price ?? '')} onChange={(e) => setUnit(u.key, { price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} />
                    </label>
                    {!u.existing && d.units.length > 1 ? (
                      <button type="button" onClick={() => update((cur) => ({ units: cur.units.filter((x) => x.key !== u.key) }))} className="ob-press flex h-12 w-12 items-center justify-center rounded-[14px] text-ink-400 hover:bg-[#FDEEEE] hover:text-danger-600" aria-label={`הסרת ${u.name || 'יחידה'}`}>
                        <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                      </button>
                    ) : <span className="hidden w-12 sm:block" />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      }
      case 2:
        return (
          <div className="flex flex-col gap-5">
            <div role="group" aria-label="מקורות הזמנות" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {SOURCES.map((s, k) => {
                const on = (d.channelsToday || []).includes(s.value);
                return (
                  <button key={s.value} type="button" role="checkbox" aria-checked={on}
                    onClick={() => update((cur) => {
                      const list = cur.channelsToday || [];
                      const next = on ? list.filter((v) => v !== s.value) : [...list, s.value];
                      const prov = s.value === 'booking' ? 'BOOKING_COM' : s.value === 'airbnb' ? 'AIRBNB' : null;
                      return prov ? { channelsToday: next, channels: { ...cur.channels, [prov]: { ...cur.channels[prov], on: !on } } } : { channelsToday: next };
                    })}
                    className="ob-choice ob-press ob-pop flex-row items-center gap-3 !rounded-[18px] p-3 text-start" style={{ animationDelay: `${k * 30}ms` }}>
                    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[15px] font-extrabold transition-colors', on ? 'max-sm:bg-brand-600 max-sm:text-white' : '', s.tone)} aria-hidden>
                      {on ? <Check className="h-5 w-5 sm:hidden" strokeWidth={3} /> : null}
                      <span className={cn(on && 'max-sm:hidden')}>{s.Icon ? <s.Icon className="h-5 w-5" strokeWidth={1.9} /> : s.mark}</span>
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-bold leading-tight text-navy-900"><span className="sm:hidden">{s.short}</span><span className="max-sm:hidden">{s.label}</span></span>
                    <span className={cn('hidden h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:flex', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#D5D9E6]')} aria-hidden>{on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}</span>
                  </button>
                );
              })}
            </div>
            {Object.entries(PROVIDERS).filter(([k]) => (d.channelsToday || []).includes(k === 'AIRBNB' ? 'airbnb' : 'booking')).map(([k, p]) => {
              const ch = d.channels[k];
              const setCh = (patch) => update((cur) => ({ channels: { ...cur.channels, [k]: { ...cur.channels[k], on: true, ...patch } } }));
              return (
                <details key={k} className="ob-fade group overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.04),0_8px_22px_-14px_rgba(27,38,86,0.2)]">
                  <summary className="flex min-h-[60px] cursor-pointer list-none items-center gap-3 px-4 text-[16px] font-bold text-navy-900 [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">חיבור לוח השנה של {p.label} <span className="font-medium text-ink-400">(לא חובה)</span></span>
                    <ArrowLeft className="h-4 w-4 text-brand-600 transition-transform duration-200 group-open:-rotate-90" aria-hidden />
                  </summary>
                  <div className="flex flex-col gap-4 border-t border-[#EEF0F5] p-4">
                    <IcalHowTo provider={k} />
                    {d.units.map((u) => (
                      <LinkPaste key={u.key} label={`הקישור של ${u.name}`} value={ch.links?.[u.key] || ''} valid={isIcalUrl(ch.links?.[u.key])}
                        onChange={(v) => setCh({ links: { ...(ch.links || {}), [u.key]: v } })} />
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <BigInput label="השם שלכם" value={d.ownerName} onChange={(e) => update({ ownerName: e.target.value })} placeholder="למשל: יעל לוי" autoComplete="name" maxLength={60} />
              <BigInput label="נייד (לא חובה)" type="tel" inputMode="tel" dir="ltr" className="text-right" value={d.ownerPhone} onChange={(e) => update({ ownerPhone: e.target.value, phoneVerified: false })} placeholder="050-000-0000" autoComplete="tel"
                error={d.ownerPhone && !phoneOk(d.ownerPhone) ? 'חסרות ספרות. מספר נייד הוא 10 ספרות.' : ''} />
            </div>
            <div className="flex flex-col gap-3">
              <SectionLabel>כניסה מ-</SectionLabel>
              <Chips label="שעת כניסה" options={CHECKIN_TIMES} value={d.checkIn} onChange={(v) => update({ checkIn: v })} />
            </div>
            <div className="flex flex-col gap-3">
              <SectionLabel>יציאה עד</SectionLabel>
              <Chips label="שעת יציאה" options={CHECKOUT_TIMES} value={d.checkOut} onChange={(v) => update({ checkOut: v })} />
            </div>
          </div>
        );
      default:
        return <Ready d={d} />;
    }
  })();

  const variants = {
    enter: (k) => ({ opacity: 0, x: k > 0 ? -24 : 24 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE } },
    exit: (k) => ({ opacity: 0, x: k > 0 ? 16 : -16, transition: { duration: 0.15, ease: EASE } }),
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob flex flex-col lg:flex-row" dir="rtl" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !done && canNext && e.target.getAttribute('role') !== 'combobox') { e.preventDefault(); go(step + 1); } }}>
        <main className={cn('relative flex min-h-[100dvh] w-full flex-col', done ? 'lg:w-[520px] lg:shrink-0' : 'lg:w-[600px] lg:shrink-0 xl:w-[640px]')}>
          <header className="sticky top-0 z-20 flex items-center gap-3 bg-[var(--canvas)]/90 px-5 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur md:px-10">
            {step > 0 && !done ? (
              <Ghost onClick={() => go(step - 1)} aria-label="חזרה" className="!h-12 !w-12 !px-0"><ArrowRight className="h-6 w-6" aria-hidden /></Ghost>
            ) : <span className="flex h-12 items-center"><Wordmark size={20} /></span>}
            {!done ? <Segments step={step} /> : <span className="flex-1" />}
            {!done ? <HelpHint id={`onb.${['type', 'units', 'today', 'times'][step]}`} /> : null}
          </header>

          <div className="relative flex-1 overflow-x-clip px-5 pb-40 pt-4 md:px-10 lg:pt-8">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.section key={step} data-screen={STEPS[step]?.id || 'ready'} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" aria-live="polite">
                {!done ? (
                  <>
                    <div className="mb-5 lg:hidden"><Preview d={d} size="sm" /></div>
                    <p className="text-[14px] font-bold text-brand-600">שלב {step + 1} מתוך 4</p>
                    <h1 className="mt-1 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-navy-900 md:text-[34px]">
                      {step === 0 && again ? 'נעדכן את פרטי המקום' : STEPS[step].title}
                    </h1>
                    <p className="mb-6 mt-1.5 text-[16px] text-ink-600">{STEPS[step].sub}</p>
                  </>
                ) : null}
                {body}
              </motion.section>
            </AnimatePresence>
          </div>

          <footer className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[var(--canvas)] via-[var(--canvas)] to-transparent px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-6 md:px-10 lg:absolute">
            {error ? <p className="mb-3 rounded-[14px] bg-[var(--st-red-bg)] px-4 py-3 text-[15px] font-medium text-[var(--st-red-fg)]" role="alert">{error}</p> : null}
            {done ? (
              <Primary className="w-full" onClick={enter} disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden /> : null}כניסה למערכת<ArrowLeft className="h-5 w-5" aria-hidden />
              </Primary>
            ) : (
              <div className="flex items-center gap-3">
                {step === 2 && !(d.channelsToday || []).length ? <Ghost onClick={() => go(3)} disabled={busy}>אחר כך</Ghost> : null}
                <Primary className="flex-1" onClick={() => go(step + 1)} disabled={!canNext || busy} aria-busy={busy}>
                  {busy ? <><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />שומרים…</> : <>{step === 3 ? 'סיום' : 'המשך'}<ArrowLeft className="h-5 w-5" aria-hidden /></>}
                </Primary>
              </div>
            )}
            {!done ? <p className="mt-2 text-center text-[13px] text-ink-400">הכל נשמר לבד. אפשר לחזור בכל רגע.</p> : null}
          </footer>
        </main>

        {/* live result of this step (desktop) */}
        <aside className="sticky top-0 hidden h-[100dvh] min-w-0 flex-1 p-5 lg:block" aria-hidden>
          <div className="relative flex h-full flex-col overflow-hidden rounded-[32px] bg-[#EAEDF7]">
            <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,43,241,0.16),rgba(62,43,241,0))]" />
            {done ? (
              <motion.div className="relative h-full p-4" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}>
                <PreviewFull d={d} focus={null} className="h-full" />
              </motion.div>
            ) : (
              <>
                <div className="relative flex flex-1 flex-col items-center justify-center gap-5 p-8">
                  <p className="text-[14px] font-semibold text-brand-700">{PREVIEW_TITLES[step]}</p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={step} initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE } }} exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}>
                      <Preview d={d} size="lg" />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="relative flex justify-center gap-2 pb-8">
                  {STEPS.map((s, k) => (
                    <span key={s.id} className={cn('flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-[background-color,color] duration-300', k < step ? 'bg-white text-navy-900 shadow-sm' : k === step ? 'bg-brand-600 text-white' : 'text-ink-400')}>
                      {k < step ? <Check className="h-3.5 w-3.5 text-brand-600" strokeWidth={3} /> : null}{s.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}

function Ready({ d }) {
  const still = useReducedMotion();
  const n = d.units.length;
  const chosen = SOURCES.filter((s) => (d.channelsToday || []).includes(s.value));
  const items = [
    `${n} ${n === 1 ? typeInfo(d.type).unit : typeInfo(d.type).units} בלוח השנה`,
    chosen.length ? `הזמנות מ-${chosen.slice(0, 2).map((s) => s.label.split(' ')[0]).join(' ו-')}${chosen.length > 2 ? ' ועוד' : ''} ללוח אחד` : 'לוח הזמנות אחד, בלי כפילויות',
    `הודעת וואטסאפ לאורחים · כניסה ${d.checkIn}`,
  ];
  return (
    <div className="flex flex-col items-center pt-6 text-center lg:items-start lg:pt-16 lg:text-start">
      <div className="relative h-[96px] w-[96px]">
        <Confetti />
        <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden className="relative">
          <motion.circle cx="48" cy="48" r="44" fill="#3E2BF1" initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }} style={{ transformOrigin: '50% 50%' }} />
          <motion.path d="M30 49l12 12 24-26" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
            initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.25, ease: EASE }} />
        </svg>
      </div>
      <motion.h1 initial={still ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
        className="mt-7 text-[34px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 md:text-[42px]">המערכת שלך מוכנה</motion.h1>
      <motion.p initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.45 }} className="mt-2 text-[17px] text-ink-600">
        {d.businessName.trim() || 'המקום שלכם'} כבר בפנים. ההזמנה הראשונה יכולה להיכנס.
      </motion.p>
      <ul className="mt-7 flex w-full flex-col gap-2">
        {items.map((t, k) => (
          <motion.li key={t} initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.55 + k * 0.08, ease: EASE }}
            className="flex min-h-[52px] items-center gap-3 rounded-[16px] bg-white px-4 text-start shadow-[0_1px_2px_rgba(27,38,86,0.04)]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Check className="h-4 w-4" strokeWidth={3} aria-hidden /></span>
            <span className="text-[15px] font-semibold text-navy-900">{t}</span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-5 w-full lg:hidden"><PreviewCompact d={d} focus={null} /></div>
    </div>
  );
}
