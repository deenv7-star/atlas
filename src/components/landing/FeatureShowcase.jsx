import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Brush, Send, FileSignature, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'תשלומים ופיננסים',
    description: 'ניהול תשלומים, חשבוניות וחשבונאות בקליק אחד. עקבו אחר כל תזרים הכנסות בזמן אמת.',
    gradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    lightBg: 'linear-gradient(145deg, #ecfdf5 0%, #f0fdfa 100%)',
    accentColor: '#10b981',
    tag: 'פיננסים',
    preview: {
      items: ['חשבוניות אוטומטיות', 'מעקב תשלומים', 'דוחות הכנסות', 'ניהול יתרות']
    }
  },
  {
    icon: Brush,
    title: 'ניהול ניקיון',
    description: 'תיאום משימות ניקיון אוטומטי לפני כל כניסה — הצוות מקבל הודעה ישירה לסמארטפון.',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    lightBg: 'linear-gradient(145deg, #fff7ed 0%, #fef2f2 100%)',
    accentColor: '#f97316',
    tag: 'תפעול',
    preview: {
      items: ['לוח משימות', 'הודעות לצוות', 'סטטוס בזמן אמת', 'תזמון אוטומטי']
    }
  },
  {
    icon: Send,
    title: 'הודעות אוטומטיות',
    description: 'שלחו הודעות WhatsApp, SMS ומייל אוטומטית לאורחים — מאישור ההזמנה ועד לאחר היציאה.',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    lightBg: 'linear-gradient(145deg, #fdf2f8 0%, #fff1f2 100%)',
    accentColor: '#ec4899',
    tag: 'תקשורת',
    preview: {
      items: ['תבניות מוכנות', 'שליחה אוטומטית', 'WhatsApp Business', 'מעקב קריאות']
    }
  },
  {
    icon: FileSignature,
    title: 'חוזים דיגיטליים',
    description: 'צרו וחתמו על חוזי שכירות ומדיניות ביטול מכל מכשיר, תוך שניות.',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
    lightBg: 'linear-gradient(145deg, #eef2ff 0%, #eff6ff 100%)',
    accentColor: '#6366f1',
    tag: 'משפטי',
    preview: {
      items: ['חתימה דיגיטלית', 'תבניות חוזים', 'שמירה בענן', 'ניהול גרסאות']
    }
  },
];

export default function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);
  const active = features[activeFeature];

  return (
    <section className="py-28 relative overflow-hidden"
             style={{ background: '#f9fafb' }}>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[400px] pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 90% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[300px] pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 10% 100%, rgba(0,209,193,0.06) 0%, transparent 60%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="section-label mb-5 mx-auto w-fit">
            <Sparkles className="w-3 h-3" />
            פיצ׳רים מרכזיים
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1220] mb-4 tracking-tight">
            כל מה שצריך במקום אחד
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">
            פלטפורמה all-in-one שמשלבת את כל הכלים לניהול נכסי נופש בהצלחה
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* ── Feature selector tabs ───────────────────────── */}
          <div className="space-y-3 order-2 lg:order-1">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                onClick={() => setActiveFeature(index)}
                className="cursor-pointer group rounded-2xl p-5 transition-all duration-250"
                style={
                  activeFeature === index
                    ? {
                        background: 'linear-gradient(145deg, #0B1220 0%, #1a2744 100%)',
                        boxShadow: '0 8px 32px rgba(11,18,32,0.18), 0 2px 6px rgba(11,18,32,0.10)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(226,232,240,0.8)',
                        boxShadow: '0 2px 8px rgba(11,18,32,0.04)',
                      }
                }
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                       style={{
                         background: activeFeature === index ? 'rgba(255,255,255,0.08)' : feature.gradient,
                         boxShadow: activeFeature === index ? 'none' : `0 4px 12px ${feature.accentColor}30`,
                       }}>
                    <feature.icon className="w-5 h-5"
                                  style={{ color: activeFeature === index ? '#00D1C1' : '#ffffff' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base"
                          style={{ color: activeFeature === index ? '#ffffff' : '#0B1220' }}>
                        {feature.title}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={
                              activeFeature === index
                                ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }
                                : { background: `${feature.accentColor}15`, color: feature.accentColor }
                            }>
                        {feature.tag}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed line-clamp-2"
                       style={{ color: activeFeature === index ? 'rgba(255,255,255,0.55)' : '#6b7280' }}>
                      {feature.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 transition-all duration-200">
                    {activeFeature === index ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                           style={{ background: 'rgba(0,209,193,0.15)' }}>
                        <CheckCircle className="w-4 h-4 text-[#00D1C1]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowLeft className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Preview panel ───────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="order-1 lg:order-2 rounded-3xl p-8 flex flex-col justify-between min-h-[360px] relative overflow-hidden"
              style={{
                background: active.lightBg,
                border: `1px solid ${active.accentColor}20`,
                boxShadow: `0 8px 32px ${active.accentColor}15, 0 2px 8px rgba(11,18,32,0.05)`,
              }}
            >
              {/* Background glow blob */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                   style={{
                     background: `radial-gradient(circle, ${active.accentColor}20 0%, transparent 70%)`,
                     filter: 'blur(24px)',
                   }} />

              {/* Top content */}
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                     style={{
                       background: active.gradient,
                       boxShadow: `0 8px 24px ${active.accentColor}35`,
                     }}>
                  <active.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-extrabold text-[#0B1220] mb-3 tracking-tight">{active.title}</h3>
                <p className="text-gray-500 leading-relaxed text-base font-medium mb-6">{active.description}</p>
              </div>

              {/* Feature chips */}
              <div className="relative z-10">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">כולל בפיצ׳ר</div>
                <div className="flex flex-wrap gap-2">
                  {active.preview.items.map((item, i) => (
                    <motion.span
                      key={item}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-700"
                      style={{
                        background: 'rgba(255,255,255,0.90)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 2px 8px rgba(11,18,32,0.06)',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: active.accentColor }} />
                      {item}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
