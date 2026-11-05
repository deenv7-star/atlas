import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  AtlasSheet, SheetGroup, SheetField, SheetInput, SheetTextarea, SheetSelect, SheetFooter, SheetSubmit, SheetBanner, DateField,
} from '@/components/ui/sheet/index';
import { maintenanceDefaultChecklist } from '@/components/forms/atlasFormSchemas';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { heError, NET_FALLBACK } from '@/lib/heError';
import { todayIsoIL } from '@/lib/heDate';
import { cn } from '@/lib/utils';

/** 06:00 … 22:00 every 30 minutes, 24-hour, as Israelis write it. */
const TIMES = Array.from({ length: 33 }, (_, i) => {
  const m = 360 + i * 30;
  const v = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return { value: v, label: v };
});

const fresh = () => ({
  date: todayIsoIL(),
  time: '11:00',
  who: '',
  notes: '',
  items: maintenanceDefaultChecklist.map((c) => ({ item: c.item, on: true })),
});

/**
 * Audit 05.11 FORM-1: "משימת ניקיון חדשה" in the AtlasSheet + field kit used by booking / lead / expense.
 * Labelled date (Atlas calendar, not the browser's mm/dd/yyyy) and a 24-hour time, 48px fields, and the
 * checklist as real checkboxes with a name and a 48px row. Checked = the step is part of the task.
 * onSubmit gets the same shape the old form sent: { scheduled_for: 'YYYY-MM-DDTHH:mm', assigned_to_name, notes, checklist }.
 */
export default function CleaningTaskSheet({ open, onOpenChange, onSubmit }) {
  const [v, setV] = useState(fresh);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [tried, setTried] = useState(false);

  useEffect(() => { if (open) { setV(fresh()); setState('idle'); setError(''); setTried(false); } }, [open]);

  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e?.target ? e.target.value : e }));
  const toggle = (i) => setV((p) => ({ ...p, items: p.items.map((x, j) => (j === i ? { ...x, on: !x.on } : x)) }));
  const dateError = tried && !v.date ? 'בחרו תאריך למשימה' : '';

  const submit = async () => {
    setTried(true);
    if (!v.date || state === 'submitting') return;
    setState('submitting');
    setError('');
    try {
      await onSubmit({
        scheduled_for: `${v.date}T${v.time}`,
        assigned_to_name: v.who.trim(),
        notes: v.notes.trim(),
        checklist: v.items.filter((x) => x.on).map((x) => ({ item: x.item, done: false })),
      });
      setState('success');
      atlasToastApi.success('משימת הניקיון נוצרה');
      window.setTimeout(() => onOpenChange(false), 600);
    } catch (err) {
      setState('idle');
      setError(heError(err, NET_FALLBACK));
    }
  };

  const count = v.items.filter((x) => x.on).length;

  return (
    <AtlasSheet open={open} onOpenChange={onOpenChange} title="משימת ניקיון חדשה" subtitle="מתי, מי מטפל ומה לבדוק">
      <SheetBanner>{error}</SheetBanner>
      <SheetGroup>
        <DateField idPrefix="ct-date" label="תאריך" value={v.date} onChange={set('date')} error={dateError} errorId="ct-date-err" />
        <SheetField label="שעה" htmlFor="ct-time">
          <SheetSelect id="ct-time" options={TIMES} value={v.time} onChange={set('time')} />
        </SheetField>
        <SheetField label="מי מטפל" htmlFor="ct-who" optional>
          <SheetInput id="ct-who" value={v.who} onChange={set('who')} placeholder="שם ומספר טלפון" autoComplete="off" />
        </SheetField>
        <SheetField label="הערות" htmlFor="ct-notes" optional>
          <SheetTextarea id="ct-notes" value={v.notes} onChange={set('notes')} rows={3} placeholder="למשל: להחליף מגבות בג׳קוזי" />
        </SheetField>
      </SheetGroup>

      <SheetGroup title={`מה לבדוק · ${count} מתוך ${v.items.length}`}>
        <ul className="-my-1 flex flex-col" aria-label="רשימת בדיקה">
          {v.items.map((x, i) => (
            <li key={x.item}>
              <button
                type="button"
                role="checkbox"
                aria-checked={x.on}
                onClick={() => toggle(i)}
                className="press flex min-h-[48px] w-full items-center gap-3 rounded-[12px] px-1 text-start text-[16px] text-[#1B2656] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E2BF1]"
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors',
                    x.on ? 'border-[#3E2BF1] bg-[#3E2BF1] text-white' : 'border-[#1B2656]/30 bg-white',
                  )}
                >
                  {x.on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">{x.item}</span>
              </button>
            </li>
          ))}
        </ul>
      </SheetGroup>

      <SheetFooter>
        <SheetSubmit state={state} onClick={submit}>יצירת משימה</SheetSubmit>
      </SheetFooter>
    </AtlasSheet>
  );
}
