/**
 * The Face ID symbol drawn in thin lines (the shape iOS uses: four rounded corners, eyes, nose, smile).
 * Motion follows Apple's, kept quiet:
 *   state="idle"      still
 *   state="intro"     the corners draw in once, then the face (offer sheet)
 *   state="scanning"  the corners breathe toward the centre (while iOS reads the face)
 *   state="success"   the face gives way to a check mark
 *   state="failed"    one short side-to-side shake (the iOS "no")
 * Composite-only (opacity / transform / stroke-dashoffset on a tiny SVG). Reduced motion: no motion at all.
 */
import React from 'react';
import './faceIdGlyph.css';

export default function FaceIdGlyph({ size = 64, state = 'idle', weight, className = '', style }) {
  // Rendered stroke in px: Lucide 1.75 at small sizes, a touch more at large ones (Apple's glyph stays light).
  const px = weight ?? Math.max(1.75, size / 30);
  const sw = (px * 48) / size;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-state={state}
      className={`fig ${className}`}
      style={style}
    >
      <g className="fig__corners">
        <path className="fig__c fig__c--tl" pathLength="1" d="M4 15V10a6 6 0 0 1 6-6h5" />
        <path className="fig__c fig__c--tr" pathLength="1" d="M33 4h5a6 6 0 0 1 6 6v5" />
        <path className="fig__c fig__c--br" pathLength="1" d="M44 33v5a6 6 0 0 1-6 6h-5" />
        <path className="fig__c fig__c--bl" pathLength="1" d="M15 44h-5a6 6 0 0 1-6-6v-5" />
      </g>
      <g className="fig__face">
        <path d="M16.5 16.5v4.5" />
        <path d="M31.5 16.5v4.5" />
        <path d="M24.5 17v7.2c0 1.6-.9 2.4-2.5 2.4" />
        <path d="M16.5 31.5c4.4 3.8 10.6 3.8 15 0" />
      </g>
      <path className="fig__check" pathLength="1" d="M15.5 24.5l6 6 11-12" />
    </svg>
  );
}
