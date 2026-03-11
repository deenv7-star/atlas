import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Calendar, CreditCard, MessageSquare, TrendingUp, Star, Zap, Shield, CheckCircle } from 'lucide-react';

function DashboardPreview() {
  return (
    <div className="relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden flex items-center justify-center p-5"
         style={{
           background: 'linear-gradient(145deg, #e8f4f8 0%, #daeef6 40%, #cce7f0 100%)',
         }}>
      {/* Layered glow blobs */}
      <div className="absolute top-6 right-6 w-48 h-48 bg-[#00D1C1]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-40 h-40 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-cyan-300/10 rounded-full blur-2xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-30"
           style={{
             backgroundImage: 'linear-gradient(rgba(11,18,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(11,18,32,0.04) 1px, transparent 1px)',
             backgroundSize: '24px 24px',
           }} />

      {/* Dashboard mockup */}
      <div className="relative z-10 w-full space-y-3">
        {/* Top stat row */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-4 border"
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(16px)',
              borderColor: 'rgba(255,255,255,0.7)',
              boxShadow: '0 4px 16px rgba(11,18,32,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-500 font-medium">הכנסות החודש</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900 tracking-tight">₪24,800</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <span>↑</span> 18% מהחודש שעבר
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 100%)',
              boxShadow: '0 4px 16px rgba(11,18,32,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/50 font-medium">הזמנות פעילות</span>
              <div className="w-6 h-6 rounded-lg bg-[#00D1C1]/20 flex items-center justify-center">
                <Calendar className="h-3 w-3 text-[#00D1C1]" />
              </div>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">14</div>
            <div className="text-[11px] text-[#00D1C1] font-semibold mt-0.5">3 כניסות היום</div>
          </motion.div>
        </div>

        {/* Booking list card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-4 border"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(16px)',
            borderColor: 'rgba(255,255,255,0.7)',
            boxShadow: '0 4px 16px rgba(11,18,32,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">הזמנות קרובות</span>
          </div>
          {[
            { name: 'משפחת לוי', date: '15/7', status: 'מאושר', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            { name: 'דני כהן', date: '16/7', status: 'ממתין', color: 'bg-amber-50 text-amber-700 border-amber-100' },
          ].map((b, i) => (
            <div key={i} className={`flex items-center justify-between py-2 ${i < 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0B1220]"
                     style={{ background: 'linear-gradient(135deg, rgba(0,209,193,0.25) 0%, rgba(99,102,241,0.20) 100%)' }}>
                  {b.name[0]}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-800">{b.name}</div>
                  <div className="text-[10px] text-gray-400">{b.date}</div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${b.color}`}>{b.status}</span>
            </div>
          ))}
        </motion.div>

        {/* Bottom row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: MessageSquare, label: 'הודעות', val: '24', color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { icon: CreditCard, label: 'תשלומים', val: '₪8K', color: 'text-[#00D1C1]', bg: 'bg-[#00D1C1]/10' },
            { icon: Star, label: 'ביקורות', val: '4.9', color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.06 }}
              className="rounded-xl p-3 text-center border"
              style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(16px)',
                borderColor: 'rgba(255,255,255,0.7)',
                boxShadow: '0 2px 8px rgba(11,18,32,0.05)',
              }}
            >
              <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-1.5`}>
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
              <div className="text-sm font-bold text-gray-900 tracking-tight">{item.val}</div>
              <div className="text-[10px] text-gray-400 font-medium">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating notification chip */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="absolute -top-3 -left-3 z-20"
        style={{ animation: 'float 4s ease-in-out infinite' }}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold text-white"
             style={{
               background: 'linear-gradient(135deg, #0B1220, #1a2744)',
               boxShadow: '0 8px 24px rgba(11,18,32,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
             }}>
          <div className="w-4 h-4 rounded-full bg-[#00D1C1] flex items-center justify-center">
            <CheckCircle className="w-2.5 h-2.5 text-[#0B1220]" />
          </div>
          הזמנה אושרה!
        </div>
      </motion.div>

      {/* Floating metric badge */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -bottom-3 -right-3 z-20"
        style={{ animation: 'float-slow 6s ease-in-out infinite' }}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs"
             style={{
               background: 'rgba(255,255,255,0.92)',
               backdropFilter: 'blur(20px)',
               border: '1px solid rgba(0,209,193,0.25)',
               boxShadow: '0 8px 24px rgba(0,209,193,0.15)',
             }}>
          <div className="w-4 h-4 rounded-lg bg-[#00D1C1]/15 flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-[#00D1C1]" />
          </div>
          <span className="font-bold text-gray-900">+18%</span>
          <span className="text-gray-400">הכנסות</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function HeroSection({ onLoginClick }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" dir="rtl"
             style={{
               background: 'linear-gradient(180deg, #f0f4fa 0%, #F4F6FB 60%, #eef2f9 100%)',
             }}>

      {/* ── Layered background effects ──────────────────────── */}

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.35]"
           style={{
             backgroundImage: 'linear-gradient(rgba(11,18,32,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(11,18,32,0.06) 1px, transparent 1px)',
             backgroundSize: '48px 48px',
           }} />

      {/* Radial mesh gradients */}
      <div className="absolute top-0 right-0 w-[900px] h-[700px] pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(0,209,193,0.12) 0%, transparent 60%)' }} />
      <div className="absolute bottom-0 left-0 w-[700px] h-[600px] pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 20% 100%, rgba(99,102,241,0.09) 0%, transparent 55%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center, rgba(0,209,193,0.05) 0%, transparent 70%)' }} />

      {/* Floating orb decorations */}
      <div className="absolute top-32 right-16 w-3 h-3 rounded-full bg-[#00D1C1]/40 animate-pulse-glow" />
      <div className="absolute top-64 right-48 w-2 h-2 rounded-full bg-indigo-400/50" />
      <div className="absolute bottom-48 left-24 w-2.5 h-2.5 rounded-full bg-[#00D1C1]/30 animate-pulse" />
      <div className="absolute top-48 left-36 w-1.5 h-1.5 rounded-full bg-purple-400/40" />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* ── Text column ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 lg:order-2"
          >
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 mb-7 border"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderColor: 'rgba(0,209,193,0.25)',
                boxShadow: '0 2px 12px rgba(0,209,193,0.10), 0 1px 3px rgba(11,18,32,0.05)',
              }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1C1] opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D1C1]"></span>
              </span>
              פלטפורמת ניהול נכסים #1 בישראל
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.08] tracking-tight mb-6 text-[#0B1220]"
            >
              נהלו את הנכסים
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #00D1C1 0%, #0097a7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                שלכם בחכמה
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg text-gray-500 leading-relaxed mb-9 max-w-md font-medium"
            >
              ניהול הזמנות, לידים, תשלומים וניקיון — כל מה שצריך כדי להפעיל נכסי נופש ברמה הגבוהה ביותר, במקום אחד.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <Button
                size="lg"
                onClick={onLoginClick}
                className="btn-premium text-white text-base px-8 h-12 font-bold rounded-2xl gap-2"
                style={{
                  background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 100%)',
                  boxShadow: '0 4px 20px rgba(11,18,32,0.3), 0 1px 3px rgba(11,18,32,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                התחל עכשיו
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-gray-800 text-base px-7 h-12 font-semibold rounded-2xl transition-all gap-2.5 border hover:shadow-md"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderColor: 'rgba(11,18,32,0.12)',
                  boxShadow: '0 2px 8px rgba(11,18,32,0.06)',
                }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #0B1220, #1a2744)' }}>
                  <Play className="w-3 h-3 text-white fill-white" style={{ marginRight: '-1px' }} />
                </div>
                צפו בהדגמה
              </Button>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.58 }}
              className="flex flex-wrap items-center gap-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {[
                    'linear-gradient(135deg, #4dd0e1, #00acc1)',
                    'linear-gradient(135deg, #ce93d8, #ab47bc)',
                    'linear-gradient(135deg, #ffcc80, #ffa726)',
                    'linear-gradient(135deg, #90caf9, #42a5f5)',
                  ].map((g, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white/80 shadow-sm"
                         style={{ background: g }} />
                  ))}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#0B1220]">+5,000</div>
                  <div className="text-xs text-gray-400 font-medium">לקוחות מרוצים</div>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-200" />

              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <div className="text-xs text-gray-400 font-medium">דירוג 4.9/5 ממוצע</div>
              </div>

              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#00D1C1]" />
                <span className="text-xs text-gray-400 font-medium">מאובטח ומוגן</span>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Visual column ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1 relative"
          >
            {/* Glow behind card */}
            <div className="absolute -inset-4 rounded-[2.5rem] pointer-events-none"
                 style={{
                   background: 'radial-gradient(ellipse at center, rgba(0,209,193,0.15) 0%, transparent 70%)',
                   filter: 'blur(24px)',
                 }} />

            {/* Main card wrapper */}
            <div className="relative rounded-3xl p-1"
                 style={{
                   background: 'linear-gradient(135deg, rgba(0,209,193,0.25) 0%, rgba(255,255,255,0.4) 40%, rgba(99,102,241,0.15) 100%)',
                   boxShadow: '0 24px 64px rgba(11,18,32,0.12), 0 8px 24px rgba(11,18,32,0.06)',
                 }}>
              <DashboardPreview />
            </div>
          </motion.div>
        </div>

        {/* ── Bottom stats strip ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72 }}
          className="mt-16 rounded-2xl p-1"
          style={{
            background: 'linear-gradient(135deg, rgba(0,209,193,0.15) 0%, rgba(255,255,255,0.6) 50%, rgba(99,102,241,0.10) 100%)',
            boxShadow: '0 4px 20px rgba(11,18,32,0.06)',
          }}
        >
          <div className="rounded-2xl p-5"
               style={{
                 background: 'rgba(255,255,255,0.80)',
                 backdropFilter: 'blur(20px)',
               }}>
            <div className="grid grid-cols-3 gap-4 divide-x divide-x-reverse divide-gray-100">
              {[
                { value: '87%', label: 'חיסכון בזמן ניהולי', sub: 'בממוצע ללקוח' },
                { value: '25K+', label: 'הזמנות מנוהלות', sub: 'מדי חודש בפלטפורמה' },
                { value: '56K', label: 'משתמשים הצטרפו', sub: 'ועוד מצטרפים כל יום' },
              ].map((stat, i) => (
                <div key={i} className="text-center px-4">
                  <div className="text-2xl md:text-3xl font-extrabold text-[#0B1220] mb-0.5 tracking-tight">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-700">{stat.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
