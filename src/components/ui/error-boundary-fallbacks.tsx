import * as React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export type FallbackRenderProps = {
  error: Error | null;
  reset: () => void;
  section: string;
  componentStack?: string | null;
};

const isDev = import.meta.env.DEV;

function DevTechnicalBlock({ error, componentStack }: { error: Error | null; componentStack?: string | null }) {
  if (!isDev || !error) return null;
  return (
    <details className="mt-2 w-full text-start">
      <summary className="cursor-pointer text-[11px] font-semibold text-red-800/90 select-none">
        פרטים טכניים (פיתוח)
      </summary>
      <pre className="mt-2 max-h-28 overflow-auto rounded-md bg-red-950/5 p-2 text-[10px] leading-snug text-red-900/80 whitespace-pre-wrap break-words">
        {error.message}
        {componentStack ? `\n\n${componentStack}` : ''}
      </pre>
    </details>
  );
}

/** Small widget/card fallback with retry that re-renders children (boundary reset). */
export function ErrorFallbackInline({ error, reset, section, componentStack }: FallbackRenderProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-center shadow-sm"
      dir="rtl"
    >
      <AlertCircle className="mx-auto mb-1.5 h-4 w-4 text-red-500" aria-hidden />
      <p className="text-xs font-semibold text-red-900">משהו השתבש בחלק זה</p>
      <p className="mt-0.5 text-[11px] text-red-700/90">לא ניתן להציג את התוכן. אפשר לנסות שוב.</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 h-8 border-red-200 text-xs text-red-800 hover:bg-red-100"
        onClick={reset}
      >
        נסה שוב
      </Button>
      <DevTechnicalBlock error={error} componentStack={componentStack} />
      <span className="sr-only">אזור: {section}</span>
    </div>
  );
}

/** Full-area fallback for severe crashes (e.g. layout outlet). */
export function ErrorFallbackPage({ error, reset, section, componentStack }: FallbackRenderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/80 p-6" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-500" aria-hidden />
        </div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">אירעה שגיאה</h1>
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          לא הצלחנו להציג את העמוד. אפשר לחזור לדשבורד או לנסות לטעון את החלק מחדש.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" className="bg-[#00D1C1] font-semibold text-[#0B1220] hover:bg-[#00b8aa]" onClick={reset}>
            נסה שוב
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={createPageUrl('Dashboard')}>חזור לדשבורד</Link>
          </Button>
        </div>
        <DevTechnicalBlock error={error} componentStack={componentStack} />
        <p className="mt-4 text-[10px] text-gray-400">קוד אזור: {section}</p>
      </div>
    </div>
  );
}

/** Non-critical widgets (e.g. charts): no UI; errors are still logged by the boundary. */
export function ErrorFallbackSilent() {
  return null;
}
