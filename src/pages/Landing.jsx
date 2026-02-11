import React, { useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import Logo from '@/components/common/Logo';
import { translations } from '@/components/common/i18n';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import HeroSection from '@/components/landing/HeroSection';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import BenefitsGrid from '@/components/landing/BenefitsGrid';
import LoginPopup from '@/components/landing/LoginPopup';
import { Card, CardContent } from '@/components/ui/card';

export default function Landing() {
  const t = translations.he;
  const [openFaq, setOpenFaq] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] font-['Heebo',sans-serif]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Logo variant="dark" />
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to={createPageUrl('Dashboard')}>
                <Button 
                  variant="ghost" 
                  className="text-gray-500 hover:text-gray-700 text-sm sm:text-base h-10 sm:h-auto"
                >
                  דלג
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="text-[#0F172A] text-sm sm:text-base h-10 sm:h-auto"
                onClick={() => setLoginOpen(true)}
              >
                כניסה
              </Button>
              <Button 
                className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-medium text-sm sm:text-base h-10 sm:h-auto"
                onClick={() => setLoginOpen(true)}
              >
                {t.startTrial}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <Suspense fallback={<div className="h-screen bg-white" />}>
        <HeroSection onLoginClick={() => setLoginOpen(true)} />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-white" />}>
        <FeatureShowcase />
      </Suspense>
      
      <Suspense fallback={<div className="h-80 bg-white" />}>
        <BenefitsGrid />
      </Suspense>

      {/* FAQ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#F2E9DB]/30">
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
                    <div className="flex items-center justify-between p-4 bg-white">
                      <span className="font-medium text-[#0B1220] text-sm sm:text-base">{item.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    {openFaq === i && (
                      <div className="p-4 pt-0 bg-white text-gray-600 text-sm sm:text-base">
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
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-[#0B1220] to-[#1a2744]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
              {t.finalCta}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/70 mb-8">{t.tagline}</p>
            <Button 
              size="lg" 
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-semibold px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto min-h-12"
              onClick={() => setLoginOpen(true)}
            >
              {t.startTrial}
              <ArrowLeft className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-[#0B1220] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center text-center gap-6 sm:gap-4 md:flex-row md:justify-between md:text-left">
            <Logo variant="light" />
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-white/60 text-xs sm:text-sm">
              <Link to={createPageUrl('Privacy')} className="hover:text-white transition-colors">
                {t.privacyPolicy}
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-white transition-colors">
                {t.termsOfService}
              </Link>
            </div>
            <p className="text-white/40 text-xs sm:text-sm">
              © 2024 STAYFLOW. {t.allRightsReserved}
            </p>
          </div>
        </div>
      </footer>

      <LoginPopup isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}