import React from 'react';
import { toast } from 'sonner';
import { completeUndoSlot, enqueueUndoJob } from './undoQueue';
import { usePersistentToastStore } from './persistentToastStore';

const DURATION_MS = {
  success: 3000,
  error: 6000,
  info: 4000,
  undo: 5000,
  realtime: 4500,
} as const;

const baseToast =
  'rounded-xl border shadow-md backdrop-blur-sm !pointer-events-auto max-w-[min(100vw-1.5rem,24rem)]';

export type PersistentToastAction = {
  label: string;
  onClick: () => void;
};

/**
 * Single module that imports `sonner`. App code must use `useToast()` or this API from data layers that cannot call hooks.
 */
export const atlasToastApi = {
  success(message: string): void {
    toast.success(message, {
      duration: DURATION_MS.success,
      className: `${baseToast} border-emerald-200 bg-emerald-50 text-emerald-950`,
    });
  },

  error(message: string, detail?: string): void {
    if (detail) {
      toast.custom(
        () => (
          <div
            dir="rtl"
            className={`flex w-[min(100vw-1.5rem,24rem)] flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-right text-red-950 shadow-md ${baseToast}`}
          >
            <p className="text-sm font-semibold leading-snug">{message}</p>
            <details className="text-xs text-red-900">
              <summary className="cursor-pointer select-none font-medium text-red-800">פרטים</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-sans">
                {detail}
              </pre>
            </details>
          </div>
        ),
        { duration: DURATION_MS.error },
      );
      return;
    }
    toast.error(message, {
      duration: DURATION_MS.error,
      className: `${baseToast} border-red-200 bg-red-50 text-red-950`,
    });
  },

  info(message: string): void {
    toast.info(message, {
      duration: DURATION_MS.info,
      className: `${baseToast} border-slate-200 bg-slate-50 text-slate-900`,
    });
  },

  realtime(message: string): void {
    toast(message, {
      duration: DURATION_MS.realtime,
      className: `${baseToast} border-blue-300 bg-blue-50 text-blue-950`,
    });
  },

  /**
   * Amber undo bar with "בטל". Queued so only one undo toast is visible at a time.
   * `onExpire` runs when the countdown ends or the toast is dismissed (swipe / close), unless the user pressed בטל.
   */
  undo(message: string, onUndo: () => void, onExpire?: () => void | Promise<void>): void {
    enqueueUndoJob(() => {
      let settled = false;

      const runExpire = async (): Promise<void> => {
        if (settled) return;
        settled = true;
        try {
          await onExpire?.();
        } finally {
          completeUndoSlot();
        }
      };

      const id = toast(message, {
        duration: DURATION_MS.undo,
        className: `${baseToast} border-amber-300 bg-amber-50 text-amber-950`,
        cancel: {
          label: 'בטל',
          onClick: () => {
            if (settled) return;
            settled = true;
            onUndo();
            toast.dismiss(id);
            completeUndoSlot();
          },
        },
        onAutoClose: () => {
          void runExpire();
        },
        onDismiss: () => {
          void runExpire();
        },
      });
    });
  },

  persistent(id: string, message: string, action?: PersistentToastAction): void {
    usePersistentToastStore.getState().show({
      id,
      message,
      actionLabel: action?.label,
      onAction: action?.onClick,
    });
  },

  dismissPersistent(id: string): void {
    usePersistentToastStore.getState().dismiss(id);
  },

  /** Clears all Sonner toasts (e.g. after sign-out). Does not touch persistent store. */
  dismissAllSonner(): void {
    toast.dismiss();
  },
};
