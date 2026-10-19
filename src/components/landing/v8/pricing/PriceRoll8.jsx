/**
 * Pricing toggle motion, version A "odometer" (19.10.2026): every digit is a 0-9 strip that rolls
 * vertically to the new value (transform only, staggered), like Stripe / Linear. ₪ and "לחודש" never
 * move. A hidden copy of the price ("ghost") keeps the box width and the text baseline fixed, so
 * nothing shifts. Screen readers get the plain price (sr-only); the rolling digits are aria-hidden.
 * Reduced motion: the strips jump instantly (see pricing-motion.css).
 */
import React from 'react';
import { fmt } from '../../v5/motion';

const STRIP = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PriceNumber({ value }) {
  const text = fmt(value);
  const chars = text.split('');
  return (
    <b className="num v8p-num" dir="ltr">
      <span className="sr-only">₪{text}</span>
      <span className="v8p-ghost" aria-hidden="true">₪{text}</span>
      <span className="v8p-roll" aria-hidden="true">
        <span className="v8p-cur">₪</span>
        {chars.map((c, i) => {
          const fromRight = chars.length - i; // stable key per position, so a column keeps its element and transitions
          if (!/\d/.test(c)) return <span key={`s${fromRight}`} className="v8p-sep">{c}</span>;
          return (
            <span key={`d${fromRight}`} className="v8p-col" style={{ '--d': c, '--i': i }}>
              <span className="v8p-strip">{STRIP.map((d) => <span key={d}>{d}</span>)}</span>
            </span>
          );
        })}
      </span>
    </b>
  );
}
