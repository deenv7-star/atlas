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
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              {t.problemTitle}
            </h2>
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Visual Chaos Illustration */}
              <motion.div 
                className="relative h-[400px] bg-white/5 rounded-2xl border-2 border-white/10 overflow-hidden"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                {/* WhatsApp Messages Chaos */}
                <motion.div 
                  className="absolute top-4 right-4 bg-green-600 text-white p-2 rounded-lg text-xs max-w-[150px] shadow-lg"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                >
                  יש לכם מקום ל-15.3?
                </motion.div>
                <motion.div 
                  className="absolute top-16 left-4 bg-green-600 text-white p-2 rounded-lg text-xs max-w-[140px] shadow-lg"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                >
                  כמה עולה סופ״ש?
                </motion.div>
                <motion.div 
                  className="absolute top-28 right-8 bg-green-600 text-white p-2 rounded-lg text-xs max-w-[130px] shadow-lg"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                >
                  אפשר לבטל?
                </motion.div>
                
                {/* Excel Spreadsheet Mess */}
                <motion.div 
                  className="absolute top-44 left-8 bg-white p-3 rounded-lg shadow-xl"
                  animate={{ rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <div className="text-xs font-mono space-y-1 text-gray-700">
                    <div className="flex gap-2">
                      <div className="w-16 h-4 bg-red-200"></div>
                      <div className="w-16 h-4 bg-red-200"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-4 bg-yellow-200"></div>
                      <div className="w-16 h-4 bg-red-200"></div>
                    </div>
                    <div className="text-[8px] text-red-600 font-bold">הזמנה כפולה!</div>
                  </div>
                </motion.div>
                
                {/* Calendar Conflicts */}
                <motion.div 
                  className="absolute bottom-8 right-12 bg-white p-2 rounded shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <div className="text-xs">
                    <div className="font-bold text-red-600 mb-1">התנגשות!</div>
                    <div className="text-[10px] text-gray-600">15.3 - 2 הזמנות</div>
                  </div>
                </motion.div>
                
                {/* Post-it Notes */}
                <motion.div 
                  className="absolute bottom-20 left-16 bg-yellow-300 p-2 rounded text-[10px] shadow-md transform -rotate-6"
                  animate={{ rotate: [-6, -4, -6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  לזכור לגבות<br/>יתרה!
                </motion.div>
                
                {/* Warning Icons */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <AlertCircle className="h-16 w-16 text-red-500" />
                </motion.div>
              </motion.div>
              
              {/* Problems List */}
              <div className="space-y-3">
                {t.problemBullets.map((bullet, i) => (
                  <motion.div 
                    key={i} 
                    className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/80 flex items-center gap-3"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AlertCircle className="h-5 w-5 text-[#F59E0B] flex-shrink-0" />
                    <span>{bullet}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4">
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

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
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
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-16">
            איך זה עובד?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {t.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                {/* Animated Illustration */}
                <div className="relative h-48 mb-6 flex items-center justify-center">
                  {i === 0 && (
                    <motion.div className="relative">
                      {/* Properties Animation */}
                      <motion.div 
                        className="w-24 h-24 bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] rounded-2xl shadow-lg flex items-center justify-center"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Calendar className="h-12 w-12 text-white" />
                      </motion.div>
                      <motion.div 
                        className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#0B1220] rounded-xl shadow-lg flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      >
                        <CheckCircle2 className="h-8 w-8 text-[#00D1C1]" />
                      </motion.div>
                    </motion.div>
                  )}
                  {i === 1 && (
                    <motion.div className="relative">
                      {/* Lead to Booking Animation */}
                      <motion.div 
                        className="absolute right-0"
                        animate={{ x: [0, 60, 60] }}
                        transition={{ repeat: Infinity, duration: 3, times: [0, 0.5, 1] }}
                      >
                        <div className="w-20 h-20 bg-gray-200 rounded-xl shadow-lg flex items-center justify-center">
                          <Users className="h-10 w-10 text-gray-500" />
                        </div>
                      </motion.div>
                      <motion.div 
                        className="absolute left-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 3, times: [0, 0.5, 1] }}
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] rounded-xl shadow-lg flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                      </motion.div>
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        animate={{ opacity: [0, 0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 3, times: [0, 0.4, 0.6, 1] }}
                      >
                        <ArrowLeft className="h-8 w-8 text-[#00D1C1]" />
                      </motion.div>
                    </motion.div>
                  )}
                  {i === 2 && (
                    <motion.div className="relative">
                      {/* Automation Animation */}
                      <div className="grid grid-cols-2 gap-3">
                        {[CreditCard, Brush, MessageSquare, FileText].map((Icon, idx) => (
                          <motion.div
                            key={idx}
                            className="w-16 h-16 bg-gradient-to-br from-[#00D1C1]/20 to-[#00D1C1]/5 rounded-xl border-2 border-[#00D1C1]/30 flex items-center justify-center"
                            animate={{ 
                              scale: [1, 1.1, 1],
                              borderColor: ['rgba(0, 209, 193, 0.3)', 'rgba(0, 209, 193, 0.8)', 'rgba(0, 209, 193, 0.3)']
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 2,
                              delay: idx * 0.2
                            }}
                          >
                            <Icon className="h-7 w-7 text-[#00D1C1]" />
                          </motion.div>
                        ))}
                      </div>
                      <motion.div
                        className="absolute -top-2 -right-2 bg-[#0B1220] text-white px-2 py-1 rounded-lg text-xs font-bold"
                        animate={{ scale: [0, 1, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, times: [0, 0.2, 0.8, 1] }}
                      >
                        AUTO
                      </motion.div>
                    </motion.div>
                  )}
                </div>
                
                <div className="w-16 h-16 bg-[#0B1220] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
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
      <section className="py-20 px-4 bg-gray-50">
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
              מוכנים לנהל את הנכסים שלכם באופן מקצועי?
            </h2>
            <p className="text-xl text-white/70 mb-8">הצטרפו לבעלי הנכסים שכבר חוסכים 20+ שעות בשבוע</p>
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