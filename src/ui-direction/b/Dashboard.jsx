/** Direction B: same "היום" board, wider bento (equal thirds on top, a broad chart below). */
import React from 'react';
import TodayBoard from '@/components/today/TodayBoard';

export default function DashboardView({ user, orgId }) {
  return <TodayBoard user={user} orgId={orgId} variant="b" />;
}
