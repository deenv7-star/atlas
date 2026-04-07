import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { GitBranch, Shield, RefreshCw, Database, Link2 } from 'lucide-react';

const STEPS = [
  {
    n: 1,
    title: 'ערוצי הזמנה ויומנים',
    body: 'Airbnb, Booking.com, יומני Google/Apple וערוצים נוספים מחוברים דרך מסך האינטגרציות. כל ערוץ נשמר כמקור נתונים נפרד עם חותמת זמן.',
    icon: Link2,
  },
  {
    n: 2,
    title: 'סנכרון ללוח המרכזי',
    body: 'המערכת מושכת תאריכי חסימה והזמנות ללוח האחוד. עדכונים מתוזמנים ואירועים חדשים נכנסים לתור עיבוד כדי למנוע עומס על הערוצים.',
    icon: RefreshCw,
  },
  {
    n: 3,
    title: 'כללי התנגשות (Conflict rules)',
    body: 'כשנכנסות שתי הזמנות לאותו חדר באותו טווח תאריכים, ATLAS מסמנת התנגשות: לפי סדר קבלה, סטטוס (מאושר מול טיוטה) והגדרות נכס. המנהל רואה התראה ומחליט איזו הזמנה נשארת.',
    icon: Shield,
  },
  {
    n: 4,
    title: 'יומן אמת אחד',
    body: 'לאחר הכרעה (או כאשר אין התנגשות), הלוח מציג מצב אחד עקבי. שינויים מהערוץ או מהממשק נשמרים ביומן פעילות לביקורת עתידית.',
    icon: Database,
  },
];

export default function HowItWorks() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#FAFBFC]" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 border-b border-gray-100 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/atlas-logo-final.png" alt="ATLAS" className="h-9" />
          </Link>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link to={createPageUrl('ApiDocs')}>
              <Button variant="ghost" size="sm">תיעוד API</Button>
            </Link>
            <Link to={createPageUrl('PricingPlans')}>
              <Button variant="ghost" size="sm">תמחור</Button>
            </Link>
            <Link to={createPageUrl('Landing')}>
              <Button variant="outline" size="sm">דף הבית</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main" className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-[#00a89a] text-sm font-bold mb-3">
            <GitBranch className="w-5 h-5" aria-hidden />
            ארכיטקטורה ותפעול
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            איך ATLAS מונעת הזמנות כפולות ומסנכרנת ערוצים
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-10">
            דף זה מסביר ברמת מערכת — בלי הבטחות קסם — איך נתונים זורמים מערוצי הזמנה ללוח אחד, ואיך מתמודדים עם התנגשויות.
            לפרטי ממשק REST ראו{' '}
            <Link to={createPageUrl('ApiDocs')} className="text-[#00D1C1] font-semibold underline-offset-2 hover:underline">
              תיעוד ה-API
            </Link>
            .
          </p>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">תרשים זרימה (תמצית)</h2>
            <ol className="space-y-3 text-gray-700 text-sm sm:text-base leading-relaxed list-decimal list-inside marker:font-bold marker:text-[#00a89a]">
              <li>מקור חיצוני או ידני יוצר/מעדכן הזמנה.</li>
              <li>ATLAS מאמתת טווח תאריכים מול הלוח הפנימי לנכס/חדר.</li>
              <li>אם יש חפיפה — נוצרת התראה והרשומה מסומנת לטיפול אנושי או לפי כללים שהוגדרו בארגון.</li>
              <li>אין חפיפה — ההזמנה נרשמת והלוח מתעדכן; הערוץ המקושר מקבל עדכון כשהאינטגרציה תומכת בכך.</li>
            </ol>
          </div>

          <div className="space-y-6">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <article
                  key={s.n}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex gap-4 flex-col sm:flex-row sm:items-start"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#00a89a] font-extrabold text-lg"
                    aria-hidden
                  >
                    {s.n}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-[#00D1C1] shrink-0" aria-hidden />
                      <h2 className="text-xl font-bold text-gray-900">{s.title}</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{s.body}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-14 rounded-2xl bg-gradient-to-br from-[#0B1220] to-[#1a2744] text-white p-8 text-center">
            <p className="text-lg font-semibold mb-4">מוכנים לראות את זה בפעולה?</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register">
                <Button className="bg-[#00D1C1] text-[#0B1220] hover:bg-[#00c4b4] font-bold">
                  הרשמה חינם
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  דברו עם המכירות
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
