/**
 * ההודעות לאורחים — version B, "tell atlas, it happens" (discovery first).
 * atlas opens with what it already does and a deck of ready suggestions in plain Hebrew
 * ("לשלוח לאורחים הוראות הגעה יום לפני?") — one tap answers. Typing is the optional extra:
 * a sentence becomes the same confirmation card (what you asked as your bubble, atlas's answer with
 * the real WhatsApp message, one "מאשרים"). Same four automation_rules journey steps as before (014).
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ArrowUp, Mic, Moon, Trash2 } from 'lucide-react';
import { SkelLine } from '@/components/ds';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { DB_FEATURES } from '@/config/dbFeatures';
import { useGuestMessages, hhmm } from '@/components/magic/useGuestMessages';
import { MessageSheet } from '@/components/magic/MessageSheet';
import { WaBubble, DoneMoment, AssistantFace } from '@/components/magic/WaBubble';
import { parseIntent, EXAMPLES } from '@/components/magic/intent';
import { isRunnableRule } from '@/lib/real/journey';
import { cn } from '@/lib/utils';
import '@/components/magic/magic.css';

const TIMES = ['08:00', '10:00', '12:00', '16:00', '18:00'];
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

/* ── the conversation card: your words, atlas's answer, the real message, one tap ───────────────── */
function ConfirmSheet({ ask, onClose, gm, onDone }) {
  const step = ask?.step || null;
  const [time, setTime] = useState(null);
  React.useEffect(() => { setTime(ask?.time || (step ? hhmm(gm.timeOf(step)) : null)); }, [ask]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ask) return null;
  const guest = gm.ctx.booking?.guest_name || 'נועה לוי';
  const turningOff = step && ask.on === false;

  const confirm = async () => {
    if (ask.kind === 'shabbat') { await gm.setShabbat(ask.on); onClose(); return; }
    const ok = await gm.save(step, { on: !turningOff, sendTime: time, quiet: true });
    if (!ok) return;
    onClose();
    onDone(turningOff ? { title: `${step.short}: הופסק`, line: 'האורחים לא יקבלו את ההודעה הזו. אפשר להחזיר בכל רגע.' }
      : { title: 'סגור, זה קורה מעכשיו', line: `${step.sentence}, ${step.whenPlain}${step.defaultTime && time ? ` ב-${time}` : ''}.` });
  };

  let answer; let body = null; let cta = null;
  if (ask.kind === 'step') {
    answer = turningOff ? `בסדר. נפסיק לשלוח את ההודעה: ${step.short}.`
      : `סגור. כל אורח יקבל את זה ${step.whenPlain}${step.defaultTime && time ? `, ב-${time}` : ''}:`;
    body = !turningOff ? (
      <>
        <WaBubble className="mt-3" text={gm.textFor(step)} guest={guest} time={time || 'עכשיו'} sample={gm.ctx.sample} delay={0.25} />
        {step.defaultTime ? (
          <div className="mg-deck mt-3" role="radiogroup" aria-label="שעת שליחה">
            {[...new Set([...TIMES, time].filter(Boolean))].sort().map((t) => (
              <button key={t} type="button" role="radio" aria-checked={t === time} onClick={() => setTime(t)}
                className={cn('mg-chip tabular', t === time ? 'mg-chip-on' : 'mg-chip-light')} dir="ltr">{t}</button>
            ))}
          </div>
        ) : null}
      </>
    ) : null;
    cta = turningOff ? 'כן, להפסיק' : 'מאשרים';
  } else if (ask.kind === 'shabbat') {
    answer = ask.on ? 'סגור. הודעה שנופלת על שבת או חג תחכה ותצא במוצאי שבת.' : 'בסדר. ההודעות ייצאו בזמן גם בשבת ובחג.';
    cta = 'מאשרים';
  } else if (ask.kind === 'balance') {
    answer = 'את זה atlas כבר עושה בשבילכם: כל יתרה פתוחה מופיעה בלוח היום, עם תזכורת מוכנה לשליחה לאורח בלחיצה.';
    body = <Link to="/balances" className="mg-cta mg-cta-indigo mt-4 w-full" onClick={onClose}>לראות את היתרות הפתוחות</Link>;
  } else {
    answer = 'את זה עוד לא אוכל לעשות לבד. אלה ההודעות שאני שולח לאורחים, בחרו אחת:';
    body = (
      <div className="mt-3 flex flex-wrap gap-2">
        {gm.steps.map((s) => (
          <button key={s.key} type="button" className="mg-chip mg-chip-light" onClick={() => onClose({ kind: 'step', step: s, on: true, said: s.said })}>{s.short}</button>
        ))}
      </div>
    );
  }

  return (
    <Drawer open={!!ask} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="mx-auto max-h-[92dvh] w-full max-w-[520px] rounded-t-[32px] border-0 bg-[#F7F8FB]" dir="rtl">
        <div className="overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
          <DrawerTitle className="sr-only">אישור הבקשה</DrawerTitle>
          <DrawerDescription className="sr-only">מה ביקשתם ומה atlas יעשה</DrawerDescription>
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-[20px_20px_20px_6px] bg-[#3E2BF1] px-4 py-2.5 text-[15px] leading-snug text-white">{ask.said}</p>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <AssistantFace size={36} />
            <div className="min-w-0 flex-1">
              <p className="pt-1 text-[16px] font-semibold leading-snug text-navy-900">{answer}</p>
              {body}
            </div>
          </div>
          {cta ? (
            <button type="button" onClick={confirm} disabled={gm.busy || !gm.canWrite} className="mg-cta mg-cta-indigo mt-5 w-full disabled:opacity-60">{cta}</button>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ── one suggestion in the deck ─────────────────────────────────────────────────────────────────── */
function Suggestion({ step, gm, onYes, onLater, i }) {
  const reduce = useReducedMotion();
  return (
    <motion.article layout className="flex w-[300px] flex-col rounded-[28px] bg-white p-4 md:w-[340px]"
      initial={reduce ? false : { opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, y: -30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: reduce ? 0 : 0.1 + i * 0.07 }} aria-label={step.ask}>
      <p className="flex items-center gap-2 text-[13px] font-semibold text-brand-600"><AssistantFace size={22} /> הצעה של atlas</p>
      <p className="mt-2 min-h-[3.2em] text-[18px] font-bold leading-snug text-navy-900">{step.ask}</p>
      <WaBubble compact className="mt-3" text={gm.textFor(step)} guest={gm.ctx.booking?.guest_name || 'נועה לוי'} time={hhmm(gm.timeOf(step)) || 'עכשיו'} sample={gm.ctx.sample} />
      <div className="mt-4 flex items-center gap-2">
        <button type="button" className="mg-cta mg-cta-indigo flex-1" onClick={() => onYes(step)} disabled={gm.busy || !gm.canWrite}>כן, תפעילו</button>
        <button type="button" className="min-h-[48px] rounded-full px-4 text-[15px] font-semibold text-ink-600" onClick={() => onLater(step)}>לא עכשיו</button>
      </div>
    </motion.article>
  );
}

export default function AutomationsPage({ orgId }) {
  const base = useGuestMessages(orgId);
  const gm = { ...base, canWrite: !!orgId };
  const reduce = useReducedMotion();
  const [later, setLater] = useState(() => new Set());
  const [ask, setAsk] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [done, setDone] = useState(null);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);

  if (gm.loading) {
    return (
      <div className="mx-auto w-full max-w-[960px] px-5 pt-6 md:px-10 md:pt-10" role="status" aria-busy="true" aria-label="טוען">
        <SkelLine className="h-[260px] rounded-[32px]" /><SkelLine className="mt-5 h-[300px] rounded-[28px]" />
      </div>
    );
  }

  const active = gm.steps.filter((s) => gm.isOn(s));
  const ideas = gm.steps.filter((s) => !gm.isOn(s) && !later.has(s.key));
  const yes = async (s) => { if (await gm.save(s, { on: true, quiet: true })) setDone({ title: 'סגור, זה קורה מעכשיו', line: `${s.sentence}, ${s.whenPlain}.` }); };
  const submit = (e) => {
    e?.preventDefault();
    const said = text.trim(); if (!said) return;
    const it = parseIntent(said);
    const step = it.kind === 'step' ? gm.steps.find((s) => s.key === it.stepKey) : null;
    setAsk({ ...it, step, said }); setText('');
  };
  const listen = () => {
    if (!SR) return;
    const r = new SR(); r.lang = 'he-IL'; r.interimResults = false;
    r.onresult = (ev) => setText(ev.results[0][0].transcript || '');
    r.onend = () => setListening(false);
    setListening(true); r.start();
  };
  const title = gm.allOn ? 'הכל מטופל. כל אורח מקבל את ההודעה הנכונה בזמן.' : active.length ? `atlas כבר שולח ${active.length === 1 ? 'הודעה אחת' : `${active.length} הודעות`} לאורחים` : 'atlas יכול לדבר עם האורחים בשבילכם';

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-6 px-5 pb-28 pt-5 md:px-10 md:pt-10" dir="rtl">
      <section className="mg-photo rounded-[32px] px-6 pb-6 pt-6 text-white md:px-10 md:pb-9 md:pt-9" aria-labelledby="mg-title">
        <img className="mg-photo-img" src="/onboarding/bg/aframe-p640.webp" srcSet="/onboarding/bg/aframe-p640.webp 640w, /onboarding/bg/aframe-p1000.webp 1000w, /onboarding/bg/aframe-1600.webp 1600w" sizes="(min-width: 960px) 900px, 100vw" alt="" loading="eager" decoding="async" />
        <div className="flex items-center gap-2.5">
          <AssistantFace size={40} />
          <p className="text-[15px] font-semibold text-white/75">ההודעות לאורחים</p>
        </div>
        <h1 id="mg-title" className="!text-white mt-4 max-w-[34rem] text-[28px] font-bold leading-[1.15] tracking-[-0.01em] md:text-[38px]">{title}</h1>
        {active.length ? (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="פועל עכשיו">
            <AnimatePresence initial={false}>
              {active.map((s) => (
                <motion.li key={s.key} layout initial={reduce ? false : { opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
                  <button type="button" className="mg-chip mg-chip-dark mg-glass" onClick={() => setSheet(s)} aria-label={`${s.sentence}: פועל. פתיחה`}>
                    <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden />{s.short}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <p className="mt-2 max-w-[30rem] text-[16px] leading-snug text-white/75">בחרו מה לשלוח. atlas יכין כל הודעה בזמן הנכון, עם השם והפרטים של האורח.</p>
        )}
        {!gm.allOn && ideas.length > 1 ? (
          <button type="button" className="mg-cta mt-6 w-full sm:w-auto" disabled={gm.busy || !gm.canWrite}
            onClick={async () => { if (await gm.turnAllOn()) setDone({ title: 'סגור, זה קורה מעכשיו', line: 'כל אורח יקבל את ההודעות בזמן. הן יחכו לכם מוכנות בלוח היום.' }); }}>
            {active.length ? 'להפעיל את כל ההצעות' : 'להפעיל את כל ההודעות'}
          </button>
        ) : null}
      </section>

      {ideas.length ? (
        <section aria-labelledby="mg-ideas">
          <h2 id="mg-ideas" className="px-1 text-[20px] font-bold text-navy-900">הצעות בשבילכם</h2>
          <div className="mg-deck mt-3">
            <AnimatePresence>
              {ideas.map((s, i) => <Suggestion key={s.key} step={s} gm={gm} i={i} onYes={yes} onLater={(x) => setLater((p) => new Set(p).add(x.key))} />)}
            </AnimatePresence>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] bg-white p-4 md:p-5" aria-labelledby="mg-ask">
        <h2 id="mg-ask" className="px-1 text-[16px] font-bold text-navy-900">רוצים משהו אחר? כתבו במילים שלכם</h2>
        <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-full bg-[#F7F8FB] p-1.5 ps-4">
          <label htmlFor="mg-input" className="sr-only">מה לעשות עם ההודעות לאורחים</label>
          <input id="mg-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="למשל: הוראות הגעה יום לפני ב-9"
            className="min-h-[44px] min-w-0 flex-1 bg-transparent text-[16px] text-navy-900 outline-none placeholder:text-ink-400" autoComplete="off" enterKeyHint="send" />
          {SR ? (
            <button type="button" onClick={listen} className={cn('inline-flex h-11 w-11 items-center justify-center rounded-full text-navy-900', listening && 'mg-live')} aria-label="אמרו בקול">
              <Mic className="h-5 w-5" strokeWidth={1.75} />
            </button>
          ) : null}
          <button type="submit" disabled={!text.trim()} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#3E2BF1] text-white disabled:opacity-40" aria-label="שליחה">
            <ArrowUp className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="mg-chip mg-chip-light !min-h-[44px] !text-[14px] !font-medium" onClick={() => { const it = parseIntent(ex); setAsk({ ...it, step: it.kind === 'step' ? gm.steps.find((s) => s.key === it.stepKey) : null, said: ex }); }}>{ex}</button>
          ))}
        </div>
      </section>

      <section className="flex items-center gap-3.5 rounded-[22px] bg-white px-4 py-3" aria-label="שבת וחג">
        <span className="mg-ico" aria-hidden><Moon className="h-5 w-5" strokeWidth={1.75} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold text-navy-900">לא שולחים בשבת ובחג</span>
          <span className="block text-[14px] text-ink-600">הודעה שנופלת על שבת יוצאת במוצאי שבת</span>
        </span>
        <Switch checked={gm.respectShabbat} disabled={gm.busy || !gm.hasRules} onCheckedChange={gm.setShabbat} aria-label="לא שולחים בשבת ובחג" />
      </section>

      <p className="px-1 text-[14px] leading-relaxed text-ink-600">
        כל הודעה מחכה מוכנה ב<Link to="/today" className="font-semibold text-brand-600 underline-offset-2 hover:underline">לוח היום</Link>. לחיצה פותחת וואטסאפ עם הטקסט והטלפון של האורח.
        {!DB_FEATURES.realCore ? ' בהדגמה ההודעות לא נשלחות באמת.' : ''}
      </p>

      {gm.others.length ? (
        <section aria-label="הודעות ישנות" className="space-y-2">
          <h2 className="px-1 pt-2 text-[15px] font-bold text-navy-900">הודעות שהגדרתם בעבר</h2>
          <ul className="space-y-2">
            {gm.others.map((r) => (
              <li key={r.id} className="mg-row">
                <span className="min-w-0 flex-1 ps-2">
                  <span className="block truncate text-[15px] font-semibold text-navy-900">{r.name || 'הודעה'}</span>
                  <span className="block text-[13px] text-ink-600">{isRunnableRule(r) ? 'פועלת' : 'עוד לא נתמכת, ולכן לא יוצאת'}</span>
                </span>
                <Switch checked={!!r.is_active} onCheckedChange={(v) => gm.toggleOther(r.id, v)} aria-label={`הפעלה: ${r.name || 'הודעה'}`} />
                <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-[14px]" aria-label={`מחיקה: ${r.name || 'הודעה'}`} onClick={() => gm.removeOther(r.id)}>
                  <Trash2 className="h-4 w-4 text-ink-400" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConfirmSheet ask={ask} gm={gm} onDone={setDone} onClose={(nextAsk) => setAsk(nextAsk && nextAsk.kind ? nextAsk : null)} />
      <MessageSheet step={sheet} open={!!sheet} onOpenChange={(v) => !v && setSheet(null)} gm={gm} />
      <DoneMoment open={!!done} title={done?.title} line={done?.line} onDone={() => setDone(null)} />
    </div>
  );
}
