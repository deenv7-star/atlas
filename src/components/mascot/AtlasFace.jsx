/**
 * atlas glow face (abstract direction): navy→indigo glass speech bubble whose tail is the script "a" tail,
 * two light-pill eyes. Vector, ~3KB, crisp at any size. The SVG is injected once; a mood change only flips
 * data-mood so eyes, lids and glow glide (CSS transitions), and reduced motion turns all motion off.
 *
 *   <AtlasFace mood="thinking" size={44} />
 */
import React, { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { faceMarkup, FACE_ALT } from './atlasFace';
import './atlasFace.css';

export function AtlasFace({ mood = 'neutral', size = 44, label, decorative = false, className = '' }) {
  const rid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef(null);
  const html = useMemo(() => ({ __html: faceMarkup(`af${rid}`, mood) }), [rid]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { const svg = ref.current?.firstElementChild; if (svg) svg.dataset.mood = mood; }, [mood]);
  const name = label ?? FACE_ALT[mood] ?? FACE_ALT.neutral;
  return (
    <span
      ref={ref}
      className={`af-wrap ${className}`}
      style={{ width: size, height: size, display: 'inline-block', flexShrink: 0, lineHeight: 0 }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? true : undefined}
      dangerouslySetInnerHTML={html}
    />
  );
}

/** Same mood logic as the assistant thread: thinking → typing → happy for a moment → neutral; error → concerned. */
export function useFaceMood(messages) {
  const last = messages.length ? messages[messages.length - 1] : null;
  const status = last?.role === 'assistant' ? last.status : '';
  const [glow, setGlow] = React.useState(false);
  React.useEffect(() => {
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
