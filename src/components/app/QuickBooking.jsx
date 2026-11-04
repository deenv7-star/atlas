/**
 * Quick booking sheet: one tap from anywhere (tab bar, header, calendar cell, "today")
 * opens the booking form as a bottom sheet on phones and a dialog on desktop.
 * Uses the same create mutation as the Bookings page.
 *
 * open(preset, opts): preset = form values to prefill. opts (optional):
 *   leadId     links the new booking to a lead (lead → booking, audit APP-022 / ENG-04)
 *   title      dialog title
 *   onCreated  async (booking) => void, after a successful save
 *   onClose    () => void, when the sheet closes (saved or not)
 */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';
import { useCreateBooking, useProperties } from '@/data/entities';
import { useToast } from '@/components/ui/AtlasToast';
import { bookingFormToPayload } from '@/lib/entityPayloads';

const QuickBookingContext = createContext({ open: () => {} });

/** DB errors → what the host should do, in Hebrew. */
export function bookingSaveErrorHe(err) {
  const code = err?.code || err?.cause?.code || '';
  const msg = String(err?.message || '');
  if (code === '23P01' || /bookings_no_overlap|exclusion constraint/i.test(msg)) {
    return 'התאריכים האלה כבר תפוסים ביחידה הזו. בחרו תאריכים אחרים או יחידה אחרת.';
  }
  if (code === '23505' && /lead/i.test(msg)) return 'כבר יש הזמנה מהפנייה הזו. פתחו אותה מרשימת ההזמנות.';
  if (code === '23514' || /check constraint/i.test(msg)) return 'יש פרט לא תקין בהזמנה. בדקו תאריכים ומחיר ונסו שוב.';
  return 'לא הצלחנו לשמור את ההזמנה. בדקו את החיבור ונסו שוב.';
}

export function useQuickBooking() {
  return useContext(QuickBookingContext);
}

export function QuickBookingProvider({ children }) {
  const [state, setState] = useState({ open: false, preset: null, opts: null, nonce: 0 });
  const interceptRef = useRef(null);
  const { data: properties = [] } = useProperties();
  const createMutation = useCreateBooking();
  const { success } = useToast();
  const optsRef = useRef(null);

  const open = useCallback((preset = null, opts = null) => {
    optsRef.current = opts;
    setState((s) => ({ open: true, preset, opts, nonce: s.nonce + 1 }));
  }, []);
  const notifyClosed = useCallback(() => {
    const o = optsRef.current;
    optsRef.current = null;
    o?.onClose?.();
  }, []);
  const close = useCallback(() => { setState((s) => ({ ...s, open: false })); notifyClosed(); }, [notifyClosed]);
  const setOpen = useCallback((v) => {
    setState((s) => {
      const next = typeof v === 'function' ? v(s.open) : v;
      if (!next) window.setTimeout(notifyClosed, 0);
      return { ...s, open: next };
    });
  }, [notifyClosed]);

  const value = useMemo(() => ({ open }), [open]);
  const preset = state.preset || {};
  const opts = state.opts || {};
  const { property_name: presetPropertyName, ...presetValues } = preset;
  const defaults = useMemo(() => ({ ...emptyBookingFormValues, ...presetValues }), [state.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <QuickBookingContext.Provider value={value}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(o) => {
          const h = interceptRef.current;
          if (h) { h(o); return; }
          setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-right">
            <DialogTitle className="text-[22px] font-bold text-navy-900">{opts.title || 'הזמנה חדשה'}</DialogTitle>
            <DialogDescription className="text-[15px] text-ink-600">
              {opts.leadId
                ? 'מילאנו את מה שהיה בפנייה. בחרו יחידה, בדקו תאריכים ומחיר ושמרו.'
                : `${presetPropertyName ? `${presetPropertyName} · ` : ''}שם, תאריכים וערוץ. אפשר להשלים את השאר אחר כך.`}
            </DialogDescription>
          </DialogHeader>
          <BookingForm
            key={`quick-${state.nonce}`}
            storageSuffix={opts.leadId ? `lead-${opts.leadId}` : preset.check_in_date || preset.property_id ? `quick-${preset.property_id || ''}-${preset.check_in_date || ''}` : 'quick'}
            defaultValues={defaults}
            properties={properties.map((p) => ({ id: p.id, name: p.name }))}
            enableRouteGuard={false}
            onSubmit={async (data) => {
              const payload = bookingFormToPayload(data);
              if (opts.leadId) payload.lead_id = opts.leadId;
              let created;
              try {
                created = await createMutation.mutateAsync(payload);
              } catch (err) {
                // Audit 04.11 #4: the form shows this in its banner; no second copy as a toast.
                throw new Error(bookingSaveErrorHe(err));
              }
              success('ההזמנה נשמרה');
              if (opts.onCreated) await opts.onCreated(created);
            }}
            onCancel={close}
            setDialogOpen={setOpen}
            onRegisterDialogInterceptor={(fn) => { interceptRef.current = fn; }}
            onAfterSubmitSuccess={() => window.setTimeout(close, 700)}
            submitLabel="שמירת הזמנה"
          />
        </DialogContent>
      </Dialog>
    </QuickBookingContext.Provider>
  );
}
