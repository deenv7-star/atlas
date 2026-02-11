import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Star, Award, TrendingUp, Users } from 'lucide-react';

const testimonials = [
  {
    text: 'עברנו מאקסלים וקבוצות וואטסאפ למערכת אחת מרכזית. הכל זורם וחסכנו שעות עבודה כל שבוע.',
    author: 'דני כהן',
    role: 'בעל 4 וילות באילת',
    rating: 5,
    image: 'https://ui-avatars.com/api/?name=D+K&background=00D1C1&color=0B1220&size=120&bold=true&font-size=0.4',
    metric: '12 שעות',
    metricLabel: 'חיסכון שבועי'
  },
  {
    text: 'צוות הניקיון מקבל משימות ישירות לטלפון עם כל הפרטים. אף פעם לא היה כל כך פשוט לתאם.',
    author: 'שירה לוי',
    role: 'מנהלת 8 צימרים בגליל',
    rating: 5,
    image: 'https://ui-avatars.com/api/?name=S+L&background=00D1C1&color=0B1220&size=120&bold=true&font-size=0.4',
    metric: '100%',
    metricLabel: 'תיאום מוצלח'
  },
  {
    text: 'המערכת מזכירה לי אוטומטית לגבות יתרות ומונעת טעויות. השקט הנפשי שקיבלתי לא יסולא בפז.',
    author: 'רון אברהם',
    role: 'בעל מתחם אירוח יוקרה',
    rating: 5,
    image: 'https://ui-avatars.com/api/?name=R+A&background=00D1C1&color=0B1220&size=120&bold=true&font-size=0.4',
    metric: '₪0',
    metricLabel: 'חובות אבודים'
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-[#0B1220] via-[#1a2744] to-[#0B1220] relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="testimonialsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D1C1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#00D1C1" stopOpacity="0.05" />
          </linearGradient>
          <pattern id="testimonialsDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#00D1C1" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#testimonialsDots)" />
        
        {/* Animated background shapes */}
        <motion.circle
          cx="10%" cy="20%" r="200"
          fill="url(#testimonialsGrad)"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="90%" cy="80%" r="250"
          fill="url(#testimonialsGrad)"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="50%" cy="50%" r="300"
          fill="url(#testimonialsGrad)"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* Decorative illustration */}
      <div className="absolute top-10 left-10 opacity-10">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <motion.path
            d="M20 60 Q 60 20, 100 60 T 180 60"
            stroke="#00D1C1"
            strokeWidth="2"
            fill="none"
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          {[...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              cx={20 + i * 20}
              cy={60}
              r="3"
              fill="#00D1C1"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D1C1]/10 border border-[#00D1C1]/30 rounded-full mb-6"
          >
            <Award className="w-5 h-5 text-[#00D1C1]" />
            <span className="text-[#00D1C1] font-semibold">מדורגים #1 בישראל</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            בעלי נכסים{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[#00D1C1] to-[#00F5E0] bg-clip-text text-transparent">
                ממליצים
              </span>
              <motion.div
                className="absolute bottom-2 left-0 right-0 h-3 bg-[#00D1C1]/20 rounded"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">
            גלו מה אומרים לקוחות שעברו ל-ATLAS ושינו את אופן ניהול הנכסים שלהם
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, rotateY: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ 
                delay: i * 0.15, 
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
            >
              <Card className="h-full bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl hover:bg-white/10 transition-all duration-500 group relative overflow-hidden">
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00D1C1]/0 via-[#00D1C1]/0 to-[#00D1C1]/0 group-hover:from-[#00D1C1]/5 group-hover:via-[#00D1C1]/10 group-hover:to-[#00D1C1]/5 transition-all duration-500 rounded-3xl" />
                
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00D1C1]/10 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-8 relative z-10">
                  {/* Quote icon with animation */}
                  <motion.div 
                    className="mb-6 relative"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <div className="absolute inset-0 bg-[#00D1C1]/20 blur-xl rounded-full" />
                    <Quote className="h-12 w-12 text-[#00D1C1] relative z-10" strokeWidth={1.5} />
                  </motion.div>

                  {/* Stars with stagger animation */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <motion.div
                        key={j}
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 + j * 0.1, type: "spring" }}
                      >
                        <Star 
                          className="h-5 w-5 fill-[#00D1C1] text-[#00D1C1] drop-shadow-[0_0_8px_rgba(0,209,193,0.5)]" 
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Testimonial text with better typography */}
                  <p className="text-white text-lg leading-relaxed mb-8 font-light">
                    <span className="text-[#00D1C1] text-2xl font-serif">"</span>
                    {testimonial.text}
                    <span className="text-[#00D1C1] text-2xl font-serif">"</span>
                  </p>

                  {/* Metric highlight */}
                  <motion.div 
                    className="mb-6 p-4 bg-gradient-to-r from-[#00D1C1]/10 to-[#00D1C1]/5 rounded-2xl border border-[#00D1C1]/20"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-3xl font-bold text-[#00D1C1] mb-1">
                      {testimonial.metric}
                    </div>
                    <div className="text-sm text-white/60">
                      {testimonial.metricLabel}
                    </div>
                  </motion.div>

                  {/* Author info with enhanced design */}
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-[#00D1C1] rounded-full blur-lg opacity-30"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <img 
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-16 h-16 rounded-full ring-2 ring-[#00D1C1]/50 relative z-10 shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00D1C1] rounded-full flex items-center justify-center z-20 shadow-lg">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M3 6 L5 8 L9 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg mb-1">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-white/60 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Enhanced trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D1C1]/5 via-[#00D1C1]/10 to-[#00D1C1]/5 blur-2xl" />
            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-[#00D1C1] blur-2xl opacity-30"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <div className="relative bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
                        <Star className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    4.9
                  </div>
                  <div className="text-white/60 font-medium">דירוג ממוצע</div>
                  <div className="flex justify-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#00D1C1] text-[#00D1C1]" />
                    ))}
                  </div>
                </motion.div>

                <div className="hidden md:flex items-center justify-center">
                  <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                </div>

                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-[#00D1C1] blur-2xl opacity-30"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 3, delay: 0.5, repeat: Infinity }}
                      />
                      <div className="relative bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    200+
                  </div>
                  <div className="text-white/60 font-medium">לקוחות מרוצים</div>
                  <motion.div 
                    className="mt-3 text-sm text-[#00D1C1]"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ועוד הרבה בדרך
                  </motion.div>
                </motion.div>

                <div className="hidden md:flex items-center justify-center">
                  <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                </div>

                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-[#00D1C1] blur-2xl opacity-30"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 3, delay: 1, repeat: Infinity }}
                      />
                      <div className="relative bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    98%
                  </div>
                  <div className="text-white/60 font-medium">שביעות רצון</div>
                  <div className="mt-3 text-sm text-white/40">
                    מתוך 180+ סקרים
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}