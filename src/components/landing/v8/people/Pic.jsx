/**
 * Responsive people photo for the landing: AVIF first, WebP fallback, two widths, lazy by default.
 * Files live in public/landing-v8/ph as `<name>-<width>.<ext>` (see public/landing-v8/ph/CREDITS.md).
 * Real photographs only (Pexels License), never AI-generated faces.
 */
import React from 'react';
import './people.css';

const PH = '/landing-v8/ph';

export function Pic({ name, widths, ratio, sizes = '(min-width: 900px) 30vw, 60vw', alt = '', lazy = true, className = '' }) {
  const [sm, lg] = widths;
  const set = (ext) => `${PH}/${name}-${sm}.${ext} ${sm}w, ${PH}/${name}-${lg}.${ext} ${lg}w`;
  return (
    <picture className={`pp-pic ${className}`}>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <img
        src={`${PH}/${name}-${lg}.webp`}
        srcSet={set('webp')}
        sizes={sizes}
        alt={alt}
        width={lg}
        height={Math.round(lg / ratio)}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />
    </picture>
  );
}
