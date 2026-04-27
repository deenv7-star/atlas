import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { LiquidGlassCard } from '@/components/ui/LiquidGlass';

/** Booking table row (Bookings.jsx): checkbox w-8 + avatar w-9 + main + actions */
export function SkeletonBookingRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors',
        className,
      )}
    >
      <Skeleton width={32} height={32} borderRadius={8} className="flex-shrink-0" />
      <Skeleton width={36} height={36} borderRadius={9999} className="flex-shrink-0 shadow-sm" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Skeleton height={14} className="flex-1 max-w-[140px] sm:max-w-[200px]" borderRadius={6} />
          <Skeleton width={64} height={20} borderRadius={9999} className="flex-shrink-0" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Skeleton width={120} height={12} borderRadius={4} />
          <Skeleton width={48} height={12} borderRadius={4} />
          <Skeleton width={100} height={12} borderRadius={4} className="hidden sm:block max-w-[120px]" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <Skeleton width={56} height={16} borderRadius={4} />
        <div className="flex items-center gap-1">
          <Skeleton width={36} height={36} borderRadius={12} />
          <Skeleton width={36} height={36} borderRadius={12} />
          <Skeleton width={36} height={36} borderRadius={12} />
          <Skeleton width={36} height={36} borderRadius={12} className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
}

/** Select-all header row above booking list */
export function SkeletonBookingTableHeader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 border-b border-gray-50 bg-gray-50/50',
        className,
      )}
    >
      <Skeleton width={16} height={16} borderRadius={4} />
      <Skeleton width={140} height={12} borderRadius={4} />
    </div>
  );
}

export function SkeletonTableFull({ className }: { className?: string }) {
  return (
    <div className={cn('atlas-card-surface overflow-hidden', className)}>
      <SkeletonBookingTableHeader />
      <div className="divide-y divide-gray-50/80">
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonBookingRow key={i} />
        ))}
      </div>
    </div>
  );
}

/** Guest info block in BookingDetails.jsx — bg-gray-50 rounded-xl p-4 */
export function SkeletonGuestCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-gray-50 rounded-xl p-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton width={48} height={48} borderRadius={12} className="flex-shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton height={20} className="w-3/5 max-w-[200px]" borderRadius={6} />
          <Skeleton height={14} width={96} borderRadius={4} />
        </div>
      </div>
      <div className="space-y-2.5 pt-0.5">
        <div className="flex items-center gap-2">
          <Skeleton width={16} height={16} borderRadius={4} className="flex-shrink-0" />
          <Skeleton height={14} className="flex-1 max-w-[180px]" borderRadius={4} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={16} height={16} borderRadius={4} className="flex-shrink-0" />
          <Skeleton height={14} className="flex-1 max-w-[220px]" borderRadius={4} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={16} height={16} borderRadius={4} className="flex-shrink-0" />
          <Skeleton height={14} className="flex-1 max-w-[160px]" borderRadius={4} />
        </div>
      </div>
    </div>
  );
}

export type SkeletonCalendarProps = {
  totalDays?: number;
  viewMode?: 'week' | 'month';
  propertyRowCount?: number;
  className?: string;
};

