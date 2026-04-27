import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { X } from 'lucide-react';
import { usePersistentToastStore } from './persistentToastStore';

function PersistentAlertsHost(): React.ReactElement {
  const items = usePersistentToastStore((s) => s.items);
  const dismiss = usePersistentToastStore((s) => s.dismiss);

  if (items.length === 0) {
    return <></>;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4"
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          dir="rtl"
          className="pointer-events-auto mx-auto flex w-full max-w-lg items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-md backdrop-blur-sm"
        >
          <p className="min-w-0 flex-1 leading-snug">{item.message}</p>
          <div className="flex shrink-0 items-center gap-2">
            {item.actionLabel && item.onAction ? (
              <button
                type="button"
                className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                onClick={() => item.onAction?.()}
              >
                {item.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-lg p-1 text-amber-800 hover:bg-amber-200/80"
              aria-label="סגור"
              onClick={() => dismiss(item.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AtlasToaster(): React.ReactElement {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = (): void => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <>
      <Toaster
        position={isMobile ? 'bottom-center' : 'bottom-right'}
        dir="rtl"
        visibleToasts={3}
        gap={12}
        offset={isMobile ? undefined : 20}
        mobileOffset={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))' }}
        closeButton
        toastOptions={{
          className: '!pointer-events-auto',
        }}
      />
      <PersistentAlertsHost />
    </>
  );
}
