import { useEffect, useState } from 'react';

/**
 * iPhone keyboard awareness for bottom sheets. Returns { inset, viewport }:
 *   inset    px the on-screen keyboard covers at the bottom of the layout viewport (0 when closed)
 *   viewport visible height in px (visualViewport), so a sheet never grows taller than what is seen
 * Works in Safari and in the Capacitor WKWebView (visualViewport shrinks when the keyboard opens).
 */
export function useKeyboardInset(active = true) {
  const read = () => {
    if (typeof window === 'undefined' || !window.visualViewport) return { inset: 0, viewport: 0 };
    const vv = window.visualViewport;
    const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    // Ignore tiny deltas (URL bar collapse) so the sheet does not jitter.
    return { inset: inset > 80 ? inset : 0, viewport: Math.round(vv.height) };
  };
  const [state, setState] = useState(read);
  useEffect(() => {
    if (!active || typeof window === 'undefined' || !window.visualViewport) return undefined;
    const vv = window.visualViewport;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setState((prev) => {
        const next = read();
        return prev.inset === next.inset && prev.viewport === next.viewport ? prev : next;
      }));
    };
    on();
    vv.addEventListener('resize', on);
    vv.addEventListener('scroll', on);
    return () => { cancelAnimationFrame(raf); vv.removeEventListener('resize', on); vv.removeEventListener('scroll', on); };
  }, [active]);
  return state;
}

/** Keep the focused field visible above the keyboard inside a scroll container. */
export function useScrollFocusedIntoView(ref, active = true) {
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return undefined;
    let t = 0;
    const onFocus = (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement) || !target.matches('input, textarea, select, [contenteditable="true"]')) return;
      window.clearTimeout(t);
      // after the keyboard animation (~250ms on iOS)
      t = window.setTimeout(() => {
        try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* old webviews */ }
      }, 280);
    };
    el.addEventListener('focusin', onFocus);
    return () => { window.clearTimeout(t); el.removeEventListener('focusin', onFocus); };
  }, [ref, active]);
}
