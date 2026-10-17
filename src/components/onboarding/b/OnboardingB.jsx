/**
 * Onboarding v1, version B: "build your place".
 * A drawn canvas of the owner's place sits above (phones) or beside (desktop) one big question card.
 * The sign gets their name, a pin their settlement, prints their photos; units are added with + on the
 * canvas and edited by tapping them; check-in / out are set on a clock dial; at the end the lights go on.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, Trash2, Loader2, UserRound, Home, Building2, Link2, Clock, MapPin, Images, MessageCircle, Wallet,
  Globe, Instagram, Facebook, Map as MapIcon, Crown, Briefcase, HeartHandshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingDraft } from '@/lib/onboarding/useOnboarding';
import {
  BUSINESS_TYPES, OTHER_TYPE, OWNER_ROLES, CHANNELS_TODAY, LINK_FIELDS, PAY_METHODS, typeInfo, newUnit, PROVIDERS, isIcalUrl, phoneOk,
  saveOwner, saveBusiness, saveUnits, saveHosting, saveChannels, saveStep, finishOnboarding,
} from '@/lib/onboarding/store';
import {
  Primary, Ghost, BigInput, Stepper, Chips, PhotoPick, WhatsAppPreview, sampleMessage, IcalHowTo, LinkPaste,
  DEPOSIT_OPTIONS, depositLine, SettlementInput, PhotoGallery, MultiChips, VerifyPhone,
} from '@/components/onboarding/kit';
import { Scene, ROOM_TYPES } from './Scene';
import { TimeDial } from './Dial';
import { Wordmark } from '@/components/app/shell/shared';
import { GuestAvatar } from '@/components/app/atoms';
import { formatMoney } from '@/lib/stay/format';

const EASE = [0.23, 1, 0.32, 1];
const CHAPTERS = [
  { t: 'אתם', Icon: UserRound },
  { t: 'המקום', Icon: Home },
  { t: 'יחידות', Icon: Building2 },
  { t: 'הזמנות', Icon: Link2 },
  { t: 'אירוח', Icon: Clock },
];

function Milestones({ chapter }) {
  return (
    <ol className="flex flex-1 items-center justify-between gap-1" aria-label={`שלב ${chapter + 1} מתוך ${CHAPTERS.length}: ${CHAPTERS[chapter]?.t || ''}`}>
      {CHAPTERS.map(({ t, Icon }, k) => {
        const done = k < chapter; const now = k === chapter;
        return (
          <li key={t} className="flex min-w-0 flex-1 items-center gap-1" aria-hidden>
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
              done ? 'bg-brand-600 text-white' : now ? 'bg-navy-900 text-white' : 'bg-white text-ink-400 ring-1 ring-inset ring-[#E1E4EE]')}>
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" strokeWidth={2} />}
            </span>
            {now ? <span className="truncate text-[14px] font-bold text-navy-900">{t}</span> : null}
            {k < CHAPTERS.length - 1 ? <span className={cn('h-[3px] min-w-[6px] flex-1 rounded-full', done ? 'bg-brand-600' : 'bg-[#E1E4EE]')} /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function Q({ children, sub }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[29px] font-extrabold leading-[1.15] tracking-[-0.015em] text-navy-900 md:text-[32px]">{children}</h1>
      {sub ? <p className="text-[17px] leading-relaxed text-ink-600">{sub}</p> : null}
    </div>
  );
}

export default function OnboardingB({ user, again = false }) {
  const { draft: d, update, ready } = useOnboardingDraft(user);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const autoNext = useRef(null);
  const finishing = useRef(null);
  const still = useReducedMotion();

  const T = typeInfo(d.type);
  const otaChosen = (d.channelsToday || []).some((v) => v === 'booking' || v === 'airbnb');
  const screens = useMemo(() => [
    { id: 'hello', chapter: -1 },
    { id: 'role', chapter: 0, optional: true },
    { id: 'name', chapter: 0, can: () => d.ownerName.trim().length >= 2 },
    { id: 'phone', chapter: 0, optional: true, can: () => !d.ownerPhone || phoneOk(d.ownerPhone), leave: () => saveOwner(d) },
    { id: 'type', chapter: 1, can: () => !!d.type },
    { id: 'business', chapter: 1, can: () => d.businessName.trim().length >= 2, leave: () => saveBusiness(user, d) },
    { id: 'location', chapter: 1, optional: true, leave: () => saveBusiness(user, d) },
    { id: 'photos', chapter: 1, optional: true, leave: () => saveBusiness(user, d) },
    { id: 'units', chapter: 2, can: () => d.units.length >= 1 && d.units.every((u) => u.name.trim()), leave: async () => { const r = await saveUnits(d); update(r); } },
    { id: 'today', chapter: 3, optional: true, leave: () => saveBusiness(user, d) },
    { id: 'links', chapter: 3, optional: true, leave: () => saveBusiness(user, d) },
    { id: 'channels', chapter: 3, optional: true, skip: () => !otaChosen, leave: async () => { const sv = await saveChannels(d); update({ savedSyncs: sv }); } },
    { id: 'checkin', chapter: 4, leave: () => saveHosting(user, d) },
    { id: 'checkout', chapter: 4, leave: () => saveHosting(user, d) },
    { id: 'wa', chapter: 4, optional: true, leave: () => saveHosting(user, d) },
    { id: 'pay', chapter: 4, optional: true, leave: () => saveHosting(user, d) },
    { id: 'ready', chapter: 5 },
  ], [d, user, update, otaChosen]);

  const i = Math.min(d.screen || 0, screens.length - 1);
  const s = screens[i];
  const reveal = s.id === 'ready';

  useEffect(() => () => clearTimeout(autoNext.current), []);
  useEffect(() => { setError(''); }, [i]);
  // entering the units chapter: start with a sensible count (one for a single place, two for the rest)
  useEffect(() => {
    if (s.id !== 'units') return;
    if (d.units.length === 0) {
      update((cur) => {
        const info = typeInfo(cur.type);
        const n = info.single ? 1 : ROOM_TYPES.has(cur.type) ? 4 : 2;
        const units = Array.from({ length: n }, (_, k) => newUnit(cur.type, k));
        if (info.single) units[0].name = cur.businessName.trim() || info.label;
        return { units };
      });
    }
  }, [s.id]);
  useEffect(() => { if (s.id === 'units' && !active && d.units[0]) setActive(d.units[0].key); }, [s.id, d.units, active]);
  useEffect(() => {
    if (reveal && !finishing.current) finishing.current = finishOnboarding(user);
  }, [reveal, user]);

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
    }
    if (forward && screens[to]?.chapter !== s.chapter && screens[to]?.chapter >= 0 && screens[to].chapter < 5) saveStep(screens[to].chapter);
    setDir(forward ? 1 : -1);
    update({ screen: to });
    window.scrollTo({ top: 0 });
  };
  const next = () => go(step(i, 1));
  const back = () => go(step(i, -1));
  const pickThenNext = (patch) => { update(patch); clearTimeout(autoNext.current); autoNext.current = setTimeout(() => go(step(i, 1)), 420); };
  const toToday = async () => { setBusy(true); try { await (finishing.current || finishOnboarding(user)); } finally { window.location.replace('/today'); } };

  const setUnit = (k, patch) => update((cur) => ({ units: cur.units.map((u) => (u.key === k ? { ...u, ...patch } : u)) }));
  const addUnit = () => {
    const u = newUnit(d.type, d.units.length);
    update((cur) => ({ units: [...cur.units, u] }));
    setActive(u.key);
  };

  if (!ready) return <div className="ob flex items-center justify-center" role="status" aria-label="טוען"><Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden /></div>;

  const canNext = s.can ? s.can() : true;
  const unitsMode = s.id === 'units';
  const activeUnit = d.units.find((u) => u.key === active) || d.units[0];

  const body = (() => {
    switch (s.id) {
      case 'hello':
        return (
          <div className="flex flex-col gap-6">
            <Q sub="נבנה ביחד את המקום שלכם בתוך המערכת: שם, מיקום, תמונות, יחידות ושעות. כל תשובה מופיעה מיד בציור. כחמש דקות.">
              {again ? 'נעבור שוב על המקום שלכם.' : 'בואו נבנה את המקום שלכם.'}
            </Q>
            <ul className="flex flex-col gap-2">
              {CHAPTERS.map(({ t, Icon }, k) => (
                <li key={t} className="ob-pop flex min-h-[56px] items-center gap-3 rounded-[16px] bg-white px-4 shadow-[0_1px_2px_rgba(27,38,86,0.04)]" style={{ animationDelay: `${100 + k * 50}ms` }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden /></span>
                  <span className="text-[17px] font-semibold text-navy-900">{t}</span>
                  <span className="ms-auto text-[14px] text-ink-400 tabular-nums">{['דקה', 'שתי דקות', 'דקה', 'דקה', 'דקה'][k]}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'role':
        return (
          <div className="flex flex-col gap-5">
            <Q>מי אתם בעסק?</Q>
            <div role="radiogroup" aria-label="תפקיד" className="flex flex-col gap-2.5">
              {OWNER_ROLES.map((r, k) => {
                const Icon = [Crown, Briefcase, HeartHandshake, UserRound][k];
                return (
                  <button key={r.value} type="button" role="radio" aria-checked={d.ownerRole === r.value} onClick={() => pickThenNext({ ownerRole: r.value })}
                    className="ob-choice ob-press flex-row items-center gap-3.5 !rounded-[18px] px-4 py-3.5">
                    <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', d.ownerRole === r.value ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')}><Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden /></span>
                    <span className="flex flex-col"><span className="text-[19px] font-bold text-navy-900">{r.label}</span><span className="text-[14px] text-ink-400">{r.line}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 'name':
        return (
          <div className="flex flex-col gap-6">
            <Q sub="ככה תופיעו במערכת ובהודעות לאורחים.">איך קוראים לכם?</Q>
            <div className="flex flex-col items-center gap-2">
              <PhotoPick shape="circle" label="תמונה שלכם (לא חובה)" value={d.ownerPhoto} onChange={(v) => update({ ownerPhoto: v })} max={256} />
              <span className="text-[14px] text-ink-400">תמונה, לא חובה</span>
            </div>
            <BigInput label="שם מלא" value={d.ownerName} onChange={(e) => update({ ownerName: e.target.value })} placeholder="למשל: יעל לוי" autoComplete="name" maxLength={60} />
          </div>
        );
      case 'phone':
        return (
          <div className="flex flex-col gap-5">
            <Q sub="לכאן יגיעו ההתראות, וממנו האורחים יקבלו וואטסאפ.">מה מספר הנייד?</Q>
            <BigInput label="נייד" type="tel" inputMode="tel" dir="ltr" className="text-right" value={d.ownerPhone} onChange={(e) => update({ ownerPhone: e.target.value, phoneVerified: false })} placeholder="050-000-0000" autoComplete="tel"
              error={d.ownerPhone && !phoneOk(d.ownerPhone) ? 'חסרות ספרות. מספר נייד הוא 10 ספרות.' : ''} />
            {phoneOk(d.ownerPhone) ? <VerifyPhone phone={d.ownerPhone} verified={d.phoneVerified} onVerified={() => update({ phoneVerified: true })} /> : null}
          </div>
        );
      case 'type':
        return (
          <div className="flex flex-col gap-4">
            <Q>איזה מקום יש לכם?</Q>
            <div role="radiogroup" aria-label="סוג העסק" className="flex flex-col gap-2.5">
              {[...BUSINESS_TYPES, OTHER_TYPE].map((t, k) => (
                <button key={t.value} type="button" role="radio" aria-checked={d.type === t.value}
                  onClick={() => pickThenNext((cur) => {
                    const info = typeInfo(t.value);
                    let units = cur.units.map((u, n) => (u.existing || !/^\S+ \d+$/.test(u.name) ? u : { ...u, name: `${info.unit} ${n + 1}` }));
                    if (info.single && units.length > 1) units = units.filter((u, n) => u.existing || n === 0);
                    return { type: t.value, units };
                  })}
                  className="ob-choice ob-press ob-pop flex-row items-center gap-3.5 !rounded-[20px] p-2 pe-4" style={{ animationDelay: `${k * 35}ms` }}>
                  <span className="relative h-[76px] w-[104px] shrink-0 overflow-hidden rounded-[14px] bg-[#E9ECF4]"><img src={t.photo} alt="" className="h-full w-full object-cover" draggable={false} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[19px] font-bold text-navy-900">{t.label}</span>
                    <span className="text-[14px] text-ink-400">{t.line}</span>
                  </span>
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2', d.type === t.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-[#D5D9E6]')}>
                    {d.type === t.value ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'business':
        return (
          <div className="flex flex-col gap-5">
            <Q sub="השם נכתב על השלט. אפשר לשנות בכל זמן.">איך קוראים לעסק?</Q>
            <BigInput label="שם העסק" value={d.businessName} onChange={(e) => update({ businessName: e.target.value })}
              placeholder={{ hotel: 'למשל: מלון הגליל', boutique: 'למשל: בית הכרמל', villa: 'למשל: וילה בכרם', apartments: 'למשל: דירות הים', guesthouse: 'למשל: בית הארחה נוף' }[d.type] || 'למשל: צימרי הגליל'} maxLength={50} />
          </div>
        );
      case 'location':
        return (
          <div className="flex flex-col gap-5">
            <Q sub="נשלח לאורחים ניווט בוויז.">איפה המקום?</Q>
            <SettlementInput value={d.settlement} onChange={(v) => update({ settlement: v })} />
            <BigInput label="רחוב ומספר (לא חובה)" value={d.street} onChange={(e) => update({ street: e.target.value })} placeholder="למשל: הגפן 12" maxLength={80} />
          </div>
        );
      case 'photos':
        return (
          <div className="flex flex-col gap-5">
            <Q sub="מהטלפון או מהגלריה. הראשונה היא התמונה הראשית.">תמונות של המקום</Q>
            <PhotoGallery photos={d.photos} onChange={(v) => update({ photos: v })} />
          </div>
        );
      case 'units':
        return (
          <div className="flex flex-col gap-5">
            <Q sub={T.single ? 'כמה אורחים, מחיר ללילה ותמונה.' : `הקישו על + בציור כדי להוסיף, ועל ${T.unit} כדי לערוך.`}>
              {T.single ? `ספרו לנו על ה${T.unit}` : `כמה ${T.units} יש לכם? (${d.units.length})`}
            </Q>
            {!T.single ? (
              <div className="ob-scroll-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={T.units}>
                {d.units.map((u) => (
                  <button key={u.key} type="button" role="tab" aria-selected={activeUnit?.key === u.key} onClick={() => setActive(u.key)}
                    className={cn('ob-press shrink-0 rounded-full px-4 text-[16px] font-semibold min-h-[48px]', activeUnit?.key === u.key ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 ring-1 ring-inset ring-[#E1E4EE]')}>
                    {u.name || 'בלי שם'}
                  </button>
                ))}
              </div>
            ) : null}
            {activeUnit ? (
              <div key={activeUnit.key} className="ob-fade flex flex-col gap-4 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_8px_24px_-12px_rgba(27,38,86,0.16)]">
                <div className="flex items-end gap-3">
                  <div className="min-w-0 flex-1"><BigInput label="שם" value={activeUnit.name} onChange={(e) => setUnit(activeUnit.key, { name: e.target.value })} maxLength={40} /></div>
                  <PhotoPick shape="tile" label={`תמונה של ${activeUnit.name || 'היחידה'}`} value={activeUnit.photo} onChange={(v) => setUnit(activeUnit.key, { photo: v })} max={640} className="[&>button]:!h-[60px] [&>button]:!w-[60px]" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[17px] font-semibold text-navy-900">אורחים</span>
                  <Stepper size="sm" value={activeUnit.guests} onChange={(v) => setUnit(activeUnit.key, { guests: v })} min={1} max={30} label="אורחים" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <span className="text-[17px] font-semibold text-navy-900">מחיר ללילה</span>
                  <Chips label="מחיר ללילה" options={[500, 800, 1200, 1800].map((v) => ({ value: v, label: formatMoney(v) }))} value={Number(activeUnit.price)} onChange={(v) => setUnit(activeUnit.key, { price: v })} />
                  <BigInput label="או מחיר אחר (₪)" inputMode="numeric" dir="ltr" className="text-right tabular-nums" value={String(activeUnit.price ?? '')}
                    onChange={(e) => setUnit(activeUnit.key, { price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} />
                </div>
                {!activeUnit.existing && d.units.length > 1 ? (
                  <Ghost className="self-start text-[#B4303A]" onClick={() => { const left = d.units.filter((x) => x.key !== activeUnit.key); update({ units: left }); setActive(left[0]?.key || null); }}>
                    <Trash2 className="h-[18px] w-[18px]" aria-hidden />{`הסרת ה${T.unit}`}
                  </Ghost>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      case 'today':
        return (
          <div className="flex flex-col gap-5">
            <Q sub="אפשר לבחור כמה.">מאיפה מגיעות הזמנות היום?</Q>
            <MultiChips label="מקורות הזמנות" options={CHANNELS_TODAY} value={d.channelsToday} onChange={(v) => update({ channelsToday: v })} />
          </div>
        );
      case 'links': {
        const icons = { website: Globe, instagram: Instagram, facebook: Facebook, maps: MapIcon, booking: Link2, airbnb: Link2 };
        const fields = LINK_FIELDS.filter((f) => (f.key === 'booking' ? d.channelsToday.includes('booking') : f.key === 'airbnb' ? d.channelsToday.includes('airbnb') : true));
        return (
          <div className="flex flex-col gap-4">
            <Q sub="מה שיש. אפשר להשאיר ריק.">קישורים לעסק</Q>
            {fields.map((f) => {
              const Icon = icons[f.key];
              return (
                <div key={f.key} className="flex items-end gap-3">
                  <span className="mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.06)]" aria-hidden><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
                  <div className="min-w-0 flex-1">
                    <BigInput label={f.label} dir="ltr" inputMode="url" className="!min-h-[54px] text-right !text-[17px]" value={d.links?.[f.key] || ''} placeholder={f.placeholder}
                      onChange={(e) => update((cur) => ({ links: { ...cur.links, [f.key]: e.target.value } }))} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      case 'channels':
        return (
          <div className="flex flex-col gap-4">
            <Q sub="ההזמנות משם ייכנסו ללוח השנה לבד.">נחבר את לוח השנה</Q>
            {Object.entries(PROVIDERS).filter(([k]) => d.channelsToday.includes(k === 'AIRBNB' ? 'airbnb' : 'booking')).map(([k, p]) => {
              const ch = d.channels[k];
              const setCh = (patch) => update((cur) => ({ channels: { ...cur.channels, [k]: { ...cur.channels[k], ...patch } } }));
              return (
                <div key={k} className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.04),0_8px_24px_-12px_rgba(27,38,86,0.16)]">
                  <button type="button" aria-pressed={ch.on} onClick={() => setCh({ on: !ch.on })} className="ob-press flex min-h-[72px] w-full items-center gap-3 px-4 text-start">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold text-white" style={{ background: p.color }} aria-hidden>{k === 'AIRBNB' ? 'A' : 'B.'}</span>
                    <span className="flex-1 text-[18px] font-bold text-navy-900">{p.label}</span>
                    <span className={cn('rounded-full px-3 py-1.5 text-[14px] font-bold', ch.on ? 'bg-brand-600 text-white' : 'bg-[#F1EFFE] text-brand-700')}>{ch.on ? 'מחברים' : 'לחבר'}</span>
                  </button>
                  {ch.on ? (
                    <div className="ob-fade flex flex-col gap-4 border-t border-[#EEF0F5] p-4">
                      <IcalHowTo provider={k} />
                      {d.units.map((u) => (
                        <LinkPaste key={u.key} label={`הקישור של ${u.name}`} value={ch.links[u.key] || ''} valid={isIcalUrl(ch.links[u.key])} onChange={(v) => setCh({ links: { ...ch.links, [u.key]: v } })} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      case 'checkin':
        return (
          <div className="flex flex-col gap-5">
            <Q sub="גררו את העיגול על השעון, או השתמשו ב- ו+.">מאיזו שעה אפשר להיכנס?</Q>
            <TimeDial label="שעת כניסה" value={d.checkIn} onChange={(v) => update({ checkIn: v })} color="#22B07D" />
          </div>
        );
      case 'checkout':
        return (
          <div className="flex flex-col gap-5">
            <Q sub={`כניסה מ-${d.checkIn}. עכשיו היציאה.`}>עד איזו שעה יוצאים?</Q>
            <TimeDial label="שעת יציאה" value={d.checkOut} onChange={(v) => update({ checkOut: v })} color="#3E2BF1" />
          </div>
        );
      case 'wa':
        return (
          <div className="flex flex-col gap-5">
            <Q sub="בכל הזמנה חדשה, לחיצה אחת שולחת את זה לאורח.">ככה תיראה הודעת האישור</Q>
            <div className="mx-auto w-full max-w-[340px] rounded-[40px] border-[10px] border-[#1B2656] bg-[#1B2656] shadow-[0_24px_48px_-24px_rgba(27,38,86,0.55)]">
              <WhatsAppPreview text={sampleMessage(d)} className="!rounded-[30px] !shadow-none" />
            </div>
            <BigInput label="חתימה" value={d.hostName} onChange={(e) => update({ hostName: e.target.value })} placeholder={d.ownerName ? `${d.ownerName.split(' ')[0]} מ${d.businessName || 'העסק'}` : 'השם שלכם'} maxLength={40} />
            <BigInput label="משפט סיום" value={d.waGreeting} onChange={(e) => update({ waGreeting: e.target.value })} placeholder="נשמח לארח אתכם." maxLength={80} />
          </div>
        );
      case 'pay':
        return (
          <div className="flex flex-col gap-5">
            <Q sub="נזכיר לכם לגבות, ונראה מה נשאר פתוח.">איך משלמים לכם?</Q>
            <MultiChips label="אמצעי תשלום" options={PAY_METHODS} value={d.payMethods} onChange={(v) => update({ payMethods: v })} />
            <div className="flex flex-col gap-2.5">
              <p className="text-[17px] font-semibold text-navy-900">מקדמה בהזמנה</p>
              <div role="radiogroup" aria-label="מקדמה" className="grid grid-cols-4 gap-1.5 rounded-[18px] bg-[#E9ECF4] p-1.5">
                {DEPOSIT_OPTIONS.map((o) => (
                  <button key={o.value} type="button" role="radio" aria-checked={d.deposit === o.value} onClick={() => update({ deposit: o.value })}
                    className={cn('ob-press min-h-[56px] rounded-[13px] px-1 text-[15px] font-bold leading-tight', d.deposit === o.value ? 'bg-white text-navy-900 shadow-[0_2px_8px_-2px_rgba(27,38,86,0.2)]' : 'text-ink-600')}>
                    {o.value === 'none' ? 'בלי' : o.value === 'full' ? 'הכל' : o.label}
                  </button>
                ))}
              </div>
              <p className="text-[15px] text-ink-600">{depositLine(d.deposit, d.units[0]?.price || 0)}</p>
            </div>
          </div>
        );
      case 'ready': {
        const links = Object.values(d.channels || {}).filter((c) => c.on && Object.values(c.links || {}).some((v) => isIcalUrl(v))).length;
        const chips = [
          { Icon: Building2, t: d.units.length === 1 ? d.units[0].name : `${d.units.length} ${T.units}` },
          d.settlement ? { Icon: MapPin, t: d.settlement } : null,
          d.photos?.length ? { Icon: Images, t: `${d.photos.length} תמונות` } : null,
          { Icon: Clock, t: `${d.checkIn} · ${d.checkOut}` },
          { Icon: MessageCircle, t: 'וואטסאפ מוכן' },
          { Icon: Wallet, t: d.deposit === 'none' ? 'בלי מקדמה' : d.deposit === 'full' ? 'תשלום מלא' : `מקדמה ${d.deposit}%` },
          links ? { Icon: Link2, t: links === 2 ? 'Booking + Airbnb' : 'ערוץ מחובר' } : null,
        ].filter(Boolean);
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              {d.ownerPhoto ? <img src={d.ownerPhoto} alt="" className="h-12 w-12 rounded-full object-cover" /> : <GuestAvatar name={d.ownerName || 'א'} size={48} photo={false} />}
              <p className="text-[16px] font-semibold text-ink-600">{d.ownerName ? `${d.ownerName.trim().split(/\s+/)[0]}, ` : ''}האורות דלוקים.</p>
            </div>
            <Q sub="הכל במקום. ההזמנה הראשונה כבר יכולה להיכנס.">{`${d.businessName || 'המקום שלכם'} מוכן.`}</Q>
            <ul className="flex flex-wrap gap-2">
              {chips.map(({ Icon, t }, k) => (
                <motion.li key={t} initial={still ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: 0.5 + k * 0.06, ease: EASE }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-3.5 text-[15px] font-semibold text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.06)]">
                  <Icon className="h-4 w-4 text-brand-600" strokeWidth={2} aria-hidden />{t}
                </motion.li>
              ))}
            </ul>
          </div>
        );
      }
      default:
        return null;
    }
  })();

  const variants = {
    enter: (k) => ({ opacity: 0, y: k > 0 ? 14 : -14 }),
    center: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE } },
    exit: (k) => ({ opacity: 0, y: k > 0 ? -10 : 10, transition: { duration: 0.15, ease: EASE } }),
  };
  const scene = (compact) => (
    <Scene d={d} lit={reveal} compact={compact} showPrices={unitsMode || reveal}
      onUnit={unitsMode ? (k) => setActive(k) : undefined} onAdd={unitsMode && !T.single ? addUnit : undefined} activeKey={unitsMode ? activeUnit?.key : null} />
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="ob lg:flex lg:flex-row-reverse" dir="rtl" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && canNext && !['units', 'channels', 'links'].includes(s.id)) { e.preventDefault(); next(); } }}>
        {/* canvas (desktop: the big half) */}
        <aside className="sticky top-0 hidden h-[100dvh] min-w-0 flex-1 flex-col gap-3 p-6 lg:flex">
          <p className="px-2 text-[14px] font-semibold text-ink-400">{reveal ? 'המקום שלכם' : 'המקום שלכם, נבנה מהתשובות'}</p>
          <div className="min-h-0 flex-1">{scene(false)}</div>
        </aside>

        <main className="relative flex min-h-[100dvh] w-full flex-col lg:w-[560px] lg:shrink-0">
          <header className="sticky top-0 z-20 flex items-center gap-2 bg-[var(--canvas)]/92 px-4 pb-2.5 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur md:px-8">
            {i > 0 && !reveal ? <Ghost onClick={back} aria-label="חזרה" className="!h-12 !w-12 !px-0"><ArrowRight className="h-6 w-6" aria-hidden /></Ghost>
              : <span className="flex h-12 items-center px-1"><Wordmark size={20} /></span>}
            {s.chapter >= 0 && s.chapter < 5 ? <Milestones chapter={s.chapter} /> : <span className="flex-1" />}
          </header>

          {s.id !== 'hello' ? <div className="px-4 pt-1 md:px-8 lg:hidden">{scene(true)}</div> : null}

          <div className="relative flex-1 px-5 pb-48 pt-5 md:px-8 lg:pt-8">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.section key={s.id} data-screen={s.id} custom={dir} variants={variants} initial="enter" animate="center" exit="exit">
                {body}
              </motion.section>
            </AnimatePresence>
          </div>

          <footer className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[var(--canvas)] via-[var(--canvas)] to-transparent px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-6 md:px-8 lg:absolute">
            {error ? <p className="mb-3 rounded-[14px] bg-[var(--st-red-bg)] px-4 py-3 text-[15px] font-medium text-[var(--st-red-fg)]" role="alert">{error}</p> : null}
            {reveal ? (
              <Primary className="w-full" onClick={toToday} disabled={busy}>למסך היום<ArrowLeft className="h-5 w-5" aria-hidden /></Primary>
            ) : (
              <Primary className="w-full" onClick={next} disabled={!canNext || busy} aria-busy={busy}>
                {busy ? <><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />שומרים…</> : <>{s.id === 'hello' ? 'מתחילים לבנות' : s.id === 'pay' ? 'להדליק את האורות' : 'המשך'}<ArrowLeft className="h-5 w-5" aria-hidden /></>}
              </Primary>
            )}
            {s.optional && !reveal ? (
              <Ghost className="mt-1 w-full" onClick={() => go(step(i, 1), { skip: true })}>אחר כך, לדלג על זה</Ghost>
            ) : !reveal && s.id !== 'hello' ? <p className="mt-2 text-center text-[13px] text-ink-400">נשמר לבד. אפשר לחזור בכל רגע.</p> : null}
          </footer>
        </main>
      </div>
    </MotionConfig>
  );
}