/** MultiCalendar grid: 180px + N day columns, header + property rows */
export function SkeletonCalendar({
  totalDays = 14,
  viewMode = 'week',
  propertyRowCount = 4,
  className,
}: SkeletonCalendarProps) {
  const colW = viewMode === 'week' ? 'minmax(72px, 1fr)' : 'minmax(36px, 1fr)';
  const gridTemplate = `180px repeat(${totalDays}, ${colW})`;

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm', className)}>
      <div className="overflow-x-auto overflow-y-hidden scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="min-w-[900px]" style={{ display: 'grid', gridTemplateColumns: gridTemplate }}>
          <div className="sticky right-0 z-20 bg-gray-50 border-b border-l border-gray-200 px-3 py-2 flex items-center">
            <Skeleton width={32} height={10} borderRadius={4} />
          </div>
          {Array.from({ length: totalDays }, (_, i) => (
            <div
              key={i}
              className="border-b border-l border-gray-200 px-1 py-2 flex flex-col items-center justify-center gap-1"
            >
              <Skeleton width={18} height={8} borderRadius={2} />
              <Skeleton width={20} height={16} borderRadius={4} />
            </div>
          ))}

          {Array.from({ length: propertyRowCount }, (_, row) => (
            <React.Fragment key={row}>
              <div className="sticky right-0 z-10 bg-white border-b border-l border-gray-200 px-3 py-3 flex items-center gap-2.5">
                <Skeleton width={12} height={12} borderRadius={9999} className="flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton height={14} className="w-full max-w-[140px]" borderRadius={4} />
                  <Skeleton height={10} width={72} borderRadius={4} />
                </div>
              </div>
              <div
                className="border-b border-gray-200 relative"
                style={{
                  gridColumn: '2 / -1',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${totalDays}, ${colW})`,
                  minHeight: 56,
                }}
              >
                {Array.from({ length: totalDays }, (_, d) => (
                  <div key={d} className="border-l border-gray-100 flex items-center justify-center p-1">
                    <Skeleton className="w-full h-9 max-w-[96%]" borderRadius={8} />
                  </div>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

const TINT_MAP: Record<string, 'blue' | 'purple' | 'teal' | 'neutral'> = {
  'icon-blue': 'blue',
  'icon-purple': 'purple',
  'icon-teal': 'teal',
  'icon-amber': 'neutral',
  'icon-green': 'teal',
  'icon-rose': 'neutral',
};

export type SkeletonStatCardProps = {
  /** Matches Dashboard StatCard `iconClass` → LiquidGlass tint */
  iconClass?: string;
  className?: string;
};

export function SkeletonStatCard({ iconClass = 'icon-teal', className }: SkeletonStatCardProps) {
  const tint = TINT_MAP[iconClass] ?? 'neutral';
  return (
    <div className={cn('atlas-dash-stat-lift h-full rounded-2xl', className)}>
      <LiquidGlassCard tint={tint} size="sm" className="h-full">
        <div className="flex items-start justify-between mb-3">
          <Skeleton height={14} className="w-[52%] max-w-[120px]" borderRadius={6} />
          <Skeleton width={32} height={32} borderRadius={12} className="flex-shrink-0" />
        </div>
        <Skeleton height={36} className="w-[40%] max-w-[100px] mb-2" borderRadius={8} />
        <Skeleton height={12} className="w-[55%] max-w-[140px]" borderRadius={4} />
      </LiquidGlassCard>
    </div>
  );
}

/** Dashboard `BookingRow` — calendar tile + two lines + status pill */
export function SkeletonDashboardBookingRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl', className)}>
      <Skeleton width={40} height={40} borderRadius={12} className="flex-shrink-0 shadow-sm" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton height={14} className="max-w-[85%]" borderRadius={4} />
        <Skeleton height={12} width="55%" borderRadius={4} />
      </div>
      <Skeleton width={56} height={22} borderRadius={9999} className="flex-shrink-0" />
    </div>
  );
}

/** Dashboard `LeadRow` — circle avatar + two lines + pill */
export function SkeletonDashboardLeadRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl', className)}>
      <Skeleton width={36} height={36} borderRadius={9999} className="flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton height={14} className="max-w-[80%]" borderRadius={4} />
        <Skeleton height={12} width="50%" borderRadius={4} />
      </div>
      <Skeleton width={52} height={22} borderRadius={9999} className="flex-shrink-0" />
    </div>
  );
}

/** Booking detail sheet shell while single booking loads */
export function SkeletonBookingDetailSheet({ className }: { className?: string }) {
  return (
    <div className={cn('w-full sm:max-w-[600px] ms-auto bg-background min-h-[50vh] border-s shadow-lg', className)} dir="rtl">
      <div className="p-6 pb-4 border-b space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton height={22} width={160} borderRadius={6} />
          <Skeleton width={72} height={26} borderRadius={9999} />
        </div>
      </div>
      <div className="p-6 space-y-6">
        <SkeletonGuestCard />
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <Skeleton height={12} width={56} borderRadius={4} />
            <Skeleton height={16} className="w-full" borderRadius={4} />
            <Skeleton height={12} width={64} borderRadius={4} />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <Skeleton height={12} width={72} borderRadius={4} />
            <Skeleton height={24} width={88} borderRadius={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
