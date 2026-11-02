/**
 * iOS app only (lazy-loaded from App.jsx): keeps the Face ID Keychain copy in sync with the live session,
 * and asks once, after a sign-in, "next time with Face ID?".
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ScanFace } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { isNativeApp } from '@/lib/native';
import { shouldOfferBiometric } from '@/lib/auth/nativeAuthCore';
import {
  biometricAvailability, biometricPrefs, enableBiometric, markBiometricOffered, startBiometricSync,
} from '@/lib/auth/biometric';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

/** Let the screen the owner landed on paint and settle before the sheet comes up. */
const OFFER_DELAY_MS = 1200;

export default function NativeAuthHost() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const [avail, setAvail] = useState(null); // { available, label }
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { startBiometricSync(supabase); }, []);
  useEffect(() => { biometricAvailability().then(setAvail); }, []);

  useEffect(() => {
    if (open) return undefined;
    const ok = shouldOfferBiometric({
      native: isNativeApp(),
      signedIn: isAuthenticated,
      available: Boolean(avail?.available),
      prefs: biometricPrefs(),
      path: pathname,
    });
    if (!ok) return undefined;
    const t = setTimeout(() => { markBiometricOffered(); setOpen(true); }, OFFER_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAuthenticated, avail, pathname, open]);

  const label = avail?.label || 'Face ID';

  const accept = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const { data: { session } = {} } = await supabase.auth.getSession();
      await enableBiometric(session);
      setOpen(false);
    } catch {
      setError(`לא הצלחנו להפעיל את ${label}. בדקו שמוגדר קוד גישה במכשיר, ונסו שוב מההגדרות.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!saving) setOpen(v); }}>
      <DrawerContent dir="rtl" className="px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#3E2BF1]/10">
          <ScanFace className="h-7 w-7 text-[#3E2BF1]" aria-hidden />
        </div>
        <DrawerTitle className="mt-4 text-center text-[22px] font-extrabold leading-tight text-[#1B2656]">
          להיכנס בפעם הבאה עם <span dir="ltr">{label}</span>?
        </DrawerTitle>
        <DrawerDescription className="mt-2 text-center text-[15px] leading-relaxed text-[#1B2656]/70">
          במקום מייל וסיסמה, מבט אחד ואתם בפנים. אפשר לכבות את זה בכל רגע בהגדרות.
        </DrawerDescription>
        {error ? <p role="alert" className="mt-3 text-center text-[14px] font-medium text-danger-600">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={accept}
            disabled={saving}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#3E2BF1] text-[16px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
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
