import React, { useState } from 'react';

export default function Logo({ variant: _variant = 'dark', size = 'default' }) {
  const heights = { small: 44, default: 56, large: 64 };
  const h = heights[size];
  const [src, setSrc] = useState('/atlas-logo-final.png');

  return (
    <div className="flex items-center" style={{ height: h }}>
      <img
        src={src}
        onError={() => setSrc('/favicon.svg')}
        width={546}
        height={183}
        alt="ATLAS"
        style={{ height: h, width: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}