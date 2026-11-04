/**
 * v2 (04.11.2026): the assistant opens as one full screen, straight into a live voice conversation
 * (writing is one tap away). Lazy-loaded by Layout on first open; data follows the current screen.
 */
import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useAssistantFacts } from './useAssistant.js';
import { setAssistantOpen, useAssistantOpen } from './launcher.jsx';

const AssistantScreen = lazy(() => import('./screen/AssistantScreen.jsx'));

export default function AssistantPanel() {
  const { isOpen } = useAssistantOpen();
  const { user } = useAuth();
  const orgId = user?.organization_id ?? user?.org_id ?? null;
  const { pathname } = useLocation();
  const { facts } = useAssistantFacts(isOpen ? orgId : null);
  if (!isOpen) return null;
  return (
    <Suspense fallback={null}>
      <AssistantScreen facts={facts} page={pathname} onClose={() => setAssistantOpen(false)} onNavigate={() => setAssistantOpen(false)} />
    </Suspense>
  );
}
