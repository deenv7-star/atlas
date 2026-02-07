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
      <section className="pt-20 sm:pt-32 pb-12 sm:pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B1220] leading-tight mb-4 sm:mb-6">
                {t.heroTitle}
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                {t.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
                >
                  {t.startTrial}
                  <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#0B1220] text-[#0B1220] px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl">
                  {t.bookDemo}
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="bg-gradient-to-br from-[#0B1220] to-[#1a2744] rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-2xl">
                <div className="bg-[#F8FAFC] rounded-lg sm:rounded-xl overflow-hidden">
                  <div className="bg-white border-b px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
                    <div className="flex gap-1 sm:gap-1.5">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400 mr-2 sm:mr-4 truncate">dashboard.stayflow.io</span>
                  </div>
                  <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="bg-[#00D1C1]/10 rounded-lg sm:rounded-xl p-2 sm:p-4">
                        <p className="text-xs sm:text-sm text-gray-500">לידים חדשים</p>
                        <p className="text-lg sm:text-2xl font-bold text-[#0B1220]">12</p>
                      </div>
                      <div className="bg-[#F2E9DB] rounded-lg sm:rounded-xl p-2 sm:p-4">
                        <p className="text-xs sm:text-sm text-gray-500">הזמנות החודש</p>
                        <p className="text-lg sm:text-2xl font-bold text-[#0B1220]">28</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg sm:rounded-xl border p-2 sm:p-4">
                      <div className="flex justify-between items-center mb-2 sm:mb-3">
                        <span className="text-sm sm:text-base font-medium">כניסות היום</span>
                        <span className="text-[#00D1C1] text-xs sm:text-sm">3 אורחים</span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        {['משפחת כהן - וילה צפון', 'דני לוי - סוויטה'].map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-1.5 sm:p-2 text-xs sm:text-sm">
                            <span className="truncate">{item}</span>
                            <span className="text-green-600 text-xs">מאושר</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 bg-[#00D1C1] text-[#0B1220] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg font-medium text-xs sm:text-sm">
                ✓ 0 הזמנות כפולות
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-12 sm:py-20 px-4 bg-[#0B1220]">
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
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#F59E0B] flex-shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B1220] mb-4 sm:mb-6">
              {t.solutionTitle}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
              {t.solutionText}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {t.benefits.map((benefit, i) => (
                <span key={i} className="bg-[#00D1C1]/10 text-[#0B1220] px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#00D1C1]" />
                  {benefit}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-20 px-4 bg-[#F2E9DB]/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-shadow bg-white rounded-xl sm:rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00D1C1]/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#00D1C1]" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0B1220] mb-2">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-8 sm:mb-16">
            איך זה עובד?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {t.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#0B1220] text-white rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0B1220] mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 px-4 bg-[#0B1220]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
            מה אומרים עלינו
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {t.testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-white/5 border-white/10 rounded-xl sm:rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex gap-1 mb-3 sm:mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 sm:h-5 sm:w-5 fill-[#00D1C1] text-[#00D1C1]" />
                      ))}
                    </div>
                    <p className="text-sm sm:text-base text-white/90 mb-3 sm:mb-4 leading-relaxed">"{testimonial.text}"</p>
                    <p className="text-sm sm:text-base text-[#00D1C1] font-medium">{testimonial.author}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 sm:py-20 px-4">
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
                <Card className={`h-full rounded-xl sm:rounded-2xl ${key === 'pro' ? 'border-2 border-[#00D1C1] shadow-xl' : 'border'}`}>
                  <CardContent className="p-4 sm:p-6">
                    {key === 'pro' && (
                      <span className="bg-[#00D1C1] text-[#0B1220] text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full mb-3 sm:mb-4 inline-block">
                        הכי פופולרי
                      </span>
                    )}
                    <h3 className="text-lg sm:text-xl font-bold text-[#0B1220] mb-2">{plan.name}</h3>
                    <div className="mb-4 sm:mb-6">
                      <span className="text-3xl sm:text-4xl font-bold text-[#0B1220]">₪{plan.price}</span>
                      <span className="text-sm sm:text-base text-gray-500">/חודש</span>
                    </div>
                    <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm sm:text-base text-gray-600">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#00D1C1] flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full rounded-xl text-sm sm:text-base py-5 sm:py-6 ${key === 'pro' 
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
      <section className="py-12 sm:py-20 px-4 bg-[#F2E9DB]/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-8 sm:mb-12">
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
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-white">
                      <span className="text-sm sm:text-base font-medium text-[#0B1220] pr-2">{item.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    {openFaq === i && (
                      <div className="p-3 sm:p-4 pt-0 bg-white text-sm sm:text-base text-gray-600">
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
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-br from-[#0B1220] to-[#1a2744]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
              {t.finalCta}
            </h2>
            <p className="text-lg sm:text-xl text-white/70 mb-6 sm:mb-8">{t.tagline}</p>
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-semibold px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg rounded-xl"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
            >
              {t.startTrial}
              <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 bg-[#0B1220] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <Logo variant="light" size="small" />
            <div className="flex gap-4 sm:gap-6 text-white/60 text-xs sm:text-sm">
              <Link to={createPageUrl('Privacy')} className="hover:text-white transition-colors">
                {t.privacyPolicy}
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-white transition-colors">
                {t.termsOfService}
              </Link>
            </div>
            <p className="text-white/40 text-xs sm:text-sm text-center">
              © 2024 STAYFLOW. {t.allRightsReserved}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}