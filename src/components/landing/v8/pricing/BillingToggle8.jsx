/**
 * Monthly / yearly segmented control for the pricing section (19.10.2026).
 * The indigo pill slides between the two options: a white-on-indigo copy of the labels sits on top
 * and is revealed with an animated clip-path, so the label colour flips exactly at the pill's edge
 * (no width/left animation, nothing outside the control re-lays out). Until it has measured the
 * buttons (and with no JS) the control falls back to the static style: the pressed button is indigo.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';

const OPTIONS = [
  { yearly: false, label: 'חודשי' },
  { yearly: true, label: 'שנתי · חוסכים 20%' },
];

export function BillingToggle8({ yearly, onChange }) {
  const seg = useRef(null);
  const [clip, setClip] = useState(null);

  useLayoutEffect(() => {
    const el = seg.current;
    if (!el) return undefined;
    const measure = () => {
      const btn = el.querySelectorAll('button')[yearly ? 1 : 0];
      if (!btn) return;
      const right = el.clientWidth - (btn.offsetLeft + btn.offsetWidth);
      setClip(`inset(4px ${right}px 4px ${btn.offsetLeft}px round 999px)`);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [yearly]);

  return (
    <div ref={seg} className={`v8p-seg${clip ? ' is-live' : ''}`} role="group" aria-label="תקופת חיוב" data-reveal>
      {OPTIONS.map((o) => (
        <button key={o.label} type="button" aria-pressed={yearly === o.yearly} onClick={() => onChange(o.yearly)}>{o.label}</button>
      ))}
      <span className="v8p-seg-hi" aria-hidden="true" style={clip ? { clipPath: clip } : undefined}>
        {OPTIONS.map((o) => <span key={o.label}>{o.label}</span>)}
      </span>
    </div>
  );
}
