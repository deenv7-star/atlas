/** Bottom sheet on mobile, centered modal on desktop. Radix Dialog for focus + a11y. */
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import '@/styles/atlas-brand.css';

export function StaySheet({ open, onOpenChange, title, description, children, footer }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(27,38,86,.42)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          dir="rtl"
          className="ab-root fixed z-50 inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[min(560px,calc(100vw-2rem))] max-h-[92dvh] flex flex-col rounded-t-[20px] sm:rounded-[14px] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-[.97] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200"
          style={{ background: 'var(--surface)', boxShadow: '0 -8px 40px rgba(20,23,26,.18)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="sm:hidden flex justify-center pt-2.5" aria-hidden>
            <span className="w-10 h-1 rounded-full" style={{ background: 'var(--line)' }} />
          </div>
          <div className="flex items-start gap-3 px-5 pt-4 sm:pt-5 pb-3">
            <div className="flex-1 min-w-0">
              <DialogPrimitive.Title className="ab-h3">{title}</DialogPrimitive.Title>
              {description ? <DialogPrimitive.Description className="ab-meta mt-0.5">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="ab-btn ab-btn-ghost ab-btn-sm !px-2" aria-label="סגירה" style={{ color: 'var(--ink-600)' }}>
              <X size={18} strokeWidth={1.75} />
            </DialogPrimitive.Close>
          </div>
          <div className="px-5 pb-4 overflow-y-auto flex-1 min-h-0">{children}</div>
          {footer ? <div className="px-5 py-3 border-t flex flex-col-reverse sm:flex-row sm:justify-start gap-2" style={{ borderColor: 'var(--line)' }}>{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
