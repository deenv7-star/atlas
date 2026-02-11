import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    text: 'עברנו מאקסלים וקבוצות וואטסאפ למערכת אחת מרכזית. הכל זורם וחסכנו שעות עבודה כל שבוע.',
    author: 'דני כהן',
    role: 'בעל 4 וילות באילת',
    rating: 5,
    metric: '12 שעות',
    metricLabel: 'חיסכון שבועי'
  },
  {
    text: 'צוות הניקיון מקבל משימות ישירות לטלפון עם כל הפרטים. אף פעם לא היה כל כך פשוט לתאם.',
    author: 'שירה לוי',
    role: 'מנהלת 8 צימרים בגליל',
    rating: 5,
    metric: '100%',
    metricLabel: 'תיאום מוצלח'
  },
  {
    text: 'המערכת מזכירה לי אוטומטית לגבות יתרות ומונעת טעויות. השקט הנפשי שקיבלתי לא יסולא בפז.',
    author: 'רון אברהם',
    role: 'בעל מתחם אירוח יוקרה',
    rating: 5,
    metric: '₪0',
    metricLabel: 'חובות אבודים'
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-white relative overflow-hidden">
      {/* Simple background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-[#00D1C1]/10 rounded-full mb-4">
            <span className="text-[#00D1C1] font-semibold text-sm">ביקורות לקוחות</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B1220] mb-4">
            בעלי נכסים ממליצים
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            גלו מה אומרים לקוחות שעברו ל-ATLAS
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card className="h-full border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardContent className="p-8">
                  {/* Quote icon */}
                  <Quote className="h-10 w-10 text-[#00D1C1] mb-4 opacity-40" strokeWidth={1.5}/>

                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star 
                        key={j} 
                        className="h-4 w-4 fill-[#00D1C1] text-[#00D1C1]" 
                      />
                    ))}
                  </div>

                  {/* Testimonial text */}
                  <p className="text-gray-700 text-lg leading-relaxed mb-8">
                    "{testimonial.text}"
                  </p>

                  {/* Metric highlight */}
                  <div className="mb-6 p-4 bg-[#F8FAFC] rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-[#00D1C1] mb-1">
                      {testimonial.metric}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.metricLabel}
                    </div>
                  </div>

                  {/* Author info */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="font-semibold text-[#0B1220] mb-1">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-[#F8FAFC] rounded-2xl border border-gray-200 p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-5xl font-bold text-[#0B1220] mb-2">
                  4.9
                </div>
                <div className="text-gray-600 mb-3">דירוג ממוצע</div>
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#00D1C1] text-[#00D1C1]" />
                  ))}
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-px h-20 bg-gray-300" />
              </div>

              <div className="text-center">
                <div className="text-5xl font-bold text-[#0B1220] mb-2">
                  200+
                </div>
                <div className="text-gray-600">לקוחות מרוצים</div>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-px h-20 bg-gray-300" />
              </div>

              <div className="text-center">
                <div className="text-5xl font-bold text-[#0B1220] mb-2">
                  98%
                </div>
                <div className="text-gray-600">שביעות רצון</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}