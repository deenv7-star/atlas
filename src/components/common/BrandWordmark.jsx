import React from 'react';

/** Approved ATLAS artwork: tightly cropped vector, transparent, no demo dot. */
export default function BrandWordmark({ size = 22, inverted = false, className = '' }) {
  return <img src={inverted ? '/atlas-logo-white.svg' : '/atlas-logo.svg'} alt="ATLAS"
    className={className} width={Math.round(size * 5.35625)} height={size} draggable={false}
    style={{ display: 'inline-block', height: size, width: size * 5.35625, maxWidth: '100%', objectFit: 'contain', flexShrink: 0, verticalAlign: 'middle' }} />;
}
