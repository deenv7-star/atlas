import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportChat({ autoOpenAfterMs = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!autoOpenAfterMs || triggeredRef.current) return;
    const pricingEl = document.getElementById('pricing');
    if (!pricingEl) return;
    let timeoutId = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (triggeredRef.current) return;
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => {
            triggeredRef.current = true;
            setIsOpen(true);
          }, autoOpenAfterMs);
        } else if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(pricingEl);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [autoOpenAfterMs]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/972545380085?text=היי, אשמח לקבל עזרה עם ATLAS', '_blank');
  };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 left-6 z-[60]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      >
        <Button
          type="button"
          aria-expanded={isOpen}
          aria-controls="atlas-support-chat-panel"
          aria-label={isOpen ? 'סגור חלון עזרה' : 'פתח עזרה וצ׳אט'}
          onClick={() => setIsOpen((v) => !v)}
          className="h-14 w-14 rounded-full bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
        </Button>
      </motion.div>

      {/* Chat Box — z-50 so launcher (z-60) stays above and remains clickable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="atlas-support-chat-panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="atlas-support-chat-title"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#0B1220] to-[#1a2744] p-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="atlas-support-chat-title" className="text-white font-bold text-lg">צריכים עזרה?</h3>
                <p className="text-white/80 text-sm">אנחנו כאן בשבילכם</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="shrink-0 h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white"
                aria-label="סגור"
              >
                <X className="h-5 w-5" aria-hidden />
              </Button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-gray-600 text-sm">
                היי! איך אנחנו יכולים לעזור לכם היום?
              </p>

              <Button
                onClick={handleWhatsAppClick}
                className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium"
              >
                <MessageCircle className="h-4 w-4 ml-2" />
                שלח הודעה בוואטסאפ
              </Button>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  זמינים א-ה, 09:00-18:00
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}