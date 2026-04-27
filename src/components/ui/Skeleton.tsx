import * as React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
};

function toCssSize(value: number | string | undefined, fallback?: string): string | undefined {
  if (value === undefined) return fallback;
  if (typeof value === 'number') return `${value}px`;
  return value;
}

const shimmerBase: React.CSSProperties = {
  backgroundColor: 'var(--color-background-secondary)',
  backgroundImage:
    'linear-gradient(90deg, transparent, var(--atlas-skeleton-shimmer-highlight), transparent)',
  backgroundSize: '200px 100%',
  backgroundRepeat: 'no-repeat',
  animation: 'atlas-skeleton-shimmer 1.5s ease-in-out infinite',
};

export function Skeleton({
  width,
  height,
  borderRadius,
  className,
  style,
  'aria-hidden': ariaHidden = true,
  ...rest
}: SkeletonProps & Omit<React.HTMLAttributes<HTMLDivElement>, keyof SkeletonProps>) {
  const merged: React.CSSProperties = {
    ...shimmerBase,
    width: toCssSize(width),
    height: toCssSize(height, '1rem'),
    borderRadius: toCssSize(borderRadius, '0.375rem'),
    ...style,
  };

  return (
    <div
      className={cn('atlas-skeleton block overflow-hidden', className)}
      style={merged}
      aria-hidden={ariaHidden}
      {...rest}
    />
  );
}
