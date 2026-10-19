/**
 * /setup: the guided setup after onboarding, for owners who are not technical. A checklist with real
 * progress, and one calm screen per step: what it does, exactly where to click, a field to paste into
 * that checks the link in plain Hebrew, and a way out on every screen (skip / later / WhatsApp help).
 *
 * variant 'a': guided screens with numbered steps all visible.
 * variant 'b': the same steps told by an assistant voice, one instruction at a time ("עשיתי, הלאה").
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MotionConfig, motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, ChevronLeft, Loader2, Plus, ExternalLink, ClipboardPaste, X, CalendarDays, MessageCircle, CreditCard, Home, BadgeCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DB_FEATURES } from '@/config/dbFeatures';
import { getPlanByKey, TRIAL_DAYS } from '@/config/pricing';
import { Wordmark } from '@/components/app/shell/shared';
import { Primary, Ghost } from '@/components/onboarding/kit';
import { useKeyboardInset, HelpLink, Ring, CountRow, Options, MoneyInput } from '@/components/onboarding/v2/ui';
import { GUIDES, GuidePic } from './guides';
import {
  setupStatus, setupProgress, checkIcalLink, waLink, phoneValid, PRICE_MODES, kindInfo, normalizeGuests,
} from '@/lib/onboarding/v2/model';
import { writeOrgSettings } from '@/lib/onboarding/orgSettings';
import { loadSetupFacts, markSetup, saveCalendarLink, saveWhatsApp, saveUnit, unitView } from '@/lib/onboarding/v2/actions';

const EASE = [0.23, 1, 0.32, 1];
const ICONS = { units: Home, booking: CalendarDays, airbnb: CalendarDays, whatsapp: MessageCircle, plan: BadgeCheck, payments: CreditCard };

export default function SetupJourney({ user, variant = 'a' }) {
  useKeyboardInset();
  const [params, setParams] = useSearchParams();
  const stepId = params.get('step') || '';
  const [facts, setFacts] = useState(null);
  const [flash, setFlash] = useState('');

  const reload = async () => { const f = await loadSetupFacts(user); setFacts(f); return f; };
  useEffect(() => { reload(); }, [user?.id]);

  const steps = useMemo(() => (facts ? setupStatus(facts) : []), [facts]);
  const prog = setupProgress(steps);
  // remember "all done" so /today doesn't hold space for the resume card on the next visit
  useEffect(() => {
    if (facts?.setup && !!prog.complete !== !!facts.setup.complete) {
      writeOrgSettings(facts.orgId, { setup: { ...facts.setup, complete: !!prog.complete } }).catch(() => {});
    }
  }, [facts, prog.complete]);
  const open = (id) => { setParams(id ? { step: id } : {}, { replace: false }); window.scrollTo({ top: 0 }); };
  const back = (msg = '') => { setFlash(msg); open(''); };

  if (!facts) {
    return <div className="ob2 flex items-center justify-center" role="status" aria-label="טוען"><Loader2 className="h-7 w-7 ob2-spin text-brand-600" aria-hidden /></div>;
  }
  const step = steps.find((s) => s.id === stepId);
  const common = { facts, user, variant, onBack: () => back(''), reload, steps, prog };
  const finish = async (id, how, msg) => { await markSetup(facts.orgId, id, how); await reload(); back(msg); };

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob2" dir="rtl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={stepId || 'list'} initial={{ opacity: 0, x: stepId ? -20 : 20 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.26, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            {!step ? <Checklist {...common} flash={flash} onOpen={open} />
              : step.id === 'units' ? <UnitsStep {...common} step={step} onDone={(m) => finish('units', 'done', m)} />
                : step.id === 'booking' || step.id === 'airbnb' ? <CalendarStep {...common} step={step} provider={step.id === 'booking' ? 'BOOKING_COM' : 'AIRBNB'} onSkip={() => finish(step.id, 'skipped', '')} onDone={async (m) => { await reload(); back(m); }} />
                  : step.id === 'whatsapp' ? <WhatsAppStep {...common} step={step} onDone={async (m) => { await reload(); back(m); }} />
                    : step.id === 'plan' ? <PlanStep {...common} step={step} onDone={(m) => finish('plan', 'done', m)} onSkip={() => finish('plan', 'skipped', '')} />
                      : <PaymentsStep {...common} step={step} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/* ───────────────────────── shell ───────────────────────── */

