import React from 'react';

export default function Logo({ variant = 'dark', size = 'default' }) {
  const heights = { small: 44, default: 56, large: 64 };
  const h = heights[size];

  return (
    <div className="flex items-center" style={{ height: h }}>
      <img
        src="/atlas-logo-clean.png"
        srcSet="/atlas-logo-clean.png 1024w"
        sizes={`${Math.ceil(h * 3.2)}px`}
        width={1024}
        height={1024}
        alt="ATLAS"
        decoding="async"
        style={{ height: h, width: 'auto', maxHeight: h, objectFit: 'contain' }}
      />
    </div>
  );
}