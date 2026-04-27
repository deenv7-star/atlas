import * as React from 'react';
import {
  SkeletonBookingRow,
  SkeletonGuestCard,
  SkeletonCalendar,
  SkeletonStatCard,
  SkeletonTableFull,
  SkeletonDashboardBookingRow,
  SkeletonDashboardLeadRow,
  SkeletonBookingDetailSheet,
} from '@/components/skeletons/atlas-skeletons';

/**
 * Dev-only gallery of ATLAS skeleton components.
 * Route is registered only when import.meta.env.DEV (see App.jsx).
 */
export default function DevSkeletons() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 pb-24" dir="rtl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Skeleton system</h1>
        <p className="text-sm text-gray-500">תצוגה מקדימה לפיתוח — לא מוצגת בפרודקשן.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">SkeletonStatCard</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SkeletonStatCard iconClass="icon-blue" />
          <SkeletonStatCard iconClass="icon-purple" />
          <SkeletonStatCard iconClass="icon-teal" />
          <SkeletonStatCard iconClass="icon-amber" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">SkeletonTableFull</h2>
        <SkeletonTableFull />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">SkeletonBookingRow</h2>
        <div className="atlas-card-surface overflow-hidden divide-y divide-gray-50/80">
          <SkeletonBookingRow />
          <SkeletonBookingRow />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">SkeletonGuestCard + פרטי הזמנה</h2>
        <div className="max-w-md border rounded-xl overflow-hidden bg-background shadow-sm">
          <SkeletonGuestCard className="m-4" />
        </div>
        <SkeletonBookingDetailSheet className="max-w-lg border rounded-xl overflow-hidden" />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">SkeletonCalendar (שבועיים)</h2>
        <SkeletonCalendar totalDays={14} viewMode="week" propertyRowCount={3} />
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide pt-4">SkeletonCalendar (חודש)</h2>
        <SkeletonCalendar totalDays={30} viewMode="month" propertyRowCount={2} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Dashboard list rows</h2>
        <div className="rounded-2xl border border-gray-100 p-3 space-y-2 bg-white/90">
          <SkeletonDashboardBookingRow />
          <SkeletonDashboardBookingRow />
          <SkeletonDashboardLeadRow />
        </div>
      </section>
    </div>
  );
}
