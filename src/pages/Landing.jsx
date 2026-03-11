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

/* ─── Noise texture (adds tactile depth like Raycast/Linear) ── */
const NoiseTexture = () => (
  <div
    className="fixed inset-0 z-[1] pointer-events-none opacity-[0.028] mix-blend-multiply"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '256px 256px',
    }}
  />
);

export default function Landing() {
  const t = translations.he;
  const [openFaq, setOpenFaq] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FAFBFF] relative"
      style={{ fontFamily: "'Assistant', 'Heebo', sans-serif" }}
    >
      <NoiseTexture />

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between h-14
            bg-white/80 backdrop-blur-xl
            border border-gray-200/70
            rounded-2xl px-5
            shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)_inset]"
          >
            <Logo variant="dark" />

            {/* Anchor nav — desktop */}
            <div className="hidden md:flex items-center gap-0.5 bg-[#F7F8FD] rounded-xl p-1 border border-gray-200/60">
              {[
                { label: 'תכונות', href: '#features' },
                { label: 'מחירים', href: '#pricing' },
                { label: 'ביקורות', href: '#testimonials' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-150"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-900 hidden sm:inline-flex font-medium"
                onClick={() => setShowLoginPopup(true)}
              >
                כניסה
              </Button>
              <Button
                size="sm"
                className="bg-[#0B1220] hover:bg-[#161f36] text-white rounded-xl font-semibold
                  shadow-[0_4px_14px_rgba(11,18,32,0.22)]
                  hover:shadow-[0_6px_20px_rgba(11,18,32,0.3)]
                  transition-all duration-200"
                onClick={() => setShowLoginPopup(true)}
              >
                התחל בחינם
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <HeroSection onLoginClick={() => setShowLoginPopup(true)} />

      {/* ── BENEFITS ─────────────────────────────────────────── */}
      <BenefitsGrid />

      {/* ── SOLUTION SPLIT ───────────────────────────────────── */}
      <section id="features" className="py-28 bg-[#F7F8FD] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_50%,rgba(0,209,193,0.06)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden
                shadow-[0_24px_64px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)]
                border border-gray-100">
                <CustomIllustration type="solution" />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5
                bg-white rounded-full border border-gray-200/80
                shadow-[0_2px_10px_rgba(0,0,0,0.06)]
                text-xs font-semibold text-gray-600 mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
                הפתרון שלנו
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-[1.08]">
                <span className="bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {t.solutionTitle}
                </span>
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">{t.solutionText}</p>
              <div className="flex flex-wrap gap-2.5">
                {t.benefits.map((b, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="inline-flex items-center gap-1.5
                      bg-white border border-gray-200/80 px-4 py-2 rounded-xl
                      text-sm font-semibold text-gray-700
                      shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                      hover:border-[#00D1C1]/40 hover:shadow-[0_4px_16px_rgba(0,209,193,0.1)]
                      transition-all duration-200"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#00D1C1]" />
                    {b}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ─────────────────────────────────── */}
      <FeatureShowcase />

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-28 bg-[#F7F8FD] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(124,58,237,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5
              bg-white rounded-full border border-gray-200/80
              shadow-[0_2px_10px_rgba(0,0,0,0.05)]
              text-xs font-semibold text-gray-600 mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              תהליך פשוט
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
                מוכנים תוך 15 דקות
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 relative">
            {/* Dashed connector */}
            <div className="hidden md:block absolute top-[3.25rem] inset-x-[16.6%] h-px border-t-2 border-dashed border-gray-200 z-0" />

            {t.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.14 }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
                className="relative z-10"
              >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-7 text-center
                  border border-white/90
                  shadow-[0_4px_24px_rgba(0,0,0,0.06)]
                  hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]
                  transition-shadow duration-300"
                >
                  <div className="w-14 h-14 bg-[#0B1220] text-white rounded-2xl
                    flex items-center justify-center mx-auto mb-6
                    text-xl font-black
                    shadow-[0_8px_24px_rgba(11,18,32,0.22)]">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <div id="testimonials"><TestimonialsSection /></div>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <div id="pricing"><PricingSection onSelectPlan={() => setShowLoginPopup(true)} /></div>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-28 bg-[#F7F8FD] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,rgba(0,209,193,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5
              bg-white rounded-full border border-gray-200/80
              shadow-[0_2px_10px_rgba(0,0,0,0.05)]
              text-xs font-semibold text-gray-600 mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1]" />
              שאלות נפוצות
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">
                יש לכם שאלות?
              </span>
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
                  className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${
                    openFaq === i
                      ? 'bg-white/90 backdrop-blur-xl border border-[#00D1C1]/25 shadow-[0_8px_32px_rgba(0,209,193,0.1)]'
                      : 'bg-white/70 backdrop-blur-sm border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)] hover:border-gray-200'
                  }`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between p-5">
                    <span className="font-semibold text-gray-900 text-base">{item.q}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      openFaq === i
                        ? 'bg-[#00D1C1] text-white shadow-[0_4px_12px_rgba(0,209,193,0.3)]'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {openFaq === i
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />
                      }
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
                        <div className="px-5 pb-5 text-gray-500 leading-relaxed border-t border-gray-100/60 pt-4">
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
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-[#0B1220] p-8 md:p-12 lg:p-16 text-center
              shadow-[0_32px_80px_rgba(11,18,32,0.22)]"
          >
            {/* Internal glow */}
            <div className="absolute top-0 right-1/4 w-80 h-40 bg-[#00D1C1]/12 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-60 h-36 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,209,193,0.08)_0%,transparent_60%)] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5
                bg-white/8 border border-white/15 rounded-full
                text-xs font-semibold text-white/60 mb-7"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1C1] opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00D1C1]" />
                </span>
                תתחילו היום — בחינם
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
                {t.finalCta}
              </h2>
              <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">{t.tagline}</p>

              <Button
                size="lg"
                onClick={() => setShowLoginPopup(true)}
                className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-bold px-12 h-13 text-base rounded-2xl
                  shadow-[0_8px_32px_rgba(0,209,193,0.4)]
                  hover:shadow-[0_12px_40px_rgba(0,209,193,0.5)]
                  transition-all duration-300"
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
            <div className="flex items-center gap-0.5 bg-white/5 border border-white/8 rounded-2xl p-1">
              {[
                { label: 'מחירים', href: '#pricing' },
                { label: 'בלוג', href: '#' },
                { label: 'פרטיות', to: createPageUrl('Privacy') },
                { label: 'תנאים', to: createPageUrl('Terms') },
              ].map((item) =>
                item.to ? (
                  <Link key={item.label} to={item.to}
                    className="px-4 py-1.5 rounded-xl text-sm text-white/40 hover:text-white/80 hover:bg-white/8 transition-all font-medium">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href}
                    className="px-4 py-1.5 rounded-xl text-sm text-white/40 hover:text-white/80 hover:bg-white/8 transition-all font-medium">
                    {item.label}
                  </a>
                )
              )}
            </div>

            <p className="text-white/25 text-xs font-medium">© 2024 ATLAS. כל הזכויות שמורות.</p>
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
