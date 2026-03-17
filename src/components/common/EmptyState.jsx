import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

/**
 * Reusable empty state component for list pages.
 * Shows icon, title, description, and optional CTA.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  className,
  showDemoHint = false,
}) {
  return (
    <div
      className={cn(
        'py-16 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-base font-semibold text-gray-700 mb-2">{title}</p>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {showDemoHint && (
        <p className="text-xs text-gray-400 mb-4">טיפ: הוסף פריט ראשון כדי להתחיל</p>
      )}
      {ctaLabel && onCta && (
        <Button
          onClick={onCta}
          size="lg"
          className="gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl"
        >
          <Plus className="w-4 h-4" />
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
