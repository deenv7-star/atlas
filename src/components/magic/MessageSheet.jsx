/**
 * Tap a message → this sheet: the real WhatsApp text the guest gets, when it goes out (one row of
 * time chips), and one button. No triggers, no channels, no offsets.
 */
import React, { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { WaBubble } from './WaBubble';
import { hhmm } from './useGuestMessages';
import { cn } from '@/lib/utils';

const TIMES = ['08:00', '10:00', '12:00', '16:00', '18:00'];

export function MessageSheet({ step, open, onOpenChange, gm, onEnabled }) {
  const on = step ? gm.isOn(step) : false;
  const [time, setTime] = useState(step ? hhmm(gm.timeOf(step)) : '');
  useEffect(() => { if (step) setTime(hhmm(gm.timeOf(step))); }, [step?.key, open]);
  if (!step) return null;
  const times = step.defaultTime ? [...new Set([...TIMES, time].filter(Boolean))].sort() : [];
  const guest = gm.ctx.booking?.guest_name || 'נועה לוי';

  const primary = async () => {
    const ok = await gm.save(step, { on: true, sendTime: time, quiet: !on });
    if (ok) { onOpenChange(false); if (!on) onEnabled?.(step); }
  };
  const stop = async () => { const ok = await gm.save(step, { on: false, sendTime: time }); if (ok) onOpenChange(false); };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92dvh] w-full max-w-[520px] rounded-t-[32px] border-0 bg-[#F7F8FB]" dir="rtl">
        <div className="overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
          <DrawerTitle className="text-[22px] font-bold leading-tight text-navy-900">{step.sentence}</DrawerTitle>
          <DrawerDescription className="mt-1 text-[15px] text-ink-600">
            {step.whenPlain}{step.defaultTime && time ? `, ב-${time}` : ''}. כך האורח יקבל את זה:
          </DrawerDescription>
          <WaBubble className="mt-4" text={gm.textFor(step)} guest={guest} time={time || 'עכשיו'} sample={gm.ctx.sample} />
          {times.length ? (
            <div className="mt-5">
              <p className="text-[15px] font-semibold text-navy-900">באיזו שעה לשלוח?</p>
              <div className="mg-deck mt-2" role="radiogroup" aria-label="שעת שליחה">
                {times.map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={t === time} onClick={() => setTime(t)}
                    className={cn('mg-chip tabular', t === time ? 'mg-chip-on' : 'mg-chip-light')} dir="ltr">{t}</button>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mt-4 text-[14px] leading-snug text-ink-600">
            את השם, התאריכים והקישורים atlas ממלא לבד לכל אורח. בשבת ובחג ההודעה מחכה למוצאי שבת.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={primary} disabled={gm.busy} className="mg-cta mg-cta-indigo w-full disabled:opacity-60">
              {on ? 'שמירה' : 'הפעילו את ההודעה'}
            </button>
            {on ? (
              <button type="button" onClick={stop} disabled={gm.busy} className="min-h-[48px] w-full rounded-full text-[15px] font-semibold text-ink-600">
                להפסיק לשלוח את ההודעה
              </button>
            ) : null}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
