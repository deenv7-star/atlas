/**
 * Quick booking sheet: one tap from anywhere (tab bar, header, calendar cell, "today")
 * opens the booking form as a bottom sheet on phones and a dialog on desktop.
 * Uses the same create mutation as the Bookings page.
 */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';
import { useCreateBooking, useProperties } from '@/data/entities';
import { useToast } from '@/components/ui/AtlasToast';
import { bookingFormToPayload } from '@/lib/entityPayloads';

const QuickBookingContext = createContext({ open: () => {} });

export function useQuickBooking() {
  return useContext(QuickBookingContext);
}

export function QuickBookingProvider({ children }) {
  const [state, setState] = useState({ open: false, preset: null, nonce: 0 });
  const interceptRef = useRef(null);
  const { data: properties = [] } = useProperties();
  const createMutation = useCreateBooking();
  const { success } = useToast();

  const open = useCallback((preset = null) => {
    setState((s) => ({ open: true, preset, nonce: s.nonce + 1 }));
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const setOpen = useCallback((v) => setState((s) => ({ ...s, open: typeof v === 'function' ? v(s.open) : v })), []);

  const value = useMemo(() => ({ open }), [open]);
  const preset = state.preset || {};
  const defaults = { ...emptyBookingFormValues, ...preset };

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
            <DialogTitle className="text-[22px] font-bold text-navy-900">הזמנה חדשה</DialogTitle>
            <DialogDescription className="text-[15px] text-ink-600">
              {preset.property_name ? `${preset.property_name} · ` : ''}שם, תאריכים וערוץ. אפשר להשלים את השאר אחר כך.
            </DialogDescription>
          </DialogHeader>
          <BookingForm
            key={`quick-${state.nonce}`}
            storageSuffix={preset.check_in_date || preset.property_id ? `quick-${preset.property_id || ''}-${preset.check_in_date || ''}` : 'quick'}
            defaultValues={defaults}
            properties={properties.map((p) => ({ id: p.id, name: p.name }))}
            enableRouteGuard={false}
            onSubmit={async (data) => {
              await createMutation.mutateAsync(bookingFormToPayload(data));
              success('ההזמנה נשמרה');
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
