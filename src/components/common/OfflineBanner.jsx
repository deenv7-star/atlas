import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useOnline } from '@/hooks/useOnline';

/**
 * Audit 05.11 NET-2: one global mark that the device is offline, on every signed-in screen, so the owner
 * knows nothing is being saved. A short "החיבור חזר" when it comes back. Never covers a control: a small pill
 * in the middle of the header row (between the wordmark and the avatar), pointer-events off.
 */
export default function OfflineBanner() {
  const { isAuthenticated, authOffline } = useAuth();
  const online = useOnline();
  const [back, setBack] = useState(false);
  const wasOffline = useRef(!online);
  useEffect(() => {
    if (!online) { wasOffline.current = true; setBack(false); return undefined; }
    if (!wasOffline.current) return undefined;
    wasOffline.current = false;
    setBack(true);
    const t = setTimeout(() => setBack(false), 2500);
    return () => clearTimeout(t);
  }, [online]);
  // The offline auth screen already says it; signed-out visitors don't need it.
  if (!isAuthenticated || authOffline) return null;
  const show = !online || back;
  return (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      className="pointer-events-none fixed inset-x-0 z-[90] flex justify-center px-4"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 22px)' }}
    >
      {show ? (
        <span
          className={`inline-flex min-h-[32px] items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium shadow-[0_6px_20px_rgba(27,38,86,0.18)] ${online ? 'bg-white text-[#1B2656]' : 'bg-[#1B2656] text-white'}`}
          data-testid="offline-banner"
        >
          {online
            ? <><Wifi className="h-4 w-4" strokeWidth={1.75} aria-hidden />החיבור חזר</>
            : <><WifiOff className="h-4 w-4" strokeWidth={1.75} aria-hidden /><span aria-hidden>אין חיבור לאינטרנט</span><span className="sr-only">אין חיבור לאינטרנט. שינויים לא יישמרו עד שהחיבור יחזור.</span></>}
        </span>
      ) : null}
    </div>
  );
}
