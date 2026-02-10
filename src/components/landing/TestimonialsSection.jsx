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
    image: 'https://ui-avatars.com/api/?name=D+K&background=00D1C1&color=0B1220&size=80'
  },
  {
    text: 'צוות הניקיון מקבל משימות ישירות לטלפון עם כל הפרטים. אף פעם לא היה כל כך פשוט לתאם.',
    author: 'שירה לוי',
    role: 'מנהלת 8 צימרים בגליל',
    rating: 5,
    image: 'https://ui-avatars.com/api/?name=S+L&background=00D1C1&color=0B1220&size=80'
  },
  {
    text: 'המערכת מזכירה לי אוטומטית לגבות יתרות ומונעת טעויות. השקט הנפשי שקיבלתי לא יסולא בפז.',
    author: 'רון אברהם',
    role: 'בעל מתחם אירוח יוקרה',
    rating: 5,
    image: 'https://ui-avatars.com/api/?name=R+A&background=00D1C1&color=0B1220&size=80'
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-[#0B1220] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D1C1] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00D1C1] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            בעלי נכסים ממליצים
          </h2>
          <p className="text-xl text-white/70">
            גלו מה אומרים לקוחות שעברו ל-ATLAS
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <Card className="h-full bg-white/5 border-white/10 backdrop-blur-sm rounded-3xl hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-8">
                  {/* Quote icon */}
                  <div className="mb-6 relative">
                    <Quote className="h-10 w-10 text-[#00D1C1] opacity-50" />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star 
                        key={j} 
                        className="h-5 w-5 fill-[#00D1C1] text-[#00D1C1]" 
                      />
                    ))}
                  </div>

                  {/* Testimonial text */}
                  <p className="text-white/90 text-lg leading-relaxed mb-8">
                    "{testimonial.text}"
                  </p>

                  {/* Author info */}
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                    <img 
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-14 h-14 rounded-full ring-2 ring-[#00D1C1]/30"
                    />
                    <div>
                      <div className="font-semibold text-white">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-white/60">
                        {testimonial.role}
                      </div>
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
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div>
              <div className="text-3xl font-bold text-white">4.9</div>
              <div className="text-sm text-white/60">דירוג ממוצע</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <div className="text-3xl font-bold text-white">200+</div>
              <div className="text-sm text-white/60">לקוחות מרוצים</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm text-white/60">שביעות רצון</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}