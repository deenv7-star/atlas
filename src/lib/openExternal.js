import { isNativeApp } from '@/lib/nativePlatform';

/**
 * Open an external link (WhatsApp wa.me, tel:, a guest page) from a tap handler.
 * Audit 04.11 M10: the old fallback looked for "Capacitor" in the user agent, which the iOS WebView never
 * sets, so a blocked window.open did nothing. Now:
 *   - iOS app (Capacitor.isNativePlatform): a top-level navigation. Capacitor cancels it in the WebView and
 *     hands the URL to iOS, which opens WhatsApp (universal link) or Safari. One path, no double open.
 *   - web: a new tab, opened synchronously inside the tap so it is not treated as a popup.
 * Verify on a device: booking → שליחה בוואטסאפ, lead → מענה בוואטסאפ, balance → תזכורת.
 */
export function openExternal(url) {
  if (!url) return;
  if (isNativeApp()) {
    window.location.href = url;
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
