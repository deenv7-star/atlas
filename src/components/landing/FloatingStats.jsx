import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Shield } from 'lucide-react';

const stats = [
  { icon: Users, value: '300+', label: 'בעלי נכסים', color: 'from-blue-400 to-cyan-500' },
  { icon: TrendingUp, value: '1,200+', label: 'נכסים בניהול', color: 'from-purple-400 to-pink-500' },
  { icon: Zap, value: '98%', label: 'שביעות רצון', color: 'from-green-400 to-emerald-500' },
  { icon: Shield, value: '24/7', label: 'תמיכה ושירות', color: 'from-orange-400 to-red-500' },
];

export default function FloatingStats() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-[#00D1C1]/10 rounded-full mb-4">
            <span className="text-sm font-semibold text-[#00D1C1]">המספרים מדברים בעד עצמם</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            מובילים את השוק
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group"
            >
              <div className="relative p-8 rounded-3xl bg-white border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 relative z-10`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>

                {/* Value */}
                <div className="text-4xl font-bold text-gray-900 mb-2 relative z-10">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-gray-600 font-medium relative z-10">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}