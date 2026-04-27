import React, { useCallback } from 'react';
import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/AtlasToast';

export type ShareViewButtonProps = {
  className?: string;
  label?: string;
};

/**
 * Copies the full current URL (path + query) so filters and deep links are preserved.
 */
export function ShareViewButton(props: ShareViewButtonProps): React.ReactElement {
  const { className, label = 'שתף תצוגה' } = props;
  const { success, error } = useToast();

  const onClick = useCallback(() => {
    const url = window.location.href;
    void navigator.clipboard.writeText(url).then(
      () => success('הלינק הועתק'),
      () => error('לא ניתן להעתיק ללוח'),
    );
  }, [error, success]);

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      onClick={onClick}
    >
      <Link2 className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}
