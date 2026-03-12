import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import Logo from '@/components/common/Logo';
import { translations } from '@/components/common/i18n';
import ProductDemoModal from '@/components/landing/ProductDemoModal';
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
  ArrowRight,
  AlertCircle,
  Inbox,
  CalendarCheck,
  Wallet,
  Brush,
  Send,
  FileSignature,
  Star,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Landing() {
  const t = translations.he;
  const [openFaq, setOpenFaq] = useState(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const features = [
    { icon: Inbox, title: t.features[0].title, desc: t.features[0].desc },
    { icon: CalendarCheck, title: t.features[1].title, desc: t.features[1].desc },
    { icon: Wallet, title: t.features[2].title, desc: t.features[2].desc },
    { icon: Brush, title: t.features[3].title, desc: t.features[3].desc },
    { icon: Send, title: t.features[4].title, desc: t.features[4].desc },
    { icon: FileSignature, title: t.features[5].title, desc: t.features[5].desc }
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC] font-['Heebo',sans-serif] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00D1C1]/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#F2E9DB]/40 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-[#00D1C1]/3 rounded-full blur-2xl animate-pulse-glow" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="dark" />
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-[#0F172A] hover:text-[#00D1C1] transition-colors"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              >
                כניסה
              </Button>
              <Button 
                className="bg-gradient-to-l from-[#00D1C1] to-[#00eedd] hover:shadow-lg hover:shadow-[#00D1C1]/30 text-[#0B1220] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              >
                {t.startTrial}
                <Sparkles className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#00D1C1]/10 border border-[#00D1C1]/20 rounded-full px-4 py-2 mb-6">
                <Zap className="h-4 w-4 text-[#00D1C1]" />
                <span className="text-sm font-medium text-[#0B1220]">פלטפורמת ניהול #1 בישראל</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B1220] leading-tight mb-6">
                <span className="bg-gradient-to-l from-[#0B1220] to-[#1a2744] bg-clip-text text-transparent">
                  {t.heroTitle}
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {t.heroSubtitle}
              </p>
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#00D1C1]" />
                  <span className="text-gray-600">ללא כרטיס אשראי</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#00D1C1]" />
                  <span className="text-gray-600">הקמה ב-5 דקות</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-l from-[#00D1C1] to-[#00eedd] hover:shadow-2xl hover:shadow-[#00D1C1]/40 text-[#0B1220] font-bold px-10 py-7 text-lg rounded-2xl transition-all duration-300 hover:-translate-y-1 group"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
                >
                  {t.startTrial}
                  <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-[#0B1220] text-[#0B1220] hover:bg-[#0B1220] hover:text-white px-10 py-7 text-lg rounded-2xl font-semibold transition-all duration-300"
                  onClick={() => setDemoModalOpen(true)}
                >
                  {t.bookDemo}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-br from-[#00D1C1] to-[#00eedd] rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
              
              <div className="relative bg-gradient-to-br from-[#0B1220] via-[#1a2744] to-[#0B1220] rounded-2xl p-4 shadow-2xl border border-white/5">
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
              {/* Floating badges */}
              <motion.div 
                className="absolute -bottom-4 -left-4 bg-gradient-to-l from-[#00D1C1] to-[#00eedd] text-[#0B1220] px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 border-2 border-white"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Shield className="h-4 w-4" />
                ✓ 0 הזמנות כפולות
              </motion.div>
              
              <motion.div 
                className="absolute -top-4 -right-4 bg-white text-[#0B1220] px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 border border-gray-200"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              >
                <TrendingUp className="h-4 w-4 text-green-600" />
                +40% יעילות
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 px-4 bg-white border-y border-gray-100 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'בתי נופש', icon: Calendar },
              { value: '50K+', label: 'הזמנות בשנה', icon: CheckCircle2 },
              { value: '99.9%', label: 'זמינות', icon: TrendingUp },
              { value: '24/7', label: 'תמיכה', icon: Clock }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-6 w-6 text-[#00D1C1]" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-[#0B1220] mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#0B1220] via-[#1a2744] to-[#0B1220] overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-6"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 font-medium text-sm">האתגרים שלך</span>
              </div>
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {t.problemTitle}
            </h2>
            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
              אנחנו מבינים את הקשיים שאתם מתמודדים איתם יום יום
            </p>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {t.problemBullets.map((bullet, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 text-white/90 flex items-start gap-3 hover:bg-white/10 transition-all duration-300 group"
                >
                  <AlertCircle className="h-5 w-5 text-[#F59E0B] flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-right">{bullet}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-white to-[#F8FAFC]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-6"
            >
              <div className="bg-[#00D1C1]/10 border border-[#00D1C1]/20 rounded-full px-4 py-2 inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00D1C1]" />
                <span className="text-[#00D1C1] font-medium text-sm">הפתרון שלנו</span>
              </div>
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B1220] mb-6">
              <span className="bg-gradient-to-l from-[#0B1220] to-[#00D1C1] bg-clip-text text-transparent">
                {t.solutionTitle}
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              {t.solutionText}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {t.benefits.map((benefit, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-[#00D1C1]/10 to-[#00eedd]/10 border border-[#00D1C1]/20 text-[#0B1220] px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-[#00D1C1]/20 transition-all duration-300 hover:-translate-y-1"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#00D1C1]" />
                  {benefit}
                </motion.span>
              ))}
            </div>
            
            <Button
              size="lg"
              className="bg-gradient-to-l from-[#00D1C1] to-[#00eedd] hover:shadow-2xl hover:shadow-[#00D1C1]/40 text-[#0B1220] font-bold px-10 py-7 text-lg rounded-2xl transition-all duration-300 hover:-translate-y-1"
              onClick={() => setDemoModalOpen(true)}
            >
              צפה בדמו אינטראקטיבי
              <BarChart3 className="mr-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#F2E9DB]/30 via-[#F8FAFC] to-white">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#00D1C1]/5 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#F2E9DB]/60 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B1220] mb-4">
                כל מה שצריך במקום אחד
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                פלטפורמה מקיפה לניהול מלא של העסק שלך
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-0 shadow-md hover:shadow-2xl transition-all duration-300 bg-white rounded-2xl group hover:-translate-y-2 overflow-hidden relative">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00D1C1]/0 to-[#00D1C1]/0 group-hover:from-[#00D1C1]/5 group-hover:to-transparent transition-all duration-300" />
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#00D1C1]/10 to-[#00eedd]/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <feature.icon className="h-7 w-7 text-[#00D1C1]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B1220] mb-3 group-hover:text-[#00D1C1] transition-colors">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                  
                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-[#00D1C1] to-[#00eedd] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <div className="bg-[#00D1C1]/10 border border-[#00D1C1]/20 rounded-full px-4 py-2 inline-flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#00D1C1]" />
                <span className="text-[#00D1C1] font-medium text-sm">תהליך פשוט</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B1220] mb-4">
              איך זה עובד?
            </h2>
            <p className="text-xl text-gray-600">שלושה צעדים פשוטים להתחלה מהירה</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {t.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center relative group"
              >
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#0B1220] to-[#1a2744] text-white rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-white">
                    {step.step}
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 right-full w-full h-0.5 bg-gradient-to-l from-[#00D1C1] to-transparent" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[#0B1220] mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#0B1220] via-[#1a2744] to-[#0B1220] overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <div className="bg-[#00D1C1]/10 border border-[#00D1C1]/20 rounded-full px-4 py-2 inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-[#00D1C1] fill-[#00D1C1]" />
                <span className="text-[#00D1C1] font-medium text-sm">המלצות</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              מה אומרים עלינו
            </h2>
            <p className="text-xl text-white/60">לקוחות מרוצים משתפים את החוויה שלהם</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-white/5 backdrop-blur-sm border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#00D1C1]/10">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-[#00D1C1] text-[#00D1C1] group-hover:scale-110 transition-transform" style={{ transitionDelay: `${j * 50}ms` }} />
                      ))}
                    </div>
                    <p className="text-white/90 mb-6 leading-relaxed text-lg italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D1C1] to-[#00eedd] flex items-center justify-center font-bold text-[#0B1220]">
                        {testimonial.author[0]}
                      </div>
                      <div>
                        <p className="text-[#00D1C1] font-bold">{testimonial.author}</p>
                        <p className="text-white/50 text-sm">בעל נכס</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-white via-[#F8FAFC] to-white">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <div className="bg-[#00D1C1]/10 border border-[#00D1C1]/20 rounded-full px-4 py-2 inline-flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#00D1C1]" />
                <span className="text-[#00D1C1] font-medium text-sm">תמחור שקוף</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B1220] mb-4">
              תוכניות ומחירים
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">בחר את התוכנית המתאימה לך - ללא התחייבות, בטל בכל עת</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(t.pricing).map(([key, plan], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full rounded-2xl transition-all duration-300 hover:-translate-y-2 ${
                  key === 'pro' 
                    ? 'border-2 border-[#00D1C1] shadow-2xl shadow-[#00D1C1]/20 bg-gradient-to-br from-white to-[#00D1C1]/5' 
                    : 'border border-gray-200 shadow-md hover:shadow-xl bg-white'
                }`}>
                  <CardContent className="p-8">
                    {key === 'pro' && (
                      <div className="relative -mt-12 mb-6">
                        <span className="bg-gradient-to-l from-[#00D1C1] to-[#00eedd] text-[#0B1220] text-sm font-bold px-6 py-2 rounded-full inline-block shadow-lg">
                          ⭐ הכי פופולרי
                        </span>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-[#0B1220] mb-4">{plan.name}</h3>
                    <div className="mb-8">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold bg-gradient-to-l from-[#0B1220] to-[#00D1C1] bg-clip-text text-transparent">₪{plan.price}</span>
                        <span className="text-gray-500 text-lg">/חודש</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">חיוב חודשי, ביטול בכל עת</p>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: j * 0.05 }}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <CheckCircle2 className="h-5 w-5 text-[#00D1C1] flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <Button 
                      size="lg"
                      className={`w-full rounded-xl py-6 text-base font-bold transition-all duration-300 ${
                        key === 'pro' 
                          ? 'bg-gradient-to-l from-[#00D1C1] to-[#00eedd] hover:shadow-xl hover:shadow-[#00D1C1]/40 text-[#0B1220] hover:-translate-y-1' 
                          : 'bg-[#0B1220] hover:bg-[#1a2744] text-white hover:shadow-lg'
                      }`}
                      onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
                    >
                      {t.startTrial}
                      <ArrowLeft className="mr-2 h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#F2E9DB]/30 to-white">
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-6">
              <div className="bg-[#00D1C1]/10 border border-[#00D1C1]/20 rounded-full px-4 py-2 inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#00D1C1]" />
                <span className="text-[#00D1C1] font-medium text-sm">יש לך שאלות?</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B1220] mb-4">
              שאלות נפוצות
            </h2>
            <p className="text-xl text-gray-600">הכל שרציתם לדעת על ATLAS</p>
          </motion.div>
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
                  className="cursor-pointer border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group hover:-translate-y-1"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 bg-white group-hover:bg-[#F8FAFC] transition-colors">
                      <span className="font-bold text-[#0B1220] text-lg pr-2">{item.q}</span>
                      <div className="flex-shrink-0">
                        {openFaq === i ? (
                          <ChevronUp className="h-6 w-6 text-[#00D1C1]" />
                        ) : (
                          <ChevronDown className="h-6 w-6 text-gray-400 group-hover:text-[#00D1C1] transition-colors" />
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 pt-0 bg-white text-gray-600 leading-relaxed text-base border-t border-gray-100">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-[#0B1220] via-[#1a2744] to-[#0B1220] overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00D1C1]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00D1C1]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block mb-8">
              <div className="bg-white/10 border border-white/20 rounded-full px-5 py-2 inline-flex items-center gap-2 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-[#00D1C1]" />
                <span className="text-white font-medium">הצטרף אלינו היום</span>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              {t.finalCta}
            </h2>
            <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">{t.tagline}</p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-l from-[#00D1C1] to-[#00eedd] hover:shadow-2xl hover:shadow-[#00D1C1]/50 text-[#0B1220] font-bold px-12 py-8 text-xl rounded-2xl transition-all duration-300 hover:-translate-y-1 group"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              >
                {t.startTrial}
                <ArrowLeft className="mr-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white hover:text-[#0B1220] px-12 py-8 text-xl rounded-2xl font-bold transition-all duration-300 backdrop-blur-sm"
                onClick={() => setDemoModalOpen(true)}
              >
                צפה בדמו
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-white/60">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>מאובטח לחלוטין</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/60" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>ללא התחייבות</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/60" />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>תמיכה 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Modal */}
      <ProductDemoModal open={demoModalOpen} onOpenChange={setDemoModalOpen} />

      {/* Footer */}
      <footer className="relative py-12 px-4 bg-[#0B1220] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <Logo variant="light" />
              <p className="text-white/50 text-sm">פלטפורמת ניהול נכסים מתקדמת</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link 
                to={createPageUrl('Privacy')} 
                className="text-white/60 hover:text-[#00D1C1] transition-colors text-sm font-medium"
              >
                {t.privacyPolicy}
              </Link>
              <Link 
                to={createPageUrl('Terms')} 
                className="text-white/60 hover:text-[#00D1C1] transition-colors text-sm font-medium"
              >
                {t.termsOfService}
              </Link>
              <a 
                href="mailto:support@stayflow.io" 
                className="text-white/60 hover:text-[#00D1C1] transition-colors text-sm font-medium"
              >
                צור קשר
              </a>
            </div>
            
            <p className="text-white/40 text-sm text-center md:text-right">
              © 2024 ATLAS. {t.allRightsReserved}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}