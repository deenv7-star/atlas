import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Code2, Shield, Activity, ArrowRight } from 'lucide-react';

const SECTIONS = [
  {
    title: 'אימות (Auth)',
    base: '/api',
    items: [
      ['POST', '/api/auth/signup', 'הרשמה + יצירת ארגון'],
      ['POST', '/api/auth/signin', 'התחברות'],
      ['POST', '/api/auth/refresh', 'רענון טוקן'],
      ['POST', '/api/auth/signout', 'התנתקות'],
      ['GET', '/api/auth/me', 'פרופיל משתמש'],
      ['PUT', '/api/auth/me', 'עדכון פרופיל'],
    ],
  },
  {
    title: 'ישויות (CRUD)',
    base: '/api/entities',
    items: [
      ['GET/POST', '/api/entities/:entity', 'רשימה ויצירה לפי שם ישות (למשל bookings, leads)'],
      ['GET/PUT/DELETE', '/api/entities/:entity/:id', 'קריאה, עדכון ומחיקה'],
    ],
  },
  {
    title: 'דומיין (לידים והזמנות)',
    base: '/api',
    items: [
      ['POST', '/api/leads', 'יצירת ליד'],
      ['PATCH', '/api/leads/:id/status', 'עדכון סטטוס ליד'],
      ['POST', '/api/leads/:id/convert', 'המרה להזמנה'],
      ['POST', '/api/bookings', 'הזמנה חדשה'],
      ['PATCH', '/api/bookings/:id/status', 'סטטוס הזמנה'],
      ['POST', '/api/payments', 'תשלום'],
      ['POST', '/api/automations/booking-confirmed', 'טריגר אוטומציה'],
    ],
  },
  {
    title: 'תאימות ומוניטורינג',
    base: '/api',
    items: [
      ['GET', '/api/compliance/export', 'ייצוא נתוני משתמש'],
      ['DELETE', '/api/compliance/delete-account', 'מחיקת חשבון'],
      ['POST', '/api/compliance/retention/run', 'מדיניות שמירה'],
      ['GET', '/api/health', 'בדיקת חיים'],
      ['GET', '/api/ready', 'מוכן לקבלת תעבורה (כולל DB)'],
      ['GET', '/api/metrics', 'מטריקות Prometheus'],
    ],
  },
];

export default function ApiDocs() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Heebo', 'Assistant', sans-serif" }}>
      <nav className="sticky top-0 z-50 bg-white/95 border-b border-gray-200 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/atlas-logo-final.png" alt="ATLAS" className="h-9" />
          </Link>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('DataSecurity')}>
              <Button variant="ghost" size="sm" className="gap-1">
                <Shield className="w-4 h-4" />
                אבטחה
              </Button>
            </Link>
            <Link to={createPageUrl('Landing')}>
              <Button variant="outline" size="sm">דף הבית</Button>
            </Link>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-[#0B1220] to-[#1a2744] text-white px-4 py-14">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-[#00D1C1] text-sm font-semibold mb-3">
            <Code2 className="w-5 h-5" />
            REST API
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">תיעוד API — ATLAS</h1>
          <p className="text-white/80 text-lg max-w-2xl leading-relaxed">
            ממשק REST מאובטח (JWT), מרובה־דיירים (tenant). כל הבקשות לנתיבי ישויות דורשות הרשאה ומסוננות לפי ארגון.
          </p>
          <p className="text-white/60 text-sm mt-4">
            בסיס URL: אותו דומיין כמו האפליקציה, נתיב <code className="bg-white/10 px-1.5 py-0.5 rounded">/api</code>
            {' · '}גרסת השרת: Express (Node)
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              {section.title}
            </h2>
            <ul className="divide-y divide-gray-100">
              {section.items.map(([method, path, desc]) => (
                <li key={path + method} className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                  <span className="font-mono text-xs font-bold text-[#4F46E5] shrink-0 w-24">{method}</span>
                  <code className="font-mono text-sm text-gray-800 break-all flex-1">{path}</code>
                  <span className="text-sm text-gray-600 sm:text-right sm:max-w-xs">{desc}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6">
          <h3 className="font-bold text-amber-950 mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            אימות
          </h3>
          <p className="text-sm text-amber-900/90 leading-relaxed">
            מלבד <code className="bg-white/80 px-1 rounded">/api/auth/signup</code> ו־<code className="bg-white/80 px-1 rounded">/api/auth/signin</code>,
            רוב הנתיבים דורשים כותרת{' '}
            <code className="bg-white/80 px-1 rounded">Authorization: Bearer &lt;access_token&gt;</code>.
          </p>
        </section>

        <div className="flex flex-wrap gap-4 justify-center pb-12">
          <Link to={createPageUrl('Contact')}>
            <Button className="gap-2 bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220]">
              שאלות טכניות — צור קשר
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline">הרשמה למערכת</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
