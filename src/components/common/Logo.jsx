import React from 'react';

export default function Logo({ variant = 'dark', size = 'default' }) {
  const heights = { small: 44, default: 56, large: 64 };
  const h = heights[size];

  return (
    <div className="flex items-center" style={{ height: h }}>
      <img
        src="/atlas-logo-final.png"
        width={546}
        height={183}
        alt="ATLAS"
        style={{ height: h, width: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}