import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserCheck, Calendar, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'חפשו נכסים',
    subtitle: 'מנוע חיפוש חכם ומתקדם',
    description: 'השתמשו במנוע החיפוש החכם שלנו כדי למצוא את הנכס המושלם. סננו לפי מיקום, מחיר, גודל ועוד.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    number: 2,
    icon: UserCheck,
    title: 'בדקו פרופיל',
    subtitle: 'כל המידע במקום אחד',
    description: 'צפו בפרופיל המפורט של הנכס, תמונות, ביקורות מאומתות, זמינות בזמן אמת ומידע על המארח.',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    number: 3,
    icon: Calendar,
    title: 'קבעו תיאום',
    subtitle: 'הזמנה פשוטה ומהירה',
    description: 'בחרו תאריכים, אשרו פרטים ושלמו בצורה מאובטחת. הכל תוך דקות ספורות.',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=600&fit=crop',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    number: 4,
    icon: CheckCircle,
    title: 'תהנו מהשירות',
    subtitle: 'ניהול חכם ואוטומטי',
    description: 'קבלו עדכונים בזמן אמת, תזכורות אוטומטיות וגישה לכל המידע שצריך - בכל זמן ומכל מקום.',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop',
    gradient: 'from-orange-400 to-red-500',
  },
];

export default function StepsSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-[#00D1C1]/10 rounded-full mb-4">
            <span className="text-sm font-semibold text-[#00D1C1]">תהליך פשוט</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            איך זה עובד?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            4 שלבים פשוטים להתחיל לנהל את הנכסים שלכם בצורה חכמה
          </p>
        </motion.div>

        {/* Steps Navigation */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => setActiveStep(index)}
                className={`w-full p-4 rounded-2xl transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] shadow-xl scale-105'
                    : 'bg-white border-2 border-gray-200 hover:border-[#00D1C1]/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-3 ${
                  activeStep !== index && 'opacity-50'
                }`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold mb-1" style={{
                  color: activeStep === index ? 'white' : '#0B1220'
                }}>
                  {step.number}
                </div>
                <h3 className={`font-semibold ${
                  activeStep === index ? 'text-white' : 'text-gray-900'
                }`}>
                  {step.title}
                </h3>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Active Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-2 border-gray-200 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Side */}
                <div className="relative h-64 md:h-auto overflow-hidden">
                  <img
                    src={steps[activeStep].image}
                    alt={steps[activeStep].title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${steps[activeStep].gradient} opacity-20`} />
                  <div className="absolute top-4 right-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${steps[activeStep].gradient} flex items-center justify-center shadow-xl`}>
                      <span className="text-3xl font-bold text-white">{steps[activeStep].number}</span>
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="mb-4">
                    <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${steps[activeStep].gradient} mb-4`}>
                      <span className="text-sm font-semibold text-white">{steps[activeStep].subtitle}</span>
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {steps[activeStep].title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    {steps[activeStep].description}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${steps[activeStep].gradient} flex items-center justify-center`}>
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      מאובטח, מהיר ופשוט
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeStep === index 
                  ? 'w-8 bg-gradient-to-r from-[#00D1C1] to-[#00B8A9]' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}