import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState as DsEmptyState } from '@/components/ds';

/** Empty state for list pages: one sentence why + one primary action (docs/brand.md). */
export default function EmptyState({ icon, title, description, ctaLabel, onCta, className }) {
  return (
    <DsEmptyState
      icon={icon}
      title={title}
      description={description}
      className={className}
      action={ctaLabel && onCta ? (
        <Button onClick={onCta}>
          <Plus strokeWidth={2} />
          {ctaLabel}
        </Button>
      ) : null}
    />
  );
}
