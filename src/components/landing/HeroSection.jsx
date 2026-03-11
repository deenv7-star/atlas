import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Play, Calendar, CreditCard, MessageSquare,
  TrendingUp, Star, Bell, CheckCircle
} from 'lucide-react';

/* ─── Floating notification pill ────────────────────────────── */
function FloatingPill({ icon: Icon, text, sub, iconBg, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 22 }}
      className={`absolute z-20 flex items-center gap-3 px-4 py-3
        bg-white/95 backdrop-blur-xl rounded-2xl
        border border-white/80
        shadow-[0_8px_32px_rgba(0,0,0,0.13),0_0_0_1px_rgba(255,255,255,0.9)_inset]
        ${className}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-900 leading-none mb-0.5">{text}</p>
        <p className="text-[10px] text-gray-400 leading-none">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ─── Dashboard visual ───────────────────────────────────────── */
function DashboardVisual() {
  return (
    <div className="relative px-6 lg:px-0">
      {/* Floating pills — outside the container */}
      <FloatingPill
        icon={Bell}
        text="הזמנה חדשה!"
        sub="משפחת כהן — 3 לילות"
        iconBg="bg-gradient-to-br from-[#00D1C1] to-[#0070F3]"
        className="-top-5 -right-3 md:right-6"
        delay={0.85}
      />
      <FloatingPill
        icon={CheckCircle}
        text="תשלום התקבל"
        sub="₪1,200 אושר בהצלחה"
        iconBg="bg-gradient-to-br from-emerald-400 to-green-500"
        className="-bottom-5 -left-3 md:left-6"
        delay={1.05}
      />

      {/* Outer glow ring */}
      <div className="absolute -inset-4 bg-gradient-to-br from-[#00D1C1]/20 via-transparent to-purple-500/15 rounded-[2.8rem] blur-2xl" />

      {/* Main container */}
      <div
        className="relative rounded-[2rem] overflow-hidden
          shadow-[0_48px_96px_-16px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1528] via-[#0f1e3a] to-[#17093a]" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#00D1C1]/18 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-600/16 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 p-5 space-y-3">
          {/* Window bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00D1C1] animate-pulse" />
              <span className="text-[10px] font-semibold text-white/50 tracking-widest uppercase">Atlas — יולי 2024</span>
            </div>
            <div className="flex gap-1.5">
              {['bg-red-400/70', 'bg-yellow-400/70', 'bg-green-400/70'].map((c, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
              ))}
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: 'הכנסות החודש', value: '₪24,800', sub: '↑ 18%', subColor: 'text-emerald-400',
                icon: TrendingUp, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/15',
                border: 'border-white/8',
              },
              {
                label: 'הזמנות פעילות', value: '14', sub: '3 כניסות היום', subColor: 'text-[#00D1C1]',
                icon: Calendar, iconColor: 'text-[#00D1C1]', iconBg: 'bg-[#00D1C1]/15',
                border: 'border-[#00D1C1]/20',
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className={`bg-white/8 backdrop-blur-sm rounded-2xl p-4 border ${s.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-white/45 font-medium">{s.label}</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                    <s.icon className={`h-3 w-3 ${s.iconColor}`} />
                  </div>
                </div>
                <div className="text-[1.4rem] font-bold text-white leading-none mb-1.5">{s.value}</div>
                <span className={`text-[10px] font-semibold ${s.subColor}`}>{s.sub}</span>
              </motion.div>
            ))}
          </div>

          {/* Booking list */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/6 backdrop-blur-sm rounded-2xl p-4 border border-white/6"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1 h-3.5 rounded-full bg-[#00D1C1]" />
              <span className="text-[10px] font-bold text-white/45 uppercase tracking-widest">הזמנות קרובות</span>
            </div>
            {[
              { name: 'משפחת לוי', info: '15/7 · 2 לילות', status: 'מאושר', sc: 'bg-emerald-500/20 text-emerald-400' },
              { name: 'דני כהן', info: '16/7 · 3 לילות', status: 'ממתין', sc: 'bg-amber-500/20 text-amber-400' },
              { name: 'שירה אברהם', info: '18/7 · 1 לילה', status: 'מאושר', sc: 'bg-emerald-500/20 text-emerald-400' },
            ].map((b, i) => (
              <div key={i} className={`flex items-center justify-between py-2 ${i < 2 ? 'border-b border-white/5' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00D1C1]/40 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {b.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/85 leading-none mb-0.5">{b.name}</p>
                    <p className="text-[10px] text-white/35 leading-none">{b.info}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${b.sc}`}>{b.status}</span>
              </div>
            ))}
          </motion.div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: MessageSquare, label: 'הודעות', val: '24', c: 'text-violet-400', bg: 'bg-violet-500/12 border-violet-500/20' },
              { icon: CreditCard, label: 'תשלומים', val: '₪8K', c: 'text-[#00D1C1]', bg: 'bg-[#00D1C1]/12 border-[#00D1C1]/20' },
              { icon: Star, label: 'ביקורות', val: '4.9', c: 'text-amber-400', bg: 'bg-amber-400/12 border-amber-400/20' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.72 + i * 0.07 }}
                className={`rounded-xl p-3 text-center border ${item.bg}`}
              >
                <item.icon className={`h-3.5 w-3.5 mx-auto mb-1.5 ${item.c}`} />
                <p className="text-sm font-bold text-white leading-none mb-0.5">{item.val}</p>
                <p className="text-[9px] text-white/35 leading-none">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main hero ──────────────────────────────────────────────── */
