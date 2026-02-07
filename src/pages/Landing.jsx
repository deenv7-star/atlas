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
  ChevronRight,
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Logo variant="dark" />
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-[#64748B] hover:text-[#0F172A] rounded-lg px-4 h-10 text-sm font-medium"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                כניסה
              </Button>
              <Button 
                className="bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A] rounded-lg px-5 h-10 text-sm font-semibold shadow-lg shadow-[#00D1C1]/20"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                התחל בחינם
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[#00D1C1]/5 blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D1C1]/10 border border-[#00D1C1]/20 mb-8">
            <Sparkles className="h-4 w-4 text-[#00D1C1]" />
            <span className="text-sm text-[#0F172A] font-semibold">פלטפורמת ניהול מונעת AI</span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold leading-[1.05] mb-6 text-[#0F172A] tracking-tight">
            ניהול נכסים<br />
            <span className="text-[#00D1C1]">חכם ואוטומטי</span>
          </h1>

          <p className="text-xl sm:text-2xl text-[#64748B] mb-10 leading-relaxed max-w-3xl mx-auto font-normal">
            ATLAS מנהלת את הכל בשבילך - מלידים לתשלומים, מהזמנות לחוזים.
            <br className="hidden sm:block" />
            אוטומציה חכמה שחוסכת לך 20+ שעות שבועיות.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A] rounded-xl px-8 h-14 text-base font-semibold shadow-lg shadow-[#00D1C1]/25"
              onClick={() => navigate(createPageUrl('Dashboard'))}
            >
              התחל ניסיון חינמי - 30 יום
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#E5E7EB] hover:border-[#00D1C1] hover:text-[#00D1C1] rounded-xl px-8 h-14 text-base font-medium"
            >
              צפה בדמו
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-[#00D1C1]/20 blur-3xl"></div>
            <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&q=80" 
                alt="ATLAS Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - The Chaos */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#F8FAFC] to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 mb-6">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 font-semibold">המציאות של רוב המנהלים</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#0F172A] mb-6 tracking-tight">
                היום זה נראה ככה
              </h2>
              <p className="text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed">
                20 טאבים פתוחים, עשרות הודעות, ואתה עדיין לא בטוח<br className="hidden sm:block" />
                מי משלם מחר ומה הסטטוס של כל נכס
              </p>
            </motion.div>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Professional Browser Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
            >
              {/* Browser Chrome */}
              <div className="bg-gradient-to-b from-gray-100 to-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-lg px-4 py-2 text-xs text-gray-400 shadow-sm border border-gray-200">
                    <div className="flex gap-2 overflow-hidden">
                      {['WhatsApp Web', 'Excel Online', 'Gmail', 'Airbnb Calendar', 'Booking.com', 'Google Calendar'].map((tab, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-[11px] px-3 py-1 bg-gray-50 rounded-md whitespace-nowrap font-medium border border-gray-200"
                        >
                          {tab}
                        </motion.div>
                      ))}
                      <span className="text-gray-400">+14 more...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organized Chaos Desktop */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-8">
                {/* Modern Notification Stack */}
                <div className="absolute top-6 left-6 space-y-2 z-20">
                  {[
                    { app: 'WhatsApp', text: '3 לידים חדשים מחכים', icon: MessageSquare, color: 'from-green-500 to-green-600' },
                    { app: 'Gmail', text: 'תזכורת: תשלום פקע אתמול', icon: AlertCircle, color: 'from-red-500 to-red-600' },
                    { app: 'Airbnb', text: 'הזמנה חדשה לדירה 4', icon: Calendar, color: 'from-rose-500 to-rose-600' }
                  ].map((notif, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -50, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.2, duration: 0.4 }}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[280px] backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${notif.color} flex items-center justify-center flex-shrink-0`}>
                          <notif.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 mb-0.5">{notif.app}</p>
                          <p className="text-xs text-gray-600 leading-tight">{notif.text}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Task Management Cards */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 grid grid-cols-3 gap-4">
                  {[
                    { title: 'משימות דחופות', count: 8, color: 'border-red-200 bg-red-50/50', badge: 'bg-red-500' },
                    { title: 'תשלומים ממתינים', count: 12, color: 'border-yellow-200 bg-yellow-50/50', badge: 'bg-yellow-500' },
                    { title: 'הזמנות חדשות', count: 5, color: 'border-blue-200 bg-blue-50/50', badge: 'bg-blue-500' }
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.15 }}
                      className={`${card.color} border-2 rounded-xl p-4 backdrop-blur-sm shadow-lg`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-bold text-[#0F172A]">{card.title}</h4>
                        <span className={`${card.badge} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                          {card.count}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {[1, 2, 3].map((_, j) => (
                          <div key={j} className="h-2 bg-white/60 rounded-full w-full"></div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stress Level Indicator */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2"
                >
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <AlertCircle className="h-6 w-6" />
                    </motion.div>
                    <div>
                      <p className="text-sm opacity-90">רמת מתח:</p>
                      <p className="text-xl font-black">קריטית 🔥</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Elegant Transition Arrow */}
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center my-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D1C1] to-[#00B8AA] shadow-lg shadow-[#00D1C1]/30 flex items-center justify-center">
                <ChevronRight className="h-7 w-7 text-white rotate-90" />
              </div>
            </motion.div>

            {/* Solution Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-2xl border border-[#E5E7EB] p-10 text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00D1C1] to-[#00B8AA] rounded-3xl mb-6 shadow-xl shadow-[#00D1C1]/30">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[#0F172A] mb-4">עם ATLAS — הכל משתנה</h3>
              <p className="text-lg text-[#64748B] leading-relaxed mb-6">
                מערכת אחת. כל המידע במקום אחד. אוטומציה מלאה.<br />
                אפס בלאגן, אפס מתח, מקסימום שליטה.
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D1C1]/10 rounded-full">
                <div className="w-2 h-2 bg-[#00D1C1] rounded-full"></div>
                <span className="text-sm font-semibold text-[#0F172A]">חיסכון של 20+ שעות בשבוע</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Features */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-bold text-[#0F172A] mb-4 tracking-tight">
              מערכת שלמה. באפליקציה אחת.
            </h2>
            <p className="text-xl text-[#64748B]">כל מה שצריך כדי להפוך את הנכסים שלך למכונת כסף</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group">
                <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] hover:border-[#00D1C1] hover:shadow-lg hover:shadow-[#00D1C1]/10 transition-all">
                  <div className="w-12 h-12 bg-[#00D1C1] rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-[#0F172A]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#64748B] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
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
      <section className="py-24 px-6 bg-[#0F172A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-4">
            בעלי נכסים שמרוצים
          </h2>
          <p className="text-[#94A3B8] text-center text-lg mb-12">למה הם בחרו ב-ATLAS</p>
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
                    <p className="text-white/90 mb-4 leading-relaxed text-base">"{testimonial.text}"</p>
                    <p className="text-[#00D1C1] font-semibold">{testimonial.author}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Pricing */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-bold text-[#0F172A] mb-4 tracking-tight">
              תמחור פשוט. ללא הפתעות.
            </h2>
            <p className="text-xl text-[#64748B]">בחר את התוכנית שמתאימה לגודל העסק שלך</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(t.pricing).map(([key, plan]) => (
              <div 
                key={key} 
                className={`rounded-2xl p-8 border-2 transition-all ${
                  key === 'pro' 
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-2xl shadow-[#00D1C1]/20 scale-105' 
                    : 'bg-white text-[#0F172A] border-[#E5E7EB] hover:border-[#00D1C1] hover:shadow-lg'
                }`}
              >
                {key === 'pro' && (
                  <div className="inline-block px-3 py-1 bg-[#00D1C1] rounded-full text-xs font-bold text-[#0F172A] mb-4">
                    המומלץ
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-8">
                  <span className="text-5xl font-bold">₪{plan.price}</span>
                  <span className={key === 'pro' ? 'text-white/60' : 'text-[#64748B]'}>/חודש</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${key === 'pro' ? 'text-[#00D1C1]' : 'text-[#00D1C1]'}`} />
                      <span className={key === 'pro' ? 'text-white/90' : 'text-[#64748B]'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full rounded-xl h-12 font-semibold ${
                    key === 'pro' 
                      ? 'bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A]' 
                      : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'
                  }`}
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                >
                  התחל עכשיו
                </Button>
              </div>
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
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0F172A] rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00D1C1]/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00D1C1]/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                תתחיל לחסוך זמן היום?
              </h2>
              <p className="text-xl text-[#94A3B8] mb-10 max-w-2xl mx-auto">
                הצטרף ל-200+ בעלי נכסים שכבר משתמשים ב-ATLAS וחוסכים<br />20+ שעות בשבוע
              </p>
              <Button 
                size="lg" 
                className="bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A] rounded-xl px-8 h-14 text-base font-semibold shadow-xl shadow-[#00D1C1]/30"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                התחל ניסיון חינמי - 30 יום
              </Button>
              <p className="text-sm text-[#94A3B8] mt-4 font-medium">ללא כרטיס אשראי • ביטול בכל עת • תמיכה מלאה בעברית</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="dark" />
            <div className="flex gap-8 text-[#64748B] text-sm font-medium">
              <Link to={createPageUrl('Privacy')} className="hover:text-[#0F172A] transition-colors">
                {t.privacyPolicy}
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-[#0F172A] transition-colors">
                {t.termsOfService}
              </Link>
            </div>
            <p className="text-[#94A3B8] text-sm">
              © 2026 ATLAS. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}