import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import Logo from '@/components/common/Logo';
import { translations } from '@/components/common/i18n';
import { Button } from '@/components/ui/button';
import LoginPopup from '@/components/landing/LoginPopup';
import SupportChat from '@/components/landing/SupportChat';
import HeroSection from '@/components/landing/HeroSection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import BenefitsGrid from '@/components/landing/BenefitsGrid';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import CustomIllustration from '@/components/landing/CustomIllustration';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Landing() {
  const t = translations.he;
  const [openFaq, setOpenFaq] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleSelectPlan = () => {
    setShowLoginPopup(true);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F4F6FB]" style={{ fontFamily: "'Assistant', 'Heebo', sans-serif" }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between h-14 bg-white/80 backdrop-blur-xl border border-gray-200/80 rounded-2xl px-5 shadow-sm shadow-gray-900/5">
            <Logo variant="dark" />

            {/* Pill nav links — desktop */}
            <div className="hidden md:flex items-center gap-1 bg-[#F4F6FB] rounded-xl p-1 border border-gray-200">
              {[
                { label: 'תכונות', href: '#features' },
                { label: 'מחירים', href: '#pricing' },
                { label: 'ביקורות', href: '#testimonials' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hidden sm:inline-flex"
                onClick={() => setShowLoginPopup(true)}
              >
                כניסה
              </Button>
              <Button
                size="sm"
                className="bg-[#0B1220] hover:bg-[#1a2744] text-white rounded-xl shadow-sm font-medium"
                onClick={() => setShowLoginPopup(true)}
              >
                התחל בחינם
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <HeroSection onLoginClick={() => setShowLoginPopup(true)} />

      {/* ── SOLUTION / BENEFITS ─────────────────────────────── */}
      <BenefitsGrid />

      {/* ── SOLUTION SPLIT ─────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden shadow-xl shadow-gray-200/60 border border-gray-100">
                <CustomIllustration type="solution" />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4F6FB] border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
                הפתרון שלנו
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
                {t.solutionTitle}
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                {t.solutionText}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {t.benefits.map((benefit, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#00D1C1]" />
                    {benefit}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ────────────────────────────────── */}
      <FeatureShowcase />

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-24 bg-[#F4F6FB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              איך זה עובד?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              מוכנים תוך 15 דקות
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {t.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {/* connector line */}
                {i < t.howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-0 w-full h-px border-t-2 border-dashed border-gray-200 z-0" style={{ left: '50%' }} />
                )}
                <div className="relative z-10 bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow text-center">
                  <div className="w-14 h-14 bg-[#0B1220] text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-bold shadow-lg shadow-gray-900/20">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <div id="testimonials">
        <TestimonialsSection />
      </div>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <div id="pricing">
        <PricingSection onSelectPlan={handleSelectPlan} />
      </div>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F4F6FB]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              שאלות נפוצות
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              יש לכם שאלות?
            </h2>
          </motion.div>

          <div className="space-y-3">
            {t.faq.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  className={`bg-white rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                    openFaq === i ? 'border-[#00D1C1]/40 shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md'
                  }`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between p-5">
                    <span className="font-semibold text-gray-900">{item.q}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      openFaq === i ? 'bg-[#00D1C1] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {openFaq === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 text-gray-500 leading-relaxed text-sm border-t border-gray-100 pt-4">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#0B1220] rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
          >
            {/* glow */}
            <div className="absolute top-0 right-1/4 w-80 h-40 bg-[#00D1C1]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-60 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-medium text-white/70 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1] animate-pulse" />
                תתחילו היום — בחינם
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {t.finalCta}
              </h2>
              <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">{t.tagline}</p>
              <Button
                size="lg"
                className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-bold px-10 h-13 text-base rounded-2xl shadow-lg shadow-[#00D1C1]/30 hover:shadow-xl transition-all"
                onClick={() => setShowLoginPopup(true)}
              >
                {t.startTrial}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="py-10 px-4 bg-[#0B1220]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="light" />
            {/* Pill nav */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
              {[
                { label: 'מחירים', href: '#pricing' },
                { label: 'בלוג', href: '#' },
                { label: 'פרטיות', to: createPageUrl('Privacy') },
                { label: 'תנאים', to: createPageUrl('Terms') },
              ].map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="px-4 py-1.5 rounded-xl text-sm text-white/50 hover:text-white/90 hover:bg-white/10 transition-all"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="px-4 py-1.5 rounded-xl text-sm text-white/50 hover:text-white/90 hover:bg-white/10 transition-all"
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>
            <p className="text-white/30 text-xs">© 2024 ATLAS. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>

      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onLogin={handleLogin}
      />
      <SupportChat />
    </div>
  );
}
