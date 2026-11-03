/**
 * atlas glow face: navy→indigo glass speech bubble whose tail is the script "a" tail, two light-pill eyes.
 * Vector, ~3KB, crisp at any size. The SVG is injected once; a mood change only flips data-mood so eyes, lids
 * and glow glide (CSS transitions). Reduced motion turns all motion off.
 *
 *   <AtlasFace mood="thinking" size={44} />      a fixed expression
 *   <AtlasFace live size={38} />                 the living character: blinks, breathes, and reacts to the
 *                                                app (useMascotMood.js); `mood` is then its resting mood
 */
import React, { useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react';
import { faceMarkup, FACE_ALT } from './atlasFace.js';
import { useMascotMood, emitMascot } from './useMascotMood';
import { eyeOffset } from './mascotMood';
import './atlasFace.css';

export function AtlasFace({ mood = 'neutral', size = 44, label, decorative = false, className = '', live = false }) {
  const rid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef(null);
  const liveMood = useMascotMood(mood, live);
  const shown = live ? liveMood.mood : mood;
  const html = useMemo(() => ({ __html: faceMarkup(`af${rid}`, mood, { still: live && liveMood.still }) }), [rid]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => { const svg = ref.current?.firstElementChild; if (svg) svg.dataset.mood = shown; }, [shown]);

  // Each face blinks on its own rhythm, so two faces never blink in sync.
  const blink = useMemo(() => ({ '--af-blink': `${(4.4 + Math.random() * 2.4).toFixed(2)}s`, '--af-blink-delay': `-${(Math.random() * 4).toFixed(2)}s` }), []);

  // Gaze: turn the eyes toward the point the app asked for (the input, a new toast). Event-driven, no loop.
  const gaze = live ? liveMood.gaze : null;
  useLayoutEffect(() => {
    const el = ref.current; if (!el || !live) return;
    const o = gaze ? eyeOffset(el.getBoundingClientRect(), gaze) : { x: 0, y: 0 };
    el.style.setProperty('--af-gx', `${o.x}px`);
    el.style.setProperty('--af-gy', `${o.y}px`);
  }, [gaze, live]);

  // Success: one small bounce (transform only).
  const bounce = live ? liveMood.bounce : 0;
  const firstBounce = useRef(bounce);
  useEffect(() => {
    if (!live || bounce === firstBounce.current) return;
    const svg = ref.current?.firstElementChild;
    svg?.animate?.([
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-14%) scale(1.04, 0.97)', offset: 0.35 },
      { transform: 'translateY(0) scale(0.98, 1.03)', offset: 0.7 },
      { transform: 'translateY(0) scale(1)' },
    ], { duration: 560, easing: 'cubic-bezier(.23,1,.32,1)' });
  }, [bounce, live]);

  const name = label ?? FACE_ALT[shown] ?? FACE_ALT.neutral;
  return (
    <span
      ref={ref}
      className={`af-wrap${live && !liveMood.still ? ' is-live' : ''} ${className}`}
      style={{ width: size, height: size, display: 'inline-block', flexShrink: 0, lineHeight: 0, ...(live ? blink : null) }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? true : undefined}
      dangerouslySetInnerHTML={html}
    />
  );
}

/**
 * The assistant thread drives the shared mood: waiting → thinking, streaming → typing, done → happy, error → concerned.
 * Returns the thread's own mood too (for faces that are not live).
 */
export function useFaceMood(messages) {
  const last = messages.length ? messages[messages.length - 1] : null;
  const status = last?.role === 'assistant' ? last.status : '';
  const [glow, setGlow] = React.useState(false);
  React.useEffect(() => () => emitMascot('idle-reset'), []); // leaving the thread never leaves the face "thinking"
  React.useEffect(() => {
    if (status === 'pending') emitMascot('waiting');
    else if (status === 'streaming') emitMascot('responding');
    else if (status === 'done') emitMascot('answer');
    else if (status === 'error') emitMascot('error');
    else if (status === 'stopped') emitMascot('idle-reset');
    if (status !== 'done') return undefined;
    setGlow(true);
    const t = setTimeout(() => setGlow(false), 2400);
    return () => clearTimeout(t);
  }, [status, last?.id]);
  if (status === 'pending') return 'thinking';
  if (status === 'streaming') return 'typing';
  if (status === 'error') return 'concerned';
  if (status === 'done' && glow) return 'happy';
  return 'neutral';
}

