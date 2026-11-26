/**
 * v2 (04.11.2026): the assistant opens as one full screen, straight into a live voice conversation
 * (writing is one tap away). Lazy-loaded by Layout on first open; data follows the current screen.
 */
import React, { Suspense, lazy, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useAssistantFacts } from './useAssistant.js';
import { setAssistantOpen, useAssistantOpen } from './launcher.jsx';
import { needsAiConsent, setAiConsent } from '@/lib/aiConsent';

const AiConsentSheet = lazy(() => import('@/components/privacy/AiConsentSheet.jsx'));

const AssistantScreen = lazy(() => import('./screen/AssistantScreen.jsx'));

export default function AssistantPanel() {
  const { isOpen } = useAssistantOpen();
  const { user } = useAuth();
  const orgId = user?.organization_id ?? user?.org_id ?? null;
  const { pathname } = useLocation();
  const { facts } = useAssistantFacts(isOpen ? orgId : null);
  const [, bump] = useState(0);
  if (!isOpen) return null;
  // App Store 5.1.2(i): in the iOS app, nothing reaches OpenAI / ElevenLabs before the owner says yes once.
  if (needsAiConsent(user?.id)) {
    return (
      <Suspense fallback={null}>
        <AiConsentSheet
          onAccept={() => { setAiConsent(user?.id); bump((n) => n + 1); }}
          onDecline={() => setAssistantOpen(false)}
        />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={null}>
      <AssistantScreen facts={facts} page={pathname} onClose={() => setAssistantOpen(false)} onNavigate={() => setAssistantOpen(false)} />
    </Suspense>
  );
}
