import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DashboardView } from '@/ui-direction';
import { useDashboardData } from '@/pages/dashboard/useDashboardData';

/** "Today": data lives in useDashboardData; the layout direction decides how it reads. */
export default function Dashboard({ user, selectedPropertyId }) {
  const data = useDashboardData({ user, selectedPropertyId });
  return (
    <ErrorBoundary section="dashboard" variant="page" resetKey={selectedPropertyId ?? 'all'}>
      <DashboardView data={data} />
    </ErrorBoundary>
  );
}
