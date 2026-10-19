/**
 * /onboarding: first run after signup (ProtectedRoute sends new orgs here) and "פתיחת ההגדרה" in Settings
 * (/onboarding?again=1). v2 (19.10.2026): only what's truly needed, with ranges and "משתנה" answers,
 * asked as a conversation (version B), a trial / plan choice, the building moment, then the guided setup journey (/setup).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import ChatB from '@/components/onboarding/v2/ChatB';

export default function Onboarding() {
  const { user } = useAuth();
  const { search } = useLocation();
  const again = new URLSearchParams(search).get('again') === '1';
  return <ChatB user={user} again={again} />;
}