export default function HeroSection({ onLoginClick }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FAFBFF]">

      {/* Multi-layer radial mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_85%_0%,rgba(0,209,193,0.13)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_10%_90%,rgba(124,58,237,0.09)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_40%,rgba(236,72,153,0.06)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_60%_100%,rgba(59,130,246,0.07)_0%,transparent_50%)]" />
      </div>

      {/* Dot grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.055)_1px,transparent_1px)] bg-[size:26px_26px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 relative z-10 w-full">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 xl:gap-16 items-center">

          {/* ── Text column ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="order-1 lg:order-2"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2
                bg-white rounded-full
                border border-gray-200/70
                shadow-[0_2px_14px_rgba(0,0,0,0.07)]
                text-sm font-medium text-gray-700 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1C1] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D1C1]" />
              </span>
              פלטפורמת ניהול נכסים #1 בישראל
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-5xl md:text-6xl lg:text-[4.4rem] font-extrabold leading-[1.06] tracking-tight mb-6"
            >
              <span className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                נהלו את הנכסים
              </span>
              <br />
              <span className="bg-gradient-to-l from-[#00D1C1] via-[#009eb0] to-[#0070F3] bg-clip-text text-transparent">
                שלכם בחכמה
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-[30rem]"
            >
              ניהול הזמנות, לידים, תשלומים וניקיון — כל מה שצריך כדי להפעיל נכסי נופש ברמה הגבוהה ביותר.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <Button
                size="lg"
                onClick={onLoginClick}
                className="group relative bg-[#0B1220] hover:bg-[#161f36] text-white text-base px-9 h-12 font-semibold rounded-2xl
                  shadow-[0_4px_20px_rgba(11,18,32,0.28),0_1px_3px_rgba(11,18,32,0.4)]
                  hover:shadow-[0_8px_32px_rgba(11,18,32,0.36)]
                  transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  התחל עכשיו — בחינם
                  <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="group bg-white/80 backdrop-blur-sm border border-gray-200/80
                  hover:border-gray-300 hover:bg-white
                  text-gray-700 text-base px-8 h-12 font-semibold rounded-2xl gap-3
                  shadow-[0_2px_12px_rgba(0,0,0,0.06)]
                  hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)]
                  transition-all duration-300"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-inner group-hover:from-gray-600">
                  <Play className="w-3 h-3 text-white fill-white translate-x-[-0.5px]" />
                </div>
                צפו בהדגמה
              </Button>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex flex-wrap items-center gap-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {[
                    'from-teal-300 to-cyan-400',
                    'from-violet-400 to-purple-500',
                    'from-amber-300 to-orange-400',
                    'from-blue-400 to-indigo-500',
                    'from-rose-300 to-pink-400',
                  ].map((g, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} border-2 border-[#FAFBFF] shadow-sm`} />
                  ))}
                </div>
                <div className="mr-1">
                  <p className="text-sm font-bold text-gray-900">+5,000</p>
                  <p className="text-xs text-gray-400">לקוחות מרוצים</p>
                </div>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-gray-400 font-medium">4.9/5 דירוג ממוצע</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Visual column ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.22 }}
            className="order-2 lg:order-1"
          >
            <DashboardVisual />
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mt-20 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-gray-200
            shadow-[0_2px_24px_rgba(0,0,0,0.06)]"
        >
          {[
            { value: '87%', label: 'חיסכון בזמן ניהולי', sub: 'בממוצע ללקוח' },
            { value: '25K+', label: 'הזמנות מנוהלות', sub: 'מדי חודש בפלטפורמה' },
            { value: '56K', label: 'משתמשים הצטרפו', sub: 'ועוד מצטרפים כל יום' },
          ].map((s, i) => (
            <div key={i} className="bg-white/90 backdrop-blur-sm text-center px-6 py-6">
              <p className="text-3xl md:text-4xl font-black bg-gradient-to-b from-gray-900 to-gray-500 bg-clip-text text-transparent mb-1">
                {s.value}
              </p>
              <p className="text-sm font-semibold text-gray-800">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
