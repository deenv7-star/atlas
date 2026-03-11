import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Brush, Send, FileSignature, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'תשלומים ופיננסים',
    description: 'ניהול תשלומים, חשבוניות וחשבונאות בקליק אחד. עקבו אחר כל תזרים הכנסות בזמן אמת ללא מאמץ.',
    tag: 'פיננסים',
    grad: 'from-emerald-400 to-teal-500',
    previewBg: 'from-emerald-50/80 via-teal-50/60 to-white',
    previewGlow: 'rgba(0,209,193,0.15)',
    chips: ['חשבוניות אוטומטיות', 'מעקב תשלומים', 'דוחות הכנסות', 'ניהול יתרות'],
    mockup: [
      { label: 'תשלום שהתקבל', val: '₪2,400', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'ממתין לתשלום', val: '₪800', color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'סה"כ החודש', val: '₪18,600', color: 'text-gray-900', bg: 'bg-gray-50' },
    ],
  },
  {
    icon: Brush,
    title: 'ניהול ניקיון',
    description: 'תיאום משימות ניקיון אוטומטי לפני כל כניסה — הצוות מקבל הודעה ישירה לסמארטפון עם כל הפרטים.',
    tag: 'תפעול',
    grad: 'from-orange-400 to-red-500',
    previewBg: 'from-orange-50/80 via-red-50/40 to-white',
    previewGlow: 'rgba(249,115,22,0.12)',
    chips: ['לוח משימות', 'הודעות לצוות', 'סטטוס בזמן אמת', 'תזמון אוטומטי'],
    mockup: [
      { label: 'משימה פעילה', val: 'יחידה 4A', color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'הושלמו היום', val: '5 ניקיונות', color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'ממתינות', val: '2 משימות', color: 'text-gray-900', bg: 'bg-gray-50' },
    ],
  },
  {
    icon: Send,
    title: 'הודעות אוטומטיות',
    description: 'שלחו הודעות WhatsApp, SMS ומייל אוטומטית לאורחים — מאישור ההזמנה ועד לאחר היציאה.',
    tag: 'תקשורת',
    grad: 'from-violet-500 to-purple-600',
    previewBg: 'from-violet-50/80 via-purple-50/40 to-white',
    previewGlow: 'rgba(139,92,246,0.12)',
    chips: ['תבניות מוכנות', 'שליחה אוטומטית', 'WhatsApp Business', 'מעקב קריאות'],
    mockup: [
      { label: 'נשלחו היום', val: '42 הודעות', color: 'text-violet-600', bg: 'bg-violet-50' },
      { label: 'אחוז פתיחה', val: '94%', color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'תגובות', val: '18 תגובות', color: 'text-gray-900', bg: 'bg-gray-50' },
    ],
  },
  {
    icon: FileSignature,
    title: 'חוזים דיגיטליים',
    description: 'צרו וחתמו על חוזי שכירות ומדיניות ביטול מכל מכשיר, תוך שניות, ללא הדפסה וסריקה.',
    tag: 'משפטי',
    grad: 'from-blue-500 to-indigo-600',
    previewBg: 'from-blue-50/80 via-indigo-50/40 to-white',
    previewGlow: 'rgba(99,102,241,0.12)',
    chips: ['חתימה דיגיטלית', 'תבניות חוזים', 'שמירה בענן', 'ניהול גרסאות'],
    mockup: [
      { label: 'חוזים פעילים', val: '14 חוזים', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'ממתינים לחתימה', val: '3 חוזים', color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'חתומים החודש', val: '9 חוזים', color: 'text-gray-900', bg: 'bg-gray-50' },
    ],
  },
];

export default function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const f = features[active];

  return (
    <section className="py-28 bg-white relative overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5
            bg-[#F7F8FD] rounded-full border border-gray-200/80
            shadow-[0_2px_10px_rgba(0,0,0,0.05)]
            text-xs font-semibold text-gray-600 mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
            פיצ׳רים מרכזיים
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
              כל מה שצריך במקום אחד
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            פלטפורמה all-in-one שמשלבת את כל הכלים לניהול נכסי נופש בהצלחה
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 items-stretch">

          {/* Selector column */}
          <div className="space-y-2.5 order-2 lg:order-1">
            {features.map((feat, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setActive(i)}
                className={`w-full text-right group rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer ${
                  active === i
                    ? 'bg-[#0B1220] border-[#0B1220] shadow-[0_16px_48px_rgba(11,18,32,0.22)]'
                    : 'bg-white border-gray-100 hover:border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    active === i
                      ? 'bg-white/10'
                      : `bg-gradient-to-br ${feat.grad} shadow-[0_4px_12px_rgba(0,0,0,0.15)]`
                  }`}>
                    <feat.icon className={`w-5 h-5 ${active === i ? 'text-[#00D1C1]' : 'text-white'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`font-bold text-base ${active === i ? 'text-white' : 'text-gray-900'}`}>
                        {feat.title}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold leading-none ${
                        active === i ? 'bg-white/12 text-white/60' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {feat.tag}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed line-clamp-2 ${
                      active === i ? 'text-white/55' : 'text-gray-400'
                    }`}>
                      {feat.description}
                    </p>
                  </div>

                  <CheckCircle className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                    active === i
                      ? 'text-[#00D1C1] opacity-100 scale-100'
                      : 'text-gray-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
                  }`} />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Preview panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`order-1 lg:order-2 relative rounded-3xl p-7 overflow-hidden
                bg-gradient-to-br ${f.previewBg}
                border border-gray-100
                shadow-[0_4px_32px_rgba(0,0,0,0.07)]
                min-h-[340px] flex flex-col justify-between`}
              style={{ '--glow': f.previewGlow } as React.CSSProperties}
            >
              {/* Corner glow */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-60 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${f.previewGlow} 0%, transparent 70%)` }}
              />

              {/* Top */}
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.grad}
                  flex items-center justify-center mb-6
                  shadow-[0_8px_24px_rgba(0,0,0,0.14)]`}
                >
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.description}</p>
              </div>

              {/* Mockup data */}
              <div className="relative z-10 mt-6 space-y-2">
                {f.mockup.map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${row.bg}
                      border border-white/80 shadow-sm`}
                  >
                    <span className="text-xs text-gray-500 font-medium">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.val}</span>
                  </motion.div>
                ))}
              </div>

              {/* Chips */}
              <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                {f.chips.map((chip, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5
                      bg-white/90 backdrop-blur-sm rounded-xl
                      text-xs font-semibold text-gray-700
                      border border-white shadow-sm"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${f.grad}`} />
                    {chip}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
