import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Brush, Send, FileSignature, CheckCircle, ArrowLeft } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'תשלומים ופיננסים',
    description: 'ניהול תשלומים, חשבוניות וחשבונאות בקליק אחד. עקבו אחר כל תזרים הכנסות בזמן אמת.',
    color: 'from-emerald-400 to-teal-500',
    tag: 'פיננסים',
    preview: {
      bg: 'from-emerald-50 to-teal-50',
      items: ['חשבוניות אוטומטיות', 'מעקב תשלומים', 'דוחות הכנסות', 'ניהול יתרות']
    }
  },
  {
    icon: Brush,
    title: 'ניהול ניקיון',
    description: 'תיאום משימות ניקיון אוטומטי לפני כל כניסה — הצוות מקבל הודעה ישירה לסמארטפון.',
    color: 'from-orange-400 to-red-500',
    tag: 'תפעול',
    preview: {
      bg: 'from-orange-50 to-red-50',
      items: ['לוח משימות', 'הודעות לצוות', 'סטטוס בזמן אמת', 'תזמון אוטומטי']
    }
  },
  {
    icon: Send,
    title: 'הודעות אוטומטיות',
    description: 'שלחו הודעות WhatsApp, SMS ומייל אוטומטית לאורחים — מאישור ההזמנה ועד לאחר היציאה.',
    color: 'from-pink-400 to-rose-500',
    tag: 'תקשורת',
    preview: {
      bg: 'from-pink-50 to-rose-50',
      items: ['תבניות מוכנות', 'שליחה אוטומטית', 'WhatsApp Business', 'מעקב קריאות']
    }
  },
  {
    icon: FileSignature,
    title: 'חוזים דיגיטליים',
    description: 'צרו וחתמו על חוזי שכירות ומדיניות ביטול מכל מכשיר, תוך שניות.',
    color: 'from-indigo-400 to-blue-500',
    tag: 'משפטי',
    preview: {
      bg: 'from-indigo-50 to-blue-50',
      items: ['חתימה דיגיטלית', 'תבניות חוזים', 'שמירה בענן', 'ניהול גרסאות']
    }
  },
];

export default function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);
  const active = features[activeFeature];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4F6FB] border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
            פיצ׳רים מרכזיים
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            כל מה שצריך במקום אחד
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            פלטפורמה all-in-one שמשלבת את כל הכלים לניהול נכסי נופש בהצלחה
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* Left — Feature selector */}
          <div className="space-y-3 order-2 lg:order-1">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                onClick={() => setActiveFeature(index)}
                className={`cursor-pointer group rounded-2xl border-2 p-5 transition-all duration-200 ${
                  activeFeature === index
                    ? 'bg-[#0B1220] border-[#0B1220] shadow-xl shadow-gray-900/10'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeFeature === index
                      ? 'bg-white/10'
                      : `bg-gradient-to-br ${feature.color}`
                  }`}>
                    <feature.icon className={`w-5 h-5 ${activeFeature === index ? 'text-[#00D1C1]' : 'text-white'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`font-bold text-base ${activeFeature === index ? 'text-white' : 'text-gray-900'}`}>
                        {feature.title}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        activeFeature === index ? 'bg-white/15 text-white/70' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {feature.tag}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed line-clamp-2 ${activeFeature === index ? 'text-white/65' : 'text-gray-500'}`}>
                      {feature.description}
                    </p>
                  </div>
                  <CheckCircle className={`w-5 h-5 flex-shrink-0 transition-opacity ${
                    activeFeature === index ? 'text-[#00D1C1] opacity-100' : 'text-gray-200 opacity-0 group-hover:opacity-100'
                  }`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right — Preview panel */}
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`order-1 lg:order-2 rounded-3xl p-8 bg-gradient-to-br ${active.preview.bg} border border-gray-100 flex flex-col justify-between min-h-[340px]`}
          >
            {/* Top */}
            <div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${active.color} flex items-center justify-center mb-6 shadow-lg`}>
                <active.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{active.title}</h3>
              <p className="text-gray-500 leading-relaxed mb-6">{active.description}</p>
            </div>

            {/* Feature chips */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">כולל בפיצ׳ר</div>
              <div className="flex flex-wrap gap-2">
                {active.preview.items.map((item, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-sm font-medium text-gray-700 shadow-sm border border-white/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
                    {item}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
