import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ErrorFallbackProps = {
  title?: string;
  description?: string;
  className?: string;
  /** Tighter padding for embedding in cards/lists */
  compact?: boolean;
};

export function ErrorFallback({
  title = 'לא ניתן לטעון את הנתונים',
  description = 'בדקו את החיבור לאינטרנט ונסו שוב.',
  className,
  compact = false,
}: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border border-red-100 bg-red-50/80 text-red-950',
        compact ? 'p-3' : 'p-5',
        className,
      )}
    >
      <div className="flex flex-col items-center text-center gap-1.5">
        <AlertCircle className={cn('text-red-500 shrink-0', compact ? 'w-4 h-4' : 'w-5 h-5')} aria-hidden />
        <p className={cn('font-semibold text-red-900', compact ? 'text-xs' : 'text-sm')}>{title}</p>
        <p className={cn('text-red-700/90', compact ? 'text-[11px] leading-snug' : 'text-xs leading-relaxed')}>
          {description}
        </p>
      </div>
    </div>
  );
}
