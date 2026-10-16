import React from 'react';
import { Wordmark } from '@/components/app/shell/shared';

/** Brand wordmark (docs/brand.md): "ATLAS" in Heebo 800 + indigo mark. */
export default function Logo({ variant = 'dark', size = 'default' }) {
  const px = { small: 22, default: 28, large: 34 }[size] || 28;
  return <Wordmark size={px} inverted={variant === 'light'} />;
}
