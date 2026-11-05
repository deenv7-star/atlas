import React from 'react';
import { CloudOff } from 'lucide-react';
import { useOnline } from '@/hooks/useOnline';
import { staleStateOf, staleTimeLabel } from '@/lib/stay/loadState';
import { cn } from '@/lib/utils';

/**
 * Audit 04.11 #6: a quiet mark next to a screen title when what it shows is the last saved copy
 * (the refresh failed). Tap = refresh. Renders nothing while the data is fresh.
 * 05.11 corners: offline is said once, by the global OfflineBanner pill ("אין חיבור לאינטרנט"), so this
 * mark stays hidden while the device is offline (no second "אין חיבור" pill in the header).
 * @param {{ queries: object[], onRetry?: () => void, className?: string }} props
 */
export default function StaleIndicator({ queries, onRetry, className }) {
  const online = useOnline();
  const st = staleStateOf(queries, { online });
  if (!st.show || st.reason === 'offline') return null;
  const at = staleTimeLabel(st.updatedAt);
  const label = 'לא עודכן';
  const full = `${label}${at ? `. מוצג המידע מ-${at}` : ''}. נגיעה לרענון`;
  return (
    <button
      type="button"
      onClick={onRetry}
      aria-label={full}
      title={full}
      className={cn('atlas-stale press inline-flex min-h-[44px] items-center px-1', className)}
    >
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#1B2656]/12 bg-white/90 px-2.5 text-[12px] font-medium text-[#1B2656]/80">
        <CloudOff className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        <span>{label}{at ? <> · <bdi dir="ltr">{at}</bdi></> : null}</span>
      </span>
    </button>
  );
}
