import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingDown, Users, Shield, ArrowUpLeft } from 'lucide-react';

const cards = [
  {
    icon: Clock,
    title: 'חסכו שעות עבודה',
    description: 'אוטומציות חכמות מנהלות את העסק בשבילכם — תזמון ניקיון, שליחת הודעות ומעקב תשלומים, הכל אוטומטי.',
    type: 'dark',
    iconGrad: 'from-[#00D1C1] to-[#0070F3]',
    delay: 0,
  },
  {
    icon: TrendingDown,
    title: 'הפחיתו ביטולים',
    description: 'תזכורות אוטומטיות ותקשורת רציפה עם האורחים מונעות ביטולים ושומרות על לוח הזמנים מלא.',
    type: 'glass',
    iconGrad: 'from-violet-500 to-purple-600',
    delay: 0.1,
  },
  {
    icon: Users,
    title: 'העלו כמות לקוחות',
    description: 'ניהול לידים חכם עם מעקב אחר כל פנייה מגדיל את שיעור ההמרה ומביא יותר אורחים.',
    type: 'glass',
    iconGrad: 'from-emerald-400 to-teal-500',
    delay: 0.15,
  },
  {
    icon: Shield,
    title: 'אפס חובות אבודים',
    description: 'מעקב תשלומים אוטומטי מונע אובדן הכנסות ומבטיח שתקבלו כל תשלום בזמן, ללא מעקב ידני.',
    type: 'accent',
    iconGrad: 'from-[#00D1C1] to-emerald-400',
    delay: 0.2,
  },
];

const styles = {
  dark: {
    wrap: 'bg-[#0B1220]',
    title: 'text-white',
    desc: 'text-white/55',
    arrow: 'text-white/25 group-hover:text-white/60',
    shadow: 'hover:shadow-[0_20px_60px_rgba(11,18,32,0.28)]',
  },
  glass: {
    wrap: 'bg-white/75 backdrop-blur-xl border border-white/90',
    title: 'text-gray-900',
    desc: 'text-gray-500',
    arrow: 'text-gray-200 group-hover:text-gray-400',
    shadow: 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)]',
  },
  accent: {
    wrap: 'bg-gradient-to-br from-[#00D1C1] to-[#009eb0]',
    title: 'text-white',
    desc: 'text-white/65',
    arrow: 'text-white/30 group-hover:text-white/70',
    shadow: 'hover:shadow-[0_20px_60px_rgba(0,209,193,0.32)]',
  },
};

export default function BenefitsGrid() {
  return (
    <section className="py-28 relative overflow-hidden bg-[#F7F8FD]">
      {/* Section gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#00D1C1]/6 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5
              bg-white rounded-full border border-gray-200/80
              shadow-[0_2px_10px_rgba(0,0,0,0.06)]
              text-xs font-semibold text-gray-600 mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              למה לבחור אטלס
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.08] tracking-tight">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
                יתרונות שתרגישו
                <br />
                מהיום הראשון
              </span>
            </h2>
          </div>
          <p className="text-gray-400 max-w-[17rem] text-base leading-relaxed sm:text-right">
            הכלים שמשנים את הדרך שבה בעלי נכסים מנהלים את העסק שלהם.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => {
            const s = styles[card.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: card.delay, duration: 0.5 }}
                whileHover={{ y: -7, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
                className={`group relative p-7 rounded-3xl
                  shadow-[0_4px_24px_rgba(0,0,0,0.07)]
                  transition-shadow duration-300 cursor-default
                  ${s.wrap} ${s.shadow}`}
              >
                {/* Subtle inner highlight */}
                {card.type === 'glass' && (
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
                )}

                {/* Icon */}
                <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${card.iconGrad}
                  flex items-center justify-center mb-6
                  shadow-[0_4px_16px_rgba(0,0,0,0.15)]`}
                >
                  <card.icon className="w-5 h-5 text-white" />
                </div>

                {/* Text */}
                <h3 className={`text-lg font-bold mb-2.5 relative z-10 ${s.title}`}>{card.title}</h3>
                <p className={`text-sm leading-relaxed relative z-10 ${s.desc}`}>{card.description}</p>

                {/* Arrow */}
                <ArrowUpLeft className={`w-4 h-4 absolute top-6 left-6 transition-all duration-200 ${s.arrow}`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
