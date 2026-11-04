import { Capacitor } from '@capacitor/core';

/** True inside the iOS app (Capacitor WebView). Apple 3.1.1: no buttons or links to buy outside In-App Purchase there. */
export function isNativeApp() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}
