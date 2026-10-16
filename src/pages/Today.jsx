import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DashboardView } from '@/ui-direction';

/** /today and /dashboard are the same calm "היום" board, so links from PR #27 keep working. */
export default function TodayPage({ user, orgId }) {
  return (
    <ErrorBoundary section="today" variant="page" resetKey="today">
      <DashboardView user={user} orgId={orgId} />
    </ErrorBoundary>
  );
}
