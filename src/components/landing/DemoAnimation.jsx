import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, MessageSquare, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEMO_STEPS = [
  {
    icon: Calendar,
    title: 'הזמנה חדשה נכנסת',
    description: 'משפחת לוי מעוניינת ב-3 לילות',
    color: 'from-blue-500 to-blue-600',
    content: (
      <div className="space-y-2 text-right">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="font-semibold">משפחת לוי</p>
          <p className="text-sm text-gray-600">15-18 במרץ • 4 אורחים</p>
        </div>
      </div>
    )
  },
  {
    icon: CheckCircle2,
    title: 'המערכת בודקת זמינות',
    description: 'אין הזמנות כפולות ✓',
    color: 'from-green-500 to-green-600',
    content: (
      <div className="space-y-2">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="font-semibold text-green-800">✓ הנכס פנוי</p>
          <p className="text-sm text-green-600">ניתן לאשר הזמנה</p>
        </div>
      </div>
    )
  },
  {
    icon: DollarSign,
    title: 'תשלום אוטומטי',
    description: 'נוצרה בקשת מקדמה 50%',
    color: 'from-purple-500 to-purple-600',
    content: (
      <div className="space-y-2">
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="font-semibold">מקדמה: ₪1,500</p>
          <p className="text-sm text-gray-600">יתרה: ₪1,500</p>
        </div>
      </div>
    )
  },
  {
    icon: MessageSquare,
    title: 'הודעה אוטומטית נשלחת',
    description: 'WhatsApp עם פרטי כניסה',
    color: 'from-[#25D366] to-green-600',
    content: (
      <div className="space-y-2">
        <div className="bg-green-50 p-3 rounded-lg text-sm">
          <p>שלום משפחת לוי! 👋</p>
          <p className="mt-1">ההזמנה שלכם אושרה!</p>
          <p className="mt-1 text-gray-600">כניסה: 15/3 בשעה 15:00</p>
        </div>
      </div>
    )
  },
  {
    icon: Sparkles,
    title: 'משימת ניקיון נוצרת',
    description: 'הצוות מקבל התראה',
    color: 'from-pink-500 to-pink-600',
    content: (
      <div className="space-y-2">
        <div className="bg-pink-50 p-3 rounded-lg">
          <p className="font-semibold">ניקיון - 18/3 בשעה 12:00</p>
          <p className="text-sm text-gray-600">הוקצה לרונית</p>
        </div>
      </div>
    )
  }
];

export default function DemoAnimation({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= DEMO_STEPS.length - 1) {
          return 0; // Loop back
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const step = DEMO_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 left-0 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
              <div className={`bg-gradient-to-r ${step.color} p-6 text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-white/90 text-sm">{step.description}</p>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6">
                {step.content}
              </CardContent>

              {/* Progress Indicator */}
              <div className="flex gap-1.5 justify-center pb-4">
                {DEMO_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep 
                        ? 'w-8 bg-[#00D1C1]' 
                        : 'w-1.5 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-white/70 mt-4 text-sm">
          צעד {currentStep + 1} מתוך {DEMO_STEPS.length} • המערכת עובדת אוטומטית
        </p>
      </div>
    </div>
  );
}