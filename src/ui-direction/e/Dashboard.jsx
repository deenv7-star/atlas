/** Direction E: the home screen is a timeline of the day (arrivals, cleaning, departures) with guest faces. */
import React from 'react';
import TodayTimeline from '@/components/today/TodayTimeline';

export default function DashboardView({ user, orgId }) {
  return <TodayTimeline user={user} orgId={orgId} />;
}
