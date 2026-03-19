import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

/**
 * Shows a one-time install hint for iOS Safari users who haven't installed the PWA.
 * Appears after 30 seconds, dismissed forever once closed.
 */
export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;
    const dismissed = localStorage.getItem('pwa-install-dismissed');

    if (isIOS && !isInStandaloneMode && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 30_000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 inset-x-4 z-50 bg-[#0B1220] border border-[#00D1C1]/30 rounded-2xl shadow-2xl p-4 text-white"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      role="dialog"
      aria-label="התקן את ATLAS"
    >
      <button
        onClick={dismiss}
        className="absolute top-3 left-3 text-gray-400 hover:text-white"
        aria-label="סגור"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <img src="/apple-touch-icon.png" alt="ATLAS" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm leading-snug">התקן את ATLAS על האייפון</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">
            לחץ על{' '}
            <Share className="inline h-3.5 w-3.5 text-[#00D1C1]" />
            {' '}ואז{' '}
            <span className="text-[#00D1C1] font-medium inline-flex items-center gap-0.5">
              <PlusSquare className="inline h-3.5 w-3.5" /> הוסף למסך הבית
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
