/** Direction A: the home screen is the calm "היום" board. */
import React from 'react';
import TodayBoard from '@/components/today/TodayBoard';

export default function DashboardView({ user, orgId }) {
  return <TodayBoard user={user} orgId={orgId} variant="a" />;
}
