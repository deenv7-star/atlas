/**
 * Pricing price number (H8 fix, audit 28.11.2026).
 *
 * The old "odometer" rendered every digit as a 0-9 strip whose visible glyph came
 * from CSS `content: attr(data-c)` pseudo-elements, so the amount existed nowhere
 * as real text: text extraction (crawlers, reader mode, copy) saw only "לחודש /
 * בחיוב חודשי" and no amount. The price is now plain, visible text
 * (₪399 / ₪699 / ₪999, from src/config/pricing.js via the `value` prop), so it is
 * prominent, crawlable and copyable. The monthly/yearly toggle still swaps the
 * value; only the rolling animation is gone.
 */
import React from 'react';
import { fmt } from '../../v5/motion';

export function PriceNumber({ value }) {
  const text = fmt(value);
  return (
    <b className="num v8p-num" dir="ltr">
      ₪{text}
    </b>
  );
}
