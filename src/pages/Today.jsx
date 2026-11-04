import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DashboardView } from '@/ui-direction';
import TodayImportNudge from '@/components/import/TodayImportNudge';

/** /today and /dashboard are the same calm "היום" board, so links from PR #27 keep working. */
export default function TodayPage({ user, orgId }) {
  return (
    <ErrorBoundary section="today" variant="page" resetKey="today">
      <TodayImportNudge orgId={orgId} />
      <DashboardView user={user} orgId={orgId} />
    </ErrorBoundary>
  );
}
