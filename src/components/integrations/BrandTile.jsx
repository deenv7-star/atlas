/**
 * The mark of a service: its official Simple Icons glyph in its own colour on a white tile, or, when there is no
 * official mark in the set, a clean text tile with the name. Never a redrawn or invented logo.
 */
import React from 'react';
import { BRAND } from './brandMarks';

export default function BrandTile({ item, size = 44, className = '' }) {
  const b = item.brand ? BRAND[item.brand] : null;
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.28) };
  if (b) {
    return (
      <span className={`ih-mark ${className}`} style={style} aria-hidden>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.56)} height={Math.round(size * 0.56)}><path d={b.d} fill={b.color} /></svg>
      </span>
    );
  }
  const text = item.mono || item.name;
  const long = text.length > 4;
  return (
    <span className={`ih-mark is-text ${className}`} style={{ ...style, fontSize: Math.round(size * (long ? 0.2 : 0.3)) }} aria-hidden dir="auto">
      {text}
    </span>
  );
}
