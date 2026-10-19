/**
 * /onboarding: first run after signup (ProtectedRoute sends new orgs here) and "פתיחת ההגדרה" in Settings
 * (/onboarding?again=1). v3 B (20.10.2026): 3 screens (the place, bookings + calendar links, "זה נראה נכון?"),
 * then the building moment and the guided setup journey (/setup).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WizardB3 from '@/components/onboarding/v3/WizardB3';

export default function Onboarding() {
  const { user } = useAuth();
  const { search } = useLocation();
  const again = new URLSearchParams(search).get('again') === '1';
  return <WizardB3 user={user} again={again} />;
}
