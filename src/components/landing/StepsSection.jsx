import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CheckCircle2, ArrowLeft, Sparkles, Zap, Rocket } from 'lucide-react';

const steps = [
  {
    step: 1,
    title: 'הרשמה חינם',
    desc: 'הצטרפו תוך דקות ללא כרטיס אשראי',
    icon: Sparkles,
    color: 'from-blue-400 to-cyan-500',
    illustration: (
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
        className="relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-500/20 absolute -top-4 -right-4"
        />
        <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center relative">
          <Sparkles className="w-16 h-16 text-white" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white/20 rounded-2xl"
          />
        </div>
      </motion.div>
    )
  },
  {
    step: 2,
    title: 'הגדרת נכסים',
    desc: 'הוסיפו את הנכסים שלכם ותתחילו לנהל',
    icon: Zap,
    color: 'from-purple-400 to-pink-500',
    illustration: (
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 0.3 }}
        className="relative"
      >
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl p-3 backdrop-blur-sm"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex-1" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  },
  {
    step: 3,
    title: 'תתחילו להרוויח',
    desc: 'המערכת תנהל הכל בשבילכם אוטומטית',
    icon: Rocket,
    color: 'from-green-400 to-emerald-500',
    illustration: (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.6, delay: 0.4 }}
        className="relative"
      >
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <Rocket className="w-16 h-16 text-white" />
          </div>
          <motion.div
            animate={{ scale: [0, 1.5], opacity: [1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-400 rounded-full blur-sm"
          />
        </motion.div>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100],
              x: [0, (i - 1) * 30],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut"
            }}
            className="absolute top-0 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
          />
        ))}
      </motion.div>
    )
  }
];

export default function StepsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-20 w-64 h-64 bg-[#00D1C1]/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-[#00D1C1]/10 rounded-full mb-4">
            <span className="text-sm font-semibold text-[#00D1C1]">פשוט וקל</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            איך זה עובד?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            שלושה שלבים פשוטים להתחיל לנהל את הנכסים שלכם בצורה מקצועית
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 rounded-full origin-right"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, type: "spring" }}
                className="relative"
              >
                {/* Step Card */}
                <div className="relative group">
                  {/* Illustration */}
                  <div className="flex justify-center mb-6">
                    {step.illustration}
                  </div>

                  {/* Step Number Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.3, type: "spring", bounce: 0.6 }}
                    className={`absolute -top-4 right-1/2 translate-x-1/2 w-12 h-12 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-lg z-10`}
                  >
                    <span className="text-white font-bold text-lg">{step.step}</span>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full`}
                    />
                  </motion.div>

                  {/* Content Card */}
                  <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 relative overflow-hidden"
                  >
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-center leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Arrow Between Steps (Desktop) */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5 }}
                    className="hidden lg:block absolute top-1/2 -left-4 transform -translate-y-1/2 translate-x-full z-20"
                  >
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowLeft className={`w-8 h-8 text-gray-300`} />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-600">
            ⚡ התחילו תוך 5 דקות • 🎯 ללא התחייבות • ✓ חינם לחלוטין
          </p>
        </motion.div>
      </div>
    </section>
  );
}