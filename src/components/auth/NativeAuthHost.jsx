/**
 * iOS app only (lazy-loaded from App.jsx): keeps the Face ID Keychain copy in sync with the live session,
 * and asks once, after a sign-in, "לפתוח את atlas עם Face ID?" (the app lock, src/lib/nativeApp/appLock.js).
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Drawer as DrawerPrimitive } from 'vaul';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { isNativeApp } from '@/lib/native';
import { shouldOfferLock, lockErrorKind, SHEET_SESSION_KEY } from '@/lib/nativeApp/appLockCore';
import { lockPrefs, markLockOffered, enableLock } from '@/lib/nativeApp/appLock';
import { biometricAvailability, startBiometricSync } from '@/lib/auth/biometric';
import { Drawer, DrawerPortal, DrawerOverlay, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import FaceIdGlyph from '@/components/nativeApp/FaceIdGlyph.jsx';

/** Let the screen the owner landed on paint and settle before the sheet comes up. */
const OFFER_DELAY_MS = 1200;

async function currentSession() {
  try { return supabase ? (await supabase.auth.getSession())?.data?.session || null : null; } catch { return null; }
}

export default function NativeAuthHost() {
  const { isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();
  const [avail, setAvail] = useState(null); // { available, label }
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(() => document.documentElement.hasAttribute('data-atlas-locked'));

  useEffect(() => { if (supabase) startBiometricSync(supabase); }, []);
  useEffect(() => { biometricAvailability().then(setAvail); }, []);
  useEffect(() => {
    const on = (e) => setLocked(Boolean(e?.detail?.locked));
    window.addEventListener('atlas:lock', on);
    return () => window.removeEventListener('atlas:lock', on);
  }, []);

  useEffect(() => {
    if (open) return undefined;
    const ok = shouldOfferLock({
      native: isNativeApp(),
      signedIn: isAuthenticated,
      available: Boolean(avail?.available),
      prefs: lockPrefs(),
      path: pathname,
      locked,
    });
    if (!ok) return undefined;
    const t = setTimeout(() => {
      markLockOffered();
      try { sessionStorage.setItem(SHEET_SESSION_KEY, 'faceid'); } catch { /* private mode */ }
      setOpen(true);
    }, OFFER_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAuthenticated, avail, pathname, open, locked]);

  const label = avail?.label || 'Face ID';

  const accept = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await enableLock({ userId: user?.id, session: await currentSession() });
      setOpen(false);
    } catch (err) {
      const kind = lockErrorKind(err);
      if (kind !== 'cancel') setError(`לא הצלחנו להפעיל את ${label}. בדקו שמוגדר קוד גישה באייפון, ונסו שוב.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!saving) setOpen(v); }}>
      <DrawerPortal>
        <DrawerOverlay className="bg-[rgba(12,16,34,0.32)]" />
        <DrawerPrimitive.Content
          dir="rtl"
          data-testid="faceid-offer"
          className="faceid-offer fixed inset-x-0 bottom-0 z-50 flex flex-col items-center rounded-t-[28px] bg-white px-7 pb-[max(20px,env(safe-area-inset-bottom))] text-center outline-none"
        >
          <div className="mt-2 h-[5px] w-9 rounded-full bg-[#1B2656]/15" aria-hidden />
          <FaceIdGlyph size={60} state={open ? 'intro' : 'idle'} className="mt-9 text-[#3E2BF1]" />
          <DrawerTitle className="mt-6 text-[24px] font-bold leading-[1.2] tracking-[-0.015em] text-[#1B2656]">
            לפתוח את atlas במבט?
          </DrawerTitle>
          <DrawerDescription className="mt-2 max-w-[300px] text-[16px] leading-[1.5] text-[#1B2656]/60">
            עם <span dir="ltr">{label}</span>, ההזמנות ופרטי האורחים נשארים רק אצלכם.
          </DrawerDescription>
          {error ? <p role="alert" className="mt-3 text-[14px] font-medium text-danger-600">{error}</p> : null}
          <div className="mt-8 flex w-full flex-col gap-1">
            <button
              type="button"
              onClick={accept}
              disabled={saving}
              data-testid="faceid-offer-yes"
              className="flex h-[50px] w-full items-center justify-center rounded-full bg-[#3E2BF1] text-[16px] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E2BF1]/40 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {saving ? 'מפעילים…' : <>הפעלת{'\u00A0'}<bdi>{label}</bdi></>}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="flex h-[48px] w-full items-center justify-center rounded-full text-[16px] font-medium text-[#1B2656]/70 transition-colors duration-150 active:bg-[#1B2656]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2656]/20"
            >
              לא עכשיו
            </button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
}
