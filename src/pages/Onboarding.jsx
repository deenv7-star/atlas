/**
 * /onboarding: first run after signup (ProtectedRoute sends new orgs here) and "פתיחת ההגדרה" in Settings
 * (/onboarding?again=1). Version B: one question at a time (components/onboarding/flow).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import OnboardingFlow from '@/components/onboarding/flow/OnboardingFlow';

export default function Onboarding() {
  const { user } = useAuth();
  const { search } = useLocation();
  const again = new URLSearchParams(search).get('again') === '1';
  return <OnboardingFlow user={user} again={again} />;
}
