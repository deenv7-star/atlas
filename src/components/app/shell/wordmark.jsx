import React from 'react';
import BrandWordmark from '@/components/common/BrandWordmark';
import { cn } from '@/lib/utils';

/** The atlas wordmark as the app shows it. Its own module so the sign-in screens can use it without
 *  loading the app shell (shared.jsx pulls navigation, dialogs, motion and React Query). */
export function Wordmark({ className, inverted = false, size = 22 }) {
  return <span className={cn('inline-flex items-center leading-none', className)} style={{ color: inverted ? '#fff' : '#1B2656' }} dir="ltr"><BrandWordmark size={size} inverted={inverted} /></span>;
}
