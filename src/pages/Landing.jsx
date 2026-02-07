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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Logo variant="dark" />
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full px-5 h-11 text-sm"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                כניסה
              </Button>
              <Button 
                className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-5 h-11 text-sm font-normal"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                {t.startTrial}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 sm:pt-48 pb-32 sm:pb-40 px-6 overflow-hidden bg-white">
        <div className="max-w-[980px] mx-auto text-center">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[112px] font-semibold leading-[1.05] mb-6 text-[#1d1d1f] tracking-tight">
            ניהול נכסים
            <br />
            שונה לחלוטין
          </h1>

          <p className="text-2xl sm:text-3xl md:text-4xl text-[#86868b] mb-12 leading-relaxed font-normal max-w-[820px] mx-auto">
            אוטומציה מלאה. בינה מלאכותית. ממשק אינטואיטיבי.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
            <Button
              size="lg"
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-10 h-16 text-xl font-normal shadow-lg"
              onClick={() => navigate(createPageUrl('Dashboard'))}
            >
              התחל בחינם
            </Button>
            <Button
              size="lg"
              variant="link"
              className="text-[#0071e3] hover:underline px-10 h-16 text-xl font-normal"
            >
              למד עוד
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-[1400px] mx-auto mt-20">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/10">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&h=900&fit=crop&q=80" 
                alt="Dashboard Preview"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>



      {/* Features Grid */}
      <section className="py-32 sm:py-40 px-6 bg-white">
        <div className="max-w-[980px] mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-[#1d1d1f] mb-6 tracking-tight leading-[1.05]">
              כל מה שאתה צריך.<br />במקום אחד.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0071e3] to-[#00a0dc] rounded-[1.25rem] flex items-center justify-center mb-8 mx-auto">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-4">
                  {feature.title}
                </h3>
                <p className="text-[#86868b] text-xl leading-relaxed">{feature.desc}</p>
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

      {/* CTA Section */}
      <section className="py-32 sm:py-40 px-6 bg-[#fbfbfd]">
        <div className="max-w-[980px] mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-[#1d1d1f] mb-8 tracking-tight leading-[1.05]">
            התחל עכשיו.<br />בחינם.
          </h2>
          <p className="text-2xl sm:text-3xl text-[#86868b] mb-12 leading-relaxed font-normal">
            30 יום ניסיון ללא התחייבות. ללא כרטיס אשראי.
          </p>
          <Button 
            size="lg" 
            className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-10 h-16 text-xl font-normal shadow-lg"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            התחל את הניסיון החינמי
          </Button>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 sm:py-40 px-6 bg-white">
        <div className="max-w-[980px] mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-[#1d1d1f] mb-6 tracking-tight leading-[1.05]">
              תוכניות ומחירים
            </h2>
            <p className="text-2xl text-[#86868b]">בחר את התוכנית המתאימה לך</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(t.pricing).map(([key, plan]) => (
              <div key={key} className={`rounded-[2rem] p-10 ${key === 'pro' ? 'bg-[#1d1d1f] text-white scale-105' : 'bg-[#fbfbfd] text-[#1d1d1f]'}`}>
                {key === 'pro' && (
                  <div className="text-[#0071e3] text-sm font-semibold mb-6 tracking-wide">הכי פופולרי</div>
                )}
                <h3 className="text-3xl font-semibold mb-3">{plan.name}</h3>
                <div className="mb-8">
                  <span className="text-6xl font-semibold">₪{plan.price}</span>
                  <span className={`text-xl ${key === 'pro' ? 'text-white/60' : 'text-[#86868b]'}`}>/חודש</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-[#0071e3]" />
                      <span className={`text-base ${key === 'pro' ? 'text-white/90' : 'text-[#1d1d1f]'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full rounded-full h-14 text-base font-normal ${key === 'pro' 
                    ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white' 
                    : 'bg-[#0071e3] hover:bg-[#0077ed] text-white'}`}
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                >
                  {t.startTrial}
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
      <section className="py-32 sm:py-40 px-6 bg-[#f5f5f7]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-[#1d1d1f] mb-8 leading-[1.05] tracking-tight">
            {t.finalCta}
          </h2>
          <p className="text-2xl sm:text-3xl text-[#86868b] mb-12 leading-relaxed">{t.tagline}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button 
              size="lg" 
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-10 h-16 text-xl font-normal shadow-lg"
              onClick={() => navigate(createPageUrl('Dashboard'))}
            >
              {t.startTrial}
            </Button>
            <Button 
              size="lg" 
              variant="link"
              className="text-[#0071e3] hover:underline px-10 h-16 text-xl font-normal"
            >
              דבר איתנו
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#f5f5f7] border-t border-[#d2d2d7]">
        <div className="max-w-[980px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="dark" />
            <div className="flex gap-6 text-[#86868b] text-sm">
              <Link to={createPageUrl('Privacy')} className="hover:text-[#1d1d1f] transition-colors">
                {t.privacyPolicy}
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-[#1d1d1f] transition-colors">
                {t.termsOfService}
              </Link>
            </div>
            <p className="text-[#86868b] text-sm">
              © 2026 ATLAS. {t.allRightsReserved}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}