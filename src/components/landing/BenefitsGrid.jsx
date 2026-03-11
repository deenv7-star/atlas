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
    accent: '#00D1C1',
  },
  {
    type: 'light',
    icon: TrendingDown,
    title: 'הפחיתו ביטולים',
    description: 'תזכורות אוטומטיות ותקשורת רציפה עם האורחים מונעות ביטולים של הזמנות.',
    delay: 0.1,
    accent: '#6366f1',
  },
  {
    type: 'accent',
    icon: Users,
    title: 'העלו את כמות הלקוחות',
    description: 'ניהול לידים מסודר ומעקב אחר כל פנייה מגדיל את שיעור ההמרה.',
    delay: 0.2,
    accent: '#00D1C1',
  },
  {
    type: 'neutral',
    icon: Smile,
    title: 'האפליקציה המועדפת',
    description: 'מאות בעלי נכסים בישראל כבר בחרו באטלס כמערכת הניהול המרכזית שלהם.',
    delay: 0.3,
    accent: '#f59e0b',
  },
];

export default function BenefitsGrid() {
  return (
    <section className="py-28 relative overflow-hidden"
             style={{ background: '#ffffff' }}>

      {/* Noise texture */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ opacity: 0.025, backgroundImage: 'radial-gradient(circle, rgba(11,18,32,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center, rgba(0,209,193,0.08) 0%, transparent 65%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="section-label mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              למה לבחור אטלס
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1220] leading-tight tracking-tight">
              יתרונות שתרגישו
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #0B1220 0%, #374151 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                כבר מהיום הראשון
              </span>
            </h2>
          </div>
          <p className="text-gray-500 max-w-xs text-base leading-relaxed font-medium">
            הכלים שמשנים את הדרך שבה בעלי נכסים מנהלים את העסק שלהם.
          </p>
        </motion.div>

        {/* Card grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: card.delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.015, transition: { duration: 0.2 } }}
              className="group relative p-7 rounded-3xl cursor-default"
              style={
                card.type === 'dark'
                  ? {
                      background: 'linear-gradient(145deg, #0B1220 0%, #1a2744 100%)',
                      boxShadow: '0 8px 32px rgba(11,18,32,0.20), 0 2px 6px rgba(11,18,32,0.12)',
                    }
                  : card.type === 'accent'
                  ? {
                      background: 'linear-gradient(145deg, #00D1C1 0%, #00a8a0 100%)',
                      boxShadow: '0 8px 32px rgba(0,209,193,0.28), 0 2px 6px rgba(0,209,193,0.15)',
                    }
                  : card.type === 'light'
                  ? {
                      background: 'rgba(255,255,255,0.90)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.8)',
                      boxShadow: '0 4px 16px rgba(11,18,32,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                    }
                  : {
                      background: 'rgba(244,246,251,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(226,232,240,0.8)',
                      boxShadow: '0 4px 16px rgba(11,18,32,0.05)',
                    }
              }
            >
              {/* Gradient accent top line */}
              {(card.type === 'light' || card.type === 'neutral') && (
                <div className="absolute top-0 left-6 right-6 h-px rounded-b-full"
                     style={{ background: `linear-gradient(90deg, transparent, ${card.accent}40, transparent)` }} />
              )}

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                   style={{
                     background: card.type === 'dark'
                       ? 'radial-gradient(ellipse at 30% 20%, rgba(0,209,193,0.08) 0%, transparent 60%)'
                       : card.type === 'accent'
                       ? 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)'
                       : `radial-gradient(ellipse at 30% 20%, ${card.accent}0f 0%, transparent 60%)`,
                   }} />

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                   style={
                     card.type === 'dark'
                       ? { background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }
                       : card.type === 'accent'
                       ? { background: 'rgba(255,255,255,0.20)' }
                       : { background: `${card.accent}12`, border: `1px solid ${card.accent}25` }
                   }>
                <card.icon className="w-5 h-5"
                           style={{ color: card.type === 'dark' ? '#00D1C1' : card.type === 'accent' ? '#ffffff' : card.accent }} />
              </div>

              {/* Text */}
              <h3 className="text-lg font-bold mb-2.5 leading-tight"
                  style={{ color: (card.type === 'dark' || card.type === 'accent') ? '#ffffff' : '#0B1220' }}>
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed"
                 style={{ color: (card.type === 'dark' || card.type === 'accent') ? 'rgba(255,255,255,0.65)' : '#6b7280' }}>
                {card.description}
              </p>

              {/* Arrow indicator */}
              <ArrowUpLeft className="w-4 h-4 absolute top-6 left-6 transition-all duration-200"
                           style={{
                             color: (card.type === 'dark' || card.type === 'accent')
                               ? 'rgba(255,255,255,0.25)'
                               : 'rgba(11,18,32,0.15)',
                             opacity: 0,
                           }}
              />
              <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowUpLeft className="w-4 h-4"
                             style={{ color: (card.type === 'dark' || card.type === 'accent') ? 'rgba(255,255,255,0.6)' : card.accent }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
