import React, { useCallback, useEffect, useRef, useState } from 'react';

/** True when the visitor asked the OS for less motion. */
export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduce;
}

/**
 * Auto-advancing index for a screen carousel.
 * Pauses while hovered / focused, while off-screen, when the tab is hidden, and
 * never auto-advances under prefers-reduced-motion. Manual selection always works
 * and restarts the timer (interruptible).
 */
export function useRotator(count, intervalMs = 3800) {
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tick, setTick] = useState(0);
  const reduce = usePrefersReducedMotion();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || hold || !visible || count < 2) return undefined;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => clearInterval(t);
  }, [reduce, hold, visible, count, intervalMs, tick]);

  const select = useCallback((i) => { setIndex(i); setTick((n) => n + 1); }, []);
  const bind = {
    ref,
    onMouseEnter: () => setHold(true),
    onMouseLeave: () => setHold(false),
    onFocus: () => setHold(true),
    onBlur: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHold(false); },
  };
  return { index, select, bind, reduce, paused: hold || reduce };
}

/** Stacked screenshots that crossfade. Only the active one is exposed to assistive tech. */
function ScreenStack({ shots, index, variant, priority }) {
  return (
    <div className="dv-stack">
      {shots.map((s, i) => (
        <img
          key={s.key}
          src={variant === 'mobile' ? s.mobile : s.desktop}
          alt={i === index ? s.alt : ''}
          aria-hidden={i === index ? undefined : true}
          width={variant === 'mobile' ? 780 : 1760}
          height={variant === 'mobile' ? 1688 : 1100}
          className={i === index ? 'is-on' : ''}
          decoding="async"
          loading={priority || i === 0 ? 'eager' : 'lazy'}
          draggable={false}
        />
      ))}
    </div>
  );
}

export function Laptop({ shots, index = 0, priority = false, className = '' }) {
  return (
    <div className={`dv-laptop ${className}`}>
      <div className="dv-lid">
        <span className="dv-cam" aria-hidden="true" />
        <div className="dv-screen dv-screen-desktop">
          <ScreenStack shots={shots} index={index} variant="desktop" priority={priority} />
        </div>
      </div>
      <div className="dv-base" aria-hidden="true"><span /></div>
    </div>
  );
}

export function Phone({ shots, index = 0, priority = false, className = '' }) {
  return (
    <div className={`dv-phone ${className}`}>
      <div className="dv-screen dv-screen-mobile">
        <span className="dv-island" aria-hidden="true" />
        <ScreenStack shots={shots} index={index} variant="mobile" priority={priority} />
      </div>
    </div>
  );
}

/** Single static phone with one image (cleaning crop etc.). */
export function PhoneStatic({ src, alt, className = '' }) {
  return (
    <div className={`dv-phone ${className}`}>
      <div className="dv-screen dv-screen-mobile">
        <span className="dv-island" aria-hidden="true" />
        <div className="dv-stack">
          <img src={src} alt={alt} width={780} height={1688} className="is-on" loading="lazy" decoding="async" draggable={false} />
        </div>
      </div>
    </div>
  );
}

export function Wordmark({ className = '', tone = 'dark' }) {
  return (
    <span className={`wm wm-${tone} ${className}`} aria-hidden="true">
      ATLAS<i className="wm-dot" />
    </span>
  );
}
