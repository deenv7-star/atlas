/**
 * /onboarding: first run after signup (ProtectedRoute sends new orgs here) and "פתיחת ההגדרה" in Settings
 * (/onboarding?again=1). Round Y1 (03.11.2026): "המערכת נבנית מולכם", 6 short questions with the owner's Y3 Today
 * assembling live beside them, the same real saves as v3 B, then a finish that lands on /today. v3 B stays in
 * components/onboarding/v3 (WizardB3) for rollback.
 */
import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import WizardY1 from '@/components/onboarding/y/WizardY1';

export default function Onboarding() {
  const { user } = useAuth();
  return <WizardY1 user={user} />;
}
