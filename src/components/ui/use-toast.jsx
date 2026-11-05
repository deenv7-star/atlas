/**
 * Legacy shadcn-style `toast({ title, description, variant })` API, kept for the pages that still call it
 * (Payments, Messages, Reviews, Settings).
 *
 * Deen 05.11.2026: "התשלום נשמר" toasts stayed on screen forever, the X did nothing, and a second save stacked a
 * second identical toast. Root cause: this file used to drive its own toast list rendered by a second <Toaster/>
 * built from plain <div>s (not Radix): no auto-dismiss timer (TOAST_REMOVE_DELAY 1,000,000 ms, `open` and
 * `onOpenChange` were spread onto a div and never fired), and the close button had no onClick at all.
 *
 * Now there is ONE toaster in the app (AtlasToaster / sonner). This adapter forwards to atlasToastApi, which gives
 * every toast a timer, a working 44px close button, and dedupes identical messages by id.
 */
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';

const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

function toast({ title, description, variant } = {}) {
  const message = text(title) || text(description);
  const desc = title && description ? text(description) : undefined;
  if (!message) return { id: null, dismiss: () => {}, update: () => {} };
  const id = variant === 'destructive'
    ? atlasToastApi.error(message, undefined, { description: desc })
    : atlasToastApi.success(message, { description: desc });
  return { id, dismiss: () => atlasToastApi.dismiss(id), update: () => {} };
}

function useToast() {
  return { toasts: [], toast, dismiss: (id) => atlasToastApi.dismiss(id) };
}

export { useToast, toast };
