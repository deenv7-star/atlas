import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import Logo from '@/components/common/Logo';
import HeroSection from '@/components/landing/HeroSection';
import AnimatedCards from '@/components/landing/AnimatedCards';
import BenefitsGrid from '@/components/landing/BenefitsGrid';
import FloatingStats from '@/components/landing/FloatingStats';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import SupportChat from '@/components/landing/SupportChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  const handleLoginClick = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleStartTrial = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const faqItems = [
    {
      q: 'האם המערכת מתאימה גם לנכס בודד?',
      a: 'בהחלט! המערכת מתאימה לכל גודל - מנכס בודד ועד רשת גדולה של נכסים. התמחור והתכונות מותאמים לצרכים שלך.'
    },
    {
      q: 'האם אפשר לנהל כמה נכסים במערכת?',
      a: 'כן, אין הגבלה על מספר הנכסים. תוכל לנהל את כל הנכסים שלך במקום אחד, עם יכולת מעבר מהיר ביניהם.'
    },
    {
      q: 'האם יש אינטגרציה עם Airbnb ו-Booking?',
      a: 'כן, המערכת מתחברת לכל הפלטפורמות המובילות ומסנכרנת אוטומטית הזמנות, מחירים וזמינות.'
    },
    {
      q: 'האם צוות הניקיון יכול לקבל משימות?',
      a: 'בהחלט! צוות הניקיון מקבל גישה מוגבלת למשימות שלהם בלבד, עם כל הפרטים הנדרשים ואפשרות לדווח על השלמה.'
    },
    {
      q: 'איך עובדות ההודעות האוטומטיות?',
      a: 'תוכל להגדיר תבניות הודעות שנשלחות אוטומטית בנקודות זמן מסוימות - לפני צ\'ק-אין, אחרי צ\'ק-אאוט, בקשות לביקורות ועוד.'
    },
    {
      q: 'האם יש תמיכה טכנית?',
      a: 'כמובן! אנחנו זמינים בצ\'אט ובמייל לכל שאלה או בעיה. בנוסף, יש לנו מרכז עזרה מקיף עם מדריכים ווידאו.'
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-white" style={{ fontFamily: "'Assistant', 'Heebo', sans-serif" }}>
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="dark" size="default" />
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-gray-700"
                onClick={handleLoginClick}
              >
                כניסה
              </Button>
              <Button 
                className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-lg text-white"
                onClick={handleStartTrial}
              >
                התחל עכשיו
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection onLoginClick={handleLoginClick} />

      {/* Animated Cards */}
      <AnimatedCards />

      {/* Benefits Grid */}
      <BenefitsGrid />

      {/* Floating Stats */}
      <FloatingStats />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <PricingSection onSelectPlan={handleStartTrial} />

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              שאלות נפוצות
            </h2>
            <p className="text-xl text-gray-600">
              מצאו תשובות לשאלות הנפוצות ביותר
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-100 rounded-2xl overflow-hidden"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 bg-white">
                      <span className="font-semibold text-gray-900 text-lg">{item.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-5 w-5 text-[#00D1C1] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 bg-white text-gray-600 leading-relaxed"
                      >
                        {item.a}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#0B1220] via-gray-900 to-[#0B1220] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D1C1] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              מוכנים להתחיל?
            </h2>
            <p className="text-xl text-white/80 mb-10">
              הצטרפו לאלפי בעלי נכסים שכבר משתמשים ב-ATLAS
            </p>
            <Button
              size="lg"
              onClick={handleStartTrial}
              className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-2xl text-white text-lg px-12 py-7 font-semibold rounded-2xl"
            >
              התחל ניסיון חינם
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
            <p className="text-white/60 text-sm mt-6">
              ללא כרטיס אשראי • ביטול בכל עת • תמיכה מלאה
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-[#0B1220] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Logo variant="light" size="default" />
              <p className="text-white/60 mt-4">
                המערכת המובילה לניהול נכסים חכם ואוטומטי
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">קישורים מהירים</h3>
              <div className="space-y-2">
                <Link to={createPageUrl('Privacy')} className="block text-white/60 hover:text-white transition-colors">
                  מדיניות פרטיות
                </Link>
                <Link to={createPageUrl('Terms')} className="block text-white/60 hover:text-white transition-colors">
                  תנאי שימוש
                </Link>
                <Link to={createPageUrl('UserAgreement')} className="block text-white/60 hover:text-white transition-colors">
                  הסכם משתמש
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">צור קשר</h3>
              <div className="space-y-2 text-white/60">
                <p>support@stayflow.io</p>
                <p>050-123-4567</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/40 text-sm">
            © 2024 ATLAS. כל הזכויות שמורות.
          </div>
        </div>
      </footer>

      {/* Support Chat */}
      <SupportChat />
    </div>
  );
}