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
    rating: 5,
  },
  {
    text: 'צוות הניקיון מקבל משימות ישירות לטלפון עם כל הפרטים. אף פעם לא היה כל כך פשוט לתאם.',
    author: 'שירה לוי',
    role: 'מנהלת 8 צימרים בגליל',
    initials: 'ש',
    avatarGrad: 'from-purple-400 to-pink-500',
    metric: '100%',
    metricLabel: 'תיאום מוצלח',
    rating: 5,
  },
  {
    text: 'המערכת מזכירה לי אוטומטית לגבות יתרות ומונעת טעויות. השקט הנפשי שקיבלתי לא יסולא בפז.',
    author: 'רון אברהם',
    role: 'בעל מתחם אירוח יוקרה',
    initials: 'ר',
    avatarGrad: 'from-amber-400 to-orange-500',
    metric: '₪0',
    metricLabel: 'חובות אבודים',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-[#F4F6FB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ביקורות לקוחות
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            בעלי נכסים ממליצים
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            גלו מה אומרים לקוחות שעברו ל-ATLAS
          </p>
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-base leading-relaxed mb-6 flex-1">
                "{t.text}"
              </p>

              {/* Metric highlight */}
              <div className="mb-5 px-4 py-3 bg-[#F4F6FB] rounded-2xl flex items-center gap-3">
                <div>
                  <div className="text-2xl font-bold text-[#0B1220]">{t.metric}</div>
                  <div className="text-xs text-gray-500">{t.metricLabel}</div>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarGrad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.author}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#0B1220] rounded-3xl p-8 md:p-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-x-reverse md:divide-white/10">
            {[
              { value: '4.9', label: 'דירוג ממוצע', sub: 'מבוסס על מאות ביקורות' },
              { value: '200+', label: 'לקוחות מרוצים', sub: 'ועוד מצטרפים כל שבוע' },
              { value: '98%', label: 'שביעות רצון', sub: 'לקוחות שממשיכים לעשות שימוש' },
            ].map((stat, i) => (
              <div key={i} className="text-center md:px-10">
                <div className="text-5xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-base font-semibold text-white/80 mb-1">{stat.label}</div>
                <div className="text-sm text-white/40">{stat.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
