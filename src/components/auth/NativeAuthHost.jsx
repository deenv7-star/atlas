/**
 * iOS app only (lazy-loaded from App.jsx): keeps the Face ID Keychain copy in sync with the live session,
 * and asks once, after a sign-in, "לפתוח את atlas עם Face ID?" (the app lock, src/lib/nativeApp/appLock.js).
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ScanFace } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { isNativeApp } from '@/lib/native';
import { shouldOfferLock, lockErrorKind, SHEET_SESSION_KEY } from '@/lib/nativeApp/appLockCore';
import { lockPrefs, markLockOffered, enableLock } from '@/lib/nativeApp/appLock';
import { biometricAvailability, startBiometricSync } from '@/lib/auth/biometric';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

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
      <DrawerContent dir="rtl" data-testid="faceid-offer" className="px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#3E2BF1]/10">
          <ScanFace className="h-7 w-7 text-[#3E2BF1]" aria-hidden />
        </div>
        <DrawerTitle className="mt-4 text-center text-[22px] font-extrabold leading-tight text-[#1B2656]">
          לפתוח את atlas עם <span dir="ltr">{label}</span>?
        </DrawerTitle>
        <DrawerDescription className="mt-2 text-center text-[15px] leading-relaxed text-[#1B2656]/70">
          מבט אחד ואתם בפנים, וההזמנות נשארות רק שלכם. אפשר לכבות בהגדרות.
        </DrawerDescription>
        {error ? <p role="alert" className="mt-3 text-center text-[14px] font-medium text-danger-600">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={accept}
            disabled={saving}
            data-testid="faceid-offer-yes"
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#3E2BF1] text-[16px] font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
          >
            {saving ? 'מפעילים…' : <>כן, להפעיל <span dir="ltr">{label}</span></>}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={saving}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] text-[16px] font-medium text-[#1B2656]"
          >
            לא עכשיו
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
