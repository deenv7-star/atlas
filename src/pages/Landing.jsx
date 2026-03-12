import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LoginPopup from '@/components/landing/LoginPopup';
import SupportChat from '@/components/landing/SupportChat';
import HeroSection from '@/components/landing/HeroSection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import BenefitsGrid from '@/components/landing/BenefitsGrid';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import {
  CheckCircle2, ChevronDown, ArrowLeft, Sparkles,
  Star, Menu, X, Building2, BarChart3, MessageSquare,
  Shield, Zap, Globe,
} from 'lucide-react';

// Scroll reveal hook
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Landing() {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleSelectPlan = () => {
    setShowLoginPopup(true);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'תכונות', id: 'features' },
    { label: 'מחירים', id: 'pricing' },
    { label: 'ביקורות', id: 'testimonials' },
  ];

  return (
    <div className="min-h-screen bg-white text-right" dir="rtl">
      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D1C1] to-[#00a89a] flex items-center justify-center shadow-lg shadow-[#00D1C1]/20">
              <span className="text-[#0B1220] font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg text-[#0B1220]">ATLAS</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm text-gray-600 hover:text-[#00D1C1] font-medium transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogin}
              className="hidden sm:block text-sm font-medium text-gray-600 hover:text-[#0B1220] transition-colors"
            >
              כניסה
            </button>
            <button
              onClick={handleSelectPlan}
              className="btn-teal text-sm px-4 py-2 rounded-lg shadow-sm"
            >
              התחל בחינם
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-1.5 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="block w-full text-right text-sm font-medium text-gray-700 py-2"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={handleLogin}
              className="block w-full text-right text-sm font-medium text-gray-600 py-2"
            >
              כניסה
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-16">
        <HeroSection onGetStarted={handleSelectPlan} onLogin={handleLogin} />
      </section>

      {/* Stats Banner */}
      <div className="bg-[#0B1220] py-8 reveal">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: '+25K', label: 'הזמנות מנוהלות' },
              { value: '98%', label: 'שביעות רצון לקוחות' },
              { value: '4.9★', label: 'דירוג ממוצע' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl md:text-3xl font-bold text-[#00D1C1]">{stat.value}</p>
                <p className="text-xs text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white reveal">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 bg-[#00D1C1]/10 text-[#00D1C1] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              כל מה שצריך לנהל נכסים
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] mb-4">
              פלטפורמה מלאה לניהול נכסים
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              ATLAS מאחדת את כל הכלים שאתה צריך לניהול נכסי נופש - מהזמנות ועד תשלומים
            </p>
          </div>
          <BenefitsGrid />
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-16 md:py-24 bg-gray-50/50 reveal">
        <div className="max-w-6xl mx-auto px-4">
          <FeatureShowcase onGetStarted={handleSelectPlan} />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-white reveal">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] mb-4">
              מחירים פשוטים ושקופים
            </h2>
            <p className="text-gray-500">בחר את התוכנית המתאימה לך. ללא הפתעות.</p>
          </div>
          <PricingSection onSelectPlan={handleSelectPlan} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-gray-50/50 reveal">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] mb-4">
              לקוחות מרוצים
            </h2>
            <p className="text-gray-500">מה אומרים עלינו מנהלי נכסים בכל הארץ</p>
          </div>
          <TestimonialsSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#0B1220] reveal">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            מוכן להתחיל?
          </h2>
          <p className="text-white/60 mb-8 text-base">
            הצטרף לאלפי מנהלי נכסים שכבר משתמשים ב-ATLAS
          </p>
          <button
            onClick={handleSelectPlan}
            className="btn-teal text-base px-8 py-3 rounded-xl shadow-lg"
          >
            התחל ניסיון חינם
          </button>
          <p className="text-white/30 text-xs mt-4">ללא כרטיס אשראי · 14 ימי ניסיון</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060d18] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D1C1] to-[#00a89a] flex items-center justify-center">
                  <span className="text-[#0B1220] font-bold text-xs">A</span>
                </div>
                <span className="font-bold text-white">ATLAS</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                פלטפורמה לניהול נכסי נופש.
                חכם, מהיר, מדויק.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">מוצר</p>
              <ul className="space-y-2">
                {[
                  { label: 'תכונות', id: 'features' },
                  { label: 'מחירים', id: 'pricing' },
                  { label: 'ביקורות', id: 'testimonials' },
                ].map(link => (
                  <li key={link.id}>
                    <button onClick={() => scrollTo(link.id)} className="text-xs text-white/50 hover:text-white transition-colors">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">משפטי</p>
              <ul className="space-y-2">
                {[
                  { label: 'פרטיות', page: 'Privacy' },
                  { label: 'תנאי שימוש', page: 'Terms' },
                  { label: 'SLA', page: 'SLA' },
                  { label: 'נגישות', page: 'Accessibility' },
                  { label: 'אבטחת מידע', page: 'DataSecurity' },
                ].map(link => (
                  <li key={link.page}>
                    <Link to={createPageUrl(link.page)} className="text-xs text-white/50 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">חברה</p>
              <ul className="space-y-2">
                {[
                  { label: 'אודות', page: 'About' },
                  { label: 'שירות לקוחות', page: 'GuestService' },
                ].map(link => (
                  <li key={link.page}>
                    <Link to={createPageUrl(link.page)} className="text-xs text-white/50 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/25">© 2026 ATLAS. כל הזכויות שמורות.</p>
            <button
              onClick={handleLogin}
              className="text-xs text-[#00D1C1] hover:text-[#00b8aa] transition-colors font-medium"
            >
              כניסה למערכת ←
            </button>
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