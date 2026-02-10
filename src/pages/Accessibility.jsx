import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Heart, Eye, Keyboard, Volume2, CheckCircle2 } from 'lucide-react';

export default function Accessibility() {
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
          <Heart className="w-16 h-16 text-[#00D1C1] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            הצהרת נגישות
          </h1>
          <p className="text-xl text-white/80">
            אנחנו מחויבים להנגשת השירות שלנו לכלל המשתמשים
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">המחויבות שלנו</h2>
            <p className="text-gray-600 leading-relaxed">
              ATLAS מחויבת להנגשת האתר והשירותים שלה לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות. 
              אנו פועלים ליישום תקן הנגישות הישראלי (ת"י 5568) ותקנות שוויון זכויות לאנשים עם מוגבלות 
              (התאמות נגישות לשירות), התשע"ג-2013.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">תכונות נגישות באתר</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-[#00D1C1]" />
                  <h3 className="text-lg font-semibold text-[#0B1220]">ניווט במקלדת</h3>
                </div>
                <p className="text-gray-600 mr-8">
                  ניתן לנווט באתר באמצעות מקלדת בלבד, ללא צורך בעכבר. כל הפונקציות זמינות דרך מקשי החצים, Tab ו-Enter.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Volume2 className="w-5 h-5 text-[#00D1C1]" />
                  <h3 className="text-lg font-semibold text-[#0B1220]">תמיכה בקוראי מסך</h3>
                </div>
                <p className="text-gray-600 mr-8">
                  האתר תומך בקוראי מסך מובילים כמו NVDA, JAWS ו-VoiceOver. כל התמונות והאלמנטים הוויזואליים 
                  כוללים תיאורים טקסטואליים (Alt Text).
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Keyboard className="w-5 h-5 text-[#00D1C1]" />
                  <h3 className="text-lg font-semibold text-[#0B1220]">גודל גופנים וניגודיות</h3>
                </div>
                <p className="text-gray-600 mr-8">
                  ניתן להגדיל או להקטין את גודל הטקסט באמצעות דפדפן האינטרנט. הצבעים והניגודיות באתר 
                  עומדים בתקני WCAG 2.1 ברמה AA.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">רמת הנגישות באתר</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              אנו שואפים לעמוד ברמת נגישות AA על פי תקן WCAG 2.1. עבדנו על:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">מבנה סמנטי ברור של דפי האתר</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">כפתורים וקישורים עם תיאורים ברורים</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">טפסים עם תוויות ברורות ומובנות</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">תאימות לדפדפנים שונים ומכשירים ניידים</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">תהליך הנגשה מתמשך</h2>
            <p className="text-gray-600 leading-relaxed">
              אנו ממשיכים לעבוד על שיפור הנגישות באתר ובמערכת. אנו עורכים בדיקות תקופתיות ומיישמים 
              תיקונים וחידושים לפי הצורך. הנגשת האתר היא תהליך מתמשך והמערכת עוברת עדכונים רבעוניים.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">נתקלתם בבעיית נגישות?</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              אם נתקלתם בבעיה או מכשול בנגישות, אנחנו מעוניינים לשמוע מכם ולסייע. 
              אנא פנו אלינו בכתובת:
            </p>
            <div className="bg-[#F2E9DB]/30 rounded-xl p-4">
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">אימייל:</span> accessibility@atlas-pm.com
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">טלפון:</span> 03-1234567
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              אנו מתחייבים לטפל בכל פנייה בתוך 5 ימי עסקים ולספק פתרון או חלופה נגישה.
            </p>
          </div>

          <div className="bg-[#F2E9DB]/30 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-[#0B1220] mb-2">מועד הכנת הצהרה זו</h3>
            <p className="text-gray-600 mb-3">הצהרת נגישות זו הוכנה בתאריך: 10 בפברואר 2026</p>
            <p className="text-gray-600">אחראי נגישות בארגון: מנהל המוצר של ATLAS</p>
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