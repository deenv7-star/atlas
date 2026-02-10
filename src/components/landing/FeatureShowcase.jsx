import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Inbox, CalendarCheck, Wallet, Brush, Send, FileSignature, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Inbox,
    title: 'ניהול לידים חכם',
    description: 'מערכת CRM מתקדמת עם AI שממיר לידים ללקוחות',
    color: 'from-blue-400 to-cyan-500',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
  },
  {
    icon: CalendarCheck,
    title: 'ניהול הזמנות אוטומטי',
    description: 'סנכרון אוטומטי עם כל הפלטפורמות, ללא הזמנות כפולות',
    color: 'from-purple-400 to-pink-500',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&h=400&fit=crop',
  },
  {
    icon: Wallet,
    title: 'תשלומים ופיננסים',
    description: 'ניהול תשלומים, חשבוניות וחשבונאות בקליק אחד',
    color: 'from-green-400 to-emerald-500',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
  },
  {
    icon: Brush,
    title: 'ניהול ניקיון',
    description: 'תיאום משימות ניקיון אוטומטי לפני כל כניסה',
    color: 'from-orange-400 to-red-500',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
  },
  {
    icon: Send,
    title: 'הודעות אוטומטיות',
    description: 'WhatsApp, SMS ומייל - כל ההודעות בזמן האמת',
    color: 'from-pink-400 to-rose-500',
    image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=600&h=400&fit=crop',
  },
  {
    icon: FileSignature,
    title: 'חוזים דיגיטליים',
    description: 'יצירה וחתימה על חוזים מכל מכשיר',
    color: 'from-indigo-400 to-blue-500',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop',
  },
];

export default function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-[#00D1C1]/10 rounded-full mb-4">
            <span className="text-sm font-semibold text-[#00D1C1]">פיצ'רים מתקדמים</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            כל מה שצריך במקום אחד
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            פלטפורמה all-in-one שמשלבת את כל הכלים שצריכים לנהל נכסים בהצלחה
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left - Feature List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveFeature(index)}
                className="cursor-pointer"
              >
                <Card className={`p-6 transition-all hover:shadow-xl ${
                  activeFeature === index 
                    ? 'border-2 border-[#00D1C1] bg-gradient-to-r from-[#00D1C1]/5 to-transparent shadow-lg' 
                    : 'border-2 border-gray-100 hover:border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <motion.div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}
                      animate={activeFeature === index ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                    {activeFeature === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-[#00D1C1] flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Right - Feature Preview */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src={features[activeFeature].image}
                    alt={features[activeFeature].title}
                    className="w-full h-[500px] object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${features[activeFeature].color} opacity-20`} />
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                    <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${features[activeFeature].color} mb-3`}>
                      <span className="text-sm font-semibold text-white">תכונה מתקדמת</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{features[activeFeature].title}</h3>
                    <p className="text-white/90">{features[activeFeature].description}</p>
                  </div>
                </div>

                {/* Decorative Elements */}
                <motion.div
                  className={`absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br ${features[activeFeature].color} rounded-full blur-3xl opacity-50`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className={`absolute -bottom-6 -left-6 w-40 h-40 bg-gradient-to-br ${features[activeFeature].color} rounded-full blur-3xl opacity-50`}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}