function Bot({ children, delay = 0 }) {
  const still = useReducedMotion();
  return (
    <motion.div className="flex items-end gap-2.5" initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE, delay }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[15px] font-extrabold text-white" aria-hidden>a</span>
      <div className="ob2-bubble is-bot">{children}</div>
    </motion.div>
  );
}

function Shell({ variant, title, kicker, intro = [], onBack, children, footer, step }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[640px] flex-col">
      <header className="ob2-head"><div className="mx-auto flex w-full max-w-[640px] items-center gap-2 px-4 pb-3 md:px-6">
        {onBack ? <Ghost onClick={onBack} aria-label="חזרה לרשימה" className="!h-12 !w-12 !px-0"><ArrowRight className="h-6 w-6" aria-hidden /></Ghost> : <span className="flex h-12 items-center ps-1"><Wordmark size={20} /></span>}
        <span className="flex-1 truncate text-center text-[15px] font-semibold text-ink-600">{kicker}</span>
        <HelpLink compact />
      </div></header>
      <div className="ob2-head-space" aria-hidden />
      <main className="flex-1 px-5 pb-[calc(170px+env(safe-area-inset-bottom))] pt-3 md:px-6">
        {variant === 'b' ? (
          <div className="flex flex-col gap-2.5">
            <h1 className="sr-only">{title}</h1>
            {[title, ...intro].filter(Boolean).map((t, i) => <Bot key={i} delay={i * 0.12}>{i === 0 ? <strong className="font-extrabold">{t}</strong> : t}</Bot>)}
          </div>
        ) : (
          <>
            {step ? <p className="text-[15px] font-bold text-brand-600">{step}</p> : null}
            <h1 className="mt-1 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-navy-900 md:text-[32px]">{title}</h1>
            {intro.map((t, i) => <p key={i} className="mt-2 text-[17px] leading-relaxed text-ink-600">{t}</p>)}
          </>
        )}
        <div className="mt-6">{children}</div>
        <div className="mt-8 flex justify-center"><HelpLink /></div>
      </main>
      {footer ? <div className="ob2-bar"><div className="mx-auto flex w-full max-w-[640px] flex-col gap-2 md:px-1">{footer}</div></div> : null}
    </div>
  );
}

/* ───────────────────────── checklist ───────────────────────── */

