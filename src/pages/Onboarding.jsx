/**
 * /onboarding: the first-run setup every new organization goes through once after signup / first login
 * (ProtectedRoute sends them here until it is done), and "פתיחת ההגדרה" in Settings (/onboarding?again=1).
 * The flow itself lives in components/onboarding.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import OnboardingB from '@/components/onboarding/b/OnboardingB';

export default function Onboarding() {
  const { user } = useAuth();
  const { search } = useLocation();
  const again = new URLSearchParams(search).get('again') === '1';
  return <OnboardingB user={user} again={again} />;
}
