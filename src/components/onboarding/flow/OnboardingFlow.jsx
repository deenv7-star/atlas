/**
 * Onboarding, version B ("one question at a time"; refs: Duolingo, Airbnb "what would you like to host",
 * Untitled UI onboarding steps). One question per screen, big tappable visual cards, a top progress bar,
 * then a personalised "הנה מה ש-ATLAS יעשה בשבילך" and the system ready, landing on /today.
 *
 * Same writes as before (lib/onboarding/store): organizations + orgSettings after the name,
 * properties after "how many", orgSettings.channels_today after the channels, orgSettings.pain_points
 * (new key inside the existing settings JSON, no schema change) after "what bothers you", profiles after
 * the owner's name, hosting defaults + finishOnboarding (trial, flag, tour) on "set it up".
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Minus, Plus, Home, Phone, Globe, Instagram, MapPin, CalendarX2, Wallet,
  MessageCircle, Sparkles as Broom, PieChart, NotebookPen, CalendarDays, LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import HelpHint from '@/components/help/HelpHint';
import { useOnboardingDraft } from '@/lib/onboarding/useOnboarding';
import {
  BUSINESS_TYPES, OTHER_TYPE, typeInfo, newUnit, phoneOk,
  saveOwner, saveBusiness, saveUnits, saveHosting, saveStep, finishOnboarding,
} from '@/lib/onboarding/store';
import { writeOrgSettings } from '@/lib/onboarding/orgSettings';
import { Primary, Ghost, BigInput } from '@/components/onboarding/kit';
import { Wordmark } from '@/components/app/shell/shared';
import Confetti from '@/components/onboarding/Confetti';
import { readPendingBusiness, clearPendingBusiness } from '@/lib/auth/useRegister';

const EASE = [0.23, 1, 0.32, 1];

const SOURCES = [
  { value: 'booking', label: 'Booking.com', mark: 'B.', tone: 'bg-navy-900 text-white' },
  { value: 'airbnb', label: 'Airbnb', mark: 'A', tone: 'bg-brand-600 text-white' },
  { value: 'phone', label: 'טלפון ווואטסאפ', Icon: Phone },
  { value: 'website', label: 'אתר משלי', Icon: Globe },
  { value: 'portals', label: 'אתרי צימרים', Icon: MapPin },
  { value: 'social', label: 'פייסבוק ואינסטגרם', Icon: Instagram },
];

export const PAINS = [
  { value: 'double', label: 'כפילויות בין הערוצים', line: 'אותו לילה נתפס פעמיים', Icon: CalendarX2,
    gives: { t: 'אין יותר כפילויות', d: 'הזמנות מ-Booking ו-Airbnb נכנסות לבד ללוח אחד וחוסמות את התאריכים.' } },
  { value: 'payments', label: 'לרדוף אחרי תשלומים', line: 'מקדמות, יתרות, מי שילם', Icon: Wallet,
    gives: { t: 'רואים מי שילם ומה פתוח', d: 'מקדמה ויתרה לכל הזמנה, ותזכורת כשמשהו עוד לא נגבה.' } },
  { value: 'messages', label: 'לענות לאורחים שוב ושוב', line: 'אותן שאלות בוואטסאפ', Icon: MessageCircle,
    gives: { t: 'הודעות בלחיצה אחת', d: 'אישור הזמנה בוואטסאפ עם השם, התאריכים ושעת הכניסה. מוכן מראש.' } },
  { value: 'cleaning', label: 'לתאם ניקיון', line: 'בין יציאה לכניסה', Icon: Broom,
    gives: { t: 'ניקיון מסודר', d: 'משימת ניקיון לכל יציאה, עם השעה ומי אחראי.' } },
  { value: 'money', label: 'לא ברור כמה הרווחתי', line: 'הכנסות ותפוסה', Icon: PieChart,
    gives: { t: 'יודעים בדיוק כמה הרווחתם', d: 'הכנסות החודש ותפוסה במסך הבית, בלי חישובים.' } },
  { value: 'notebook', label: 'הכל במחברת ובראש', line: 'אין תמונה אחת', Icon: NotebookPen,
    gives: { t: 'הכל במקום אחד', d: 'כל ההזמנות, האורחים והתשלומים במסך אחד, גם מהנייד.' } },
];

const COUNT_CHOICES = [1, 2, 3, 4, 5, 6];

function Question({ kicker, title, sub }) {
  return (
    <div className="mb-6 flex flex-col gap-2 md:mb-8">
      {kicker ? <p className="text-[14px] font-bold text-brand-600">{kicker}</p> : null}
      <h1 className="text-[30px] font-extrabold leading-[1.12] tracking-[-0.025em] text-navy-900 md:text-[38px]">{title}</h1>
      {sub ? <p className="text-[17px] leading-relaxed text-ink-600">{sub}</p> : null}
    </div>
  );
}

function Tick({ on }) {
  return (
    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-200', on ? 'scale-100 border-brand-600 bg-brand-600 text-white' : 'border-[#D5D9E6] bg-white')} aria-hidden>
      {on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
    </span>
  );
}

export default function OnboardingFlow({ user, again = false }) {
  const { draft: d, update, ready } = useOnboardingDraft(user);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const autoNext = useRef(null);
  const T = typeInfo(d.type);
  const first = d.ownerName.trim().split(/\s+/)[0] || '';

  useEffect(() => {
    if (!ready || d.businessName) return;
    const pending = readPendingBusiness() || (user?.organization_name && user.organization_name !== 'My Organization' ? user.organization_name : '');
    if (pending) update({ businessName: pending });
  }, [ready]);
  useEffect(() => () => clearTimeout(autoNext.current), []);

  const unitsFor = (cur, n) => {
    const info = typeInfo(cur.type);
    const units = [...cur.units];
    while (units.length < n) units.push(newUnit(cur.type, units.length));
    while (units.length > n && !units[units.length - 1].existing) units.pop();
    if (info.single && units.length === 1 && !units[0].existing && /^\S+ 1$/.test(units[0].name) && cur.businessName.trim()) {
      units[0] = { ...units[0], name: cur.businessName.trim().slice(0, 40) };
    }
    return units;
  };
  const ensureUnits = (n) => update((cur) => ({ units: unitsFor(cur, n) }));

  // saveUnits needs the freshest draft (auto-advance runs from an older render)
  const dRef = useRef(d);
  dRef.current = d;
  const persistUnits = async (cur = dRef.current) => { const res = await saveUnits(cur); update(res); };

  const screens = useMemo(() => [
    { id: 'type', auto: true, can: () => !!d.type },
    { id: 'name', can: () => d.businessName.trim().length >= 2, leave: async () => {
      await saveBusiness(user, d);
      if (T.single) { const cur = dRef.current; await persistUnits({ ...cur, units: unitsFor(cur, 1) }); }
    } },
    { id: 'count', skip: () => T.single, can: () => d.units.length >= 1, leave: () => persistUnits() },
    { id: 'channels', optional: true, leave: () => saveBusiness(user, d) },
    { id: 'pain', optional: true, leave: () => writeOrgSettings(user?.organization_id, { pain_points: d.painPoints || [] }) },
    { id: 'owner', can: () => d.ownerName.trim().length >= 2 && (!d.ownerPhone || phoneOk(d.ownerPhone)), leave: () => saveOwner(d) },
    { id: 'summary', leave: () => saveHosting(user, d) },
    { id: 'ready' },
  ], [d, user, T.single]);

  const i = Math.min(Number(d.qB) || 0, screens.length - 1);
  const s = screens[i];
  const visible = screens.filter((x) => !x.skip?.() && x.id !== 'ready');
  const pos = Math.max(0, visible.indexOf(s));
  const isReady = s.id === 'ready';

  useEffect(() => {
    if (s.id === 'count' && d.units.length === 0) ensureUnits(2);
    setError('');
  }, [s.id]);

  const step = (from, k) => { let t = from + k; while (screens[t]?.skip?.()) t += k; return Math.max(0, Math.min(screens.length - 1, t)); };
  const go = async (to, { skip = false } = {}) => {
    if (busy) return;
    const forward = to > i;
    setError('');
    if (forward && s.leave && !skip) {
      setBusy(true);
      try { await s.leave(); } catch (e) {
        setBusy(false);
        setError(e?.message && e.message.length < 140 ? `לא הצלחנו לשמור: ${e.message}` : 'לא הצלחנו לשמור. בדקו את החיבור ונסו שוב.');
        return;
      }
      setBusy(false);
      saveStep(Math.min(8, to + 1));
    }
    setDir(forward ? 1 : -1);
    update({ qB: to });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };
  const next = () => go(step(i, 1));
  const back = () => go(step(i, -1));
  const autoAdvance = () => { clearTimeout(autoNext.current); autoNext.current = setTimeout(() => go(step(i, 1)), 380); };

  const finishing = useRef(null);
  useEffect(() => {
    if (isReady && !finishing.current) finishing.current = finishOnboarding(user).then(() => clearPendingBusiness());
  }, [isReady, user]);
  const enter = async () => {
    setBusy(true);
    try { await (finishing.current || finishOnboarding(user)); } finally { window.location.replace('/today'); }
  };

  if (!ready) {
    return <div className="ob flex items-center justify-center" role="status" aria-label="טוען"><Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden /></div>;
  }

  const canNext = s.can ? s.can() : true;
  const n = d.units.length;

  const body = (() => {
    switch (s.id) {
      case 'type':
        return (
          <>
            <Question kicker={again ? 'נעדכן את הפרטים' : 'ברוכים הבאים ל-ATLAS'} title="מה אתם מארחים?" sub="בחרו את מה שהכי קרוב." />
            <div role="radiogroup" aria-label="סוג המקום" className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[...BUSINESS_TYPES, OTHER_TYPE].map((t, k) => {
                const on = d.type === t.value;
                return (
                  <motion.button key={t.value} type="button" role="radio" aria-checked={on}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE, delay: k * 0.035 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      update((cur) => {
                        const info = typeInfo(t.value);
                        let units = cur.units.map((u, m) => (u.existing || !/^\S+ \d+$/.test(u.name) ? u : { ...u, name: `${info.unit} ${m + 1}` }));
                        if (info.single && units.length > 1) units = units.filter((u, m) => u.existing || m === 0);
                        return { type: t.value, units };
                      });
                      autoAdvance();
                    }}
                    className="ob-choice relative flex-col !rounded-[22px] text-start">
                    <span className="relative block aspect-[4/3] w-full overflow-hidden bg-[#E9ECF4]">
                      <img src={t.photo} alt="" className="h-full w-full object-cover" draggable={false} />
                      <span className="absolute end-2.5 top-2.5"><Tick on={on} /></span>
                    </span>
                    <span className="flex flex-col px-3.5 pb-3 pt-2.5">
                      <span className="text-[18px] font-bold leading-tight text-navy-900 md:text-[16px]">{t.label}</span>
                      <span className="text-[13px] text-ink-400 md:text-[12px]">{t.line}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </>
        );
      case 'name':
        return (
          <>
            <Question kicker={T.label} title={`איך קוראים ל${T.single ? T.label : 'מקום'}?`} sub="השם יופיע במערכת ובהודעות לאורחים." />
            <div className="flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_14px_34px_-18px_rgba(27,38,86,0.3)]">
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-[#E9ECF4] sm:h-[72px] sm:w-[72px] sm:rounded-[18px]"><img src={T.photo} alt="" className="h-full w-full object-cover" /></span>
              <div className="min-w-0 flex-1">
                <BigInput label="שם המקום" value={d.businessName} onChange={(e) => update({ businessName: e.target.value })} autoFocus maxLength={50} autoComplete="organization"
                  placeholder={{ hotel: 'למשל: מלון הגליל', boutique: 'למשל: בית הכרמל', villa: 'למשל: וילה בכרם', apartments: 'למשל: דירות הים', guesthouse: 'למשל: בית הארחה נוף' }[d.type] || 'למשל: צימרי הגליל'} />
              </div>
            </div>
          </>
        );
      case 'count':
        return (
          <>
            <Question title={`כמה ${T.units} יש לכם?`} sub="כל אחת תקבל שורה בלוח השנה. אפשר לשנות בכל זמן." />
            <div role="radiogroup" aria-label={`מספר ${T.units}`} className="grid grid-cols-3 gap-3">
              {COUNT_CHOICES.map((k, idx) => {
                const isMore = k === 6;
                const on = isMore ? n >= 6 : n === k;
                return (
                  <motion.button key={k} type="button" role="radio" aria-checked={on} aria-label={isMore ? `6 ${T.units} או יותר` : `${k} ${k === 1 ? T.unit : T.units}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE, delay: idx * 0.04 } }} whileTap={{ scale: 0.96 }}
                    onClick={() => { ensureUnits(isMore ? Math.max(6, n) : k); setMore(isMore); if (!isMore) autoAdvance(); }}
                    className="ob-choice flex-col items-center justify-center gap-2 !rounded-[22px] py-5">
                    <span className="flex h-8 flex-wrap items-end justify-center gap-0.5" aria-hidden>
                      {Array.from({ length: Math.min(k, 6) }).map((_, m) => (
                        <Home key={m} className={cn('h-5 w-5 transition-colors', on ? 'text-brand-600' : 'text-[#B9BFD3]')} strokeWidth={2} />
                      ))}
                    </span>
                    <span className="text-[30px] font-extrabold leading-none tabular-nums text-navy-900">{isMore ? '6+' : k}</span>
                  </motion.button>
                );
              })}
            </div>
            {more || n >= 6 ? (
              <div className="ob-fade mt-4 flex items-center justify-between rounded-[20px] bg-white px-5 py-3 shadow-[0_1px_2px_rgba(27,38,86,0.05)]">
                <span className="text-[16px] font-semibold text-navy-900">{`כמה ${T.units} בדיוק?`}</span>
                <div className="flex items-center gap-2" role="group" aria-label="מספר מדויק">
                  <button type="button" className="ob-round ob-press" onClick={() => ensureUnits(Math.max(1, n - 1))} disabled={n <= 1} aria-label="פחות"><Minus className="h-5 w-5" aria-hidden /></button>
                  <span className="min-w-[2.5ch] text-center text-[26px] font-extrabold tabular-nums text-navy-900" aria-live="polite">{n}</span>
                  <button type="button" className="ob-round ob-press" onClick={() => ensureUnits(Math.min(30, n + 1))} disabled={n >= 30} aria-label="עוד"><Plus className="h-5 w-5" aria-hidden /></button>
                </div>
              </div>
            ) : null}
          </>
        );
      case 'channels':
        return (
          <>
            <Question title="מאיפה מגיעות אליכם הזמנות?" sub="אפשר לבחור כמה." />
            <div role="group" aria-label="מקורות הזמנות" className="grid grid-cols-2 gap-3">
              {SOURCES.map((o, k) => {
                const on = (d.channelsToday || []).includes(o.value);
                return (
                  <motion.button key={o.value} type="button" role="checkbox" aria-checked={on}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE, delay: k * 0.04 } }} whileTap={{ scale: 0.97 }}
                    onClick={() => update((cur) => ({ channelsToday: on ? (cur.channelsToday || []).filter((v) => v !== o.value) : [...(cur.channelsToday || []), o.value] }))}
                    className="ob-choice min-h-[124px] flex-col items-start justify-between gap-3 !rounded-[22px] p-4 text-start">
                    <span className="flex w-full items-start justify-between">
                      <span className={cn('flex h-12 w-12 items-center justify-center rounded-[14px] text-[17px] font-extrabold', o.tone || 'bg-brand-50 text-brand-600')} aria-hidden>
                        {o.Icon ? <o.Icon className="h-6 w-6" strokeWidth={1.8} /> : o.mark}
                      </span>
                      <Tick on={on} />
                    </span>
                    <span className="text-[17px] font-bold leading-tight text-navy-900">{o.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </>
        );
      case 'pain':
        return (
          <>
            <Question title="מה הכי מציק לכם היום?" sub="בחרו כמה שרוצים. ככה נדע במה להתחיל." />
            <div role="group" aria-label="מה מציק" className="flex flex-col gap-2.5">
              {PAINS.map((p, k) => {
                const on = (d.painPoints || []).includes(p.value);
                return (
                  <motion.button key={p.value} type="button" role="checkbox" aria-checked={on}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE, delay: k * 0.04 } }} whileTap={{ scale: 0.98 }}
                    onClick={() => update((cur) => ({ painPoints: on ? (cur.painPoints || []).filter((v) => v !== p.value) : [...(cur.painPoints || []), p.value] }))}
                    className="ob-choice min-h-[72px] flex-row items-center gap-3.5 !rounded-[20px] px-4 py-3 text-start">
                    <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] transition-colors duration-200', on ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')} aria-hidden><p.Icon className="h-6 w-6" strokeWidth={1.8} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-bold leading-tight text-navy-900">{p.label}</span>
                      <span className="block text-[14px] text-ink-400">{p.line}</span>
                    </span>
                    <Tick on={on} />
                  </motion.button>
                );
              })}
            </div>
          </>
        );
      case 'owner':
        return (
          <>
            <Question title="ואיך קוראים לך?" sub="ככה נפנה אליך במערכת. הנייד בשביל התראות, לא חובה." />
            <div className="flex flex-col gap-5">
              <BigInput label="שם" value={d.ownerName} onChange={(e) => update({ ownerName: e.target.value })} placeholder="למשל: יעל לוי" autoComplete="name" autoFocus maxLength={60} />
              <BigInput label="נייד (לא חובה)" type="tel" inputMode="tel" dir="ltr" className="text-right" value={d.ownerPhone} onChange={(e) => update({ ownerPhone: e.target.value, phoneVerified: false })} placeholder="050-000-0000" autoComplete="tel"
                error={d.ownerPhone && !phoneOk(d.ownerPhone) ? 'חסרות ספרות. מספר נייד הוא 10 ספרות.' : ''} />
            </div>
          </>
        );
      case 'summary':
        return <Summary d={d} first={first} />;
      case 'ready':
        return <Ready d={d} first={first} />;
      default:
        return null;
    }
  })();

  const variants = {
    enter: (k) => ({ opacity: 0, x: k > 0 ? -40 : 40 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE } },
    exit: (k) => ({ opacity: 0, x: k > 0 ? 24 : -24, transition: { duration: 0.16, ease: EASE } }),
  };
  const progress = isReady ? 1 : (pos + (s.id === 'summary' ? 1 : 0.5)) / visible.length;
  const hideFooter = s.id === 'type' && !d.type;

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob relative overflow-x-clip" dir="rtl" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && canNext && !isReady) { e.preventDefault(); next(); } }}>
        <div aria-hidden className="pointer-events-none absolute -top-56 left-1/2 h-[560px] w-[960px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,43,241,0.11),rgba(62,43,241,0))]" />
        <main className={cn('relative mx-auto flex min-h-[100dvh] w-full flex-col transition-[max-width] duration-300', s.id === 'type' ? 'max-w-[860px]' : 'max-w-[640px]')}>
          <header className="sticky top-0 z-20 flex items-center gap-3 bg-[var(--canvas)]/90 px-5 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur md:px-8">
            {i > 0 && !isReady ? (
              <Ghost onClick={back} aria-label="חזרה" className="!h-12 !w-12 !px-0"><ArrowRight className="h-6 w-6" aria-hidden /></Ghost>
            ) : <span className="flex h-12 items-center"><Wordmark size={20} /></span>}
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#E1E4EE]" role="progressbar" aria-label="התקדמות" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
              <span className="block h-full origin-right rounded-full bg-brand-600 transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
            </div>
            {!isReady ? <HelpHint id={`onb.${{ type: 'type', name: 'business', count: 'count', channels: 'today', pain: 'today', owner: 'name', summary: 'times' }[s.id]}`} /> : null}
            {s.optional ? <Ghost onClick={() => go(step(i, 1), { skip: true })}>דלגו</Ghost> : null}
          </header>

          <div className="relative flex-1 px-5 pb-44 pt-5 md:px-8 md:pt-10">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.section key={s.id} data-screen={s.id} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" aria-live="polite">
                {body}
              </motion.section>
            </AnimatePresence>
          </div>

          <footer className={cn('fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[var(--canvas)] via-[var(--canvas)] to-transparent pb-[max(18px,env(safe-area-inset-bottom))] pt-8 transition-[opacity,transform] duration-200', hideFooter && 'pointer-events-none translate-y-3 opacity-0')}>
            <div className={cn('mx-auto w-full px-5 md:px-8', s.id === 'type' ? 'max-w-[860px]' : 'max-w-[640px]')}>
              {error ? <p className="mb-3 rounded-[14px] bg-[var(--st-red-bg)] px-4 py-3 text-[15px] font-medium text-[var(--st-red-fg)]" role="alert">{error}</p> : null}
              {isReady ? (
                <Primary className="w-full" onClick={enter} disabled={busy}>{busy ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden /> : null}למסך הבית שלי<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
              ) : (
                <Primary className="w-full" onClick={next} disabled={!canNext || busy} aria-busy={busy} tabIndex={hideFooter ? -1 : undefined}>
                  {busy ? <><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />{s.id === 'summary' ? 'מקימים…' : 'שומרים…'}</> : <>{s.id === 'summary' ? 'הקימו לי את המערכת' : 'המשך'}<ArrowLeft className="h-5 w-5" aria-hidden /></>}
                </Primary>
              )}
            </div>
          </footer>
        </main>
      </div>
    </MotionConfig>
  );
}

function Summary({ d, first }) {
  const still = useReducedMotion();
  const T = typeInfo(d.type);
  const n = d.units.length;
  const chosen = SOURCES.filter((o) => (d.channelsToday || []).includes(o.value));
  const pains = PAINS.filter((p) => (d.painPoints || []).includes(p.value));
  const cards = [
    { Icon: CalendarDays, t: n === 1 ? `${d.units[0]?.name || T.unit} בלוח השנה` : `${n} ${T.units} בלוח אחד`, d: chosen.length ? `כולל ${chosen.slice(0, 3).map((o) => o.label).join(', ')}` : 'כל ההזמנות, מכל מקום, בתצוגה אחת' },
    ...(pains.length ? pains : PAINS.filter((p) => ['double', 'messages'].includes(p.value))).slice(0, 3).map((p) => ({ Icon: p.Icon, t: p.gives.t, d: p.gives.d })),
    { Icon: LogIn, t: `כניסה ${d.checkIn} · יציאה ${d.checkOut}`, d: 'אפשר לשנות לכל הזמנה בנפרד' },
  ];
  return (
    <div>
      <Question kicker={d.businessName.trim() || 'המקום שלכם'} title={`${first ? `${first}, ` : ''}הנה מה ש-ATLAS יעשה בשבילך`} />
      <ul className="flex flex-col gap-3">
        {cards.map(({ Icon, t, d: line }, k) => (
          <motion.li key={t} initial={still ? false : { opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.36, ease: EASE, delay: 0.12 + k * 0.09 }}
            className="flex items-start gap-4 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_14px_34px_-20px_rgba(27,38,86,0.32)]">
            <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]', k === 0 ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')}><Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden /></span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-[18px] font-bold leading-tight text-navy-900">{t}</span>
              <span className="mt-1 block text-[15px] leading-relaxed text-ink-600">{line}</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Ready({ d, first }) {
  const still = useReducedMotion();
  const T = typeInfo(d.type);
  return (
    <div className="flex flex-col items-center pt-8 text-center md:pt-14">
      <div className="relative h-[112px] w-[112px]">
        <Confetti count={50} />
        <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden className="relative">
          <motion.circle cx="56" cy="56" r="52" fill="#3E2BF1" initial={still ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 20 }} style={{ transformOrigin: '50% 50%' }} />
          <motion.path d="M35 57l14 14 28-30" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
            initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.42, delay: 0.25, ease: EASE }} />
        </svg>
      </div>
      <motion.h1 initial={still ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
        className="mt-8 text-[36px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 md:text-[46px]">המערכת שלך מוכנה{first ? `, ${first}` : ''}</motion.h1>
      <motion.p initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 }} className="mt-3 max-w-[420px] text-[17px] text-ink-600">
        {d.businessName.trim() || 'המקום שלכם'} מחכה לך בפנים. ההזמנה הראשונה יכולה להיכנס כבר עכשיו.
      </motion.p>
      <motion.div initial={still ? false : { opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
        className="mt-8 w-full max-w-[420px] overflow-hidden rounded-[26px] bg-white text-start shadow-[0_1px_2px_rgba(27,38,86,0.05),0_30px_60px_-30px_rgba(27,38,86,0.4)]" aria-hidden>
        <div className="relative h-[120px] overflow-hidden bg-[#E9ECF4]">
          <img src={d.photos?.[0] || T.photo} alt="" className="h-full w-full object-cover" />
          <span className="absolute bottom-3 end-3 rounded-full bg-white/95 px-3 py-1 text-[12px] font-bold text-brand-700">פנוי הלילה</span>
        </div>
        <div className="p-4">
          <p className="text-[18px] font-extrabold text-navy-900">{d.businessName.trim() || T.label}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {d.units.slice(0, 4).map((u) => <span key={u.key} className="inline-flex h-8 items-center gap-1 rounded-full bg-brand-50 px-3 text-[12px] font-semibold text-brand-700"><CalendarDays className="h-3.5 w-3.5" />{u.name}</span>)}
            {d.units.length > 4 ? <span className="inline-flex h-8 items-center px-1 text-[12px] font-semibold text-ink-400">+{d.units.length - 4}</span> : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
