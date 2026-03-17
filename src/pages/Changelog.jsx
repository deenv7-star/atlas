import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';

export default function Changelog() {
  const entries = [
    { date: '2025-03', title: 'גרסת בטא', items: ['השקה ראשונית של ATLAS', 'ניהול הזמנות ולידים', 'לוח שנה מרכזי', 'תשלומים וחשבוניות', 'מערכת ניקיון'] },
    { date: '2025-02', title: 'פיתוח', items: ['אינטגרציות ראשונות', 'תמיכה בעברית מלאה', 'ממשק responsive'] },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-white" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/"><img src="/atlas-logo-final.png" alt="ATLAS" className="h-10" /></Link>
            <Link to={createPageUrl('Landing')}>
              <Button variant="ghost">חזרה</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">יומן שינויים</h1>
          <p className="text-gray-600 mb-12">עדכונים ושיפורים ב-ATLAS</p>

          <div className="space-y-8">
            {entries.map((e, i) => (
              <div key={i} className="border-r-4 border-[#00D1C1] pr-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-[#00D1C1]" />
                  <span className="text-sm font-semibold text-gray-500">{e.date}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{e.title}</h2>
                <ul className="space-y-1 text-gray-600">
                  {e.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-[#00D1C1] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
