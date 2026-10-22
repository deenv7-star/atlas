/**
 * Real-photo landing (20.10.2026, qa/real-photos-v1/assets.md): responsive real photograph, AVIF first,
 * WebP fallback, width + height set (no CLS), lazy unless it is the hero.
 * Files: public/landing-real/<name>-<width>.<ext>. Real photographs only (Pexels License), never AI.
 */
import React from 'react';

export const R = '/landing-real';
export const DIMS = {
  'hero-p': [[480, 853], [720, 1280], [1080, 1920]],
  hero: [[960, 540], [1440, 810], [1920, 1080]],
  arrive: [[640, 427], [1280, 853], [1920, 1280]],
  breakfast: [[640, 427], [1280, 853], [1920, 1280]],
  couple: [[640, 800], [1080, 1350]],
  hostess: [[640, 800], [1080, 1350]],
  dinner: [[640, 960], [1080, 1620], [1600, 2400]],
};
const set = (name, ext) => DIMS[name].map(([w]) => `${R}/${name}-${w}.${ext} ${w}w`).join(', ');

export function Photo({ name, alt = '', sizes = '100vw', eager = false, className = '' }) {
  const list = DIMS[name];
  const [w, h] = list[list.length - 1];
  return (
    <picture className={`rp-pic ${className}`}>
      <source type="image/avif" srcSet={set(name, 'avif')} sizes={sizes} />
      <img
        src={`${R}/${name}-${list[Math.min(1, list.length - 1)][0]}.webp`}
        srcSet={set(name, 'webp')}
        sizes={sizes}
        alt={alt}
        width={w}
        height={h}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  );
}

/** The hero still: portrait crop on tall phones, the wide crop elsewhere (same media rule as the index.html preload). */
export function HeroStill({ alt }) {
  return (
    <picture className="rp-pic rp-hero-pic">
      <source type="image/avif" media="(max-aspect-ratio: 2/3)" srcSet={set('hero-p', 'avif')} sizes="100vw" />
      <source type="image/webp" media="(max-aspect-ratio: 2/3)" srcSet={set('hero-p', 'webp')} sizes="100vw" />
      <source type="image/avif" srcSet={set('hero', 'avif')} sizes="100vw" />
      <img src={`${R}/hero-1440.webp`} srcSet={set('hero', 'webp')} sizes="100vw" alt={alt} width="1920" height="1080" fetchPriority="high" decoding="async" />
    </picture>
  );
}
