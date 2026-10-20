import { Wordmark } from '@/components/app/shell/shared';
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function Status() {
  // Updated by hand. There is no automatic monitoring behind this page, so it never claims a live status.
  const STATUS_UPDATED = '20.10.2026';
  const OPEN_INCIDENTS = [];

  return (
    <div dir="rtl" className="min-h-screen bg-white" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/"><div className="mb-6 flex justify-center"><Wordmark size={30} /></div></Link>
            <Link to={createPageUrl('Landing')}>
              <Button variant="ghost">חזרה</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">מצב השירות</h1>
          <p className="text-gray-600 mb-8">דף שהצוות שלנו מעדכן ידנית כשיש תקלה ידועה או תחזוקה מתוכננת.</p>

          <div className="p-5 bg-[#F7F8FB] rounded-xl border border-gray-200 mb-6">
            <p className="text-sm text-gray-500 mb-1">עדכון ידני אחרון: {STATUS_UPDATED}</p>
            {OPEN_INCIDENTS.length === 0 ? (
              <p className="font-bold text-[#1B2656]">אין כרגע תקלות ידועות</p>
            ) : (
              <ul className="space-y-2">
                {OPEN_INCIDENTS.map((t) => <li key={t} className="font-bold text-[#1B2656]">{t}</li>)}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 p-5">
            <p className="text-gray-700 leading-relaxed">
              משהו לא עובד אצלכם? כתבו לנו ונבדוק. הדף הזה לא מחובר למערכת ניטור אוטומטית, ולכן ייתכן שתקלה חדשה עוד לא מופיעה בו.
            </p>
            <Link to="/contact" className="inline-flex min-h-[44px] items-center text-brand-600 font-medium hover:underline mt-1">
              דווחו על תקלה
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
