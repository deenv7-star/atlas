import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, Server, CheckCircle2 } from 'lucide-react';

export default function DataSecurity() {
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
          <Shield className="w-16 h-16 text-[#00D1C1] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            אבטחת מידע והגנת פרטיות
          </h1>
          <p className="text-xl text-white/80">
            אבטחת המידע שלכם היא בראש סדר העדיפויות שלנו
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-[#00D1C1]" />
              <h2 className="text-2xl font-bold text-[#0B1220]">הצפנת נתונים</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              כל המידע שלכם מוצפן באמצעות תקן הצפנה SSL/TLS 256-bit - אותו תקן המשמש בנקים ומוסדות פיננסיים. 
              הנתונים מוצפנים הן בתעבורה (בזמן העברה) והן במנוחה (באחסון).
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6 text-[#00D1C1]" />
              <h2 className="text-2xl font-bold text-[#0B1220]">תשתית מאובטחת</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">אחסון בענן מאובטח ב-AWS עם תקני SOC 2 ו-ISO 27001</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">גיבויים אוטומטיים מרובי אזורים כדי להבטיח זמינות רציפה</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">מערכות מוניטורינג 24/7 לזיהוי ותגובה לאיומי אבטחה</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-[#00D1C1]" />
              <h2 className="text-2xl font-bold text-[#0B1220]">בקרת גישה</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-3">
              אנחנו מיישמים עקרונות של "הרשאות מינימליות" - כל משתמש מקבל גישה רק למידע הדרוש לו לצורך עבודתו.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">אימות דו-שלבי (2FA) זמין לכל המשתמשים</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">סיסמאות מוצפנות ואינן נשמרות בטקסט גלוי</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">התנתקות אוטומטית לאחר תקופת חוסר פעילות</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">עמידה בתקנים ורגולציה</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              אנחנו עומדים בכל דרישות הגנת הפרטיות והאבטחה הנדרשות על פי החוק הישראלי:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">עמידה בחוק הגנת הפרטיות, התשמ"א-1981</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">תאימות ל-GDPR עבור לקוחות מחוץ לישראל</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D1C1] mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">ביקורות אבטחה תקופתיות על ידי גורמים חיצוניים</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">הזכויות שלכם</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              אתם זכאים לגשת, לתקן או למחוק את המידע האישי שלכם בכל עת. 
              לבקשות הסרת מידע או שאלות בנושא אבטחת מידע, צרו איתנו קשר ב:
            </p>
            <p className="text-[#00D1C1] font-medium">security@atlas-pm.com</p>
          </div>

          <div className="bg-[#F2E9DB]/30 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-[#0B1220] mb-2">עדכון אחרון</h3>
            <p className="text-gray-600">מסמך זה עודכן לאחרונה בתאריך: 10 בפברואר 2026</p>
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