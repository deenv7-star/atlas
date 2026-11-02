/** Direction C home: "היום" is live window B (Deen's pick, 02.11.2026). */
import React from 'react';
import LiveWindowB from '@/components/today/LiveWindowB';

export default function DashboardView({ user, orgId }) {
  return <LiveWindowB user={user} orgId={orgId} />;
}
