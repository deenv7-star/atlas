/**
 * Version B, "Morning brief": one card that reads like a short note for the morning.
 *   - a headline that counts only what is urgent today ("2 דברים דחופים היום" / "אין משהו דחוף היום")
 *   - up to 3 numbered priorities (דחוף / כדאי), each with its one action and a ✓ "טופל" (hidden until tomorrow)
 *   - ideas (רעיון) on the side, each removable for good
 * Everything comes from buildInsights (real account rows only).
 */
import React, { useState } from 'react';
import { Check, ChevronDown, X, Lightbulb } from 'lucide-react';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { formatDayHe, todayISO } from '@/lib/stay/format';
import { cn } from '@/lib/utils';
import InsightActionButton from './InsightActionButton';

export const TOP = 3;
const CHIP = {
  urgent: 'bg-brand-600 text-white',
  worth: 'bg-[#ECEAFE] text-brand-600',
};

function headline(urgent) {
  if (urgent === 0) return 'אין משהו דחוף היום';
  if (urgent === 1) return 'דבר אחד דחוף היום';
  return `${urgent} דברים דחופים היום`;
}

function subline(urgent, worth) {
  if (!worth) return '';
  const what = worth === 1 ? 'דבר אחד שכדאי לטפל בו' : `${worth} דברים שכדאי לטפל בהם`;
  return urgent ? `ועוד ${what}.` : `יש ${what}.`;
}

function useLeave(restore) {
  const [leaving, setLeaving] = useState(null);
  const leave = (item, fn, msg) => {
    setLeaving(item.id);
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      fn(item.id);
      setLeaving(null);
      atlasToastApi.undo(msg, () => restore(item.id));
    }, reduce ? 0 : 200);
  };
  return [leaving, leave];
}

function Priority({ n, item, onAction, onDone, leaving }) {
  return (
    <li className={cn('ins-row', leaving && 'is-leaving')} data-insight={item.rule} data-severity={item.severity}>
      <div className="min-h-0 overflow-hidden">
        <div className="flex gap-3 py-3.5">
          <span aria-hidden className="v5-num mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7F8FB] text-[15px] font-extrabold text-navy-900 ring-1 ring-inset ring-[#E4E6F0]">{n}</span>
          <div className="min-w-0 flex-1">
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[16px] font-bold leading-snug text-navy-900">{item.title}</span>
              <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-bold', CHIP[item.severity])}>{item.label}</span>
            </p>
            <p className="mt-1 text-[14px] leading-[1.55] text-ink-600">{item.why}</p>
            <div className="mt-2.5 flex items-center gap-1">
              <InsightActionButton item={item} onAction={onAction} tone={item.severity === 'urgent' ? 'solid' : 'soft'} />
              <button
                type="button"
                onClick={() => onDone(item)}
                aria-label={`טופל: ${item.title}. יוסתר עד מחר`}
                className="press inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold text-ink-600 transition-colors hover:bg-[#F1F1F8] hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                טופל
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function Idea({ item, onAction, onDismiss, leaving }) {
  return (
    <li className={cn('ins-row', leaving && 'is-leaving')} data-insight={item.rule} data-severity={item.severity}>
      <div className="min-h-0 overflow-hidden">
        <div className="flex items-start gap-2 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug text-navy-900">{item.title}</p>
            <p className="mt-0.5 text-[13px] leading-[1.5] text-ink-600">{item.why}</p>
            <InsightActionButton item={item} onAction={onAction} className="mt-2 h-11 px-3.5 text-[14px]" />
          </div>
          <button
            type="button"
            onClick={() => onDismiss(item)}
            aria-label={`להסיר את הרעיון: ${item.title}`}
            className="press -me-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-[#F1F1F8] hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function MorningBrief({ insights, onAction }) {
  const { items, ready, snooze, dismiss, restore } = insights;
  const [more, setMore] = useState(false);
  const [leaving, leave] = useLeave(restore);
  if (!ready) return <div className="mb-3 h-[132px] rounded-[24px] bg-white/60 md:mb-4" aria-hidden />;

  const tasks = items.filter((x) => x.severity !== 'idea');
  const ideas = items.filter((x) => x.severity === 'idea');
  const urgent = tasks.filter((x) => x.severity === 'urgent').length;
  const worth = tasks.length - urgent;
  const shown = more ? tasks : tasks.slice(0, TOP);
  const calm = tasks.length === 0;
  const onDone = (item) => leave(item, snooze, 'סומן כטופל. נבדוק שוב מחר');
  const onDismiss = (item) => leave(item, dismiss, 'הרעיון הוסר');

  return (
    <section aria-labelledby="brief-title" className="v7-card v5-rise mb-3 overflow-hidden md:mb-4" style={{ '--i': 0 }} data-testid="morning-brief">
      <div className={cn('grid', ideas.length && 'lg:grid-cols-12')}>
        <div className={cn('min-w-0 px-5 pb-3 pt-5 md:px-6 md:pt-6', ideas.length && 'lg:col-span-7')}>
          <p className="text-[13px] font-medium text-ink-400">{formatDayHe(todayISO())}</p>
          <h2 id="brief-title" className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-navy-900 md:text-[24px]">
            {calm ? 'הכל מסודר להיום' : headline(urgent)}
          </h2>
          {calm ? (
            <p className="mt-1.5 flex items-center gap-2 text-[14px] text-ink-600">
              <Check className="h-4 w-4 text-brand-600" strokeWidth={2.5} aria-hidden />
              אין יתרות, פניות או ניקיונות שמחכים לכם.
            </p>
          ) : (
            <>
              {subline(urgent, worth) ? <p className="mt-1 text-[14px] text-ink-600">{subline(urgent, worth)}</p> : null}
              <ol className="mt-2" aria-label="מה לעשות היום">
                {shown.map((item, i) => (
                  <Priority key={item.id} n={i + 1} item={item} onAction={onAction} onDone={onDone} leaving={leaving === item.id} />
                ))}
              </ol>
              {tasks.length > TOP ? (
                <button
                  type="button"
                  onClick={() => setMore((v) => !v)}
                  aria-expanded={more}
                  className="press -ms-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 text-[14px] font-semibold text-brand-600 hover:bg-[#F7F8FB]"
                >
                  {more ? 'פחות' : `עוד ${tasks.length - TOP}`}
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', more && 'rotate-180')} strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </>
          )}
        </div>
        {ideas.length ? (
          <aside aria-labelledby="ideas-title" className="min-w-0 border-t border-[#F0F0F6] bg-[#F7F8FB] px-5 pb-3 pt-4 md:px-6 lg:col-span-5 lg:border-s lg:border-t-0 lg:pt-6">
            <h3 id="ideas-title" className="flex items-center gap-1.5 text-[14px] font-bold text-navy-900">
              <Lightbulb className="h-4 w-4 text-brand-600" strokeWidth={1.75} aria-hidden />
              {ideas.length === 1 ? 'רעיון אחד' : `${ideas.length} רעיונות`}
            </h3>
            <ul>
              {ideas.map((item) => (
                <Idea key={item.id} item={item} onAction={onAction} onDismiss={onDismiss} leaving={leaving === item.id} />
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
