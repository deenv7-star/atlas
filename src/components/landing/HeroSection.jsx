import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import PhoneMockup from './PhoneMockup';

export default function HeroSection({ onLoginClick }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-gray-50 to-[#00D1C1]/5">
      {/* Optimized Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#00D1C1]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00D1C1]/10 to-purple-500/10 border border-[#00D1C1]/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#00D1C1]" />
              <span className="text-sm font-medium text-gray-700">פלטפורמת ניהול נכסים #1 בישראל</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-l from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                המערכת שתנהל
              </span>
              <br />
              <span className="bg-gradient-to-l from-[#00D1C1] via-[#00B8A9] to-[#00D1C1] bg-clip-text text-transparent">
                את הנכסים בשבילכם
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-xl">
              ניהול הזמנות, לידים, תשלומים וניקיון - 
              <span className="font-semibold text-gray-900"> כל מה שצריך במקום אחד</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={onLoginClick}
                className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-xl text-white text-lg px-10 py-7 font-semibold rounded-2xl transition-shadow"
              >
                אני רוצה להתחיל
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 mt-12">
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
                <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  <span className="text-[#00D1C1]">★</span> 4.9/5
                </div>
                <div className="text-xs text-gray-500">דירוג ממוצע</div>
              </div>
            </div>
          </div>

          {/* Right - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}