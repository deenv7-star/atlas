import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

// A field has focus, or a sheet / dialog is open (they move focus inside when they open).
const isTyping = () => {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return true;
  // Only a dialog that is actually on screen (the support / assistant panels keep hidden ones in the DOM).
  return [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].some((d) => {
    if (d.closest('[hidden], [aria-hidden="true"]')) return false;
    const r = d.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(d).visibility !== 'hidden';
  });
};

/**
 * Shows a one-time install hint for iOS Safari users who haven't installed the PWA.
 * Appears after 30 seconds, dismissed forever once closed.
 * Audit 05.11 UI-5: it used to sit on top of the assistant composer. Now it shows only where the layout
 * allows it (`hidden` = not Today, or the assistant is open) and steps aside while any field has focus.
 */
export default function IOSInstallBanner({ hidden = false }) {
  const [visible, setVisible] = useState(false);
  const [typing, setTyping] = useState(isTyping);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;
    const dismissed = localStorage.getItem('pwa-install-dismissed');

    if (isIOS && !isInStandaloneMode && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 30_000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const sync = () => setTyping(isTyping());
    const later = () => setTimeout(sync, 0);
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', later);
    return () => { document.removeEventListener('focusin', sync); document.removeEventListener('focusout', later); };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!visible || hidden || typing) return null;

  return (
    <div
      className="fixed bottom-20 inset-x-4 z-50 bg-[#F4F3FF] border border-brand-600/30 rounded-2xl shadow-2xl p-4 text-navy-900"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      role="region"
      aria-label="הוספת atlas למסך הבית"
      dir="rtl"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-0.5 left-0.5 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#4A5578] hover:text-navy-900"
        aria-label="סגירה"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <div className="flex items-start gap-3 pe-8">
        <img src="/apple-touch-icon.png?v=2" alt="" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div>
          <p className="font-semibold text-[15px] leading-snug">הוסיפו את <bdi>atlas</bdi> למסך הבית</p>
          <p className="text-[13px] text-[#4A5578] mt-0.5 leading-snug">
            לחצו על{' '}
            <Share className="inline h-3.5 w-3.5 text-brand-600" aria-label="שיתוף" />
            {' '}ואז{' '}
            <span className="text-brand-600 font-medium inline-flex items-center gap-0.5">
              <PlusSquare className="inline h-3.5 w-3.5" aria-hidden /> הוספה למסך הבית
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
