import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Zap, Crown, Rocket } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    icon: Zap,
    price: 99,
    period: 'לחודש',
    description: 'למתחילים',
    features: [
      'עד 3 נכסים',
      'ניהול לידים והזמנות',
      'ניהול תשלומים',
      'הודעות אוטומטיות',
      'דוחות בסיסיים',
    ],
    color: 'from-gray-400 to-gray-600',
    popular: false,
  },
  {
    name: 'Pro',
    icon: Crown,
    price: 249,
    period: 'לחודש',
    description: 'הכי פופולרי',
    features: [
      'עד 10 נכסים',
      'CRM מתקדם',
      'אוטומציות חכמות',
      'סנכרון לוחות שנה',
      'חשבוניות וחשבונאות',
      'ניהול ניקיון',
      'תמיכה מועדפת',
      'אינטגרציות',
    ],
    color: 'from-[#00D1C1] to-[#00B8A9]',
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: Rocket,
    price: 499,
    period: 'לחודש',
    description: 'לעסקים גדולים',
    features: [
      'נכסים ללא הגבלה',
      'כל התכונות של Pro',
      'ניהול צוות',
      'API מלא',
      'תמיכה 24/7',
      'ייעוץ אישי',
      'הדרכות',
      'התאמות אישיות',
    ],
    color: 'from-purple-400 to-pink-500',
    popular: false,
  },
];

export default function PricingSection({ onSelectPlan }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Decoration */}
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
          <div className="inline-block px-4 py-2 bg-[#00D1C1]/10 rounded-full mb-4">
            <span className="text-sm font-semibold text-[#00D1C1]">תוכניות ומחירים</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            בחרו את התוכנית המתאימה לכם
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            התחילו בחינם או בחרו תוכנית שתתאים בדיוק לצרכים שלכם
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

        <div className="grid md:grid-cols-3 gap-8">
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
                    ⭐ הכי פופולרי
                  </div>
                </div>
              )}

              <Card className={`h-full p-8 relative overflow-hidden ${
                plan.popular 
                  ? 'border-2 border-[#00D1C1] shadow-2xl' 
                  : 'border-2 border-gray-200 shadow-lg'
              }`}>
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      ₪{billingPeriod === 'yearly' && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <p className="text-sm text-green-600 font-medium mt-2">
                      חסכו ₪{Math.round(plan.price * 0.2 * 12)} בשנה!
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-[#00D1C1]' : 'text-gray-400'
                      }`} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={onSelectPlan}
                  className={`w-full h-12 rounded-xl font-semibold text-lg ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.color} text-white hover:shadow-xl`
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.price === 0 ? 'התחילו בחינם' : 'התחילו עכשיו'}
                </Button>

                {/* Background Gradient */}
                {plan.popular && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5 pointer-events-none`} />
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600">
            ✓ ביטול בכל עת • ✓ ללא התחייבות • ✓ החזר כספי מלא תוך 30 יום
          </p>
        </motion.div>
      </div>
    </section>
  );
}