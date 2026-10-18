import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { trialBannerText } from '@/lib/trial';

/** One calm line about the trial. Indigo tint, never red or amber blocks (direction-v5). */
export default function TrialBanner() {
  const { daysLeft, isTrialing, isExpired, isLoading } = useSubscription();

  if (isLoading || (!isTrialing && !isExpired)) return null;
  const urgent = isExpired || daysLeft <= 3;
  const text = trialBannerText(daysLeft, isExpired);
  return (
    <div className="flex min-h-[44px] items-center justify-center gap-2 border-b border-[#E4E1FD] bg-[#F4F3FF] px-4 text-[14px] text-navy-900" dir="rtl" role="status">
      {urgent ? <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" /> : null}
      <span>{text}</span>
      <Link
        to={createPageUrl('Subscription')}
        className="inline-flex min-h-[44px] items-center gap-0.5 rounded-[8px] px-1 font-semibold text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        בחירת מסלול
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </Link>
    </div>
  );
}
