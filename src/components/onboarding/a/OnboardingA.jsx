/**
 * Onboarding v1, version A: "a conversation".
 * One question per screen in a warm guide voice, big tappable answers, and the owner's own app
 * building itself beside (desktop) or above (phones) as they answer. 4 short chapters + a calm reveal.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Loader2, Users, Home, Sparkles, Link2, MessageCircle, Clock, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingDraft } from '@/lib/onboarding/useOnboarding';
import {
  COMPLEX_TYPES, OTHER_TYPE, typeInfo, newUnit, PROVIDERS, isIcalUrl, phoneOk,
  saveOwner, saveBusiness, saveUnits, saveHosting, saveChannels, saveStep, finishOnboarding,
} from '@/lib/onboarding/store';
import {
  Primary, Ghost, BigInput, Stepper, Chips, PhotoPick, WhatsAppPreview, sampleMessage, IcalHowTo, LinkPaste,
  DEPOSIT_OPTIONS, depositLine, CHECKIN_TIMES, CHECKOUT_TIMES,
} from '@/components/onboarding/kit';
import { PreviewFull, PreviewCompact } from './Preview';
import { Wordmark } from '@/components/app/shell/shared';
import { formatMoney } from '@/lib/stay/format';

const CHAPTERS = ['עליכם', 'המתחם', 'האירוח', 'ערוצים'];
const EASE = [0.23, 1, 0.32, 1];

function Guide({ children, sub }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 shadow-[0_6px_14px_-6px_rgba(62,43,241,0.7)]" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <span className="text-[14px] font-semibold text-ink-400">ATLAS</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.015em] text-navy-900 md:text-[34px]">{children}</h1>
      {sub ? <p className="text-[17px] leading-relaxed text-ink-600 md:text-[18px]">{sub}</p> : null}
    </div>
  );
}

function Progress({ chapter, screenInChapter, screensInChapter }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5" aria-label={`פרק ${chapter + 1} מתוך ${CHAPTERS.length}: ${CHAPTERS[chapter]}`}>
      <div className="flex gap-1.5" aria-hidden>
        {CHAPTERS.map((c, i) => (
          <span key={c} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E1E4EE]">
            <span className="block h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out"
              style={{ width: i < chapter ? '100%' : i > chapter ? '0%' : `${Math.max(12, ((screenInChapter + 1) / screensInChapter) * 100)}%` }} />
          </span>
        ))}
      </div>
      <p className="text-[13px] font-semibold text-ink-400" aria-hidden>{chapter + 1} מתוך {CHAPTERS.length} · {CHAPTERS[chapter]}</p>
    </div>
  );
}

export default function OnboardingA({ user, again = false }) {
  const { draft: d, update, ready } = useOnboardingDraft(user);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openUnit, setOpenUnit] = useState(0);
  const autoNext = useRef(null);

  const unitWord = typeInfo(d.type).unit;
  const screens = useMemo(() => [
    { id: 'hello', chapter: -1 },
    { id: 'name', chapter: 0, focus: 'owner', can: () => d.ownerName.trim().length >= 2 },
    { id: 'phone', chapter: 0, focus: 'owner', optional: true, can: () => !d.ownerPhone || phoneOk(d.ownerPhone), leave: () => saveOwner(d) },
    { id: 'type', chapter: 1, focus: 'type', can: () => !!d.type },
    { id: 'business', chapter: 1, focus: 'business', can: () => d.businessName.trim().length >= 2, leave: () => saveBusiness(user, d) },
    { id: 'count', chapter: 1, focus: 'units', can: () => d.units.length >= 1 },
    { id: 'units', chapter: 1, focus: 'units', can: () => d.units.every((u) => u.name.trim()), leave: async () => { const r = await saveUnits(d); update(r); } },
    { id: 'times', chapter: 2, focus: 'hosting', leave: () => saveHosting(user, d) },
    { id: 'wa', chapter: 2, focus: 'wa', optional: true, leave: () => saveHosting(user, d) },
    { id: 'deposit', chapter: 2, focus: 'deposit', optional: true, leave: () => saveHosting(user, d) },
    { id: 'channels', chapter: 3, focus: 'channels', optional: true, leave: async () => { const s = await saveChannels(d); update({ savedSyncs: s }); } },
    { id: 'ready', chapter: 4 },
  ], [d, user, update]);

  const i = Math.min(d.screen || 0, screens.length - 1);
  const s = screens[i];
  const inChapter = screens.filter((x) => x.chapter === s.chapter);
  const idxInChapter = inChapter.indexOf(s);

  useEffect(() => () => clearTimeout(autoNext.current), []);
  // first time on "how many": start with two, the most common answer
  useEffect(() => { if (s.id === 'count' && d.units.length === 0) setCount(2); }, [s.id]);
  useEffect(() => { setError(''); }, [i]);

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
    }
    if (forward && screens[to]?.chapter !== s.chapter && screens[to]?.chapter >= 0) saveStep(screens[to].chapter + 2);
    setDir(forward ? 1 : -1);
    update({ screen: to });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };
  const next = () => go(i + 1);
  const back = () => go(Math.max(0, i - 1));

  // the reveal marks the account as set up (the button only navigates)
  useEffect(() => {
    if (s.id === 'ready') finishOnboarding(user);
  }, [s.id, user]);

  const setCount = (n) => {
    update((cur) => {
      const units = [...cur.units];
      while (units.length < n) units.push(newUnit(cur.type, units.length));
      while (units.length > n && !units[units.length - 1].existing) units.pop();
      return { units };
    });
  };
  const setUnit = (k, patch) => update((cur) => ({ units: cur.units.map((u) => (u.key === k ? { ...u, ...patch } : u)) }));

  const onKey = (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && s.can?.() !== false && s.id !== 'units' && s.id !== 'channels') { e.preventDefault(); next(); }
  };

  if (!ready) {
    return <div className="ob flex items-center justify-center" role="status" aria-label="טוען"><Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden /></div>;
  }

  const canNext = s.can ? s.can() : true;
  const reveal = s.id === 'ready';

  /* ── each screen's body ── */
  const body = (() => {
    switch (s.id) {
      case 'hello':
        return (
          <div className="flex flex-col gap-8">
            <Guide sub="אני אשאל כמה שאלות קצרות, ותראו את המערכת שלכם נבנית תוך כדי. בערך שלוש דקות, ואפשר לעצור בכל רגע.">
              {again ? 'נעבור שוב על הפרטים של המתחם.' : 'שלום, בואו נקים את המתחם שלכם.'}
            </Guide>
            <ol className="grid grid-cols-2 gap-2.5">
              {[{ t: 'עליכם', Icon: Users }, { t: 'המתחם והיחידות', Icon: Home }, { t: 'שעות והודעות', Icon: Clock }, { t: 'Booking ו-Airbnb', Icon: Link2 }].map(({ t, Icon }, k) => (
                <li key={t} className="ob-pop flex items-center gap-3 rounded-[18px] bg-white p-3.5 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_6px_18px_-10px_rgba(27,38,86,0.14)]" style={{ animationDelay: `${120 + k * 60}ms` }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600"><Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
                  <span className="text-[15px] font-semibold leading-tight text-navy-900">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      case 'name':
        return (
          <div className="flex flex-col gap-7">
            <Guide sub="ככה נפנה אליכם במערכת.">איך קוראים לכם?</Guide>
            <div className="flex items-end gap-4">
              <div className="min-w-0 flex-1">
                <BigInput label="שם מלא" value={d.ownerName} onChange={(e) => update({ ownerName: e.target.value })} placeholder="למשל: יעל לוי" autoComplete="name" autoFocus maxLength={60} />
              </div>
              <PhotoPick shape="circle" label="תמונה שלכם (לא חובה)" value={d.ownerPhoto} onChange={(v) => update({ ownerPhoto: v })} max={256} className="[&>button]:!h-[60px] [&>button]:!w-[60px]" />
            </div>
            <p className="-mt-3 text-[15px] text-ink-400">אפשר להוסיף תמונה בעיגול. לא חובה.</p>
          </div>
        );
      case 'phone':
        return (
          <div className="flex flex-col gap-7">
            <Guide sub="לכאן יגיעו ההתראות, וממנו האורחים יקבלו הודעות בוואטסאפ.">{d.ownerName ? `נעים מאוד, ${d.ownerName.trim().split(/\s+/)[0]}. מה מספר הנייד?` : 'מה מספר הנייד?'}</Guide>
            <BigInput label="נייד" type="tel" inputMode="tel" dir="ltr" className="text-right" value={d.ownerPhone} onChange={(e) => update({ ownerPhone: e.target.value })} placeholder="050-000-0000" autoComplete="tel" autoFocus
              error={d.ownerPhone && !phoneOk(d.ownerPhone) ? 'חסרות ספרות. מספר נייד הוא 10 ספרות.' : ''} />
          </div>
        );
      case 'type':
        return (
          <div className="flex flex-col gap-6">
            <Guide>איזה מקום יש לכם?</Guide>
            <div role="radiogroup" aria-label="סוג המקום" className="grid grid-cols-2 gap-3">
              {COMPLEX_TYPES.map((t, k) => (
                <button key={t.value} type="button" role="radio" aria-checked={d.type === t.value}
                  className="ob-choice ob-press ob-pop" style={{ animationDelay: `${k * 50}ms` }}
                  onClick={() => {
                    update((cur) => ({ type: t.value, units: cur.units.map((u, n) => (u.existing || !/^\S+ \d+$/.test(u.name) ? u : { ...u, name: `${t.unit} ${n + 1}` })) }));
                    clearTimeout(autoNext.current);
                    autoNext.current = setTimeout(() => go(i + 1), 420);
                  }}>
                  <span className="relative block aspect-[4/3] w-full overflow-hidden bg-[#E9ECF4]">
                    <img src={t.photo} alt="" className="h-full w-full object-cover" draggable={false} />
                    {d.type === t.value ? (
                      <span className="ob-pop absolute end-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow"><Check className="h-[18px] w-[18px]" strokeWidth={3} aria-hidden /></span>
                    ) : null}
                  </span>
                  <span className="flex flex-col px-3.5 pb-3 pt-2.5">
                    <span className="text-[18px] font-bold text-navy-900">{t.label}</span>
                    <span className="text-[13px] text-ink-400">{t.line}</span>
                  </span>
                </button>
              ))}
            </div>
            <button type="button" role="radio" aria-checked={d.type === OTHER_TYPE.value} className="ob-chip ob-press self-start"
              onClick={() => { update({ type: OTHER_TYPE.value }); clearTimeout(autoNext.current); autoNext.current = setTimeout(() => go(i + 1), 420); }}>
              {OTHER_TYPE.label}
            </button>
          </div>
        );
      case 'business':
        return (
          <div className="flex flex-col gap-6">
            <Guide sub="השם יופיע במערכת ובהודעות לאורחים.">איך קוראים למתחם?</Guide>
            <BigInput label="שם המתחם" value={d.businessName} onChange={(e) => update({ businessName: e.target.value })} placeholder={d.type === 'villa' ? 'למשל: וילה בכרם' : 'למשל: צימרי הגליל'} autoFocus maxLength={50} />
            <div className="flex flex-col gap-2">
              <p className="text-[16px] font-semibold text-navy-900">תמונה של המקום <span className="font-normal text-ink-400">(לא חובה)</span></p>
              <PhotoPick shape="wide" label="תמונה של המתחם" value={d.coverPhoto} onChange={(v) => update({ coverPhoto: v })} max={960} />
            </div>
          </div>
        );
      case 'count':
        return (
          <div className="flex flex-col gap-8">
            <Guide sub="אפשר לשנות ולהוסיף בכל זמן.">{`כמה ${typeInfo(d.type).value === 'guesthouse' ? 'חדרים' : typeInfo(d.type).value === 'villa' ? 'וילות' : typeInfo(d.type).value === 'cabin' ? 'בקתות' : typeInfo(d.type).value === 'zimmer' ? 'צימרים' : 'יחידות'} יש לכם?`}</Guide>
            <div className="flex flex-col items-center gap-5 rounded-[24px] bg-white p-6 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_8px_24px_-12px_rgba(27,38,86,0.16)]">
              <Stepper value={Math.max(1, d.units.length)} onChange={setCount} min={Math.max(1, d.units.filter((u) => u.existing).length)} max={30} label="יחידות" />
              <div className="flex flex-wrap justify-center gap-1.5" aria-hidden>
                {d.units.map((u, k) => (
                  <span key={u.key} className="ob-pop h-10 w-10 overflow-hidden rounded-[12px] bg-[#E4E1FD] ring-2 ring-white" style={{ animationDelay: `${k * 30}ms` }}>
                    {u.photo || typeInfo(d.type).photo ? <img src={u.photo || typeInfo(d.type).photo} alt="" className="h-full w-full object-cover" /> : null}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case 'units':
        return (
          <div className="flex flex-col gap-5">
            <Guide sub={`מילאנו מחיר ממוצע. שנו מה שצריך, הכל נשמר לבד.`}>{`בואו נכיר את ה${unitWord === 'חדר' ? 'חדרים' : 'יחידות'}`}</Guide>
            <ul className="flex flex-col gap-3">
              {d.units.map((u, k) => {
                const open = openUnit === k;
                return (
                  <li key={u.key} className="ob-pop overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.04),0_8px_24px_-12px_rgba(27,38,86,0.16)]" style={{ animationDelay: `${k * 40}ms` }}>
                    <button type="button" className="ob-press flex min-h-[72px] w-full items-center gap-3 px-4 text-start" aria-expanded={open} onClick={() => setOpenUnit(open ? -1 : k)}>
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-[#E4E1FD]">{u.photo || typeInfo(d.type).photo ? <img src={u.photo || typeInfo(d.type).photo} alt="" className="h-full w-full object-cover" /> : null}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[18px] font-bold text-navy-900">{u.name || 'יחידה בלי שם'}</span>
                        <span className="block text-[14px] text-ink-400 tabular-nums">עד {u.guests} אורחים · {formatMoney(u.price)} ללילה</span>
                      </span>
                      <span className="text-[14px] font-semibold text-brand-600">{open ? 'סגירה' : 'עריכה'}</span>
                    </button>
                    {open ? (
                      <div className="ob-fade flex flex-col gap-4 border-t border-[#EEF0F5] p-4">
                        <BigInput label="שם" value={u.name} onChange={(e) => setUnit(u.key, { name: e.target.value })} maxLength={40} />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[16px] font-semibold text-navy-900">כמה אורחים?</span>
                          <Stepper size="sm" value={u.guests} onChange={(v) => setUnit(u.key, { guests: v })} min={1} max={30} label="אורחים" />
                        </div>
                        <BigInput label="מחיר ללילה (₪)" inputMode="numeric" dir="ltr" className="text-right tabular-nums" value={String(u.price ?? '')}
                          onChange={(e) => setUnit(u.key, { price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} />
                        <div className="flex items-center justify-between gap-3">
                          <PhotoPick shape="tile" label={`תמונה של ${u.name || 'היחידה'}`} value={u.photo} onChange={(v) => setUnit(u.key, { photo: v })} max={640} />
                          {!u.existing && d.units.length > 1 ? (
                            <Ghost onClick={() => { update((cur) => ({ units: cur.units.filter((x) => x.key !== u.key) })); setOpenUnit(-1); }} className="text-[#B4303A]">
                              <Trash2 className="h-[18px] w-[18px]" aria-hidden />הסרה
                            </Ghost>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <Ghost className="self-start !text-brand-600" onClick={() => { update((cur) => ({ units: [...cur.units, newUnit(cur.type, cur.units.length)] })); setOpenUnit(d.units.length); }}>
              <Plus className="h-5 w-5" aria-hidden />{`הוספת ${unitWord}`}
            </Ghost>
          </div>
        );
      case 'times':
        return (
          <div className="flex flex-col gap-7">
            <Guide sub="אפשר לשנות לכל הזמנה בנפרד.">מתי האורחים נכנסים ויוצאים?</Guide>
            <div className="flex flex-col gap-3">
              <p className="text-[17px] font-semibold text-navy-900">כניסה מ-</p>
              <Chips label="שעת כניסה" options={CHECKIN_TIMES} value={d.checkIn} onChange={(v) => update({ checkIn: v })} />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[17px] font-semibold text-navy-900">יציאה עד</p>
              <Chips label="שעת יציאה" options={CHECKOUT_TIMES} value={d.checkOut} onChange={(v) => update({ checkOut: v })} />
            </div>
          </div>
        );
      case 'wa':
        return (
          <div className="flex flex-col gap-6">
            <Guide sub="כשמגיעה הזמנה, שולחים את זה בלחיצה אחת. ככה זה ייראה אצל האורח:">הודעת אישור בוואטסאפ</Guide>
            <WhatsAppPreview text={sampleMessage(d)} />
            <BigInput label="חתימה" value={d.hostName} onChange={(e) => update({ hostName: e.target.value })} placeholder={d.ownerName ? `${d.ownerName.split(' ')[0]} מ${d.businessName || 'המתחם'}` : 'השם שלכם'} maxLength={40} />
            <BigInput label="משפט סיום" value={d.waGreeting} onChange={(e) => update({ waGreeting: e.target.value })} placeholder="נשמח לארח אתכם." maxLength={80} />
          </div>
        );
      case 'deposit':
        return (
          <div className="flex flex-col gap-6">
            <Guide sub="נזכיר לכם לגבות, ונראה מה נשאר פתוח.">לוקחים מקדמה בהזמנה?</Guide>
            <div role="radiogroup" aria-label="מקדמה" className="flex flex-col gap-2.5">
              {DEPOSIT_OPTIONS.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={d.deposit === o.value} onClick={() => update({ deposit: o.value })}
                  className="ob-choice ob-press flex-row items-center gap-3 !rounded-[18px] px-4 py-3.5">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2', d.deposit === o.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#D5D9E6]')}>
                    {d.deposit === o.value ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : null}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[18px] font-bold text-navy-900">{o.label}</span>
                    <span className="text-[14px] text-ink-400">{depositLine(o.value, d.units[0]?.price || 0)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'channels':
        return (
          <div className="flex flex-col gap-5">
            <Guide sub="אם אתם מפרסמים גם שם, נמשוך את ההזמנות ללוח השנה כדי שלא יהיו כפילויות.">מקבלים הזמנות גם מ-Booking או Airbnb?</Guide>
            {Object.entries(PROVIDERS).map(([k, p]) => {
              const ch = d.channels[k];
              const setCh = (patch) => update((cur) => ({ channels: { ...cur.channels, [k]: { ...cur.channels[k], ...patch } } }));
              return (
                <div key={k} className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.04),0_8px_24px_-12px_rgba(27,38,86,0.16)]">
                  <button type="button" aria-pressed={ch.on} onClick={() => setCh({ on: !ch.on })} className="ob-press flex min-h-[72px] w-full items-center gap-3 px-4 text-start">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[15px] font-extrabold text-white" style={{ background: p.color }} aria-hidden>{k === 'AIRBNB' ? 'A' : 'B.'}</span>
                    <span className="flex-1 text-[18px] font-bold text-navy-900">{p.label}</span>
                    <span className={cn('relative h-8 w-14 rounded-full transition-colors duration-200', ch.on ? 'bg-brand-600' : 'bg-[#D5D9E6]')} aria-hidden>
                      <span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[inset-inline-start] duration-200', ch.on ? 'start-7' : 'start-1')} />
                    </span>
                  </button>
                  {ch.on ? (
                    <div className="ob-fade flex flex-col gap-4 border-t border-[#EEF0F5] p-4">
                      <IcalHowTo provider={k} />
                      {d.units.map((u) => (
                        <LinkPaste key={u.key} label={`הקישור של ${u.name}`} value={ch.links[u.key] || ''} valid={isIcalUrl(ch.links[u.key])}
                          onChange={(v) => setCh({ links: { ...ch.links, [u.key]: v } })} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      case 'ready':
        return <Reveal d={d} />;
      default:
        return null;
    }
  })();

  const primaryLabel = s.id === 'hello' ? 'מתחילים' : s.id === 'channels' ? 'סיום' : 'המשך';
  const variants = {
    enter: (k) => ({ opacity: 0, x: k > 0 ? -28 : 28 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE } },
    exit: (k) => ({ opacity: 0, x: k > 0 ? 20 : -20, transition: { duration: 0.16, ease: EASE } }),
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob flex flex-col lg:flex-row" dir="rtl" onKeyDown={onKey}>
        {/* conversation column */}
        <main className="relative flex min-h-[100dvh] w-full flex-col lg:w-[560px] lg:shrink-0 xl:w-[600px]">
          <header className="sticky top-0 z-10 flex items-center gap-3 bg-[var(--canvas)]/90 px-5 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur md:px-10">
            {i > 0 && !reveal ? (
              <Ghost onClick={back} aria-label="חזרה" className="!h-12 !w-12 !px-0"><ArrowRight className="h-6 w-6" aria-hidden /></Ghost>
            ) : <span className="flex h-12 items-center"><Wordmark size={20} /></span>}
            {s.chapter >= 0 && !reveal ? <Progress chapter={s.chapter} screenInChapter={idxInChapter} screensInChapter={inChapter.length} /> : <span className="flex-1" />}
            {s.optional && !reveal ? <Ghost onClick={() => go(i + 1, { skip: true })}>אחר כך</Ghost> : null}
          </header>

          {!reveal && s.id !== 'hello' ? (
            <div className="px-5 pb-1 pt-1 md:px-10 lg:hidden"><PreviewCompact d={d} focus={s.focus} /></div>
          ) : null}

          <div className="relative flex-1 overflow-x-clip px-5 pb-40 pt-6 md:px-10 lg:pt-10">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.section key={s.id} data-screen={s.id} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" aria-live="polite">
                {body}
              </motion.section>
            </AnimatePresence>
          </div>

          <footer className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--canvas)] via-[var(--canvas)] to-transparent px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-6 md:px-10 lg:absolute">
            {error ? (
              <p className="mb-3 rounded-[14px] bg-[var(--st-red-bg)] px-4 py-3 text-[15px] font-medium text-[var(--st-red-fg)]" role="alert">{error}</p>
            ) : null}
            {reveal ? (
              <Primary className="w-full" onClick={() => window.location.replace('/today')}>
                למסך היום<ArrowLeft className="h-5 w-5" aria-hidden />
              </Primary>
            ) : (
              <Primary className="w-full" onClick={next} disabled={!canNext || busy} aria-busy={busy}>
                {busy ? <><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />שומרים…</> : <>{primaryLabel}<ArrowLeft className="h-5 w-5" aria-hidden /></>}
              </Primary>
            )}
            {!reveal && s.id !== 'hello' ? <p className="mt-2 text-center text-[13px] text-ink-400">הכל נשמר לבד. אפשר לחזור בכל רגע.</p> : null}
          </footer>
        </main>

        {/* the app, building itself (desktop) */}
        <aside className="sticky top-0 hidden h-[100dvh] min-w-0 flex-1 p-6 lg:block">
          <div className="flex h-full flex-col gap-3">
            <p className="flex items-center gap-2 px-2 text-[14px] font-semibold text-ink-400"><Sparkles className="h-4 w-4 text-brand-600" aria-hidden />ככה המערכת שלכם תיראה</p>
            <motion.div className="min-h-0 flex-1" animate={reveal ? { scale: 1 } : { scale: 0.985 }} transition={{ duration: 0.5, ease: EASE }}>
              <PreviewFull d={d} focus={reveal ? null : s.focus} className="h-full" />
            </motion.div>
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}

function Reveal({ d }) {
  const n = d.units.length;
  const links = Object.values(d.channels || {}).filter((c) => c.on && Object.values(c.links || {}).some((v) => isIcalUrl(v))).length;
  const rows = [
    { Icon: Home, t: `${n} ${n === 1 ? 'יחידה' : 'יחידות'} בלוח השנה`, d: d.units.slice(0, 3).map((u) => u.name).join(' · ') + (n > 3 ? ' …' : '') },
    { Icon: Clock, t: `כניסה ${d.checkIn} · יציאה ${d.checkOut}`, d: 'יופיע במסך היום ובהודעות' },
    { Icon: MessageCircle, t: 'הודעת אישור בוואטסאפ מוכנה', d: 'נשלחת בלחיצה אחת מכל הזמנה' },
    { Icon: Wallet, t: d.deposit === 'none' ? 'בלי מקדמה' : d.deposit === 'full' ? 'תשלום מלא בהזמנה' : `מקדמה ${d.deposit}%`, d: 'אפשר לשנות בהגדרות' },
    { Icon: Link2, t: links ? `${links === 2 ? 'Booking ו-Airbnb מחוברים' : 'ערוץ אחד מחובר'}` : 'ערוצים: אפשר לחבר אחר כך', d: links ? 'ההזמנות שלהם ייכנסו ללוח השנה' : 'בהגדרות ← ערוצים' },
  ];
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col items-start gap-5">
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
          <circle cx="36" cy="36" r="34" fill="#F1EFFE" />
          <motion.circle cx="36" cy="36" r="27" fill="none" stroke="#3E2BF1" strokeWidth="5" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: EASE }} style={{ rotate: -90, transformOrigin: '50% 50%' }} />
          <motion.path d="M24 37.5l8 8 16-17" fill="none" stroke="#3E2BF1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.55, ease: EASE }} />
        </svg>
        <div className="flex flex-col gap-2">
          <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.02em] text-navy-900 md:text-[40px]">{d.businessName || 'המתחם שלכם'} מוכן.</h1>
          <p className="text-[18px] text-ink-600">הכל במקום. ההזמנה הראשונה כבר יכולה להיכנס.</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map(({ Icon, t, d: line }, k) => (
          <motion.li key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 + k * 0.07, ease: EASE }}
            className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_6px_18px_-10px_rgba(27,38,86,0.14)]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-brand-50 text-brand-600"><Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
            <span className="min-w-0">
              <span className="block truncate text-[16px] font-bold text-navy-900">{t}</span>
              <span className="block truncate text-[14px] text-ink-400">{line}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <div className="lg:hidden"><PreviewCompact d={d} focus={null} /></div>
    </div>
  );
}
