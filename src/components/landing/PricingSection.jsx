import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap, Crown, Rocket } from 'lucide-react';

const plans = [
  {
    name: 'בסיסי',
    icon: Zap,
    price: 399,
    period: 'לחודש',
    description: 'לבעלי נכס אחד שמתחילים את הדרך',
    features: [
      'מתחם אחד',
      'ניהול לידים והזמנות',
      'יומן בסיסי',
      'תמיכה במייל',
      'דוחות בסיסיים',
    ],
    popular: false,
    type: 'light',
  },
  {
    name: 'מקצועי',
    icon: Crown,
    price: 699,
    period: 'לחודש',
    description: 'הכי פופולרי — לבעלי 2-5 מתחמים',
    features: [
      '2-5 מתחמים',
      'הודעות אוטומטיות',
      'ניהול ניקיון',
      'חוזים דיגיטליים',
      "תמיכה בצ'אט",
      'דוחות מתקדמים',
      'כל תכונות בסיסי',
    ],
    popular: true,
    type: 'dark',
  },
  {
    name: 'עסקי',
    icon: Rocket,
    price: null,
    period: 'מותאם אישית',
    description: 'לרשתות ונכסים בהיקף גדול',
    features: [
      '5+ מתחמים',
      'אינטגרציות מתקדמות',
      'אוטומציות מלאות',
      'עדיפות בתמיכה',
      'הדרכה אישית',
      'כל תכונות מקצועי',
    ],
    popular: false,
    type: 'light',
  },
];

export default function PricingSection({ onSelectPlan }) {
  const [billing, setBilling] = useState('monthly');

  return (
    <section className="py-28 bg-white relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#00D1C1]/7 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-violet-400/6 rounded-full blur-3xl" />
      </div>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5
            bg-[#F7F8FD] rounded-full border border-gray-200/80
            shadow-[0_2px_10px_rgba(0,0,0,0.05)]
            text-xs font-semibold text-gray-600 mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
            תוכניות ומחירים
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
              השקעה שמחזירה את עצמה
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
            בחרו את התוכנית המתאימה למספר המתחמים שלכם
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#F7F8FD] rounded-2xl border border-gray-200/80
            shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
          >
            {[
              { key: 'monthly', label: 'חיוב חודשי' },
              { key: 'yearly', label: 'חיוב שנתי' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setBilling(opt.key)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  billing === opt.key
                    ? 'bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.09)] border border-gray-200/60'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {opt.label}
                {opt.key === 'yearly' && (
                  <span className="mr-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-lg">
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
              className="relative"
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                  <span className="px-5 py-1.5 bg-gradient-to-r from-[#00D1C1] to-[#0090a8] text-white text-xs font-bold rounded-full
                    shadow-[0_4px_16px_rgba(0,209,193,0.4)]">
                    פופולרי ביותר ✦
                  </span>
                </div>
              )}

              <div className={`relative rounded-3xl p-7 overflow-hidden transition-shadow duration-300 ${
                plan.type === 'dark'
                  ? `bg-[#0B1220] mt-4
                    shadow-[0_24px_64px_rgba(11,18,32,0.22),0_0_0_1px_rgba(0,209,193,0.15)]
                    hover:shadow-[0_32px_80px_rgba(11,18,32,0.28),0_0_0_1px_rgba(0,209,193,0.25)]`
                  : `bg-white/80 backdrop-blur-xl border border-white/90
                    shadow-[0_4px_24px_rgba(0,0,0,0.07)]
                    hover:shadow-[0_20px_56px_rgba(0,0,0,0.11)]`
              }`}>
                {/* Dark card internal glow blobs */}
                {plan.type === 'dark' && (
                  <>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#00D1C1]/12 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                  </>
                )}

                {/* Subtle inner top highlight for glass cards */}
                {plan.type === 'light' && (
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent rounded-t-3xl" />
                )}

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${
                    plan.type === 'dark'
                      ? 'bg-[#00D1C1]/15 shadow-[0_0_20px_rgba(0,209,193,0.2)]'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}>
                    <plan.icon className={`w-5 h-5 ${plan.type === 'dark' ? 'text-[#00D1C1]' : 'text-gray-600'}`} />
                  </div>

                  {/* Name + desc */}
                  <h3 className={`text-xl font-bold mb-1 ${plan.type === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-7 ${plan.type === 'dark' ? 'text-white/50' : 'text-gray-400'}`}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-7">
                    {plan.price ? (
                      <>
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className={`text-4xl font-black leading-none ${plan.type === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            ₪{billing === 'yearly' ? Math.round(plan.price * 0.8) : plan.price}
                          </span>
                          <span className={`text-sm ${plan.type === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                            {plan.period}
                          </span>
                        </div>
                        {billing === 'yearly' && (
                          <p className="text-xs text-emerald-500 font-semibold">
                            חסכו ₪{Math.round(plan.price * 0.2 * 12)} בשנה
                          </p>
                        )}
                      </>
                    ) : (
                      <p className={`text-2xl font-bold ${plan.type === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        יצירת קשר
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={onSelectPlan}
                    className={`w-full h-11 rounded-2xl font-semibold mb-7 transition-all ${
                      plan.type === 'dark'
                        ? 'bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] shadow-[0_4px_20px_rgba(0,209,193,0.35)] hover:shadow-[0_8px_28px_rgba(0,209,193,0.45)]'
                        : 'bg-[#0B1220] hover:bg-[#161f36] text-white shadow-[0_4px_16px_rgba(11,18,32,0.2)] hover:shadow-[0_8px_24px_rgba(11,18,32,0.28)]'
                    }`}
                  >
                    {plan.price ? 'התחל עכשיו' : 'צרו קשר'}
                  </Button>

                  {/* Divider */}
                  <div className={`h-px mb-6 ${plan.type === 'dark' ? 'bg-white/8' : 'bg-gray-100'}`} />

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.type === 'dark' ? 'text-[#00D1C1]' : 'text-gray-400'
                        }`} />
                        <span className={plan.type === 'dark' ? 'text-white/70' : 'text-gray-600'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-gray-400 mt-10"
        >
          ביטול בכל עת &nbsp;·&nbsp; ללא התחייבות &nbsp;·&nbsp; החזר כספי מלא תוך 30 יום
        </motion.p>
      </div>
    </section>
  );
}
