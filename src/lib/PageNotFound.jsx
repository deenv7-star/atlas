import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    // Signal to crawlers this is a real 404, not indexable content
    document.title = 'הדף לא נמצא | ATLAS';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const home = isAuthenticated ? { to: '/dashboard', label: 'למסך היום' } : { to: '/', label: 'לעמוד הראשי' };
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas" dir="rtl">
      <header className="flex h-16 items-center px-5 md:px-10">
        <Link to="/" className="inline-flex min-h-[44px] items-center gap-1 text-[20px] font-extrabold tracking-[0.02em] text-navy-900" aria-label="ATLAS, לעמוד הראשי">
          ATLAS<span aria-hidden className="mb-1 h-1.5 w-1.5 self-end rounded-full bg-brand-600" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="v5-rise w-full max-w-md text-center">
          <span className="relative mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-[16px] border border-line bg-white shadow-card" aria-hidden>
            <span className="absolute inset-[5px] rounded-[11px] bg-[#F4F3FF]" />
            <Compass className="relative h-6 w-6 text-brand-600" strokeWidth={1.5} />
          </span>
          <p className="text-[13px] font-semibold tabular text-ink-400" dir="ltr">404</p>
          <h1 className="mt-2 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-navy-900">הדף לא נמצא</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-600">ייתכן שהקישור השתנה או שהדף הוסר.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={home.to}
              className="press inline-flex h-12 items-center justify-center rounded-[10px] bg-brand-600 px-6 text-[15px] font-semibold text-white hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              {home.label}
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="press inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-6 text-[15px] font-medium text-navy-900 hover:bg-[#F7F8FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              חזרה
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
