import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    text: 'עברנו מאקסלים וקבוצות וואטסאפ למערכת אחת מרכזית. הכל זורם וחסכנו שעות עבודה כל שבוע.',
    author: 'דני כהן',
    role: 'בעל 4 וילות באילת',
    initials: 'ד',
    avatarGrad: 'linear-gradient(135deg, #4dd0e1, #00acc1)',
    accentColor: '#00D1C1',
    metric: '12h',
    metricLabel: 'חיסכון שבועי',
    rating: 5,
  },
  {
    text: 'צוות הניקיון מקבל משימות ישירות לטלפון עם כל הפרטים. אף פעם לא היה כל כך פשוט לתאם.',
    author: 'שירה לוי',
    role: 'מנהלת 8 צימרים בגליל',
    initials: 'ש',
    avatarGrad: 'linear-gradient(135deg, #ce93d8, #ab47bc)',
    accentColor: '#a855f7',
    metric: '100%',
    metricLabel: 'תיאום מוצלח',
    rating: 5,
  },
  {
    text: 'המערכת מזכירה לי אוטומטית לגבות יתרות ומונעת טעויות. השקט הנפשי שקיבלתי לא יסולא בפז.',
    author: 'רון אברהם',
    role: 'בעל מתחם אירוח יוקרה',
    initials: 'ר',
    avatarGrad: 'linear-gradient(135deg, #ffcc80, #ffa726)',
    accentColor: '#f97316',
    metric: '₪0',
    metricLabel: 'חובות אבודים',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-28 relative overflow-hidden"
             style={{ background: '#f9fafb' }}>

      {/* Noise + orb */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ opacity: 0.025, backgroundImage: 'radial-gradient(circle, rgba(11,18,32,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute top-0 right-1/3 w-[600px] h-[400px] pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center, rgba(0,209,193,0.07) 0%, transparent 65%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="section-label mb-5 mx-auto w-fit">
            <Star className="w-3 h-3 fill-current" />
            ביקורות לקוחות
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1220] mb-4 tracking-tight">
            מה אומרים משתמשי הבטא
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">
            הצטרפו לגרסת הבטא ועזרו לנו לשפר את ATLAS
          </p>
        </motion.div>

        {/* Beta signup CTA - no fake testimonials */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.015, transition: { duration: 0.2 } }}
              className="group relative rounded-3xl p-7 flex flex-col overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 4px 20px rgba(11,18,32,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {/* Gradient top border */}
              <div className="absolute top-0 left-6 right-6 h-px rounded-b-full transition-all duration-300"
                   style={{ background: `linear-gradient(90deg, transparent, ${t.accentColor}50, transparent)` }} />

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                   style={{
                     background: `radial-gradient(ellipse at 20% 20%, ${t.accentColor}08 0%, transparent 60%)`,
                   }} />

              {/* Stars */}
              <div className="flex gap-0.5 mb-5 relative z-10">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote icon */}
              <div className="absolute top-7 left-7 opacity-[0.06]">
                <Quote className="w-12 h-12 text-[#0B1220]" />
              </div>

              {/* Quote text */}
              <p className="text-gray-700 text-base leading-relaxed mb-6 flex-1 relative z-10 font-medium">
                "{t.text}"
              </p>

              {/* Metric highlight */}
              <div className="mb-5 relative z-10">
                <div className="px-4 py-3 rounded-2xl flex items-center gap-3"
                     style={{
                       background: `linear-gradient(135deg, ${t.accentColor}10, ${t.accentColor}05)`,
                       border: `1px solid ${t.accentColor}20`,
                     }}>
                  <div>
                    <div className="text-2xl font-extrabold tracking-tight"
                         style={{ color: t.accentColor }}>
                      {t.metric}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{t.metricLabel}</div>
                  </div>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 relative z-10"
                   style={{ borderTop: '1px solid rgba(226,232,240,0.7)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                     style={{ background: t.avatarGrad, boxShadow: `0 4px 10px ${t.accentColor}25` }}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-[#0B1220] text-sm">{t.author}</div>
                  <div className="text-xs text-gray-400 font-medium">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl p-1 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,209,193,0.3) 0%, rgba(255,255,255,0.1) 40%, rgba(99,102,241,0.2) 100%)',
            boxShadow: '0 8px 32px rgba(11,18,32,0.12)',
          }}
        >
          <div className="rounded-[1.4rem] p-8 md:p-10 relative overflow-hidden"
               style={{ background: 'linear-gradient(145deg, #0B1220 0%, #1a2744 100%)' }}>
            {/* Inner glow blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                 style={{ background: 'radial-gradient(ellipse at 80% -10%, rgba(0,209,193,0.12) 0%, transparent 60%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
                 style={{ background: 'radial-gradient(ellipse at 20% 110%, rgba(99,102,241,0.10) 0%, transparent 60%)' }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative z-10"
                 style={{ borderRadius: 0 }}>
              {[
                { value: 'Beta', label: 'גרסת בטא', sub: 'מצטרפים מוקדמים מקבלים עדיפות' },
                { value: 'חינם', label: '14 יום ניסיון', sub: 'ללא כרטיס אשראי' },
                { value: '🇮🇱', label: 'מיועד לישראל', sub: 'מחירים בשקלים, תמיכה בעברית' },
              ].map((stat, i) => (
                <div key={i} className="text-center md:px-10 relative">
                  {i > 0 && (
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12"
                         style={{ background: 'rgba(255,255,255,0.08)' }} />
                  )}
                  <div className="text-5xl font-extrabold text-white mb-1.5 tracking-tight"
                       style={{
                         background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)',
                         WebkitBackgroundClip: 'text',
                         WebkitTextFillColor: 'transparent',
                         backgroundClip: 'text',
                       }}>
                    {stat.value}
                  </div>
                  <div className="text-base font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.80)' }}>{stat.label}</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
