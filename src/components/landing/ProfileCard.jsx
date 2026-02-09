import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, CheckCircle2, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfileCard({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", duration: 0.8 }}
      className={className}
    >
      <Card className="max-w-sm overflow-hidden border-2 border-gray-200 shadow-2xl">
        {/* Header with gradient */}
        <div className="h-24 bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] relative">
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            style={{
              backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 75%, transparent 75%)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        <CardContent className="p-6 -mt-12 relative">
          {/* Profile Picture */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-400 border-4 border-white shadow-xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-4xl">
                👨‍💼
              </div>
            </div>
            {/* Verified Badge */}
            <motion.div
              className="absolute -bottom-1 -right-1 bg-[#00D1C1] rounded-full p-1.5 border-4 border-white shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
            </motion.div>
          </div>

          {/* Name and Title */}
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">דני רוזן</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>תל אביב-יפו</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="font-semibold text-gray-900">4.9</span>
            <span className="text-sm text-gray-500">(127 ביקורות)</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">85</p>
              <p className="text-xs text-gray-600">הזמנות</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-2xl font-bold text-gray-900">5+</p>
              <p className="text-xs text-gray-600">שנות ניסיון</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#00D1C1]">100%</p>
              <p className="text-xs text-gray-600">שביעות רצון</p>
            </div>
          </div>

          {/* About */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">אודות</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              מנהל נכסים מקצועי עם ניסיון של 5+ שנים. מתמחה בניהול וילות ונכסי יוקרה באזור המרכז.
            </p>
          </div>

          {/* Pricing */}
          <div className="mb-4 p-3 bg-gradient-to-br from-[#00D1C1]/10 to-cyan-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">תמחור</span>
              <span className="text-xl font-bold text-gray-900">₪250-₪400</span>
            </div>
            <span className="text-xs text-gray-500">ללילה</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] text-white font-semibold">
              <MessageSquare className="w-4 h-4 ml-2" />
              שלח הודעה
            </Button>
            <Button variant="outline" className="border-2 border-[#00D1C1] text-[#00D1C1] font-semibold">
              <Calendar className="w-4 h-4 ml-2" />
              קבע תיאום
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}