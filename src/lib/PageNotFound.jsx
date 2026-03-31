import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ArrowRight } from 'lucide-react';

export default function PageNotFound() {
  useEffect(() => {
    // Signal to crawlers this is a real 404, not indexable content
    document.title = '404 — הדף לא נמצא | ATLAS';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50" dir="rtl">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-gray-200">404</h1>
          <div className="h-0.5 w-16 bg-[#00D1C1]/30 mx-auto" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-800">הדף לא נמצא</h2>
          <p className="text-gray-500 leading-relaxed">
            הדף שחיפשת אינו קיים או הוסר.
            <br />
            אפשר לחזור לדשבורד ולהמשיך משם.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to={createPageUrl('Dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0B1220] bg-[#00D1C1] hover:bg-[#00b8aa] rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            חזור לדשבורד
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            חזור אחורה
          </button>
        </div>
      </div>
    </div>
  );
}
