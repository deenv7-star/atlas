/**
 * /onboarding: first run after signup (ProtectedRoute sends new orgs here) and "פתיחת ההגדרה" in Settings
 * (/onboarding?again=1). Version A: four short steps with a live result (components/onboarding/steps).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import OnboardingSteps from '@/components/onboarding/steps/OnboardingSteps';

export default function Onboarding() {
  const { user } = useAuth();
  const { search } = useLocation();
  const again = new URLSearchParams(search).get('again') === '1';
  return <OnboardingSteps user={user} again={again} />;
}
