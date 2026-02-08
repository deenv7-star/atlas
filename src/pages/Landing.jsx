import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
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
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              >
                כניסה
              </Button>
              <Button 
                className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-medium"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              >
                {t.startTrial}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B1220] leading-tight mb-6">
                {t.heroTitle}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {t.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-semibold px-8 py-6 text-lg rounded-xl"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
                >
                  {t.startTrial}
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-[#0B1220] text-[#0B1220] px-8 py-6 text-lg rounded-xl">
                  {t.bookDemo}
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-[#0B1220] to-[#1a2744] rounded-2xl p-4 shadow-2xl">
                <div className="bg-[#F8FAFC] rounded-xl overflow-hidden">
                  <div className="bg-white border-b px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-sm text-gray-400 mr-4">dashboard.stayflow.io</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#00D1C1]/10 rounded-xl p-4">
                        <p className="text-sm text-gray-500">לידים חדשים</p>
                        <p className="text-2xl font-bold text-[#0B1220]">12</p>
                      </div>
                      <div className="bg-[#F2E9DB] rounded-xl p-4">
                        <p className="text-sm text-gray-500">הזמנות החודש</p>
                        <p className="text-2xl font-bold text-[#0B1220]">28</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium">כניסות היום</span>
                        <span className="text-[#00D1C1] text-sm">3 אורחים</span>
                      </div>
                      <div className="space-y-2">
                        {['משפחת כהן - וילה צפון', 'דני לוי - סוויטה'].map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
                            <span>{item}</span>
                            <span className="text-green-600">מאושר</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#00D1C1] text-[#0B1220] px-4 py-2 rounded-lg shadow-lg font-medium text-sm">
                ✓ 0 הזמנות כפולות
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-[#0B1220]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
              {t.problemTitle}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {t.problemBullets.map((bullet, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/80 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-[#F59E0B] flex-shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section - Apple Premium Design */}
      <section className="relative py-16 sm:py-24 md:py-32 lg:py-40 px-4 bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/30 via-white to-gray-50/30" />
        
        <div className="relative max-w-[1600px] mx-auto">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12 sm:mb-16 md:mb-24 lg:mb-32"
          >
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 md:mb-8 tracking-[-0.02em] leading-[1.05]">
              {t.solutionTitle}
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-500 max-w-4xl mx-auto font-light leading-relaxed">
              {t.solutionText}
            </p>
          </motion.div>
          
          {/* Before & After Comparison - Always Side by Side */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-10 lg:gap-16 items-stretch mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            
            {/* BEFORE - Chaos */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              <div className="absolute -inset-2 sm:-inset-4 md:-inset-6 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-2xl sm:rounded-3xl md:rounded-[40px] opacity-80 blur-2xl md:blur-3xl group-hover:opacity-100 transition-all duration-700" />
              
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 aspect-square overflow-hidden shadow-xl">
                <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-400 tracking-wider">לפני</span>
                </div>
                
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Floating chaos cards */}
                  {[
                    { top: '8%', right: '8%', bg: 'from-amber-400 to-orange-500', emoji: '📞', rotate: 15 },
                    { top: '32%', left: '6%', bg: 'from-rose-400 to-pink-500', emoji: '💰', rotate: -10 },
                    { bottom: '22%', right: '10%', bg: 'from-emerald-400 to-teal-500', emoji: '🧹', rotate: 8 },
                    { bottom: '35%', left: '8%', bg: 'from-blue-400 to-indigo-500', emoji: '📅', rotate: -14 },
                    { top: '48%', left: '25%', bg: 'from-violet-400 to-purple-500', emoji: '📨', rotate: 5 }
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        rotate: [card.rotate - 3, card.rotate + 3, card.rotate - 3],
                        y: [-6, 6, -6]
                      }}
                      transition={{ repeat: Infinity, duration: 4 + i * 0.3, ease: "easeInOut" }}
                      style={{ top: card.top, right: card.right, bottom: card.bottom, left: card.left }}
                      className="absolute"
                    >
                      <div className={`bg-gradient-to-br ${card.bg} rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 shadow-lg w-12 sm:w-16 md:w-20 lg:w-24 aspect-square flex items-center justify-center`}>
                        <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">{card.emoji}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Central chaos indicator */}
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center opacity-5"
                  >
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64 rounded-full border-4 border-dashed border-red-400" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* AFTER - Organized */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-2 sm:-inset-4 md:-inset-6 bg-gradient-to-br from-[#00D1C1]/10 via-cyan-50/50 to-blue-50/50 rounded-2xl sm:rounded-3xl md:rounded-[40px] opacity-80 blur-2xl md:blur-3xl group-hover:opacity-100 transition-all duration-700" />
              
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 aspect-square shadow-2xl shadow-[#00D1C1]/20">
                <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 flex items-center gap-2">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-[#00D1C1] tracking-wider">עם ATLAS</span>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-[#00D1C1]" />
                  </motion.div>
                </div>
                
                <div className="relative w-full h-full flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <div className="bg-white/[0.04] backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 border border-white/[0.08] w-full max-w-md">
                      <div className="space-y-2 sm:space-y-3 md:space-y-4">
                        {[
                          { icon: Calendar, label: 'מאורגן', color: 'from-[#00D1C1] to-cyan-400' },
                          { icon: CreditCard, label: 'מסונכרן', color: 'from-blue-400 to-indigo-400' },
                          { icon: MessageSquare, label: 'חכם', color: 'from-purple-400 to-pink-400' },
                          { icon: CheckCircle2, label: 'מושלם', color: 'from-green-400 to-emerald-400' }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 + i * 0.1 }}
                            className="flex items-center gap-2 sm:gap-3 md:gap-4 bg-white/[0.06] rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 group/item hover:bg-white/[0.1] transition-all"
                          >
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" strokeWidth={2} />
                            </div>
                            <span className="text-white font-medium text-xs sm:text-sm md:text-base lg:text-lg">{item.label}</span>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.8 + i * 0.1 }}
                              className="mr-auto"
                            >
                              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#00D1C1]" />
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Glow effect */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full bg-[#00D1C1] blur-[80px] sm:blur-[100px] md:blur-[120px]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Benefits Pills */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 md:gap-4"
          >
            {t.benefits.map((benefit, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 + i * 0.05 }}
                className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-full font-medium text-sm sm:text-base md:text-lg hover:bg-gray-100 hover:border-gray-300 transition-all cursor-default"
              >
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#00D1C1] flex-shrink-0" />
                {benefit}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-[#F2E9DB]/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-shadow bg-white rounded-2xl">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-[#00D1C1]/10 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-[#00D1C1]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0B1220] mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-16">
            איך זה עובד?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#0B1220] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-[#0B1220] mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-[#0B1220]">
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
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-4">
            תוכניות ומחירים
          </h2>
          <p className="text-gray-600 text-center mb-12">בחר את התוכנית המתאימה לך</p>
          
          <div className="grid md:grid-cols-3 gap-6">
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
                      onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
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
      <section className="py-20 px-4 bg-[#F2E9DB]/30">
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
      <section className="py-20 px-4 bg-gradient-to-br from-[#0B1220] to-[#1a2744]">
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
              onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
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
              © 2024 STAYFLOW. {t.allRightsReserved}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}