/**
 * Bookings v2: the booking opens here. Phone (<768px): a light bottom sheet with a grab handle.
 * Tablet / desktop: a light side drawer on the inline-end edge (left in RTL), the list stays readable beside it.
 */
import React from 'react';
import * as D from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { BookingDetailBody } from './BookingDetail';

function usePhone(q = '(max-width: 767px)') {
  const get = () => typeof window !== 'undefined' && window.matchMedia(q).matches;
  const [m, setM] = React.useState(get);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

const spring = { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 };

export function BookingDrawer({ booking, open, onOpenChange, model, actions }) {
  const phone = usePhone();
  const reduce = useReducedMotion();
  if (!booking) return null;
  const from = reduce ? { opacity: 0 } : phone ? { y: '100%' } : { x: '-104%' };
  const to = reduce ? { opacity: 1 } : phone ? { y: 0 } : { x: 0 };
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="bk2-ov" />
        <D.Content asChild aria-describedby={undefined} onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById('bk2-drawer')?.focus({ preventScroll: true }); }}>
          <motion.div
            id="bk2-drawer"
            tabIndex={-1}
            dir="rtl"
            className={phone ? 'bk2-drawer bk2-drawer--sheet' : 'bk2-drawer bk2-drawer--side'}
            initial={from}
            animate={to}
            transition={reduce ? { duration: 0.15 } : spring}
          >
            {phone ? <span className="bk2-grab" aria-hidden /> : null}
            <div className="bk2-drawer-top">
              <D.Title className="bk2-drawer-t">פרטי ההזמנה</D.Title>
              <D.Close className="bk2-x press" aria-label="סגירה"><X strokeWidth={2} aria-hidden /></D.Close>
            </div>
            <div className="bk2-drawer-body">
              <BookingDetailBody booking={booking} model={model} actions={actions} TitleTag="p" />
            </div>
          </motion.div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
