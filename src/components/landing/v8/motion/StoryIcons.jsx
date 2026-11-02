/**
 * atlas story icons for the feature tile labels (landing motion M2, 2.11.2026). A one-for-one swap of the
 * four lucide icons that were there (calendar, message, wallet, sun): same place, same size, no new content.
 * atlas icon style: 48 viewBox, 2px round line in the label colour, one accent fill, a soft ground ellipse.
 * The line draws itself once when the tile comes in, then the accent fades in (landing-motion-m2.css).
 * Our own drawings; nothing copied from a reference set.
 */
import React from 'react';

const Svg = ({ size = 22, children }) => (
  <svg className="mo-ic" width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
    <ellipse className="mo-gnd" cx="24" cy="45" rx="12" ry="1.6" fill="currentColor" stroke="none" />
  </svg>
);
const ns = { vectorEffect: 'non-scaling-stroke' };

export const IcCalendar = (p) => (
  <Svg {...p}>
    <rect className="mo-acc" x="26" y="25" width="8" height="7" rx="2" fill="var(--mo-acc)" stroke="none" />
    <rect x="8" y="10" width="32" height="30" rx="6" style={ns} />
    <path d="M8 19h32M17 6v8M31 6v8" style={ns} />
  </Svg>
);

export const IcBubble = (p) => (
  <Svg {...p}>
    <g className="mo-acc" fill="var(--mo-acc)" stroke="none"><circle cx="17" cy="22.5" r="2.6" /><circle cx="24" cy="22.5" r="2.6" /><circle cx="31" cy="22.5" r="2.6" /></g>
    <path d="M24 8c-8.8 0-16 6.1-16 14.2 0 3.8 1.6 7.2 4.4 9.8L11 39l7.4-3c1.8.6 3.7.9 5.6.9 8.8 0 16-6.3 16-14.6S32.8 8 24 8z" style={ns} />
  </Svg>
);

export const IcShekel = (p) => (
  <Svg {...p}>
    <circle className="mo-acc" cx="24" cy="23" r="19" fill="var(--mo-acc)" stroke="none" fillOpacity="0.16" />
    <path d="M12 36V11h11a7 7 0 0 1 7 7v9M36 10v25H25a7 7 0 0 1-7-7v-9" style={ns} />
  </Svg>
);

export const IcToday = (p) => (
  <Svg {...p}>
    <circle className="mo-acc" cx="24" cy="23" r="6" fill="var(--mo-acc)" stroke="none" />
    <circle cx="24" cy="23" r="9" style={ns} />
    <path d="M24 5v4M24 37v4M6 23h4M38 23h4M11.3 10.3l2.8 2.8M33.9 32.9l2.8 2.8M36.7 10.3l-2.8 2.8M14.1 32.9l-2.8 2.8" style={ns} />
  </Svg>
);
