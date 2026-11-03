/**
 * /onboarding: first run after signup (ProtectedRoute sends new orgs here) and "פתיחת ההגדרה" in Settings
 * (/onboarding?again=1). Round Y2 (03.11.2026): "קולנוע", one question per screen over a full-bleed zimmer photo on a glass card
 * (their name written across the photo), the same real saves as v3 B, then a finish that lands on /today. v3 B stays in
 * components/onboarding/v3 (WizardB3) for rollback.
 */
import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import WizardY2 from '@/components/onboarding/y/WizardY2';

export default function Onboarding() {
  const { user } = useAuth();
  return <WizardY2 user={user} />;
}
