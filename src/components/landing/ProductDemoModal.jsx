import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, LayoutDashboard, Calendar, Users, Wallet, Zap, CheckCircle2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const demoSlides = [
  {
    id: 1,
    icon: LayoutDashboard,
    title: 'לוח בקרה מרכזי',
    subtitle: 'כל המידע החשוב במקום אחד',
    description: 'ראה במבט אחד את כל ההזמנות, הלידים, התשלומים והביצועים שלך. סטטיסטיקות בזמן אמת ואנליטיקס מתקדמת.',
    features: ['תצוגה מקיפה של כל הפעילות', 'גרפים וסטטיסטיקות חכמות', 'התראות חשובות בזמן אמת'],
    color: 'from-blue-500 to-indigo-600',
    mockup: (
      <div className="bg-white rounded-xl shadow-2xl p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">הזמנות החודש</div>
            <div className="text-3xl font-bold text-blue-600">28</div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">הכנסות</div>
            <div className="text-3xl font-bold text-green-600">₪42K</div>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">הזמנה #{1000 + i}</span>
              </div>
              <span className="text-xs text-gray-500">כניסה היום</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 2,
    icon: Calendar,
    title: 'ניהול הזמנות חכם',
    subtitle: 'לוח שנה אינטראקטיבי וסנכרון אוטומטי',
    description: 'נהל את כל ההזמנות בקלות עם לוח שנה חכם, חסימת תאריכים אוטומטית ומניעת הזמנות כפולות.',
    features: ['סנכרון עם Airbnb ו-Booking.com', 'חסימת תאריכים אוטומטית', 'ניהול צ׳ק-אין וצ׳ק-אאוט'],
    color: 'from-purple-500 to-pink-600',
    mockup: (
      <div className="bg-white rounded-xl shadow-2xl p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
            <div key={day} className="text-center text-xs text-gray-500 font-medium">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-lg flex items-center justify-center text-sm",
                i % 7 === 0 || i % 7 === 6 ? "bg-gray-50 text-gray-400" :
                i === 5 || i === 6 || i === 12 ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold" :
                "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded" />
            <span className="text-gray-600">מוזמן</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded" />
            <span className="text-gray-600">פנוי</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    icon: Users,
    title: 'ניהול לידים ואורחים',
    subtitle: 'המרת פניות להזמנות בקלות',
    description: 'עקוב אחרי כל ליד מרגע הפנייה ועד להזמנה. נהל תקשורת עם אורחים, שלח הודעות אוטומטיות ושמור על חוויה מעולה.',
    features: ['ניהול פניות מכל הערוצים', 'הודעות אוטומטיות לאורחים', 'מעקב אחרי סטטוס ליד'],
    color: 'from-teal-500 to-cyan-600',
    mockup: (
      <div className="bg-white rounded-xl shadow-2xl p-6 space-y-3">
        {[
          { name: 'משפחת כהן', status: 'חדש', color: 'blue' },
          { name: 'דני לוי', status: 'יצר קשר', color: 'yellow' },
          { name: 'רונית אברהם', status: 'נשלח הצעה', color: 'purple' },
          { name: 'יוסי מזרחי', status: 'אישר הזמנה', color: 'green' },
        ].map((lead, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
                lead.color === 'blue' && 'bg-blue-500',
                lead.color === 'yellow' && 'bg-yellow-500',
                lead.color === 'purple' && 'bg-purple-500',
                lead.color === 'green' && 'bg-green-500'
              )}>
                {lead.name[0]}
              </div>
              <div>
                <div className="font-medium text-sm">{lead.name}</div>
                <div className="text-xs text-gray-500">050-1234567</div>
              </div>
            </div>
            <div className={cn(
              "text-xs px-3 py-1 rounded-full font-medium",
              lead.color === 'blue' && 'bg-blue-100 text-blue-700',
              lead.color === 'yellow' && 'bg-yellow-100 text-yellow-700',
              lead.color === 'purple' && 'bg-purple-100 text-purple-700',
              lead.color === 'green' && 'bg-green-100 text-green-700'
            )}>
              {lead.status}
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 4,
    icon: Wallet,
    title: 'ניהול תשלומים וחשבוניות',
    subtitle: 'מעקב אחרי כל שקל',
    description: 'נהל תשלומים, צור חשבוניות מקצועיות והתחבר לספקי תשלום מובילים. עקוב אחרי תזרים המזומנים בזמן אמת.',
    features: ['חיבור לספקי תשלום', 'יצירת חשבוניות אוטומטית', 'התראות על תשלומים'],
    color: 'from-amber-500 to-orange-600',
    mockup: (
      <div className="bg-white rounded-xl shadow-2xl p-6">
        <div className="mb-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">יתרה כוללת</div>
          <div className="text-3xl font-bold text-amber-600">₪84,500</div>
        </div>
        <div className="space-y-2">
          {[
            { name: 'משפחת כהן', amount: '₪2,500', status: 'שולם', icon: CheckCircle2, color: 'green' },
            { name: 'דני לוי', amount: '₪1,800', status: 'ממתין', icon: null, color: 'yellow' },
            { name: 'רונית אברהם', amount: '₪3,200', status: 'שולם', icon: CheckCircle2, color: 'green' },
          ].map((payment, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                {payment.icon && <payment.icon className="w-4 h-4 text-green-600" />}
                <div>
                  <div className="text-sm font-medium">{payment.name}</div>
                  <div className="text-xs text-gray-500">{payment.status}</div>
                </div>
              </div>
              <div className="text-sm font-semibold">{payment.amount}</div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 5,
    icon: Zap,
    title: 'אוטומציות חכמות',
    subtitle: 'תן למערכת לעבוד בשבילך',
    description: 'הגדר כללי אוטומציה לשליחת הודעות, עדכון סטטוסים, תזכורות וכל פעולה חוזרת. חסוך זמן יקר.',
    features: ['הודעות אוטומטיות לאורחים', 'תזכורות תשלום', 'עדכון סטטוסים אוטומטי'],
    color: 'from-rose-500 to-red-600',
    mockup: (
      <div className="bg-white rounded-xl shadow-2xl p-6 space-y-3">
        {[
          { title: 'הודעת ברוכים הבאים', trigger: '24 שעות לפני כניסה', active: true },
          { title: 'תזכורת תשלום', trigger: 'שבוע לפני', active: true },
          { title: 'בקשת ביקורת', trigger: '24 שעות אחרי יציאה', active: false },
        ].map((auto, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Zap className={cn(
                "w-5 h-5",
                auto.active ? "text-rose-500" : "text-gray-400"
              )} />
              <div>
                <div className="text-sm font-medium">{auto.title}</div>
                <div className="text-xs text-gray-500">{auto.trigger}</div>
              </div>
            </div>
            <div className={cn(
              "w-10 h-6 rounded-full transition-colors relative",
              auto.active ? "bg-rose-500" : "bg-gray-300"
            )}>
              <div className={cn(
                "absolute w-4 h-4 bg-white rounded-full top-1 transition-transform",
                auto.active ? "right-1" : "right-5"
              )} />
            </div>
          </div>
        ))}
      </div>
    )
  }
];

export default function ProductDemoModal({ open, onOpenChange }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const slide = demoSlides[currentSlide];
  const Icon = slide.icon;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + demoSlides.length) % demoSlides.length);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!open || !isAutoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [open, isAutoPlay]);

  // Reset to first slide when modal opens
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      setIsAutoPlay(true);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" dir="rtl">
        <div className="relative">
          {/* Header */}
          <div className={cn(
            "bg-gradient-to-r p-6 text-white relative overflow-hidden",
            slide.color
          )}>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">{slide.title}</DialogTitle>
                  <p className="text-white/80 text-sm">{slide.subtitle}</p>
                </div>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <p className="text-gray-700 leading-relaxed">{slide.description}</p>

                {/* Mockup */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                  {slide.mockup}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {slide.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                הקודם
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className="gap-2"
              >
                {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>

            {/* Dots with progress */}
            <div className="flex gap-2">
              {demoSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentSlide(i);
                    setIsAutoPlay(false);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all relative overflow-hidden",
                    i === currentSlide ? "w-8 bg-gray-200" : "w-2 bg-gray-300"
                  )}
                >
                  {i === currentSlide && isAutoPlay && (
                    <motion.div
                      className="absolute inset-0 bg-[#00D1C1]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4, ease: "linear" }}
                      key={currentSlide}
                    />
                  )}
                  {i === currentSlide && !isAutoPlay && (
                    <div className="absolute inset-0 bg-[#00D1C1]" />
                  )}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={nextSlide}
              className="gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220]"
            >
              הבא
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}