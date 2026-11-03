/** A guest's face: their photo when there is one, otherwise quiet navy initials on canvas (no pastel tints),
 *  or a bed line icon for a channel booking without a name. Same in every X direction. */
import React from 'react';
import { BedDouble } from 'lucide-react';
import { GuestAvatar } from '@/components/app/atoms';
import { demoPortrait } from '@/lib/demoPeople';

function initials(name) {
  const p = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).trim();
}

export default function Face({ name = '', size = 40, ring = false, className = '' }) {
  if (name && demoPortrait(name)) return <GuestAvatar name={name} size={size} ring={ring} className={className} />;
  const s = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  return (
    <span aria-hidden className={`x-face${ring ? ' x-face--ring' : ''} ${className}`} style={s}>
      {name ? initials(name) : <BedDouble strokeWidth={1.75} style={{ width: size * 0.46, height: size * 0.46 }} />}
    </span>
  );
}
