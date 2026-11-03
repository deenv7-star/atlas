/**
 * The atlas character: a fluffy indigo host with round gold glasses (brand/mascot-v2).
 * Transparent cut-outs in /public/mascot, AVIF first, WebP fallback, 256/512 px.
 * Always sized up front (width/height + inline box) so nothing shifts while it loads; lazy by default.
 *
 *   <Mascot pose="sleepy" size={96} />                    full figure (empty states)
 *   <Mascot pose="thinking" crop="bust" size={28} alt="" />  avatar crop in a white circle
 *   <MascotMood mood="typing" size={44} />                 assistant avatar that cross-fades between states
 */
import React from 'react';
import './mascot.css';

export const MASCOT_ALT = {
  neutral: 'atlas, העוזר האישי שלכם',
  happy: 'atlas מחייך',
  thinking: 'atlas חושב',
  typing: 'atlas מקליד תשובה',
  sleepy: 'atlas נח, אין כאן עדיין כלום',
  waving: 'atlas מנופף לשלום',
  celebrating: 'atlas שמח',
  thumbsup: 'atlas מאשר שהכל בוצע',
  concerned: 'atlas מתנצל',
  surprised: 'atlas מופתע',
};

function sources(pose, crop) {
  const base = `/mascot/atlas-mascot-${pose}${crop === 'bust' ? '-bust' : ''}`;
  return {
    avif: `${base}-256.avif 256w, ${base}-512.avif 512w`,
    webp: `${base}-256.webp 256w, ${base}-512.webp 512w`,
    src: `${base}-256.webp`,
  };
}

export function Mascot({ pose = 'neutral', crop = 'full', size = 96, alt, eager = false, className = '', style }) {
  const s = sources(pose, crop);
  const label = alt ?? MASCOT_ALT[pose] ?? '';
  return (
    <span className={`am${crop === 'bust' ? ' am--bust' : ''} ${className}`} style={{ width: size, height: size, ...style }}>
      <picture>
        <source type="image/avif" srcSet={s.avif} sizes={`${size}px`} />
        <source type="image/webp" srcSet={s.webp} sizes={`${size}px`} />
        <img
          src={s.src}
          width={size}
          height={size}
          alt={label}
          aria-hidden={label ? undefined : true}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
        />
      </picture>
    </span>
  );
}

/** Assistant avatar. All states are stacked and cross-faded, so a state change never flashes an empty circle. */
export const MOODS = ['neutral', 'thinking', 'typing', 'happy', 'concerned'];
export function MascotMood({ mood = 'neutral', size = 44, className = '' }) {
  const active = MOODS.includes(mood) ? mood : 'neutral';
  return (
    <span className={`am-mood ${className}`} style={{ width: size, height: size }} data-mood={active} role="img" aria-label={MASCOT_ALT[active]}>
      {MOODS.map((m) => (
        <Mascot key={m} pose={m} crop="bust" size={size} alt="" className={m === active ? 'is-on' : ''} />
      ))}
    </span>
  );
}

/**
 * mood for the assistant from the last message: thinking → typing → happy for a moment → neutral; error → concerned.
 */
export function useAssistantMood(messages) {
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
