/**
 * Version A, "Today feed": a calm list above the bento, "מה דורש תשומת לב".
 * One row per insight: severity chip, title, one-line why, one action, and a ⋯ menu
 * (להזכיר מחר / לא רלוונטי) kept on this device. Four rows show; the rest fold under "עוד".
 * Everything shown comes from buildInsights (real account rows only).
 */
import React, { useState } from 'react';
import { Check, ChevronDown, MoreHorizontal, BellOff, X } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { cn } from '@/lib/utils';
import InsightActionButton from './InsightActionButton';

const CHIP = {
  urgent: 'bg-brand-600 text-white',
  worth: 'bg-[#ECEAFE] text-brand-600',
  idea: 'bg-[#F7F8FB] text-navy-900 ring-1 ring-inset ring-[#E4E6F0]',
};
export const SHOW = 4;

export function SeverityChip({ item, className }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[12px] font-bold', CHIP[item.severity], className)}>
      {item.label}
    </span>
  );
}

function RowMenu({ item, onSnooze, onDismiss }) {
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger
        aria-label={`אפשרויות: ${item.title}`}
        className="press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-[#F1F1F8] hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[190px] rounded-[16px] p-1.5">
        <DropdownMenuItem onSelect={() => onSnooze(item)} className="min-h-[44px] gap-2 rounded-[12px] px-3 text-[15px]">
          <BellOff className="h-4 w-4 text-ink-400" strokeWidth={1.75} aria-hidden />
          להזכיר מחר
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDismiss(item)} className="min-h-[44px] gap-2 rounded-[12px] px-3 text-[15px]">
          <X className="h-4 w-4 text-ink-400" strokeWidth={1.75} aria-hidden />
          לא רלוונטי
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Row({ item, onAction, onSnooze, onDismiss, leaving }) {
  return (
    <li className={cn('ins-row', leaving && 'is-leaving')} data-insight={item.rule} data-severity={item.severity}>
      <div className="min-h-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 md:flex-nowrap md:px-4">
          <div className="min-w-0 flex-1 basis-[220px]">
            <p className="flex min-w-0 items-center gap-2">
              <SeverityChip item={item} />
              <span className="min-w-0 truncate text-[15px] font-semibold text-navy-900">{item.title}</span>
            </p>
            <p className="mt-1 text-[13px] leading-[1.5] text-ink-600">{item.why}</p>
          </div>
          <div className="ms-auto flex items-center gap-1">
            <InsightActionButton item={item} onAction={onAction} tone={item.severity === 'urgent' ? 'solid' : 'soft'} />
            <RowMenu item={item} onSnooze={onSnooze} onDismiss={onDismiss} />
          </div>
        </div>
      </div>
    </li>
  );
}

export default function InsightsFeed({ insights, onAction }) {
  const { items, ready, snooze, dismiss, restore } = insights;
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(null);
  if (!ready) return <div className="mb-3 h-[76px] rounded-[24px] bg-white/60 md:mb-4" aria-hidden />;

  const hide = (item, fn, msg) => {
    setLeaving(item.id);
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      fn(item.id);
      setLeaving(null);
      atlasToastApi.undo(msg, () => restore(item.id));
    }, reduce ? 0 : 200);
  };
  const onSnooze = (item) => hide(item, snooze, 'נזכיר מחר');
  const onDismiss = (item) => hide(item, dismiss, 'הוסר מהרשימה');

  const urgent = items.filter((x) => x.severity === 'urgent').length;
  const shown = open ? items : items.slice(0, SHOW);
  const rest = items.length - shown.length;

  return (
    <section aria-labelledby="ins-title" className="v7-card v5-rise mb-3 overflow-hidden md:mb-4" style={{ '--i': 0 }} data-testid="insights-feed">
      <div className="flex min-h-[60px] items-center justify-between gap-3 px-5 pt-3 md:px-6">
        <h2 id="ins-title" className="text-[17px] font-bold text-navy-900">מה דורש תשומת לב</h2>
        {items.length ? (
          <p className="shrink-0 text-[13px] text-ink-400">
            {urgent ? <><span className="tabular font-semibold text-navy-900">{urgent}</span> דחופים · </> : null}
            <span className="tabular font-semibold text-navy-900">{items.length}</span> בסך הכל
          </p>
        ) : null}
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-5 pb-5 pt-1 md:px-6">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ECEAFE] text-brand-600">
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
          <p className="text-[14px] text-ink-600">אין כרגע משהו שמחכה לכם. נעדכן כאן כשיהיה.</p>
        </div>
      ) : (
        <>
          <ul className="px-2 pb-2 md:px-3">
            {shown.map((item) => (
              <Row key={item.id} item={item} onAction={onAction} onSnooze={onSnooze} onDismiss={onDismiss} leaving={leaving === item.id} />
            ))}
          </ul>
          {items.length > SHOW ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="press flex min-h-[48px] w-full items-center justify-center gap-1.5 border-t border-[#F0F0F6] text-[14px] font-semibold text-brand-600 hover:bg-[#F7F8FB]"
            >
              {open ? 'פחות' : `עוד ${rest}`}
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
