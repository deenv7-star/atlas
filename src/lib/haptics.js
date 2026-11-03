/**
 * Light haptics. Native (Capacitor iOS/Android): @capacitor/haptics, loaded lazily so the web bundle never
 * pays for it. Web: navigator.vibrate where it exists (Android Chrome), silent no-op elsewhere (iOS Safari).
 */
let nativePromise = null;

function isNative() {
  try { return Boolean(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()); } catch { return false; }
}

function native() {
  if (!isNative()) return null;
  if (!nativePromise) nativePromise = import('@capacitor/haptics').catch(() => null);
  return nativePromise;
}

function vibrate(ms) {
  try { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms); } catch { /* no-op */ }
}

/** A soft "lift" thump: the lens picks up. */
export function hapticLift() {
  const p = native();
  if (p) { p.then((m) => m?.Haptics.impact({ style: m.ImpactStyle.Light })).catch(() => {}); return; }
  vibrate(10);
}

/** Selection tick: the lens crosses onto another tab. */
export function hapticTick() {
  const p = native();
  if (p) { p.then((m) => m?.Haptics.selectionChanged()).catch(() => {}); return; }
  vibrate(5);
}

/** Warm up the native module on first touch so the first tick is not late. */
export function hapticPrime() {
  const p = native();
  if (p) p.then((m) => m?.Haptics.selectionStart()).catch(() => {});
}

export function hapticEnd() {
  const p = native();
  if (p) p.then((m) => m?.Haptics.selectionEnd()).catch(() => {});
}
