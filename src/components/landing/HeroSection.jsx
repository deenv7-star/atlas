import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Calendar, CreditCard, MessageSquare, TrendingUp, Star } from 'lucide-react';

function DashboardPreview() {
  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#e8f4f8] via-[#d4eef6] to-[#c5e8f2] flex items-center justify-center p-6">
      {/* Soft glow blobs */}
      <div className="absolute top-8 right-8 w-40 h-40 bg-[#00D1C1]/25 rounded-full blur-3xl" />
      <div className="absolute bottom-8 left-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />

      {/* Dashboard mockup */}
      <div className="relative z-10 w-full space-y-3">
        {/* Top stat row */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/60"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">הכנסות החודש</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">₪24,800</div>
            <div className="text-xs text-emerald-600 font-medium">↑ 18% מהחודש שעבר</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0B1220]/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/60">הזמנות פעילות</span>
              <Calendar className="h-3.5 w-3.5 text-[#00D1C1]" />
            </div>
            <div className="text-xl font-bold text-white">14</div>
            <div className="text-xs text-[#00D1C1] font-medium">3 כניסות היום</div>
          </motion.div>
        </div>

        {/* Booking list card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/60"
        >
          <div className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1] inline-block" />
            הזמנות קרובות
          </div>
          {[
            { name: 'משפחת לוי', date: '15/7', status: 'מאושר', color: 'bg-emerald-100 text-emerald-700' },
            { name: 'דני כהן', date: '16/7', status: 'ממתין', color: 'bg-amber-100 text-amber-700' },
          ].map((b, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00D1C1]/30 to-purple-300/30 flex items-center justify-center text-xs font-bold text-gray-700">
                  {b.name[0]}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-800">{b.name}</div>
                  <div className="text-[10px] text-gray-400">{b.date}</div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.color}`}>{b.status}</span>
            </div>
          ))}
        </motion.div>

        {/* Bottom row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: MessageSquare, label: 'הודעות', val: '24', color: 'text-purple-500' },
            { icon: CreditCard, label: 'תשלומים', val: '₪8K', color: 'text-[#00D1C1]' },
            { icon: Star, label: 'ביקורות', val: '4.9', color: 'text-amber-500' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center shadow-sm border border-white/60"
            >
              <item.icon className={`h-4 w-4 mx-auto mb-1 ${item.color}`} />
              <div className="text-sm font-bold text-gray-900">{item.val}</div>
              <div className="text-[10px] text-gray-400">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection({ onLoginClick }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#F4F6FB]">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      {/* Background glow orbs */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-[#00D1C1]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* Right column — text (RTL = start) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-[#00D1C1] animate-pulse" />
              פלטפורמת ניהול נכסים #1 בישראל
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.1] tracking-tight mb-5 text-gray-900"
            >
              נהלו את הנכסים
              <br />
              <span className="text-[#00D1C1]">שלכם בחכמה</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md"
            >
              ניהול הזמנות, לידים, תשלומים וניקיון — כל מה שצריך כדי להפעיל נכסי נופש ברמה הגבוהה ביותר, במקום אחד.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <Button
                size="lg"
                onClick={onLoginClick}
                className="bg-[#0B1220] hover:bg-[#1a2744] text-white text-base px-8 h-12 font-semibold rounded-2xl shadow-lg shadow-gray-900/15 transition-all hover:shadow-xl hover:shadow-gray-900/20"
              >
                התחל עכשיו
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white border-gray-200 hover:border-[#00D1C1] hover:bg-[#00D1C1]/5 text-gray-800 text-base px-8 h-12 font-semibold rounded-2xl transition-all gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-[#0B1220] flex items-center justify-center">
                  <Play className="w-3 h-3 text-white fill-white mr-[-1px]" />
                </div>
                צפו בהדגמה
              </Button>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['from-teal-300 to-cyan-400', 'from-purple-300 to-pink-400', 'from-amber-300 to-orange-400', 'from-blue-300 to-indigo-400'].map((g, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} border-2 border-[#F4F6FB]`} />
                  ))}
                </div>
                <div className="mr-1">
                  <div className="text-sm font-bold text-gray-900">+5,000</div>
                  <div className="text-xs text-gray-400">לקוחות מרוצים</div>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <div className="text-xs text-gray-400">דירוג 4.9/5 ממוצע</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Left column — visual container (RTL = end) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="order-2 lg:order-1"
          >
            <DashboardPreview />
          </motion.div>
        </div>

        {/* Bottom stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-2xl p-5 shadow-sm"
        >
          <div className="grid grid-cols-3 gap-4 divide-x divide-x-reverse divide-gray-100">
            {[
              { value: '87%', label: 'חיסכון בזמן ניהולי', sub: 'בממוצע ללקוח' },
              { value: '25K+', label: 'הזמנות מנוהלות', sub: 'מדי חודש בפלטפורמה' },
              { value: '56K', label: 'משתמשים הצטרפו', sub: 'ועוד מצטרפים כל יום' },
            ].map((stat, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-0.5">{stat.value}</div>
                <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
