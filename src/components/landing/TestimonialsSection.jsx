import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    text: 'עברנו מאקסלים וקבוצות וואטסאפ למערכת אחת מרכזית. הכל זורם וחסכנו שעות עבודה כל שבוע.',
    author: 'דני כהן',
    role: 'בעל 4 וילות באילת',
    initials: 'ד',
    avatarGrad: 'from-teal-400 to-cyan-500',
    metric: '12h',
    metricLabel: 'חיסכון שבועי',
    metricColor: 'text-teal-600',
    metricBg: 'bg-teal-50 border-teal-100',
    rating: 5,
    delay: 0,
  },
  {
    text: 'צוות הניקיון מקבל משימות ישירות לטלפון עם כל הפרטים. אף פעם לא היה כל כך פשוט לתאם.',
    author: 'שירה לוי',
    role: 'מנהלת 8 צימרים בגליל',
    initials: 'ש',
    avatarGrad: 'from-violet-400 to-purple-500',
    metric: '100%',
    metricLabel: 'תיאום מוצלח',
    metricColor: 'text-violet-600',
    metricBg: 'bg-violet-50 border-violet-100',
    rating: 5,
    delay: 0.1,
  },
  {
    text: 'המערכת מזכירה לי אוטומטית לגבות יתרות ומונעת טעויות. השקט הנפשי שקיבלתי לא יסולא בפז.',
    author: 'רון אברהם',
    role: 'בעל מתחם אירוח יוקרה',
    initials: 'ר',
    avatarGrad: 'from-amber-400 to-orange-500',
    metric: '₪0',
    metricLabel: 'חובות אבודים',
    metricColor: 'text-emerald-600',
    metricBg: 'bg-emerald-50 border-emerald-100',
    rating: 5,
    delay: 0.2,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-28 relative overflow-hidden bg-[#FAFBFF]">
      {/* Gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_100%,rgba(0,209,193,0.07)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,rgba(124,58,237,0.06)_0%,transparent_55%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5
            bg-white rounded-full border border-gray-200/80
            shadow-[0_2px_10px_rgba(0,0,0,0.06)]
            text-xs font-semibold text-gray-600 mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ביקורות לקוחות
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
              בעלי נכסים ממליצים
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            גלו מה אומרים לקוחות שעברו ל-ATLAS
          </p>
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: t.delay, duration: 0.5 }}
              whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
              className="group relative flex flex-col
                bg-white/80 backdrop-blur-xl
                rounded-3xl p-7
                border border-white/90
                shadow-[0_4px_24px_rgba(0,0,0,0.07)]
                hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]
                transition-shadow duration-300"
            >
              {/* Subtle inner top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent rounded-t-3xl" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-700 text-base leading-relaxed mb-6 flex-1">
                "{t.text}"
              </blockquote>

              {/* Metric */}
              <div className={`mb-5 px-4 py-3 rounded-2xl border flex items-center gap-3 ${t.metricBg}`}>
                <div>
                  <p className={`text-2xl font-black leading-none mb-0.5 ${t.metricColor}`}>{t.metric}</p>
                  <p className="text-xs text-gray-500 leading-none">{t.metricLabel}</p>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100/80">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarGrad}
                  flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                  shadow-[0_2px_8px_rgba(0,0,0,0.15)]`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-none mb-0.5">{t.author}</p>
                  <p className="text-xs text-gray-400 leading-none">{t.role}</p>
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
          className="relative overflow-hidden rounded-3xl bg-[#0B1220]
            shadow-[0_24px_64px_rgba(11,18,32,0.22)]"
        >
          {/* Glow blobs inside */}
          <div className="absolute top-0 right-1/4 w-64 h-32 bg-[#00D1C1]/12 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-32 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/8">
            {[
              { value: '4.9', label: 'דירוג ממוצע', sub: 'מבוסס על מאות ביקורות', stars: true },
              { value: '200+', label: 'לקוחות מרוצים', sub: 'ועוד מצטרפים כל שבוע' },
              { value: '98%', label: 'שביעות רצון', sub: 'לקוחות שממשיכים להשתמש' },
            ].map((s, i) => (
              <div key={i} className="text-center py-10 px-8">
                <p className="text-5xl font-black text-white mb-2 leading-none">{s.value}</p>
                {s.stars && (
                  <div className="flex justify-center gap-0.5 mb-2">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                )}
                <p className="text-base font-semibold text-white/80 mb-1">{s.label}</p>
                <p className="text-sm text-white/35">{s.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
