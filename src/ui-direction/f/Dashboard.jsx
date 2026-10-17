/** Direction F: soft layered glass. Day strip, indigo occupancy ring, property photo tile, sparkline cards. */
import React from 'react';
import TodayLayered from '@/components/today/TodayLayered';

export default function DashboardView({ user, orgId }) {
  return <TodayLayered user={user} orgId={orgId} />;
}
