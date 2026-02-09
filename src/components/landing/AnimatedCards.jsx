import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Building2, TrendingUp, Wallet } from 'lucide-react';

const cards = [
  {
    icon: Building2,
    title: 'ניהול נכסים מלא',
    subtitle: 'מכל מכשיר',
    gradient: 'from-green-400/20 to-emerald-500/20',
    color: 'text-green-600',
    rotate: -6,
  },
  {
    icon: TrendingUp,
    title: 'אוטומציות חכמות',
    subtitle: 'חוסכות זמן',
    gradient: 'from-purple-400/20 to-pink-500/20',
    color: 'text-purple-600',
    rotate: 0,
  },
  {
    icon: Wallet,
    title: 'ניהול פיננסי מלא',
    subtitle: 'תשלומים וחשבונאות',
    gradient: 'from-orange-400/20 to-yellow-500/20',
    color: 'text-orange-600',
    rotate: 6,
  },
];

export default function AnimatedCards() {
  return (
    <div className="relative h-[400px] flex items-center justify-center">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{ opacity: 0, y: 100, rotate: 0 }}
          whileInView={{ 
            opacity: 1, 
            y: 0, 
            rotate: card.rotate,
            transition: { 
              delay: index * 0.2,
              type: "spring",
              stiffness: 100
            }
          }}
          whileHover={{ 
            y: -20, 
            rotate: 0,
            scale: 1.05,
            zIndex: 10,
            transition: { type: "spring", stiffness: 300 }
          }}
          viewport={{ once: true }}
          style={{
            zIndex: cards.length - index,
          }}
        >
          <Card className={`w-80 h-64 bg-gradient-to-br ${card.gradient} backdrop-blur-xl border-2 border-white/20 shadow-2xl hover:shadow-[#00D1C1]/20 transition-all`}>
            <div className="p-8 h-full flex flex-col justify-between">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon className={`w-8 h-8 ${card.color}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className={`text-lg font-medium ${card.color}`}>{card.subtitle}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}