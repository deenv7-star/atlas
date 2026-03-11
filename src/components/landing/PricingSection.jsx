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
    features: ['מתחם אחד', 'ניהול לידים והזמנות', 'יומן בסיסי', 'תמיכה במייל', 'דוחות בסיסיים'],
    popular: false,
    style: {
      card: 'bg-white border border-gray-100',
      icon: 'bg-gray-100 text-gray-600',
      badge: '',
      btn: 'bg-[#0B1220] hover:bg-[#1a2744] text-white',
      check: 'text-gray-400',
    },
  },
  {
    name: 'מקצועי',
    icon: Crown,
    price: 699,
    period: 'לחודש',
    description: 'הכי פופולרי — לבעלי 2-5 מתחמים',
    features: ['2-5 מתחמים', 'הודעות אוטומטיות', 'ניהול ניקיון', 'חוזים דיגיטליים', "תמיכה בצ'אט", 'דוחות מתקדמים', 'כל תכונות בסיסי'],
    popular: true,
    style: {
      card: 'bg-[#0B1220] border border-[#0B1220]',
      icon: 'bg-[#00D1C1]/15 text-[#00D1C1]',
      badge: 'bg-[#00D1C1] text-[#0B1220]',
      btn: 'bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220]',
      check: 'text-[#00D1C1]',
    },
  },
  {
    name: 'עסקי',
    icon: Rocket,
    price: null,
    period: 'מותאם אישית',
    description: 'לרשתות ונכסים בהיקף גדול',
    features: ['5+ מתחמים', 'אינטגרציות מתקדמות', 'אוטומציות מלאות', 'עדיפות בתמיכה', 'הדרכה אישית', 'כל תכונות מקצועי'],
    popular: false,
    style: {
      card: 'bg-white border border-gray-100',
      icon: 'bg-purple-100 text-purple-600',
      badge: '',
      btn: 'bg-[#0B1220] hover:bg-[#1a2744] text-white',
      check: 'text-gray-400',
    },
  },
];

export default function PricingSection({ onSelectPlan }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00D1C1]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4F6FB] border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
            תוכניות ומחירים
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            השקעה שמחזירה את עצמה
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            בחרו את התוכנית המתאימה למספר המתחמים שלכם
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#F4F6FB] rounded-2xl border border-gray-200">
            {[
              { key: 'monthly', label: 'חיוב חודשי' },
              { key: 'yearly', label: 'חיוב שנתי' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setBillingPeriod(opt.key)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  billingPeriod === opt.key
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
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

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-5 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                  <span className={`px-5 py-1.5 text-xs font-bold rounded-full shadow-lg ${plan.style.badge}`}>
                    פופולרי ביותר
                  </span>
                </div>
              )}

              <div className={`rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all ${plan.style.card} ${plan.popular ? 'mt-4' : ''}`}>
                {/* Icon + name */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${plan.style.icon}`}>
                  <plan.icon className="w-5 h-5" />
                </div>

                <h3 className={`text-xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/60' : 'text-gray-500'}`}>{plan.description}</p>

                {/* Price */}
                <div className="mb-7">
                  {plan.price ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                          ₪{billingPeriod === 'yearly' ? Math.round(plan.price * 0.8) : plan.price}
                        </span>
                        <span className={`text-sm ${plan.popular ? 'text-white/50' : 'text-gray-400'}`}>{plan.period}</span>
                      </div>
                      {billingPeriod === 'yearly' && (
                        <p className="text-xs text-emerald-500 font-medium mt-1">
                          חסכו ₪{Math.round(plan.price * 0.2 * 12)} בשנה
                        </p>
                      )}
                    </>
                  ) : (
                    <div className={`text-2xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      יצירת קשר
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Button
                  onClick={onSelectPlan}
                  className={`w-full h-11 rounded-2xl font-semibold mb-7 shadow-sm ${plan.style.btn}`}
                >
                  {plan.price ? 'התחל עכשיו' : 'צרו קשר'}
                </Button>

                {/* Feature list */}
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.style.check}`} />
                      <span className={plan.popular ? 'text-white/75' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
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
