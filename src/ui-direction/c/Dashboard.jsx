/** Direction C: the home screen is the bento command center. */
import React from 'react';
import TodayBoard from '@/components/today/TodayBoard';

export default function DashboardView({ user, orgId }) {
  return <TodayBoard user={user} orgId={orgId} variant="c" />;
}
