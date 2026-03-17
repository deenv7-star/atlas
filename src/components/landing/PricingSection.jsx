import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Crown, Rocket, Sparkles, ArrowLeft } from 'lucide-react';
import { PRICING_PLANS } from '@/config/pricing';

const plans = PRICING_PLANS.map((p, i) => ({
  name: p.nameHe,
  icon: i === 0 ? Zap : i === 1 ? Crown : Rocket,
  price: p.price,
  period: 'לחודש',
  description: p.desc,
  features: p.features,
  popular: p.popular,
  accentColor: i === 0 ? '#6366f1' : i === 1 ? '#00D1C1' : '#f59e0b',
  iconBg: i === 0 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : i === 1 ? 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
}));

export default function PricingSection({ onSelectPlan }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  return (
    <section className="py-28 relative overflow-hidden"
             style={{ background: '#ffffff' }}>

      {/* Background blobs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(0,209,193,0.07) 0%, transparent 65%)' }} />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)' }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(11,18,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(11,18,32,0.04) 1px, transparent 1px)',
             backgroundSize: '48px 48px',
           }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="section-label mb-5 mx-auto w-fit">
            <Sparkles className="w-3 h-3" />
            תוכניות ומחירים
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1220] mb-4 tracking-tight">
            השקעה שמחזירה את עצמה
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 font-medium">
            בחרו את התוכנית המתאימה למספר המתחמים שלכם
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl border"
               style={{
                 background: 'rgba(244,246,251,0.9)',
                 backdropFilter: 'blur(12px)',
                 borderColor: 'rgba(226,232,240,0.8)',
                 boxShadow: '0 2px 8px rgba(11,18,32,0.04)',
               }}>
            {[
              { key: 'monthly', label: 'חיוב חודשי' },
              { key: 'yearly', label: 'חיוב שנתי' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setBillingPeriod(opt.key)}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all relative"
                style={
                  billingPeriod === opt.key
                    ? {
                        background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(11,18,32,0.20)',
                      }
                    : { color: '#6b7280' }
                }
              >
                {opt.label}
                {opt.key === 'yearly' && (
                  <span className="mr-2 text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
                        style={
                          billingPeriod === 'yearly'
                            ? { background: 'rgba(0,209,193,0.2)', color: '#00D1C1' }
                            : { background: '#dcfce7', color: '#16a34a' }
                        }>
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
              transition={{ delay: index * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.015, transition: { duration: 0.2 } }}
              className={`relative ${plan.popular ? 'mt-0 lg:-mt-4' : ''}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 inset-x-0 flex justify-center z-20">
                  <span className="px-5 py-1.5 text-xs font-bold rounded-full text-[#0B1220]"
                        style={{
                          background: 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
                          boxShadow: '0 4px 12px rgba(0,209,193,0.35)',
                        }}>
                    פופולרי ביותר ✦
                  </span>
                </div>
              )}

              <div className="relative rounded-3xl p-7 overflow-hidden"
                   style={
                     plan.popular
                       ? {
                           background: 'linear-gradient(145deg, #0B1220 0%, #1a2744 100%)',
                           boxShadow: '0 16px 48px rgba(11,18,32,0.22), 0 4px 12px rgba(11,18,32,0.12)',
                           border: '1px solid rgba(255,255,255,0.06)',
                           marginTop: '16px',
                         }
                       : {
                           background: 'rgba(255,255,255,0.92)',
                           backdropFilter: 'blur(20px)',
                           border: '1px solid rgba(226,232,240,0.8)',
                           boxShadow: '0 4px 20px rgba(11,18,32,0.06)',
                         }
                   }>
                {/* Glow for popular */}
                {plan.popular && (
                  <>
                    <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                         style={{ background: 'radial-gradient(ellipse at 80% -10%, rgba(0,209,193,0.15) 0%, transparent 65%)' }} />
                    <div className="absolute bottom-0 left-0 w-36 h-36 pointer-events-none"
                         style={{ background: 'radial-gradient(ellipse at 20% 110%, rgba(99,102,241,0.12) 0%, transparent 65%)' }} />
                  </>
                )}
                {/* Gradient top border accent for non-popular */}
                {!plan.popular && (
                  <div className="absolute top-0 left-6 right-6 h-px rounded-b-full"
                       style={{ background: `linear-gradient(90deg, transparent, ${plan.accentColor}40, transparent)` }} />
                )}

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                       style={{
                         background: plan.popular ? 'rgba(255,255,255,0.08)' : plan.iconBg,
                         boxShadow: plan.popular ? 'none' : `0 4px 12px ${plan.accentColor}30`,
                       }}>
                    <plan.icon className="w-5 h-5"
                               style={{ color: plan.popular ? '#00D1C1' : '#ffffff' }} />
                  </div>

                  <h3 className="text-xl font-extrabold mb-1 tracking-tight"
                      style={{ color: plan.popular ? '#ffffff' : '#0B1220' }}>
                    {plan.name}
                  </h3>
                  <p className="text-sm mb-6 font-medium"
                     style={{ color: plan.popular ? 'rgba(255,255,255,0.55)' : '#9ca3af' }}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-7">
                    {plan.price ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold tracking-tight"
                                style={{ color: plan.popular ? '#ffffff' : '#0B1220' }}>
                            ₪{billingPeriod === 'yearly' ? Math.round(plan.price * 0.8) : plan.price}
                          </span>
                          <span className="text-sm font-medium"
                                style={{ color: plan.popular ? 'rgba(255,255,255,0.45)' : '#9ca3af' }}>
                            {plan.period}
                          </span>
                        </div>
                        {billingPeriod === 'yearly' && (
                          <p className="text-xs font-semibold mt-1 flex items-center gap-1"
                             style={{ color: plan.popular ? '#00D1C1' : '#10b981' }}>
                            ✦ חסכו ₪{Math.round(plan.price * 0.2 * 12)} בשנה
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-2xl font-extrabold tracking-tight"
                           style={{ color: plan.popular ? '#ffffff' : '#0B1220' }}>
                        יצירת קשר
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={onSelectPlan}
                    className="w-full h-11 rounded-2xl font-bold text-sm mb-7 flex items-center justify-center gap-2 transition-all btn-premium"
                    style={
                      plan.popular
                        ? {
                            background: 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
                            color: '#0B1220',
                            boxShadow: '0 4px 16px rgba(0,209,193,0.35)',
                          }
                        : {
                            background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(11,18,32,0.20)',
                          }
                    }
                  >
                    {plan.price ? 'התחל עכשיו' : 'צרו קשר'}
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Divider */}
                  <div className="h-px mb-6"
                       style={{ background: plan.popular ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.8)' }} />

                  {/* Feature list */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0"
                                      style={{ color: plan.popular ? '#00D1C1' : plan.accentColor }} />
                        <span style={{ color: plan.popular ? 'rgba(255,255,255,0.7)' : '#374151' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-sm text-gray-400 font-medium">
            ✦&nbsp; ביטול בכל עת &nbsp;·&nbsp; ללא התחייבות &nbsp;·&nbsp; החזר כספי מלא תוך 30 יום &nbsp;·&nbsp; אין עמלות הקמה
          </p>
        </motion.div>
      </div>
    </section>
  );
}
