import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Building2, CalendarCheck, Zap } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: Building2,
    title: 'הגדירו את הנכסים',
    desc: 'הוסיפו את המתחמים שלכם עם כל הפרטים הרלוונטיים במהירות'
  },
  {
    step: '02',
    icon: CalendarCheck,
    title: 'חברו את היומן',
    desc: 'סנכרון אוטומטי עם Airbnb, Booking.com ופלטפורמות נוספות'
  },
  {
    step: '03',
    icon: Zap,
    title: 'תנו למערכת לעבוד',
    desc: 'אוטומציות חכמות מנהלות הכל - מלידים ועד תשלומים וניקיון'
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-[#F8FAFC]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B1220] mb-4">
            איך זה עובד?
          </h2>
          <p className="text-xl text-gray-600">
            שלושה שלבים פשוטים והתחלתם
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting arrows for desktop */}
          <div className="hidden md:block absolute top-32 left-0 right-0 h-0.5">
            <div className="relative h-full">
              <ArrowLeft className="absolute left-1/3 -top-3 h-6 w-6 text-[#00D1C1]" />
              <ArrowLeft className="absolute left-2/3 -top-3 h-6 w-6 text-[#00D1C1]" />
            </div>
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              className="relative"
            >
              <Card className="group hover:shadow-2xl transition-all duration-500 border-0 rounded-3xl overflow-hidden bg-white p-8 text-center">
                {/* Step number badge */}
                <div className="w-20 h-20 bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
                  <span className="text-3xl font-bold text-white">{step.step}</span>
                </div>

                {/* Icon */}
                <div className="w-24 h-24 bg-[#00D1C1]/10 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:bg-[#00D1C1] transition-colors duration-300">
                  <step.icon className="h-12 w-12 text-[#00D1C1] group-hover:text-white transition-colors duration-300" />
                </div>
                
                <h3 className="text-2xl font-bold text-[#0B1220] mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D1C1]/10 rounded-full text-[#0B1220] font-medium">
            <span>הכל מוכן תוך פחות מ-15 דקות</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}