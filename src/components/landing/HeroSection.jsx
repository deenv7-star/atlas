import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Play } from 'lucide-react';
import PhoneMockup from './PhoneMockup';

export default function HeroSection({ onLoginClick }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-gray-50 to-[#00D1C1]/5">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#00D1C1]/30 to-transparent rounded-full blur-3xl"
          animate={{
            x: mousePosition.x,
            y: mousePosition.y,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            x: { type: "spring", stiffness: 50 },
            y: { type: "spring", stiffness: 50 },
            scale: { duration: 8, repeat: Infinity }
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-3xl"
          animate={{
            x: -mousePosition.x,
            y: -mousePosition.y,
            scale: [1, 1.3, 1],
          }}
          transition={{ 
            x: { type: "spring", stiffness: 50 },
            y: { type: "spring", stiffness: 50 },
            scale: { duration: 10, repeat: Infinity }
          }}
        />
        
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#00D1C1]/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            style={{ y, opacity, scale }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00D1C1]/10 to-purple-500/10 border border-[#00D1C1]/20 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-[#00D1C1]" />
              <span className="text-sm font-medium text-gray-700">פלטפורמת ניהול נכסים #1 בישראל</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              <span className="bg-gradient-to-l from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                המערכת שתנהל
              </span>
              <br />
              <span className="bg-gradient-to-l from-[#00D1C1] via-[#00B8A9] to-[#00D1C1] bg-clip-text text-transparent">
                את הנכסים בשבילכם
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-xl"
            >
              ניהול הזמנות, לידים, תשלומים וניקיון - 
              <span className="font-semibold text-gray-900"> כל מה שצריך במקום אחד</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={onLoginClick}
                  className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-2xl hover:shadow-[#00D1C1]/40 text-white text-lg px-10 py-7 font-semibold rounded-2xl"
                >
                  אני רוצה להתחיל
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-[#00D1C1] hover:bg-white text-lg px-10 py-7 font-semibold rounded-2xl"
                >
                  <Play className="w-5 h-5 mr-2" />
                  צפו בהדגמה
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-8 mt-12"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border-2 border-white"
                    />
                  ))}
                </div>
                <div className="mr-2">
                  <div className="text-sm font-semibold text-gray-900">+5,000</div>
                  <div className="text-xs text-gray-500">לקוחות מרוצים</div>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-200" />
              <div>
                <div className="text-sm font-semibold text-gray-900">⭐ 4.9/5</div>
                <div className="text-xs text-gray-500">דירוג ממוצע</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full p-1">
          <motion.div
            className="w-1.5 h-1.5 bg-[#00D1C1] rounded-full mx-auto"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}