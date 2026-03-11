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
import { CheckCircle2, ChevronDown, ChevronUp, ArrowLeft, Sparkles } from 'lucide-react';
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
    <div dir="rtl" className="min-h-screen" style={{ fontFamily: "'Assistant', 'Heebo', sans-serif", background: '#F4F6FB' }}>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between h-14 px-5 rounded-2xl"
               style={{
                 background: 'rgba(255,255,255,0.82)',
                 backdropFilter: 'blur(20px)',
                 WebkitBackdropFilter: 'blur(20px)',
                 border: '1px solid rgba(255,255,255,0.6)',
                 boxShadow: '0 4px 20px rgba(11,18,32,0.07), 0 1px 3px rgba(11,18,32,0.04)',
               }}>

            {/* Left: Logo */}
            <Logo variant="dark" />

            {/* Center: Pill nav links */}
            <div className="hidden md:flex items-center gap-0.5 rounded-xl p-1"
                 style={{
                   background: 'rgba(244,246,251,0.9)',
                   border: '1px solid rgba(226,232,240,0.8)',
                 }}>
              {[
                { label: 'תכונות', href: '#features' },
                { label: 'מחירים', href: '#pricing' },
                { label: 'ביקורות', href: '#testimonials' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-white transition-all"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Right: CTAs */}
            <div className="flex items-center gap-2">
              <button
                className="hidden sm:block text-gray-500 hover:text-gray-800 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all hover:bg-gray-100"
                onClick={() => setShowLoginPopup(true)}
              >
                כניסה
              </button>
              <button
                onClick={() => setShowLoginPopup(true)}
                className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 100%)',
                  boxShadow: '0 2px 10px rgba(11,18,32,0.25)',
                }}
              >
                התחל בחינם
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <HeroSection onLoginClick={() => setShowLoginPopup(true)} />

      {/* ── BENEFITS GRID ────────────────────────────────────────── */}
      <BenefitsGrid />

      {/* ── SOLUTION SPLIT ───────────────────────────────────────── */}
      <section id="features" className="py-24 relative overflow-hidden"
               style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 100%)' }}>

        <div className="absolute top-0 left-0 w-[400px] h-[300px] pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(0,209,193,0.06) 0%, transparent 60%)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Illustration */}
            <div className="order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden p-1"
                   style={{
                     background: 'linear-gradient(135deg, rgba(0,209,193,0.20) 0%, rgba(255,255,255,0.4) 50%, rgba(99,102,241,0.12) 100%)',
                     boxShadow: '0 16px 48px rgba(11,18,32,0.10), 0 4px 12px rgba(11,18,32,0.06)',
                   }}>
                <div className="rounded-[1.3rem] overflow-hidden">
                  <CustomIllustration type="solution" />
                </div>
              </div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="section-label mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
                הפתרון שלנו
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1220] mb-5 leading-tight tracking-tight">
                {t.solutionTitle}
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed font-medium">
                {t.solutionText}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {t.benefits.map((benefit, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(226,232,240,0.8)',
                      boxShadow: '0 2px 8px rgba(11,18,32,0.05)',
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#00D1C1] flex-shrink-0" />
                    {benefit}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ─────────────────────────────────────── */}
      <FeatureShowcase />

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden"
               style={{ background: 'linear-gradient(180deg, #F4F6FB 0%, #eef2f9 100%)' }}>

        <div className="absolute top-0 right-1/2 translate-x-1/2 w-[700px] h-[350px] pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at center, rgba(0,209,193,0.08) 0%, transparent 65%)' }} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="section-label mb-5 mx-auto w-fit">
              <Sparkles className="w-3 h-3" />
              איך זה עובד?
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1220] tracking-tight">
              מוכנים תוך 15 דקות
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 relative">
            {/* Dashed connector line */}
            <div className="hidden md:block absolute top-10 right-[16.7%] left-[16.7%] h-px pointer-events-none"
                 style={{ borderTop: '2px dashed rgba(0,209,193,0.25)' }} />

            {t.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                className="relative z-10 rounded-3xl p-7 text-center cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.88)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 20px rgba(11,18,32,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                {/* Gradient top accent */}
                <div className="absolute top-0 left-8 right-8 h-px rounded-b-full"
                     style={{ background: 'linear-gradient(90deg, transparent, rgba(0,209,193,0.40), transparent)' }} />

                <div className="w-14 h-14 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-extrabold"
                     style={{
                       background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 100%)',
                       boxShadow: '0 8px 24px rgba(11,18,32,0.22)',
                     }}>
                  {step.step}
                </div>
                <h3 className="text-lg font-extrabold text-[#0B1220] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <div id="testimonials">
        <TestimonialsSection />
      </div>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <div id="pricing">
        <PricingSection onSelectPlan={handleSelectPlan} />
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden"
               style={{ background: 'linear-gradient(180deg, #f8f9ff 0%, #F4F6FB 100%)' }}>

        <div className="absolute top-0 right-0 w-[400px] h-[300px] pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 90% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="section-label mb-5 mx-auto w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              שאלות נפוצות
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B1220] tracking-tight">
              יש לכם שאלות?
            </h2>
          </motion.div>

          <div className="space-y-3">
            {t.faq.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  className="rounded-2xl overflow-hidden transition-all cursor-pointer"
                  style={
                    openFaq === i
                      ? {
                          background: 'rgba(255,255,255,0.95)',
                          border: '1px solid rgba(0,209,193,0.25)',
                          boxShadow: '0 8px 24px rgba(0,209,193,0.10), 0 2px 6px rgba(11,18,32,0.05)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.80)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(226,232,240,0.7)',
                          boxShadow: '0 2px 8px rgba(11,18,32,0.04)',
                        }
                  }
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between p-5">
                    <span className="font-bold text-[#0B1220] text-sm leading-relaxed">{item.q}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-4 transition-all"
                         style={
                           openFaq === i
                             ? { background: 'rgba(0,209,193,0.15)', color: '#00D1C1' }
                             : { background: 'rgba(226,232,240,0.8)', color: '#9ca3af' }
                         }>
                      {openFaq === i
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 text-gray-500 leading-relaxed text-sm font-medium"
                             style={{ borderTop: '1px solid rgba(226,232,240,0.7)', paddingTop: '1rem' }}>
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

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-16 px-4"
               style={{ background: '#F4F6FB' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-10 md:p-16 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #0B1220 0%, #162035 100%)',
              boxShadow: '0 24px 64px rgba(11,18,32,0.20), 0 8px 24px rgba(11,18,32,0.12)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Glow blobs */}
            <div className="absolute top-0 right-1/4 w-80 h-40 pointer-events-none"
                 style={{
                   background: 'radial-gradient(ellipse at center, rgba(0,209,193,0.18) 0%, transparent 65%)',
                   filter: 'blur(32px)',
                 }} />
            <div className="absolute bottom-0 left-1/4 w-60 h-40 pointer-events-none"
                 style={{
                   background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 65%)',
                   filter: 'blur(32px)',
                 }} />

            {/* Dot grid overlay */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                 style={{
                   backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
                   backgroundSize: '24px 24px',
                 }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                   style={{
                     background: 'rgba(255,255,255,0.08)',
                     border: '1px solid rgba(255,255,255,0.12)',
                     color: 'rgba(255,255,255,0.65)',
                   }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1C1] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D1C1]"></span>
                </span>
                תתחילו היום — בחינם
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                {t.finalCta}
              </h2>
              <p className="text-lg mb-10 max-w-xl mx-auto font-medium"
                 style={{ color: 'rgba(255,255,255,0.50)' }}>
                {t.tagline}
              </p>
              <button
                onClick={() => setShowLoginPopup(true)}
                className="btn-premium inline-flex items-center gap-2.5 text-[#0B1220] font-bold px-10 h-13 text-base rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
                  boxShadow: '0 8px 24px rgba(0,209,193,0.40)',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                }}
              >
                {t.startTrial}
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="py-10 px-4"
              style={{ background: '#0B1220', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="light" />

            <div className="flex items-center gap-0.5 rounded-xl p-1"
                 style={{
                   background: 'rgba(255,255,255,0.04)',
                   border: '1px solid rgba(255,255,255,0.07)',
                 }}>
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
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>

            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
              © 2024 ATLAS. כל הזכויות שמורות.
            </p>
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
