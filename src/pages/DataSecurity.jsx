import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, Server, CheckCircle2, Clock, KeyRound, Globe } from 'lucide-react';

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
      <section className="bg-[#F4F3FF] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 text-brand-600 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
            אבטחת מידע והגנת פרטיות
          </h1>
          <p className="text-xl text-ink-600 mb-8">
            אבטחת המידע שלכם היא בראש סדר העדיפויות שלנו
          </p>
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
            {[
              { label: 'הצפנה', value: 'AES-256' },
              { label: 'זמינות SLA', value: '99.9%' },
              { label: 'תקן תשתית', value: 'SOC 2' },
              { label: 'עמידה בתקנים', value: 'GDPR' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-line shadow-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-brand-600">{s.value}</div>
                <div className="text-sm text-ink-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-16 space-y-8">

        {/* Encryption */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">הצפנת נתונים</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            כל המידע שלכם מוצפן באמצעות תקן הצפנה <strong>AES-256 / TLS 1.3</strong>: אותו תקן המשמש בנקים ומוסדות פיננסיים.
            הנתונים מוצפנים הן בתעבורה (בזמן העברה) והן במנוחה (באחסון).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'הצפנה מלאה בתעבורה (TLS 1.3)',
              'הצפנה במנוחה (AES-256)',
              'מפתחות הצפנה מנוהלים ב-AWS KMS',
              'הצפנת גיבויים בנפרד',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">תשתית מאובטחת</h2>
          </div>
          <div className="space-y-3">
            {[
              'אחסון בענן מאובטח ב-AWS עם תקני SOC 2 Type II ו-ISO 27001',
              'גיבויים אוטומטיים מרובי אזורים, שחזור תוך פחות מ-4 שעות',
              'מערכות מוניטורינג 24/7 לזיהוי ותגובה לאיומי אבטחה',
              'הפרדת סביבות: ייצור, בדיקות ופיתוח מבודדים לחלוטין',
              'סריקות אוטומטיות לפרצות אבטחה (SAST/DAST) בכל גרסה',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SSO & Access Control */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">בקרת גישה ו-SSO</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            ATLAS תומכת ב-<strong>Single Sign-On (SSO)</strong> באמצעות SAML 2.0 ו-OAuth 2.0, זמין בחבילת Business.
            כלל המשתמשים נהנים מאימות דו-שלבי (2FA) ובקרת הרשאות מפורטת.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'SSO עם SAML 2.0 / OAuth 2.0 (חבילת Business)',
              'אימות דו-שלבי (2FA) לכל המשתמשים',
              'ניהול הרשאות מבוסס תפקידים (RBAC)',
              'התנתקות אוטומטית לאחר חוסר פעילות',
              'לוג גישה מלא לכל פעולה במערכת',
              'סיסמאות מוצפנות (bcrypt), לא נשמרות בטקסט גלוי',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SLA */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">SLA: הסכם רמת שירות</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'זמינות מובטחת', value: '99.9%', desc: 'Uptime שנתי' },
              { label: 'זמן תגובה לתקלות קריטיות', value: '< 1 שעה', desc: 'בשעות עסקים' },
              { label: 'שחזור נתונים (RTO)', value: '< 4 שעות', desc: 'במקרה של כשל' },
            ].map((s) => (
              <div key={s.label} className="bg-[#F4F3FF] rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-brand-600">{s.value}</div>
                <div className="text-sm font-semibold text-[#1B2656] mt-1">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-600 leading-relaxed">
            חבילת <strong>Business</strong> כוללת SLA מובטח בכתב עם פיצוי כספי במקרה של חריגה.{' '}
            <Link to="/sla" className="text-brand-600 underline">ראה את מסמך ה-SLA המלא</Link>.
          </p>
        </div>

        {/* Compliance — anchor for marketing footer "security whitepaper" link */}
        <div id="security-compliance" className="bg-white rounded-2xl shadow-sm p-8 scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">עמידה בתקנים ורגולציה</h2>
          </div>
          <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 mb-6 text-gray-700 text-sm leading-relaxed">
            <strong className="text-[#1B2656]">שקיפות לגבי SOC 2 / ISO:</strong>{' '}
            דוחות תאימות של ספקי הענן (למשל AWS, SOC 2 Type II, ISO 27001) ותיעוד תהליכי אבטחה פנימיים
            זמינים ללקוחות <strong>Enterprise</strong> לפי בקשה, בכפוף ל-NDA ולסיווג המידע.
            אין כאן תעודת SOC 2 על חברת ATLAS עצמה, אנחנו בונים על תשתית מאושרת ושכבות אבטחה נוספות באפליקציה.
          </div>
          <div className="space-y-3">
            {[
              'GDPR: תקנות הגנת מידע אירופאיות',
              'חוק הגנת הפרטיות, התשמ"א-1981 (ישראל)',
              'SOC 2 Type II: ביקורת אבטחה שנתית',
              'ISO 27001: תקן ניהול אבטחת מידע',
              'PCI DSS: לעיבוד תשלומים מאובטח (דרך Stripe)',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Rights */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">הזכויות שלכם</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            אתם זכאים לגשת, לתקן, לייצא או למחוק את המידע האישי שלכם בכל עת מתוך הגדרות החשבון.
            לבקשות אבטחה דחופות, צרו קשר:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/contact?subject=בקשת%20מידע%20אבטחה%20(ATLAS)"
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-500 transition-colors"
            >
              <Shield className="w-4 h-4" />
              atlas-il.com/contact
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              צור קשר
            </Link>
          </div>
        </div>

        <div className="bg-brand-50/60 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#1B2656] mb-2">עדכון אחרון</h3>
          <p className="text-gray-600">מסמך זה עודכן לאחרונה בתאריך: 10 בפברואר 2026</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t border-line">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Logo  size="small" />
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="inline-flex min-h-[44px] items-center px-1 text-ink-400 hover:text-navy-900 transition-colors">פרטיות</Link>
            <Link to="/terms" className="inline-flex min-h-[44px] items-center px-1 text-ink-400 hover:text-navy-900 transition-colors">תנאי שימוש</Link>
            <Link to="/sla" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-1 text-ink-400 hover:text-navy-900 transition-colors">SLA</Link>
          </div>
          <p className="text-ink-400 text-sm">© {new Date().getFullYear()} ATLAS. כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  );
}
