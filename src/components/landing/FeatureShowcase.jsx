import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Wallet, Brush, Send, FileSignature, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'תשלומים ופיננסים',
    description: 'ניהול תשלומים, חשבוניות וחשבונאות בקליק אחד',
    color: 'from-green-400 to-emerald-500',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
  },
  {
    icon: Brush,
    title: 'ניהול ניקיון',
    description: 'תיאום משימות ניקיון אוטומטי לפני כל כניסה',
    color: 'from-orange-400 to-red-500',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
  },
  {
    icon: Send,
    title: 'הודעות אוטומטיות',
    description: 'WhatsApp, SMS ומייל - כל ההודעות בזמן האמת',
    color: 'from-pink-400 to-rose-500',
    image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=600&h=400&fit=crop',
  },
  {
    icon: FileSignature,
    title: 'חוזים דיגיטליים',
    description: 'יצירה וחתימה על חוזים מכל מכשיר',
    color: 'from-indigo-400 to-blue-500',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop',
  },
];

export default function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-[#00D1C1]/10 rounded-full mb-4">
            <span className="text-sm font-semibold text-[#00D1C1]">פיצ'רים מתקדמים</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            כל מה שצריך במקום אחד
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            פלטפורמה all-in-one שמשלבת את כל הכלים שצריכים לנהל נכסים בהצלחה
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left - Feature List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                onClick={() => setActiveFeature(index)}
                className="cursor-pointer"
              >
                <Card className={`p-6 transition-all hover:shadow-lg ${
                  activeFeature === index 
                    ? 'border-2 border-[#00D1C1] bg-gradient-to-r from-[#00D1C1]/5 to-transparent shadow-lg' 
                    : 'border-2 border-gray-100 hover:border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                    {activeFeature === index && (
                      <div className="w-6 h-6 rounded-full bg-[#00D1C1] flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Right - Feature Preview */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white transition-opacity duration-300">
              <img
                src={features[activeFeature].image}
                alt={features[activeFeature].title}
                className="w-full h-[500px] object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${features[activeFeature].color} opacity-20`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}