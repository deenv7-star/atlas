import React from 'react';

export default function Logo({ variant = 'dark', size = 'default' }) {
  const heights = { small: 36, default: 48, large: 56 };
  const h = heights[size];

  return (
    <div className="flex items-center" style={{ height: h }}>
      <img
        src="/atlas-logo-final.png"
        alt="ATLAS"
        style={{ height: h, width: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}