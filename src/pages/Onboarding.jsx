/**
 * /onboarding: first run after signup (ProtectedRoute sends new orgs here) and "פתיחת ההגדרה" in Settings
 * (/onboarding?again=1). v3 A (19.10.2026): Apple-style setup assistant, 5 questions + review, live preview,
 * then the building moment and the guided setup journey (/setup).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WizardA3 from '@/components/onboarding/v3/WizardA3';

export default function Onboarding() {
  const { user } = useAuth();
  const { search } = useLocation();
  const again = new URLSearchParams(search).get('again') === '1';
  return <WizardA3 user={user} again={again} />;
}
