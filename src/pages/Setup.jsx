/**
 * /setup: the guided setup journey after onboarding (calendars, WhatsApp, units, plan).
 * Full screen on purpose (no app chrome): one thing at a time for owners who are not technical.
 * The "המשך הגדרה" card on /today links here until every step is done or skipped.
 */
import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import SetupJourney from '@/components/onboarding/v2/setup/SetupJourney';
import { ONBOARDING_VARIANT } from '@/lib/onboarding/v2/variant';

export default function Setup() {
  const { user } = useAuth();
  return <SetupJourney user={user} variant={ONBOARDING_VARIANT} />;
}
