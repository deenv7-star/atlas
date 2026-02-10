import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Zap, Crown, Rocket, Mail } from 'lucide-react';

const plans = [
  {
    name: 'בסיסי',
    icon: Zap,
    price: 399,
    properties: 1,
    period: 'לחודש',
    description: 'מתחם אחד',
    features: [
      'מתחם אחד',
      'ניהול לידים והזמנות',
      'יומן בסיסי',
      'תמיכה במייל',
      'דוחות בסיסיים',
    ],
    color: 'from-gray-400 to-gray-600',
    popular: false,
  },
  {
    name: 'מקצועי',
    icon: Crown,
    price: 699,
    properties: 5,
    period: 'לחודש',
    description: 'הכי פופולרי',
    features: [
      '2-5 מתחמים',
      'כל תכונות בסיסי',
      'הודעות אוטומטיות',
      'ניהול ניקיון',
      'חוזים דיגיטליים',
      'תמיכה בצ\'אט',
      'דוחות מתקדמים',
    ],
    color: 'from-[#00D1C1] to-[#00B8A9]',
    popular: true,
  },
  {
    name: 'עסקי',
    icon: Rocket,
    price: 999,
    properties: 10,
    period: 'לחודש',
    description: 'לעסקים גדולים',
    features: [
      '5-10 מתחמים',
      'כל תכונות מקצועי',
      'אינטגרציות מתקדמות',
      'אוטומציות מלאות',
      'עדיפות בתמיכה',
      'הדרכה אישית',
    ],
    color: 'from-purple-400 to-pink-500',
    popular: false,
  },
  {
    name: 'ארגוני',
    icon: Mail,
    price: null,
    properties: 999,
    period: 'מותאם אישית',
    description: '10+ מתחמים',
    features: [
      '10+ מתחמים',
      'כל תכונות עסקי',
      'API מלא',
      'מנהל חשבון ייעודי',
      'SLA מובטח',
      'תמיכה 24/7',
      'התאמות מיוחדות',
    ],
    color: 'from-indigo-400 to-blue-500',
    popular: false,
  },
];

export default function PricingSection({ onSelectPlan }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00D1C1]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            תוכניות ומחירים
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            בחרו את התוכנית המתאימה למספר המתחמים שלכם
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-gray-100 rounded-full">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              חודשי
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              שנתי
              <span className="mr-2 text-xs text-green-600 font-bold">חסכו 20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: plan.popular ? 1.03 : 1.02 }}
              className={plan.popular ? 'relative' : ''}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center z-10">
                  <div className={`px-6 py-2 bg-gradient-to-r ${plan.color} text-white rounded-full text-sm font-bold shadow-lg`}>
                    הכי פופולרי
                  </div>
                </div>
              )}

              <Card className={`h-full p-6 relative overflow-hidden ${
                plan.popular 
                  ? 'border-2 border-[#00D1C1] shadow-2xl' 
                  : 'border-2 border-gray-200 shadow-lg'
              }`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                <div className="mb-6">
                  {plan.price ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          ₪{billingPeriod === 'yearly' ? Math.round(plan.price * 0.8) : plan.price}
                        </span>
                        <span className="text-gray-600 text-sm">{plan.period}</span>
                      </div>
                      {billingPeriod === 'yearly' && (
                        <p className="text-sm text-green-600 font-medium mt-2">
                          חסכו ₪{Math.round(plan.price * 0.2 * 12)} בשנה
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">יצירת קשר</div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-[#00D1C1]' : 'text-gray-400'
                      }`} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={onSelectPlan}
                  className={`w-full h-11 rounded-xl font-semibold ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.color} text-white hover:shadow-xl`
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.price ? 'התחל עכשיו' : 'צור קשר'}
                </Button>

                {plan.popular && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5 pointer-events-none`} />
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600">
            ביטול בכל עת • ללא התחייבות • החזר כספי מלא תוך 30 יום
          </p>
        </motion.div>
      </div>
    </section>
  );
}