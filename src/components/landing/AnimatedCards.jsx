import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Building2, TrendingUp, Wallet } from 'lucide-react';

const cards = [
  {
    icon: Building2,
    title: 'ניהול נכסים מלא',
    subtitle: 'מכל מכשיר',
    gradient: 'from-gray-50 to-gray-100',
    color: 'text-[#0B1220]',
    rotate: -6,
  },
  {
    icon: TrendingUp,
    title: 'אוטומציות חכמות',
    subtitle: 'חוסכות זמן',
    gradient: 'from-[#00D1C1]/10 to-[#00D1C1]/5',
    color: 'text-[#00D1C1]',
    rotate: 0,
  },
  {
    icon: Wallet,
    title: 'ניהול פיננסי מלא',
    subtitle: 'תשלומים וחשבונאות',
    gradient: 'from-gray-50 to-gray-100',
    color: 'text-[#0B1220]',
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
          <Card className={`w-80 h-64 bg-gradient-to-br ${card.gradient} backdrop-blur-xl border shadow-lg hover:shadow-xl transition-all`}>
            <div className="p-8 h-full flex flex-col justify-between">
              <div className={`w-14 h-14 rounded-xl ${card.gradient === 'from-[#00D1C1]/10 to-[#00D1C1]/5' ? 'bg-[#00D1C1]/10' : 'bg-white'} border flex items-center justify-center`}>
                <card.icon className={`w-7 h-7 ${card.color}`} />
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