import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

/**
 * In-app replacement for window.confirm() (COPY-042): no "atlas-il.com says" browser chrome,
 * and room to say what the action does. Resolves true on confirm, false on cancel / Esc.
 */
export function askConfirm({ title, description = '', confirmLabel = 'מחיקה', cancelLabel = 'ביטול', destructive = true } = {}) {
  if (typeof document === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const host = document.createElement('div');
    host.setAttribute('dir', 'rtl');
    document.body.appendChild(host);
    const root = createRoot(host);
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
      setTimeout(() => { root.unmount(); host.remove(); }, 220);
    };
    function Dialog() {
      const [open, setOpen] = React.useState(true);
      const close = (v) => { setOpen(false); done(v); };
      return (
        <AlertDialog open={open} onOpenChange={(o) => { if (!o) close(false); }}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {description ? <AlertDialogDescription className="text-[15px] text-ink-600">{description}</AlertDialogDescription> : null}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-[44px]" onClick={() => close(false)}>{cancelLabel}</AlertDialogCancel>
              <AlertDialogAction
                className={`min-h-[44px] ${destructive ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                onClick={() => close(true)}
              >
                {confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    root.render(<Dialog />);
  });
}
