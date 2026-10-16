import React from 'react';
import { Wordmark } from '@/components/app/shell/shared';

/** Brand wordmark (docs/brand.md): "ATLAS" in Heebo 800 + indigo mark. */
export default function Logo({ variant = 'dark', size = 'default' }) {
  const px = { small: 22, default: 28, large: 34 }[size] || 28;
  // min 44px tall so a logo used as a home link is a comfortable tap target
  return <span className="inline-flex min-h-[44px] items-center"><Wordmark size={px} inverted={variant === 'light'} /></span>;
}
