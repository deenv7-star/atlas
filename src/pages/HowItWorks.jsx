/**
 * /how-it-works — its own page, not a copy of the home page (H6, audit 28.11.2026).
 * The home page sells the product; this page explains, honestly and step by step, how a booking gets
 * onto one calendar — and how the voice assistant fits in: say it, atlas prepares, you approve.
 * Own title/meta live in src/seo/routeMeta.js ('/how-it-works'); the page is listed in the sitemap.
 */
import { Wordmark } from '@/components/app/shell/shared';
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { GitBranch, Shield, RefreshCw, Database, Link2, Mic } from 'lucide-react';

const STEPS = [
  {
    n: 1,
    title: 'ערוצי הזמנה ויומנים',
    body: 'Airbnb, Booking.com ויומנים אחרים מתחברים במסך "ערוצים וחיבורים", עם קישור יומן אחד לכל יחידה.',
    icon: Link2,
  },
  {
    n: 2,
    title: 'הכל נכנס ללוח אחד',
    body: 'כל 15 דקות atlas בודק כל ערוץ, ותאריכים תפוסים נכנסים ללוח לבד.',
    icon: RefreshCw,
  },
  {
    n: 3,
    title: 'כשיש חפיפה',
    body: 'אם שתי הזמנות נופלות על אותה יחידה באותם לילות, atlas מסמן את זה ומתריע. אתם מחליטים איזו הזמנה נשארת.',
    icon: Shield,
  },
  {
    n: 4,
    title: 'לוח אחד שאפשר לסמוך עליו',
    body: 'אחרי שהחלטתם, הלוח מראה תמונה אחת וברורה. כל שינוי נרשם, כך שתמיד אפשר לבדוק מה קרה.',
    icon: Database,
  },
];

/** The voice flow, in the same three steps the home page shows: say it, atlas prepares, you approve. */
const VOICE_STEPS = [
  {
    n: 1,
    title: 'אומרים מה צריך',
    body: 'בעברית, במילים שלכם — למשל: "הזמנה חדשה לשבת, זוג ושני ילדים".',
  },
  {
    n: 2,
    title: 'atlas מכין',
    body: 'atlas מכין את ההזמנה, את ההודעה לאורח ואת משימת הניקיון.',
  },
  {
    n: 3,
    title: 'מאשרים בלחיצה אחת',
    body: 'שום דבר לא נשמר בלי אישור שלכם.',
  },
];

export default function HowItWorks() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#FAFBFC]" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 border-b border-gray-100 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <div className="mb-6 flex justify-center"><Wordmark size={30} /></div>
          </Link>
          <div className="flex items-center gap-2 flex-wrap justify-end">
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
          <div className="flex items-center gap-2 text-[#2A1AC9] text-sm font-bold mb-3">
            <GitBranch className="w-5 h-5" aria-hidden />
            איך זה עובד
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            איך נמנעים מהזמנות כפולות
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-10">
            בלי הבטחות קסם: איך הזמנות מכל הערוצים מגיעות ללוח אחד, ומה קורה כשיש חפיפה.
          </p>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">בקצרה</h2>
            <ol className="space-y-3 text-gray-700 text-sm sm:text-base leading-relaxed list-decimal list-inside marker:font-bold marker:text-[#2A1AC9]">
              <li>הזמנה חדשה נכנסת מערוץ, או שאתם רושמים אותה.</li>
              <li>atlas בודק אם הלילות פנויים ביחידה.</li>
              <li>אם יש חפיפה, מופיעה התראה ואתם מחליטים.</li>
              <li>אם אין חפיפה, ההזמנה נשמרת והלוח מתעדכן.</li>
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
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#2A1AC9] font-extrabold text-lg"
                    aria-hidden
                  >
                    {s.n}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-brand-600 shrink-0" aria-hidden />
                      <h2 className="text-xl font-bold text-gray-900">{s.title}</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{s.body}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-[#2A1AC9] text-sm font-bold mb-3">
              <Mic className="w-5 h-5" aria-hidden />
              העוזר הקולי
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">אומרים. atlas מכין. מאשרים.</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              לא צריך לפתוח טפסים בשביל הזמנה חדשה. אומרים מה צריך בעברית, ומאשרים בלחיצה אחת.
            </p>
            <ol className="space-y-3 text-gray-700 text-sm sm:text-base leading-relaxed list-decimal list-inside marker:font-bold marker:text-[#2A1AC9]">
              {VOICE_STEPS.map((s) => (
                <li key={s.n}>
                  <span className="font-bold text-gray-900">{s.title}:</span> {s.body}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-14 rounded-2xl bg-[#F4F3FF] text-navy-900 p-8 text-center">
            <p className="text-lg font-semibold mb-4">מוכנים לראות את זה בפעולה?</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register">
                <Button className="bg-brand-600 text-white hover:bg-[#00c4b4] font-bold">
                  14 ימי ניסיון חינם
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="border-white/40 text-navy-900 hover:bg-white border border-line shadow-card">
                  שאלה? כתבו לנו
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
