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

      <main>
      {/* Hero */}
      <section className="bg-[#F4F3FF] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <LifeBuoy className="w-16 h-16 text-brand-600 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
            מחויבות השירות שלנו
          </h1>
          <p className="text-xl text-ink-600">
            למה אנחנו שואפים, בלי הבטחות שאין לנו
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <div className="rounded-xl bg-[#F7F8FB] p-6">
            <p className="text-[#1B2656] leading-relaxed">
              atlas בשלב השקה. בשלב הזה אין לנו התחייבות חוזית לאחוז זמינות או לזמני תגובה, וגם לא פיצוי כספי על השבתה.
              כאן כתוב בדיוק למה אנחנו שואפים ואיך אנחנו עובדים היום.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-brand-600" />
              <h2 className="text-2xl font-bold text-[#1B2656]">זמינות השירות</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              אנחנו שואפים שהשירות יהיה זמין כל הזמן. האתר מתארח ב-Vercel ומסד הנתונים ב-Supabase, ספקים עם תשתית ענן מנוהלת.
              אם יש תקלה, נעדכן בדף מצב השירות ובמייל ללקוחות שהתקלה נוגעת להם.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-brand-600" />
              <h2 className="text-2xl font-bold text-[#1B2656]">מענה לפניות</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">אנחנו שואפים לענות לכל פנייה באותו יום עסקים, ותקלה שמונעת מכם לעבוד מקבלת עדיפות ראשונה.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">ימי עסקים: ראשון עד חמישי. בשבת ובחגים המענה איטי יותר.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#1B2656] mb-4">איך פונים אלינו</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">טופס פנייה: <Link to="/contact" className="inline-flex min-h-[44px] items-center text-brand-600 underline">atlas-il.com/contact</Link></p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">מייל: support@atlas-il.com</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#1B2656] mb-4">עדכונים ותחזוקה</h2>
            <p className="text-gray-600 leading-relaxed">
              אנחנו מעלים עדכונים בלי להשבית את השירות. אם תידרש השבתה מתוכננת, נודיע מראש בדף מצב השירות.
            </p>
          </div>

          <div className="bg-brand-50/60 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-[#1B2656] mb-2">עדכון אחרון</h3>
            <p className="text-gray-600">הדף עודכן לאחרונה ב-20 באוקטובר 2026</p>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t border-line">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo  size="small" />
          <p className="text-ink-400 text-sm">© {new Date().getFullYear()} atlas. כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  );
}