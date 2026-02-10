import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Clock, Zap, LifeBuoy, CheckCircle2 } from 'lucide-react';

export default function SLA() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Assistant', 'Heebo', sans-serif" }}>
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="dark" />
            <Link to={createPageUrl('Landing')}>
              <Button variant="ghost">חזרה לדף הבית</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0B1220] to-[#1a2744] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <LifeBuoy className="w-16 h-16 text-[#00D1C1] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            אמנת שירות (SLA)
          </h1>
          <p className="text-xl text-white/80">
            ההתחייבויות שלנו כלפיכם
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">זמינות השירות</h2>
            <div className="bg-[#00D1C1]/10 rounded-xl p-6 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-[#00D1C1]" />
                <h3 className="text-xl font-bold text-[#0B1220]">99.5% זמינות</h3>
              </div>
              <p className="text-gray-600">
                אנו מתחייבים לזמינות שירות של 99.5% במהלך השנה (למעט תחזוקה מתוכננת).
              </p>
            </div>
            <p className="text-gray-600 leading-relaxed">
              זמינות השירות נמדדת על בסיס חודשי. במקרה של אי עמידה בהתחייבות זו, תהיו זכאים לפיצוי 
              יחסי בהתאם למדיניות הפיצויים שלנו.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-[#00D1C1]" />
              <h2 className="text-2xl font-bold text-[#0B1220]">זמני תגובה לתמיכה</h2>
            </div>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-[#0B1220] mb-2">בעיות קריטיות</h3>
                <p className="text-gray-600 text-sm mb-2">
                  (השירות אינו זמין או פגיעה קריטית בפונקציונליות)
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00D1C1]" />
                  <span className="text-sm text-gray-700">תגובה ראשונית תוך שעה אחת</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-[#00D1C1]" />
                  <span className="text-sm text-gray-700">טיפול עד 4 שעות</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-[#0B1220] mb-2">בעיות חשובות</h3>
                <p className="text-gray-600 text-sm mb-2">
                  (פגיעה משמעותית בפונקציונליות אך ישנן דרכים לעקוף)
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00D1C1]" />
                  <span className="text-sm text-gray-700">תגובה ראשונית תוך 4 שעות</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-[#00D1C1]" />
                  <span className="text-sm text-gray-700">טיפול עד 24 שעות</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-[#0B1220] mb-2">בעיות רגילות</h3>
                <p className="text-gray-600 text-sm mb-2">
                  (שאלות כלליות, בקשות תכונה, בעיות קלות)
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00D1C1]" />
                  <span className="text-sm text-gray-700">תגובה ראשונית תוך 24 שעות</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-[#00D1C1]" />
                  <span className="text-sm text-gray-700">טיפול עד 5 ימי עסקים</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">גיבוי ושחזור נתונים</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">גיבוי אוטומטי של כל הנתונים כל 24 שעות</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">שמירת גיבויים למשך 30 יום</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">יכולת שחזור נתונים תוך 12 שעות ממועד הבקשה</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">תחזוקה מתוכננת</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              תחזוקה מתוכננת תתבצע בשעות הלילה (02:00-06:00) ותוכרז מראש ב-48 שעות. 
              במהלך תחזוקה מתוכננת, השירות עשוי להיות לא זמין או מוגבל.
            </p>
            <p className="text-gray-600 leading-relaxed">
              אנו נעשה כל מאמץ למזער את תדירות ומשך התחזוקה המתוכננת.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">ערוצי תמיכה</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">צ'אט חי באתר (ראשון-חמישי, 09:00-18:00)</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">אימייל: support@atlas-pm.com (24/7)</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">WhatsApp: זמין ללקוחות עסקיים</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">פיצויים בגין אי עמידה ב-SLA</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              במקרה של אי עמידה בהתחייבויות ה-SLA, תהיו זכאים לפיצוי בהתאם:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">זמינות 95%-99.5%: זיכוי של 10% ממנוי החודש</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">זמינות 90%-95%: זיכוי של 25% ממנוי החודש</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">זמינות מתחת ל-90%: זיכוי של 50% ממנוי החודש</p>
              </div>
            </div>
          </div>

          <div className="bg-[#F2E9DB]/30 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-[#0B1220] mb-2">עדכון אחרון</h3>
            <p className="text-gray-600">אמנת השירות עודכנה לאחרונה בתאריך: 10 בפברואר 2026</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#0B1220] border-t border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo variant="light" size="small" />
          <p className="text-white/40 text-sm">© 2024 ATLAS. כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  );
}