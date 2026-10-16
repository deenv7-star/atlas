import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DashboardView } from '@/ui-direction';

/** "היום": the calm home screen. The layout direction decides how it reads. */
export default function Dashboard({ user, orgId, selectedPropertyId }) {
  return (
    <ErrorBoundary section="dashboard" variant="page" resetKey={selectedPropertyId ?? 'all'}>
      <DashboardView user={user} orgId={orgId} />
    </ErrorBoundary>
  );
}
