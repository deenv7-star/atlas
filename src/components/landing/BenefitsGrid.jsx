import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingDown, Users, Smile } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'חיסכו זמן יקר',
    description: 'בניהול היום יומי של העסק',
    color: 'from-blue-400 to-cyan-500',
    delay: 0
  },
  {
    icon: TrendingDown,
    title: 'הפחיתו ביטולים',
    description: 'של תורים והזמנות',
    color: 'from-purple-400 to-pink-500',
    delay: 0.1
  },
  {
    icon: Users,
    title: 'העלו את כמות הלקוחות',
    description: 'החדשים בעסק שלכם',
    color: 'from-green-400 to-emerald-500',
    delay: 0.2
  },
  {
    icon: Smile,
    title: 'האפליקציה המועדפת',
    description: 'על בעלי הנכסים בישראל',
    color: 'from-orange-400 to-red-500',
    delay: 0.3
  }
];

export default function BenefitsGrid() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: benefit.delay, duration: 0.4 }}
              className="relative group"
            >
              <div className="relative p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                {/* Static background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                {/* Icon */}
                <div className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center relative z-10`}>
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Text content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 relative z-10">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}