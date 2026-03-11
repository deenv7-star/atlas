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
      <footer className="py-16 px-4 bg-[#0B1220] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="space-y-4">
              <Logo variant="light" />
              <p className="text-white/60 text-sm leading-relaxed">
                פלטפורמת ניהול מתקדמת לעסקי אירוח. הפתרון המושלם לניהול הזמנות, תשלומים ותקשורת עם אורחים.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white/60 hover:text-[#00D1C1] transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-white/60 hover:text-[#00D1C1] transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                  </svg>
                </a>
                <a href="#" className="text-white/60 hover:text-[#00D1C1] transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                  </svg>
                </a>
                <a href="#" className="text-white/60 hover:text-[#00D1C1] transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-bold mb-4">המוצר</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('features');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    תכונות
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('pricing');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    מחירים
                  </button>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    מקרי שימוש
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    אינטגרציות
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    עדכונים
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-bold mb-4">החברה</h3>
              <ul className="space-y-3">
                <li>
                  <Link to={createPageUrl('About')} className="text-white/60 hover:text-white transition-colors text-sm">
                    אודות
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    קריירה
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('testimonials');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    המלצות
                  </button>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    בלוג
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    צור קשר
                  </a>
                </li>
              </ul>
            </div>

            {/* Support & Legal */}
            <div>
              <h3 className="text-white font-bold mb-4">תמיכה ומשפטי</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    מרכז עזרה
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                    תיעוד API
                  </a>
                </li>
                <li>
                  <Link to={createPageUrl('Privacy')} className="text-white/60 hover:text-white transition-colors text-sm">
                    {t.privacyPolicy}
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('Terms')} className="text-white/60 hover:text-white transition-colors text-sm">
                    {t.termsOfService}
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('Accessibility')} className="text-white/60 hover:text-white transition-colors text-sm">
                    הצהרת נגישות
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/40 text-sm">
                © 2024 STAYFLOW. {t.allRightsReserved}
              </p>
              <div className="flex items-center gap-4 text-white/40 text-sm">
                <span>🇮🇱 ישראל</span>
                <span>•</span>
                <a href="mailto:support@stayflow.io" className="hover:text-white transition-colors">
                  support@stayflow.io
                </a>
                <span>•</span>
                <a href="tel:+972501234567" className="hover:text-white transition-colors">
                  050-123-4567
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}