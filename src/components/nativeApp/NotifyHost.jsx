/**
 * iOS app only (lazy-loaded from App.jsx): notifications.
 *   - keeps the 09:00 check-in reminders in sync with the bookings (every open and every return to the app)
 *   - asks, once the moment is right (src/lib/nativeApp/notifyCore.js shouldPrePrompt), with a Hebrew sheet
 *     before the iOS dialog, so the one-shot iOS question is never wasted on a cold first launch
 *   - registers for push when allowed (token saved quietly; server side not live yet)
 *   - a tap on a reminder opens the booking
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BellRing } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isNativeApp } from '@/lib/native';
import { SHEET_SESSION_KEY } from '@/lib/nativeApp/appLockCore';
import { shouldPrePrompt, hasUpcomingArrival } from '@/lib/nativeApp/notifyCore';
import {
  permissionState, requestPermission, registerPush, syncCheckinReminders, onNotificationTap,
  notifyPrefs, setNotifyPrefs,
} from '@/lib/nativeApp/notify';
import { onAppLifecycle } from '@/lib/nativeApp/appLock';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

const PROMPT_DELAY_MS = 2500;

function sheetShown() {
  try { return Boolean(sessionStorage.getItem(SHEET_SESSION_KEY)); } catch { return false; }
}

export default function NotifyHost() {
  const { user, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const orgId = user?.organization_id || '';
  const userId = user?.id || '';
  const [perm, setPerm] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(() => document.documentElement.hasAttribute('data-atlas-locked'));
  const [tick, setTick] = useState(0); // bumps on resume → re-sync

  const enabled = isNativeApp() && isAuthenticated && Boolean(orgId);
  const bookingsQ = useQuery({
    queryKey: ['native-reminders-bookings', orgId],
    queryFn: () => base44.entities.Booking.filter({ org_id: orgId }, 'check_in_date', 500).catch(() => []),
    enabled, staleTime: 60 * 1000,
  });
  const propsQ = useQuery({
    queryKey: ['native-reminders-props', orgId],
    queryFn: () => base44.entities.Property.list().catch(() => []),
    enabled, staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { permissionState().then(setPerm); }, [tick]);
  useEffect(() => {
    const on = (e) => setLocked(Boolean(e?.detail?.locked));
    const changed = () => setTick((n) => n + 1);
    window.addEventListener('atlas:lock', on);
    window.addEventListener('atlas:notify-changed', changed);
    return () => { window.removeEventListener('atlas:lock', on); window.removeEventListener('atlas:notify-changed', changed); };
  }, []);

  // Back in the app: permission may have changed in iOS Settings, bookings may have changed elsewhere.
  useEffect(() => {
    let remove = () => {}; let alive = true;
    onAppLifecycle({ resume: () => { setTick((n) => n + 1); bookingsQ.refetch?.(); } })
      .then((r) => { if (alive) remove = r; else r(); }).catch(() => {});
    return () => { alive = false; remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Taps on a reminder / push.
  const goRef = useRef(navigate);
  goRef.current = navigate;
  useEffect(() => {
    let remove = () => {}; let alive = true;
    onNotificationTap((path) => goRef.current(path)).then((r) => { if (alive) remove = r; else r(); }).catch(() => {});
    return () => { alive = false; remove(); };
  }, []);

  // Reminders + push token, whenever allowed and the data is in.
  useEffect(() => {
    if (!enabled || perm !== 'granted' || !bookingsQ.data) return;
    void syncCheckinReminders({ bookings: bookingsQ.data, properties: propsQ.data || [] });
  }, [enabled, perm, bookingsQ.data, propsQ.data, tick]);
  useEffect(() => {
    if (enabled && perm === 'granted') void registerPush({ userId, orgId });
  }, [enabled, perm, userId, orgId]);

  // The pre-prompt.
  const hasUpcoming = hasUpcomingArrival(bookingsQ.data || []);
  useEffect(() => {
    if (open) return undefined;
    const ok = shouldPrePrompt({
      native: isNativeApp(), signedIn: isAuthenticated, locked, permission: perm, prefs: notifyPrefs(),
      path: pathname, hasUpcoming, sheetShownThisSession: sheetShown(),
    });
    if (!ok) return undefined;
    const t = setTimeout(() => {
      if (sheetShown() || document.documentElement.hasAttribute('data-atlas-locked')) return;
      const p = notifyPrefs();
      setNotifyPrefs({ asked: p.asked + 1, lastAskedAt: Date.now() });
      try { sessionStorage.setItem(SHEET_SESSION_KEY, 'notify'); } catch { /* ignore */ }
      setOpen(true);
    }, PROMPT_DELAY_MS);
    return () => clearTimeout(t);
  }, [open, isAuthenticated, locked, perm, pathname, hasUpcoming]);

  const accept = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const r = await requestPermission();
    setNotifyPrefs({ outcome: r });
    setPerm(r === 'granted' ? 'granted' : 'denied');
    setBusy(false);
    setOpen(false);
  }, [busy]);

  const later = () => { setNotifyPrefs({ outcome: 'later' }); setOpen(false); };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!busy && !v) later(); }}>
      <DrawerContent dir="rtl" data-testid="notify-preprompt" className="px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#3E2BF1]/10">
          <BellRing className="h-7 w-7 text-[#3E2BF1]" aria-hidden />
        </div>
        <DrawerTitle className="mt-4 text-center text-[22px] font-extrabold leading-tight text-[#1B2656]">
          להזכיר לכם על אורחים שמגיעים?
        </DrawerTitle>
        <DrawerDescription className="mt-2 text-center text-[15px] leading-relaxed text-[#1B2656]/70">
          ב-9:00 בבוקר של יום ההגעה. אפשר לכבות בהגדרות.
        </DrawerDescription>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={accept}
            disabled={busy}
            data-testid="notify-yes"
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#3E2BF1] text-[16px] font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
          >
            הפעלת תזכורות
          </button>
          <button
            type="button"
            onClick={later}
            disabled={busy}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] text-[16px] font-medium text-[#1B2656]"
          >
            לא עכשיו
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
