import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown } from 'lucide-react';

export default function TrialBanner() {
  const { daysLeft, isTrialing, isExpired, isLoading } = useSubscription();

  if (isLoading || (!isTrialing && !isExpired)) return null;
  if (isExpired) {
    return (
      <div className="bg-red-600 text-white py-2 px-4 text-center text-sm font-semibold" dir="rtl">
        <Link to="/Subscription" className="underline hover:no-underline">
          תקופת הניסיון הסתיימה — שדרג עכשיו לגישה מלאה
        </Link>
      </div>
    );
  }
  if (daysLeft <= 3) {
    return (
      <div className="bg-red-500 text-white py-2 px-4 text-center text-sm font-semibold flex items-center justify-center gap-2" dir="rtl">
        <Crown className="w-4 h-4" />
        <span>נותרו {daysLeft} ימים לתקופת הניסיון שלך —</span>
        <Link to="/Subscription" className="underline font-bold hover:no-underline">שדרג עכשיו</Link>
      </div>
    );
  }
  return (
    <div className="bg-amber-100 text-amber-900 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2" dir="rtl">
      <Crown className="w-4 h-4" />
      <span>נותרו {daysLeft} ימים לתקופת הניסיון שלך —</span>
      <Link to="/Subscription" className="text-amber-800 font-semibold underline hover:no-underline">שדרג עכשיו</Link>
    </div>
  );
}
