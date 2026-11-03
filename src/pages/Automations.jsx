/**
 * ההודעות לאורחים — version A, "atlas already does it for you".
 * One deep hero that says what is happening in one sentence, the guest's stay as four lit stops,
 * then the messages as plain sentences with one switch each. Tap a sentence → the real WhatsApp
 * text in a sheet. No node chart, no stat tiles, no triggers/channels/offsets.
 * Data: the same four automation_rules journey steps the automation-runner executes (014).
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, Navigation, KeyRound, Star, Moon, ChevronLeft, Check, Trash2 } from 'lucide-react';
import { SkelLine } from '@/components/ds';
import { Switch } from '@/components/ui/switch';
import { DB_FEATURES } from '@/config/dbFeatures';
import { useGuestMessages, hhmm } from '@/components/magic/useGuestMessages';
import { MessageSheet } from '@/components/magic/MessageSheet';
import { DoneMoment } from '@/components/magic/WaBubble';
import { isRunnableRule } from '@/lib/real/journey';
import { cn } from '@/lib/utils';
import '@/components/magic/magic.css';

const ICONS = { confirmation: BadgeCheck, arrival_eve: Navigation, welcome: KeyRound, thanks_review: Star };

function Hero({ gm, onAllOn }) {
  const reduce = useReducedMotion();
  const n = gm.steps.length;
  const title = gm.allOn ? 'הכל יוצא לאורחים לבד' : gm.onCount ? `${gm.onCount} מתוך ${n} הודעות פועלות` : `${n} הודעות מוכנות לצאת`;
  const sub = gm.allOn
    ? 'כל אורח מקבל את ההודעה הנכונה בזמן. אתם רק לוחצים שלח.'
    : 'מפעילים פעם אחת, ומכאן כל אורח מקבל את ההודעה הנכונה בזמן.';
  const fill = gm.onCount ? Math.max(0, gm.steps.reduce((m, s, i) => (gm.isOn(s) ? i : m), 0)) / (n - 1) : 0;
  return (
    <section className="mg-photo rounded-[32px] px-6 pb-6 pt-7 text-white md:px-10 md:pb-9 md:pt-10" aria-labelledby="mg-title">
      <img className="mg-photo-img" src="/onboarding/bg/lake-p640.webp" srcSet="/onboarding/bg/lake-p640.webp 640w, /onboarding/bg/lake-p1000.webp 1000w, /onboarding/bg/lake-1600.webp 1600w" sizes="(min-width: 960px) 900px, 100vw" alt="" loading="eager" decoding="async" />
      <p className="text-[15px] font-semibold text-white/70">ההודעות לאורחים</p>
      <h1 id="mg-title" className="!text-white mt-1 text-[30px] font-bold leading-[1.12] tracking-[-0.01em] md:text-[40px]">{title}</h1>
      <p className="mt-2 max-w-[30rem] text-[16px] leading-snug text-white/75">{sub}</p>

      <div className="mg-line mt-8" aria-label="המסע של האורח">
        <motion.span className="mg-line-fill" aria-hidden style={{ width: `${75 * fill}%` }}
          initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
        {gm.steps.map((s, i) => {
          const on = gm.isOn(s);
          return (
            <motion.div key={s.key} className={cn('mg-node', on && 'is-on')}
              initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
              <span className="mg-dot">{on ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}</span>
              <span className={cn('text-[13px] font-semibold', on ? 'text-white' : 'text-white/55')}>{s.moment}</span>
              <span className="sr-only">{on ? 'פועל' : 'כבוי'}</span>
            </motion.div>
          );
        })}
      </div>

      {!gm.allOn ? (
        <button type="button" onClick={onAllOn} disabled={gm.busy || !gm.canWrite} className="mg-cta mt-8 w-full disabled:opacity-60 sm:w-auto">
          {gm.onCount ? 'הפעילו גם את השאר' : 'הפעילו את כולן'}
        </button>
      ) : (
        <p className="mg-glass mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[15px] font-semibold">
          <span className="mg-live inline-block h-2 w-2 rounded-[3px] bg-white" aria-hidden />
          atlas עוקב אחרי כל הזמנה חדשה
        </p>
      )}
    </section>
  );
}

function Row({ step, gm, onOpen }) {
  const on = gm.isOn(step);
  const Icon = ICONS[step.key] || BadgeCheck;
  const t = step.defaultTime ? hhmm(gm.timeOf(step)) : '';
  return (
    <li className={cn('mg-row', !on && 'is-off')}>
      <button type="button" onClick={() => onOpen(step)} className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3.5 text-start" aria-label={`${step.sentence}, ${step.whenPlain}. הצגת ההודעה`}>
        <span className="mg-ico" aria-hidden><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold leading-snug text-navy-900">{step.sentence}</span>
          <span className="mt-0.5 block text-[14px] text-ink-600">{step.whenPlain}{t ? `, ${t}` : ''}</span>
        </span>
        <ChevronLeft className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.75} aria-hidden />
      </button>
      <Switch checked={on} disabled={gm.busy || !gm.canWrite} onCheckedChange={(v) => gm.save(step, { on: v })}
        aria-label={on ? `כיבוי: ${step.sentence}` : `הפעלה: ${step.sentence}`} />
    </li>
  );
}

export default function AutomationsPage({ orgId }) {
  const base = useGuestMessages(orgId);
  const gm = { ...base, canWrite: !!orgId };
  const [sheet, setSheet] = useState(null);
  const [done, setDone] = useState(null);

  if (gm.loading) {
    return (
      <div className="mx-auto w-full max-w-[960px] px-5 pt-6 md:px-10 md:pt-10" role="status" aria-busy="true" aria-label="טוען">
        <SkelLine className="h-[320px] rounded-[32px]" /><div className="mt-6 space-y-3">{[0, 1, 2, 3].map((i) => <SkelLine key={i} className="h-[76px] rounded-[22px]" />)}</div>
      </div>
    );
  }

  const allOn = async () => { const ok = await gm.turnAllOn(); if (ok) setDone({ title: 'מעכשיו זה קורה לבד', line: 'כל אורח יקבל את 4 ההודעות בזמן. הן יחכו לכם מוכנות בלוח היום.' }); };
  const nextIdea = gm.onCount > 0 ? gm.steps.find((s) => !gm.isOn(s)) : null;

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-6 px-5 pb-28 pt-5 md:px-10 md:pt-10" dir="rtl">
      <Hero gm={gm} onAllOn={allOn} />

      {nextIdea ? (
        <section className="mg-navy flex flex-col gap-4 rounded-[28px] p-5 md:flex-row md:items-center md:p-6" aria-label="הצעה">
          <p className="min-w-0 flex-1 text-[17px] font-bold leading-snug">{nextIdea.ask}</p>
          <div className="flex gap-2">
            <button type="button" className="mg-cta flex-1 md:flex-none" disabled={gm.busy || !gm.canWrite}
              onClick={async () => { if (await gm.save(nextIdea, { on: true, quiet: true })) setDone({ title: `${nextIdea.short}: פועל`, line: `${nextIdea.whenPlain}, ההודעה תחכה לכם מוכנה.` }); }}>כן, תפעילו</button>
            <button type="button" className="mg-chip mg-chip-dark" onClick={() => setSheet(nextIdea)}>איך זה נראה</button>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="mg-list">
        <h2 id="mg-list" className="px-1 text-[20px] font-bold text-navy-900">מה יוצא לאורחים</h2>
        <ul className="mt-3 space-y-2.5">
          {gm.steps.map((s) => <Row key={s.key} step={s} gm={gm} onOpen={setSheet} />)}
          <li className="mg-row">
            <span className="flex min-w-0 flex-1 items-center gap-3.5">
              <span className="mg-ico" aria-hidden><Moon className="h-5 w-5" strokeWidth={1.75} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold leading-snug text-navy-900">לא שולחים בשבת ובחג</span>
                <span className="mt-0.5 block text-[14px] text-ink-600">הודעה שנופלת על שבת יוצאת במוצאי שבת</span>
              </span>
            </span>
            <Switch checked={gm.respectShabbat} disabled={gm.busy || !gm.hasRules} onCheckedChange={gm.setShabbat} aria-label="לא שולחים בשבת ובחג" />
          </li>
        </ul>
      </section>

      <p className="px-1 text-[14px] leading-relaxed text-ink-600">
        כל הודעה מחכה מוכנה ב<Link to="/today" className="font-semibold text-brand-600 underline-offset-2 hover:underline">לוח היום</Link>. לחיצה פותחת וואטסאפ עם הטקסט והטלפון של האורח.
        {!DB_FEATURES.realCore ? ' בהדגמה ההודעות לא נשלחות באמת.' : ''}
      </p>

      {gm.others.length ? (
        <section aria-label="הודעות ישנות" className="space-y-2">
          <h2 className="px-1 pt-2 text-[15px] font-bold text-navy-900">הודעות שהגדרתם בעבר</h2>
          <ul className="space-y-2">
            {gm.others.map((r) => {
              const ok = isRunnableRule(r);
              return (
                <li key={r.id} className="mg-row">
                  <span className="min-w-0 flex-1 ps-2">
                    <span className="block truncate text-[15px] font-semibold text-navy-900">{r.name || 'הודעה'}</span>
                    <span className="block text-[13px] text-ink-600">{ok ? 'פועלת' : 'עוד לא נתמכת, ולכן לא יוצאת'}</span>
                  </span>
                  <Switch checked={!!r.is_active} onCheckedChange={(v) => gm.toggleOther(r.id, v)} aria-label={`הפעלה: ${r.name || 'הודעה'}`} />
                  <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-[14px]" aria-label={`מחיקה: ${r.name || 'הודעה'}`} onClick={() => gm.removeOther(r.id)}>
                    <Trash2 className="h-4 w-4 text-ink-400" strokeWidth={1.75} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <MessageSheet step={sheet} open={!!sheet} onOpenChange={(v) => !v && setSheet(null)} gm={gm}
        onEnabled={(s) => setDone({ title: `${s.short}: פועל`, line: `${s.whenPlain}, ההודעה תחכה לכם מוכנה.` })} />
      <DoneMoment open={!!done} title={done?.title} line={done?.line} onDone={() => setDone(null)} />
    </div>
  );
}
