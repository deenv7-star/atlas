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
import React, { createContext, lazy, Suspense, useCallback, useContext, useMemo, useRef, useState } from 'react';

// perf/cold-start: the booking form (form machine, schemas, date picker, sheet) is ~150 KB of code the first screen
// never shows. The provider stays in the shell (one tap from anywhere); the sheet's code loads on the first open,
// or when the browser is idle after the shell is up, so the first tap does not wait either.
const loadSheet = () => import('./QuickBookingSheet');
const QuickBookingSheet = lazy(loadSheet);

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
  const optsRef = useRef(null);

  React.useEffect(() => {
    const ric = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 3000));
    const cancel = window.cancelIdleCallback || window.clearTimeout;
    const id = ric(() => { loadSheet().catch(() => {}); }, { timeout: 6000 });
    return () => cancel(id);
  }, []);

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

  return (
    <QuickBookingContext.Provider value={value}>
      {children}
      {state.nonce > 0 ? (
        <Suspense fallback={null}>
          <QuickBookingSheet state={state} close={close} setOpen={setOpen} />
        </Suspense>
      ) : null}
    </QuickBookingContext.Provider>
  );
}
