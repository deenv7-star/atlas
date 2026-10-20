import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, Server, CheckCircle2, KeyRound, Globe } from 'lucide-react';

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
            מה אנחנו עושים כדי לשמור על הנתונים שלכם, בלי הגזמות
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-16 space-y-8">

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">הצפנה</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            אנחנו לא בונים הצפנה משלנו. אנחנו משתמשים בתשתית של ספקים מוכרים, וכותבים כאן רק מה שבאמת קיים.
          </p>
          <div className="space-y-3">
            {[
              'כל התעבורה בין הדפדפן שלכם ל-atlas מוצפנת (HTTPS).',
              'מסד הנתונים מתארח ב-Supabase, שמצפינה את הנתונים באחסון.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">איפה הנתונים נשמרים</h2>
          </div>
          <div className="space-y-3">
            {[
              'מסד הנתונים, ההתחברות והקבצים: Supabase, על שרתי AWS בפרנקפורט, גרמניה.',
              'האתר והאפליקציה: Vercel.',
              'מיילים של מערכת (אימות חשבון, איפוס סיסמה): Resend.',
              'השאלות לעוזר החכם: OpenAI, בארצות הברית.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">מי רואה את הנתונים</h2>
          </div>
          <div className="space-y-3">
            {[
              'כל עסק רואה רק את הנתונים שלו. ההפרדה נאכפת במסד הנתונים עצמו (Row Level Security).',
              'סיסמאות לא נשמרות כטקסט. Supabase שומרת רק גיבוב (hash) שלהן.',
              'אפשר להתחבר גם עם Google או Apple, בלי סיסמה נוספת.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance — anchor for marketing footer "security whitepaper" link */}
        <div id="security-compliance" className="bg-white rounded-2xl shadow-sm p-8 scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-[#1B2656]">תקנים ורגולציה</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-3">
            אנחנו פועלים לפי חוק הגנת הפרטיות, התשמ"א-1981. ל-atlas עצמה אין כרגע הסמכה כמו SOC 2 או ISO 27001.
            לספקי התשתית שלנו יש הסמכות משלהם, ואפשר לקרוא עליהן באתרים שלהם.
          </p>
          <p className="text-gray-600 leading-relaxed">
            רוצים לדעת עוד? <Link to="/privacy" className="inline-flex min-h-[44px] items-center text-brand-600 underline">מדיניות הפרטיות</Link> מפרטת מה נאסף ולמה.
          </p>
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
              href="/contact?subject=בקשת%20מידע%20אבטחה%20(atlas)"
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-500 transition-colors"
            >
              <Shield className="w-4 h-4" />
              atlas-il.com/contact
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              צרו קשר
            </Link>
          </div>
        </div>

        <div className="bg-brand-50/60 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#1B2656] mb-2">עדכון אחרון</h3>
          <p className="text-gray-600">מסמך זה עודכן לאחרונה בתאריך: 20 באוקטובר 2026</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t border-line">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Logo  size="small" />
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="inline-flex min-h-[44px] items-center px-1 text-ink-400 hover:text-navy-900 transition-colors">פרטיות</Link>
            <Link to="/terms" className="inline-flex min-h-[44px] items-center px-1 text-ink-400 hover:text-navy-900 transition-colors">תנאי שימוש</Link>
            <Link to="/sla" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-1 text-ink-400 hover:text-navy-900 transition-colors">מחויבות השירות</Link>
          </div>
          <p className="text-ink-400 text-sm">© {new Date().getFullYear()} atlas. כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  );
}