function Checklist({ facts, variant, steps, prog, flash, onOpen }) {
  const still = useReducedMotion();
  const nextTitle = prog.next?.title;
  const plan = facts.planChoice?.kind === 'plan' ? getPlanByKey(facts.planChoice.key) : null;
  return (
    <Shell variant={variant} kicker="הגדרת המערכת"
      title={prog.complete ? 'הכל מוגדר. כל הכבוד!' : variant === 'b' ? 'נמשיך מכאן. כל שלב לוקח כמה דקות.' : 'בואו נגדיר את המערכת, צעד אחר צעד'}
      intro={prog.complete ? ['אפשר לחזור לכל שלב מתי שרוצים, גם מההגדרות.'] : variant === 'b' ? ['אני אראה לך בדיוק איפה ללחוץ. אפשר לדלג על כל דבר ולחזור אחר כך.'] : ['כל שלב מוסבר במילים פשוטות. אפשר לדלג ולחזור מתי שרוצים.']}
      footer={(
        <>
          {prog.complete ? (
            <Primary className="w-full" onClick={() => window.location.assign('/today')}>למערכת<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
          ) : (
            <Primary className="w-full" onClick={() => onOpen(prog.next.id)}>{`המשך: ${nextTitle}`}<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
          )}
          {!prog.complete ? <Ghost className="w-full" onClick={() => window.location.assign('/today')}>למערכת, אמשיך אחר כך</Ghost> : null}
        </>
      )}>
      <div className="ob2-card flex items-center gap-4 p-4">
        <Ring value={prog.handled} total={prog.total} size={64} stroke={7}>
          <span className="text-[15px] font-extrabold tabular-nums text-navy-900" dir="ltr">{prog.handled}/{prog.total}</span>
        </Ring>
        <div className="min-w-0">
          <p className="text-[17px] font-extrabold text-navy-900">{prog.complete ? 'ההגדרה הושלמה' : `${prog.handled} מתוך ${prog.total} שלבים`}</p>
          <p className="text-[15px] text-ink-600">{plan ? `מסלול ${plan.nameHe} · ${TRIAL_DAYS} יום חינם` : `${TRIAL_DAYS} יום ניסיון חינם · בלי כרטיס אשראי`}</p>
        </div>
      </div>
      {flash ? (
        <motion.p initial={still ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-2 rounded-[16px] bg-[#E4E1FD] px-4 py-3 text-[16px] font-semibold text-navy-900" role="status">
          <Check className="h-5 w-5 text-brand-600" strokeWidth={3} aria-hidden />{flash}
        </motion.p>
      ) : null}
      <ol className="mt-4 flex flex-col gap-2.5" aria-label="שלבי ההגדרה">
        {steps.map((s, i) => {
          const Icon = ICONS[s.id] || Check;
          const isNext = prog.next?.id === s.id;
          return (
            <li key={s.id}>
              <button type="button" onClick={() => onOpen(s.id)} data-step={s.id}
                className={cn('ob-press flex min-h-[76px] w-full items-center gap-3.5 rounded-[20px] bg-white p-4 text-start shadow-[0_1px_2px_rgba(27,38,86,0.05),0_8px_22px_-14px_rgba(27,38,86,0.2)]', isNext && 'ring-2 ring-brand-600')}>
                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', s.status === 'done' ? 'bg-brand-600 text-white' : s.status === 'soon' ? 'bg-[#F1F2F7] text-ink-400' : 'bg-[#E4E1FD] text-brand-700')} aria-hidden>
                  {s.status === 'done' ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" strokeWidth={2} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-bold leading-snug text-navy-900">{s.title}</span>
                  <span className="block text-[15px] leading-snug text-ink-600">
                    {s.status === 'done' ? 'בוצע' : s.status === 'skipped' ? 'דילגת. אפשר לחזור לכאן מתי שרוצים' : s.status === 'soon' ? s.line : `${s.line}${s.minutes ? ` · ${s.minutes === 1 ? 'כדקה' : `כ-${s.minutes} דקות`}` : ''}`}
                  </span>
                </span>
                {s.status === 'soon' ? <span className="shrink-0 rounded-full bg-[#F1F2F7] px-2.5 py-1 text-[13px] font-bold text-ink-600">בקרוב</span>
                  : <ChevronLeft className="h-5 w-5 shrink-0 text-ink-400" aria-hidden />}
                <span className="sr-only">{`שלב ${i + 1}`}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </Shell>
  );
}

/* ───────────────────────── calendars ───────────────────────── */

function LinkField({ id, label, value, onChange, check, connected }) {
  const paste = async () => { try { const t = await navigator.clipboard.readText(); if (t) onChange(t.trim()); } catch { /* not allowed: type or long-press paste */ } };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-2 text-[16px] font-semibold text-navy-900">
        {label}{connected ? <span className="rounded-full bg-[#E4E1FD] px-2 py-0.5 text-[13px] font-bold text-brand-700">מחובר</span> : null}
      </label>
      <div className="flex items-center gap-2">
        <input id={id} dir="ltr" inputMode="url" autoComplete="off" autoCapitalize="off" spellCheck={false} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="https://…" className="ob-input !min-h-[56px] !text-[16px]" aria-invalid={value && !check.ok ? 'true' : undefined} aria-describedby={`${id}-msg`} />
        {value ? <button type="button" className="ob-round ob-press !h-14 !w-14 shrink-0" onClick={() => onChange('')} aria-label="ניקוי"><X className="h-5 w-5" aria-hidden /></button>
          : <button type="button" className="ob-round ob-press !h-14 !w-14 shrink-0" onClick={paste} aria-label="הדבקה"><ClipboardPaste className="h-5 w-5" aria-hidden /></button>}
      </div>
      <p id={`${id}-msg`} className={cn('min-h-[20px] text-[15px] leading-snug', check.ok ? 'font-semibold text-brand-700' : 'text-[#B4303A]')} aria-live="polite">
        {value ? (check.ok ? <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" strokeWidth={3} aria-hidden />{check.message}</span> : check.message) : ''}
      </p>
    </div>
  );
}

function CalendarStep({ facts, variant, provider, step, onBack, onSkip, onDone, prog }) {
  const G = GUIDES[provider];
  const units = facts.properties;
  const [links, setLinks] = useState({});
  const [seen, setSeen] = useState(variant === 'b' ? 1 : G.steps.length);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const connectedIds = new Set(facts.syncs.filter((s) => s.provider === provider).map((s) => s.property_id));
  const checks = Object.fromEntries(units.map((u) => [u.id, checkIcalLink(provider, links[u.id])]));
  const filled = units.filter((u) => String(links[u.id] || '').trim());
  const canSave = filled.length > 0 && filled.every((u) => checks[u.id].ok);
  const pasteOpen = seen >= G.steps.length;

  const save = async () => {
    setBusy(true); setErr('');
    try {
      for (const u of filled) await saveCalendarLink(provider, u.id, links[u.id], facts.syncs);
      onDone(`${G.name} מחובר`);
    } catch (e) {
      setErr(e?.message && e.message.length < 120 ? `לא הצלחנו לשמור: ${e.message}` : 'לא הצלחנו לשמור. נסו שוב בעוד רגע.');
      setBusy(false);
    }
  };

  const intro = variant === 'b'
    ? [`כשמחברים את ${G.name}, כל הזמנה משם נכנסת ללוח של atlas לבד, ואין הזמנות כפולות.`, `${G.tip} נעשה את זה יחד, שלב אחד בכל פעם.`]
    : [`כל הזמנה מ-${G.name} תיכנס ללוח לבד, בלי להקליד ובלי הזמנות כפולות.`, G.tip];

  return (
    <Shell variant={variant} onBack={onBack} kicker={step.title} step={`שלב ${prog.handled + 1} מתוך ${prog.total}`} title={`מחברים את ${G.name}`} intro={intro}
      footer={(
        <>
          {err ? <p className="rounded-[14px] bg-[#FDEEEE] px-4 py-3 text-[15px] font-medium text-[#B4303A]" role="alert">{err}</p> : null}
          {pasteOpen ? (
            <Primary className="w-full" onClick={save} disabled={!canSave || busy} aria-busy={busy}>
              {busy ? <><Loader2 className="h-5 w-5 ob2-spin" aria-hidden />שומרים…</> : <>שמירת החיבור<Check className="h-5 w-5" strokeWidth={3} aria-hidden /></>}
            </Primary>
          ) : (
            <Primary className="w-full" onClick={() => setSeen((n) => n + 1)}>עשיתי, מה הלאה?<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
          )}
          <div className="flex gap-2">
            <Ghost className="flex-1 whitespace-nowrap" onClick={onSkip}>{`אין לי ${G.short}`}</Ghost>
            <Ghost className="flex-1 whitespace-nowrap" onClick={onBack}>אחר כך</Ghost>
          </div>
        </>
      )}>
      <a href={G.open.href} target="_blank" rel="noopener noreferrer" className="ob-press flex min-h-[60px] items-center justify-between gap-3 rounded-[18px] bg-navy-900 px-5 text-[17px] font-bold text-white">
        {G.open.label}<ExternalLink className="h-5 w-5" aria-hidden />
      </a>
      <p className="mt-2 text-[14px] text-ink-400">נפתח בחלון חדש. חוזרים לכאן כדי להדביק.</p>

      <ol className="mt-6 flex flex-col gap-6" aria-label={`איך מוצאים את הקישור ב-${G.name}`}>
        {G.steps.slice(0, seen).map((s, i) => (
          <motion.li key={s.pic} initial={variant === 'b' && i > 0 ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}
            className={cn('flex flex-col gap-3', variant === 'b' && 'rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(27,38,86,0.05)]')}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[17px] font-extrabold text-white" aria-hidden>{i + 1}</span>
              <div className="min-w-0">
                <p className="text-[18px] font-extrabold leading-snug text-navy-900">{s.title}</p>
                <p className="mt-0.5 text-[13px] font-medium text-ink-400" dir="ltr" style={{ textAlign: 'right' }}>{s.en}</p>
                <p className="mt-1 text-[16px] leading-relaxed text-ink-600">{s.text}</p>
              </div>
            </div>
            <GuidePic pic={s.pic} n={i + 1} />
          </motion.li>
        ))}
      </ol>

      {pasteOpen ? (
        <section className="mt-7 flex flex-col gap-4 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(27,38,86,0.05),0_8px_22px_-14px_rgba(27,38,86,0.2)]" aria-labelledby="paste-h">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[17px] font-extrabold text-white" aria-hidden>{G.steps.length + 1}</span>
            <div>
              <h2 id="paste-h" className="text-[18px] font-extrabold text-navy-900">מדביקים כאן</h2>
              <p className="text-[16px] text-ink-600">{units.length > 1 ? 'קישור לכל יחידה. אפשר להתחיל מאחת.' : 'לוחצים על הכפתור כדי להדביק, או לחיצה ארוכה ← הדבקה.'}</p>
            </div>
          </div>
          {units.length ? units.map((u) => (
            <LinkField key={u.id} id={`link-${u.id}`} label={u.name} value={links[u.id] || ''} onChange={(v) => setLinks((l) => ({ ...l, [u.id]: v }))} check={checks[u.id]} connected={connectedIds.has(u.id)} />
          )) : <p className="text-[16px] text-ink-600">קודם מוסיפים יחידה אחת לפחות, בשלב "היחידות שלך".</p>}
          <p className="text-[14px] leading-snug text-ink-400">
            {DB_FEATURES.realCore ? 'אחרי השמירה atlas מושכת את ההזמנות מיד, ומשם מתעדכנת כל 15 דקות.' : 'במצב הדגמה הקישור נשמר, אבל לא מתבצע סנכרון אמיתי.'}
          </p>
        </section>
      ) : null}
      <p className="mt-5 text-[14px] text-ink-400">
        <a className="font-semibold text-brand-700 underline underline-offset-2" href={G.help} target="_blank" rel="noopener noreferrer">ההסבר הרשמי של {G.name}</a>
        {' · '}רוצים שגם {G.name} יחסום תאריכים שנסגרו במערכת atlas? זה במסך <a className="font-semibold text-brand-700 underline underline-offset-2" href="/integrations">ערוצים וחיבורים</a>.
      </p>
    </Shell>
  );
}

/* ───────────────────────── WhatsApp ───────────────────────── */

function WhatsAppStep({ facts, user, variant, step, onBack, onDone, prog }) {
  const [phone, setPhone] = useState(facts.hostPhone || user?.phone || '');
  const [host, setHost] = useState(facts.hostName || (user?.full_name && !/@/.test(user.full_name) ? user.full_name : ''));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ok = phoneValid(phone);
  const place = user?.organization_name && user.organization_name !== 'My Organization' ? user.organization_name : 'המקום שלכם';
  const sample = `שלום! ההזמנה שלכם ב${place} אושרה.\n${facts.timesVary ? 'נשלח שעת כניסה מדויקת יום לפני ההגעה.' : `כניסה מ-${facts.checkIn}, יציאה עד ${facts.checkOut}.`}\nמחכים לכם${host ? `, ${host.trim()}` : ''}`;
  const test = waLink(phone, sample);
  const save = async () => {
    setBusy(true); setErr('');
    try { await saveWhatsApp(facts.orgId, phone, host); onDone('הוואטסאפ מוכן'); } catch { setErr('לא הצלחנו לשמור. נסו שוב.'); setBusy(false); }
  };
  return (
    <Shell variant={variant} onBack={onBack} kicker={step.title} step={`שלב ${prog.handled + 1} מתוך ${prog.total}`} title="וואטסאפ לאורחים"
      intro={variant === 'b'
        ? ['אכין לך את ההודעות לאורחים: אישור הזמנה, יום לפני, יום ההגעה. שולחים בלחיצה אחת, מהוואטסאפ שלך.', 'רק צריך את המספר שהאורחים מכירים.']
        : ['atlas מכינה את ההודעות לאורחים בזמן הנכון. אתם שולחים בלחיצה אחת, מהוואטסאפ שלכם.', 'שליחה אוטומטית בלי לגעת תגיע בקרוב.']}
      footer={(
        <>
          {err ? <p className="rounded-[14px] bg-[#FDEEEE] px-4 py-3 text-[15px] font-medium text-[#B4303A]" role="alert">{err}</p> : null}
          <Primary className="w-full" onClick={save} disabled={!ok || busy} aria-busy={busy}>{busy ? <><Loader2 className="h-5 w-5 ob2-spin" aria-hidden />שומרים…</> : <>שמירה<Check className="h-5 w-5" strokeWidth={3} aria-hidden /></>}</Primary>
          <Ghost className="w-full" onClick={onBack}>אחר כך</Ghost>
        </>
      )}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="wa-phone" className="text-[16px] font-semibold text-navy-900">מספר הוואטסאפ של העסק</label>
          <input id="wa-phone" className="ob-input text-right" type="tel" inputMode="tel" dir="ltr" autoComplete="tel" placeholder="050-000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={phone && !ok ? 'true' : undefined} aria-describedby="wa-phone-msg" />
          <p id="wa-phone-msg" className="min-h-[20px] text-[15px] text-[#B4303A]" aria-live="polite">{phone && !ok ? 'חסרות ספרות. מספר נייד הוא 10 ספרות.' : ''}</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="wa-host" className="text-[16px] font-semibold text-navy-900">איך לחתום על ההודעות? <span className="font-normal text-ink-400">(לא חובה)</span></label>
          <input id="wa-host" className="ob-input" autoComplete="name" placeholder="למשל: יעל" maxLength={60} value={host} onChange={(e) => setHost(e.target.value)} />
        </div>
        <div className="rounded-[22px] bg-[#EEF0F6] p-4" aria-label="כך ההודעה תיראה">
          <p className="mb-2 text-[13px] font-bold text-ink-600">כך האורח יקבל את ההודעה</p>
          <p className="ms-auto max-w-[92%] whitespace-pre-line rounded-[16px] rounded-se-[4px] bg-white px-4 py-3 text-[16px] leading-relaxed text-navy-900 shadow-[0_1px_1px_rgba(27,38,86,0.08)]">{sample}</p>
        </div>
        {test ? (
          <a href={test} target="_blank" rel="noopener noreferrer" className="ob-press flex min-h-[56px] items-center justify-center gap-2 rounded-full border-2 border-[#E1E4EE] bg-white px-5 text-[16px] font-bold text-navy-900">
            <MessageCircle className="h-5 w-5 text-brand-600" aria-hidden />לשלוח לעצמי הודעת ניסיון
          </a>
        ) : null}
      </div>
    </Shell>
  );
}

/* ───────────────────────── units ───────────────────────── */

function UnitsStep({ facts, variant, step, onBack, onDone, prog }) {
  const k = kindInfo(facts.kind);
  const [rows, setRows] = useState(() => facts.properties.map((p) => ({ ...unitView(p, facts.unitProfiles), key: p.id })));
  const [openKey, setOpenKey] = useState(rows.length === 1 ? rows[0].key : null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (key, patch) => setRows((r) => r.map((u) => (u.key === key ? { ...u, ...patch, dirty: true } : u)));
  const add = () => {
    const key = `new-${Date.now()}`;
    setRows((r) => [...r, { key, id: null, name: `${k.unit} ${r.length + 1}`, type: facts.kind, guestsMin: rows[0]?.guestsMin || 2, guestsMax: rows[0]?.guestsMax || 4, guestsVary: false, priceMode: rows[0]?.priceMode || 'varies', price: '', priceFrom: '', dirty: true }]);
    setOpenKey(key);
  };
  const remove = (key) => setRows((r) => r.filter((u) => u.key !== key));
  const save = async () => {
    setBusy(true); setErr('');
    try {
      for (const u of rows) if (u.dirty || !u.id) await saveUnit(facts.orgId, u);
      onDone(rows.length === 1 ? 'היחידה נשמרה' : `${rows.length} יחידות נשמרו`);
    } catch { setErr('לא הצלחנו לשמור. נסו שוב.'); setBusy(false); }
  };
  return (
    <Shell variant={variant} onBack={onBack} kicker={step.title} step={`שלב ${prog.handled + 1} מתוך ${prog.total}`} title="היחידות שלך"
      intro={variant === 'b' ? ['הנה מה שבנינו מהתשובות שלך. אפשר לשנות כל דבר, או להוסיף יחידה.'] : ['לכל יחידה: שם, כמה אורחים ומחיר. אפשר לשנות הכל גם אחר כך.']}
      footer={(
        <>
          {err ? <p className="rounded-[14px] bg-[#FDEEEE] px-4 py-3 text-[15px] font-medium text-[#B4303A]" role="alert">{err}</p> : null}
          <Primary className="w-full" onClick={save} disabled={busy || !rows.length || rows.some((u) => !u.name.trim())}>{busy ? <><Loader2 className="h-5 w-5 ob2-spin" aria-hidden />שומרים…</> : <>{rows.some((u) => u.dirty) ? 'שמירה' : 'נראה טוב'}<Check className="h-5 w-5" strokeWidth={3} aria-hidden /></>}</Primary>
          <Ghost className="w-full" onClick={onBack}>אחר כך</Ghost>
        </>
      )}>
      <ul className="flex flex-col gap-2.5">
        {rows.map((u) => {
          const isOpen = openKey === u.key;
          const [lo, hi] = normalizeGuests(u.guestsMin, u.guestsMax);
          const summary = `${u.guestsVary ? 'אורחים: משתנה' : lo === hi ? `${hi} אורחים` : `${lo}–${hi} אורחים`} · ${u.priceMode === 'fixed' && u.price ? `₪${u.price} ללילה` : u.priceMode === 'varies' ? 'מחיר משתנה' : 'מחיר יוגדר אחר כך'}`;
          return (
            <li key={u.key} className="ob2-card overflow-hidden">
              <button type="button" className="ob-press flex min-h-[68px] w-full items-center gap-3 px-4 text-start" aria-expanded={isOpen} onClick={() => setOpenKey(isOpen ? null : u.key)}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-bold text-navy-900">{u.name || 'יחידה'}</span>
                  <span className="block truncate text-[15px] text-ink-600">{summary}</span>
                </span>
                <ChevronLeft className={cn('h-5 w-5 text-ink-400 transition-transform duration-200', isOpen && '-rotate-90')} aria-hidden />
              </button>
              {isOpen ? (
                <div className="flex flex-col gap-5 border-t border-[#EEF0F5] p-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor={`un-${u.key}`} className="text-[16px] font-semibold text-navy-900">שם</label>
                    <input id={`un-${u.key}`} className="ob-input" value={u.name} maxLength={40} onChange={(e) => set(u.key, { name: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[16px] font-semibold text-navy-900">כמה אורחים?</p>
                    {!u.guestsVary ? (
                      <div className="flex flex-col divide-y divide-[#E9ECF4] rounded-[18px] bg-[#F7F8FB]">
                        <CountRow label="לפחות" value={lo} min={1} max={hi} onChange={(v) => set(u.key, { guestsMin: v })} />
                        <CountRow label="עד" value={hi} min={lo} onChange={(v) => set(u.key, { guestsMax: v })} />
                      </div>
                    ) : null}
                    <label className="flex min-h-[48px] items-center gap-3 text-[16px] text-navy-900">
                      <input type="checkbox" className="h-6 w-6 accent-[#3E2BF1]" checked={u.guestsVary} onChange={(e) => set(u.key, { guestsVary: e.target.checked })} />משתנה, אגדיר בכל הזמנה
                    </label>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p id={`pm-${u.key}`} className="text-[16px] font-semibold text-navy-900">מחיר ללילה</p>
                    <Options labelledBy={`pm-${u.key}`} options={PRICE_MODES.map((m) => ({ value: m.value, label: m.label }))} value={u.priceMode} onChange={(v) => set(u.key, { priceMode: v })} />
                    {u.priceMode === 'fixed' ? <MoneyInput label="כמה ללילה?" value={u.price} onChange={(v) => set(u.key, { price: v })} /> : null}
                    {u.priceMode === 'varies' ? <MoneyInput label="החל מ- (לא חובה)" value={u.priceFrom} onChange={(v) => set(u.key, { priceFrom: v })} /> : null}
                  </div>
                  {!u.id ? <button type="button" onClick={() => remove(u.key)} className="ob-press flex min-h-[48px] items-center gap-2 self-start rounded-full px-3 text-[15px] font-semibold text-[#B4303A]"><Trash2 className="h-4 w-4" aria-hidden />הסרת היחידה</button> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={add} className="ob-press mt-3 flex min-h-[60px] w-full items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[#CBD0E0] text-[17px] font-bold text-brand-700">
        <Plus className="h-5 w-5" aria-hidden />הוספת יחידה
      </button>
    </Shell>
  );
}

/* ───────────────────────── plan / payments ───────────────────────── */

function PlanStep({ facts, variant, step, onBack, onDone, onSkip, prog }) {
  const p = getPlanByKey(facts.planChoice?.key);
  return (
    <Shell variant={variant} onBack={onBack} kicker={step.title} step={`שלב ${prog.handled + 1} מתוך ${prog.total}`} title={`מסלול ${p.nameHe}`}
      intro={[`${p.limit}, כל המערכת כלולה. ₪${p.price} לחודש.`, `${TRIAL_DAYS} הימים הראשונים חינם בכל מקרה. משלימים את המסלול במסך המסלולים, ושם צוות atlas חוזר אליכם.`]}
      footer={(
        <>
          <Primary className="w-full" onClick={async () => { await onDone(''); window.location.assign('/subscription'); }}>למסך המסלולים<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
          <Ghost className="w-full" onClick={onSkip}>אמשיך עם הניסיון בינתיים</Ghost>
        </>
      )}>
      <ul className="flex flex-col gap-2">
        {p.features.map((f) => <li key={f} className="flex min-h-[48px] items-center gap-3 rounded-[16px] bg-white px-4 text-[16px] font-semibold text-navy-900"><Check className="h-5 w-5 text-brand-600" strokeWidth={3} aria-hidden />{f}</li>)}
      </ul>
    </Shell>
  );
}

function PaymentsStep({ variant, step, onBack }) {
  return (
    <Shell variant={variant} onBack={onBack} kicker={step.title} title="תשלומים וקבלות"
      intro={variant === 'b' ? ['את זה אנחנו עדיין בונים, ואני לא רוצה להבטיח מה שלא קיים.', 'בינתיים, הנה מה שכבר עובד.'] : ['סליקה וקבלות אוטומטיות עדיין לא זמינות. כשזה יהיה מוכן, זה יופיע כאן.']}
      footer={<Primary className="w-full" onClick={onBack}>הבנתי, חזרה לרשימה</Primary>}>
      <div className="flex flex-col gap-2.5">
        <div className="ob2-card p-4">
          <p className="text-[15px] font-bold text-brand-700">עובד היום</p>
          <p className="mt-1 text-[17px] font-bold text-navy-900">מעקב מקדמות ויתרות</p>
          <p className="text-[15px] text-ink-600">רושמים כמה שולם בכל הזמנה, רואים מה פתוח, ושולחים תזכורת בוואטסאפ.</p>
        </div>
        {['סליקת אשראי וביט', 'קבלות וחשבוניות אוטומטיות'].map((t) => (
          <div key={t} className="flex min-h-[64px] items-center justify-between gap-3 rounded-[20px] bg-white/60 px-4">
            <span className="text-[17px] font-bold text-navy-900">{t}</span>
            <span className="rounded-full bg-[#F1F2F7] px-2.5 py-1 text-[13px] font-bold text-ink-600">בקרוב</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}
