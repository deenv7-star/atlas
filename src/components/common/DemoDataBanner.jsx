/**
 * SECTION 3 — Demo data separation
 *
 * Shown when a page displays demo/sample data instead of real user data.
 * Keeps demo clearly separated from real data.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

export default function DemoDataBanner({ message = 'נתוני דוגמה — הנתונים המוצגים הם לצורך המחשה בלבד.', actionLabel, actionLink }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm mb-4"
      role="status"
      aria-label="נתוני דוגמה"
    >
      <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
      <span className="flex-1">{message}</span>
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
