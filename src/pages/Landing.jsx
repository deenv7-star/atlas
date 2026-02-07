import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { translations } from '@/components/common/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Users, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  MessageSquare, 
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  AlertCircle,
  Inbox,
  CalendarCheck,
  Wallet,
  Brush,
  Send,
  FileSignature,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const t = translations.he;
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const features = [
    { icon: Inbox, title: t.features[0].title, desc: t.features[0].desc },
    { icon: CalendarCheck, title: t.features[1].title, desc: t.features[1].desc },
    { icon: Wallet, title: t.features[2].title, desc: t.features[2].desc },
    { icon: Brush, title: t.features[3].title, desc: t.features[3].desc },
    { icon: Send, title: t.features[4].title, desc: t.features[4].desc },
    { icon: FileSignature, title: t.features[5].title, desc: t.features[5].desc }
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] font-['Heebo',sans-serif]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="dark" />
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-[#0F172A]"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                כניסה
              </Button>
              <Button 
                className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-medium"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                {t.startTrial}
              </Button>
            </div>

            {/* Glow effect at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00D1C1] to-transparent" />
            </motion.div>
        </div>
      </nav>

      {/* Hero Section - Enhanced & Dynamic */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#1a2744] to-[#0B1220]">
        {/* Animated Grid Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#00D1C120_1px,transparent_1px),linear-gradient(to_bottom,#00D1C120_1px,transparent_1px)] bg-[size:64px_64px]"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>

        {/* Multiple Ambient Light Effects */}
        <motion.div
          className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00D1C1]/20 rounded-full blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#00B8A9]/20 rounded-full blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 1 }}
        />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#00D1C1] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00D1C1]/30 bg-[#00D1C1]/10 backdrop-blur-sm mb-8 hover:bg-[#00D1C1]/20 transition-colors cursor-pointer"
              >
                <motion.div 
                  className="w-2 h-2 rounded-full bg-[#00D1C1]"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm text-white/90 font-medium">מערכת מונעת בינה מלאכותית</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
              >
                <span className="bg-gradient-to-r from-white via-[#00D1C1] to-white bg-clip-text text-transparent">
                  ניהול נכסים
                </span>
                <br />
                <motion.span 
                  className="text-white/60"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  שונה לחלוטין
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-white/70 mb-8 sm:mb-10 leading-relaxed max-w-lg"
              >
                אוטומציה מלאה, בינה מלאכותית מתקדמת, וממשק אינטואיטיבי שחוסך לך שעות כל יום
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
              >
                <Button
                  size="lg"
                  className="group relative bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:from-[#00B8A9] hover:to-[#00D1C1] text-[#0B1220] px-6 sm:px-8 h-12 sm:h-14 rounded-xl font-bold overflow-hidden w-full sm:w-auto shadow-lg shadow-[#00D1C1]/50 hover:shadow-xl hover:shadow-[#00D1C1]/70 transition-all"
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                >
                  <span className="relative z-10 flex items-center">
                    התחל בחינם
                    <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    animate={{ 
                      x: ['-100%', '100%'],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 px-6 sm:px-8 h-12 sm:h-14 rounded-xl font-medium w-full sm:w-auto border border-white/20"
                >
                  צפה בדמו
                  <motion.div
                    className="mr-2 w-2 h-2 rounded-full bg-red-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12 sm:mt-16 grid grid-cols-3 gap-4 sm:flex sm:items-center sm:gap-12"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-[#00D1C1] mb-1">200+</div>
                  <div className="text-xs sm:text-sm text-white/60">בעלי נכסים</div>
                </motion.div>
                <div className="hidden sm:block w-px h-12 bg-white/20" />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-[#00D1C1] mb-1">50K+</div>
                  <div className="text-xs sm:text-sm text-white/60">הזמנות מנוהלות</div>
                </motion.div>
                <div className="hidden sm:block w-px h-12 bg-white/20" />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-[#00D1C1] mb-1">99.9%</div>
                  <div className="text-xs sm:text-sm text-white/60">זמינות</div>
                </motion.div>
              </motion.div>
            </div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mt-12 lg:mt-0"
            >
              {/* Main Dashboard Card */}
              <motion.div 
                className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-[#00D1C1]/20 overflow-hidden"
                whileHover={{ y: -10, rotateY: 5 }}
                transition={{ duration: 0.3 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] flex items-center justify-center"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-4 w-4 text-white" />
                    </motion.div>
                    <div>
                      <div className="text-sm font-semibold text-white">לוח בקרה</div>
                      <div className="text-xs text-white/60">סקירה בזמן אמת</div>
                    </div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-[#00D1C1] shadow-lg shadow-[#00D1C1]/50"
                  />
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* AI Insights */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="group relative bg-gradient-to-r from-[#0B1220] to-[#1a2744] rounded-2xl p-5 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
                    <div className="relative flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00D1C1]/20 backdrop-blur-sm flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-[#00D1C1]" />
                        </div>
                        <div>
                          <div className="text-white/90 font-medium mb-1">המלצת AI</div>
                          <div className="text-white/60 text-sm">3 לידים חדשים תואמים את הקריטריונים</div>
                        </div>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-[#00D1C1]"
                      />
                    </div>
                  </motion.div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'הזמנות פעילות', value: '24', change: '+12%', trend: 'up' },
                      { label: 'הכנסות', value: '₪89K', change: '+8%', trend: 'up' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group relative bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-4 border border-white/20 cursor-pointer overflow-hidden backdrop-blur-sm"
                      >
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-[#00D1C1]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={false}
                        />
                        <div className="relative">
                          <motion.div 
                            className="text-2xl font-bold text-white mb-1"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                          >
                            {stat.value}
                          </motion.div>
                          <div className="text-xs text-white/60 mb-2">{stat.label}</div>
                          <div className="flex items-center gap-1 text-xs text-[#00D1C1]">
                            <motion.span
                              animate={{ y: [-2, 0, -2] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              ↗
                            </motion.span>
                            <span>{stat.change}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="space-y-2"
                  >
                    {[
                      { icon: CheckCircle2, text: 'הזמנה אושרה', time: 'לפני 2 דקות', color: 'text-green-600 bg-green-50' },
                      { icon: MessageSquare, text: 'הודעה חדשה התקבלה', time: 'לפני 5 דקות', color: 'text-blue-600 bg-blue-50' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        whileHover={{ x: 8, scale: 1.02 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group backdrop-blur-sm border border-transparent hover:border-white/10"
                      >
                        <motion.div 
                          className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <item.icon className="h-4 w-4" />
                        </motion.div>
                        <div className="flex-1">
                          <div className="text-sm text-white font-medium">{item.text}</div>
                          <div className="text-xs text-white/40">{item.time}</div>
                        </div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowLeft className="h-4 w-4 text-white/30 group-hover:text-[#00D1C1] transition-colors" />
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Enhanced Floating Elements */}
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  rotateZ: [-2, 2, -2],
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="hidden lg:block absolute -top-4 -right-4 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-[#00D1C1]/20 border border-white/30"
                whileHover={{ scale: 1.1, y: -20 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div 
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </motion.div>
                  <div className="text-sm font-semibold text-white">זמינות 100%</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 15, 0],
                  rotateZ: [2, -2, 2],
                }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="hidden lg:block absolute -bottom-4 left-4 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-[#00D1C1]/20 border border-white/30"
                whileHover={{ scale: 1.1, y: 10 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] flex items-center justify-center"
                  >
                    <Sparkles className="h-4 w-4 text-white" />
                  </motion.div>
                  <div className="text-sm font-semibold text-white">מונע AI</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-[#0B1220]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8 sm:mb-12">
              {t.problemTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {t.problemBullets.map((bullet, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white/80 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                  <AlertCircle className="h-5 w-5 text-[#F59E0B] flex-shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] mb-6">
              {t.solutionTitle}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {t.solutionText}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {t.benefits.map((benefit, i) => (
                <span key={i} className="bg-[#00D1C1]/10 text-[#0B1220] px-6 py-3 rounded-full font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#00D1C1]" />
                  {benefit}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Features Grid */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-[#F8FAFC] to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#00D1C108,transparent_50%)]" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] mb-4">
              כל מה שאתה צריך במקום אחד
            </h2>
            <p className="text-gray-600 text-lg">תכונות מתקדמות לניהול מושלם של העסק</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all bg-white rounded-2xl overflow-hidden group">
                  <CardContent className="p-6 relative">
                    <motion.div 
                      className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00D1C1] to-[#00B8A9]"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ transformOrigin: 'right' }}
                    />
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-[#00D1C1]/20 to-[#00B8A9]/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="h-6 w-6 text-[#00D1C1]" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-[#0B1220] mb-2 group-hover:text-[#00D1C1] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-16">
            איך זה עובד?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {t.howItWorks.map((step, i) => {
              // Illustration SVGs for each step
              const illustrations = [
                // Step 1: Register
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00D1C1', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#00D1C1', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>
                  {/* Background circle */}
                  <circle cx="100" cy="100" r="80" fill="url(#grad1)" />
                  {/* User icon */}
                  <circle cx="100" cy="85" r="25" fill="#00D1C1" />
                  <path d="M 60 150 Q 100 130 140 150" stroke="#00D1C1" strokeWidth="20" fill="none" strokeLinecap="round" />
                  {/* Plus icon */}
                  <motion.g
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <circle cx="150" cy="60" r="15" fill="#0B1220" />
                    <line x1="150" y1="52" x2="150" y2="68" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <line x1="142" y1="60" x2="158" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </motion.g>
                </svg>,
                
                // Step 2: Connect
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00D1C1', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#00D1C1', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="80" fill="url(#grad2)" />
                  {/* Calendar grid */}
                  <rect x="60" y="70" width="80" height="70" rx="8" fill="#00D1C1" />
                  <rect x="65" y="75" width="70" height="60" rx="4" fill="white" />
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map((row) => 
                    [0, 1, 2].map((col) => (
                      <motion.rect
                        key={`${row}-${col}`}
                        x={70 + col * 20}
                        y={80 + row * 13}
                        width="15"
                        height="8"
                        rx="2"
                        fill={row === 2 && col === 1 ? "#00D1C1" : "#E5E7EB"}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: (row + col) * 0.2 }}
                      />
                    ))
                  )}
                  {/* Sync arrows */}
                  <motion.path
                    d="M 145 100 L 160 100"
                    stroke="#0B1220"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.path
                    d="M 155 95 L 160 100 L 155 105"
                    stroke="#0B1220"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </svg>,
                
                // Step 3: Automate
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00D1C1', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#00D1C1', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="80" fill="url(#grad3)" />
                  {/* AI Brain/Sparkle */}
                  <motion.g
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: '100px 100px' }}
                  >
                    <circle cx="100" cy="100" r="35" fill="#00D1C1" opacity="0.3" />
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="25"
                      fill="#00D1C1"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.g>
                  {/* Sparkles */}
                  <motion.circle
                    cx="65"
                    cy="70"
                    r="4"
                    fill="#0B1220"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                  />
                  <motion.circle
                    cx="135"
                    cy="75"
                    r="4"
                    fill="#0B1220"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  <motion.circle
                    cx="130"
                    cy="130"
                    r="4"
                    fill="#0B1220"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                  <motion.circle
                    cx="70"
                    cy="135"
                    r="4"
                    fill="#0B1220"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  />
                  {/* Lightning bolt */}
                  <motion.path
                    d="M 100 70 L 95 100 L 105 100 L 100 130"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </svg>
              ];
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center"
                >
                  <div className="relative mb-6 mx-auto w-full max-w-xs">
                    {/* Illustration container */}
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-8 relative">
                      {illustrations[i]}
                      {/* Step number overlay */}
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 + 0.3, type: "spring" }}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#00D1C1] text-[#0B1220] rounded-2xl flex items-center justify-center shadow-xl text-2xl font-bold z-10"
                      >
                        {step.step}
                      </motion.div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#0B1220] mb-2 mt-6">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-[#0B1220]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            מה אומרים עלינו
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-white/5 border-white/10 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-[#00D1C1] text-[#00D1C1]" />
                      ))}
                    </div>
                    <p className="text-white/90 mb-4 leading-relaxed">"{testimonial.text}"</p>
                    <p className="text-[#00D1C1] font-medium">{testimonial.author}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-3 sm:mb-4">
            תוכניות ומחירים
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center mb-8 sm:mb-12">בחר את התוכנית המתאימה לך</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {Object.entries(t.pricing).map(([key, plan], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full rounded-2xl ${key === 'pro' ? 'border-2 border-[#00D1C1] shadow-xl' : 'border'}`}>
                  <CardContent className="p-6">
                    {key === 'pro' && (
                      <span className="bg-[#00D1C1] text-[#0B1220] text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                        הכי פופולרי
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-[#0B1220] mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-[#0B1220]">₪{plan.price}</span>
                      <span className="text-gray-500">/חודש</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-gray-600">
                          <CheckCircle2 className="h-5 w-5 text-[#00D1C1] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full rounded-xl ${key === 'pro' 
                        ? 'bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220]' 
                        : 'bg-[#0B1220] hover:bg-[#1a2744] text-white'}`}
                      onClick={() => navigate(createPageUrl('Dashboard'))}
                    >
                      {t.startTrial}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-[#F2E9DB]/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-12">
            שאלות נפוצות
          </h2>
          <div className="space-y-4">
            {t.faq.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card 
                  className="cursor-pointer border-0 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 bg-white">
                      <span className="font-medium text-[#0B1220]">{item.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    {openFaq === i && (
                      <div className="p-4 pt-0 bg-white text-gray-600">
                        {item.a}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-br from-[#0B1220] to-[#1a2744]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t.finalCta}
            </h2>
            <p className="text-xl text-white/70 mb-8">{t.tagline}</p>
            <Button 
              size="lg" 
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-semibold px-10 py-6 text-lg rounded-xl"
              onClick={() => navigate(createPageUrl('Dashboard'))}
            >
              {t.startTrial}
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-[#0B1220] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="light" />
            <div className="flex gap-6 text-white/60 text-sm">
              <Link to={createPageUrl('Privacy')} className="hover:text-white transition-colors">
                {t.privacyPolicy}
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-white transition-colors">
                {t.termsOfService}
              </Link>
            </div>
            <p className="text-white/40 text-sm">
              © 2026 ATLAS. {t.allRightsReserved}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}