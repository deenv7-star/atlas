import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Status() {
  const services = [
    { name: 'אתר וממשק', status: 'operational' },
    { name: 'התחברות ומשתמשים', status: 'operational' },
    { name: 'API ונתונים', status: 'operational' },
    { name: 'אימייל ותזכורות', status: 'operational' },
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">סטטוס המערכת</h1>
          <p className="text-gray-600 mb-8">מעקב אחר זמינות השירותים</p>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 mb-8">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-bold text-green-800">כל המערכות פועלות</p>
              <p className="text-sm text-green-700">עדכון אחרון: עכשיו</p>
            </div>
          </div>

          <div className="space-y-4">
            {services.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  פועל
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
