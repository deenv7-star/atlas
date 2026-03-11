import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingDown, Users, Smile, ArrowUpLeft } from 'lucide-react';

const cards = [
  {
    type: 'dark',
    icon: Clock,
    title: 'חסכו שעות עבודה',
    description: 'אוטומציות חכמות מנהלות את העסק בשבילכם — גם כשאתם ישנים.',
    delay: 0,
  },
  {
    type: 'light',
    icon: TrendingDown,
    title: 'הפחיתו ביטולים',
    description: 'תזכורות אוטומטיות ותקשורת רציפה עם האורחים מונעות ביטולים של הזמנות.',
    delay: 0.1,
  },
  {
    type: 'accent',
    icon: Users,
    title: 'העלו את כמות הלקוחות',
    description: 'ניהול לידים מסודר ומעקב אחר כל פנייה מגדיל את שיעור ההמרה.',
    delay: 0.2,
  },
  {
    type: 'neutral',
    icon: Smile,
    title: 'האפליקציה המועדפת',
    description: 'מאות בעלי נכסים בישראל כבר בחרו באטלס כמערכת הניהול המרכזית שלהם.',
    delay: 0.3,
  },
];

const cardStyles = {
  dark: {
    wrapper: 'bg-[#0B1220] text-white',
    icon: 'bg-white/10 text-[#00D1C1]',
    title: 'text-white',
    desc: 'text-white/60',
    arrow: 'text-white/40 group-hover:text-white/80',
  },
  light: {
    wrapper: 'bg-white border border-gray-100',
    icon: 'bg-[#F4F6FB] text-[#00D1C1]',
    title: 'text-gray-900',
    desc: 'text-gray-500',
    arrow: 'text-gray-300 group-hover:text-gray-500',
  },
  accent: {
    wrapper: 'bg-[#00D1C1] text-white',
    icon: 'bg-white/20 text-white',
    title: 'text-white',
    desc: 'text-white/70',
    arrow: 'text-white/40 group-hover:text-white/90',
  },
  neutral: {
    wrapper: 'bg-[#F4F6FB] border border-gray-100',
    icon: 'bg-white text-gray-700',
    title: 'text-gray-900',
    desc: 'text-gray-500',
    arrow: 'text-gray-300 group-hover:text-gray-500',
  },
};

export default function BenefitsGrid() {
  return (
    <section className="py-24 bg-[#F4F6FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              למה לבחור אטלס
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              יתרונות שתרגישו
              <br />
              כבר מהיום הראשון
            </h2>
          </div>
          <p className="text-gray-500 max-w-xs text-base leading-relaxed sm:text-left">
            הכלים שמשנים את הדרך שבה בעלי נכסים מנהלים את העסק שלהם.
          </p>
        </motion.div>

        {/* Card grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => {
            const s = cardStyles[card.type];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: card.delay, duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group relative p-7 rounded-3xl shadow-sm cursor-default transition-shadow hover:shadow-xl ${s.wrapper}`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${s.icon}`}>
                  <card.icon className="w-5 h-5" />
                </div>

                {/* Text */}
                <h3 className={`text-lg font-bold mb-2 ${s.title}`}>{card.title}</h3>
                <p className={`text-sm leading-relaxed ${s.desc}`}>{card.description}</p>

                {/* Arrow link indicator */}
                <ArrowUpLeft className={`w-5 h-5 absolute top-6 left-6 transition-all ${s.arrow}`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
