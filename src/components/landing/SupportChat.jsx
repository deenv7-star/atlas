import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/972545380085?text=היי, אשמח לקבל עזרה עם ATLAS', '_blank');
  };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 left-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </motion.div>

      {/* Chat Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#0B1220] to-[#1a2744] p-4">
              <h3 className="text-white font-bold text-lg">צריכים עזרה?</h3>
              <p className="text-white/80 text-sm">אנחנו כאן בשבילכם</p>
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